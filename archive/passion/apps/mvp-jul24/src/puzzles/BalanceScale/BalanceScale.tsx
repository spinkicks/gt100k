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
 *
 * WHY THE SPLIT RAIL IS PART OF THE SCALE AND NOT A BUTTON IN THE PALETTE. Splitting is the move
 * every solution needs and the move nobody could find — twice reported missing. The palette rendered
 * it only while it was legal, which is 6 of 360 opening boards, and the replacement was a sentence
 * explaining the condition. The sentence did not work either: the product owner reasoned the move out
 * unaided across two sessions and concluded "maybe explanation isn't enough anyway". So splitting now
 * has a permanent place ON the scale, and its legality is drawn on the pans rather than described —
 * see split.ts for the full argument and the measurements. The rules did not change: `isLegal` is
 * still the only authority on when a split is allowed.
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
  isLegal,
  isSolved,
  legalMoves,
  moveLabel,
  stoneCount,
  stoneTotal,
} from "./logic";
import { RAIL_KS, type SplitMarks, pileKey, splitMarks, unblockingMoves } from "./split";

/**
 * Which tier to generate for.
 *
 * `chosen` is `PuzzleProps.tier` — the tier the child asked for by pressing "Try a harder one", which
 * survives the remount that press causes because it arrives as a prop rather than living in state
 * (see `Gadget.supportsTier`). `round` is the alternating easy/hard ramp within a sitting, the same
 * shape Pipes uses; it rides on top of the chosen tier rather than replacing it, so asking for harder
 * work never hands back an easier board.
 *
 * TIERS[0] is the gentle first encounter added in this change, and the tight anti-flailing budget now
 * lives at TIERS[1] and above — see the tier table in generate.ts.
 */
export function tierFor(round: number, chosen = 0): number {
  const ramp = round % 2 === 0 ? 0 : 1;
  return Math.min(Math.max(chosen, 0) + ramp, TIERS.length - 1);
}

function PanView({
  pan,
  side,
  marks,
}: {
  pan: Pan;
  side: "left" | "right";
  marks: SplitMarks | null;
}): JSX.Element {
  /**
   * How many items at the END of a pile carry the split mark. Marking from the end is not an
   * arbitrary choice dressed up as one: stones of a denomination are interchangeable, so "which
   * three of the five" has no meaning, and taking them from the end keeps the unmarked ones in a
   * stable block that reads as a group.
   */
  const marked = (key: string): number => marks?.marked.get(key) ?? 0;
  const markClass = marks?.kind === "removed" ? "bs-goes" : "bs-left-over";
  const markedBags = marked(pileKey({ side, kind: "bags" }));
  const leftOver =
    marks?.kind === "leftOver"
      ? [...marks.marked.entries()]
          .filter(([key]) => key.startsWith(`${side}:`))
          .reduce((sum, [, n]) => sum + n, 0)
      : 0;

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
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: bags are identical by definition
            key={`bag-${i}`}
            className={`bs-bag${i >= pan.bags - markedBags ? ` ${markClass}` : ""}`}
            aria-hidden="true"
          />
        ))}
        {DENOMS.flatMap((d: Denom) => {
          const count = stoneCount(pan, d);
          const n = marked(pileKey({ side, kind: "stone", value: d }));
          return Array.from({ length: count }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: stones of a denomination are interchangeable
              key={`stone-${d}-${i}`}
              className={`bs-stone bs-stone-${d}${i >= count - n ? ` ${markClass}` : ""}`}
            >
              {d}
            </span>
          ));
        })}
      </div>
      <span className="bs-pan-readout">
        {pan.bags > 0 ? `${pan.bags} bag${pan.bags === 1 ? "" : "s"}` : "no bags"}
        {stoneTotal(pan) > 0 ? ` + ${stoneTotal(pan)}` : ""}
        {/*
         * The ONE piece of copy the split affordance is allowed, and it is a label on the pan rather
         * than an instruction: it names what the marks on this pan are. It exists because the marks
         * are a purely visual channel and a screen-reader user would otherwise get nothing at all
         * from poking a blocked split — the same information, in the only channel that reader has.
         */}
        {leftOver > 0 ? ` · ${leftOver} left over` : ""}
      </span>
    </div>
  );
}

