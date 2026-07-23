// A synthetic child (SC-7) built by running the REAL discovery orchestrator (`runCycle`) over a
// hand-authored interaction log + a one-artifact catalog — SYNTHETIC ONLY. The log makes ONE spike
// strongly dominant (so the 013 store yields `overIdentification`) with a DECLINING recent return
// (early voluntary depth, then prompted-only compliance). Paired with two 016 reads — a stakes window
// (DANGER_WINDOW) + a devaluation (BURNOUT_TIP) on that spike — it drives the deriver to
// `anyStakesEvent`, `anyDevaluation`, `overIdentification`, and `assessFamily` → `risk:"elevated"`.
import type { Artifact } from "@gt100k/two-axis-tagging";
import { serializeCellKey } from "@gt100k/interest-inference";
import { emptyProfile, runCycle, type StudentProfile } from "@gt100k/student-profile";
import { assessWellbeing, type WellbeingRead } from "@gt100k/wellbeing";

// Derive the log element type from the orchestrator's signature (avoids a direct dependency on
// @gt100k/signal-pipeline — family's deps stay the pinned five).
type Interaction = Parameters<typeof runCycle>[1][number];

export const DOMINANT_NOW = "2026-04-01T00:00:00.000Z";
export const DOMINANT_KID = "kid-synthetic-919";
export const DOMINANT_CELL_KEY = serializeCellKey(["music-sound", "audio-systems"], "build");

const ARTIFACT: Artifact = {
  id: "dominant-audio",
  domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["build", "investigate", "perform"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

export const DOMINANT_CATALOG: ReadonlyMap<string, Artifact> = new Map([[ARTIFACT.id, ARTIFACT]]);

const iso = (d: string): string => `${d}T00:00:00.000Z`;
const mk = (date: string, session: string, over: Partial<Interaction> = {}): Interaction => ({
  kidId: DOMINANT_KID,
  artifactId: ARTIFACT.id,
  actionType: "assemble", // resolves to the `build` mode on this artifact
  timestamp: iso(date),
  prompted: false,
  sessionId: session,
  ...over,
});

// OLDER window (age 21–42d before NOW): voluntary returns that went deep by choice.
// RECENT window (age ≤ 21d): prompted-only returns, no depth → declining return + compliance-only.
const LOG: readonly Interaction[] = [
  mk("2026-02-25", "s0", { depth: 1, depthSignals: [{ kind: "chosen_challenge", value: 1 }] }),
  mk("2026-03-01", "s1", { depth: 1, depthSignals: [{ kind: "chosen_challenge", value: 1 }] }),
  mk("2026-03-05", "s2", { depth: 1, depthSignals: [{ kind: "artifact_competence", value: 1 }] }),
  mk("2026-03-20", "s3", { prompted: true }),
  mk("2026-03-27", "s4", { prompted: true }),
];

/** The single-dominant-spike profile: run the real 012→011→013 chain over the hand-authored log. */
export function buildDominantSpikeProfile(now: string = DOMINANT_NOW): StudentProfile {
  return runCycle(emptyProfile(DOMINANT_KID, "Synthetic Dominant"), LOG, { catalog: DOMINANT_CATALOG }, now);
}

/**
 * Two authentic 016 reads on the dominant spike, built through the REAL wellbeing engine: a stakes
 * window (DANGER_WINDOW) and a quiet devaluation (BURNOUT_TIP).
 */
export function buildDominantWellbeingReads(now: string = DOMINANT_NOW): readonly WellbeingRead[] {
  const stakes = assessWellbeing({
    kidId: DOMINANT_KID,
    cellKey: DOMINANT_CELL_KEY,
    returnTrend: "declining",
    depthTrend: "declining",
    stakesEvent: true,
    now,
  });
  const devaluation = assessWellbeing({
    kidId: DOMINANT_KID,
    cellKey: DOMINANT_CELL_KEY,
    returnTrend: "declining",
    depthTrend: "declining",
    devaluation: true,
    now,
  });
  return [stakes, devaluation];
}
