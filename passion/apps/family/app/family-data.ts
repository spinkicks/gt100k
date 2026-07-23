// GENUINELY-DERIVED family reads for the family co-engagement surface (SYNTHETIC ONLY — no real
// family or child data, ever).
//
// The roster is produced by the REAL discovery chain (`buildPilotRoster` runs 012 → 011 → 013 over
// per-kid synthetic interaction logs), exactly as the guide console does. For each child we build the
// 016 wellbeing reads (one per spike) through the REAL wellbeing engine, then feed the 013 store +
// 016 reads to `deriveFamilySignals` and run the pure `assessFamily` engine (019). Everything here is
// deterministic + offline: no network, no clock (the pinned `PILOT_NOW`), no mutation.
//
// The four canonical synthetic kids (insertion order from `buildPilotRoster`):
//   001 Ari    — healthy; baseline coaching posture (the window.__qa kid)
//   002 Bex    — a synthetic guide observation (conditional regard) tips the pressure watch to ELEVATED
//   003 Cyrus  — a synthetic guide observation (low family engagement) → build the complex environment
//   004 Dulce  — established + healthy; baseline
import { getForKid } from "@gt100k/hypothesis-store";
import {
  assessWellbeing,
  deriveWellbeingSignals,
  type WellbeingRead,
} from "@gt100k/wellbeing";
import {
  buildPilotRoster,
  PILOT_CATALOG,
  PILOT_NOW,
  type Roster,
  type StudentProfile,
} from "@gt100k/student-profile";
import {
  assessFamily,
  deriveFamilySignals,
  type FamilyRead,
  type FamilySignals,
} from "@gt100k/family";

export interface Child {
  readonly id: string;
  readonly name: string;
}

export const FAMILY_NOW = PILOT_NOW;

// Build the derived roster ONCE (runCycle over the synthetic per-kid logs). Insertion order is
// 001 → 004, so Ari (the window.__qa kid) is CHILDREN[0].
const ROSTER: Roster = buildPilotRoster(PILOT_NOW);

export const CHILDREN: readonly Child[] = [...ROSTER.values()].map((p) => ({
  id: p.kidId,
  name: p.displayName,
}));

// SYNTHETIC guide-supplied observations (spec §3.2 / D6). The unobservable parental signals
// (over-valuation, conditional regard, control) and low-family-engagement are NEVER software-inferred
// — they are optional notes a human guide enters. These stand in for that input so the surface can
// demonstrate every coaching posture + the "Needs your review" escalation. Clearly labeled in the UI
// as synthetic guide notes; the behavioral 013/016 signals stay honestly derived.
export const GUIDE_OBSERVATIONS: Readonly<Record<string, Partial<FamilySignals>>> = {
  "kid-synthetic-002": { conditionalRegardObserved: true },
  "kid-synthetic-003": { lowFamilyEngagement: true },
};

// Human-readable label for a synthetic guide observation (so the UI never shows a raw signal key).
export const OBSERVATION_LABELS: Readonly<Record<string, string>> = {
  parentalOverValuation: "family over-values the activity",
  conditionalRegardObserved: "approval made contingent on performance",
  familyControlObserved: "pressure / intrusion / surveillance",
  lowFamilyEngagement: "little shared co-engagement",
};

/** The synthetic guide observations attached to a child, as human-readable labels. */
export function observationsForKid(kidId: string): readonly string[] {
  const obs = GUIDE_OBSERVATIONS[kidId];
  if (!obs) return [];
  return Object.entries(obs)
    .filter(([, v]) => v === true)
    .map(([k]) => OBSERVATION_LABELS[k] ?? k);
}

// The selected child's per-spike 016 wellbeing reads — derived from the interaction log (014) + the
// store (013), NOT mutated by any human action on this surface.
function wellbeingReadsForKid(profile: StudentProfile): readonly WellbeingRead[] {
  return getForKid(profile.store, profile.kidId).map((h) =>
    assessWellbeing(deriveWellbeingSignals(profile, h.cellKey, FAMILY_NOW, PILOT_CATALOG)),
  );
}

/**
 * The family co-engagement read for one child: derive the per-child signals from 013 + 016, layer the
 * synthetic guide observations on top, and run the pure `assessFamily` engine. Pure + deterministic.
 */
export function familyReadForKid(kidId: string): FamilyRead | undefined {
  const profile = ROSTER.get(kidId);
  if (!profile) return undefined;
  const reads = wellbeingReadsForKid(profile);
  const derived = deriveFamilySignals(profile, profile.store, reads, FAMILY_NOW, PILOT_CATALOG);
  const signals: FamilySignals = { ...derived, ...(GUIDE_OBSERVATIONS[kidId] ?? {}) };
  return assessFamily(signals);
}

/** Every child's family read, keyed by kid id (insertion order preserved). */
export function familyReads(): ReadonlyMap<string, FamilyRead> {
  const m = new Map<string, FamilyRead>();
  for (const child of CHILDREN) {
    const read = familyReadForKid(child.id);
    if (read) m.set(child.id, read);
  }
  return m;
}

/** Roster-level "needs your review" queue: how many children's reads escalate to a human. */
export function rosterEscalationCount(): number {
  let n = 0;
  for (const read of familyReads().values()) if (read.escalateToHuman) n++;
  return n;
}

export function childInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
