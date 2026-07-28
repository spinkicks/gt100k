/**
 * Which tier a puzzle should OPEN a mount at, given `PuzzleProps.tier`.
 *
 * ===========================================================================================
 * `tier` GROWS WITHOUT BOUND. A PUZZLE'S TIER LIST DOES NOT. CLAMP, NEVER WRAP.
 * ===========================================================================================
 *
 * `GadgetOverlay` implements "Try a harder one" as `setTier(t => t + 1)` followed by a remount, so
 * `tier` counts presses: 0, 1, 2, 3, … forever. The three music activities each have exactly three
 * tiers and each resolves a round index with `tierForIndex(index) = index % TIERS.length`, which is
 * correct for the thing it was written for — the "Next puzzle" button *inside* a mount, where
 * cycling is deliberate so no session ends on its hardest round. Handed the overlay's counter it is
 * wrong in the one way that matters: **the third press of "Try a harder one" wraps back to the
 * easiest board.** The button says "harder", the child gets easier, and nothing fails.
 *
 * Nonogram already hit this and already documented it — see `sizeForTier` in
 * `puzzles/Nonogram/Nonogram.tsx`, which clamps for exactly this reason while `roundFor` keeps
 * wrapping for the within-mount case. This is that fix, extracted so the next puzzle to accept
 * `tier` gets it for free instead of rediscovering it.
 *
 * Clamping does not cost variety. `GadgetOverlay`'s `GadgetPuzzle` holds its seed in state and is
 * unmounted while the solved panel is up, so every press of "harder" remounts it with a **fresh
 * seed**: two opens at the same clamped tier are two different puzzles at the same difficulty, which
 * is what the button honestly promises once there is no harder tier left to give.
 *
 * Anything that sets `Gadget.supportsTier` must route `PuzzleProps.tier` through this (or clamp for
 * itself, as Nonogram does). The flag's own doc comment in `game/types.ts` is explicit that an
 * unbacked promise of a harder board "would make the app lie to a child".
 */
export function openTier(tier: number, tierCount: number): number {
  if (!Number.isFinite(tier) || tierCount < 1) return 0;
  return Math.min(Math.max(Math.trunc(tier), 0), tierCount - 1);
}
