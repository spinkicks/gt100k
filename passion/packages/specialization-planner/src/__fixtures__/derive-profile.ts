// A synthetic 014 StudentProfile whose interaction log shows the S3_AUTHORSHIP readiness pattern
// (SC-11): sustained VOLUNTARY return + depth accumulation + STRETCH-seeking (chosen_challenge),
// but NOT yet producer-identity (no artifact_competence / self_authored_scope) — so it reads S3, not
// S4. Built by running the REAL 012→011→013 chain (`runCycle`) over a hand-authored log + a
// one-artifact catalog. SYNTHETIC ONLY; no live/child data, no network.
import type { Interaction } from "@gt100k/signal-pipeline";
import type { Artifact } from "@gt100k/two-axis-tagging";
import { serializeCellKey } from "@gt100k/interest-inference";
import { emptyProfile, runCycle, type StudentProfile } from "@gt100k/student-profile";

export const DERIVE_NOW = "2026-07-01T00:00:00.000Z";
export const DERIVE_KID = "kid-synthetic-303";
export const DERIVE_CELL_KEY = serializeCellKey(["music-sound", "production"], "build");

const ARTIFACT: Artifact = {
  id: "s3-production-rig",
  domainPath: ["music-sound", "production"],
  affordedModes: ["build", "investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

export const DERIVE_CATALOG: ReadonlyMap<string, Artifact> = new Map([[ARTIFACT.id, ARTIFACT]]);

const iso = (d: string): string => `${d}T00:00:00.000Z`;
const mk = (date: string, session: string): Interaction => ({
  kidId: DERIVE_KID,
  artifactId: ARTIFACT.id,
  actionType: "assemble", // resolves to the `build` mode on this artifact
  timestamp: iso(date),
  prompted: false, // self-initiated ⇒ voluntary return
  sessionId: session,
  depth: 1,
  depthSignals: [{ kind: "chosen_challenge", value: 1 }], // voluntarily reaches for harder work
});

// 9 voluntary, stretch-seeking returns spread across ~8 weeks, all within RETURN_WINDOW_DAYS of NOW.
// ⇒ voluntaryReturnsRecent = 9 (≥ RETURN_S3=8), depthAccumulation = 9 (≥ DEPTH_S3=8), stretchSeeking,
// producerIdentity=false ⇒ S3_AUTHORSHIP. (No artifact_competence ⇒ NOT S4.)
const LOG: readonly Interaction[] = [
  mk("2026-05-02", "d0"),
  mk("2026-05-09", "d1"),
  mk("2026-05-16", "d2"),
  mk("2026-05-23", "d3"),
  mk("2026-05-30", "d4"),
  mk("2026-06-06", "d5"),
  mk("2026-06-13", "d6"),
  mk("2026-06-20", "d7"),
  mk("2026-06-27", "d8"),
];

/** The S3-readiness profile: run the real 012→011→013 chain over the hand-authored log. */
export function buildS3Profile(now: string = DERIVE_NOW): StudentProfile {
  return runCycle(emptyProfile(DERIVE_KID, "Synthetic Authorship"), LOG, { catalog: DERIVE_CATALOG }, now);
}
