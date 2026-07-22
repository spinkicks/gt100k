import { describe, expect, expectTypeOf, it } from "vitest";

import {
  type BlindReviewPolicy,
  SYNTHETIC_BLIND_REVIEW_POLICY_V1,
} from "../../admissions-contracts/src/review.js";
import { SYNTHETIC_ROUTING_POLICY_V1 } from "../../admissions-contracts/src/routing.js";
import {
  type AggregateBlindReviewInput,
  type BlindReviewAssignment,
  aggregateBlindReview,
  createReplacementAssignment,
  planBlindReview,
  submitBlindReview,
} from "../src/review.js";
import { createCogatAssessmentVersion, routeCogatAssessment } from "../src/routing.js";
import { type TalentSnapshotVersion, submitTalentSnapshot } from "../src/snapshot.js";

const SCORE_5 = { DE: 5, LR: 5, TA: 5, IN: 5, RE: 5, SP: 5 } as const;
const SCORE_4 = { DE: 4, LR: 4, TA: 4, IN: 4, RE: 4, SP: 4 } as const;
const SCORE_3 = { DE: 3, LR: 3, TA: 3, IN: 3, RE: 3, SP: 3 } as const;
const PROHIBITED_REVIEW_FIELDS = [
  "accommodationUsed",
  "address",
  "awards",
  "childName",
  "dateOfBirth",
  "demographics",
  "disciplineHistory",
  "disability",
  "familyStructure",
  "gender",
  "homeLanguage",
  "householdIncome",
  "householdSize",
  "paidEnrichment",
  "priorGtRelative",
  "proseQuality",
  "recommenderPrestige",
  "referralSource",
  "researchConsent",
  "schoolPrestige",
  "withdrawalHistory",
  "zipCode",
] as const;

function invitedSnapshot(route: "artifact" | "narrative"): TalentSnapshotVersion {
  const routingDecision = routeCogatAssessment({
    assessment: createCogatAssessmentVersion({
      versionId: `assessment-syn-review-${route}:v1`,
      version: 1,
      supersedes: null,
      validity: "valid",
      locked: true,
      scores: { composite: 85, verbal: 70, quantitative: 79, nonverbal: 75 },
    }),
    policy: SYNTHETIC_ROUTING_POLICY_V1,
    trackBEnabled: true,
  });

  return route === "artifact"
    ? submitTalentSnapshot({
        snapshotId: "snapshot-syn-review-artifact",
        version: 1,
        supersedes: null,
        routingDecision,
        domains: ["engineering"],
        route,
        artifactFixtureIds: ["artifact-syn-robotics-001"],
      })
    : submitTalentSnapshot({
        snapshotId: "snapshot-syn-review-narrative",
        version: 1,
        supersedes: null,
        routingDecision,
        domains: ["mathematics"],
        route,
        narrativeFixtureId: "narrative-syn-patterns-001",
      });
}

describe("blind review planning", () => {
  it("starts artifacts with two blind reviewers and narratives with a supervisor", () => {
    const artifactPlan = planBlindReview(invitedSnapshot("artifact"));
    const narrativePlan = planBlindReview(invitedSnapshot("narrative"));

    expect(artifactPlan.assignments.map(({ slot, role }) => ({ slot, role }))).toEqual([
      { slot: 1, role: "reviewer" },
      { slot: 2, role: "reviewer" },
    ]);
    expect(narrativePlan.assignments.map(({ slot, role }) => ({ slot, role }))).toEqual([
      { slot: 1, role: "reviewer" },
      { slot: 2, role: "reviewer" },
      { slot: 3, role: "supervisor" },
    ]);
    expect(artifactPlan.assignments[0]).not.toHaveProperty("peerScores");
    expect(Object.isFrozen(narrativePlan.assignments)).toBe(true);
  });
});

