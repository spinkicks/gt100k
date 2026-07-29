/**
 * Standalone review harness for Ratio Mixing, so the bench can be played before the registry wires
 * it into a cabin. Not part of the app bundle — `vite build`'s only entry is index.html, so
 * nothing here ships (there is a test in RatioMixing.test.tsx that would not catch that, but
 * `dist/` is checked by hand: no chunk references this file). Served in dev at
 *
 *     http://localhost:5178/src/puzzles/RatioMixing/harness.html
 *
 * The seed box exists for the one question a unit test cannot answer: across a run of real orders,
 * does the bench read as a maths problem you plan, or as knobs you twiddle?
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import RatioMixing from "./RatioMixing";
import "../../theme.css";

function Harness() {
  const [seed, setSeed] = useState(1);
  const [solves, setSolves] = useState(0);

  return (
    <div className="harness">
      <div className="bar">
        <label htmlFor="seed">seed</label>
        <input
          id="seed"
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
        />
        <button type="button" onClick={() => setSeed((s) => s + 1)}>
          next seed
        </button>
        <span>solved: {solves}</span>
      </div>
      <RatioMixing
        key={seed}
        seed={seed}
        onSolved={() => setSolves((n) => n + 1)}
        onExit={() => setSeed((s) => s + 1)}
      />
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <StrictMode>
      <Harness />
    </StrictMode>,
  );
}
