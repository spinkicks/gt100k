import { describe, expect, expectTypeOf, it } from "vitest";

import { SYNTHETIC_ADMISSION_POLICY_V1 } from "../../admissions-contracts/src/admission.js";
import { SYNTHETIC_ALLOCATION_POLICY_V1 } from "../../admissions-contracts/src/allocation.js";
import { canonicalize } from "../../admissions-contracts/src/hash.js";
import { SYNTHETIC_BLIND_REVIEW_POLICY_V1 } from "../../admissions-contracts/src/review.js";
import { SYNTHETIC_ROUTING_POLICY_V1 } from "../../admissions-contracts/src/routing.js";
import { decideAdmission } from "../src/admission.js";
import { type TrackBAllocationEligibility, runIncomeBandedLottery } from "../src/allocation.js";
import {
  type CreateDecisionTraceInput,
  createDecisionTrace,
  replayDecision,
} from "../src/decision-trace.js";
import {
  type AggregateBlindReviewInput,
  type BlindReviewDecision,
  aggregateBlindReview,
  planBlindReview,
  submitBlindReview,
} from "../src/review.js";
import {
  type CogatRoutingInput,
  createCogatAssessmentVersion,
  routeCogatAssessment,
} from "../src/routing.js";
import { submitTalentSnapshot } from "../src/snapshot.js";

const DECIDED_AT = "2026-07-21T12:00:00.000Z";
const SCORE_4 = { DE: 4, LR: 4, TA: 4, IN: 4, RE: 4, SP: 4 } as const;

function routingBundle(applicationId: string, composite: number) {
  const input: CogatRoutingInput = {
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
  };
  return { input, decision: routeCogatAssessment(input) };
}

function reviewBundle(applicationId: string) {
  const routing = routingBundle(applicationId, 85);
  const snapshot = submitTalentSnapshot({
    snapshotId: `snapshot-${applicationId}`,
    version: 1,
    supersedes: null,
    routingDecision: routing.decision,
    domains: ["engineering"],
    route: "artifact",
    artifactFixtureIds: ["artifact-syn-robotics-001"],
  });
  const submissions = planBlindReview(snapshot).assignments.map((assignment) =>
    submitBlindReview({
      assignment,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_4,
    }),
  );
  const input: AggregateBlindReviewInput = {
    snapshot,
    policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
    submissions,
  };
  return { applicationId, routing, input, decision: aggregateBlindReview(input) };
}

function trackATraceInput(): CreateDecisionTraceInput {
  const applicationId = "applicant-syn-trace-track-a";
  const routing = routingBundle(applicationId, 92);
  const admission = decideAdmission({
    applicationId,
    decidedAt: DECIDED_AT,
    policy: SYNTHETIC_ADMISSION_POLICY_V1,
    source: {
      kind: "track_a_automatic",
      routingDecision: routing.decision,
      financeFixtureId: "finance-syn-h2-045k",
    },
  });
  return {
    traceId: "trace-syn-track-a-001",
    createdAt: DECIDED_AT,
    routing,
    review: null,
    allocation: null,
    admission,
  };
}

function nonOfferedTrackBTraceInput(): CreateDecisionTraceInput {
  const candidates = [
    reviewBundle("applicant-syn-trace-ada"),
    reviewBundle("applicant-syn-trace-beck"),
  ] as const;
  const eligibility = (decision: BlindReviewDecision): TrackBAllocationEligibility => {
    if (decision.outcome !== "qualifies" || decision.workflowStatus !== "track_b_eligible") {
      throw new TypeError("test fixture must qualify");
    }
    return decision as TrackBAllocationEligibility;
  };
  const draw = runIncomeBandedLottery({
    cycleId: "cycle-syn-trace-2026",
    seed: "allocation-seed-syn-trace-001",
    policy: SYNTHETIC_ALLOCATION_POLICY_V1,
    eligiblePool: candidates.map((candidate, index) => ({
      applicationId: candidate.applicationId,
      eligibility: eligibility(candidate.decision),
      financeFixtureId: index === 0 ? "finance-syn-h2-045k" : "finance-syn-h4-090k",
    })),
  });
  const nonOfferedId = draw.allocations.find(
    ({ outcome }) => outcome === "not_offered",
  )!.applicationId;
  const target = candidates.find(({ applicationId }) => applicationId === nonOfferedId)!;
  const admission = decideAdmission({
    applicationId: target.applicationId,
    decidedAt: DECIDED_AT,
    policy: SYNTHETIC_ADMISSION_POLICY_V1,
    source: {
      kind: "track_b_allocation",
      reviewDecision: target.decision,
      allocationDraw: draw,
    },
  });
  return {
    traceId: "trace-syn-track-b-001",
    createdAt: DECIDED_AT,
    routing: target.routing,
    review: { input: target.input, decision: target.decision },
    allocation: { draw },
    admission,
  };
}

