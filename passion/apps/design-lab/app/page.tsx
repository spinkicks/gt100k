"use client";

import { useState } from "react";
import { Console } from "./console.js";

const THEMES = [
  { id: "midnight", name: "1. Midnight", note: "The current console, tightened" },
  { id: "daylight", name: "2. Daylight", note: "Same restraint, light scheme" },
  { id: "warm-slate", name: "3. Warm Slate", note: "Dark but warm, amber accent" },
  { id: "editorial", name: "4. Editorial", note: "Warm paper, serif claims" },
  { id: "blueprint", name: "5. Blueprint", note: "Cool, technical, precise" },
] as const;

export default function Page(): JSX.Element {
  const [theme, setTheme] = useState<string>("midnight");

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
