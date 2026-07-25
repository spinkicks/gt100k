// Procedural Pipes level generator: gives the subgame effectively unlimited
// levels instead of the 3 hand-authored ones in levels.data.ts.
//
// Algorithm: grow a random spanning tree over a size x size grid using
// randomized Prim's algorithm, starting from a random source cell and
// stopping once a random fraction of the grid is covered (unvisited cells
// stay "blank", so the network snakes through the board like the
// hand-authored levels do). Each visited cell's tile shape + solvedRotation
// is derived directly from which of its 4 sides carry a tree edge. Because
// the *unscrambled* result is, by construction, a single connected network
// from the source to every leaf (endpoint), every generated Level is
// solvable. logic.ts's existing makeGrid(level, seed) does the actual
// rotation-scrambling for play, exactly as it already does for
// levels.data.ts's hand-authored levels.
import { DIR, type Level, type TileKind, type TileSpec, maskAt } from "./logic";

/** Difficulty presets: grid side length (size x size board). */
export const EASY_SIZE = 4;
export const HARD_SIZE = 6;

/** Deterministic PRNG (mulberry32). Kept local to this module — the
 * generator only depends on logic.ts's public (kind, rotation) <-> mask API. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministically combine a base seed with a "which puzzle this session"
 * counter, so the same `seed` prop stays reproducible for tests while a
 * bumped counter (e.g. from a "Next puzzle" click) always yields a
 * different generated level. */
export function nextSeed(seed: number, counter: number): number {
  return (Math.imul(seed ^ 0x9e3779b9, counter + 1) + counter * 0x2545f491) >>> 0;
}

/** Neighbor offsets paired with (this cell's opening bit, neighbor's opening bit). */
const DIRS: Array<[dr: number, dc: number, bit: number, oppositeBit: number]> = [
  [-1, 0, DIR.N, DIR.S],
  [0, 1, DIR.E, DIR.W],
  [1, 0, DIR.S, DIR.N],
  [0, -1, DIR.W, DIR.E],
];

function popcount(mask: number): number {
  let n = 0;
  for (let m = mask; m; m >>= 1) n += m & 1;
  return n;
}

/** Find the (kind, rotation) whose canonical mask equals `mask` exactly.
 * Every mask produced by the spanning-tree builder below has 1-4 bits set,
 * and BASE_MASK's five shapes rotated 0-3 times cover all 15 such patterns. */
function tileForMask(mask: number): { kind: TileKind; solvedRotation: number } {
  const candidates: TileKind[] = ["cap", "straight", "elbow", "t", "cross"];
  for (const kind of candidates) {
    for (let rotation = 0; rotation < 4; rotation++) {
      if (maskAt(kind, rotation) === mask) return { kind, solvedRotation: rotation };
    }
  }
  throw new Error(`Pipes generator: no tile shape matches mask ${mask}`);
}

/**
 * Generate a fresh, guaranteed-solvable Pipes level.
 *
 * @param seed deterministic PRNG seed — same seed + size always produces the
 *   same level.
 * @param size grid side length; use EASY_SIZE (4) or HARD_SIZE (6) for the
 *   two supported difficulties (default EASY_SIZE).
 */
export function generateLevel(seed: number, size: number = EASY_SIZE): Level {
  const rng = mulberry32(seed);
  const rows = size;
  const cols = size;

  const sourceR = Math.floor(rng() * rows);
  const sourceC = Math.floor(rng() * cols);

  const masks: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  const visited: boolean[][] = Array.from({ length: rows }, () =>
    new Array<boolean>(cols).fill(false),
  );
  visited[sourceR]![sourceC] = true;
  let visitedCount = 1;

  interface Edge {
    r: number;
    c: number;
    nr: number;
    nc: number;
    bit: number;
    oppositeBit: number;
  }
  const frontier: Edge[] = [];

  const pushFrontier = (r: number, c: number) => {
    for (const [dr, dc, bit, oppositeBit] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (visited[nr]![nc]) continue;
      frontier.push({ r, c, nr, nc, bit, oppositeBit });
    }
  };
  pushFrontier(sourceR, sourceC);

  // Cover a random 40%-100% of the grid so the network snakes through some
  // blank tiles instead of always filling every cell.
  const totalCells = rows * cols;
  const minCells = Math.min(totalCells, Math.max(4, Math.ceil(totalCells * 0.4)));
  const targetCells = Math.min(
    totalCells,
    minCells + Math.floor(rng() * (totalCells - minCells + 1)),
  );

  // Randomized Prim's algorithm: repeatedly grow the tree across a random
  // frontier edge. This can never introduce a cycle (each step claims a
  // previously-unvisited cell) and, since the full grid graph is connected,
  // the frontier only empties once every cell has been visited — so it's
  // always able to reach targetCells.
  while (frontier.length > 0 && visitedCount < targetCells) {
    const idx = Math.floor(rng() * frontier.length);
    const edge = frontier[idx]!;
    frontier.splice(idx, 1);
    if (visited[edge.nr]![edge.nc]) continue; // stale: neighbor claimed by another edge since

    const fromRow = masks[edge.r]!;
    fromRow[edge.c] = fromRow[edge.c]! | edge.bit;
    const toRow = masks[edge.nr]!;
    toRow[edge.nc] = toRow[edge.nc]! | edge.oppositeBit;
    visited[edge.nr]![edge.nc] = true;
    visitedCount++;
    pushFrontier(edge.nr, edge.nc);
  }

  const level: Level = [];
  for (let r = 0; r < rows; r++) {
    const row: TileSpec[] = [];
    for (let c = 0; c < cols; c++) {
      const isSource = r === sourceR && c === sourceC;
      if (!visited[r]![c]) {
        row.push({ kind: "blank", solvedRotation: 0 });
        continue;
      }
      const mask = masks[r]![c]!;
      const { kind, solvedRotation } = tileForMask(mask);
      // A tree leaf (exactly one tree edge) that isn't the source is a dead
      // end for the flow: mark it as an endpoint the player must reach.
      const isLeaf = popcount(mask) === 1;
      const spec: TileSpec = { kind, solvedRotation };
      if (isSource) spec.isSource = true;
      if (isLeaf && !isSource) spec.isEndpoint = true;
      row.push(spec);
    }
    level.push(row);
  }

  return level;
}
