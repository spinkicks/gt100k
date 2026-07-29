// Pipes ("Net"-style connectivity puzzle): rotate tiles until the source
// pipe connects, through matching openings, to every endpoint.

// The app's one seeded PRNG. Its exact arithmetic decides how every board is scrambled, so see the
// warning in src/lib/rng.ts before touching it.
import { mulberry32 } from "../../lib/rng";

/** Bit flags for the four cardinal openings a tile can have. */
export const DIR = { N: 1, E: 2, S: 4, W: 8 } as const;

const OPPOSITE: Record<number, number> = {
  [DIR.N]: DIR.S,
  [DIR.E]: DIR.W,
  [DIR.S]: DIR.N,
  [DIR.W]: DIR.E,
};

/** Neighbor offsets paired with (opening tile needs, opening neighbor needs). */
const NEIGHBORS: Array<[dr: number, dc: number, need: number]> = [
  [-1, 0, DIR.N],
  [0, 1, DIR.E],
  [1, 0, DIR.S],
  [0, -1, DIR.W],
];

export type TileKind = "blank" | "cap" | "straight" | "elbow" | "t" | "cross";

/** Canonical (rotation = 0) opening mask for each tile shape. */
const BASE_MASK: Record<TileKind, number> = {
  blank: 0,
  cap: DIR.E,
  straight: DIR.E | DIR.W,
  elbow: DIR.N | DIR.E,
  t: DIR.N | DIR.E | DIR.S,
  cross: DIR.N | DIR.E | DIR.S | DIR.W,
};

/** Rotate an opening mask 90° clockwise (N->E->S->W->N). */
export function rotateMaskCW(mask: number): number {
  return ((mask << 1) | (mask >> 3)) & 0b1111;
}

/** The opening mask of a tile shape after `rotation` clockwise quarter-turns. */
export function maskAt(kind: TileKind, rotation: number): number {
  let m = BASE_MASK[kind];
  const steps = ((rotation % 4) + 4) % 4;
  for (let i = 0; i < steps; i++) m = rotateMaskCW(m);
  return m;
}

/** Level authoring shape: the tile kind + the rotation that solves it. */
export interface TileSpec {
  kind: TileKind;
  /** Clockwise quarter-turns from the canonical shape to the *solved* orientation. */
  solvedRotation: number;
  isSource?: boolean;
  isEndpoint?: boolean;
}

/** A live grid tile: shape + its current (possibly shuffled) rotation. */
export interface Tile extends TileSpec {
  rotation: number;
}

export type Level = TileSpec[][];
export type Grid = Tile[][];

export function tileMask(tile: Tile): number {
  return maskAt(tile.kind, tile.rotation);
}

/** Build a shuffled starting grid for `level`, deterministic from `seed`. */
export function makeGrid(level: Level, seed: number): Grid {
  const rng = mulberry32(seed);
  return level.map((row) =>
    row.map((spec) => {
      if (spec.kind === "blank") return { ...spec, rotation: 0 };
      // Offset of 1-3 guarantees the tile starts off its solved orientation
      // (unless the shape is rotation-symmetric, e.g. "cross").
      const offset = 1 + Math.floor(rng() * 3);
      return { ...spec, rotation: (spec.solvedRotation + offset) % 4 };
    }),
  );
}

/** Rotate the tile at (r, c) one quarter-turn clockwise. Blank tiles are inert. */
export function rotateTile(grid: Grid, r: number, c: number): Grid {
  return grid.map((row, ri) =>
    ri !== r
      ? row
      : row.map((tile, ci) =>
          ci !== c || tile.kind === "blank" ? tile : { ...tile, rotation: (tile.rotation + 1) % 4 },
        ),
  );
}

const key = (r: number, c: number): string => `${r},${c}`;

/** Flood-fill from the source through matching openings; returns the powered cell keys. */
export function computePowered(grid: Grid): Set<string> {
  const powered = new Set<string>();
  const rows = grid.length;
  let source: [number, number] | null = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < (grid[r]?.length ?? 0); c++) {
      if (grid[r]?.[c]?.isSource) source = [r, c];
    }
  }
  if (!source) return powered;

  powered.add(key(source[0], source[1]));
  const queue: Array<[number, number]> = [source];
  while (queue.length) {
    const [r, c] = queue.shift()!;
    const mask = tileMask(grid[r]![c]!);
    for (const [dr, dc, need] of NEIGHBORS) {
      if (!(mask & need)) continue;
      const nr = r + dr;
      const nc = c + dc;
      const neighbor = grid[nr]?.[nc];
      if (!neighbor) continue;
      const nmask = tileMask(neighbor);
      if (!(nmask & OPPOSITE[need]!)) continue;
      const k = key(nr, nc);
      if (powered.has(k)) continue;
      powered.add(k);
      queue.push([nr, nc]);
    }
  }
  return powered;
}

/** Solved when the source's connected flow reaches every endpoint. */
export function isSolved(grid: Grid): boolean {
  const powered = computePowered(grid);
  let sawEndpoint = false;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r]!.length; c++) {
      const tile = grid[r]![c]!;
      if (tile.isEndpoint) {
        sawEndpoint = true;
        if (!powered.has(key(r, c))) return false;
      }
    }
  }
  return sawEndpoint;
}
