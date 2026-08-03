// The console's recovery surface, glued to the pure catalog in @gt100k/wellbeing.
//
// recoveryFor takes a trigger; the wellbeing STRIP hands us a read.state (a WellbeingState), and the
// engagement signal hands us a fading flag. This module is the one place that turns each of those
// into a trigger, so the panel and the trigger buttons never disagree about when recovery applies.
import {
  recoveryFor,
  type BreakGuidance,
  type EvidenceGrade,
  type PivotGuidance,
  type RecoveryMove,
  type RecoveryPlan,
  type RecoveryTrigger,
} from "@gt100k/wellbeing";

export { recoveryFor };
export type {
  BreakGuidance,
  EvidenceGrade,
  PivotGuidance,
  RecoveryMove,
  RecoveryPlan,
  RecoveryTrigger,
};

/** A wellbeing read.state has a recovery plan only for the two burnout states. Everything else — a
 *  healthy or merely watchful state — returns null so no trigger button appears. */
export function recoveryTriggerForState(state: string): RecoveryTrigger | null {
  return state === "BURNOUT_TIP" || state === "EARLY_BURNOUT" ? state : null;
}

/** Every claim id a plan references, deduped. Used by the citation contract test. */
export function planClaimIds(plan: RecoveryPlan): string[] {
  const ids = new Set<string>();
  for (const m of plan.moves) for (const id of m.claimIds) ids.add(id);
  for (const id of plan.breakGuidance?.claimIds ?? []) ids.add(id);
  for (const id of plan.pivotGuidance.claimIds) ids.add(id);
  return [...ids];
}
