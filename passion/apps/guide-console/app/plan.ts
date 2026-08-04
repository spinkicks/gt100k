// Pure Plan view-model for the guide console (018-specialization-planner D1). For the selected child,
// for each CERTIFIED spike (ACTIVE, plus CANDIDATE), derive the readiness signals from the 014 profile
// + 013 store, fold in the SAME 016 wellbeing read the wellbeing panel uses, resolve the vetted A6
// curated resources for the cell, and run the pure engine with the DETERMINISTIC STUB brief (no
// network) → a staged `SpecializationPlan` the guide can DISPOSE. The system proposes; nothing is
// applied to the child. No child-facing label/score anywhere.
import { getForKid, type HypothesisStore } from "@gt100k/hypothesis-store";
import {
  curatedForCell,
  derivePlanInputs,
  isPlannableState,
  planSpecializationWithStub,
  type CuratedResource,
  type DomainPath,
  type SpecializationPlan,
} from "@gt100k/specialization-planner";
import { CONSOLE_CATALOG, nowFor, profileFor } from "./console-data.js";
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

/**
 * The selected child's certified-spike plans, escalations sorted first (so "needs your review" leads).
 * Deterministic + synchronous (stub brief) so `next build` + LOOP_QA stay offline.
 *
 * `store` is the LIVE hypothesis store, the one a guide's promote/park writes to. It has to be
 * passed in: `profile.store` is the module-scope seed built once at import, so reading certification
 * from there meant a promotion made in the console produced no plan, and Access, which is built on
 * this function, stayed silent too. Defaulting to the seed keeps callers that only want the
 * as-seeded view (the tests, and any static render) working unchanged.
 *
 * Note it is only CERTIFICATION that comes from the store. The readiness signals still come from the
 * profile's interaction log, because promoting a spike does not change what the child did.
 */
export function plansForKid(kidId: string, store?: HypothesisStore): readonly PlanCardVM[] {
  const profile = profileFor(kidId);
  if (!profile) return [];
  const lifecycle = store ?? profile.store;

  const reads = new Map(wellbeingForKid(kidId).map((c) => [c.cellKey, c.read]));

  const out: PlanCardVM[] = [];
  for (const h of getForKid(lifecycle, kidId)) {
    // An early-out only. `derivePlanInputs` enforces the same rule and returns null regardless, so
    // this skips work rather than deciding anything; the rule itself lives in the engine.
    if (!isPlannableState(h.state)) continue;
    const read = reads.get(h.cellKey);
    if (!read) continue;
    const inputs = derivePlanInputs(
      profile,
      // The live store again, not the seed: the deriver re-checks certification itself, so handing
      // it the seed here would refuse the very promotion this function is meant to react to.
      lifecycle,
      h.cellKey,
      read,
      // The whole catalogue and the CHILD's clock. This used to be the pilot fixtures and a fixed
      // April date, so a real child's gadget ids resolved to nothing, `voluntary` came back empty,
      // and the panel showed no plan at all for anyone who had actually been promoted.
      nowFor(kidId),
      CONSOLE_CATALOG,
    );
    if (!inputs) continue; // no voluntary engagement → not a specialization cell
    const resources = curatedForCell(PLAN_LIBRARY, inputs.domainPath, PLAN_AGE_TIER);
    const plan = planSpecializationWithStub(inputs, resources, nowFor(kidId));
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

  return [...out].sort((a, b) => Number(b.plan.escalateToHuman) - Number(a.plan.escalateToHuman));
}

/** How many of the child's certified-spike plans need a human's review (rest/deload/advance). */
export function planReviewCount(kidId: string, store?: HypothesisStore): number {
  return plansForKid(kidId, store).filter((c) => c.plan.escalateToHuman).length;
}
