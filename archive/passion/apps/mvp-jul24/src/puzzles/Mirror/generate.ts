// Procedural level generator for the Mirror/laser puzzle. Replaces the old
// fixed set of hand-authored levels with an effectively unlimited supply of
// fresh, guaranteed-solvable boards.
//
// Algorithm: starting from an emitter on a random edge cell, walk the beam
// forward through the grid, occasionally planting a turn (a mirror in the
// orientation that bends the beam the way we want) until we decide to stop
// and drop the target on the beam's current cell. That walk *is* the
// solution: replaying it with the recorded mirror orientations is by
// construction a path from the emitter to the target. We then verify that
// construction with `traceBeam` (belt-and-suspenders against a modeling bug),
// and finally scramble every mirror to the *other* orientation so the board
// starts unsolved and the player must rotate each one back into place — the
// same "every mirror needs exactly one click" feel as the old authored
// levels, just generated instead of hand-picked.

import {
  type CellContent,
  DIR_VECTORS,
  type Direction,
  type Emitter,
  type MirrorLevel,
  type Orientation,
  type Point,
  emptyGrid,
  orientationForTurn,
  toggleOrientation,
  traceBeam,
} from "./logic";
// The app's one seeded PRNG. Its exact arithmetic decides which levels this file produces, so see
// the warning in src/lib/rng.ts before touching it.
import { mulberry32 } from "../../lib/rng";

/** The two directions a mirror can turn a beam travelling `dir` into. */
const PERPENDICULAR: Record<Direction, readonly [Direction, Direction]> = {
  N: ["E", "W"],
  S: ["E", "W"],
  E: ["N", "S"],
  W: ["N", "S"],
};

const MIN_SIZE = 5;
const SIZE_RANGE = 3; // sizes 5..7
const MIN_TURNS = 2;
const TURNS_RANGE = 3; // 2..4 turns

function key(p: Point): string {
  return `${p.row},${p.col}`;
}

/** How many whole steps in `dir` from `pos` stay inside the size x size grid. */
function maxStepsInBounds(pos: Point, dir: Direction, size: number): number {
  const [dr, dc] = DIR_VECTORS[dir];
  let steps = 0;
  let row = pos.row;
  let col = pos.col;
  while (true) {
    row += dr;
    col += dc;
    if (row < 0 || row >= size || col < 0 || col >= size) break;
    steps++;
  }
  return steps;
}

interface Turn {
  row: number;
  col: number;
  /** The orientation this mirror must have in the *solution*. */
  orientation: Orientation;
}

interface Walk {
  emitter: Emitter;
  size: number;
  turns: Turn[];
  target: Point;
}

/**
 * Try to walk out one candidate route: an emitter, some number of turns
 * (each landing on a fresh, unvisited cell), and a target on a fresh cell
 * beyond the last turn. Returns null if the walk paints itself into a
 * corner (runs out of room before placing every planned turn or target) —
 * the caller just tries again with the same, still-advancing, rng stream.
 */
