// Pure logic for Fraction Laser: exact rational arithmetic, the grid model,
// and beam tracing through fraction splitters. Level construction lives in
// ./generate.ts. No React/DOM here so it can be unit-tested in isolation.
//
// This file is deliberately the same shape as ../Mirror/logic.ts — same
// Direction / Point / Emitter vocabulary, same DIR_VECTORS table, same
// trace -> isSolved pairing, same immutable "apply a click, get a new state"
// helper. Mirror Maze and Fraction Laser are the twin pair described in
// PROJECT.md: the shell is held literally constant and only the *content
// binding* changes, from spatial reflection to fractional quantity. Keeping
// the two logic modules structurally parallel is what makes that claim true
// of the code and not just of the screenshots.
//
// Where Mirror's beam carries nothing but a direction, this one carries a
// share of the original beam as an exact rational. Everything downstream
// (solving, verification, the generator) uses that exact arithmetic — never
// floating point — because the whole puzzle is the claim "these parts add up
// to exactly one whole", and 1/3 + 1/3 + 1/3 does not equal 1 in a double.

export type Direction = "N" | "S" | "E" | "W";

/** Which way a splitter's branch beam leaves, relative to the beam's travel direction. */
export type Side = "left" | "right";

export interface Point {
  row: number;
  col: number;
}

export interface Emitter extends Point {
  dir: Direction;
}

/* ------------------------------------------------------------------ *
 * Exact rational arithmetic
 * ------------------------------------------------------------------ */

/** A rational number, always stored normalized: `d > 0` and gcd(|n|, d) === 1. */
export interface Frac {
  readonly n: number;
  readonly d: number;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** Build a normalized fraction. Throws on a zero denominator. */
export function frac(n: number, d: number): Frac {
  if (d === 0) throw new Error("frac: zero denominator");
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d) || 1;
  return { n: (sign * n) / g, d: (sign * d) / g };
}

export const ZERO: Frac = { n: 0, d: 1 };
export const ONE: Frac = { n: 1, d: 1 };

export function addF(a: Frac, b: Frac): Frac {
  return frac(a.n * b.d + b.n * a.d, a.d * b.d);
}

export function subF(a: Frac, b: Frac): Frac {
  return frac(a.n * b.d - b.n * a.d, a.d * b.d);
}

export function mulF(a: Frac, b: Frac): Frac {
  return frac(a.n * b.n, a.d * b.d);
}

/** Exact equality. Safe as a plain field compare because every Frac is normalized. */
export function eqF(a: Frac, b: Frac): boolean {
  return a.n === b.n && a.d === b.d;
}

/** "1/3", or a bare "1" / "0" for the whole and the empty beam. */
export function fracText(f: Frac): string {
  return f.d === 1 ? `${f.n}` : `${f.n}/${f.d}`;
}

/* ------------------------------------------------------------------ *
 * Grid model
 * ------------------------------------------------------------------ */

/** Unit step for each direction. Same table as Mirror's, on purpose. */
export const DIR_VECTORS: Record<Direction, [number, number]> = {
  N: [-1, 0],
  S: [1, 0],
  E: [0, 1],
  W: [0, -1],
};

const LEFT_OF: Record<Direction, Direction> = { N: "W", S: "E", E: "N", W: "S" };
const RIGHT_OF: Record<Direction, Direction> = { N: "E", S: "W", E: "S", W: "N" };

/** The direction a splitter's branch beam leaves in, given the incoming heading. */
export function branchDirection(dir: Direction, side: Side): Direction {
  return side === "left" ? LEFT_OF[dir] : RIGHT_OF[dir];
}

/**
 * A prism the player tunes. It always sends `options[dial]` of whatever
 * arrives straight ahead and the remaining `1 - options[dial]` out of its
 * `side` port — so the two parts add up to exactly what came in, whatever
 * the dial says. That conservation is the rule of the puzzle; the dial only
 * chooses *how* the whole is divided, never whether it is.
 *
 * The geometry (`row`, `col`, `side`) is fixed by the level. Only the dial
 * moves. This is the structural difference from Mirror, where the click
 * changes where the beam goes: here the click changes only how much.
 */
export interface Splitter extends Point {
  side: Side;
  /** Dial positions in click order. Exactly one of them solves the board. */
  options: Frac[];
  /** The dial position the board opens on — never the solving one. */
  start: number;
}

/** A crystal that must receive an exact share of the original beam. */
export interface Collector extends Point {
  required: Frac;
}

export interface LaserLevel {
  size: number;
  emitter: Emitter;
  splitters: Splitter[];
  collectors: Collector[];
}

/** One dial position per splitter, parallel to `level.splitters`. */
export type Dials = number[];

export function cellKey(p: Point): string {
  return `${p.row},${p.col}`;
}

export function initialDials(level: LaserLevel): Dials {
  return level.splitters.map((s) => s.start);
}

/** Advance (or reverse) one splitter's dial, wrapping. Returns a new array. */
export function cycleDial(level: LaserLevel, dials: Dials, index: number, step = 1): Dials {
  const splitter = level.splitters[index];
  if (!splitter) return dials;
  const count = splitter.options.length;
  return dials.map((v, i) => (i === index ? (((v + step) % count) + count) % count : v));
}

/* ------------------------------------------------------------------ *
 * Beam tracing
 * ------------------------------------------------------------------ */

