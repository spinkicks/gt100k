/**
 * Balance Scale — the rules of a pan balance holding identical unknown bags plus known stones.
 *
 * The maths IS the move set: every legal move is an axiom of equality applied to both pans at
 * once, so isolating the bag is algebraic manipulation rather than arithmetic recall. Nothing on
 * screen ever says `x`; the bag is the unknown.
 *
 * WHY THE MOVES ARE DISCRETE, which is the whole design. The obvious version of this puzzle lets
 * you remove any amount from both pans and divide by any k. That version is trivial: a greedy
 * strategy solves every instance in three moves (drop the common bags, drop the common weight,
 * divide by the bags that remain) and the final division is ALWAYS exact, because if
 * `a·B + b = c·B + d` then `d - b = (a - c)·B` by construction. There is no divisibility to
 * notice and no order to choose.
 *
 * So weight is physical here: individual stones in fixed denominations. You may only take a stone
 * off a pan if that pan actually has one, and you may only divide when every denomination on both
 * pans splits evenly. Making a division legal therefore takes planning — you break a 10 into two
 * 5s, or a 5 into five 1s, to get the counts you need. That planning is the puzzle.
 */

/** Stone denominations, largest first. Exchange only ever moves down this list. */
export const DENOMS = [10, 5, 1] as const;
export type Denom = (typeof DENOMS)[number];

/** What a single stone can be broken into. Each entry preserves total value exactly. */
export const EXCHANGES: Readonly<Record<number, readonly Denom[]>> = {
  10: [5, 5],
  5: [1, 1, 1, 1, 1],
};

/** One pan: some number of identical unknown bags, plus a multiset of stones keyed by value. */
export interface Pan {
  bags: number;
  /** Count per denomination. Absent key means zero. */
  stones: Readonly<Partial<Record<Denom, number>>>;
}

export interface Scale {
  left: Pan;
  right: Pan;
  /** The bag's true weight. Never rendered as a number until the child has isolated it. */
  bagWeight: number;
}

export type Side = "left" | "right";

export type Move =
  /** Take one stone of `value` off BOTH pans. */
  | { kind: "removeStone"; value: Denom }
  /** Take one bag off BOTH pans. */
  | { kind: "removeBag" }
  /** Break one stone of `value` on ONE pan into smaller stones of equal total. */
  | { kind: "exchange"; side: Side; value: Denom }
  /** Divide everything on both pans by `k`. */
  | { kind: "divide"; k: number };

export function stoneCount(pan: Pan, value: Denom): number {
  return pan.stones[value] ?? 0;
}

export function stoneTotal(pan: Pan): number {
  return DENOMS.reduce((sum, d) => sum + d * stoneCount(pan, d), 0);
}

/** Total weight on a pan, given the bag weight. Used for the tilt and for invariant checks. */
export function panWeight(pan: Pan, bagWeight: number): number {
  return pan.bags * bagWeight + stoneTotal(pan);
}

/**
 * Tilt in [-1, 1]: negative means the left pan is heavier (so it sits lower). Normalised by the
 * heavier side so the beam saturates rather than flying off at large differences.
 */
export function tilt(scale: Scale): number {
  const l = panWeight(scale.left, scale.bagWeight);
  const r = panWeight(scale.right, scale.bagWeight);
  const heaviest = Math.max(l, r, 1);
  return (r - l) / heaviest;
}

export function isBalanced(scale: Scale): boolean {
  return panWeight(scale.left, scale.bagWeight) === panWeight(scale.right, scale.bagWeight);
}

/**
 * Solved when one pan holds exactly one bag and nothing else, and the other holds only stones.
 * At that point the stones ARE the bag's weight, which is the answer read straight off the scale.
 */
export function isSolved(scale: Scale): boolean {
  const done = (a: Pan, b: Pan): boolean =>
    a.bags === 1 && stoneTotal(a) === 0 && b.bags === 0 && stoneTotal(b) > 0;
  return done(scale.left, scale.right) || done(scale.right, scale.left);
}

function withStone(pan: Pan, value: Denom, delta: number): Pan {
  const next = { ...pan.stones };
  const count = (next[value] ?? 0) + delta;
  if (count <= 0) delete next[value];
  else next[value] = count;
  return { bags: pan.bags, stones: next };
}

function panOf(scale: Scale, side: Side): Pan {
  return side === "left" ? scale.left : scale.right;
}

