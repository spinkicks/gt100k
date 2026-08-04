"use client";

/**
 * The theme picker for the studio.
 *
 * The registry in `theme.ts` and every style below it in `globals.css` survived a refactor that
 * dropped the component reading them, so eight themes existed with no way to reach them. This is
 * that control, rebuilt against the styles already there.
 *
 * WHY A CHILD GETS THIS AT ALL. It is the one preference in the app, and it is deliberately about
 * how the place looks rather than about the work. Nothing here touches what is logged or measured,
 * so a child can make the studio theirs without any of it becoming a signal.
 */
import { useEffect, useRef, useState, type JSX } from "react";

import { DEFAULT_THEME, THEME_GROUPS, applyTheme, readActiveTheme } from "./theme.js";

export function ThemeSwitcher(): JSX.Element {
  const [open, setOpen] = useState(false);
  // Server-rendered markup has to match the default, so the saved theme is read after mount.
  const [active, setActive] = useState<string>(DEFAULT_THEME);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(readActiveTheme());
  }, []);

  // Close on an outside click or Escape. A picker that traps a child is worse than no picker.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
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
  }

  return (
    <div ref={box}>
      <button
        type="button"
        className="themebtn"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="themebtn__dot" aria-hidden="true" />
        Theme
      </button>

      {/* A radiogroup, not a dialog: these are mutually exclusive choices, exactly one of which is
          always in force. That also earns a screen reader "3 of 8" for free, which eight
          independent `aria-pressed` toggles would not. */}
      {open ? (
        <div className="themepop" role="radiogroup" aria-label="Pick a look">
          {THEME_GROUPS.map((g) => (
            <div key={g.family} className="themepop__group">
              <p className="themepop__label">
                {g.label} · {g.blurb}
              </p>
              <div className="themepop__row">
                {g.presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    // biome-ignore lint/a11y/useSemanticElements: an <input type="radio"> cannot
                    // contain the three colour chips and the name, and restyling a native radio
                    // into a swatch card means hiding the input and faking focus, which is worse
                    // for a keyboard user than a button carrying the role honestly.
                    role="radio"
                    className={`swatch${p.id === active ? " swatch--on" : ""}`}
                    aria-checked={p.id === active}
                    onClick={() => pick(p.id)}
                  >
                    <span className="swatch__chips" aria-hidden="true">
                      {p.chips.map((c) => (
                        <span key={c} className="swatch__chip" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="swatch__name">{p.name}</span>
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
