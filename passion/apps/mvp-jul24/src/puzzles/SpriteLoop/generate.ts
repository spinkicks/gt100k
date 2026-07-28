/**
 * Rounds for Sprite Loop.
 *
 * THREE TIERS, AND THE THIRD IS WHERE THE RULE LIVES. Tier 0 is a short walk-and-turn. Tier 1 is
 * longer and may double back. Tier 2 **always spends `wait`**, because a pause is the one thing a
 * drawn path cannot show: two programs that visit the same cells at different speeds are identical as
 * a shape and different as a run. `generate.test.ts` asserts exactly that, so if a future edit makes
 * the hardest tier answerable by shape the suite fails rather than the design quietly rotting.
 *
 * EVERY TARGET IS GUARANTEED ON THE BOARD, by rejection: a candidate that would walk off the 9x9 is
 * discarded and redrawn. That is why the board needs no wall rule — see `logic.ts` on why a wall
 * would be a hidden mechanic.
 *
 * A TARGET THAT NEVER LEAVES ITS CELL IS ALSO REJECTED. `turn, turn` is a legal program and a round
 * with nothing to watch; a child would be asked to copy a creature that appears not to be doing
 * anything.
 *
 * TIER CYCLES WITHIN A MOUNT, and the overlay clamps. `tierForIndex` wraps so a run of rounds never
 * ends on the hardest one; `openTier` in `../openTier.ts` is what the overlay's "Try a harder one"
 * counter must go through. This puzzle does not set `Gadget.supportsTier` in PR 1 because it is not
 * registered yet.
 */
import type { MachineState } from "../../code/interpret";
import type { Program, Statement } from "../../code/program";
import { type Rng, mulberry32 } from "../../lib/rng";
import { GRID, type SpriteLoopPuzzle, type TrayBlock, inBounds, poseSequence } from "./logic";

/** Middle of the board, facing north. The same start every round, so only the motion differs. */
export const START_POSE: MachineState = {
  x: Math.floor(GRID / 2),
  y: Math.floor(GRID / 2),
  facing: 0,
  pc: 0,
};

interface Tier {
  /** How many statements the target holds. */
  readonly length: number;
  /** Whether the target must spend a `wait`. Tier 2's whole point. */
  readonly requiresWait: boolean;
  readonly tray: readonly TrayBlock[];
}

export const TIERS: readonly Tier[] = [
  {
    length: 2,
    requiresWait: false,
    tray: [
      { kind: "move", steps: 1 },
      { kind: "move", steps: 2 },
      { kind: "turn", quarters: 1 },
    ],
  },
  {
    length: 3,
    requiresWait: false,
    tray: [
      { kind: "move", steps: 1 },
      { kind: "move", steps: 2 },
      { kind: "turn", quarters: 1 },
      { kind: "turn", quarters: -1 },
    ],
  },
  {
    // The timing tier. `move 2` is in the tray alongside `move 1` and `wait 1` precisely so that a
    // target of `move 1, wait 1, move 1` has a same-trail rival in `move 2` — which is what makes
    // the X1 guard in generate.test.ts able to find a strict inequality.
    length: 3,
    requiresWait: true,
    tray: [
      { kind: "move", steps: 1 },
      { kind: "move", steps: 2 },
      { kind: "turn", quarters: 1 },
      { kind: "wait", ticks: 1 },
    ],
  },
];

/** Wraps, so a run of rounds never ends on the hardest. See the file comment. */
export function tierForIndex(index: number): number {
  const n = TIERS.length;
  return ((Math.trunc(index) % n) + n) % n;
}

function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)]!;
}

function statementFor(b: TrayBlock): Statement {
  switch (b.kind) {
    case "move":
      return { kind: "move", steps: b.steps };
    case "turn":
      return { kind: "turn", quarters: b.quarters };
    case "wait":
      return { kind: "wait", ticks: b.ticks };
    case "repeat":
      return { kind: "repeat", times: b.times, body: [] };
  }
}

function draw(rng: Rng, tier: Tier): Program {
  const out: Statement[] = [];
  for (let i = 0; i < tier.length; i++) out.push(statementFor(pick(rng, tier.tray)));
  if (tier.requiresWait && !out.some((s) => s.kind === "wait")) {
    const waits = tier.tray.filter((b) => b.kind === "wait");
    out[Math.floor(rng() * out.length)] = statementFor(pick(rng, waits));
  }
  return out;
}

export function generateForRound(seed: number, index: number): SpriteLoopPuzzle {
  const tier = TIERS[tierForIndex(index)]!;
  const rng = mulberry32(seed * 1013 + index * 7919);
  for (let attempt = 0; attempt < 200; attempt++) {
    const target = draw(rng, tier);
    if (target.length === 0) continue;
    const poses = poseSequence(target, START_POSE);
    if (!poses.every(inBounds)) continue;
    if (poses.every((p) => p.x === START_POSE.x && p.y === START_POSE.y)) continue;
    return { start: START_POSE, target, tray: tier.tray };
  }
  // Unreachable in practice — 200 rejections on a 9x9 with three-statement targets. A short,
  // in-bounds, visibly-moving fallback rather than a throw, because one round is not worth crashing
  // a room over.
  return {
    start: START_POSE,
    target: [
      { kind: "move", steps: 1 },
      { kind: "turn", quarters: 1 },
    ],
    tray: tier.tray,
  };
}
