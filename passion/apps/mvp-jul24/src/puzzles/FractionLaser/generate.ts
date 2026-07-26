// Procedural level generator for Fraction Laser — an unlimited supply of
// fresh boards, every one provably solvable and provably solvable in exactly
// one way.
//
// Algorithm, and it is deliberately Mirror's algorithm with one extra
// dimension. Mirror walks a single beam from an edge emitter, planting turns,
// and drops a target where the walk ends; that walk *is* the solution. Here
// the walk forks: at each prism the route splits into a straight beam and a
// side beam, each carrying an exact fraction of what arrived, and each of
// those is walked onward recursively until it runs out of splitter budget and
// ends on a crystal. The crystal's demand is simply the share the walk
// delivered to it, so the demands are an exact partition of one whole beam by
// construction. `claimForward` below is Mirror's segment-claiming step,
// unchanged in substance.
//
// Then, as in Mirror, we scramble: each prism's dial opens on a position that
// is *not* the one the walk used, so the board starts unsolved. Unlike
// Mirror — where a two-state mirror means "flipped" is the only wrong answer
// and the fix is one click each — a dial has three positions, so the player
// has to work out which, not merely notice that something is off.
//
// Finally every candidate is verified before it ships: the demands must total
// exactly 1, the opening board must be unsolved, and `findSolutions` must find
// exactly one solving dial setting. A candidate failing any of those is
// discarded and the generator tries again on the same rng stream.

import {
  type Collector,
  DIR_VECTORS,
  type Dials,
  type Direction,
  type Emitter,
  type Frac,
  type LaserLevel,
  ONE,
  type Point,
  type Side,
  type Splitter,
  branchDirection,
  eqF,
  findSolutions,
  frac,
  initialDials,
  isSolved,
  mulF,
  requiredTotal,
  subF,
} from "./logic";

/** Deterministic PRNG (mulberry32) — same seed always produces the same stream. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Difficulty rungs, 0 (easiest) .. MAX_DIFFICULTY. */
export const MAX_DIFFICULTY = 2;

/**
 * Difficulty is tuned on three dials at once, all of them mathematical
 * rather than cosmetic:
 *
 *  - how many prisms there are, which sets how deep a product the player has
 *    to unwind (2, 3, then 4);
 *  - which fractions the prisms can be set to, which sets how familiar the
 *    arithmetic is (halves and thirds, then quarters, then fifths);
 *  - and the board size, only so the extra prisms have somewhere to go.
 *
 * The denominator cap is the legibility brake. Nothing stops 1/4 of 1/4 of
 * 1/4 arithmetically, but /64 on a crystal is a wall of digits rather than a
 * thought, so candidates whose demands get uglier than the rung allows are
 * thrown away and re-rolled.
 */
const POOLS: readonly (readonly Frac[])[] = [
  [frac(1, 2), frac(1, 3), frac(2, 3)],
  [frac(1, 2), frac(1, 3), frac(2, 3), frac(1, 4), frac(3, 4)],
  [frac(1, 2), frac(1, 3), frac(2, 3), frac(1, 4), frac(3, 4), frac(2, 5), frac(3, 5)],
];
const MAX_DENOMINATOR: readonly number[] = [12, 24, 45];
/**
 * Board side length per rung, as [smallest, largest]. Sized to the optics
 * rather than to the rung number: a balanced four-prism tree is compact, so
 * the 8x8 an earlier version handed out at the top rung was three empty rows
 * of nothing and read as a mistake.
 */
const SIZES: ReadonlyArray<readonly [number, number]> = [
  [5, 6],
  [6, 7],
  [6, 7],
];
const DIAL_SIZE = 3;
const MAX_ATTEMPTS = 800;

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

interface PlacedSplitter extends Point {
  side: Side;
  /** The share this prism must send straight on in the *solution*. */
  frac: Frac;
}

interface Layout {
  size: number;
  emitter: Emitter;
  splitters: PlacedSplitter[];
  collectors: Array<Point & { value: Frac }>;
}

/**
 * How to divide the remaining prism budget between a fork's two beams.
 * Biased hard toward an even split, because depth — not prism count — is
 * what multiplies denominators: four prisms in a chain can reach /81, four
 * in a balanced tree rarely pass /12.
 */
function balancedSplit(rng: () => number, rest: number): number {
  if (rest <= 1) return rest === 0 ? 0 : rng() < 0.5 ? 0 : 1;
  if (rng() < 0.75) return rng() < 0.5 ? Math.floor(rest / 2) : Math.ceil(rest / 2);
  return Math.floor(rng() * (rest + 1));
}

/**
 * Try to lay one candidate optics tree onto the grid. Returns null if the
 * walk paints itself into a corner (a beam with nowhere fresh to go) — the
 * caller just retries against the same, still-advancing, rng stream, exactly
 * as Mirror's generator does.
 */
