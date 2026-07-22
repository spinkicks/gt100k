import { describe, expect, expectTypeOf, it } from "vitest";

import { SYNTHETIC_ADMISSION_POLICY_V1 } from "../../admissions-contracts/src/admission.js";
import {
  SYNTHETIC_ALLOCATION_POLICY_V1,
  type SyntheticFinanceFixtureId,
} from "../../admissions-contracts/src/allocation.js";
import { canonicalize, sha256ContentHash } from "../../admissions-contracts/src/hash.js";
import { SYNTHETIC_BLIND_REVIEW_POLICY_V1 } from "../../admissions-contracts/src/review.js";
import { SYNTHETIC_ROUTING_POLICY_V1 } from "../../admissions-contracts/src/routing.js";
import {
  type AdmissionDecisionInput,
  type TrackAAdmissionSource,
  decideAdmission,
  replayAdmissionDecision,
} from "../src/admission.js";
import { type TrackBAllocationEligibility, runIncomeBandedLottery } from "../src/allocation.js";
import {
  type BlindReviewDecision,
  aggregateBlindReview,
  planBlindReview,
  submitBlindReview,
} from "../src/review.js";
import {
  type CogatRoutingDecision,
  createCogatAssessmentVersion,
  routeCogatAssessment,
} from "../src/routing.js";
import { submitTalentSnapshot } from "../src/snapshot.js";

const DECIDED_AT = "2026-07-21T12:00:00.000Z";
const SCORE_4 = { DE: 4, LR: 4, TA: 4, IN: 4, RE: 4, SP: 4 } as const;
const SCORE_3 = { DE: 3, LR: 3, TA: 3, IN: 3, RE: 3, SP: 3 } as const;

function routing(applicationId: string, composite: number): CogatRoutingDecision {
  return routeCogatAssessment({
    assessment: createCogatAssessmentVersion({
      versionId: `assessment-${applicationId}:v1`,
      version: 1,
      supersedes: null,
      validity: "valid",
      locked: true,
      scores: { composite, verbal: 80, quantitative: 80, nonverbal: 80 },
    }),
    policy: SYNTHETIC_ROUTING_POLICY_V1,
    trackBEnabled: true,
  });
}

function review(applicationId: string, qualifies = true): BlindReviewDecision {
  const routingDecision = routing(applicationId, 85);
  const snapshot = submitTalentSnapshot({
    snapshotId: `snapshot-${applicationId}`,
    version: 1,
    supersedes: null,
    routingDecision,
    domains: ["engineering"],
    route: "artifact",
    artifactFixtureIds: ["artifact-syn-robotics-001"],
  });
  const scores = qualifies ? SCORE_4 : SCORE_3;
  const submissions = planBlindReview(snapshot).assignments.map((assignment) =>
    submitBlindReview({
      assignment,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores,
    }),
  );
  return aggregateBlindReview({
    snapshot,
    policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
    submissions,
  });
}

function trackBDraw() {
  const adaReview = review("applicant-syn-ada");
  const beckReview = review("applicant-syn-beck");
  const eligibility = (decision: BlindReviewDecision): TrackBAllocationEligibility => {
    if (decision.outcome !== "qualifies" || decision.workflowStatus !== "track_b_eligible") {
      throw new TypeError("test fixture must qualify");
    }
    return decision as TrackBAllocationEligibility;
  };
  return {
    adaReview,
    beckReview,
    draw: runIncomeBandedLottery({
      cycleId: "cycle-syn-2026",
      seed: "allocation-seed-syn-2026-001",
      policy: SYNTHETIC_ALLOCATION_POLICY_V1,
      eligiblePool: [
        {
          applicationId: "applicant-syn-ada",
          eligibility: eligibility(adaReview),
          financeFixtureId: "finance-syn-h2-045k",
        },
        {
          applicationId: "applicant-syn-beck",
          eligibility: eligibility(beckReview),
          financeFixtureId: "finance-syn-h4-090k",
        },
      ],
    }),
  };
}

