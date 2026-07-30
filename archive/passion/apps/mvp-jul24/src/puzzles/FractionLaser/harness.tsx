/**
 * Standalone review harness for Fraction Laser. Not part of the app bundle —
 * `vite build`'s only entry is index.html, so nothing here ships; it is served
 * in dev at
 *
 *     http://localhost:5178/src/puzzles/FractionLaser/harness.html
 *
 * It exists because the puzzle is not wired into any cabin yet, and because
 * the questions that matter here are ones a jsdom test cannot answer: do the
 * stacked fractions stay legible at 64px, does a beam that has been split
 * three times still read as light rather than as a hairline, and do the
 * numbers on the beams collide with the tiles they run between.
 *
 * The seed and rung controls are the whole point — the generator is endless,
 * so the only honest way to review it is to page through it.
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../theme.css";
import FractionLaser from "./FractionLaser";
import { MAX_DIFFICULTY } from "./generate";

const RUNGS = Array.from({ length: MAX_DIFFICULTY + 1 }, (_unused, i) => i);

function Harness() {
  const [seed, setSeed] = useState(0);
  const [rung, setRung] = useState(0);

  return (
    <div className="wrap">
      <div className="bar">
        <span className="label">seed</span>
        <button type="button" onClick={() => setSeed((s) => Math.max(0, s - 1))}>
          −
        </button>
        <strong>{seed}</strong>
        <button type="button" onClick={() => setSeed((s) => s + 1)}>
          +
        </button>
        <span className="label">opening rung</span>
        {RUNGS.map((i) => (
          <button
            key={`rung-${i}`}
            type="button"
            aria-pressed={rung === i}
            onClick={() => setRung(i)}
          >
            {i}
          </button>
        ))}
      </div>
      {/* Remounting on every change gives a clean board rather than a
          half-reset one, which is what a player sees on first open. */}
      <FractionLaser
        key={`${seed}:${rung}`}
        seed={seed}
        initialRound={rung}
        onSolved={() => console.info("solved")}
        onExit={() => console.info("exit")}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