function tryWalk(rng: () => number): Walk | null {
  const size = MIN_SIZE + Math.floor(rng() * SIZE_RANGE);
  const edge = Math.floor(rng() * 4);
  const along = Math.floor(rng() * size);
  const emitter: Emitter =
    edge === 0
      ? { row: 0, col: along, dir: "S" }
      : edge === 1
        ? { row: size - 1, col: along, dir: "N" }
        : edge === 2
          ? { row: along, col: 0, dir: "E" }
          : { row: along, col: size - 1, dir: "W" };

  const numTurns = MIN_TURNS + Math.floor(rng() * TURNS_RANGE);

  const visited = new Set<string>([key(emitter)]);
  const turns: Turn[] = [];
  let pos: Point = { row: emitter.row, col: emitter.col };
  let dir: Direction = emitter.dir;

  for (let t = 0; t < numTurns; t++) {
    const maxSteps = maxStepsInBounds(pos, dir, size);
    if (maxSteps < 1) return null;

    let landed: Point | null = null;
    const triedSteps = new Set<number>();
    while (triedSteps.size < maxSteps) {
      const steps = 1 + Math.floor(rng() * maxSteps);
      if (triedSteps.has(steps)) continue;
      triedSteps.add(steps);

      const [dr, dc] = DIR_VECTORS[dir];
      const segment: Point[] = [];
      let collided = false;
      for (let s = 1; s <= steps; s++) {
        const cell = { row: pos.row + dr * s, col: pos.col + dc * s };
        if (visited.has(key(cell))) {
          collided = true;
          break;
        }
        segment.push(cell);
      }
      if (collided) continue;

      for (const cell of segment) visited.add(key(cell));
      landed = segment[segment.length - 1]!;
      break;
    }
    if (!landed) return null;

    const [optionA, optionB] = PERPENDICULAR[dir];
    const newDir = rng() < 0.5 ? optionA : optionB;
    turns.push({ row: landed.row, col: landed.col, orientation: orientationForTurn(dir, newDir) });
    pos = landed;
    dir = newDir;
  }

  // Final leg: walk forward from the last turn and drop the target on a
  // fresh cell — this is where the beam is meant to come to rest.
  const maxSteps = maxStepsInBounds(pos, dir, size);
  if (maxSteps < 1) return null;

  let target: Point | null = null;
  const triedSteps = new Set<number>();
  while (triedSteps.size < maxSteps) {
    const steps = 1 + Math.floor(rng() * maxSteps);
    if (triedSteps.has(steps)) continue;
    triedSteps.add(steps);

    const [dr, dc] = DIR_VECTORS[dir];
    const segment: Point[] = [];
    let collided = false;
    for (let s = 1; s <= steps; s++) {
      const cell = { row: pos.row + dr * s, col: pos.col + dc * s };
      if (visited.has(key(cell))) {
        collided = true;
        break;
      }
      segment.push(cell);
    }
    if (collided) continue;
    target = segment[segment.length - 1]!;
    break;
  }
  if (!target) return null;

  return { emitter, size, turns, target };
}

function buildLevel(walk: Walk): MirrorLevel | null {
  const { emitter, size, turns, target } = walk;

  // The solution grid: every turn cell holds the orientation the walk
  // actually needs. Verify it independently with traceBeam before we trust
  // it — this catches any modeling mistake between the walk and the tracer.
  const solution: CellContent[][] = emptyGrid(size);
  for (const turn of turns) solution[turn.row]![turn.col] = turn.orientation;
  const check = traceBeam(size, solution, emitter, target);
  if (!check.reachesTarget) return null;

  // The level the player sees: every mirror on the route starts flipped to
  // its *wrong* orientation, so the board opens unsolved and every mirror
  // needs exactly one click to route the beam home.
  const mirrors: CellContent[][] = emptyGrid(size);
  for (const turn of turns) mirrors[turn.row]![turn.col] = toggleOrientation(turn.orientation);

  // Scrambling every mirror should always misroute the beam at the very
  // first turn it hits — but double-check, in case some other path through
  // the flipped mirrors coincidentally still lands on the target. If so,
  // discard this candidate rather than hand the player an already-solved
  // board.
  if (traceBeam(size, mirrors, emitter, target).reachesTarget) return null;

  return { size, emitter, target, mirrors };
}

/**
 * Generate a fresh, guaranteed-solvable Mirror level. Deterministic: the
 * same seed always produces the same level. Internally this may retry a
 * few times against the same rng stream if a candidate route paints itself
 * into a corner (self-intersects before placing every turn/target) — still
 * fully determined by `seed`.
 */
export function generateLevel(seed: number): MirrorLevel {
  const rng = mulberry32(seed);
  const MAX_ATTEMPTS = 500;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const walk = tryWalk(rng);
    if (!walk) continue;
    const level = buildLevel(walk);
    if (level) return level;
  }
  throw new Error(`generateLevel: failed to construct a solvable level for seed ${seed}`);
}
