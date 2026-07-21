import type { CohortHealthEvent } from "./model";
import type { SafeguardingSink } from "./ports";

/** An in-flight cohort move that can be held without entering optimization. */
export interface ActiveCohortMove {
  moveId: string;
  touches: string[];
  paused?: true;
}

/**
 * Routes a health event directly to the human safeguarding queue.
 * Conflicting moves are paused in place; no solver, rating, or objective is consulted.
 */
export async function routeHealthEvent(
  sink: SafeguardingSink,
  event: CohortHealthEvent,
  activeMoves: ActiveCohortMove[] = [],
): Promise<void> {
  const affectedMembers = new Set(event.affectedMembers);

  for (const move of activeMoves) {
    if (move.touches.some((learnerRef) => affectedMembers.has(learnerRef))) {
      move.paused = true;
    }
  }

  await sink.submit(event);
}
