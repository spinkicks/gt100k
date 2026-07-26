// deriveBrokerInputs — assemble the engine's `BrokerInputs` from the already-computed upstream reads
// (the 018 SpecializationPlan, the 016 WellbeingRead, the 014 age/readiness band) plus any existing
// brokerages. PURE; no fetching — the plan/read are computed by their own engines and passed in.
import type { AgeBand, Brokerage, SpecializationPlan, WellbeingRead } from "./model.js";
import type { BrokerInputs } from "./broker.js";

/**
 * Bundle the broker's inputs for one certified spike. `existing` defaults to `[]` (a fresh spike with
 * no prior brokerages). No merging/derivation beyond wiring — the plan already names the current-stage
 * mentor role + audience level the engine reads.
 */
export function deriveBrokerInputs(
  plan: SpecializationPlan,
  wellbeing: WellbeingRead,
  ageBand: AgeBand,
  existing: readonly Brokerage[] = [],
): BrokerInputs {
  return { plan, wellbeing, ageBand, existing };
}
