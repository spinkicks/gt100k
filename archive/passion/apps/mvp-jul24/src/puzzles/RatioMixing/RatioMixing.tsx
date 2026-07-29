/**
 * Ratio Mixing — the dye bench.
 *
 * What the player sees: an order card (how big the jar is, and the dye:water ratio it must end up
 * at), three or four vats each pouring a fixed ladle of already-mixed dye and water, and the jar
 * itself drawn as one square per unit so the contents can be counted rather than judged by eye.
 *
 * Deliberate absences, all of them load-bearing:
 *
 *  - **No undo.** A poured ladle stays poured. "Pour it out" starts a fresh batch and is always
 *    available, costs nothing and is never counted — restarting is a normal move. Undo would turn
 *    the bench into a search tree and let a child wiggle to the answer.
 *  - **No "how close am I" meter, and no statement of how much dye the jar needs.** The card gives
 *    the ratio and the capacity; turning those into unit counts is the puzzle. The jar reports
 *    facts about itself (units, dye, water, current ratio in lowest terms) and nothing else.
 *  - **No tutorial.** The shared teach-in component owns explanation; this file must not grow its
 *    own. Everything on screen is a label on a thing, not an instruction.
 *  - **No score, points, stars, streak, timer or attempt count** (PROJECT.md D7). Solving reveals
 *    one thing: another order, if the player wants one.
 *
 * Colour carries nothing. Dye units and water units differ in lightness and in a ring marker, and
 * every quantity on screen is also written as a number, so the bench works for a colour-blind
 * player and "exactly right" is always checkable by counting.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { generateOrder, nextSeed, tierForIndex } from "./generate";
import {
  type RatioPuzzle,
  canPour,
  currentRatio,
  emptyBatch,
  isSolved,
  isStuck,
  jarState,
  ladleSize,
} from "./logic";
import "./RatioMixing.css";

/** A row of chips showing a ratio's shape: `dye` dark ones then `water` pale ones. */
function RatioChips({ dye, water, className }: { dye: number; water: number; className?: string }) {
  return (
    <span className={`rm-chips ${className ?? ""}`} aria-hidden="true">
      {Array.from({ length: dye }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed count of identical marks; position is the identity.
        <span key={`d${i}`} className="rm-chip rm-chip-dye" />
      ))}
      {Array.from({ length: water }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed count of identical marks; position is the identity.
        <span key={`w${i}`} className="rm-chip rm-chip-water" />
      ))}
    </span>
  );
}

const ratioText = (dye: number, water: number): string => `${dye} : ${water}`;

/**
 * How wide to draw the jar. Full rows make the contents countable in groups instead of one at a
 * time, which matters when the win condition is an exact count — so prefer a row length that
 * divides the capacity, and fall back to ten-frames when nothing in range does.
 */
export function jarColumns(capacity: number): number {
  if (capacity <= 12) return capacity;
  for (let n = 12; n >= 6; n--) {
    if (capacity % n === 0) return n;
  }
  return 10;
}

/** One order plus the batch poured so far. Kept as a single state value so an order and its jar
 * can never disagree: advancing the order IS emptying the jar. */
interface Bench {
  index: number;
  puzzle: RatioPuzzle;
  /** Vat indices in pour order. The single source of truth for the batch. */
  history: number[];
}

const makeBench = (seed: number, index: number): Bench => ({
  index,
  puzzle: generateOrder(nextSeed(seed, index), tierForIndex(index)),
  history: [],
});

