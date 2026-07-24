"use client";

// Theme switcher: a button in the topbar that opens a popover of the nine presets. Applying a theme
// sets [data-theme] on <html> and persists it. The popover is position:fixed so it escapes any
// overflow/stacking context, closes on outside click or Escape, and reflects the active preset.
import { useEffect, useRef, useState, type JSX } from "react";
import { THEME_GROUPS, applyTheme, readActiveTheme } from "./theme.js";

export function ThemeSwitcher(): JSX.Element {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("cartoon-sun");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(readActiveTheme());
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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
    setOpen(false);
  }

  return (
    <div ref={rootRef}>
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
        <div className="themepop" role="dialog" aria-label="Choose a theme">
          {THEME_GROUPS.map((group) => (
            <div className="themepop__group" key={group.family}>
              <div className="themepop__label">
                {group.label} · {group.blurb}
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
                        <span
                          className="swatch__chip"
                          key={i}
                          style={{ background: c }}
                        />
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
