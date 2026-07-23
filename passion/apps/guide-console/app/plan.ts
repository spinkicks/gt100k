// Pure Plan view-model for the guide console (018-specialization-planner D1). For the selected child,
// for each CERTIFIED spike (ACTIVE, plus CANDIDATE), derive the readiness signals from the 014 profile
// + 013 store, fold in the SAME 016 wellbeing read the wellbeing panel uses, resolve the vetted A6
// curated resources for the cell, and run the pure engine with the DETERMINISTIC STUB brief (no
// network) → a staged `SpecializationPlan` the guide can DISPOSE. The system proposes; nothing is
// applied to the child. No child-facing label/score anywhere.
import { getForKid } from "@gt100k/hypothesis-store";
import {
  curatedForCell,
  derivePlanInputs,
  planSpecializationWithStub,
  type CuratedResource,
  type DomainPath,
  type SpecializationPlan,
} from "@gt100k/specialization-planner";
import { PILOT_CATALOG, ROSTER_NOW, profileFor } from "./console-data.js";
import { wellbeingForKid } from "./wellbeing.js";
import { PLAN_AGE_TIER, PLAN_LIBRARY } from "./plan-library.js";

export interface PlanCardVM {
  readonly id: string;
  readonly cellKey: string;
  readonly state: string; // lifecycle state (ACTIVE / CANDIDATE)
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly resources: readonly CuratedResource[];
  readonly plan: SpecializationPlan;
}

/** A spike is CERTIFIED (plannable) once a human has advanced it to CANDIDATE or ACTIVE. */
function isCertified(state: string): boolean {
  return state === "ACTIVE" || state === "CANDIDATE";
}

/**
 * The selected child's certified-spike plans, escalations sorted first (so "needs your review" leads).
 * Deterministic + synchronous (stub brief) so `next build` + LOOP_QA stay offline.
 */
export function plansForKid(kidId: string): readonly PlanCardVM[] {
  const profile = profileFor(kidId);
  if (!profile) return [];

  const reads = new Map(wellbeingForKid(kidId).map((c) => [c.cellKey, c.read]));

  const out: PlanCardVM[] = [];
  for (const h of getForKid(profile.store, kidId)) {
    if (!isCertified(h.state)) continue;
    const read = reads.get(h.cellKey);
    if (!read) continue;
    const inputs = derivePlanInputs(profile, profile.store, h.cellKey, read, ROSTER_NOW, PILOT_CATALOG);
    if (!inputs) continue; // no voluntary engagement → not a specialization cell
    const resources = curatedForCell(PLAN_LIBRARY, inputs.domainPath, PLAN_AGE_TIER);
    const plan = planSpecializationWithStub(inputs, resources, ROSTER_NOW);
    out.push({
      id: h.id,
      cellKey: h.cellKey,
      state: h.state,
      domainPath: inputs.domainPath,
      mode: inputs.mode,
      resources,
      plan,
    });
  }

  return [...out].sort(
    (a, b) => Number(b.plan.escalateToHuman) - Number(a.plan.escalateToHuman),
  );
}

/** How many of the child's certified-spike plans need a human's review (rest/deload/advance). */
export function planReviewCount(kidId: string): number {
  return plansForKid(kidId).filter((c) => c.plan.escalateToHuman).length;
}
