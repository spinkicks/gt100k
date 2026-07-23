// A synthetic 014 StudentProfile whose interaction log shows the quiet-devaluation pattern (SC-7):
// EARLY voluntary depth (the child chose harder work of their own accord) then a slide into
// PROMPTED-only, compliance-without-depth returns and no recent voluntary return. Built by running
// the REAL orchestrator (`runCycle`) over a hand-authored log + a one-artifact catalog — SYNTHETIC.
import type { Interaction } from "@gt100k/signal-pipeline";
import type { Artifact } from "@gt100k/two-axis-tagging";
import { serializeCellKey } from "@gt100k/interest-inference";
import { emptyProfile, runCycle, type StudentProfile } from "@gt100k/student-profile";

export const DEVAL_NOW = "2026-04-01T00:00:00.000Z";
export const DEVAL_KID = "kid-synthetic-777";
export const DEVAL_CELL_KEY = serializeCellKey(["music-sound", "audio-systems"], "build");

const ARTIFACT: Artifact = {
  id: "deval-audio",
  domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["build", "investigate", "perform"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

export const DEVAL_CATALOG: ReadonlyMap<string, Artifact> = new Map([[ARTIFACT.id, ARTIFACT]]);

const iso = (d: string): string => `${d}T00:00:00.000Z`;
const mk = (date: string, session: string, over: Partial<Interaction> = {}): Interaction => ({
  kidId: DEVAL_KID,
  artifactId: ARTIFACT.id,
  actionType: "assemble", // resolves to the `build` mode on this artifact
  timestamp: iso(date),
  prompted: false,
  sessionId: session,
  ...over,
});

// OLDER window (age 21–42d before NOW): voluntary returns that went deep by choice.
// RECENT window (age ≤ 21d): prompted-only returns, no depth → compliance without depth.
const LOG: readonly Interaction[] = [
  mk("2026-02-25", "s0", { depth: 1, depthSignals: [{ kind: "chosen_challenge", value: 1 }] }),
  mk("2026-03-01", "s1", { depth: 1, depthSignals: [{ kind: "chosen_challenge", value: 1 }] }),
  mk("2026-03-05", "s2", { depth: 1, depthSignals: [{ kind: "artifact_competence", value: 1 }] }),
  mk("2026-03-20", "s3", { prompted: true }),
  mk("2026-03-27", "s4", { prompted: true }),
];

/** The devaluation profile: run the real 012→011→013 chain over the hand-authored log. */
export function buildDevaluationProfile(now: string = DEVAL_NOW): StudentProfile {
  return runCycle(
    emptyProfile(DEVAL_KID, "Synthetic Deval"),
    LOG,
    { catalog: DEVAL_CATALOG },
    now,
  );
}
