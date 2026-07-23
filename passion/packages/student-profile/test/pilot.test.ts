// Golden orchestration test (SC-6): the synthetic pilot roster is built by running the REAL chain
// (deriveSignals → runInference → applyInterestRead → attachArtifacts) over per-kid synthetic
// interaction logs — no hand-built InterestRead. Ari's audio-systems build cell must reach a
// confident EMERGING state with a passing gate; his thin dance cell stays EXPLORING; Cyrus is
// all-EXPLORING; Dulce carries the human-driven ACTIVE / CANDIDATE / PARKED transitions.
import { describe, it, expect } from "vitest";
import { serializeCellKey } from "@gt100k/interest-inference";
import { getForKid } from "@gt100k/hypothesis-store";
import { buildPilotRoster, deriveGates, PILOT_CATALOG, PILOT_NOW } from "../src/index.js";

const CTX = { catalog: PILOT_CATALOG };

const ARI = "kid-synthetic-001";
const BEX = "kid-synthetic-002";
const CYRUS = "kid-synthetic-003";
const DULCE = "kid-synthetic-004";

const ARI_BUILD_KEY = serializeCellKey(["music-sound", "audio-systems"], "build");
const ARI_DANCE_KEY = serializeCellKey(["art-motion", "dance"], "perform");

const roster = buildPilotRoster(PILOT_NOW);

function hyp(kidId: string, cellKey: string) {
  const p = roster.get(kidId);
  expect(p, `roster has ${kidId}`).toBeDefined();
  const h = getForKid(p!.store, kidId).find((x) => x.cellKey === cellKey);
  expect(h, `${kidId} has ${cellKey}`).toBeDefined();
  return h!;
}

describe("buildPilotRoster — golden orchestration (SC-6)", () => {
  it("builds the four canonical synthetic kids", () => {
    expect([...roster.keys()].sort()).toEqual([ARI, BEX, CYRUS, DULCE]);
    expect(roster.get(ARI)!.displayName).toBe("Ari Mercado");
    expect(roster.get(DULCE)!.displayName).toBe("Dulce Park");
  });

  it("Ari's music-sound/audio-systems::build is a confident EMERGING cell with lowerBound ≥ 0.6", () => {
    const build = hyp(ARI, ARI_BUILD_KEY);
    expect(build.state).toBe("EMERGING");
    expect(build.evidence.confident).toBe(true);
    expect(build.evidence.lowerBound).toBeGreaterThanOrEqual(0.6);
    expect(build.perseveranceArtifactRef).toBe("defense-record-042");
  });

  it("Ari's build cell's gate is derived from the log and PASSES", () => {
    const build = hyp(ARI, ARI_BUILD_KEY);
    const gate = deriveGates(roster.get(ARI)!, CTX, PILOT_NOW).get(build.id);
    expect(gate).toEqual({ gapSurvived: true, durable: true, hasArtifact: true, passed: true });
  });

  it("Ari's thin dance cell stays EXPLORING (not confident, gate not passed)", () => {
    const dance = hyp(ARI, ARI_DANCE_KEY);
    expect(dance.state).toBe("EXPLORING");
    expect(dance.evidence.confident).toBe(false);
    const gate = deriveGates(roster.get(ARI)!, CTX, PILOT_NOW).get(dance.id);
    expect(gate!.passed).toBe(false);
  });

  it("Cyrus is all-EXPLORING (nothing sticks yet)", () => {
    const cards = getForKid(roster.get(CYRUS)!.store, CYRUS);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.every((h) => h.state === "EXPLORING")).toBe(true);
    expect(cards.every((h) => h.evidence.confident === false)).toBe(true);
  });

  it("Dulce carries an ACTIVE, a CANDIDATE and a PARKED cell (human transitions)", () => {
    const states = getForKid(roster.get(DULCE)!.store, DULCE).map((h) => h.state);
    expect(states).toContain("ACTIVE");
    expect(states).toContain("CANDIDATE");
    expect(states).toContain("PARKED");
  });

  it("Bex has a gate-passed EMERGING candidate and an EMERGING cell short of its gate", () => {
    const chess = hyp(BEX, serializeCellKey(["games-strategy", "chess"], "perform"));
    const python = hyp(BEX, serializeCellKey(["code-computers", "python"], "build"));
    expect(chess.state).toBe("EMERGING");
    expect(python.state).toBe("EMERGING");
    const gates = deriveGates(roster.get(BEX)!, CTX, PILOT_NOW);
    expect(gates.get(chess.id)!.passed).toBe(true);
    expect(gates.get(python.id)!.passed).toBe(false); // confident but no gate spread + no artifact
  });
});
