"use client";
import { useEffect, useState } from "react";
import { DEFAULT_THEME, THEME_EVENT, readActiveTheme } from "./theme.js";

/**
 * The live active-theme id. Initialises to the default (matching the server paint) and syncs to the
 * real applied theme after mount, then tracks every applyTheme via the THEME_EVENT. Consumers key
 * theme-sensitive-but-CSS-blind subtrees (the 3D cosmos) on this so they re-read the computed
 * variables when the theme changes; pure CSS chrome updates on its own via the cascade.
 */
export function useActiveTheme(): string {
  const [theme, setTheme] = useState<string>(DEFAULT_THEME);

  useEffect(() => {
    setTheme(readActiveTheme());
    const onChange = (): void => setTheme(readActiveTheme());
    document.addEventListener(THEME_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      document.removeEventListener(THEME_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return theme;
}
