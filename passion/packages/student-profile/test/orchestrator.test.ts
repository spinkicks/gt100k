import { describe, it, expect } from "vitest";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction } from "@gt100k/signal-pipeline";
import type { DomainPrior } from "@gt100k/interest-inference";
import { serializeCellKey } from "@gt100k/interest-inference";
import { getForKid, promote, type GateStatus, type HumanActor } from "@gt100k/hypothesis-store";
import { emptyProfile, runCycle } from "../src/index.js";

const KID = "kid-1";
const NOW = "2026-03-01T00:00:00.000Z";
const BUILD_KEY = serializeCellKey(["music-sound", "audio-systems"], "build");
const BUILD_ID = `${KID}::${BUILD_KEY}`;

// A gadget affording `build` (via actionType "assemble") — mirrors 012's confident fixture.
const SYNTH: Artifact = {
  id: "synth-01",
  domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["perform", "build", "investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};
const CATALOG: ReadonlyMap<string, Artifact> = new Map([[SYNTH.id, SYNTH]]);
const PRIORS: readonly DomainPrior[] = [
  { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
];
const ARTIFACTS = { [BUILD_KEY]: "defense-record-042" };

function assemble(ts: string, session: string, extra: Partial<Interaction> = {}): Interaction {
  return { kidId: KID, artifactId: SYNTH.id, actionType: "assemble", timestamp: ts, prompted: false, sessionId: session, ...extra };
}

// One first-exposure (novel) engagement + five non-novel voluntary returns clustered near NOW →
// evidenceMass ≥ 3 ⇒ confident ⇒ auto-advance EXPLORING→EMERGING on the build cell.
const INTERACTIONS: Interaction[] = [
  assemble("2026-01-01T00:00:00.000Z", "s0"),
  assemble("2026-02-20T00:00:00.000Z", "s1"),
  assemble("2026-02-22T00:00:00.000Z", "s2"),
  assemble("2026-02-24T00:00:00.000Z", "s3"),
  assemble("2026-02-26T00:00:00.000Z", "s4"),
  assemble("2026-02-28T00:00:00.000Z", "s5", { depth: 1, depthSignals: [{ kind: "artifact_competence", value: 1 }] }),
];

const CTX = { catalog: CATALOG };
const PASSED_GATE: GateStatus = { gapSurvived: true, durable: true, hasArtifact: true, passed: true };
const GUIDE: HumanActor = { id: "guide-1", role: "guide" };

describe("runCycle", () => {
  it("appends to the log and derives a confident hypothesis from the full log", () => {
    const p0 = emptyProfile(KID, "Kid", PRIORS, ARTIFACTS);
    const p1 = runCycle(p0, INTERACTIONS, CTX, NOW);

    expect(p1.interactions).toHaveLength(INTERACTIONS.length);
    expect(p1.updatedAt).toBe(NOW);

    const hyps = getForKid(p1.store, KID);
    const build = hyps.find((h) => h.cellKey === BUILD_KEY);
    expect(build).toBeDefined();
    expect(build!.state).toBe("EMERGING"); // confident ⇒ auto-advanced
    expect(build!.evidence.confident).toBe(true);
    expect(build!.evidence.lowerBound).toBeGreaterThanOrEqual(0.6);
    // synthetic perseverance artifact attached in step 5
    expect(build!.perseveranceArtifactRef).toBe("defense-record-042");
  });

  it("is idempotent on state: runCycle(p, [], ctx, now).store deep-equals p.store", () => {
    const p1 = runCycle(emptyProfile(KID, "Kid", PRIORS, ARTIFACTS), INTERACTIONS, CTX, NOW);
    const p2 = runCycle(p1, [], CTX, NOW);
    expect(p2.store).toEqual(p1.store);
    expect(p2.interactions).toEqual(p1.interactions);
  });

  it("preserves a human transition across a no-op cycle", () => {
    const p1 = runCycle(emptyProfile(KID, "Kid", PRIORS, ARTIFACTS), INTERACTIONS, CTX, NOW);
    // A human promotes the EMERGING build hypothesis to CANDIDATE (gate + sign-off).
    const promoted = promote(p1.store, BUILD_ID, GUIDE, { gate: PASSED_GATE, autonomySignOff: true }, NOW);
    expect(getForKid(promoted, KID).find((h) => h.id === BUILD_ID)!.state).toBe("CANDIDATE");

    const p3 = runCycle({ ...p1, store: promoted }, [], CTX, NOW);
    const build = getForKid(p3.store, KID).find((h) => h.id === BUILD_ID)!;
    expect(build.state).toBe("CANDIDATE"); // the human transition survives the no-op replay
  });

  it("never mutates the input profile", () => {
    const p0 = emptyProfile(KID, "Kid", PRIORS, ARTIFACTS);
    runCycle(p0, INTERACTIONS, CTX, NOW);
    expect(p0.interactions).toHaveLength(0);
    expect(Object.keys(p0.store.byId)).toHaveLength(0);
  });
});