export interface BeamSegment {
  from: Point;
  to: Point;
  /** The share of the original beam this run of light carries. */
  value: Frac;
}

export interface SplitterFlow {
  incoming: Frac;
  straight: Frac;
  branch: Frac;
  /** Heading of the beam arriving here, and of the part leaving the side port. */
  incomingDir: Direction;
  branchDir: Direction;
}

export interface TraceResult {
  segments: BeamSegment[];
  /** Cell key -> the exact share arriving at that collector. Missing = nothing arrives. */
  delivered: Map<string, Frac>;
  /** Cell key -> the three quantities at that splitter, for display. */
  flows: Map<string, SplitterFlow>;
}

/**
 * Trace the whole tree of light from the emitter, splitting at every prism,
 * until each branch reaches a crystal or leaves the grid.
 *
 * Note the property that makes this puzzle purely arithmetic: the *geometry*
 * of the result never depends on `dials`. Where the light goes is fixed by
 * the level; only how much of it goes each way changes. See the swap-test
 * note in the header — strip the fractions and there is no puzzle left,
 * because there would be nothing to choose.
 *
 * The `seen` set is a termination guard for hand-built levels (a generated
 * level's optics are always a tree, so it never fires there).
 */
export function traceBeams(level: LaserLevel, dials: Dials): TraceResult {
  const splitterAt = new Map<string, { splitter: Splitter; index: number }>();
  level.splitters.forEach((s, i) => splitterAt.set(cellKey(s), { splitter: s, index: i }));
  const collectorAt = new Map<string, Collector>();
  for (const c of level.collectors) collectorAt.set(cellKey(c), c);

  const segments: BeamSegment[] = [];
  const delivered = new Map<string, Frac>();
  const flows = new Map<string, SplitterFlow>();

  const seen = new Set<string>();
  const stack: Array<{ from: Point; dir: Direction; value: Frac }> = [
    {
      from: { row: level.emitter.row, col: level.emitter.col },
      dir: level.emitter.dir,
      value: ONE,
    },
  ];

  while (stack.length > 0) {
    const ray = stack.pop()!;
    const rayKey = `${ray.from.row},${ray.from.col},${ray.dir}`;
    if (seen.has(rayKey)) continue;
    seen.add(rayKey);

    const [dr, dc] = DIR_VECTORS[ray.dir];
    let row = ray.from.row;
    let col = ray.from.col;

    while (true) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= level.size || nc < 0 || nc >= level.size) break; // off the grid
      row = nr;
      col = nc;
      const here = `${row},${col}`;

      const collector = collectorAt.get(here);
      if (collector) {
        delivered.set(here, addF(delivered.get(here) ?? ZERO, ray.value));
        break;
      }

      const hit = splitterAt.get(here);
      if (hit) {
        const f = hit.splitter.options[dials[hit.index] ?? hit.splitter.start] ?? ONE;
        const straight = mulF(ray.value, f);
        const branch = subF(ray.value, straight);
        const branchDir = branchDirection(ray.dir, hit.splitter.side);
        flows.set(here, {
          incoming: ray.value,
          straight,
          branch,
          incomingDir: ray.dir,
          branchDir,
        });
        stack.push({ from: { row, col }, dir: ray.dir, value: straight });
        stack.push({ from: { row, col }, dir: branchDir, value: branch });
        break;
      }
    }

    segments.push({ from: ray.from, to: { row, col }, value: ray.value });
  }

  return { segments, delivered, flows };
}

/** Every crystal receives exactly — not approximately — the share written on it. */
export function isSolved(level: LaserLevel, dials: Dials): boolean {
  const { delivered } = traceBeams(level, dials);
  if (delivered.size !== level.collectors.length) return false;
  return level.collectors.every((c) => {
    const got = delivered.get(cellKey(c));
    return got !== undefined && eqF(got, c.required);
  });
}

/** The crystals' demands added up. A well-formed level always totals exactly one whole beam. */
export function requiredTotal(level: LaserLevel): Frac {
  return level.collectors.reduce<Frac>((sum, c) => addF(sum, c.required), ZERO);
}

/**
 * Every dial setting that solves the level, up to `limit` of them.
 *
 * Exhaustive over the dial space, which is tiny (at most 3^4 = 81 settings).
 * The generator uses this to *prove* each board it emits has exactly one
 * answer rather than asserting it — the same posture as Nonogram's
 * `solveUnique`. The mathematical argument is that a solution is forced:
 * the share arriving at any prism is the sum of the demands below it, and
 * its dial must be (straight-subtree demand) / (arriving share), which is
 * determined bottom-up. This function checks that argument on every board.
 */
export function findSolutions(level: LaserLevel, limit = 2): Dials[] {
  const counts = level.splitters.map((s) => s.options.length);
  const total = counts.reduce((a, b) => a * b, 1);
  if (total > 100_000) {
    throw new Error(`findSolutions: dial space of ${total} settings is too large to enumerate`);
  }
  const found: Dials[] = [];
  for (let code = 0; code < total; code++) {
    let rest = code;
    const dials = counts.map((n) => {
      const v = rest % n;
      rest = Math.floor(rest / n);
      return v;
    });
    if (isSolved(level, dials)) {
      found.push(dials);
      if (found.length >= limit) break;
    }
  }
  return found;
}
