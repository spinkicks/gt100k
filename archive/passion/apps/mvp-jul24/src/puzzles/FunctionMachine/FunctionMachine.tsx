import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { MAX_DIFFICULTY, type Machine, generateMachine } from "./generate";
import { applyRule, describeRule } from "./logic";
import "./FunctionMachine.css";

interface Feedback {
  kind: "wrong" | "right";
  input: number;
  output: number;
}

interface FunctionMachineProps extends PuzzleProps {
  /**
   * Which round — and so which difficulty rung — to open on. Always 0 in the
   * game; a seam for the review harness and for tests, which would otherwise
   * have to solve two machines to reach a modular rule.
   */
  initialRound?: number;
}

export default function FunctionMachine({
  seed,
  onSolved,
  onExit,
  initialRound = 0,
}: FunctionMachineProps) {
  // `round` advances on "New machine" and takes the difficulty rung with it,
  // holding at the top. The first machine anyone meets is a straight line,
  // which is where you learn what the pad and the prediction box are for.
  const [round, setRound] = useState(initialRound);
  const difficulty = Math.min(MAX_DIFFICULTY, round);
  const machine = useMemo(
    () => generateMachine(seed + round, difficulty),
    [seed, round, difficulty],
  );

  // Everything a player accumulates belongs to one machine and means nothing
  // for the next, so the round is keyed and React discards it wholesale. That
  // is why there is no "reset on new machine" effect below to forget a field
  // in: there is no state here to reset.
  return (
    <MachineRound
      key={`${seed}:${round}`}
      machine={machine}
      onSolved={onSolved}
      onExit={onExit}
      onNext={() => setRound((r) => r + 1)}
    />
  );
}

interface MachineRoundProps {
  machine: Machine;
  onSolved: () => void;
  onExit: () => void;
  onNext: () => void;
}

