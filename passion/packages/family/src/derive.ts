// The deriver (spec 019 §3.5): fill the per-CHILD `FamilySignals` it can from the 013 hypothesis
// store + the 016 wellbeing reads (one per spike, as produced by `@gt100k/wellbeing`). Pure +
// deterministic. NO affect inference anywhere — every value is behavioral or read off the 016 reads.
//
// The unobservable parental signals (over-valuation, conditional regard, control) and
// `lowFamilyEngagement` are left `undefined` — they are optional GUIDE-supplied observations, never
// software-inferred (§3.5 / D6).
import type { StudentProfile } from "@gt100k/student-profile";
import { getForKid, type HypothesisStore } from "@gt100k/hypothesis-store";
import { deriveWellbeingSignals, type WellbeingRead } from "@gt100k/wellbeing";
import type { Artifact } from "@gt100k/two-axis-tagging";
import { OVER_IDENTIFICATION_MIN_SHARE, type FamilySignals } from "./model.js";

// A "tracked" spike for the plurality count = ACTIVE + CANDIDATE (013 lifecycle).
const TRACKED = new Set(["ACTIVE", "CANDIDATE"]);

/**
 * Derive the per-child family signals. From the 013 store: `activeSpikes` (ACTIVE+CANDIDATE count) and
 * `overIdentification` (one spike commands ≥ OVER_IDENTIFICATION_MIN_SHARE of the child's evidence
 * mass). From the 016 reads: `anyStakesEvent` (any DANGER_WINDOW), `anyDevaluation` (any BURNOUT_TIP),
 * `anyBackOffOrRest` (any backOff||rest), `pressuredSpecialization` (a stakes read on a spike whose
 * return is declining — re-derived from the profile through the tested wellbeing deriver).
 * @param catalog artifact catalog used to resolve the log to cells (default empty → safe default).
 */
export function deriveFamilySignals(
  profile: StudentProfile,
  store: HypothesisStore,
  wellbeingReads: readonly WellbeingRead[],
  now: string,
  catalog: ReadonlyMap<string, Artifact> = new Map(),
): FamilySignals {
  const kidId = profile.kidId;
  const spikes = getForKid(store, kidId);

  // 013 — plurality vs over-identification.
  const activeSpikes = spikes.filter((h) => TRACKED.has(h.state)).length;

  // 013 — over-identification proxy: one spike dominates the child's tracked evidence mass.
  const masses = spikes.map((h) => h.evidence.mean).filter((m) => m > 0);
  const total = masses.reduce((sum, m) => sum + m, 0);
  const overIdentification = total > 0 && Math.max(...masses) / total >= OVER_IDENTIFICATION_MIN_SHARE;

  // 016 reads — behavioral windows surfaced by the wellbeing engine.
  const anyStakesEvent = wellbeingReads.some((r) => r.state === "DANGER_WINDOW");
  const anyDevaluation = wellbeingReads.some((r) => r.state === "BURNOUT_TIP");
  const anyBackOffOrRest = wellbeingReads.some((r) => r.backOff === true || r.rest === true);

  // pressured specialization: a stakes read coinciding with a declining-return spike. Re-derive the
  // spike's return trend from the profile through the tested 016 deriver (no affect inference).
  const pressuredSpecialization = wellbeingReads.some((r) => {
    if (r.state !== "DANGER_WINDOW") return false;
    const sig = deriveWellbeingSignals(profile, r.cellKey, now, catalog);
    return sig.returnTrend === "declining";
  });

  return {
    kidId,
    now,
    activeSpikes,
    anyStakesEvent,
    anyDevaluation,
    anyBackOffOrRest,
    overIdentification,
    pressuredSpecialization,
  };
}
