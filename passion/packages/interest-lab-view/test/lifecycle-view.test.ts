import {
  EVENTS_GOLDEN_V1,
  LEGAL_TRANSITIONS,
  SIGNAL_FAMILIES,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab";
import type {
  HypothesisRevision,
  InterestHypothesis,
  SignalFamily,
  SignalSummary,
} from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import { PALETTE } from "../src/art";
import { buildLifecycleStateView, buildRevisionHistoryView } from "../src/lifecycle-view";

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

const gateFor = (summary: SignalSummary) => ({
  ...evaluateCandidateGate(summary),
  familiesPresent: summary.familiesPresent,
});

const makeRevision = (overrides: Partial<HypothesisRevision> = {}): HypothesisRevision => ({
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: "synthetic-learner-001",
  version: 1,
  candidateDomains: ["making"],
  workModeProfile: { build: 1 },
  state: "EXPLORING",
  evidenceRefs: ["synthetic-event-001"],
  signalSummary: summaryWithFamilies([]),
  competingExplanations: ["Repeated building may persist.", "Novelty may explain the pattern."],
  coverageGaps: [],
  uncertainty: { kind: "grade", grade: "thin" },
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "record reviewed hypothesis",
    rationale: "retain competing explanations while evidence grows",
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

describe("buildLifecycleStateView", () => {
  it("projects the fixed lifecycle graph and the complete G5 checklist", () => {
    const view = buildLifecycleStateView("EMERGING", gateFor(summarizeSignals(EVENTS_GOLDEN_V1)));

    expect(view.states.map(({ id, track }) => ({ id, track }))).toEqual([
      { id: "EXPLORING", track: "main" },
      { id: "EMERGING", track: "main" },
      { id: "CANDIDATE_SPINE", track: "main" },
      { id: "ACTIVE", track: "main" },
      { id: "CONTESTED", track: "branch" },
      { id: "PARKED", track: "branch" },
      { id: "REOPENED", track: "branch" },
    ]);
    expect(view.states.find(({ id }) => id === "CONTESTED")?.tone).toBe(PALETTE.contested);
    expect(view.states.find(({ id }) => id === "PARKED")?.tone).toBe(PALETTE.parked);
    expect(view.current).toBe("EMERGING");
    expect(view.legalTransitions).toEqual(LEGAL_TRANSITIONS.map(([from, to]) => ({ from, to })));
    expect(view.gate).toEqual({
      eligible: true,
      missing: [],
      families: SIGNAL_FAMILIES.map((family) => ({ family, present: true })),
    });
  });

  it("names the delayed-discretionary gap and preserves per-family presence", () => {
    const familiesPresent: SignalFamily[] = [
      "artifact_competence",
      "chosen_challenge",
      "unrequired_revision",
    ];
    const view = buildLifecycleStateView("EMERGING", gateFor(summaryWithFamilies(familiesPresent)));

    expect(view.gate).toEqual({
      eligible: false,
      missing: ["no delayed-discretionary signal"],
      families: SIGNAL_FAMILIES.map((family) => ({
        family,
        present: familiesPresent.includes(family),
      })),
    });
  });

  it.each(["RULE", "SHADOW_MODEL"] as const)(
    "renders a %s proposal only as a non-operative suggestion",
    (proposedBy) => {
      const proposal = makeRevision({
        state: "CANDIDATE_SPINE",
        guideReview: null,
        proposedBy,
        operative: false,
      });
      const view = buildLifecycleStateView(
        "EMERGING",
        gateFor(summaryWithFamilies(["voluntary_return", "artifact_competence"])),
        proposal,
      );

      expect(view.proposal).toEqual({
        proposedBy,
        toState: "CANDIDATE_SPINE",
        operative: false,
        note: "A guide authors the record.",
      });
      expect(view.authoring).toEqual({
        canAuthor: true,
        note: "A guide authors the operative revision.",
      });
    },
  );

  it("fails closed if an operative or guide-authored revision is passed as a proposal", () => {
    const gate = gateFor(summaryWithFamilies([]));
    const operative = makeRevision({ state: "EMERGING" });

    expect(() => buildLifecycleStateView("EXPLORING", gate, operative)).toThrowError(
      /shadow proposal/i,
    );
  });
});

describe("buildRevisionHistoryView", () => {
  it("preserves append order and bitemporal offsets while selecting the latest operative version", () => {
    const first = makeRevision();
    const proposal = makeRevision({
      state: "EMERGING",
      guideReview: null,
      proposedBy: "RULE",
      operative: false,
      validFromDayOffset: 5,
      recordedAtDayOffset: 5,
    });
    const second = makeRevision({
      version: 2,
      state: "EMERGING",
      validFromDayOffset: 5,
      recordedAtDayOffset: 6,
    });
    const correction = makeRevision({
      version: 3,
      state: "CONTESTED",
      validFromDayOffset: 3,
      recordedAtDayOffset: 9,
    });
    const hypothesis: InterestHypothesis = {
      hypothesisId: first.hypothesisId,
      learnerRef: first.learnerRef,
      revisions: [first, proposal, second, correction],
    };

    expect(buildRevisionHistoryView(hypothesis)).toEqual({
      versions: [
        {
          version: 1,
          state: "EXPLORING",
          operative: true,
          validFromDayOffset: 0,
          recordedAtDayOffset: 0,
          authored: true,
        },
        {
          version: 1,
          state: "EMERGING",
          operative: false,
          validFromDayOffset: 5,
          recordedAtDayOffset: 5,
          authored: false,
        },
        {
          version: 2,
          state: "EMERGING",
          operative: true,
          validFromDayOffset: 5,
          recordedAtDayOffset: 6,
          authored: true,
        },
        {
          version: 3,
          state: "CONTESTED",
          operative: true,
          validFromDayOffset: 3,
          recordedAtDayOffset: 9,
          authored: true,
        },
      ],
      currentVersion: 3,
    });
  });

  it("rejects histories that decrease version or append record time", () => {
    const first = makeRevision();
    const second = makeRevision({ version: 2, recordedAtDayOffset: 6 });

    expect(() =>
      buildRevisionHistoryView({
        hypothesisId: first.hypothesisId,
        learnerRef: first.learnerRef,
        revisions: [first, second, makeRevision({ version: 1, recordedAtDayOffset: 7 })],
      }),
    ).toThrowError(/version order/i);
    expect(() =>
      buildRevisionHistoryView({
        hypothesisId: first.hypothesisId,
        learnerRef: first.learnerRef,
        revisions: [first, second, makeRevision({ version: 3, recordedAtDayOffset: 5 })],
      }),
    ).toThrowError(/record time/i);
  });
});
