/**
 * Balance Scale — isolate the bag by doing the same thing to both pans.
 *
 * No score, no timer, no fail state (PROJECT.md D7). Running out of moves resets the scale to its
 * opening position and says so plainly; the reset is never counted and never punished, the same way
 * RatioMixing's "Pour it out" works.
 *
 * WHY THE BEAM NEVER TILTS, and why that is the point. An earlier version of this component rotated
 * the beam from the weight difference as "honest feedback". That was incoherent: every legal move
 * applies the same change to both pans, so equality is preserved by construction and the difference
 * is *always zero*. A tilt indicator here could only ever show level, so it was dead code dressed up
 * as a feature.
 *
 * The level beam is instead stated as the rule it actually is — both pans always weigh the same,
 * which is exactly why these moves are the legal ones. That invariant is the thing being taught, so
 * showing it beats animating a quantity that cannot change. `tilt()` stays in logic.ts because the
 * tests use it to assert the invariant really holds.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import "./BalanceScale.css";
import { type Level, TIERS, generateLevel } from "./generate";
import {
  DENOMS,
  type Denom,
  type Move,
  type Pan,
  type Scale,
  applyMove,
  isSolved,
  legalMoves,
  moveLabel,
  stoneCount,
  stoneTotal,
} from "./logic";

/** Alternates easy/hard by round, the same ramp Pipes uses. */
function tierFor(round: number): number {
  return round % 2 === 0 ? 0 : Math.min(1, TIERS.length - 1);
}

function PanView({ pan, side }: { pan: Pan; side: "left" | "right" }): JSX.Element {
  const stones: Denom[] = [];
  for (const d of DENOMS) {
    for (let i = 0; i < stoneCount(pan, d); i++) stones.push(d);
  }
  return (
    <div className={`bs-pan bs-pan-${side}`}>
      <div className="bs-pan-contents">
        {/*
         * Index keys are correct here, unusually. Bags are *defined* to be indistinguishable — that
         * is the entire premise of the puzzle — and stones of a denomination are interchangeable too.
         * Neither carries state, identity or animation, so there is nothing for a stable key to
         * preserve: the only thing that ever changes is how many of each there are.
         */}
        {Array.from({ length: pan.bags }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: bags are identical by definition
          <span key={`bag-${i}`} className="bs-bag" aria-hidden="true" />
        ))}
        {stones.map((d, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stones of a denomination are interchangeable
          <span key={`stone-${d}-${i}`} className={`bs-stone bs-stone-${d}`}>
            {d}
          </span>
        ))}
      </div>
      <span className="bs-pan-readout">
        {pan.bags > 0 ? `${pan.bags} bag${pan.bags === 1 ? "" : "s"}` : "no bags"}
        {stoneTotal(pan) > 0 ? ` + ${stoneTotal(pan)}` : ""}
      </span>
    </div>
  );
}

export const BalanceScale: React.FC<PuzzleProps & { initialRound?: number }> = ({
  seed,
  onSolved,
  onExit,
  initialRound = 0,
}) => {
  const [round, setRound] = useState(initialRound);
  const [level, setLevel] = useState<Level>(() =>
    generateLevel(seed + initialRound, tierFor(initialRound)),
  );
  const [scale, setScale] = useState<Scale>(level.scale);
  const [used, setUsed] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const solvedRef = useRef(false);

  // Fresh level whenever the round advances. Keeps the once-only onSolved contract intact.
  useEffect(() => {
    const next = generateLevel(seed + round, tierFor(round));
    setLevel(next);
    setScale(next.scale);
    setUsed(0);
    setNote(null);
    solvedRef.current = false;
  }, [seed, round]);

  const reset = useCallback(
    (why: string | null) => {
      setScale(level.scale);
      setUsed(0);
      setNote(why);
    },
    [level],
  );

  const play = useCallback(
    (move: Move) => {
      if (solvedRef.current) return;
      const after = applyMove(scale, move);
      if (after === scale) return;
      const spent = used + 1;
      if (isSolved(after)) {
        solvedRef.current = true;
        setScale(after);
        setUsed(spent);
        setNote(`One bag weighs ${after.bagWeight}.`);
        onSolved();
        return;
      }
      if (spent >= level.budget) {
        // Out of moves: back to the start. Not a loss, and nothing is recorded.
        reset("Out of moves — back to the start. Try a different route.");
        return;
      }
      setScale(after);
      setUsed(spent);
      setNote(null);
    },
    [scale, used, level.budget, onSolved, reset],
  );

  const moves = legalMoves(scale);
  const divides = moves.filter((move) => move.kind === "divide");
  const solved = isSolved(scale);

  return (
    <div className="bs-root">
      <button type="button" className="bs-back" onClick={onExit}>
        ← Back
      </button>

      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. The
          panel reuses `.bs-rule` and `.bs-status`'s invariant sentence verbatim. */}
      <TeachIn activity="balance-scale" />

      <p className="bs-rule">
        Do the same thing to both pans until one bag stands alone — then the stones facing it are
        what the bag weighs.
      </p>

      <div className="bs-scale" data-testid="bs-scale">
        <div className="bs-rig" aria-hidden="true">
          <div className="bs-beam" />
          <div className="bs-hanger bs-hanger-left" />
          <div className="bs-hanger bs-hanger-right" />
          <div className="bs-fulcrum" />
        </div>
        <div className="bs-pans">
          <PanView pan={scale.left} side="left" />
          <PanView pan={scale.right} side="right" />
        </div>
      </div>

      <p className="bs-status">
        Both pans always weigh the same — that is why these moves are allowed. ·{" "}
        {level.budget - used} move{level.budget - used === 1 ? "" : "s"} left
      </p>

      <output className="bs-note">{note ?? ""}</output>

      {solved ? (
        <button type="button" className="bs-next" onClick={() => setRound((r) => r + 1)}>
          Next puzzle →
        </button>
      ) : (
        <div className="bs-moves">
          {moves
            .filter((move) => move.kind !== "divide")
            .map((move) => (
              <button
                key={moveLabel(move)}
                type="button"
                className={`bs-move bs-move-${move.kind}`}
                onClick={() => play(move)}
              >
                {moveLabel(move)}
              </button>
            ))}

          {/*
           * SPLITTING IS ALWAYS SHOWN, even when no split is legal yet — and that is a fix, not
           * clutter. The palette used to render only currently-legal moves, and splitting is legal on
           * *no* opening board (it needs every denomination on both pans to divide evenly). So the
           * one move every solution requires — the generator enforces a divide in the shortest
           * path — was the one move a child never saw, and the reasonable conclusion was that the
           * feature did not exist.
           *
           * When nothing splits yet this is a line of text rather than a dead button: it states the
           * condition, which is the thing to be reasoned about, and points at breaking a stone as the
           * way to satisfy it. No disabled control, nothing to click that does nothing.
           */}
          {divides.length > 0 ? (
            divides.map((move) => (
              <button
                key={moveLabel(move)}
                type="button"
                className="bs-move bs-move-divide"
                onClick={() => play(move)}
              >
                {moveLabel(move)}
              </button>
            ))
          ) : (
            <p className="bs-split-hint">
              To split both pans evenly, every kind of stone on both pans has to divide evenly —
              break one first.
            </p>
          )}

          <button type="button" className="bs-reset" onClick={() => reset(null)}>
            Start this one over
          </button>
        </div>
      )}
    </div>
  );
};

export default BalanceScale;
