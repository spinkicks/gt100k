"use client";

import type { IslandView } from "@gt100k/interest-lab-view";
import { resolveWorldWayfinding } from "./world3d/wayfinding";

export interface WorldWayfindingProps {
  islands: readonly IslandView[];
  focusedProbeId: string | null;
  pickedCount: number;
  /** Drift back out to the whole archipelago (clears the focused island). */
  onOverview: () => void;
}

/**
 * Persistent world HUD: the child always sees how many quests they have collected and always has
 * a way back out to the archipelago. Lives in the DOM (not the canvas) so both answers are
 * announced to assistive tech and legible on the board-2d tier. The overview button is enabled
 * only when an island is focused — at the archipelago there is nowhere further out to go.
 */
export function WorldWayfinding({
  islands,
  focusedProbeId,
  pickedCount,
  onOverview,
}: WorldWayfindingProps) {
  const way = resolveWorldWayfinding(islands, focusedProbeId, pickedCount);
  return (
    <nav
      className="world-wayfinding"
      aria-label="Where am I"
      data-overview-available={way.overviewAvailable}
    >
      <p
        className="world-wayfinding__count"
        aria-live="polite"
        data-my-quests-count={way.pickedCount}
      >
        <span className="world-wayfinding__count-value">{way.pickedCount}</span>
        <span className="world-wayfinding__count-total">/ {way.questTotal}</span>
        <span className="world-wayfinding__count-label">quests collected</span>
      </p>
      <button
        type="button"
        className="world-wayfinding__overview"
        onClick={onOverview}
        disabled={!way.overviewAvailable}
        data-overview-control="true"
        aria-label={
          way.focusedDomainLabel
            ? `Leave ${way.focusedDomainLabel} and see all islands`
            : "See all islands"
        }
      >
        See all islands
      </button>
    </nav>
  );
}
