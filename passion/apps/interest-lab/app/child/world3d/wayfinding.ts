import type { IslandView } from "@gt100k/interest-lab-view";
import { domainBannerLabel, resolveFocusedDomain } from "./beacon";

// Apple wayfinding: at every moment the child can answer "where am I", "where can I go",
// "what have I collected", and "how do I get out". The focused-island banner (P0.4) and the
// focusable islands answer the first two; this resolver answers the collection count and the
// escape hatch back to the whole archipelago. Pure so the DOM chip + button are unit-testable.

export interface WorldWayfinding {
  /** Quests collected so far, clamped into the world's real range. */
  pickedCount: number;
  /** How many quests exist in the world (unique island markers). */
  questTotal: number;
  /** Child-facing collection label, e.g. "2 of 8 quests collected". */
  countLabel: string;
  /** True when focused on an island — the overview control has somewhere to drift back from. */
  overviewAvailable: boolean;
  /** Name of the island being visited, or null at the archipelago overview. */
  focusedDomainLabel: string | null;
}

/** Count the unique quest markers scattered across the archipelago. */
export function countWorldQuests(islands: readonly IslandView[]): number {
  const ids = new Set<string>();
  for (const island of islands) {
    for (const marker of island.markers) ids.add(marker.probeId);
  }
  return ids.size;
}

/**
 * Map world state → the persistent wayfinding answers. `pickedCount` is clamped into
 * `[0, questTotal]` so a stray pick can never render "9 of 8"; `overviewAvailable` is true
 * exactly when a specific island is focused (so the "see all" control is actionable only when
 * there is something to zoom back out from).
 */
export function resolveWorldWayfinding(
  islands: readonly IslandView[],
  focusedProbeId: string | null,
  pickedCount: number,
): WorldWayfinding {
  const questTotal = countWorldQuests(islands);
  const safePicked = Math.max(0, Math.min(Math.trunc(pickedCount), questTotal));
  const focusedDomain = resolveFocusedDomain(islands, focusedProbeId);
  const noun = questTotal === 1 ? "quest" : "quests";
  return {
    pickedCount: safePicked,
    questTotal,
    countLabel:
      questTotal === 0 ? "No quests yet" : `${safePicked} of ${questTotal} ${noun} collected`,
    overviewAvailable: focusedDomain !== null,
    focusedDomainLabel: focusedDomain === null ? null : domainBannerLabel(focusedDomain),
  };
}
