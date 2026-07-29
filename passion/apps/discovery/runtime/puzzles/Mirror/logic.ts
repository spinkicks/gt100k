// Pure logic for the Mirror/laser puzzle: grid model, mirror reflection, and
// beam tracing. Level construction lives in ./generate.ts.
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

/** Unit step for each direction, shared with the level generator's path walker. */
export const DIR_VECTORS: Record<Direction, [number, number]> = {
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
 * Inverse of `reflect`: which mirror orientation turns a beam travelling
 * `from` into travelling `to`? Used by the generator, which builds a route
 * turn-by-turn and needs to know which glyph realizes each turn.
 * Throws if `to` isn't one of the two directions perpendicular to `from`
 * (i.e. no single mirror can produce that turn).
 */
export function orientationForTurn(from: Direction, to: Direction): Orientation {
  if (SLASH_REFLECT[from] === to) return "/";
  if (BACKSLASH_REFLECT[from] === to) return "\\";
  throw new Error(`no mirror orientation turns ${from} into ${to}`);
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

export const toggleOrientation = (o: Orientation): Orientation => (o === "/" ? "\\" : "/");

/** Rotate the mirror at (row, col), if there is one. No-op on empty floor cells. */
export function rotateMirror(mirrors: CellContent[][], row: number, col: number): CellContent[][] {
  const cell = mirrors[row]?.[col] ?? null;
  if (!cell) return mirrors;
  return mirrors.map((r, ri) =>
    ri === row ? r.map((c, ci) => (ci === col ? toggleOrientation(cell) : c)) : r,
  );
}

/** An empty size x size mirror grid (no mirrors placed). Shared with the generator. */
export function emptyGrid(size: number): CellContent[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null as CellContent),
  );
}
