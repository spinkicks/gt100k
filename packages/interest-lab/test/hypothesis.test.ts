import { describe, expect, it } from "vitest";
import type { SignalSummary } from "../src/events";
import {
  type HypothesisRevision,
  appendRevision,
  createHypothesis,
  currentFor,
} from "../src/hypothesis";

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
  workModeProfile: { build: 1, investigate: 0.8 },
  state: "EXPLORING",
  evidenceRefs: ["supporting:artifact-001", "disconfirming:event-002"],
  signalSummary: EMPTY_SUMMARY,
  competingExplanations: ["sustained interest", "novelty effect"],
  coverageGaps: ["no delayed-discretionary signal"],
  uncertainty: { kind: "grade", grade: "thin" },
  nextProbe: "probe-smallest-distinguishing-001",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "record initial hypothesis",
    rationale: "retain supporting and disconfirming evidence while coverage grows",
    reviewedAtDayOffset: 0,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 0,
  recordedAtDayOffset: 0,
  ...overrides,
});

describe("hypothesis revisions", () => {
  it("appends versions without overwriting prior revisions", () => {
    const first = makeRevision();
    const hypothesis = createHypothesis(first);
    const proposal = makeRevision({
      state: "EMERGING",
      guideReview: null,
      proposedBy: "RULE",
      operative: false,
      validFromDayOffset: 5,
      recordedAtDayOffset: 5,
    });
    const withProposal = appendRevision(hypothesis, proposal);
    const second = makeRevision({
      version: 2,
      state: "EMERGING",
      uncertainty: { kind: "grade", grade: "moderate" },
      validFromDayOffset: 5,
      recordedAtDayOffset: 6,
    });
    const updated = appendRevision(withProposal, second);

    expect(hypothesis.revisions).toEqual([first]);
    expect(withProposal.revisions).toEqual([first, proposal]);
    expect(updated.revisions).toEqual([first, proposal, second]);
    expect(updated).not.toBe(withProposal);
    expect(() => appendRevision(updated, second)).toThrowError(/expected operative version 3/i);
    expect(() =>
      appendRevision(
        updated,
        makeRevision({
          hypothesisId: "synthetic-hypothesis-other",
          version: 3,
        }),
      ),
    ).toThrowError(/identity/i);
  });

  it("replays the bitemporal current view and ignores shadow proposals", () => {
    const first = makeRevision();
    const second = makeRevision({
      version: 2,
      state: "EMERGING",
      validFromDayOffset: 10,
      recordedAtDayOffset: 12,
    });
    const correction = makeRevision({
      version: 3,
      state: "CONTESTED",
      validFromDayOffset: 5,
      recordedAtDayOffset: 20,
    });
    const shadow = makeRevision({
      version: 3,
      state: "PARKED",
      guideReview: null,
      proposedBy: "SHADOW_MODEL",
      operative: false,
      validFromDayOffset: 15,
      recordedAtDayOffset: 21,
    });
    const hypothesis = appendRevision(
      appendRevision(appendRevision(createHypothesis(first), second), correction),
      shadow,
    );

    expect(currentFor(hypothesis, { validAtDayOffset: 15, recordedAtDayOffset: 15 })).toBe(second);
    expect(currentFor(hypothesis, { validAtDayOffset: 15, recordedAtDayOffset: 25 })).toBe(
      correction,
    );
    expect(currentFor(hypothesis, { validAtDayOffset: 4, recordedAtDayOffset: 25 })).toBe(first);
    expect(currentFor(hypothesis)).toBe(correction);
  });

  it("retains paired supporting and disconfirming evidence with non-scalar uncertainty", () => {
    const revision = makeRevision({ uncertainty: { kind: "interval", lo: 0.25, hi: 0.7 } });
    const hypothesis = createHypothesis(revision);

    expect(hypothesis.revisions[0]).toMatchObject({
      evidenceRefs: ["supporting:artifact-001", "disconfirming:event-002"],
      competingExplanations: ["sustained interest", "novelty effect"],
      uncertainty: { kind: "interval", lo: 0.25, hi: 0.7 },
    });
    expect(hypothesis.revisions[0]).not.toHaveProperty("passionScore");
    expect(hypothesis.revisions[0]).not.toHaveProperty("driveScore");
    expect(() =>
      createHypothesis({
        ...revision,
        uncertainty: 0.8,
      } as unknown as HypothesisRevision),
    ).toThrowError(/uncertainty/i);
    expect(() =>
      createHypothesis({
        ...revision,
        passionScore: 0.9,
      } as HypothesisRevision),
    ).toThrowError(/passionScore/i);
  });

  it("preserves co-primary candidate domains without choosing a winner", () => {
    const revision = makeRevision({
      candidateDomains: ["physical systems", "music composition"],
      workModeProfile: { build: 0.9, compose: 0.9 },
    });

    expect(createHypothesis(revision).revisions[0]?.candidateDomains).toEqual([
      "physical systems",
      "music composition",
    ]);
  });

  it("preserves child disagreement beside the model evidence", () => {
    const revision = makeRevision({
      childPosition: "DISAGREE",
      evidenceRefs: ["model-evidence:artifact-001", "child-account:context-001"],
      competingExplanations: ["model suggests sustained interest", "child reports tool novelty"],
    });

    expect(createHypothesis(revision).revisions[0]).toMatchObject({
      childPosition: "DISAGREE",
      evidenceRefs: ["model-evidence:artifact-001", "child-account:context-001"],
      competingExplanations: ["model suggests sustained interest", "child reports tool novelty"],
    });
  });
});
