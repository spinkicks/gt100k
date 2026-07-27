import type { JSX } from "react";

import { findSurface, resolveHomeUrl, resolveSurfaces, type Surface } from "./surfaces.js";

/**
 * The one piece of chrome every adult surface shares: who we are, where you are, and one click to
 * anywhere else that is actually reachable. Plain anchors, so it works with JavaScript off; a
 * surface whose URL resolved to null is simply absent, never a dead link.
 */
export interface ProductHeaderProps {
  /** Surface id of the app rendering this. An id that is in no registry marks nothing current. */
  readonly current: string;
  /** The name to show when `current` names no registered surface (the front door itself). */
  readonly currentLabel?: string;
  readonly surfaces?: readonly Surface[];
  /**
   * Off for the front door, whose whole body is the switcher. Offering the same three
   * destinations twice on one screen makes the page look busier without making it faster.
   */
  readonly showSwitcher?: boolean;
  /**
   * Where the front door lives. Defaults to the registry's answer for this environment; pass null
   * to force a plain wordmark. The front door never links to itself.
   */
  readonly homeUrl?: string | null;
}

export function ProductHeader({
  current,
  currentLabel,
  surfaces,
  showSwitcher = true,
  homeUrl,
}: ProductHeaderProps): JSX.Element {
  const all = surfaces ?? resolveSurfaces();
  const label = currentLabel ?? findSurface(all, current)?.label;
  const elsewhere = showSwitcher
    ? all.filter((s): s is Surface & { url: string } => s.id !== current && s.url !== null)
    : [];

  const home = homeUrl === undefined ? resolveHomeUrl() : homeUrl;
  const wordmark = (
    <>
      <span className="plh__mark" aria-hidden="true">
        P
      </span>
      <span className="plh__product">PassionLab</span>
    </>
  );

  return (
    <header className="plh">
      {home === null || current === "home" ? (
        wordmark
      ) : (
        <a className="plh__home" href={home}>
          {wordmark}
        </a>
      )}
      {label === undefined ? null : (
        <>
          <span className="plh__sep" aria-hidden="true">
            /
          </span>
          <span className="plh__here" aria-current="page">
            {label}
          </span>
        </>
      )}
      {elsewhere.length === 0 ? null : (
        <nav className="plh__nav" aria-label="Other surfaces">
          {elsewhere.map((s) => (
            <a key={s.id} className="plh__link" href={s.url} title={s.blurb}>
              {s.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
