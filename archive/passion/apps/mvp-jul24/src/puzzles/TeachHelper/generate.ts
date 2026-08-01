/**
 * Rounds for Teach the Helper.
 *
 * A round is a visible arrangement of parcels plus three hidden ones, and it is only acceptable when
 * **the program written for the visible board fails at least one hidden board**. That is the guard;
 * everything else here exists to make it hold.
 *
 * Concretely, that means at least one hidden arrangement must put a parcel somewhere the visible one
 * does not. Rejection sampling is simpler and more honest than trying to construct such a set
 * directly, and the acceptability rule is the same function the tests assert against.
 *
 * Three tiers, by how *nearly* the visible board tells the truth. Tier 0's hidden boards differ
 * obviously; tier 2's differ by a single cell, which is where a child who has half-learned the lesson
 * gets caught.
 */
import type { Program } from "../../code/program";
import { type Rng, mulberry32 } from "../../lib/rng";
import { cellKey } from "../SpriteLoop/logic";
import { type TeachHelperPuzzle, isSolved } from "./logic";
import { writtenForWhatCouldBeThere, writtenForWhatYouSee } from "./naive";
import { CORRIDOR } from "./world";

interface Tier {
  /** How many parcels the visible board holds. */
  readonly visibleCount: number;
  /** How many parcels each hidden board holds. */
  readonly hiddenCount: number;
}

export const TIERS: readonly Tier[] = [
  { visibleCount: 2, hiddenCount: 3 },
  { visibleCount: 3, hiddenCount: 3 },
  { visibleCount: 3, hiddenCount: 2 },
];

/** Wraps, so a run of rounds never ends on the hardest. Same reasoning as the other two doors. */
export function tierForIndex(index: number): number {
  const n = TIERS.length;
  return ((Math.trunc(index) % n) + n) % n;
}

/** A random set of `count` distinct corridor cells. */
function arrangement(rng: Rng, count: number): ReadonlySet<string> {
  const cells = Array.from({ length: CORRIDOR }, (_, i) => i);
  // Fisher-Yates, seeded, so a round is reproducible from its seed.
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cells[i], cells[j]] = [cells[j]!, cells[i]!];
  }
  return new Set(cells.slice(0, count).map((i) => cellKey(i, 0)));
}

/**
 * The rule every round must satisfy.
 *
 * Exported because `generate.test.ts` runs it against generated rounds rather than re-deriving it —
 * a guard checked by a copy of itself is not a guard.
 */
export function acceptable(puzzle: TeachHelperPuzzle): boolean {
  if (puzzle.visible.size === 0) return false;
  if (puzzle.hidden.length === 0) return false;
  // Every hidden board must have something on it, or "clearing" it is free.
  if (puzzle.hidden.some((h) => h.size === 0)) return false;

  // The insight has to work.
  if (!isSolved(puzzle, writtenForWhatCouldBeThere())) return false;

  // And the trap has to be a trap: writing for the visible board must not be enough.
  if (isSolved(puzzle, writtenForWhatYouSee(puzzle.visible))) return false;

  return true;
}

export function generateForRound(seed: number, index: number): TeachHelperPuzzle {
  const tier = TIERS[tierForIndex(index)]!;
  const rng = mulberry32(seed * 3319 + index * 5077);

  for (let attempt = 0; attempt < 400; attempt++) {
    const visible = arrangement(rng, tier.visibleCount);
    const hidden = [
      arrangement(rng, tier.hiddenCount),
      arrangement(rng, tier.hiddenCount),
      arrangement(rng, tier.hiddenCount),
    ];
    const puzzle: TeachHelperPuzzle = { visible, hidden };
    if (acceptable(puzzle)) return puzzle;
  }
  return FALLBACK_PUZZLE;
}

/**
 * Used only if 400 draws all fail.
 *
 * Written out rather than captured, because unlike the other two doors this one's rule is simple
 * enough to satisfy by inspection: the hidden boards each hold a parcel at a cell the visible board
 * leaves empty, so a program written for `visible` cannot clear them. `generate.test.ts` runs
 * `acceptable` against it anyway, because "simple enough to check by eye" is how the Trace & Repair
 * fallback went wrong.
 */
export const FALLBACK_PUZZLE: TeachHelperPuzzle = {
  visible: new Set([cellKey(0, 0), cellKey(3, 0)]),
  hidden: [
    new Set([cellKey(1, 0), cellKey(4, 0)]),
    new Set([cellKey(2, 0), cellKey(5, 0)]),
    new Set([cellKey(6, 0), cellKey(3, 0)]),
  ],
};

/** The program the door is happy with, exposed so the harness can demonstrate a pass. */
export function modelAnswer(): Program {
  return writtenForWhatCouldBeThere();
}
