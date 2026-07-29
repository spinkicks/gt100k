import { useEffect, useState } from "react";

/** The one query that decides whether anything in this folder is allowed to move. */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `true` when the user has asked the OS for reduced motion.
 *
 * Two environment notes, both load-bearing:
 *
 * 1. jsdom does not implement `matchMedia` at all, so `window.matchMedia` is `undefined` in every
 *    vitest run. Any test that renders a component reaching this hook without a stub would throw,
 *    so the guard below is not defensive padding — it is the difference between "the app renders
 *    headless" and "it does not". The default when the query cannot be asked is *motion allowed*,
 *    matching the browser default rather than silently shipping a dead room to CI screenshots.
 * 2. The preference is subscribed to, not read once. A user toggling "reduce motion" in System
 *    Settings while the cabin is open must get a still room without a reload, and the reverse.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => queryReducedMotion());

  useEffect(() => {
    const mql = mediaQueryList();
    if (!mql) return;
    // re-read on mount: the preference can have changed between the initial state and this effect
    setReduced(mql.matches);
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);
    // addListener is the Safari < 14 spelling; still cheaper to keep than to explain a dead room
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, []);

  return reduced;
}

function mediaQueryList(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia(REDUCED_MOTION_QUERY);
}

/** Non-hook read, for the frozen-frame paths and for tests. */
export function queryReducedMotion(): boolean {
  return mediaQueryList()?.matches ?? false;
}