describe("full admission decision trace", () => {
  it("replays the Track A route and automatic offer without review or allocation", () => {
    const trace = createDecisionTrace(trackATraceInput());
    const replayed = replayDecision(trace);

    expect(trace).toMatchObject({
      traceId: "trace-syn-track-a-001",
      createdAt: DECIDED_AT,
      stepKinds: ["routing", "admission"],
      review: null,
      allocation: null,
      traceHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
    expect(replayed.routing).toEqual(trace.routing.decision);
    expect(replayed.review).toBeNull();
    expect(replayed.allocation).toBeNull();
    expect(replayed.admission).toEqual(trace.admission);
    expect(canonicalize(replayed.admission)).toBe(canonicalize(trace.admission));
  });

  it("replays routing, averaged review, locked allocation, and non-offer handoff", () => {
    const trace = createDecisionTrace(nonOfferedTrackBTraceInput());
    const replayed = replayDecision(trace);

    expect(trace.stepKinds).toEqual(["routing", "review", "allocation", "admission"]);
    expect(trace.routing).toMatchObject({
      decision: {
        reasonCodes: ["TA_BELOW_CONFIGURED_BOUNDARY", "TB_COMPOSITE_BAND", "SNAPSHOT_REQUIRED"],
      },
      input: { policy: { policyBundleId: "admissions-routing-syn-v1" } },
    });
    expect(trace.review).toMatchObject({
      decision: { outcome: "qualifies", reviewScore: 4 },
      input: { policy: { policyBundleId: "admissions-review-syn-v1" } },
    });
    expect(trace.allocation?.draw.locked).toBe(true);
    expect(trace.admission).toMatchObject({
      admissionOutcome: "not_offered",
      researchInvitation: { state: "invited" },
    });
    expect(replayed).toEqual({
      routing: trace.routing.decision,
      review: trace.review!.decision,
      allocation: trace.allocation!.draw,
      admission: trace.admission,
    });
  });

  it("rejects trace tampering and mismatched upstream decisions", () => {
    const trace = createDecisionTrace(trackATraceInput());
    const tampered = {
      ...trace,
      createdAt: "2026-07-22T12:00:00.000Z",
    } as typeof trace;
    const injectedContext = { ...trace, researchConsent: false } as typeof trace;
    expect(() => replayDecision(tampered)).toThrowError(
      expect.objectContaining({ code: "INPUT_HASH_MISMATCH" }),
    );
    expect(() => replayDecision(injectedContext)).toThrowError(
      expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }),
    );

    const mismatched = trackATraceInput();
    const other = routingBundle("applicant-syn-trace-other", 92);
    expect(() => createDecisionTrace({ ...mismatched, routing: other })).toThrowError(
      expect.objectContaining({ code: "VALIDATION_FAILED" }),
    );
  });

  it("keeps identity, finance, and research consent outside trace orchestration", () => {
    type ProhibitedTraceKey = Extract<
      keyof CreateDecisionTraceInput,
      "childName" | "householdIncome" | "householdSize" | "researchConsent"
    >;
    expectTypeOf<ProhibitedTraceKey>().toEqualTypeOf<never>();
  });
});