export const BalanceScale: React.FC<PuzzleProps & { initialRound?: number }> = ({
  seed,
  tier = 0,
  onSolved,
  onExit,
  initialRound = 0,
}) => {
  const [round, setRound] = useState(initialRound);
  const [level, setLevel] = useState<Level>(() =>
    generateLevel(seed + initialRound, tierFor(initialRound, tier)),
  );
  const [scale, setScale] = useState<Scale>(level.scale);
  const [used, setUsed] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  /** The split being pointed at right now — hover or keyboard focus. Cleared on the way out. */
  const [probed, setProbed] = useState<number | null>(null);
  /**
   * The split whose leftovers stay lit after a press. A blocked split has nothing to apply, so the
   * press has to do *something*, and what it does is hold the explanation on the board — otherwise
   * the whole affordance would be hover-only and unavailable to a child on a touchscreen.
   */
  const [pinned, setPinned] = useState<number | null>(null);
  const solvedRef = useRef(false);

  // Fresh level whenever the round or the asked-for tier changes. Keeps the once-only onSolved
  // contract intact.
  useEffect(() => {
    const next = generateLevel(seed + round, tierFor(round, tier));
    setLevel(next);
    setScale(next.scale);
    setUsed(0);
    setNote(null);
    setProbed(null);
    setPinned(null);
    solvedRef.current = false;
  }, [seed, round, tier]);

  const reset = useCallback(
    (why: string | null) => {
      setScale(level.scale);
      setUsed(0);
      setNote(why);
      setPinned(null);
    },
    [level],
  );

  const play = useCallback(
    (move: Move) => {
      if (solvedRef.current) return;
      const after = applyMove(scale, move);
      if (after === scale) return;
      // The board has changed, so anything pinned about the old board is now a lie about this one.
      setPinned(null);
      setProbed(null);
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
  const solved = isSolved(scale);

  /**
   * The rail always carries ÷2 and ÷3 — the only factors any shipped solution has ever used — and
   * additionally any other factor the rules currently allow, so a board that happens to divide by 5
   * still offers it. A permanent control for a factor nothing needs would spend the rail's whole
   * pop-out on noise; a missing control for one the rules allow would hide a legal move again.
   */
  const railKs = [
    ...RAIL_KS,
    ...moves.flatMap((move) =>
      move.kind === "divide" && !RAIL_KS.some((k) => k === move.k) ? [move.k] : [],
    ),
  ];

  // What the pans are showing right now, and which other buttons would clear a leftover. Both are
  // derived from the live scale, so neither can drift out of step with what the rules allow.
  const shownK = probed ?? pinned;
  const marks = shownK === null ? null : splitMarks(scale, shownK);
  const litLabels =
    shownK === null ? new Set<string>() : new Set(unblockingMoves(scale, shownK).map(moveLabel));

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
          <PanView pan={scale.left} side="left" marks={marks} />
          <PanView pan={scale.right} side="right" marks={marks} />
        </div>

        {/*
         * THE SPLIT RAIL — bolted to the scale, present on every board, whether or not a split is
         * legal right now.
         *
         * Each control is a real button and is never `disabled`: a disabled control is unfocusable,
         * unhoverable and therefore unexplainable, which is how the move became invisible in the
         * first place. A blocked one carries `aria-disabled` and, when pointed at or pressed, marks
         * the leftover stones and bags on the pans and lights up the moves that would clear one. So
         * the answer to "why can't I split?" is a thing to look at on the board rather than a
         * paragraph to read.
         */}
        {solved ? null : (
          <div className="bs-rail" data-testid="bs-rail">
            {railKs.map((k) => {
              const move: Move = { kind: "divide", k };
              const legal = isLegal(scale, move);
              return (
                <button
                  key={k}
                  type="button"
                  className={`bs-rail-split${legal ? "" : " bs-rail-split-blocked"}${
                    shownK === k ? " bs-rail-split-shown" : ""
                  }`}
                  aria-disabled={legal ? undefined : true}
                  onPointerEnter={() => setProbed(k)}
                  onPointerLeave={() => setProbed(null)}
                  onFocus={() => setProbed(k)}
                  onBlur={() => setProbed(null)}
                  onClick={() => {
                    if (legal) play(move);
                    // Nothing to apply, so the press holds the reason on the board instead. Pressing
                    // it again puts the board back, which makes it safe to poke at.
                    else setPinned((current) => (current === k ? null : k));
                  }}
                >
                  <span className="bs-rail-glyph" aria-hidden="true">
                    ÷{k}
                  </span>
                  <span className="bs-rail-label">{moveLabel(move)}</span>
                </button>
              );
            })}
          </div>
        )}
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
          {/* Divides are not here: they live on the rail above, permanently. */}
          {moves
            .filter((move) => move.kind !== "divide")
            .map((move) => (
              <button
                key={moveLabel(move)}
                type="button"
                className={`bs-move bs-move-${move.kind}${
                  litLabels.has(moveLabel(move)) ? " bs-move-lit" : ""
                }`}
                onClick={() => play(move)}
              >
                {moveLabel(move)}
              </button>
            ))}

          <button type="button" className="bs-reset" onClick={() => reset(null)}>
            Start this one over
          </button>
        </div>
      )}
    </div>
  );
};

export default BalanceScale;
