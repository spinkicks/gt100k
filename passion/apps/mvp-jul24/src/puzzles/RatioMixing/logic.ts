/**
 * Ratio Mixing — pure rules.
 *
 * The dye bench. A jar must end up EXACTLY full and holding dye and water in EXACTLY the ratio on
 * the order card. The only way to put liquid in the jar is to ladle it out of a vat, and every vat
 * is itself already a mixture: one ladle from a vat is a fixed, indivisible packet of
 * `dye` + `water` units. Ladles are whole; there is no pouring "a bit more".
 *
 * Why the rules are shaped like this (see also generate.ts, which enforces the rest):
 *
 *  - **The jar must end exactly full, at an exact ratio.** Two simultaneous constraints — volume
 *    and concentration — over the same integer choice vector. One-dimensional nudging ("too pale,
 *    add the strong one") satisfies at most one of them and busts the other.
 *  - **Pours are irreversible.** There is no undo, only `emptyBatch` ("pour it out"). An undo
 *    button would turn the bench into a search tree with free backtracking, which is precisely the
 *    fiddling this puzzle is trying to design out. Starting a fresh batch is one click, costs
 *    nothing and is not counted anywhere — restarting is a normal move, not a failure.
 *  - **A ladle that would overflow the jar cannot be poured** (`canPour` is false). Overflow as a
 *    spill would be a lose-state; refusing the pour says the same thing without the punishment.
 *    A batch can still reach a dead end — `isStuck` — where nothing fits and the jar is not right.
 *  - **Each vat holds a limited number of ladles.** The stock bound is what stops "keep adding the
 *    strong one until the average drifts to the target": the drift strategy runs the vat dry
 *    before the jar is full. It is also what makes the solution enumerable and provably unique.
 *
 * Everything here is integer arithmetic. There are no percentages and no floating point anywhere
 * in the win condition, so "exact" means exact rather than exact-to-a-tolerance, and the child can
 * check the answer by counting.
 */

export interface Vat {
  id: string;
  label: string;
  /** Dye units in one ladle drawn from this vat. */
  dye: number;
  /** Water units in one ladle drawn from this vat. */
  water: number;
  /** Ladles available from this vat for a single batch. */
  stock: number;
}

export interface RatioPuzzle {
  vats: Vat[];
  /** The jar must finish EXACTLY this full, in units. */
  capacity: number;
  /** Target dye:water, in lowest terms. `capacity` is a multiple of `targetDye + targetWater`. */
  targetDye: number;
  targetWater: number;
  /** The unique ladle-count vector (parallel to `vats`) that fills the jar at the target ratio. */
  solution: number[];
}

/** Ladles poured into the jar so far, one count per vat (parallel to `RatioPuzzle.vats`). */
export type Batch = number[];

export interface JarState {
  units: number;
  dye: number;
  water: number;
}

/** Units of liquid in one ladle from `vat`. */
export const ladleSize = (vat: Vat): number => vat.dye + vat.water;

export const emptyBatch = (puzzle: RatioPuzzle): Batch => puzzle.vats.map(() => 0);

export function jarState(puzzle: RatioPuzzle, batch: Batch): JarState {
  let dye = 0;
  let water = 0;
  puzzle.vats.forEach((vat, i) => {
    const n = batch[i] ?? 0;
    dye += n * vat.dye;
    water += n * vat.water;
  });
  return { units: dye + water, dye, water };
}

/** How many equal parts the order card divides the jar into. */
export const targetParts = (puzzle: RatioPuzzle): number => puzzle.targetDye + puzzle.targetWater;

/**
 * Units of dye a correct batch contains. Deliberately NOT shown to the player: turning
 * "3 parts dye : 2 parts water, in a 20-unit jar" into "12 units of dye" is the proportional step
 * the puzzle exists to ask for, so the UI shows the ratio and the capacity and leaves the scaling
 * to the child.
 */
export const requiredDye = (puzzle: RatioPuzzle): number =>
  (puzzle.capacity / targetParts(puzzle)) * puzzle.targetDye;

export const requiredWater = (puzzle: RatioPuzzle): number => puzzle.capacity - requiredDye(puzzle);

/** True when vat `i` has stock left AND its ladle still fits in the jar. */
export function canPour(puzzle: RatioPuzzle, batch: Batch, i: number): boolean {
  const vat = puzzle.vats[i];
  if (!vat) return false;
  if ((batch[i] ?? 0) >= vat.stock) return false;
  return jarState(puzzle, batch).units + ladleSize(vat) <= puzzle.capacity;
}

/** Adds one ladle from vat `i`. Returns `batch` unchanged if that pour is not allowed. */
export function pour(puzzle: RatioPuzzle, batch: Batch, i: number): Batch {
  if (!canPour(puzzle, batch, i)) return batch;
  const next = batch.slice();
  next[i] = (next[i] ?? 0) + 1;
  return next;
}

/** Exactly full, and exactly on ratio. Nothing is "close enough". */
export function isSolved(puzzle: RatioPuzzle, batch: Batch): boolean {
  const { units, dye, water } = jarState(puzzle, batch);
  if (units !== puzzle.capacity) return false;
  // dye/water === targetDye/targetWater, cross-multiplied to stay in integers.
  return dye * puzzle.targetWater === water * puzzle.targetDye;
}

/** No legal pour remains and the jar is not right: this batch is finished, pour it out. */
export function isStuck(puzzle: RatioPuzzle, batch: Batch): boolean {
  if (isSolved(puzzle, batch)) return false;
  return puzzle.vats.every((_, i) => !canPour(puzzle, batch, i));
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

/** `[a, b]` in lowest terms. `[0, 0]` is returned unchanged. */
export function reduceRatio(a: number, b: number): [number, number] {
  const g = gcd(a, b);
  return g === 0 ? [a, b] : [a / g, b / g];
}

/** The jar's dye:water in lowest terms, or `null` while the jar is empty. */
export function currentRatio(puzzle: RatioPuzzle, batch: Batch): [number, number] | null {
  const { units, dye, water } = jarState(puzzle, batch);
  return units === 0 ? null : reduceRatio(dye, water);
}

/** Total ladles poured, across every vat. */
export const ladlesPoured = (batch: Batch): number => batch.reduce((a, b) => a + b, 0);
