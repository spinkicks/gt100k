// Synthetic FamilySignals fixtures — one bundle per §3.3 posture, plus the special cases the
// guardrail tests exercise (§3.4 / SC-2..SC-6). SYNTHETIC ONLY. Each bundle starts from a healthy
// baseline (`base`) and flips only the signals that select its branch.
import type { FamilySignals } from "../model.js";

const NOW = "2026-04-01T00:00:00.000Z";

/** A healthy baseline: two plural spikes, nothing firing. */
export function base(over: Partial<FamilySignals> = {}): FamilySignals {
  return {
    kidId: "kid-fixture",
    now: NOW,
    activeSpikes: 2,
    anyStakesEvent: false,
    anyDevaluation: false,
    anyBackOffOrRest: false,
    overIdentification: false,
    pressuredSpecialization: false,
    ...over,
  };
}

// ── One bundle per §3.3 posture (priority order) ────────────────────────────────
/** 1. Elevated pressure — a named guide-observed antecedent. */
export const ELEVATED_SIGNALS: FamilySignals = base({ parentalOverValuation: true });

/** 2. Rising stakes (counter-cyclical) — a stakes window, no elevated antecedent. */
export const RISING_STAKES_SIGNALS: FamilySignals = base({ anyStakesEvent: true });

/** 3. Strain present — quiet devaluation / a back-off, but no stakes window and no elevated antecedent. */
export const STRAIN_SIGNALS: FamilySignals = base({ anyBackOffOrRest: true });

/** 4. Low family engagement — little shared co-engagement, nothing else firing. */
export const LOW_ENGAGEMENT_SIGNALS: FamilySignals = base({ lowFamilyEngagement: true });

/** 5. Baseline (healthy). */
export const BASELINE_SIGNALS: FamilySignals = base();

// ── Guardrail / SC special cases ─────────────────────────────────────────────────
/** Over-identification under rising stakes → elevated (plurality/reversibility must be protected). */
export const OVER_IDENTIFICATION_SIGNALS: FamilySignals = base({
  activeSpikes: 1,
  overIdentification: true,
  anyStakesEvent: true,
});

/** Pressured specialization coinciding with declining return → elevated. */
export const PRESSURED_SPECIALIZATION_SIGNALS: FamilySignals = base({
  pressuredSpecialization: true,
  anyDevaluation: true,
});

/** Conditional regard observed → elevated. */
export const CONDITIONAL_REGARD_SIGNALS: FamilySignals = base({ conditionalRegardObserved: true });

/** Family control/intrusion observed → elevated. */
export const FAMILY_CONTROL_SIGNALS: FamilySignals = base({ familyControlObserved: true });
