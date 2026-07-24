// Pure Family view-model for the guide console (021 — folds the F3 / 019 family surface into the
// cockpit as a read-only tab). For the selected child, derive the per-child family signals from the
// 013 store + the 016 wellbeing reads, layer the SYNTHETIC guide observations, and run the pure
// `assessFamily` engine → a `FamilyRead` the guide reviews (system proposes, human disposes). No
// child/family-facing label, no score, no reward. Mirrors the retired `apps/family` data source.
import {
  assessFamily,
  deriveFamilySignals,
  type FamilyRead,
  type FamilySignals,
} from "@gt100k/family";
import { PILOT_CATALOG, ROSTER_NOW, profileFor } from "./console-data.js";
import { wellbeingForKid } from "./wellbeing.js";

// SYNTHETIC guide-supplied observations (019 §3.2 / D6): the unobservable parental signals are NEVER
// software-inferred — they stand in for notes a human guide would enter, so the tab can demonstrate
// the elevated / "needs your review" state. Behavioral 013/016 signals stay honestly derived.
const GUIDE_OBSERVATIONS: Readonly<Record<string, Partial<FamilySignals>>> = {
  "kid-synthetic-002": { conditionalRegardObserved: true },
  "kid-synthetic-003": { lowFamilyEngagement: true },
};

const OBSERVATION_LABELS: Readonly<Record<string, string>> = {
  parentalOverValuation: "family over-values the activity",
  conditionalRegardObserved: "approval made contingent on performance",
  familyControlObserved: "pressure / intrusion / surveillance",
  lowFamilyEngagement: "little shared co-engagement",
};

/** The family co-engagement read for one child (roster + 016 reads + synthetic observations). */
export function familyForKid(kidId: string): FamilyRead | undefined {
  const profile = profileFor(kidId);
  if (!profile) return undefined;
  const reads = wellbeingForKid(kidId).map((c) => c.read);
  const derived = deriveFamilySignals(profile, profile.store, reads, ROSTER_NOW, PILOT_CATALOG);
  const signals: FamilySignals = { ...derived, ...(GUIDE_OBSERVATIONS[kidId] ?? {}) };
  return assessFamily(signals);
}

/** The synthetic guide observations attached to a child, as human-readable labels. */
export function familyObservationsForKid(kidId: string): readonly string[] {
  const obs = GUIDE_OBSERVATIONS[kidId];
  if (!obs) return [];
  return Object.entries(obs)
    .filter(([, v]) => v === true)
    .map(([k]) => OBSERVATION_LABELS[k] ?? k);
}

/** Tab count for the Family lens: how many coaching offers (door-opening asks + shared activities). */
export function familyOfferCount(read: FamilyRead | undefined): number {
  return read ? read.asks.length + read.sharedActivities.length : 0;
}
