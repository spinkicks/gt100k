// A synthetic 014 StudentProfile whose interaction log shows the S3_AUTHORSHIP readiness pattern
// (SC-11): sustained VOLUNTARY return + depth accumulation + STRETCH-seeking (chosen_challenge),
// but NOT yet producer-identity (no artifact_competence / self_authored_scope) — so it reads S3, not
// S4. Built by running the REAL 012→011→013 chain (`runCycle`) over a hand-authored log + a
// one-artifact catalog. SYNTHETIC ONLY; no live/child data, no network.
import type { HumanActor } from "@gt100k/hypothesis-store";
import { promote } from "@gt100k/hypothesis-store";
import type { Interaction } from "@gt100k/signal-pipeline";
import type { Artifact } from "@gt100k/two-axis-tagging";
import { serializeCellKey } from "@gt100k/interest-inference";
import { deriveGates, emptyProfile, runCycle, type StudentProfile } from "@gt100k/student-profile";

export const DERIVE_NOW = "2026-07-01T00:00:00.000Z";
export const DERIVE_KID = "kid-synthetic-303";
export const DERIVE_CELL_KEY = serializeCellKey(["music-sound", "production"], "build");

/** The guide who certified this spike. A named human, because only a human may promote. */
const GUIDE: HumanActor = { id: "guide-synthetic-1", role: "GUIDE" };

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
  depthSignals: [{ kind: "chosen_challenge", value: 1 }], // voluntarily reaches for harder work
});

/**
 * The log has two halves, and it has to, because the two gates a spike must clear pull in opposite
 * directions.
 *
 * The 013 promotion gate asks for DURABILITY: a span of at least MIN_TERM_DAYS (56) containing at
 * least one quiet gap of GAP_DAYS (14) that the child came back from. The 011 confidence gate asks
 * for evidence MASS of at least MIN_EVIDENCE_MASS (6), and every event's contribution decays on a
 * HALFLIFE_DAYS (14) curve. A steady cadence cannot satisfy both: returns spaced a fortnight apart
 * form a converging series that ceilings at 2.0 of the 6 required, so the mass never arrives no
 * matter how many years the child persists.
 *
 * So the shape below is the only shape that certifies today: an early, sparse pair that opens a
 * 42-day gap and stretches the span to 60 days, then a recent every-other-day burst dense enough to
 * outrun the decay. The pilot roster's Dulce has the same silhouette for the same reason.
 *
 * Readiness reads S3_AUTHORSHIP: 11 across-day returns (≥ RETURN_S3=8), 12 depth events
 * (≥ DEPTH_S3=8), stretchSeeking from `chosen_challenge`, and NO producer identity (no
 * `artifact_competence` / `self_authored_scope`), which is what keeps it off S4.
 */
const LOG: readonly Interaction[] = [
  // The sparse opening. The first is the child's first-ever exposure, so 012 marks it novelty and
  // it is neither a return nor evidence; the second is the return that starts the timeline.
  mk("2026-04-20", "d0"),
  mk("2026-05-02", "d1"),
  // The 42-day quiet gap the durability gate is looking for sits here.
  mk("2026-06-13", "d2"),
  mk("2026-06-15", "d3"),
  mk("2026-06-17", "d4"),
  mk("2026-06-19", "d5"),
  mk("2026-06-21", "d6"),
  mk("2026-06-23", "d7"),
  mk("2026-06-25", "d8"),
  mk("2026-06-27", "d9"),
  mk("2026-06-29", "d10"),
  mk("2026-07-01", "d11"),
];

/** The perseverance artifact the promotion gate requires: a defense record for this cell. */
const ARTIFACTS: Readonly<Record<string, string>> = {
  [DERIVE_CELL_KEY]: "defense-record-303",
};

/**
 * The S3-readiness profile, CERTIFIED. Runs the real 012→011→013 chain over the log, then applies
 * the two human promotions (EMERGING → CANDIDATE → ACTIVE) through 013's own `promote`, against the
 * gate the profile actually derives. Nothing here forces a state: if the log stopped clearing the
 * confidence or durability bars, `promote` would throw rather than quietly hand back a fixture that
 * claims a certification it did not earn.
 */
export function buildS3Profile(now: string = DERIVE_NOW): StudentProfile {
  const ctx = { catalog: DERIVE_CATALOG };
  const derived = runCycle(
    emptyProfile(DERIVE_KID, "Synthetic Authorship", [], ARTIFACTS),
    { interactions: LOG, surfaced: [] },
    ctx,
    now,
  );

  const hypId = `${DERIVE_KID}::${DERIVE_CELL_KEY}`;
  const gate = deriveGates(derived, ctx, now).get(hypId);
  if (!gate) throw new Error(`fixture: no gate derived for ${hypId}`);

  let store = promote(derived.store, hypId, GUIDE, { gate, autonomySignOff: true }, now);
  store = promote(store, hypId, GUIDE, { gate, autonomySignOff: true }, now);
  return { ...derived, store };
}
