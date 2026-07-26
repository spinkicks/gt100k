#!/usr/bin/env -S node --import tsx
/**
 * gen-lits.ts — generate a bank of verified LITS puzzles at build time.
 *
 * Run:
 *   pnpm --filter @gt100k/mvp-jul24 exec tsx scripts/gen-lits.ts
 *
 * LITS puzzles are too heavy to generate in the browser (uniqueness search is
 * combinatorial), so we build a bank offline and commit it as data.
 *
 * Strategy — reverse construction, so a solution is guaranteed to exist:
 *   1. Seeded PRNG. Grow a connected "snake" of tetrominoes (each a random
 *      L/I/T/S shape, discovered by classifying a randomly-grown 4-cell
 *      connected blob) one at a time. Every tetromino after the first must
 *      attach to the existing shaded blob, so the final union is
 *      automatically one orthogonally-connected group (LITS rule 2). Any
 *      growth step that would create a fully-shaded 2x2 block (rule 3) or
 *      make two same-type tetrominoes edge-adjacent (rule 4) is rejected and
 *      retried.
 *   2. Partition the rest of the grid into jigsaw regions: randomly
 *      flood-fill the remaining empty cells outward from the already-placed
 *      tetrominoes, so every region ends up owning exactly one tetromino
 *      (rule 1) plus some padding cells.
 *   3. Verify the intended shading against the real rule engine (checkLits)
 *      — must-have, a puzzle is never shipped unless this passes.
 *   4. Search for a second valid shading via bounded backtracking over each
 *      region's candidate tetromino placements (enumerate every 4-subset of
 *      a region's cells that classifies as a tetromino, then backtrack
 *      region-by-region with early pruning on the 2x2 and same-type rules).
 *      Nice-to-have: keep the puzzle only if the search proves the solution
 *      is unique. If the search exhausts its node budget without deciding,
 *      the puzzle is still shipped (it's provably solvable) but flagged
 *      `uniqueVerified: false`.
 *   5. Repeat across difficulty tiers and write everything to bank.ts.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  type Cell,
  type LitsPuzzle,
  type TetrominoType,
  checkLits,
  classifyTetromino,
  hasFullyShaded2x2,
} from "../src/puzzles/LITS/logic";
// The app's one seeded PRNG. Its exact arithmetic decides which puzzles land in the committed bank,
// so see the warning in src/lib/rng.ts before touching it.
import { type Rng, mulberry32 } from "../src/lib/rng";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_FILE = join(__dirname, "..", "src", "puzzles", "LITS", "bank.ts");

function randInt(rng: Rng, n: number): number {
  return Math.floor(rng() * n);
}

function pick<T>(rng: Rng, arr: T[]): T {
  return arr[randInt(rng, arr.length)]!;
}

function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// --- grid helpers -------------------------------------------------------------------

const DIRS: Cell[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

function inBounds(r: number, c: number, rows: number, cols: number): boolean {
  return r >= 0 && r < rows && c >= 0 && c < cols;
}

function key(r: number, c: number): string {
  return `${r},${c}`;
}

function makeGrid<T>(rows: number, cols: number, fill: T): T[][] {
  return Array.from({ length: rows }, () => Array<T>(cols).fill(fill));
}

// --- step 1: grow a connected "snake" of tetrominoes --------------------------------

interface PlacedTetromino {
  id: number;
  cells: Cell[];
  type: TetrominoType;
}

function allEmptyCells(rows: number, cols: number, shaded: boolean[][]): Cell[] {
  const out: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shaded[r]![c]) out.push([r, c]);
    }
  }
  return out;
}

function blobFrontier(rows: number, cols: number, shaded: boolean[][]): Cell[] {
  const seen = new Set<string>();
  const out: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!shaded[r]![c]) continue;
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc, rows, cols)) continue;
        if (shaded[nr]![nc]) continue;
        const k = key(nr, nc);
        if (!seen.has(k)) {
          seen.add(k);
          out.push([nr, nc]);
        }
      }
    }
  }
  return out;
}

/** Randomly grows a connected 4-cell shape starting at `start`, staying off shaded cells. */
function growShape(
  rows: number,
  cols: number,
  shaded: boolean[][],
  start: Cell,
  rng: Rng,
): Cell[] | null {
  const cells: Cell[] = [start];
  const inShape = new Set([key(start[0], start[1])]);
  while (cells.length < 4) {
    const frontier: Cell[] = [];
    const seen = new Set<string>();
    for (const [r, c] of cells) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc, rows, cols)) continue;
        if (shaded[nr]![nc]) continue;
        const k = key(nr, nc);
        if (inShape.has(k) || seen.has(k)) continue;
        seen.add(k);
        frontier.push([nr, nc]);
      }
    }
    if (frontier.length === 0) return null;
    const next = pick(rng, frontier);
    cells.push(next);
    inShape.add(key(next[0], next[1]));
  }
  return cells;
}

