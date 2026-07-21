import type { HypothesisRevision, SignalSummary } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import { buildExplanationsView } from "../src/explanations";

const EMPTY_SUMMARY: SignalSummary = {
  voluntaryReturn: { day7: 0, day30: 0 },
  unrequiredRevision: 0,
  chosenChallenge: 0,
  failureRecovery: 0,
  scopeAuthorship: 0,
  competenceGrowth: 0,
  noveltyDecay: 0,
  promptDependence: 0,
  contextEffects: [],
  familiesPresent: [],
};

const makeRevision = (overrides: Partial<HypothesisRevision> = {}): HypothesisRevision => ({
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: "synthetic-learner-001",
  version: 1,
  candidateDomains: ["physical systems"],
  workModeProfile: { build: 1 },
  state: "EMERGING",
  evidenceRefs: ["artifact-001", "event-002"],
  signalSummary: EMPTY_SUMMARY,
  competingExplanations: [
    "Interest may sustain while measuring physical systems.",
    "Novelty may explain the current pattern.",
    "Tool access may explain part of the pattern.",
  ],
  coverageGaps: [],
  uncertainty: { kind: "grade", grade: "strong" },
  nextProbe: "compare a familiar tool with a new tool",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "retain competing explanations",
    rationale: "test the strongest disconfirming account beside the supporting account",
    reviewedAtDayOffset: 12,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 12,
  recordedAtDayOffset: 12,
  ...overrides,
});

const FORBIDDEN_KEYS = new Set(["passionScore", "score", "confidence", "verdict", "label"]);

const collectForbiddenKeys = (value: unknown): string[] => {
  if (value === null || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectForbiddenKeys);
  }

  return Object.entries(value).flatMap(([key, child]) => [
    ...(FORBIDDEN_KEYS.has(key) ? [key] : []),
    ...collectForbiddenKeys(child),
  ]);
};

describe("buildExplanationsView", () => {
  it("places the strongest supporting and disconfirming explanations side by side", () => {
    const revision = makeRevision();

    expect(buildExplanationsView(revision)).toEqual({
      supporting: {
        claim: "Interest may sustain while measuring physical systems.",
        evidenceRefs: ["artifact-001", "event-002"],
        strength: "strong",
        tone: "support",
      },
      disconfirming: {
        claim: "Novelty may explain the current pattern.",
        evidenceRefs: ["artifact-001", "event-002"],
        strength: "strong",
        tone: "contested",
      },
      others: [
        {
          claim: "Tool access may explain part of the pattern.",
          evidenceRefs: ["artifact-001", "event-002"],
          strength: "strong",
          tone: "prompted",
        },
      ],
      uncertainty: { kind: "grade", grade: "strong" },
    });
  });

  it("provides a concrete disconfirming next test when only one explanation is recorded", () => {
    const view = buildExplanationsView(
      makeRevision({
        competingExplanations: ["Interest may sustain through repeated building."],
        uncertainty: { kind: "grade", grade: "thin" },
      }),
    );

    expect(view.supporting.strength).toBe("thin");
    expect(view.disconfirming).toEqual({
      claim: "Next test: compare a familiar tool with a new tool.",
      evidenceRefs: [],
      strength: "thin",
      tone: "contested",
    });
    expect(view.others).toEqual([]);
  });

  it("preserves interval uncertainty without exposing scalar or verdict fields", () => {
    const view = buildExplanationsView(
      makeRevision({ uncertainty: { kind: "interval", lo: 0.25, hi: 0.7 } }),
    );

    expect(view.uncertainty).toEqual({ kind: "interval", lo: 0.25, hi: 0.7 });
    expect(view.supporting.strength).toBe("moderate");
    expect(view.disconfirming?.strength).toBe("moderate");
    expect(collectForbiddenKeys(view)).toEqual([]);
    expect([view.supporting, view.disconfirming, ...view.others]).not.toContainEqual(
      expect.objectContaining({ claim: expect.stringMatching(/you are (a|an|the) /i) }),
    );
  });

  it("fails closed instead of rendering fixed-label explanation text", () => {
    expect(() =>
      buildExplanationsView(
        makeRevision({
          competingExplanations: ["You are a natural engineer.", "Novelty remains plausible."],
        }),
      ),
    ).toThrowError(/fixed-label explanation/i);
  });

  it("does not validate an unused next probe as explanation card text", () => {
    const view = buildExplanationsView(
      makeRevision({ nextProbe: "test whether you are a natural engineer" }),
    );

    expect(view.disconfirming?.claim).toBe("Novelty may explain the current pattern.");
  });
});
