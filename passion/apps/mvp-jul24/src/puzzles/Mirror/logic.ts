// Pure logic for the Mirror/laser puzzle: grid model, beam tracing, and authored levels.
// No React/DOM here so it can be unit-tested in isolation.

export type Direction = "N" | "S" | "E" | "W";
export type Orientation = "/" | "\\";
/** A cell either holds a rotatable mirror, or is empty floor the beam passes through. */
export type CellContent = Orientation | null;

export interface Point {
  row: number;
  col: number;
}

export interface Emitter extends Point {
  dir: Direction;
}

export interface MirrorLevel {
  size: number;
  emitter: Emitter;
  target: Point;
  /** Initial mirror layout, size x size. Emitter/target cells must be null (no mirror). */
  mirrors: CellContent[][];
}

export interface TraceResult {
  path: Point[];
  reachesTarget: boolean;
}

const DIR_VECTORS: Record<Direction, [number, number]> = {
  N: [-1, 0],
  S: [1, 0],
  E: [0, 1],
  W: [0, -1],
};

// "/" mirror: N<->E, S<->W (a beam going E turns N, going N turns E, etc.)
const SLASH_REFLECT: Record<Direction, Direction> = { N: "E", E: "N", S: "W", W: "S" };
// "\" mirror: N<->W, S<->E
const BACKSLASH_REFLECT: Record<Direction, Direction> = { N: "W", W: "N", S: "E", E: "S" };

function reflect(dir: Direction, orientation: Orientation): Direction {
  return orientation === "/" ? SLASH_REFLECT[dir] : BACKSLASH_REFLECT[dir];
}

/**
 * Trace the beam from the emitter, reflecting off mirrors, until it hits the
 * target, runs off the grid, or loops (guarded against so this always terminates).
 */
export function traceBeam(
  size: number,
  mirrors: CellContent[][],
  emitter: Emitter,
  target: Point,
): TraceResult {
  const path: Point[] = [];
  const visited = new Set<string>();
  let { row, col } = emitter;
  let dir = emitter.dir;

  while (row >= 0 && row < size && col >= 0 && col < size) {
    const key = `${row},${col},${dir}`;
    if (visited.has(key)) break; // looped back on itself
    visited.add(key);

    path.push({ row, col });
    if (row === target.row && col === target.col) {
      return { path, reachesTarget: true };
    }

    const cell = mirrors[row]?.[col] ?? null;
    if (cell) dir = reflect(dir, cell);

    const [dr, dc] = DIR_VECTORS[dir];
    row += dr;
    col += dc;
  }

  return { path, reachesTarget: false };
}

export function isSolved(level: MirrorLevel, mirrors: CellContent[][]): boolean {
  return traceBeam(level.size, mirrors, level.emitter, level.target).reachesTarget;
}

export function cloneMirrors(mirrors: CellContent[][]): CellContent[][] {
  return mirrors.map((row) => [...row]);
}

const toggle = (o: Orientation): Orientation => (o === "/" ? "\\" : "/");

/** Rotate the mirror at (row, col), if there is one. No-op on empty floor cells. */
export function rotateMirror(mirrors: CellContent[][], row: number, col: number): CellContent[][] {
  const cell = mirrors[row]?.[col] ?? null;
  if (!cell) return mirrors;
  return mirrors.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? toggle(cell) : c)) : r,
  );
}

function emptyGrid(size: number): CellContent[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null as CellContent),
  );
}

function gridWith(size: number, mirrorAt: [number, number, Orientation][]): CellContent[][] {
  const g = emptyGrid(size);
  for (const [r, c, o] of mirrorAt) g[r]![c] = o;
  return g;
}

// --- Authored levels -------------------------------------------------------
// Each level's initial mirror orientations are deliberately "wrong" so the
// beam misses the target until the player rotates every mirror on its path.

/** Level 1 — one mirror, one click. */
const LEVEL_1: MirrorLevel = {
  size: 4,
  emitter: { row: 0, col: 0, dir: "E" },
  target: { row: 3, col: 2 },
  mirrors: gridWith(4, [[0, 2, "/"]]), // needs "\" to send the beam south
};

/** Level 2 — two mirrors, an L-shaped route. */
const LEVEL_2: MirrorLevel = {
  size: 5,
  emitter: { row: 0, col: 0, dir: "E" },
  target: { row: 3, col: 4 },
  mirrors: gridWith(5, [
    [0, 2, "/"], // needs "\": E -> S
    [3, 2, "/"], // needs "\": S -> E
  ]),
};

/** Level 3 — three mirrors, a longer zig-zag on a bigger board. */
const LEVEL_3: MirrorLevel = {
  size: 6,
  emitter: { row: 0, col: 0, dir: "E" },
  target: { row: 5, col: 5 },
  mirrors: gridWith(6, [
    [0, 3, "/"], // needs "\": E -> S
    [2, 3, "/"], // needs "\": S -> E
    [2, 5, "/"], // needs "\": E -> S
  ]),
};

export const LEVELS: MirrorLevel[] = [LEVEL_1, LEVEL_2, LEVEL_3];

export function pickLevel(seed: number): MirrorLevel {
  return LEVELS[((seed % LEVELS.length) + LEVELS.length) % LEVELS.length]!;
}