export function isLegal(scale: Scale, move: Move): boolean {
  switch (move.kind) {
    case "removeStone":
      return stoneCount(scale.left, move.value) > 0 && stoneCount(scale.right, move.value) > 0;
    case "removeBag":
      return scale.left.bags > 0 && scale.right.bags > 0;
    case "exchange":
      return (
        EXCHANGES[move.value] !== undefined && stoneCount(panOf(scale, move.side), move.value) > 0
      );
    case "divide": {
      if (!Number.isInteger(move.k) || move.k < 2) return false;
      // Every denomination on both pans must split evenly, and so must both bag counts. This is a
      // real, checkable condition — unlike the continuous version, where division is always legal.
      const splits = (pan: Pan): boolean =>
        pan.bags % move.k === 0 && DENOMS.every((d) => stoneCount(pan, d) % move.k === 0);
      // Dividing an empty scale by anything is vacuously "legal" and useless; require some content.
      const hasContent = scale.left.bags + scale.right.bags + stoneTotal(scale.left) > 0;
      return hasContent && splits(scale.left) && splits(scale.right);
    }
  }
}

/** Apply a legal move, returning a new Scale. Returns the same scale unchanged if illegal. */
export function applyMove(scale: Scale, move: Move): Scale {
  if (!isLegal(scale, move)) return scale;
  switch (move.kind) {
    case "removeStone":
      return {
        ...scale,
        left: withStone(scale.left, move.value, -1),
        right: withStone(scale.right, move.value, -1),
      };
    case "removeBag":
      return {
        ...scale,
        left: { ...scale.left, bags: scale.left.bags - 1 },
        right: { ...scale.right, bags: scale.right.bags - 1 },
      };
    case "exchange": {
      let pan = withStone(panOf(scale, move.side), move.value, -1);
      for (const d of EXCHANGES[move.value] ?? []) pan = withStone(pan, d, 1);
      return move.side === "left" ? { ...scale, left: pan } : { ...scale, right: pan };
    }
    case "divide": {
      const shrink = (pan: Pan): Pan => {
        const stones: Partial<Record<Denom, number>> = {};
        for (const d of DENOMS) {
          const c = stoneCount(pan, d) / move.k;
          if (c > 0) stones[d] = c;
        }
        return { bags: pan.bags / move.k, stones };
      };
      return { ...scale, left: shrink(scale.left), right: shrink(scale.right) };
    }
  }
}

/** Every legal move available right now — the move palette, and the search frontier for solvers. */
export function legalMoves(scale: Scale): Move[] {
  const moves: Move[] = [];
  if (isLegal(scale, { kind: "removeBag" })) moves.push({ kind: "removeBag" });
  for (const value of DENOMS) {
    if (isLegal(scale, { kind: "removeStone", value })) moves.push({ kind: "removeStone", value });
    for (const side of ["left", "right"] as const) {
      const move: Move = { kind: "exchange", side, value };
      if (isLegal(scale, move)) moves.push(move);
    }
  }
  for (const k of [2, 3, 5]) {
    if (isLegal(scale, { kind: "divide", k })) moves.push({ kind: "divide", k });
  }
  return moves;
}

/** Canonical key for memoising searches over scale states. */
export function scaleKey(scale: Scale): string {
  const pan = (p: Pan): string => `${p.bags}:${DENOMS.map((d) => stoneCount(p, d)).join(",")}`;
  return `${pan(scale.left)}|${pan(scale.right)}`;
}

/**
 * Shortest solution length by breadth-first search, or null if unreachable within `maxDepth`.
 * Used by the generator to grade difficulty and by tests to prove instances are solvable.
 */
export function shortestSolution(scale: Scale, maxDepth = 14): Move[] | null {
  if (isSolved(scale)) return [];
  const seen = new Set([scaleKey(scale)]);
  let frontier: Array<{ scale: Scale; path: Move[] }> = [{ scale, path: [] }];
  for (let depth = 0; depth < maxDepth; depth++) {
    const next: Array<{ scale: Scale; path: Move[] }> = [];
    for (const node of frontier) {
      for (const move of legalMoves(node.scale)) {
        const after = applyMove(node.scale, move);
        const key = scaleKey(after);
        if (seen.has(key)) continue;
        seen.add(key);
        const path = [...node.path, move];
        if (isSolved(after)) return path;
        next.push({ scale: after, path });
      }
    }
    if (next.length === 0) return null;
    frontier = next;
  }
  return null;
}

/** Human-readable move label, used for buttons and for accessible names. */
export function moveLabel(move: Move): string {
  switch (move.kind) {
    case "removeBag":
      return "Take a bag off both pans";
    case "removeStone":
      return `Take a ${move.value} stone off both pans`;
    case "exchange":
      return `Break a ${move.value} stone on the ${move.side} pan`;
    case "divide":
      return `Split both pans into ${move.k}`;
  }
}