function tryLayout(rng: () => number, difficulty: number): Layout | null {
  const [minSize, maxSize] = SIZES[difficulty]!;
  const size = minSize + Math.floor(rng() * (maxSize - minSize + 1));
  const budget = 2 + difficulty;
  const pool = POOLS[difficulty]!;

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

  const visited = new Set<string>([key(emitter)]);
  const splitters: PlacedSplitter[] = [];
  const collectors: Array<Point & { value: Frac }> = [];

  /** Walk 1..maxSteps forward onto fresh cells, claim them, and land on the last. */
  function claimForward(pos: Point, dir: Direction): Point | null {
    const maxSteps = maxStepsInBounds(pos, dir, size);
    if (maxSteps < 1) return null;
    const tried = new Set<number>();
    while (tried.size < maxSteps) {
      const steps = 1 + Math.floor(rng() * maxSteps);
      if (tried.has(steps)) continue;
      tried.add(steps);

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
      return segment[segment.length - 1]!;
    }
    return null;
  }

  function place(pos: Point, dir: Direction, value: Frac, remaining: number): boolean {
    const cell = claimForward(pos, dir);
    if (!cell) return false;

    if (remaining === 0) {
      collectors.push({ row: cell.row, col: cell.col, value });
      return true;
    }

    const side: Side = rng() < 0.5 ? "left" : "right";
    const f = pool[Math.floor(rng() * pool.length)]!;
    splitters.push({ row: cell.row, col: cell.col, side, frac: f });

    const straightBudget = balancedSplit(rng, remaining - 1);
    const straight = mulF(value, f);
    if (!place(cell, dir, straight, straightBudget)) return false;
    return place(
      cell,
      branchDirection(dir, side),
      subF(value, straight),
      remaining - 1 - straightBudget,
    );
  }

  if (!place({ row: emitter.row, col: emitter.col }, emitter.dir, ONE, budget)) return null;
  return { size, emitter, splitters, collectors };
}

/**
 * The dial each prism opens with: the answer, its complement, and a filler.
 *
 * The complement is the sharp distractor — it is the *other* part of the same
 * split, so choosing it is precisely the mistake of sending the two shares
 * out the wrong ports, and it leaves the total at 1 while putting the wrong
 * amount in every crystal downstream. A player who is only checking "do the
 * parts add up" cannot tell it from the answer; a player who is tracking
 * where each part *goes* can.
 */
function buildDial(rng: () => number, correct: Frac, pool: readonly Frac[]): Frac[] {
  const options: Frac[] = [correct];
  const complement = subF(ONE, correct);
  if (!eqF(complement, correct)) options.push(complement);

  const spare = pool.filter((p) => !options.some((o) => eqF(o, p)));
  while (options.length < DIAL_SIZE && spare.length > 0) {
    options.push(spare.splice(Math.floor(rng() * spare.length), 1)[0]!);
  }

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j]!, options[i]!];
  }
  return options;
}

function buildLevel(layout: Layout, rng: () => number, difficulty: number): LaserLevel | null {
  const cap = MAX_DENOMINATOR[difficulty]!;
  if (layout.collectors.some((c) => c.value.d > cap)) return null;

  const pool = POOLS[difficulty]!;
  const splitters: Splitter[] = layout.splitters.map((s) => {
    const options = buildDial(rng, s.frac, pool);
    const solutionIndex = options.findIndex((o) => eqF(o, s.frac));
    // Open on any position but the solving one, so the board starts unsolved.
    let start = Math.floor(rng() * (options.length - 1));
    if (start >= solutionIndex) start += 1;
    return { row: s.row, col: s.col, side: s.side, options, start };
  });

  const collectors: Collector[] = layout.collectors.map((c) => ({
    row: c.row,
    col: c.col,
    required: c.value,
  }));

  const level: LaserLevel = { size: layout.size, emitter: layout.emitter, splitters, collectors };

  // Verification. The walk above should make all three of these true by
  // construction; checking them anyway is what catches a modeling mistake
  // between the walk and the tracer, the same belt-and-suspenders Mirror's
  // generator applies with its own traceBeam re-check.
  if (!eqF(requiredTotal(level), ONE)) return null;
  if (isSolved(level, initialDials(level))) return null;
  if (findSolutions(level, 2).length !== 1) return null;

  return level;
}

/**
 * Generate a fresh Fraction Laser level whose crystals' demands are an exact
 * partition of one whole beam, and which exactly one dial setting solves.
 *
 * Deterministic: the same (seed, difficulty) always produces the same level.
 *
 * @param difficulty 0..MAX_DIFFICULTY; clamped.
 */
export function generateLevel(seed: number, difficulty = 0): LaserLevel {
  const rung = Math.max(0, Math.min(MAX_DIFFICULTY, Math.floor(difficulty)));
  const rng = mulberry32(seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const layout = tryLayout(rng, rung);
    if (!layout) continue;
    const level = buildLevel(layout, rng, rung);
    if (level) return level;
  }
  throw new Error(`generateLevel: no solvable level for seed ${seed} at difficulty ${rung}`);
}

/** The one dial setting that solves `level`. Throws if the level is malformed. */
export function solutionFor(level: LaserLevel): Dials {
  const solutions = findSolutions(level, 2);
  if (solutions.length !== 1) {
    throw new Error(`solutionFor: expected exactly 1 solution, found ${solutions.length}`);
  }
  return solutions[0]!;
}
