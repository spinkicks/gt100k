/**
 * The reference solver. Slow, obvious, and the thing the generator is checked against.
 *
 * TWO SOLVERS, ON PURPOSE. `solutionsByPose` uses the real criterion. `solutionsByTrail` uses the
 * weaker one a child would be using if the demonstration left a drawn path behind it. Comparing their
 * sizes is how rule X1 becomes a test rather than an intention: if a round has one pose-solution and
 * several trail-solutions, then matching the shape is provably not enough to answer it, and the child
 * has to attend to execution.
 *
 * This mirrors the lesson the music room paid for. Tune Repair shipped with a test asserting it was
 * "fully solvable in silence", read at the time as proof the dual-coding requirement was met; it was
 * proof the audio was decoration. Inverting that assertion into a guard is the cheapest protection
 * available, so `generate.test.ts` asserts the inequality for the timing tier.
 *
 * Enumeration is exponential in `maxLength`, and that is fine: the trays hold three or four blocks,
 * `maxLength` is single digits, and this runs only in tests.
 *
 * `repeat` blocks are deliberately NOT enumerated. A repeat is sugar for its unrolled body, so any
 * behaviour reachable with one is reachable without it at greater length — enumerating both would
 * multiply the search and find no new behaviours.
 */
import type { Program, Statement } from "../../code/program";
import { type SpriteLoopPuzzle, type TrayBlock, isSolved, poseSequence, trailOf } from "./logic";

function asStatement(b: TrayBlock): Statement | null {
  switch (b.kind) {
    case "move":
      return { kind: "move", steps: b.steps };
    case "turn":
      return { kind: "turn", quarters: b.quarters };
    case "wait":
      return { kind: "wait", ticks: b.ticks };
    case "repeat":
      return null;
  }
}

/** Every program of length 1..maxLength drawable from the tray, repeats excluded. */
export function enumeratePrograms(
  tray: readonly TrayBlock[],
  maxLength: number,
): readonly Program[] {
  const atoms = tray.map(asStatement).filter((s): s is Statement => s !== null);
  const out: Program[] = [];
  let frontier: Program[] = [[]];
  for (let len = 1; len <= maxLength; len++) {
    const next: Program[] = [];
    for (const prefix of frontier) {
      for (const a of atoms) {
        const p = [...prefix, a];
        next.push(p);
        out.push(p);
      }
    }
    frontier = next;
  }
  return out;
}

export function solutionsByPose(
  puzzle: SpriteLoopPuzzle,
  maxLength: number,
): readonly Program[] {
  return enumeratePrograms(puzzle.tray, maxLength).filter((p) => isSolved(puzzle, p));
}

function sameSet(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  return a.size === b.size && [...a].every((k) => b.has(k));
}

/** The weaker criterion: same cells visited, timing and order discarded. Never a solve check. */
export function solutionsByTrail(
  puzzle: SpriteLoopPuzzle,
  maxLength: number,
): readonly Program[] {
  const want = trailOf(poseSequence(puzzle.target, puzzle.start));
  return enumeratePrograms(puzzle.tray, maxLength).filter((p) =>
    sameSet(want, trailOf(poseSequence(p, puzzle.start))),
  );
}