describe("blind review aggregation", () => {
  it("adds a blind supervisor after artifact disagreement and averages all three scores", () => {
    const snapshot = invitedSnapshot("artifact");
    const plan = planBlindReview(snapshot);
    const first = submitBlindReview({
      assignment: plan.assignments[0]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_5,
    });
    const second = submitBlindReview({
      assignment: plan.assignments[1]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_3,
    });

    const pending = aggregateBlindReview({
      snapshot,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      submissions: [first, second],
    });
    expect(pending).toMatchObject({
      outcome: "pending",
      workflowStatus: "review_pending_internal_action",
      reasonCodes: ["ADDITIONAL_BLIND_REVIEW_REQUIRED"],
      reviewScore: null,
      pendingWork: {
        pendingReason: "pending_additional_blind_review",
        ownerRole: "admissions",
        routeCode: "ADDITIONAL_BLIND_REVIEW_REQUIRED",
        state: "open",
      },
      observedDisagreement: { reviewerScoreDifference: 2, exceedsTolerance: true },
      requiredAssignment: { slot: 3, role: "supervisor", attempt: 1 },
    });

    const supervisor = submitBlindReview({
      assignment: pending.requiredAssignment!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_4,
    });
    expect(
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions: [first, second, supervisor],
      }),
    ).toMatchObject({
      outcome: "qualifies",
      workflowStatus: "track_b_eligible",
      reasonCodes: ["ADDITIONAL_BLIND_REVIEW_REQUIRED", "REVIEW_MAJORITY_QUALIFIES"],
      reviewScore: 4,
      retainedReviewerScores: [
        { slot: 1, rubricScore: 5 },
        { slot: 2, rubricScore: 3 },
        { slot: 3, rubricScore: 4 },
      ],
      reviewSubmissionHashes: [first.contentHash, second.contentHash, supervisor.contentHash],
      observedDisagreement: { reviewerScoreDifference: 2, exceedsTolerance: true },
      humanOwnerId: "admissions-owner-syn-01",
      correctionRoute: "factual_or_procedural_correction",
      resultHash: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
    });
  });

  it("averages three narrative reviews from the start and qualifies at the cutoff", () => {
    const snapshot = invitedSnapshot("narrative");
    const plan = planBlindReview(snapshot);
    const scores = [SCORE_5, SCORE_4, SCORE_3];
    const submissions = plan.assignments.map((assignment, index) =>
      submitBlindReview({
        assignment,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        disposition: "scored",
        scores: scores[index]!,
      }),
    );

    expect(
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions,
      }),
    ).toMatchObject({
      outcome: "qualifies",
      workflowStatus: "track_b_eligible",
      reasonCodes: ["REVIEW_MAJORITY_QUALIFIES"],
      reviewScore: 4,
    });
  });

  it("uses the exact six-dimension average for a below-cutoff outcome", () => {
    const snapshot = invitedSnapshot("artifact");
    const submissions = planBlindReview(snapshot).assignments.map((assignment) =>
      submitBlindReview({
        assignment,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        disposition: "scored",
        scores: { DE: 4, LR: 4, TA: 3, IN: 4, RE: 3, SP: 3 },
      }),
    );

    expect(
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions,
      }),
    ).toMatchObject({
      outcome: "does_not_currently_qualify",
      workflowStatus: "track_b_does_not_currently_qualify",
      reasonCodes: ["REVIEW_MAJORITY_DOES_NOT_CURRENTLY_QUALIFY"],
      reviewScore: 3.5,
    });
  });

  it("creates a same-slot replacement after abstention and never scores the abstention", () => {
    const snapshot = invitedSnapshot("artifact");
    const plan = planBlindReview(snapshot);
    const abstention = submitBlindReview({
      assignment: plan.assignments[0]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "abstained",
    });
    const replacement = createReplacementAssignment(abstention);
    const second = submitBlindReview({
      assignment: plan.assignments[1]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_4,
    });

    expect(replacement).toMatchObject({
      slot: 1,
      role: "reviewer",
      attempt: 2,
      replacesAssignmentId: plan.assignments[0]!.assignmentId,
    });
    expect(
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions: [abstention, second],
      }),
    ).toMatchObject({ outcome: "pending", reviewScore: null, requiredAssignment: replacement });
  });

  it("advances the same slot after repeated abstentions", () => {
    const snapshot = invitedSnapshot("artifact");
    const plan = planBlindReview(snapshot);
    const firstAbstention = submitBlindReview({
      assignment: plan.assignments[0]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "abstained",
    });
    const secondAbstention = submitBlindReview({
      assignment: createReplacementAssignment(firstAbstention),
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "abstained",
    });
    const secondSlot = submitBlindReview({
      assignment: plan.assignments[1]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_4,
    });

    expect(
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions: [firstAbstention, secondAbstention, secondSlot],
      }).requiredAssignment,
    ).toMatchObject({
      slot: 1,
      attempt: 3,
      replacesAssignmentId: secondAbstention.assignment.assignmentId,
    });
  });

  it("turns blocked evidence into pending work instead of a low score", () => {
    const snapshot = invitedSnapshot("artifact");
    const blocked = submitBlindReview({
      assignment: planBlindReview(snapshot).assignments[0]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "blocked",
      blocker: "evidence_correction",
    });

    expect(
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions: [blocked],
      }),
    ).toMatchObject({
      outcome: "pending",
      workflowStatus: "review_pending_family_action",
      reasonCodes: ["EVIDENCE_NEEDS_CORRECTION"],
      reviewScore: null,
      retainedReviewerScores: [],
      pendingWork: {
        pendingReason: "pending_evidence_correction",
        ownerRole: "family",
        routeCode: "EVIDENCE_NEEDS_CORRECTION",
      },
    });
  });

  it("rejects a forged locked score whose retained content hash no longer matches", () => {
    const snapshot = invitedSnapshot("artifact");
    const plan = planBlindReview(snapshot);
    const first = submitBlindReview({
      assignment: plan.assignments[0]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_4,
    });
    const second = submitBlindReview({
      assignment: plan.assignments[1]!,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      disposition: "scored",
      scores: SCORE_4,
    });
    const forged = { ...first, rubricScore: 1 } as typeof first;

    expect(() =>
      aggregateBlindReview({
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions: [forged, second],
      }),
    ).toThrowError(expect.objectContaining({ code: "ASSIGNMENT_CONFLICT" }));
  });

  it("rejects a malformed score-range policy before accepting a locked score", () => {
    const assignment = planBlindReview(invitedSnapshot("artifact")).assignments[0]!;
    const invalidPolicy = {
      ...SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      minimumDimensionScore: Number.NaN,
    } as BlindReviewPolicy;

    expect(() =>
      submitBlindReview({
        assignment,
        policy: invalidPolicy,
        disposition: "scored",
        scores: SCORE_4,
      }),
    ).toThrowError(expect.objectContaining({ code: "VALIDATION_FAILED" }));
  });

  it("produces the same pending decision regardless of submission arrival order", () => {
    const snapshot = invitedSnapshot("artifact");
    const submissions = planBlindReview(snapshot).assignments.map((assignment, index) =>
      submitBlindReview({
        assignment,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        disposition: "scored",
        scores: index === 0 ? SCORE_5 : SCORE_3,
      }),
    );
    const forward = aggregateBlindReview({
      snapshot,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      submissions,
    });
    const reversed = aggregateBlindReview({
      snapshot,
      policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      submissions: [...submissions].reverse(),
    });

    expect(reversed).toEqual(forward);
  });

  it("keeps prohibited context outside review inputs and rejects injected context", () => {
    type ProhibitedReviewKey = Extract<
      keyof AggregateBlindReviewInput,
      (typeof PROHIBITED_REVIEW_FIELDS)[number]
    >;
    expectTypeOf<ProhibitedReviewKey>().toEqualTypeOf<never>();
    expectTypeOf<Extract<keyof BlindReviewAssignment, "peerScores">>().toEqualTypeOf<never>();

    const snapshot = invitedSnapshot("artifact");
    for (const field of PROHIBITED_REVIEW_FIELDS) {
      const enriched = {
        snapshot,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        submissions: [],
        [field]: "must-not-enter-review",
      } as AggregateBlindReviewInput;
      expect(() => aggregateBlindReview(enriched), field).toThrowError(
        expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }),
      );
    }

    const assignment = planBlindReview(snapshot).assignments[0]!;
    const enrichedAssignment = { ...assignment, householdIncome: 12_345 } as BlindReviewAssignment;
    expect(() =>
      submitBlindReview({
        assignment: enrichedAssignment,
        policy: SYNTHETIC_BLIND_REVIEW_POLICY_V1,
        disposition: "scored",
        scores: SCORE_4,
      }),
    ).toThrowError(expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }));

    const enrichedPolicy = {
      ...SYNTHETIC_BLIND_REVIEW_POLICY_V1,
      researchConsent: true,
    } as BlindReviewPolicy;
    expect(() =>
      aggregateBlindReview({ snapshot, policy: enrichedPolicy, submissions: [] }),
    ).toThrowError(expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }));
  });
});