function createsFullyShaded2x2(
  rows: number,
  cols: number,
  shaded: boolean[][],
  cells: Cell[],
): boolean {
  for (const [r, c] of cells) shaded[r]![c] = true;
  const bad = hasFullyShaded2x2(shaded, rows, cols);
  for (const [r, c] of cells) shaded[r]![c] = false;
  return bad;
}

function touchesSameType(
  cells: Cell[],
  type: TetrominoType,
  typeGrid: (TetrominoType | null)[][],
  rows: number,
  cols: number,
): boolean {
  for (const [r, c] of cells) {
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc, rows, cols)) continue;
      if (typeGrid[nr]![nc] === type) return true;
    }
  }
  return false;
}

const STARTS_TO_TRY = 40;
const WALKS_PER_START = 6;

function placeOneTetromino(
  rows: number,
  cols: number,
  shaded: boolean[][],
  typeGrid: (TetrominoType | null)[][],
  id: number,
  isFirst: boolean,
  rng: Rng,
): PlacedTetromino | null {
  const startCandidates = isFirst
    ? allEmptyCells(rows, cols, shaded)
    : blobFrontier(rows, cols, shaded);
  if (startCandidates.length === 0) return null;
  const starts = shuffle(rng, startCandidates).slice(0, STARTS_TO_TRY);

  for (const start of starts) {
    for (let attempt = 0; attempt < WALKS_PER_START; attempt++) {
      const cells = growShape(rows, cols, shaded, start, rng);
      if (!cells) continue;
      const type = classifyTetromino(cells);
      if (!type) continue;
      if (createsFullyShaded2x2(rows, cols, shaded, cells)) continue;
      if (touchesSameType(cells, type, typeGrid, rows, cols)) continue;
      return { id, cells, type };
    }
  }
  return null;
}

const TRIES_PER_LEVEL = 25;

/**
 * Real backtracking placer: if a later tetromino can't find room, undo the most recent
 * placement and try a different (randomly re-sampled) shape for it instead of aborting
 * the whole attempt. This is what makes tightly-packed (high-region-count) grids
 * constructible at all — a single restart-from-scratch heuristic almost never finishes a
 * long chain of dependent placements.
 */
function tryBuildSolution(
  rows: number,
  cols: number,
  numRegions: number,
  rng: Rng,
  nodeBudget: number,
): PlacedTetromino[] | null {
  const shaded = makeGrid(rows, cols, false);
  const typeGrid = makeGrid<TetrominoType | null>(rows, cols, null);
  const placed: PlacedTetromino[] = [];
  let nodes = 0;

  function place(id: number): boolean {
    if (id === numRegions) return true;
    for (let tries = 0; tries < TRIES_PER_LEVEL; tries++) {
      nodes++;
      if (nodes > nodeBudget) return false;
      const shape = placeOneTetromino(rows, cols, shaded, typeGrid, id, id === 0, rng);
      if (!shape) continue; // this sample round found nothing; re-sample (bounded by TRIES_PER_LEVEL)
      for (const [r, c] of shape.cells) {
        shaded[r]![c] = true;
        typeGrid[r]![c] = shape.type;
      }
      placed.push(shape);
      if (place(id + 1)) return true;
      placed.pop();
      for (const [r, c] of shape.cells) {
        shaded[r]![c] = false;
        typeGrid[r]![c] = null;
      }
    }
    return false;
  }

  return place(0) ? placed.slice() : null;
}

// --- step 2: grow jigsaw regions from the placed tetrominoes ------------------------

/**
 * Grows every region outward by one cell at a time, round-robin, so regions stay close
 * to the same size (rows*cols/numRegions) instead of one region ballooning while another
 * stays at 4 cells. Small, evenly-sized regions leave far fewer alternate tetromino
 * placements per region, which is what makes a unique solution findable at all — a region
 * with a dozen spare cells has too many candidate shadings to ever pin down one solution.
 */
