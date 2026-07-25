"use client";

import { useState } from "react";
import { Showcase } from "./showcase.js";

const DIRECTIONS = [
  { id: "paper", name: "A. Paper and Ink", note: "Editorial. Serif claims, warm off-white, deep teal." },
  { id: "studio", name: "B. Studio Neutral", note: "A real tool. Humanist sans, tactile 2px lines, ochre." },
  { id: "observatory", name: "C. Observatory", note: "Instrument at night. Content is the only thing that glows." },
] as const;

export default function Page(): JSX.Element {
  const [mood, setMood] = useState<"adult" | "child">("adult");
  const [side, setSide] = useState<"console" | "studio">("console");
  const [compact, setCompact] = useState(false);

  return (
    <>
      <div className="lab__bar">
        <h1>PassionLab Design Lab</h1>

        <div className="lab__toggle">
          <span>Surface</span>
          <button aria-pressed={side === "console"} onClick={() => setSide("console")}>
            Guide console
          </button>
          <button aria-pressed={side === "studio"} onClick={() => setSide("studio")}>
            Project studio
          </button>
        </div>

        <div className="lab__toggle">
          <span>Mode</span>
          <button aria-pressed={mood === "adult"} onClick={() => setMood("adult")}>
            Adult
          </button>
          <button aria-pressed={mood === "child"} onClick={() => setMood("child")}>
            Child
          </button>
        </div>

        <div className="lab__toggle">
          <span>Density</span>
          <button aria-pressed={!compact} onClick={() => setCompact(false)}>
            Comfortable
          </button>
          <button aria-pressed={compact} onClick={() => setCompact(true)}>
            Compact
          </button>
        </div>
      </div>

      <div className="lab__grid">
        {DIRECTIONS.map((d) => (
          <div className="lab__col" key={d.id}>
            <div className="lab__label">
              {d.name}
              <span>{d.note}</span>
            </div>
            <div
              data-direction={d.id}
              data-mood={mood}
              data-density={compact ? "compact" : "comfortable"}
            >
              <Showcase side={side} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
