/**
 * Splitting, made visible on the board instead of explained in a sentence.
 *
 * WHY THIS FILE EXISTS. Splitting both pans by k is the move the generator *requires* in every
 * shortest solution (`Tier.requireDivide`), and it is legal on 10 of the 360 opening boards this app
 * can generate — it was 1 of 120 on the tier a child actually met. Measured, not estimated. So a
 * palette that renders only currently-legal moves showed the one essential move on almost no opening
 * board, and the reasonable conclusion for a player was that the feature did not exist. It was
 * reported as missing twice.
 *
 * The first attempt at fixing that was a sentence: "every kind of stone on both pans has to divide
 * evenly — break one first." It did not work either, and the product owner's verdict after finally
 * reasoning the move out unaided was "maybe explanation isn't enough anyway". That is the right
 * read. `docs/research/passion-pipeline/07-child-facing-ux-6-8.md` §2.1 puts text at the weakest end
 * of the channels available here, and §2.2 says what the strong one is: a single popped-out
 * *perceptual feature*, which is mature by 6 where reading a rule is not.
 *
 * So this module turns the divisibility rule into something the pans SHOW:
 *   - `splitMarks` — when the split is legal, which stones and bags it would take away, so the child
 *     sees the consequence before spending a move on it; when it is blocked, WHICH ITEMS ARE LEFT
 *     OVER, which is the remainder and therefore the reason, drawn on the objects themselves.
 *   - `splitBlockers` — which piles those leftovers are in, for counting.
 *   - `unblockingMoves` — which other move gets rid of a leftover, so the causal chain (these two
 *     stones are left over → breaking that one fixes it) can be shown rather than described.
 *
 * NOTHING HERE CHANGES WHEN A SPLIT IS LEGAL. `logic.ts#isLegal` remains the only authority and is
 * untouched; every function below is derived from it. That matters because `naive.test.ts` pins the
 * difficulty guarantee to divide being *conditionally* legal — make it unconditional and
 * `greedyThreeMove` starts solving shipped levels.
 */
import {
  DENOMS,
  type Denom,
  type Move,
  type Pan,
  type Scale,
  type Side,
  applyMove,
  isLegal,
  legalMoves,
  stoneCount,
} from "./logic";

/**
 * The split factors that get a permanent control on the rail.
 *
 * 2 and 3 are not a taste call: across the 360 levels this app generates, every divide in every
 * shortest solution was a ÷2 (213) or a ÷3 (216), and no solution ever used ÷5. `legalMoves` still
 * offers ÷5 when the counts happen to allow it, and the rail shows that extra control on the rare
 * board where they do — but a permanently-blocked ÷5 pill would be a third of the rail spent on a move
 * nobody needs.
 */
export const RAIL_KS = [2, 3] as const;

/** A pile on one pan: a stone denomination, or the bags. Bags divide by k too. */
export type Pile = { side: Side; kind: "bags" } | { side: Side; kind: "stone"; value: Denom };

/** Stable string form, so a component can hold a `Set` of piles without identity trouble. */
export function pileKey(pile: Pile): string {
  return pile.kind === "bags" ? `${pile.side}:bags` : `${pile.side}:${pile.value}`;
}

function panOf(scale: Scale, side: Side): Pan {
  return side === "left" ? scale.left : scale.right;
}

const SIDES: readonly Side[] = ["left", "right"];

/**
 * Every pile that is NOT divisible by `k`, i.e. the piles a child has to change before the split
 * becomes legal. Empty exactly when the split is legal (given a non-empty scale), which is asserted
 * against `isLegal` in split.test.ts rather than assumed here.
 */
export function splitBlockers(scale: Scale, k: number): Pile[] {
  const out: Pile[] = [];
  for (const side of SIDES) {
    const pan = panOf(scale, side);
    if (pan.bags % k !== 0) out.push({ side, kind: "bags" });
    for (const value of DENOMS) {
      if (stoneCount(pan, value) % k !== 0) out.push({ side, kind: "stone", value });
    }
  }
  return out;
}

/**
 * What to draw on the pans for a split by `k`, and it is one of exactly two stories.
 *
 * `kind: "removed"` — the split is legal, and these items go away if it is taken. A ÷2 marks half of
 * every pile, so the child watching the mark appear is watching "half of everything, on both sides"
 * happen before they have spent the move. That is the consequence, previewed.
 *
 * `kind: "leftOver"` — the split is blocked, and these items are the REMAINDER: `count % k` out of
 * each pile, the ones that cannot be grouped into `k`s. Marking the leftovers rather than the whole
 * pile is the difference between showing the rule and shouting about it — three ones under a ÷2 mark
 * exactly one stone, and "one left over" is both the reason and the arithmetic.
 *
 * `marked` is keyed by `pileKey` and holds no zero entries, so `has(key)` alone means "something is
 * marked here". Counts are how many items *at the end* of that pile carry the mark; the renderer
 * marks from the end because stones of a denomination are interchangeable (see `PanView`).
 */
export interface SplitMarks {
  kind: "removed" | "leftOver";
  marked: ReadonlyMap<string, number>;
}

export function splitMarks(scale: Scale, k: number): SplitMarks {
  const legal = isLegal(scale, { kind: "divide", k });
  const marked = new Map<string, number>();
  const mark = (pile: Pile, count: number): void => {
    // How many of `count` carry the mark: everything the split consumes, or the remainder that
    // blocks it. Integer arithmetic only — the scale never holds a fraction of a stone.
    const n = legal ? count - count / k : count % k;
    if (n > 0) marked.set(pileKey(pile), n);
  };
  for (const side of SIDES) {
    const pan = panOf(scale, side);
    mark({ side, kind: "bags" }, pan.bags);
    for (const value of DENOMS) mark({ side, kind: "stone", value }, stoneCount(pan, value));
  }
  return { kind: legal ? "removed" : "leftOver", marked };
}

/**
 * The moves that get a blocked split closer to legal — strictly fewer blocking piles than now. This
 * is the whole reason a child can learn the rule by poking: the blocked control lights up the piles
 * in the way AND the buttons that clear one, so the dependency between two controls is shown on the
 * board instead of asserted in a tutorial.
 *
 * Every move kind is considered, not just breaking a stone. Breaking is the interesting one and the
 * one the rule is usually about, but a bag count is not changed by breaking any number of stones —
 * only by taking a bag off both pans. Measured over the 350 opening boards where no rail split is
 * legal, every move kind lights something on 347. The other 3 are honest dead ends where no single
 * legal move reduces the count, and there the rail marks the leftovers and lights nothing — which is
 * true, and better than a wrong suggestion.
 *
 * IT MUST NOT BECOME A SOLVER, and that is a measured constraint rather than a principle. A child who
 * ignores the maths and presses whatever is lit is `followTheGlow` in naive.ts; without the
 * corresponding filter in the generator that policy solved a third of all levels inside budget. The
 * one-step, blocker-count-only rule below is weak on purpose, and the levels are now selected to
 * survive it.
 *
 * What it claims is narrow and true: this move changes a pile that is in the way. It does NOT claim
 * the move is part of the solution, and it must never be dressed up as one — that would hand over
 * the reasoning the puzzle is made of. Derived from `legalMoves`, so it can never suggest a move the
 * rules would refuse.
 */
export function unblockingMoves(scale: Scale, k: number): Move[] {
  if (isLegal(scale, { kind: "divide", k })) return [];
  const before = splitBlockers(scale, k).length;
  return legalMoves(scale).filter(
    (move) => move.kind !== "divide" && splitBlockers(applyMove(scale, move), k).length < before,
  );
}