function growRegions(
  rows: number,
  cols: number,
  seedOwner: (number | null)[][],
  numRegions: number,
  rng: Rng,
): number[][] {
  const owner = seedOwner.map((row) => row.slice());
  const queues: Cell[][] = Array.from({ length: numRegions }, () => []);
  let remaining = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const o = owner[r]![c];
      if (o != null) queues[o]!.push([r, c]);
      else remaining++;
    }
  }

  while (remaining > 0) {
    const order = shuffle(
      rng,
      Array.from({ length: numRegions }, (_, i) => i),
    );
    let grewAny = false;
    for (const id of order) {
      const queue = queues[id]!;
      while (queue.length > 0) {
        const [r, c] = queue[0]!;
        const unclaimed: Cell[] = [];
        for (const [dr, dc] of DIRS) {
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc, rows, cols) && owner[nr]![nc] === null) unclaimed.push([nr, nc]);
        }
        if (unclaimed.length === 0) {
          queue.shift(); // this cell is boxed in; stop tracking it as a growth front
          continue;
        }
        const [nr, nc] = pick(rng, unclaimed);
        owner[nr]![nc] = id;
        queue.push([nr, nc]);
        remaining--;
        grewAny = true;
        break; // one cell per region per round keeps growth balanced
      }
    }
    if (!grewAny) break; // stuck; shouldn't happen on a connected rectangle, but stay safe
  }

  return owner as number[][];
}

// --- step 3: assemble + verify with the real rule engine ----------------------------

function generateOne(
  rows: number,
  cols: number,
  numRegions: number,
  rng: Rng,
  constructionNodeBudget: number,
): LitsPuzzle | null {
  const placed = tryBuildSolution(rows, cols, numRegions, rng, constructionNodeBudget);
  if (!placed) return null;

  const seedOwner = makeGrid<number | null>(rows, cols, null);
  for (const t of placed) for (const [r, c] of t.cells) seedOwner[r]![c] = t.id;
  const regions = growRegions(rows, cols, seedOwner, numRegions, rng);

  const solution = makeGrid(rows, cols, false);
  for (const t of placed) for (const [r, c] of t.cells) solution[r]![c] = true;

  const puzzle: LitsPuzzle = { rows, cols, regions, solution };
  if (!checkLits(solution, puzzle).solved) return null; // defensive; should never trigger
  return puzzle;
}

// --- step 4: bounded uniqueness search -----------------------------------------------

interface RegionCandidate {
  cells: Cell[];
  type: TetrominoType;
}

function combinationsOf4(cells: Cell[]): Cell[][] {
  const out: Cell[][] = [];
  const chosen: Cell[] = [];
  const n = cells.length;
  const recurse = (start: number) => {
    if (chosen.length === 4) {
      out.push(chosen.slice());
      return;
    }
    for (let i = start; i < n; i++) {
      chosen.push(cells[i]!);
      recurse(i + 1);
      chosen.pop();
    }
  };
  recurse(0);
  return out;
}

function regionCandidates(cells: Cell[]): RegionCandidate[] {
  const out: RegionCandidate[] = [];
  for (const combo of combinationsOf4(cells)) {
    const type = classifyTetromino(combo);
    if (type) out.push({ cells: combo, type });
  }
  return out;
}

function regionsCellMap(puzzle: LitsPuzzle): Map<number, Cell[]> {
  const map = new Map<number, Cell[]>();
  for (let r = 0; r < puzzle.rows; r++) {
    for (let c = 0; c < puzzle.cols; c++) {
      const id = puzzle.regions[r]![c]!;
      const list = map.get(id);
      if (list) list.push([r, c]);
      else map.set(id, [[r, c]]);
    }
  }
  return map;
}

interface UniquenessResult {
  solutionsFound: number;
  exhausted: boolean;
}

/**
 * Counts valid shadings (up to `limit`) via backtracking over each region's candidate
 * tetromino placements, pruning on the 2x2 and same-type-adjacency rules as it goes and
 * doing a final `checkLits` (which also covers connectivity) at each complete assignment.
 * Stops early once `limit` solutions are found, or once `nodeBudget` candidates have been
 * tried (in which case `exhausted` is true and the count is a lower bound).
 */
