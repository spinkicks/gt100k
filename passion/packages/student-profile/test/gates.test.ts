import { describe, it, expect } from "vitest";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction } from "@gt100k/signal-pipeline";
import type { DomainPrior } from "@gt100k/interest-inference";
import { serializeCellKey } from "@gt100k/interest-inference";
import type { GateStatus } from "@gt100k/hypothesis-store";
import { emptyProfile, runCycle, deriveGates, currentRead } from "../src/index.js";

const KID = "kid-gate";
const NOW = "2026-03-10T00:00:00.000Z";
const BUILD_KEY = serializeCellKey(["music-sound", "audio-systems"], "build");
const BUILD_ID = `${KID}::${BUILD_KEY}`;

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
const CTX = { catalog: CATALOG };
const PRIORS: readonly DomainPrior[] = [
  { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
];
const WITH_ARTIFACT = { [BUILD_KEY]: "defense-record-042" };
const NO_ARTIFACT = {} as Readonly<Record<string, string>>;

function assemble(ts: string, session: string): Interaction {
  return { kidId: KID, artifactId: SYNTH.id, actionType: "assemble", timestamp: ts, prompted: false, sessionId: session };
}

// A novel first exposure 5 days before the first gate return, so the gate returns are all
// OUTSIDE the 3-day novelty window (⇒ novelty === false, counted by the gate).
const FIRST_NOVEL = assemble("2025-12-27T00:00:00.000Z", "s-novel");

// day 0 / +20 / +60 non-novel voluntary returns → gap 20d ≥ 14 (gapSurvived) AND span 60d ≥ 56
// with 3 occasions ≥ 2 (durable). Paired with a synthetic artifact ⇒ passed.
const R0 = assemble("2026-01-01T00:00:00.000Z", "s0"); // day 0
const R20 = assemble("2026-01-21T00:00:00.000Z", "s20"); // +20d (>14d gap)
const R60 = assemble("2026-03-02T00:00:00.000Z", "s60"); // +60d (>56d term, 3rd occasion)
const PASS_LOG: Interaction[] = [FIRST_NOVEL, R0, R20, R60];

const passed = (p: Partial<GateStatus>): GateStatus => ({
  gapSurvived: true,
  durable: true,
  hasArtifact: true,
  passed: true,
  ...p,
});

function gateOf(log: Interaction[], artifacts: Readonly<Record<string, string>>): GateStatus {
  const p = runCycle(emptyProfile(KID, "Kid", PRIORS, artifacts), log, CTX, NOW);
  const gates = deriveGates(p, CTX, NOW);
  const g = gates.get(BUILD_ID);
  expect(g).toBeDefined();
  return g!;
}

describe("deriveGates", () => {
  it("passes when the log has gap-surviving, durable returns + a synthetic artifact", () => {
    expect(gateOf(PASS_LOG, WITH_ARTIFACT)).toEqual(passed({}));
  });

  it("dropping the day-60 return flips durable alone (span < 56d)", () => {
    // [day 0, +20] → 20d span < 56d, but the 20d gap survives; artifact still attached.
    expect(gateOf([FIRST_NOVEL, R0, R20], WITH_ARTIFACT)).toEqual(
      passed({ durable: false, passed: false }),
    );
  });

  it("dropping the artifact flips hasArtifact alone", () => {
    expect(gateOf(PASS_LOG, NO_ARTIFACT)).toEqual(
      passed({ hasArtifact: false, passed: false }),
    );
  });

  it("collapsing the gap flips gapSurvived alone (all returns < 14d apart, span still ≥ 56d)", () => {
    // 6 non-novel returns every 12 days across 60 days: no consecutive pair ≥ 14d (gapSurvived
    // false), but span 60d ≥ 56d with 6 occasions (durable true); artifact attached.
    const dense: Interaction[] = [
      FIRST_NOVEL,
      assemble("2026-01-01T00:00:00.000Z", "d0"),
      assemble("2026-01-13T00:00:00.000Z", "d1"),
      assemble("2026-01-25T00:00:00.000Z", "d2"),
      assemble("2026-02-06T00:00:00.000Z", "d3"),
      assemble("2026-02-18T00:00:00.000Z", "d4"),
      assemble("2026-03-02T00:00:00.000Z", "d5"),
    ];
    expect(gateOf(dense, WITH_ARTIFACT)).toEqual(
      passed({ gapSurvived: false, passed: false }),
    );
  });
});

describe("currentRead", () => {
  it("recomputes the InterestRead from the full log (build cell present)", () => {
    const p = runCycle(emptyProfile(KID, "Kid", PRIORS, WITH_ARTIFACT), PASS_LOG, CTX, NOW);
    const read = currentRead(p, CTX, NOW);
    expect(read.cells.find((c) => c.cellKey === BUILD_KEY)).toBeDefined();
  });
});
