export const DEFAULT_WIDTH = 9;
export const DEFAULT_HEIGHT = 9;
export const DEFAULT_MINES = 10;

export interface Board {
  width: number;
  height: number;
  mineCount: number;
  seed: number;
  /** true where a mine sits. */
  mines: boolean[][];
  /** adjacent-mine count per cell (0-8), meaningless where mines[r][c] is true. */
  adjacent: number[][];
  revealed: boolean[][];
  flagged: boolean[][];
  /** true until the very first reveal — used for first-click-safety. */
  firstClick: boolean;
  /** true once a mine has been revealed (game over / loss). */
  exploded: boolean;
}

/** Deterministic PRNG (mulberry32) — same seed always produces the same stream. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGrid<T>(width: number, height: number, value: T): T[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => value));
}

function inBounds(width: number, height: number, r: number, c: number): boolean {
  return r >= 0 && r < height && c >= 0 && c < width;
}

export function neighbors(r: number, c: number, width: number, height: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (inBounds(width, height, nr, nc)) out.push([nr, nc]);
    }
  }
  return out;
}

/** Adjacent-mine count for every cell, derived purely from a mine layout. */
export function computeAdjacent(mines: boolean[][]): number[][] {
  const height = mines.length;
  const width = mines[0]?.length ?? 0;
  return mines.map((row, r) =>
    row.map((_, c) => neighbors(r, c, width, height).filter(([nr, nc]) => mines[nr]![nc]).length),
  );
}

function key(r: number, c: number): string {
  return `${r},${c}`;
}

/**
 * Places `mineCount` mines pseudo-randomly (seeded) across the grid, skipping
 * any cell in `avoid`. Falls back to using the full grid if avoiding would
 * leave too few candidate cells (e.g. a tiny test board).
 */
function placeMines(
  seed: number,
  width: number,
  height: number,
  mineCount: number,
  avoid: Set<string>,
): boolean[][] {
  const rng = mulberry32(seed);
  const all: [number, number][] = [];
  for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) all.push([r, c]);

  const candidates = all.filter(([r, c]) => !avoid.has(key(r, c)));
  const pool = candidates.length >= mineCount ? candidates : all;

  // Seeded Fisher-Yates shuffle.
  const shuffled = pool.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }

  const mines = makeGrid(width, height, false);
  for (let i = 0; i < mineCount && i < shuffled.length; i++) {
    const [r, c] = shuffled[i]!;
    mines[r]![c] = true;
  }
  return mines;
}

export function makeBoard(
  seed: number,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  mineCount = DEFAULT_MINES,
): Board {
  const mines = placeMines(seed, width, height, mineCount, new Set());
  return {
    width,
    height,
    mineCount,
    seed,
    mines,
    adjacent: computeAdjacent(mines),
    revealed: makeGrid(width, height, false),
    flagged: makeGrid(width, height, false),
    firstClick: true,
    exploded: false,
  };
}

/** Reset the same puzzle (same seed) — used by "try again" after a loss. */
export function resetBoard(board: Board): Board {
  return makeBoard(board.seed, board.width, board.height, board.mineCount);
}

/** Reveal a cell, flood-filling connected zero-regions. Pure — returns a new Board. */
export function reveal(board: Board, r: number, c: number): Board {
  if (board.exploded) return board;
  if (!inBounds(board.width, board.height, r, c)) return board;
  if (board.revealed[r]![c] || board.flagged[r]![c]) return board;

  let mines = board.mines;
  let adjacent = board.adjacent;

  if (board.firstClick && mines[r]![c]) {
    // First-click-safety: regenerate the mine layout, keeping the clicked
    // cell and its neighborhood clear, so the very first click never loses.
    const neighborhoodAvoid = new Set<string>([
      key(r, c),
      ...neighbors(r, c, board.width, board.height).map(([nr, nc]) => key(nr, nc)),
    ]);
    // On tiny boards the clicked cell's neighborhood can cover the whole
    // grid, leaving nowhere to put the mine(s). Fall back to guaranteeing
    // just the clicked cell itself is safe in that case.
    const totalCells = board.width * board.height;
    const avoid =
      totalCells - neighborhoodAvoid.size >= board.mineCount
        ? neighborhoodAvoid
        : new Set<string>([key(r, c)]);
    mines = placeMines(board.seed, board.width, board.height, board.mineCount, avoid);
    adjacent = computeAdjacent(mines);
  }

  if (mines[r]![c]) {
    // Hit a mine: reveal every mine, game over.
    const revealed = board.revealed.map((row, ri) => row.map((v, ci) => v || mines[ri]![ci]!));
    return { ...board, mines, adjacent, revealed, firstClick: false, exploded: true };
  }

  const revealed = board.revealed.map((row) => row.slice());
  const stack: [number, number][] = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    if (revealed[cr]![cc]) continue;
    revealed[cr]![cc] = true;
    if (adjacent[cr]![cc] === 0) {
      for (const [nr, nc] of neighbors(cr, cc, board.width, board.height)) {
        if (!revealed[nr]![nc] && !mines[nr]![nc] && !board.flagged[nr]![nc]) stack.push([nr, nc]);
      }
    }
  }

  return { ...board, mines, adjacent, revealed, firstClick: false };
}

/** Place or remove a flag on a hidden cell. No-op once the game has ended. */
export function toggleFlag(board: Board, r: number, c: number): Board {
  if (board.exploded) return board;
  if (!inBounds(board.width, board.height, r, c)) return board;
  if (board.revealed[r]![c]) return board;

  const flagged = board.flagged.map((row) => row.slice());
  flagged[r]![c] = !flagged[r]![c];
  return { ...board, flagged };
}

export function flagCount(board: Board): number {
  return board.flagged.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
}

/** Win = every non-mine cell has been revealed. */
export function isWon(board: Board): boolean {
  if (board.exploded) return false;
  for (let r = 0; r < board.height; r++) {
    for (let c = 0; c < board.width; c++) {
      if (!board.mines[r]![c] && !board.revealed[r]![c]) return false;
    }
  }
  return true;
}
