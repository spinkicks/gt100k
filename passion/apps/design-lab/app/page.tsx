"use client";

import { useState } from "react";
import { Console } from "./console.js";

const THEMES = [
  { id: "horizon", name: "Horizon", note: "Violet, rounded, lifted cards" },
  { id: "mui", name: "MUI", note: "Blue, crisper, hairline borders" },
] as const;

export default function Page(): JSX.Element {
  const [theme, setTheme] = useState<string>("horizon");

  return (
    <>
      <div className="switch">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={theme === t.id}
            onClick={() => setTheme(t.id)}
          >
            {t.name}
            <span>{t.note}</span>
          </button>
        ))}
      </div>
      <div data-theme={theme} className="stage">
        <Console />
      </div>
    </>
  );
}
