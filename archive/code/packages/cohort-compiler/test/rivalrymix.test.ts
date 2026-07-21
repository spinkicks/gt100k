import { describe, expect, it } from "vitest";
import type { TurnAnalysis } from "../src/model";
import { analyzeTurns } from "../src/rivalrymix";
import { rivalryMixThresholds, turnsFixtures } from "./fixtures/turns";

const fixtures = Object.entries(turnsFixtures);
const prohibitedFields = ["honesty", "emotion", "personality", "motivation"] as const;

describe("analyzeTurns (T029, FR-020–FR-024, SC-007)", () => {
  it.each(fixtures)("matches the %s Fixture E golden analysis", (_name, fixture) => {
    const analysis = analyzeTurns(fixture.turns, rivalryMixThresholds);
    const { confidence: actualConfidence, ...actualObservableResult } = analysis;
    const { confidence: expectedConfidence, ...expectedObservableResult } =
      fixture.expected.analysis;

    expect(actualObservableResult).toEqual(expectedObservableResult);
    expect(actualConfidence).toBeCloseTo(expectedConfidence, 12);
  });

  it("reports the exact dominance evidence and descriptors", () => {
    const analysis = analyzeTurns(turnsFixtures.dominance.turns, rivalryMixThresholds);

    expect(analysis.perSpeaker.S1).toEqual({
      turnShare: 4 / 6,
      speakingTime: 40,
      interruptions: 0,
    });
    expect(analysis.patterns).toEqual([
      {
        kind: "dominance",
        subjects: ["S1"],
        evidence: "S1 holds 4/6 turns (66.7%) > 50%",
      },
    ]);
    expect(analysis).toMatchObject({ confidence: 1, suppressed: false });
  });

  it("counts only attributable overlaps as repeated interruptions", () => {
    const repeated = analyzeTurns(turnsFixtures.interruption.turns, rivalryMixThresholds);
    const ambiguous = analyzeTurns(turnsFixtures.ambiguous.turns, rivalryMixThresholds);

    expect(repeated.perSpeaker.S2?.interruptions).toBe(3);
    expect(repeated.patterns).toEqual([
      {
        kind: "repeated_interruption",
        subjects: ["S2"],
        evidence: "S2 initiated 3 overlapping turns ≥ 3",
      },
    ]);
    expect(ambiguous.perSpeaker.S2?.interruptions).toBe(2);
    expect(ambiguous.patterns).toEqual([]);
  });

  it("lowers confidence and surfaces no pattern for low-quality, sparse, or missing input", () => {
    const lowQuality = analyzeTurns(turnsFixtures.lowQuality.turns, rivalryMixThresholds);
    const sparse = analyzeTurns(turnsFixtures.sparse.turns, rivalryMixThresholds);
    const missing = analyzeTurns(turnsFixtures.empty.turns, rivalryMixThresholds);

    expect(lowQuality).toMatchObject({ suppressed: true, patterns: [] });
    expect(lowQuality.confidence).toBeCloseTo(0.225, 12);
    expect(sparse).toMatchObject({ confidence: 0.25, suppressed: true, patterns: [] });
    expect(missing).toEqual({ perSpeaker: {}, patterns: [], confidence: 0, suppressed: true });
  });

  it.each(fixtures)("keeps the %s output observable-only", (_name, fixture) => {
    const analysis: TurnAnalysis = analyzeTurns(fixture.turns, rivalryMixThresholds);

    expect(Object.keys(analysis).sort()).toEqual([
      "confidence",
      "patterns",
      "perSpeaker",
      "suppressed",
    ]);
    for (const field of prohibitedFields) {
      expect(analysis).not.toHaveProperty(field);
    }
  });
});
