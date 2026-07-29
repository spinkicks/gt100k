// LITS puzzle logic: grid + regions, and a full rule-checker (not solution-matching).
// Rules (see puzzle-lits.com):
//  1. Every region contains exactly one tetromino (4 connected shaded cells), shaped L/I/T/S
//     (rotations & reflections allowed).
//  2. All shaded cells across the whole grid form one orthogonally-connected group.
//  3. No 2x2 block is fully shaded.
//  4. Two tetrominoes of the same type may not touch edge-to-edge (diagonal touch is fine).

export type RegionId = number;
export type Cell = [row: number, col: number];
export type ShadeGrid = boolean[][];
export type TetrominoType = "L" | "I" | "T" | "S";

export interface LitsPuzzle {
  rows: number;
  cols: number;
  regions: RegionId[][];
  /** Reference solution (one valid shading); used for authoring/tests, not for win-checking. */
  solution: boolean[][];
}

export function blankShade(rows: number, cols: number): ShadeGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false));
}

export function shadeFromSolution(puzzle: LitsPuzzle): ShadeGrid {
  return puzzle.solution.map((row) => row.slice());
}

const NEIGHBORS: Cell[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function isConnectedGroup(cells: Cell[]): boolean {
  if (cells.length === 0) return true;
  const set = new Set(cells.map(([r, c]) => cellKey(r, c)));
  const visited = new Set<string>();
  const stack: Cell[] = [cells[0]!];
  visited.add(cellKey(cells[0]![0], cells[0]![1]));
  while (stack.length) {
    const [r, c] = stack.pop()!;
    for (const [dr, dc] of NEIGHBORS) {
      const nr = r + dr;
      const nc = c + dc;
      const k = cellKey(nr, nc);
      if (set.has(k) && !visited.has(k)) {
        visited.add(k);
        stack.push([nr, nc]);
      }
    }
  }
  return visited.size === set.size;
}

// --- Tetromino shape classification -----------------------------------------------

function rotate(cells: Cell[]): Cell[] {
  return cells.map(([r, c]) => [c, -r] as Cell);
}

function reflect(cells: Cell[]): Cell[] {
  return cells.map(([r, c]) => [r, -c] as Cell);
}

function normalize(cells: Cell[]): Cell[] {
  const minR = Math.min(...cells.map((c) => c[0]));
  const minC = Math.min(...cells.map((c) => c[1]));
  return cells
    .map(([r, c]) => [r - minR, c - minC] as Cell)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function signature(cells: Cell[]): string {
  return normalize(cells)
    .map((c) => c.join(","))
    .join("|");
}

const CANONICAL: Record<TetrominoType, Cell[]> = {
  I: [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
  ],
  L: [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
  ],
  T: [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 1],
  ],
  S: [
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
  ],
};

function allOrientations(base: Cell[]): Cell[][] {
  const seen = new Set<string>();
  const out: Cell[][] = [];
  for (const reflected of [base, reflect(base)]) {
    let cur = reflected;
    for (let rot = 0; rot < 4; rot++) {
      const n = normalize(cur);
      const s = signature(n);
      if (!seen.has(s)) {
        seen.add(s);
        out.push(n);
      }
      cur = rotate(cur);
    }
  }
  return out;
}

const SIGNATURE_TO_TYPE = new Map<string, TetrominoType>();
for (const type of Object.keys(CANONICAL) as TetrominoType[]) {
  for (const orientation of allOrientations(CANONICAL[type])) {
    SIGNATURE_TO_TYPE.set(signature(orientation), type);
  }
}

/** Classifies a set of cells as an L/I/T/S tetromino (any rotation/reflection), or null. */
export function classifyTetromino(cells: Cell[]): TetrominoType | null {
  if (cells.length !== 4) return null;
  if (!isConnectedGroup(cells)) return null;
  return SIGNATURE_TO_TYPE.get(signature(cells)) ?? null;
}

// --- Whole-board rule checking ------------------------------------------------------

function regionIds(puzzle: LitsPuzzle): RegionId[] {
  const ids = new Set<RegionId>();
  for (const row of puzzle.regions) for (const id of row) ids.add(id);
  return [...ids].sort((a, b) => a - b);
}

function regionCells(puzzle: LitsPuzzle, id: RegionId): Cell[] {
  const cells: Cell[] = [];
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (puzzle.regions[r]?.[c] === id) cells.push([r, c]);
    }
  }
  return cells;
}

function shadedIn(shade: ShadeGrid, cells: Cell[]): Cell[] {
  return cells.filter(([r, c]) => shade[r]?.[c] === true);
}

export function hasFullyShaded2x2(shade: ShadeGrid, rows: number, cols: number): boolean {
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if (shade[r]?.[c] && shade[r]?.[c + 1] && shade[r + 1]?.[c] && shade[r + 1]?.[c + 1]) {
        return true;
      }
    }
  }
  return false;
}

export function allShadedCellsConnected(shade: ShadeGrid, rows: number, cols: number): boolean {
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) if (shade[r]?.[c]) cells.push([r, c]);
  return isConnectedGroup(cells);
}

export interface LitsCheckResult {
  solved: boolean;
  violations: string[];
}

/** Full rule-checker: validates all four LITS rules against the current shading. */
export function checkLits(shade: ShadeGrid, puzzle: LitsPuzzle): LitsCheckResult {
  const violations: string[] = [];
  const regionType = new Map<RegionId, TetrominoType>();

  for (const id of regionIds(puzzle)) {
    const cells = regionCells(puzzle, id);
    const shaded = shadedIn(shade, cells);
    if (shaded.length !== 4) {
      violations.push(`region ${id} has ${shaded.length} shaded cells (needs exactly 4)`);
      continue;
    }
    const type = classifyTetromino(shaded);
    if (!type) {
      violations.push(`region ${id}'s shaded cells are not a valid L/I/T/S tetromino`);
      continue;
    }
    regionType.set(id, type);
  }

  if (hasFullyShaded2x2(shade, puzzle.rows, puzzle.cols)) {
    violations.push("a 2x2 block is fully shaded");
  }

  if (!allShadedCellsConnected(shade, puzzle.rows, puzzle.cols)) {
    violations.push("shaded cells are not all connected");
  }

  // Rule 4: same-type tetrominoes may not touch edge-to-edge.
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      if (!shade[r]?.[c]) continue;
      const idA = puzzle.regions[r]?.[c];
      const typeA = idA === undefined ? undefined : regionType.get(idA);
      if (!typeA) continue;
      for (const [dr, dc] of NEIGHBORS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!shade[nr]?.[nc]) continue;
        const idB = puzzle.regions[nr]?.[nc];
        if (idB === undefined || idB === idA) continue;
        const typeB = regionType.get(idB);
        if (typeB && typeB === typeA) {
          violations.push(`same-type (${typeA}) tetrominoes touch at region ${idA}/${idB}`);
        }
      }
    }
  }

  return { solved: violations.length === 0, violations: [...new Set(violations)] };
}

export function isSolved(shade: ShadeGrid, puzzle: LitsPuzzle): boolean {
  return checkLits(shade, puzzle).solved;
}
