// Pure wellbeing view-model for the guide console (016-wellbeing). For the selected child, derive
// per-spike behavioral signals from the 014 profile + 013 store and run the pure `assessWellbeing`
// engine, so the panel can show the human a recommendation to DISPOSE — the system never acts on the
// child. No child-facing label/score anywhere (guardrail).
import type { DomainPath } from "@gt100k/interest-inference";
import { getForKid } from "@gt100k/hypothesis-store";
import { assessWellbeing, deriveWellbeingSignals, type WellbeingRead } from "@gt100k/wellbeing";
import { PILOT_CATALOG, ROSTER_NOW, profileFor } from "./console-data.js";

export interface WellbeingCardVM {
  readonly id: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly read: WellbeingRead;
}

// Escalations sort to the top so a guide sees "needs your review" first; ties keep the store's
// lowerBound-desc order (getForKid is already ranked).
export function wellbeingForKid(kidId: string): readonly WellbeingCardVM[] {
  const profile = profileFor(kidId);
  if (!profile) return [];
  const cards = getForKid(profile.store, kidId).map((h): WellbeingCardVM => {
    const signals = deriveWellbeingSignals(profile, h.cellKey, ROSTER_NOW, PILOT_CATALOG);
    return {
      id: h.id,
      cellKey: h.cellKey,
      domainPath: h.domainPath,
      mode: h.mode,
      read: assessWellbeing(signals),
    };
  });
  return [...cards].sort(
    (a, b) => Number(b.read.escalateToHuman) - Number(a.read.escalateToHuman),
  );
}

/** How many of the child's spikes need a human's review (a back-off / rest / gap / devaluation). */
export function escalationCount(kidId: string): number {
  return wellbeingForKid(kidId).filter((c) => c.read.escalateToHuman).length;
}