function MachineRound({ machine, onSolved, onExit, onNext }: MachineRoundProps) {
  /** Inputs the player spent an allowance on. */
  const [probes, setProbes] = useState<number[]>([]);
  /** Inputs the machine handed over after a prediction missed. */
  const [revealed, setRevealed] = useState<number[]>([]);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const solvedRef = useRef(false);

  const observed = useMemo(() => new Set([...probes, ...revealed]), [probes, revealed]);
  const solved = feedback?.kind === "right";

  // The input the machine will not run. It is the first one it planned to
  // withhold that the player has not seen by some other route, so it is
  // always genuinely unknown to them.
  const heldOut = machine.heldOutOrder.find((x) => !observed.has(x));
  const probesLeft = Math.max(0, machine.probeBudget - probes.length);
  // Only reachable after several missed predictions on a nearly-complete pad:
  // there is nothing left to ask about, so the machine bows out. Not a loss —
  // there is no loss here — just the end of what this machine can show.
  const retired = heldOut === undefined && !solved;

  useEffect(() => {
    if (!solvedRef.current && solved) {
      solvedRef.current = true;
      onSolved();
    }
  }, [solved, onSolved]);

  const run = (x: number) => {
    if (probesLeft === 0 || observed.has(x) || x === heldOut) return;
    setProbes((prev) => [...prev, x]);
    setFeedback(null);
  };

  const predict = (event: FormEvent) => {
    event.preventDefault();
    if (heldOut === undefined) return;
    const value = Number.parseInt(guess, 10);
    if (Number.isNaN(value)) return;

    const truth = applyRule(machine.rule, heldOut);
    setGuess("");
    if (value === truth) {
      setFeedback({ kind: "right", input: heldOut, output: truth });
      return;
    }
    // A miss is not a loss: the machine simply stops withholding this one, so
    // the guess buys a real observation and the next question is easier than
    // the last. Nothing is deducted and nothing ends.
    setRevealed((prev) => [...prev, heldOut]);
    setFeedback({ kind: "wrong", input: heldOut, output: truth });
  };

  const lastRun = probes.at(-1);
  const windowText =
    feedback !== null
      ? `${feedback.input} → ${feedback.output}`
      : lastRun !== undefined
        ? `${lastRun} → ${applyRule(machine.rule, lastRun)}`
        : "? → ?";

  return (
    <div className="fm">
      <button type="button" className="fm-exit" onClick={onExit}>
        ← Back
      </button>

      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. The
          panel reuses `.fm-status`'s opening sentence verbatim, and adds only the fact a child cannot
          infer from the screen: that a missed prediction is free. */}
      <TeachIn activity="function-machine" />

      <div className={`fm-machine${solved ? " fm-machine-open" : ""}`}>
        <span className="fm-port fm-port-in">in</span>
        <div className="fm-window" aria-hidden="true">
          {windowText}
        </div>
        <svg className="fm-gears" viewBox="0 0 120 40" aria-hidden="true">
          <title>Machine gears</title>
          <circle className="fm-gear" cx="34" cy="20" r="13" />
          <circle className="fm-gear fm-gear-small" cx="62" cy="24" r="9" />
          <circle className="fm-gear" cx="88" cy="18" r="11" />
        </svg>
        <span className="fm-port fm-port-out">out</span>
      </div>

      <p className="fm-allowance">
        {probesLeft > 0
          ? `The machine will run ${probesLeft} more ${probesLeft === 1 ? "input" : "inputs"}.`
          : "The machine is resting — but it will still tell you if a prediction is right."}
      </p>

      <div className="fm-pad">
        {machine.domain.map((x) => {
          const isHeldOut = x === heldOut;
          const known = observed.has(x);
          const label = `input ${x}`;

          if (isHeldOut) {
            return (
              <div
                key={x}
                className="fm-tile fm-tile-held"
                data-testid={`tile-${x}`}
                aria-label={`${label}: the machine will not run this one — predict what comes out`}
              >
                <span className="fm-in">{x}</span>
                <span className="fm-out">?</span>
              </div>
            );
          }

          if (known) {
            const out = applyRule(machine.rule, x);
            const fromGuess = revealed.includes(x);
            return (
              <div
                key={x}
                className={`fm-tile fm-tile-known${fromGuess ? " fm-tile-revealed" : ""}`}
                data-testid={`tile-${x}`}
                aria-label={`${label} came out as ${out}`}
              >
                <span className="fm-in">{x}</span>
                <span className="fm-out">{out}</span>
              </div>
            );
          }

          if (probesLeft === 0) {
            return (
              <div
                key={x}
                className="fm-tile fm-tile-spent"
                data-testid={`tile-${x}`}
                aria-label={`${label}: not run, and the machine is resting`}
              >
                <span className="fm-in">{x}</span>
                <span className="fm-out">·</span>
              </div>
            );
          }

          return (
            <button
              key={x}
              type="button"
              className="fm-tile fm-tile-open"
              data-testid={`tile-${x}`}
              aria-label={`run ${x} through the machine`}
              onClick={() => run(x)}
            >
              <span className="fm-in">{x}</span>
              <span className="fm-out">·</span>
            </button>
          );
        })}
      </div>

      {heldOut !== undefined && !solved && (
        <form className="fm-predict" onSubmit={predict}>
          <label className="fm-predict-label" htmlFor="fm-guess">
            The machine refuses <strong>{heldOut}</strong>. What comes out?
          </label>
          <input
            id="fm-guess"
            className="fm-guess"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            value={guess}
            onChange={(event) => setGuess(event.target.value)}
          />
          <button type="submit" className="fm-submit">
            Predict
          </button>
        </form>
      )}

      <output className="fm-status">
        {feedback === null &&
          "Run inputs through the machine, work out what it does to them, then predict the one it refuses."}
        {feedback?.kind === "wrong" &&
          `Not that one — ${feedback.input} comes out as ${feedback.output}. That is one more clue than you had; the machine has picked a different input to hold back.`}
        {feedback?.kind === "right" &&
          `Right: ${feedback.input} comes out as ${feedback.output}. The machine's rule was to ${describeRule(machine.rule)}.`}
        {retired && " This machine has shown you everything it can."}
      </output>

      {(solved || retired) && (
        <button type="button" className="fm-next" onClick={onNext}>
          New machine →
        </button>
      )}
    </div>
  );
}
