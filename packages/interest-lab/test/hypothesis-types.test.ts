import { describe, expect, expectTypeOf, it } from "vitest";
import type { SignalSummary } from "../src/events";
import { CHILD_POSITIONS, FORBIDDEN_PURPOSES, HYPOTHESIS_STATES } from "../src/hypothesis";
import type {
  ChildPosition,
  CoverageMatrix,
  ForbiddenPurpose,
  GuideReview,
  HypothesisRevision,
  HypothesisState,
  InterestHypothesis,
  Uncertainty,
} from "../src/hypothesis";
import type { Domain, Provenance, WorkMode } from "../src/probe";

describe("hypothesis vocabularies", () => {
  it("defines the exact lifecycle and child-position values", () => {
    expect(HYPOTHESIS_STATES).toEqual([
      "EXPLORING",
      "EMERGING",
      "CANDIDATE_SPINE",
      "ACTIVE",
      "CONTESTED",
      "PARKED",
      "REOPENED",
    ]);
    expect(CHILD_POSITIONS).toEqual([
      "AGREE",
      "UNSURE",
      "DISAGREE",
      "DECLINE_TO_LABEL",
      "REQUEST_TO_PARK",
    ]);

    expectTypeOf<HypothesisState>().toEqualTypeOf<(typeof HYPOTHESIS_STATES)[number]>();
    expectTypeOf<ChildPosition>().toEqualTypeOf<(typeof CHILD_POSITIONS)[number]>();
  });

  it("defines every forbidden downstream purpose", () => {
    expect(FORBIDDEN_PURPOSES).toEqual([
      "admissions",
      "discipline",
      "family_fidelity",
      "public_ranking",
      "commercial_targeting",
    ]);
    expectTypeOf<ForbiddenPurpose>().toEqualTypeOf<(typeof FORBIDDEN_PURPOSES)[number]>();
  });
});

describe("coverage and hypothesis value types", () => {
  it("uses the explicit G2 met-and-gap coverage shape", () => {
    expectTypeOf<CoverageMatrix>().toEqualTypeOf<{
      probeCount: { met: boolean; count: number; need: number };
      domains: {
        met: boolean;
        count: number;
        need: number;
        have: Domain[];
        gaps: string[];
      };
      workModes: {
        met: boolean;
        count: number;
        need: number;
        have: WorkMode[];
        gaps: string[];
      };
      social: { met: boolean; solo: boolean; group: boolean; gaps: string[] };
      difficulty: {
        met: boolean;
        foundational: boolean;
        stretch: boolean;
        gaps: string[];
      };
      audience: {
        met: boolean;
        audience: boolean;
        no_audience: boolean;
        gaps: string[];
      };
      complete: boolean;
      gaps: string[];
    }>();
  });

  it("keeps uncertainty non-scalar and guide review accountable", () => {
    expectTypeOf<Uncertainty>().toEqualTypeOf<
      | { kind: "interval"; lo: number; hi: number }
      | { kind: "grade"; grade: "thin" | "moderate" | "strong" }
    >();
    expectTypeOf<GuideReview>().toEqualTypeOf<{
      guide: string;
      decision: string;
      rationale: string;
      reviewedAtDayOffset: number;
    }>();
  });

  it("defines the complete append-only revision record", () => {
    expectTypeOf<HypothesisRevision>().toEqualTypeOf<{
      hypothesisId: string;
      learnerRef: string;
      version: number;
      candidateDomains: Domain[];
      workModeProfile: Partial<Record<WorkMode, number>>;
      state: HypothesisState;
      evidenceRefs: string[];
      signalSummary: SignalSummary;
      competingExplanations: string[];
      coverageGaps: string[];
      uncertainty: Uncertainty;
      nextProbe?: string;
      childPosition: ChildPosition;
      familyContext?: Record<string, unknown>;
      guideReview: GuideReview | null;
      proposedBy: Provenance;
      operative: boolean;
      modelVersion: string;
      policyVersion: string;
      validFromDayOffset: number;
      recordedAtDayOffset: number;
    }>();
  });

  it("stores revisions on the hypothesis without collapsing history", () => {
    expectTypeOf<InterestHypothesis>().toEqualTypeOf<{
      hypothesisId: string;
      learnerRef: string;
      revisions: HypothesisRevision[];
    }>();
  });
});
