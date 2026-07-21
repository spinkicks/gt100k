import { describe, expect, it } from "vitest";
import type { SignalFamily, SignalSummary } from "../src/events";
import type { HypothesisRevision } from "../src/hypothesis";
import { summarizeSignals } from "../src/signals";
import { applyMissingData, evaluateCandidateGate } from "../src/state-machine";
import { EVENTS_GOLDEN_V1 } from "./fixtures/events";

const summaryWithFamilies = (familiesPresent: SignalFamily[]): SignalSummary => ({
  voluntaryReturn: { day7: 0, day30: 0 },
  unrequiredRevision: 0,
  chosenChallenge: 0,
  failureRecovery: 0,
  scopeAuthorship: 0,
  competenceGrowth: 0,
  noveltyDecay: 0,
  promptDependence: 0,
  contextEffects: [],
  familiesPresent,
});

const EMERGING_REVISION: HypothesisRevision = {
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: "synthetic-learner-001",
  version: 4,
  candidateDomains: ["making"],
  workModeProfile: { build: 1 },
  state: "EMERGING",
  evidenceRefs: ["synthetic-event-001"],
  signalSummary: summaryWithFamilies(["chosen_challenge"]),
  competingExplanations: ["resource access"],
  coverageGaps: ["no delayed-discretionary signal"],
  uncertainty: { kind: "grade", grade: "moderate" },
  nextProbe: "synthetic-probe-002",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "retain emerging hypothesis",
    rationale: "evidence remains incomplete",
    reviewedAtDayOffset: 6,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 6,
  recordedAtDayOffset: 6,
};

describe("evaluateCandidateGate", () => {
  it.each([
    {
      name: "the G4 summary",
      summary: summarizeSignals(EVENTS_GOLDEN_V1),
      expected: { eligible: true, missing: [] },
    },
    {
      name: "novelty from easy clicks only",
      summary: summaryWithFamilies([]),
      expected: {
        eligible: false,
        missing: [
          "<3 signal families (have 0, need 3)",
          "no delayed-discretionary signal",
          "no artifact/competence signal",
        ],
      },
    },
    {
      name: "competence without delayed discretion",
      summary: summaryWithFamilies([
        "artifact_competence",
        "chosen_challenge",
        "unrequired_revision",
      ]),
      expected: {
        eligible: false,
        missing: ["no delayed-discretionary signal"],
      },
    },
    {
      name: "delayed discretion without artifact competence",
      summary: summaryWithFamilies(["voluntary_return", "chosen_challenge", "unrequired_revision"]),
      expected: {
        eligible: false,
        missing: ["no artifact/competence signal"],
      },
    },
    {
      name: "the minimal passing family set",
      summary: summaryWithFamilies(["voluntary_return", "artifact_competence", "chosen_challenge"]),
      expected: { eligible: true, missing: [] },
    },
  ])("returns the exact G5 outcome for $name", ({ summary, expected }) => {
    expect(evaluateCandidateGate(summary)).toEqual(expected);
  });
});

describe("applyMissingData", () => {
  it("records the exact G6 no-op without inferring low interest", () => {
    const nextRevision = applyMissingData(EMERGING_REVISION);

    expect(nextRevision).not.toBe(EMERGING_REVISION);
    expect(nextRevision).toEqual({
      ...EMERGING_REVISION,
      version: 5,
      state: "EMERGING",
      uncertainty: { kind: "grade", grade: "moderate" },
    });
    expect(nextRevision.state).not.toBe("PARKED");
  });
});
