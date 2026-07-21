import {
  EVENTS_GOLDEN_V1,
  type HypothesisRevision,
  SIGNAL_FAMILIES,
  type SignalFamily,
  summarizeSignals,
} from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import { buildEvidenceConstellationView } from "../src/constellation";
import { buildReturnTimelineView } from "../src/timeline";

const makeRevision = (familiesPresent: readonly SignalFamily[]): HypothesisRevision => ({
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: "synthetic-learner-001",
  version: 1,
  candidateDomains: ["physical systems"],
  workModeProfile: { build: 1 },
  state: "EMERGING",
  evidenceRefs: EVENTS_GOLDEN_V1.map(({ id }) => id),
  signalSummary: {
    ...summarizeSignals(EVENTS_GOLDEN_V1),
    familiesPresent: [...familiesPresent],
  },
  competingExplanations: [
    "Interest may sustain while measuring physical systems.",
    "Novelty may explain the current pattern.",
  ],
  coverageGaps: [],
  uncertainty: { kind: "grade", grade: "strong" },
  nextProbe: "compare a familiar tool with a new tool",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "retain competing explanations",
    rationale: "keep supporting and disconfirming accounts visible",
    reviewedAtDayOffset: 30,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 30,
  recordedAtDayOffset: 30,
});

const timeline = buildReturnTimelineView(EVENTS_GOLDEN_V1);

const FORBIDDEN_KEYS = new Set(["score", "confidence", "passionScore"]);

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

describe("buildEvidenceConstellationView", () => {
  it("matches the exact G4-derived constellation golden", () => {
    const view = buildEvidenceConstellationView(makeRevision(SIGNAL_FAMILIES), timeline);

    expect(view).toEqual({
      stars: [
        {
          family: "voluntary_return",
          position: [0, 1.2, 0],
          brightness: 1,
          pull: "neutral",
        },
        {
          family: "unrequired_revision",
          position: [0, 0.8, -0.3],
          brightness: 0.7,
          pull: "neutral",
        },
        {
          family: "chosen_challenge",
          position: [0, 0.4, 0],
          brightness: 0.7,
          pull: "neutral",
        },
        {
          family: "failure_recovery",
          position: [0, 0, -0.3],
          brightness: 0.7,
          pull: "neutral",
        },
        {
          family: "self_authored_scope",
          position: [0, -0.4, 0],
          brightness: 0.7,
          pull: "neutral",
        },
        {
          family: "artifact_competence",
          position: [0, -0.8, -0.3],
          brightness: 0.7,
          pull: "neutral",
        },
      ],
      supportingAnchor: [2.4, 0.4, 0],
      disconfirmingAnchor: [-2.4, 0.4, 0],
      domEquivalent: true,
    });
  });

  it("dims absent families without making an absent voluntary return brightest", () => {
    const view = buildEvidenceConstellationView(
      makeRevision(["chosen_challenge", "artifact_competence"]),
      timeline,
    );

    expect(view.stars.map(({ family, brightness }) => [family, brightness])).toEqual([
      ["voluntary_return", 0.18],
      ["unrequired_revision", 0.18],
      ["chosen_challenge", 0.7],
      ["failure_recovery", 0.18],
      ["self_authored_scope", 0.18],
      ["artifact_competence", 0.7],
    ]);
  });

  it("does not infer family pulls from unstructured explanation prose", () => {
    const revision = makeRevision(SIGNAL_FAMILIES);
    revision.competingExplanations = [
      "Voluntary return supports this account.",
      "Artifact competence may disconfirm it.",
    ];

    expect(
      buildEvidenceConstellationView(revision, timeline).stars.map(({ pull }) => pull),
    ).toEqual(SIGNAL_FAMILIES.map(() => "neutral"));
  });

  it("exposes no scalar score, confidence, or passion score at any depth", () => {
    const view = buildEvidenceConstellationView(makeRevision(SIGNAL_FAMILIES), timeline);

    expect(collectForbiddenKeys(view)).toEqual([]);
  });
});