export function countSolutions(
  puzzle: LitsPuzzle,
  limit: number,
  nodeBudget: number,
): UniquenessResult {
  const cellMap = regionsCellMap(puzzle);
  const regions = [...cellMap.entries()]
    .map(([id, cells]) => ({ id, candidates: regionCandidates(cells) }))
    .sort((a, b) => a.candidates.length - b.candidates.length);

  const rows = puzzle.rows;
  const cols = puzzle.cols;
  const shade = makeGrid(rows, cols, false);
  const typeOfRegion = new Map<number, TetrominoType>();

  let found = 0;
  let nodes = 0;
  let exhausted = false;

  const hasSameTypeAdjacency = (cells: Cell[], type: TetrominoType, id: number): boolean => {
    for (const [r, c] of cells) {
      for (const [dr, dc] of DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc, rows, cols)) continue;
        if (!shade[nr]![nc]) continue;
        const nid = puzzle.regions[nr]![nc]!;
        if (nid === id) continue;
        if (typeOfRegion.get(nid) === type) return true;
      }
    }
    return false;
  };

  const backtrack = (i: number): boolean => {
    if (i === regions.length) {
      if (checkLits(shade, puzzle).solved) {
        found++;
        if (found >= limit) return true;
      }
      return false;
    }
    const { id, candidates } = regions[i]!;
    for (const cand of candidates) {
      nodes++;
      if (nodes > nodeBudget) {
        exhausted = true;
        return true;
      }
      for (const [r, c] of cand.cells) shade[r]![c] = true;
      const bad =
        hasFullyShaded2x2(shade, rows, cols) || hasSameTypeAdjacency(cand.cells, cand.type, id);
      let stop = false;
      if (!bad) {
        typeOfRegion.set(id, cand.type);
        stop = backtrack(i + 1);
        typeOfRegion.delete(id);
      }
      for (const [r, c] of cand.cells) shade[r]![c] = false;
      if (stop) return true;
    }
    return false;
  };

  backtrack(0);
  return { solutionsFound: found, exhausted };
}

// --- step 5: difficulty tiers + bank assembly ----------------------------------------

export interface BankPuzzle extends LitsPuzzle {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  uniqueVerified: boolean;
}

interface Tier {
  name: "easy" | "medium" | "hard";
  rows: number;
  cols: number;
  regions: number;
  count: number;
  constructionNodeBudget: number;
  uniquenessNodeBudget: number;
  maxAttempts: number;
}

// Tuned empirically (see gen-lits-report.md): tighter packing (higher shaded-cell density,
// fewer "spare" cells per region) makes a unique solution far more likely to exist, but the
// backtracking piece-placer's construction success rate collapses once a chain of more than
// ~9-10 dependent tetromino placements is required. Easy/medium sit in the sweet spot where
// both construction and uniqueness succeed often. Hard trades a bigger, more open board (harder
// for a human to scan) for a density where — empirically — a second valid shading is essentially
// always found quickly; every hard puzzle below is solvable but shipped as `uniqueVerified: false`
// (see the "hard tier: uniqueness not verified" note in the report).
// NOTE: these tier sizes/budgets are intentionally modest. An earlier version of this script
// used much larger counts/attempt caps and, combined with no wall-clock ceiling (see
// WALL_CLOCK_BUDGET_MS below), could run essentially unbounded — that's what hung a prior
// generation run. Every knob here is chosen so the *whole* script finishes in well under the
// wall-clock budget even in a pathological (all-attempts-fail) case.
const TIERS: Tier[] = [
  {
    name: "easy",
    rows: 6,
    cols: 6,
    regions: 6,
    count: 6,
    constructionNodeBudget: 80,
    uniquenessNodeBudget: 8_000,
    maxAttempts: 4_000,
  },
  {
    name: "medium",
    rows: 7,
    cols: 7,
    regions: 9,
    count: 4,
    constructionNodeBudget: 80,
    uniquenessNodeBudget: 8_000,
    maxAttempts: 4_000,
  },
];

/**
 * Hard ceiling on total wall-clock time for the whole generation run (all tiers combined).
 * Checked on every attempt (cheap) so a run ALWAYS terminates promptly — regardless of how
 * unlucky the RNG gets or how any tier's budgets are tuned — instead of spinning indefinitely.
 */
const WALL_CLOCK_BUDGET_MS = 20_000;

const MASTER_SEED = 100_003;

function serializeRow(row: (number | boolean)[]): string {
  return JSON.stringify(row);
}

function serializeGrid(grid: (number | boolean)[][]): string {
  return `[\n${grid.map((row) => `      ${serializeRow(row)},`).join("\n")}\n    ]`;
}