export default function RatioMixing({ seed, onSolved, onExit }: PuzzleProps) {
  // Endless orders: index 0 is the first bench of the session, and every "Next order" advances to
  // a freshly generated one. Tiers alternate so a session meets both benches.
  const [bench, setBench] = useState<Bench>(() => makeBench(seed, 0));
  const { puzzle, history } = bench;
  /** Which order `onSolved` has already fired for — once per order, never twice. */
  const firedFor = useRef<RatioPuzzle | null>(null);

  const batch = useMemo(() => {
    const counts = emptyBatch(puzzle);
    for (const i of history) counts[i] = (counts[i] ?? 0) + 1;
    return counts;
  }, [puzzle, history]);

  const jar = jarState(puzzle, batch);
  const solved = isSolved(puzzle, batch);
  const stuck = isStuck(puzzle, batch);
  const ratio = currentRatio(puzzle, batch);

  useEffect(() => {
    if (solved && firedFor.current !== puzzle) {
      firedFor.current = puzzle;
      onSolved();
    }
  }, [solved, puzzle, onSolved]);

  const pourFrom = (i: number) => {
    if (!canPour(puzzle, batch, i)) return;
    setBench((b) => ({ ...b, history: [...b.history, i] }));
  };

  const pourItOut = useCallback(() => setBench((b) => ({ ...b, history: [] })), []);
  const nextOrder = useCallback(() => setBench((b) => makeBench(seed, b.index + 1)), [seed]);

  // One square per unit, in pour order: each ladle contributes its dye squares then its water
  // squares, so the batch reads as a sequence of committed decisions.
  const units: Array<{ kind: "dye" | "water"; first: boolean }> = [];
  for (const i of history) {
    const vat = puzzle.vats[i]!;
    for (let d = 0; d < vat.dye; d++) units.push({ kind: "dye", first: d === 0 });
    for (let w = 0; w < vat.water; w++)
      units.push({ kind: "water", first: vat.dye === 0 && w === 0 });
  }

  const columns = jarColumns(puzzle.capacity);

  return (
    <div className="rm">
      <button type="button" className="rm-exit" onClick={onExit}>
        ← Back
      </button>

      {/* The shared teach-in, mounted — which is what the "No tutorial" note above asks for. It
          states the rule and says restarting is free; it does not state how much dye the jar needs,
          because scaling the ratio to the capacity is the puzzle. */}
      <TeachIn activity="ratio-mixing" />

      <div className="rm-order">
        <span className="rm-order-jar">Jar: {puzzle.capacity} units, filled to the brim</span>
        <span className="rm-order-ratio">
          <strong>{ratioText(puzzle.targetDye, puzzle.targetWater)}</strong> dye to water
        </span>
        <RatioChips dye={puzzle.targetDye} water={puzzle.targetWater} className="rm-chips-order" />
      </div>

      <div className={`rm-jar ${solved ? "rm-jar-right" : ""}`}>
        <div
          className="rm-units"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          aria-hidden="true"
        >
          {Array.from({ length: puzzle.capacity }, (_, i) => {
            const unit = units[i];
            const kind = unit ? unit.kind : "empty";
            return (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length jar, position is the identity.
                key={i}
                className={`rm-unit rm-unit-${kind}${unit?.first ? " rm-unit-ladle-start" : ""}`}
              />
            );
          })}
        </div>
        <p className="rm-readout" aria-live="polite">
          <span className="rm-readout-units">
            {jar.units} of {puzzle.capacity} units
          </span>
          <span className="rm-readout-split">
            {jar.dye} dye, {jar.water} water
          </span>
          <span className="rm-readout-ratio">
            {ratio ? `now ${ratioText(ratio[0], ratio[1])}` : "empty jar"}
          </span>
        </p>
      </div>

      <div className="rm-vats">
        {puzzle.vats.map((vat, i) => {
          const left = vat.stock - (batch[i] ?? 0);
          const fits = canPour(puzzle, batch, i);
          const reason = left === 0 ? "vat empty" : "will not fit";
          return (
            <button
              key={vat.id}
              type="button"
              className="rm-pour"
              data-vat={i}
              disabled={!fits}
              onClick={() => pourFrom(i)}
              aria-label={`Pour from ${vat.label}: ${ladleSize(vat)} units, ${vat.dye} dye and ${vat.water} water. ${left} ladles left.${fits ? "" : ` Cannot pour: ${reason}.`}`}
            >
              <span className="rm-pour-label">{vat.label}</span>
              <span className="rm-pour-mix">{ratioText(vat.dye, vat.water)}</span>
              <RatioChips dye={vat.dye} water={vat.water} />
              <span className="rm-pour-size">{ladleSize(vat)}-unit ladle</span>
              <span className="rm-pour-left">{left} left</span>
            </button>
          );
        })}
      </div>

      <div className="rm-bench">
        <button
          type="button"
          className="rm-reset"
          onClick={pourItOut}
          disabled={history.length === 0}
        >
          Pour it out
        </button>
        {stuck && <span className="rm-note">Nothing left fits this jar.</span>}
        {solved && <span className="rm-note rm-note-right">Exactly right.</span>}
        {solved && (
          <button type="button" className="rm-next" onClick={nextOrder}>
            Next order →
          </button>
        )}
      </div>
    </div>
  );
}
