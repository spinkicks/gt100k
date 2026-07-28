/**
 * Rounds for Trace & Repair.
 *
 * A ROUND IS BUILT BACKWARDS: draw a correct program, then break exactly one line of it. That is the
 * only way to know the intended run is reachable — breaking a program you already have is guaranteed
 * repairable, whereas inventing a broken one and hoping a one-line fix exists is not.
 *
 * THREE THINGS EVERY GENERATED ROUND MUST SATISFY, all checked here and asserted in the tests:
 *
 *  1. **The runs part company inside the run, not on the last tick.** If the two only differ at the
 *     end, the scrubber shows nothing the final board does not already say, and the door collapses
 *     into "spot the difference".
 *  2. **More than one line can be blamed from the ending alone.** This is rule X1 for this door: if
 *     exactly one line could possibly explain where the creature stopped, a child never has to look
 *     at the middle. `naive.ts` counts the candidates and the generator rejects rounds with only one.
 *  3. **Exactly one edit reproduces the intended run.** More than one and the round has no single
 *     answer to converge on; none and it is unsolvable.
 *
 * Everything stays on the 9x9 by rejection, for both the intended and the buggy program — a creature
 * that walks off the board mid-round would be a hidden mechanic, the same reason Sprite Loop has no
 * wall rule.
 */
import type { MachineState } from "../../code/interpret";
import type { Program, Statement } from "../../code/program";
import { type Rng, mulberry32 } from "../../lib/rng";
import { START_POSE } from "../SpriteLoop/generate";
import { inBounds } from "../SpriteLoop/logic";
import { type TraceRepairPuzzle, divergenceTick, posesOf, withLine } from "./logic";
import { repairsByRun, linesBlamedByEnding } from "./naive";

interface Tier {
  /** How many lines the program has. The spec's 5-9 band, entered gently. */
  readonly lines: number;
  /** Statements the correct program is drawn from. */
  readonly vocabulary: readonly Statement[];
}

const WALKING: readonly Statement[] = [
  { kind: "move", steps: 1 },
  { kind: "move", steps: 2 },
  { kind: "turn", quarters: 1 },
  { kind: "turn", quarters: -1 },
];

const WITH_PAUSES: readonly Statement[] = [...WALKING, { kind: "wait", ticks: 1 }];

export const TIERS: readonly Tier[] = [
  { lines: 5, vocabulary: WALKING },
  { lines: 7, vocabulary: WITH_PAUSES },
  { lines: 9, vocabulary: WITH_PAUSES },
];

/** Wraps, so a run of rounds never ends on the hardest. Same reasoning as Sprite Loop's. */
export function tierForIndex(index: number): number {
  const n = TIERS.length;
  return ((Math.trunc(index) % n) + n) % n;
}

function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

/** Every statement that could stand in for `s` — the ways one line can be wrong. */
function corruptionsOf(s: Statement): readonly Statement[] {
  switch (s.kind) {
    case "move":
      // Off-by-one in both directions, plus a bigger slip.
      return [
        { kind: "move", steps: s.steps + 1 },
        { kind: "move", steps: Math.max(1, s.steps - 1) },
        { kind: "move", steps: s.steps + 2 },
      ].filter((c) => c.steps !== s.steps);
    case "turn":
      // The wrong way round: the single most ordinary bug in this vocabulary.
      return [{ kind: "turn", quarters: -s.quarters }];
    case "wait":
      return [
        { kind: "wait", ticks: s.ticks + 1 },
        { kind: "move", steps: 1 },
      ];
    case "repeat":
      return [{ kind: "repeat", times: s.times + 1, body: s.body }];
  }
}

function drawProgram(rng: Rng, tier: Tier): Program {
  return Array.from({ length: tier.lines }, () => pick(rng, tier.vocabulary));
}

function acceptable(puzzle: TraceRepairPuzzle): boolean {
  const wantPoses = posesOf(puzzle, puzzle.intended);
  const gotPoses = posesOf(puzzle, puzzle.buggy);

  // Both programs stay on the board for their whole run.
  if (!wantPoses.every(inBounds) || !gotPoses.every(inBounds)) return false;

  // The intended run has to be worth watching.
  if (wantPoses.every((p) => p.x === puzzle.start.x && p.y === puzzle.start.y)) return false;

  // 1. They part company inside the run, not only at the very end.
  const d = divergenceTick(wantPoses, gotPoses);
  if (d === null) return false;
  if (d >= Math.min(wantPoses.length, gotPoses.length) - 1) return false;

  // 3. Exactly one edit reproduces the intended run.
  if (repairsByRun(puzzle).length !== 1) return false;

  // 2. The ending alone leaves more than one line blamable — rule X1 for this door.
  if (linesBlamedByEnding(puzzle).size < 2) return false;

  return true;
}

export function generateForRound(seed: number, index: number): TraceRepairPuzzle {
  const tier = TIERS[tierForIndex(index)]!;
  const rng = mulberry32(seed * 2411 + index * 6131);

  for (let attempt = 0; attempt < 400; attempt++) {
    const intended = drawProgram(rng, tier);
    const bugLine = Math.floor(rng() * intended.length);
    const options = corruptionsOf(intended[bugLine]!);
    if (options.length === 0) continue;
    const buggy = withLine(intended, bugLine, pick(rng, options));
    const puzzle: TraceRepairPuzzle = { start: START_POSE, intended, buggy, bugLine };
    if (acceptable(puzzle)) return puzzle;
  }

  return FALLBACK(tier);
}

/**
 * The round used only if 400 draws all fail.
 *
 * CAPTURED FROM THE GENERATOR, NOT INVENTED. The first version of this constant was written by hand
 * and looked entirely reasonable — a square walk with one turn flipped — and it failed rule 2 on the
 * first run of `generate.test.ts`: only one line could be blamed from the ending, so a child could
 * have answered it without ever scrubbing. That is precisely the defect this door exists to avoid, in
 * the one round nobody would have play-tested.
 *
 * So this is `generateForRound(1, 0)`, frozen. `generate.test.ts` runs the same acceptability rules
 * against it as against every generated round, so it cannot rot back into that state.
 */
const FALLBACK_INTENDED: Program = [
  { kind: "move", steps: 2 },
  { kind: "move", steps: 1 },
  { kind: "turn", quarters: 1 },
  { kind: "turn", quarters: -1 },
  { kind: "turn", quarters: 1 },
];

function FALLBACK(tier: Tier): TraceRepairPuzzle {
  void tier;
  return {
    start: START_POSE,
    intended: FALLBACK_INTENDED,
    buggy: withLine(FALLBACK_INTENDED, 3, { kind: "turn", quarters: 1 }),
    bugLine: 3,
  };
}

export const FALLBACK_PUZZLE: TraceRepairPuzzle = FALLBACK(TIERS[0]!);

/** Exposed so the component and the tests agree on where a round starts. */
export const START: MachineState = START_POSE;