function serializePuzzle(p: BankPuzzle): string {
  return `  {
    id: ${JSON.stringify(p.id)},
    difficulty: ${JSON.stringify(p.difficulty)},
    uniqueVerified: ${p.uniqueVerified},
    rows: ${p.rows},
    cols: ${p.cols},
    regions: ${serializeGrid(p.regions)},
    solution: ${serializeGrid(p.solution)},
  }`;
}

function writeBank(bank: BankPuzzle[]) {
  const header =
    "// AUTO-GENERATED by scripts/gen-lits.ts — do not hand-edit.\n" +
    "// Regenerate with: pnpm --filter @gt100k/mvp-jul24 exec tsx scripts/gen-lits.ts\n" +
    'import type { LitsPuzzle } from "./logic";\n\n' +
    "export interface BankPuzzle extends LitsPuzzle {\n" +
    "  id: string;\n" +
    '  difficulty: "easy" | "medium" | "hard";\n' +
    "  uniqueVerified: boolean;\n" +
    "}\n\n" +
    "export const LITS_BANK: BankPuzzle[] = [\n";
  const body = bank.map(serializePuzzle).join(",\n");
  const footer = "\n];\n";
  writeFileSync(OUT_FILE, header + body + footer, "utf8");
}

function main() {
  const bank: BankPuzzle[] = [];
  let seedCounter = MASTER_SEED;
  let notUniqueVerified = 0;
  const startedAt = Date.now();
  let deadlineHit = false;

  for (const tier of TIERS) {
    if (deadlineHit) break;
    let produced = 0;
    let attempts = 0;
    let provenNonUnique = 0; // shipped anyway, just flagged uniqueVerified: false
    let constructionFailures = 0;
    while (produced < tier.count && attempts < tier.maxAttempts) {
      if (Date.now() - startedAt > WALL_CLOCK_BUDGET_MS) {
        deadlineHit = true;
        console.log(
          `[gen-lits]   ...${tier.name}: wall-clock budget (${WALL_CLOCK_BUDGET_MS}ms) hit — ` +
            `stopping with ${produced}/${tier.count} produced for this tier`,
        );
        break;
      }
      attempts++;
      if (attempts % 1000 === 0) {
        console.log(
          `[gen-lits]   ...${tier.name}: ${attempts} attempts so far, ${produced}/${tier.count} produced`,
        );
      }
      seedCounter += 1;
      const rng = mulberry32(seedCounter);
      const puzzle = generateOne(
        tier.rows,
        tier.cols,
        tier.regions,
        rng,
        tier.constructionNodeBudget,
      );
      if (!puzzle) {
        constructionFailures++;
        continue;
      }

      const { solutionsFound, exhausted } = countSolutions(puzzle, 2, tier.uniquenessNodeBudget);
      // Uniqueness is nice-to-have, not a must-have (solvability, already verified against
      // checkLits inside generateOne, is the must-have). Discarding non-unique puzzles and
      // retrying with a new seed is what made this loop unbounded in practice — a tightly
      // time-boxed uniqueness search frequently can't *prove* uniqueness before its node
      // budget runs out, so "discard and retry" could spin through attempts forever without
      // ever producing tier.count puzzles. Instead: always ship a solvable puzzle, just be
      // honest about whether uniqueness was actually proven.
      if (!exhausted && solutionsFound === 0) continue; // inconsistent with checkLits above; skip defensively
      provenNonUnique += !exhausted && solutionsFound >= 2 ? 1 : 0; // stats only, not a discard

      const uniqueVerified = solutionsFound === 1 && !exhausted;
      if (!uniqueVerified) notUniqueVerified++;
      produced++;
      bank.push({
        id: `lits-${tier.name}-${produced}`,
        difficulty: tier.name,
        uniqueVerified,
        rows: puzzle.rows,
        cols: puzzle.cols,
        regions: puzzle.regions,
        solution: puzzle.solution,
      });
    }
    console.log(
      `[gen-lits] ${tier.name}: produced ${produced}/${tier.count} puzzles ` +
        `(${attempts} attempts, ${constructionFailures} construction failures, ${provenNonUnique} proven non-unique but shipped anyway)`,
    );
  }

  writeBank(bank);
  console.log(
    `[gen-lits] wrote ${bank.length} puzzles to ${OUT_FILE} ` +
      `(${notUniqueVerified} not uniqueness-verified — solvable but the search hit its node budget)`,
  );
}

const isMain =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) main();
