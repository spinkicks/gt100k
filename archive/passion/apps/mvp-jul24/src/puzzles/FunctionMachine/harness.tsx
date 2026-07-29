/**
 * Standalone review harness for Function Machine. Not part of the app bundle —
 * `vite build`'s only entry is index.html, so nothing here ships; it is served
 * in dev at
 *
 *     http://localhost:5178/src/puzzles/FunctionMachine/harness.html
 *
 * It exists because the puzzle is not wired into any cabin yet, and because
 * the thing worth checking is whether the pad reads as a table you can spot a
 * pattern in — twelve tiles, in order, outputs lining up underneath. That is a
 * layout question, and no unit test has an opinion on it.
 *
 * The peek button is a review affordance and stays here: it prints the hidden
 * rule to the console so a reviewer can tell "the pad is unreadable" apart
 * from "I cannot do this one".
 */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../theme.css";
import FunctionMachine from "./FunctionMachine";
import { MAX_DIFFICULTY, generateMachine } from "./generate";
import { describeRule, outputsOver } from "./logic";

const RUNGS = Array.from({ length: MAX_DIFFICULTY + 1 }, (_unused, i) => i);

function Harness() {
  const [seed, setSeed] = useState(0);
  const [rung, setRung] = useState(0);

  const peek = () => {
    const machine = generateMachine(seed + rung, rung);
    console.info(describeRule(machine.rule), outputsOver(machine.rule).join(" "));
  };

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
        <button type="button" onClick={peek}>
          peek → console
        </button>
      </div>
      <FunctionMachine
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
