"use client";
import { type JSX, useEffect, useRef, useState } from "react";
import { THEME_GROUPS, applyTheme, readActiveTheme } from "./theme.js";

/**
 * Theme switcher — a topbar button that opens a popover of swatch presets, grouped by family. Ported
 * from project-studio: selecting a preset calls applyTheme (which sets data-theme on <html>, persists
 * to localStorage, and broadcasts the change). Closes on outside-click or Escape.
 */
export function ThemeSwitcher(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("observatory-graphite");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(readActiveTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(id: string): void {
    applyTheme(id);
    setActive(id);
    setOpen(false);
  }

  return (
    <div className="themeswitch" ref={rootRef}>
      <button
        type="button"
        className="themebtn"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="themebtn__dot" aria-hidden="true" />
        Theme
      </button>
      {open ? (
        /* biome-ignore lint/a11y/useSemanticElements: this popover is conditionally rendered, never
           opened via showModal(), so a native <dialog> without [open] would be display:none. */
        <div className="themepop" role="dialog" aria-label="Choose a theme">
          {THEME_GROUPS.map((group) => (
            <div className="themepop__group" key={group.family}>
              <div className="themepop__label">
                {group.label} · <span className="themepop__blurb">{group.blurb}</span>
              </div>
              <div className="themepop__row">
                {group.presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`swatch${preset.id === active ? " swatch--on" : ""}`}
                    aria-pressed={preset.id === active}
                    onClick={() => pick(preset.id)}
                  >
                    <span className="swatch__chips" aria-hidden="true">
                      {preset.chips.map((c, i) => (
                        /* biome-ignore lint/suspicious/noArrayIndexKey: `chips` is a fixed
                           three-colour tuple that never reorders, and a colour can repeat between
                           slots, so the position is the only stable identity. */
                        <span className="swatch__chip" key={i} style={{ background: c }} />
                      ))}
                    </span>
                    <span className="swatch__name">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
