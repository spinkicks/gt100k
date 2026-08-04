// Pure wellbeing view-model for the guide console (016-wellbeing). For the selected child, derive
// per-spike behavioral signals from the 014 profile + 013 store and run the pure `assessWellbeing`
// engine, so the panel can show the human a recommendation to DISPOSE — the system never acts on the
// child. No child-facing label/score anywhere (guardrail).
import type { DomainPath } from "@gt100k/interest-inference";
import { getForKid } from "@gt100k/hypothesis-store";
import { isPlannableState } from "@gt100k/specialization-planner";
import { assessWellbeing, deriveWellbeingSignals, type WellbeingRead } from "@gt100k/wellbeing";
import { PILOT_CATALOG, ROSTER_NOW, profileFor } from "./console-data.js";

export interface WellbeingCardVM {
  readonly id: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly read: WellbeingRead;
  /**
   * How the work is actually going, when enough of it has been judged to say.
   *
   * The difficulty recommendation is derived from this, and a guide who can only see the
   * recommendation has to take it on faith. Absent for most spikes, because most surfaces cannot
   * tell a right answer from a wrong one, and saying so is better than implying we know.
   */
  readonly successRate?: number;
}

// Escalations sort to the top so a guide sees "needs your review" first; ties keep the store's
// lowerBound-desc order (getForKid is already ranked).
export function wellbeingForKid(kidId: string): readonly WellbeingCardVM[] {
  const profile = profileFor(kidId);
  if (!profile) return [];
  const cards = getForKid(profile.store, kidId).map((h): WellbeingCardVM => {
    const signals = deriveWellbeingSignals(profile, h.cellKey, ROSTER_NOW, PILOT_CATALOG);
    // Phase gate: the pressure/burnout half fires only once a spike is an active specialization
    // (a human-gated CANDIDATE/ACTIVE state). A spike still in discovery — or one parked, contested
    // or being reconsidered — is not an active pursuit, so a child cannot be burning out on it, and
    // only challenge calibration should surface. Keyed on the 013 lifecycle state, never on age.
    const pressureActive = isPlannableState(h.state);
    return {
      id: h.id,
      cellKey: h.cellKey,
      domainPath: h.domainPath,
      mode: h.mode,
      read: assessWellbeing(signals, { pressureActive }),
      ...(signals.successRate === undefined ? {} : { successRate: signals.successRate }),
    };
  });
  return [...cards].sort((a, b) => Number(b.read.escalateToHuman) - Number(a.read.escalateToHuman));
}

/** How many of the child's spikes need a human's review (a back-off / rest / gap / devaluation). */
export function escalationCount(kidId: string): number {
  return wellbeingForKid(kidId).filter((c) => c.read.escalateToHuman).length;
}