describe("admission finalization", () => {
  it("automatically offers Track A with configured aid and no Snapshot or lottery", () => {
    type ForbiddenTrackAKey = Extract<
      keyof TrackAAdmissionSource,
      "allocation" | "allocationDraw" | "reviewDecision" | "snapshot"
    >;
    expectTypeOf<ForbiddenTrackAKey>().toEqualTypeOf<never>();

    const decision = decideAdmission({
      applicationId: "applicant-syn-track-a",
      decidedAt: DECIDED_AT,
      policy: SYNTHETIC_ADMISSION_POLICY_V1,
      source: {
        kind: "track_a_automatic",
        routingDecision: routing("applicant-syn-track-a", 92),
        financeFixtureId: "finance-syn-h2-045k",
      },
    });

    expect(decision).toMatchObject({
      pathway: "track_a_automatic",
      admissionOutcome: "offered",
      aid: { outcome: "allotted", annualAidCents: 1_000_000, currency: "USD" },
      researchInvitation: {
        state: "not_applicable",
        nextCycleFeeWaiverCents: null,
        voluntary: true,
        affectsFutureAdmissions: false,
      },
      applicantMessage: { code: "TRACK_A_OFFER" },
      locked: true,
      resultHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(decision.retainedInput.source).not.toHaveProperty("snapshot");
    expect(decision.retainedInput.source).not.toHaveProperty("allocationDraw");
  });

  it("keeps Track B offered, non-offered, and not-eligible outcomes distinct", () => {
    const { adaReview, beckReview, draw } = trackBDraw();
    const offered = decideAdmission({
      applicationId: "applicant-syn-beck",
      decidedAt: DECIDED_AT,
      policy: SYNTHETIC_ADMISSION_POLICY_V1,
      source: { kind: "track_b_allocation", reviewDecision: beckReview, allocationDraw: draw },
    });
    const notOffered = decideAdmission({
      applicationId: "applicant-syn-ada",
      decidedAt: DECIDED_AT,
      policy: SYNTHETIC_ADMISSION_POLICY_V1,
      source: { kind: "track_b_allocation", reviewDecision: adaReview, allocationDraw: draw },
    });
    const notEligible = decideAdmission({
      applicationId: "applicant-syn-no-qualify",
      decidedAt: DECIDED_AT,
      policy: SYNTHETIC_ADMISSION_POLICY_V1,
      source: {
        kind: "track_b_review_not_eligible",
        reviewDecision: review("applicant-syn-no-qualify", false),
      },
    });

    expect(offered).toMatchObject({
      admissionOutcome: "offered",
      pathway: "track_b_lottery",
      aid: { outcome: "allotted", annualAidCents: 1_000_000 },
      researchInvitation: { state: "not_applicable" },
      applicantMessage: { code: "TRACK_B_OFFER" },
    });
    expect(notOffered).toMatchObject({
      admissionOutcome: "not_offered",
      pathway: "track_b_lottery",
      aid: { outcome: "not_applicable", annualAidCents: null },
      researchInvitation: {
        state: "invited",
        nextCycleFeeWaiverCents: 10_000,
        voluntary: true,
        affectsFutureAdmissions: false,
      },
      applicantMessage: { code: "TRACK_B_NOT_OFFERED" },
    });
    expect(notEligible).toMatchObject({
      admissionOutcome: "not_eligible",
      pathway: "track_b_review",
      aid: { outcome: "not_applicable", annualAidCents: null },
      researchInvitation: { state: "not_applicable", nextCycleFeeWaiverCents: null },
      applicantMessage: { code: "TRACK_B_DOES_NOT_CURRENTLY_QUALIFY" },
    });
    expect(notOffered.resultHash).not.toBe(notEligible.resultHash);
    for (const decision of [offered, notOffered, notEligible]) {
      expect(replayAdmissionDecision(decision)).toEqual(decision);
      expect(canonicalize(replayAdmissionDecision(decision))).toBe(canonicalize(decision));
    }
  });

  it("replays a locked final decision byte-for-byte and rejects retained tampering", () => {
    const { beckReview, draw } = trackBDraw();
    const decision = decideAdmission({
      applicationId: "applicant-syn-beck",
      decidedAt: DECIDED_AT,
      policy: SYNTHETIC_ADMISSION_POLICY_V1,
      source: { kind: "track_b_allocation", reviewDecision: beckReview, allocationDraw: draw },
    });
    const replayed = replayAdmissionDecision(decision);
    const changedPolicy = {
      ...decision,
      policy: { ...decision.policy, nextCycleFeeWaiverCents: 1 },
    } as typeof decision;
    const changedInput = {
      ...decision,
      retainedInput: { ...decision.retainedInput, decidedAt: "2026-07-22T12:00:00.000Z" },
    } as typeof decision;
    const injectedContext = { ...decision, researchConsent: false } as typeof decision;

    expect(replayed).toEqual(decision);
    expect(canonicalize(replayed)).toBe(canonicalize(decision));
    expect(() => replayAdmissionDecision(changedPolicy)).toThrowError(
      expect.objectContaining({ code: "POLICY_HASH_MISMATCH" }),
    );
    expect(() => replayAdmissionDecision(changedInput)).toThrowError(
      expect.objectContaining({ code: "INPUT_HASH_MISMATCH" }),
    );
    expect(() => replayAdmissionDecision(injectedContext)).toThrowError(
      expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }),
    );
  });

  it("keeps consent and identity outside finalization inputs and rejects injected context", () => {
    type ProhibitedAdmissionKey = Extract<
      keyof AdmissionDecisionInput,
      "childName" | "demographics" | "researchConsent"
    >;
    expectTypeOf<ProhibitedAdmissionKey>().toEqualTypeOf<never>();

    const trackARouting = routing("applicant-syn-track-a", 92);
    const clean: AdmissionDecisionInput = {
      applicationId: "applicant-syn-track-a",
      decidedAt: DECIDED_AT,
      policy: SYNTHETIC_ADMISSION_POLICY_V1,
      source: {
        kind: "track_a_automatic",
        routingDecision: trackARouting,
        financeFixtureId: "finance-syn-h2-045k" satisfies SyntheticFinanceFixtureId,
      },
    };
    const injected = { ...clean, researchConsent: false } as AdmissionDecisionInput;
    expect(() => decideAdmission(injected)).toThrowError(
      expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }),
    );

    const forged = {
      ...clean,
      applicationId: "live-applicant",
      source: {
        ...clean.source,
        kind: "track_a_automatic",
        routingDecision: {
          ...trackARouting,
          resultHash: sha256ContentHash("forged"),
        },
      },
    } as AdmissionDecisionInput;
    expect(() => decideAdmission(forged)).toThrowError(
      expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }),
    );
  });
});
