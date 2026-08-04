/**
 * Counting how many goes a solve took.
 *
 * Pulled out of the launcher callbacks because the rule is easy to get subtly wrong and impossible
 * to test where it was: a random puzzle is chosen on mount, so driving this through the UI proves
 * very little. Pure and synchronous; the caller owns the storage.
 *
 * WHAT COUNTS AS A GO. Only a legal move that was not the solution. `attemptMove` already separates
 * that from `illegal`, which is a mis-click, and a mis-click must never count: a child fumbling
 * with a touch screen would otherwise read as failing at chess, and the wellbeing engine turns a
 * low success rate into SCAFFOLD, so it would pull their difficulty down for bad aim.
 */

/** Wrong goes so far, per gadget, for runs currently in progress. */
export type TryTally = Map<string, number>;

export function newTally(): TryTally {
  return new Map();
}

/** A go that did not work. Correct ones are not recorded here; the solve counts itself. */
export function missed(tally: TryTally, gadgetId: string): void {
  tally.set(gadgetId, (tally.get(gadgetId) ?? 0) + 1);
}

/**
 * Close out a run: how many goes it took in total, and whether the child got there the hard way.
 *
 * Clears the gadget, so the next run starts clean. A run that is abandoned rather than solved
 * leaves its count behind until the child comes back to that gadget, which is the lesser of two
 * evils: clearing on exit would lose the tally of a child who stepped away mid-puzzle and returned.
 */
export function solved(
  tally: TryTally,
  gadgetId: string,
): { readonly tries: number; readonly recovered: boolean } {
  const wrong = tally.get(gadgetId) ?? 0;
  tally.delete(gadgetId);
  // +1 for the go that worked. A first-time solve is one try, not zero.
  return { tries: wrong + 1, recovered: wrong > 0 };
}

/**
 * The depth families a solve carries.
 *
 * Getting there after getting it wrong IS `failure_recovery`, and this is the first affordance in
 * the app able to emit it: the family has been in the vocabulary and in the weights all along with
 * nothing to produce it.
 */
export function depthFor(recovered: boolean): readonly string[] {
  return recovered ? ["failure_recovery"] : [];
}
