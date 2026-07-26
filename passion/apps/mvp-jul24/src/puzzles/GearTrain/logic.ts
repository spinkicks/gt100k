/**
 * Gear Train — fit gears so the marked tooth comes back to the top after exactly N turns.
 *
 * THE MATHS IS THE MECHANISM. Tooth counts *are* rotation: a gear with `a` teeth driving one with
 * `b` teeth turns it `a/b` times. So the train's overall ratio is a product of tooth-count
 * fractions, and the marked tooth on the output returns to its start when `turns × ratio` first
 * becomes a whole number — which happens at exactly **the denominator of the ratio in lowest
 * terms**. Choosing gears to hit a target N is therefore factor-and-GCD reasoning, not arithmetic
 * recall. Swap the tooth counts for arbitrary symbols and there is nothing left to reason about,
 * because the symbols would no longer determine the motion.
 *
 * The train has two stages joined by a compound shaft, which matters: with a single stage only the
 * first and last gear affect the ratio (idler gears in between change direction and nothing else),
 * so the space would be small enough to exhaust by hand. Two stages make the ratio a *product*, so
 * the child factors N and picks gears that contribute those factors.
 *
 *   crank (fixed)  --meshes-->  A  ═shaft═  B  --meshes-->  C (marked tooth)
 *
 * A and B share a shaft, so they turn together. ratio = (crank / A) × (B / C).
 */

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/** An exact fraction in lowest terms. Never a float — the whole puzzle is about the denominator. */
export interface Ratio {
  num: number;
  den: number;
}

export function reduce(num: number, den: number): Ratio {
  const g = gcd(num, den) || 1;
  return { num: num / g, den: den / g };
}

/** Slot names, in mesh order. All three affect the ratio; there are no decorative slots. */
export const SLOTS = ["a", "b", "c"] as const;
export type SlotName = (typeof SLOTS)[number];

export type Placement = Readonly<Partial<Record<SlotName, number>>>;

export interface Train {
  /** Teeth on the crank gear. Fixed by the puzzle, never chosen. */
  crankTeeth: number;
  /** Gear sizes available to place, in ascending order. May contain repeats of a size. */
  inventory: readonly number[];
  /** Turns of the crank after which the marked tooth must be back at the top. */
  target: number;
  placement: Placement;
}

export function isComplete(placement: Placement): boolean {
  return SLOTS.every((slot) => typeof placement[slot] === "number");
}

/**
 * The train's ratio, or null while a slot is still empty.
 * ratio = (crank / A) × (B / C), exact and reduced.
 */
export function ratioOf(train: Train): Ratio | null {
  if (!isComplete(train.placement)) return null;
  const a = train.placement.a as number;
  const b = train.placement.b as number;
  const c = train.placement.c as number;
  return reduce(train.crankTeeth * b, a * c);
}

/**
 * Crank turns until the marked tooth is back where it started — the denominator of the reduced
 * ratio. Null while incomplete.
 */
export function turnsToRealign(train: Train): number | null {
  const r = ratioOf(train);
  return r === null ? null : r.den;
}

export function isSolved(train: Train): boolean {
  return turnsToRealign(train) === train.target;
}

/** Which inventory sizes are still unplaced, as a multiset (repeats matter). */
export function remaining(train: Train): number[] {
  const used = SLOTS.map((s) => train.placement[s]).filter(
    (t): t is number => typeof t === "number",
  );
  const pool = [...train.inventory];
  for (const t of used) {
    const at = pool.indexOf(t);
    if (at >= 0) pool.splice(at, 1);
  }
  return pool;
}

export function place(train: Train, slot: SlotName, teeth: number): Train {
  if (!remaining(train).includes(teeth)) return train;
  return { ...train, placement: { ...train.placement, [slot]: teeth } };
}

export function clearSlot(train: Train, slot: SlotName): Train {
  if (typeof train.placement[slot] !== "number") return train;
  const next = { ...train.placement };
  delete next[slot];
  return { ...train, placement: next };
}

export function clearAll(train: Train): Train {
  return { ...train, placement: {} };
}

/**
 * Rotation of each gear per crank turn, signed so meshed gears visibly counter-rotate. Sign is
 * itself worth noticing: meshing reverses direction, while a shared shaft does not.
 */
export interface Rates {
  crank: number;
  a: number | null;
  b: number | null;
  c: number | null;
}

export function ratesOf(train: Train): Rates {
  const a = train.placement.a;
  const b = train.placement.b;
  const c = train.placement.c;
  const rateA = typeof a === "number" ? -train.crankTeeth / a : null;
  // B shares A's shaft, so it turns at A's rate, same direction.
  const rateB = rateA;
  const rateC =
    rateB !== null && typeof b === "number" && typeof c === "number" ? -rateB * (b / c) : null;
  return { crank: 1, a: rateA, b: rateB, c: rateC };
}

/** Every placement of three distinct inventory slots, as candidate solutions. */
export function enumeratePlacements(train: Train): Placement[] {
  const out: Placement[] = [];
  const inv = train.inventory;
  for (let i = 0; i < inv.length; i++) {
    for (let j = 0; j < inv.length; j++) {
      if (j === i) continue;
      for (let k = 0; k < inv.length; k++) {
        if (k === i || k === j) continue;
        out.push({ a: inv[i], b: inv[j], c: inv[k] });
      }
    }
  }
  return out;
}

/** How many placements hit the target — the honest measure of how much guessing would cost. */
export function countSolutions(train: Train): number {
  let n = 0;
  for (const placement of enumeratePlacements(train)) {
    if (isSolved({ ...train, placement })) n++;
  }
  return n;
}

/** Total placements available, i.e. the size of the brute-force space. */
export function searchSpaceSize(train: Train): number {
  return enumeratePlacements(train).length;
}
