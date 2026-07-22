import { type Sha256ContentHash, sha256ContentHash } from "../../admissions-contracts/src/hash.js";
import {
  RUBRIC_DIMENSIONS,
  RUBRIC_VERSION,
  type ReasonCode,
  type RubricDimensionCode,
  type TrackBEligibilityOutcome,
  type WorkflowStatus,
} from "../../admissions-contracts/src/registers.js";
import type {
  BlindReviewBlocker,
  BlindReviewPolicy,
  BlindReviewRole,
  BlindReviewSlot,
  RubricScores,
} from "../../admissions-contracts/src/review.js";
import { BLIND_REVIEW_CONTRACT_VERSION } from "../../admissions-contracts/src/review.js";
import type { TalentSnapshotVersion } from "./snapshot.js";

export interface BlindReviewAssignment {
  readonly assignmentId: string;
  readonly snapshotContentHash: Sha256ContentHash;
  readonly slot: BlindReviewSlot;
  readonly role: BlindReviewRole;
  readonly attempt: number;
  readonly replacesAssignmentId: string | null;
}

export interface BlindReviewPlan {
  readonly snapshotContentHash: Sha256ContentHash;
  readonly assignments: readonly BlindReviewAssignment[];
}

interface BlindReviewSubmissionBase {
  readonly assignment: BlindReviewAssignment;
  readonly policy: BlindReviewPolicy;
}

export interface SubmitScoredBlindReviewInput extends BlindReviewSubmissionBase {
  readonly disposition: "scored";
  readonly scores: RubricScores;
}

export interface SubmitAbstainedBlindReviewInput extends BlindReviewSubmissionBase {
  readonly disposition: "abstained";
}

export interface SubmitBlockedBlindReviewInput extends BlindReviewSubmissionBase {
  readonly disposition: "blocked";
  readonly blocker: BlindReviewBlocker;
}

export type SubmitBlindReviewInput =
  | SubmitAbstainedBlindReviewInput
  | SubmitBlockedBlindReviewInput
  | SubmitScoredBlindReviewInput;

export interface BlindReviewSubmission {
  readonly submissionId: string;
  readonly assignment: BlindReviewAssignment;
  readonly policyBundleId: string;
  readonly rubricVersion: BlindReviewPolicy["rubricVersion"];
  readonly locked: true;
  readonly disposition: "abstained" | "blocked" | "scored";
  readonly blocker?: BlindReviewBlocker;
  readonly scores?: RubricScores;
  readonly rubricScore: number | null;
  readonly contentHash: Sha256ContentHash;
}

export interface AggregateBlindReviewInput {
  readonly snapshot: TalentSnapshotVersion;
  readonly policy: BlindReviewPolicy;
  readonly submissions: readonly BlindReviewSubmission[];
}

export interface BlindReviewDecision {
  readonly snapshotContentHash: Sha256ContentHash;
  readonly policyBundleId: string;
  readonly outcome: TrackBEligibilityOutcome;
  readonly workflowStatus: WorkflowStatus;
  readonly reasonCodes: readonly ReasonCode[];
  readonly reviewScore: number | null;
  readonly retainedReviewerScores: readonly {
    readonly slot: BlindReviewSlot;
    readonly rubricScore: number;
  }[];
  readonly reviewSubmissionHashes: readonly Sha256ContentHash[];
  readonly observedDisagreement: {
    readonly reviewerScoreDifference: number | null;
    readonly exceedsTolerance: boolean;
  };
  readonly requiredAssignment: BlindReviewAssignment | null;
  readonly pendingWork: {
    readonly pendingReason:
      | "pending_accessibility_route"
      | "pending_additional_blind_review"
      | "pending_evidence_correction";
    readonly ownerRole: "access_steward" | "admissions" | "family";
    readonly routeCode: ReasonCode;
    readonly deadline: string;
    readonly state: "open";
  } | null;
  readonly humanOwnerId: string;
  readonly correctionRoute: BlindReviewPolicy["correctionRoute"];
  readonly decisionExpiresAt: string;
  readonly resultHash: Sha256ContentHash;
}

export class BlindReviewError extends Error {
  readonly code: "ASSIGNMENT_CONFLICT" | "NON_SYNTHETIC_INPUT" | "VALIDATION_FAILED";

  constructor(code: BlindReviewError["code"]) {
    super(code);
    this.name = "BlindReviewError";
    this.code = code;
  }
}

function assignmentFor(
  snapshotContentHash: Sha256ContentHash,
  versionId: string,
  slot: BlindReviewSlot,
  attempt = 1,
  replacesAssignmentId: string | null = null,
): BlindReviewAssignment {
  return Object.freeze({
    assignmentId: `${versionId}:blind-review:slot-${slot}:attempt-${attempt}`,
    snapshotContentHash,
    slot,
    role: slot === 3 ? "supervisor" : "reviewer",
    attempt,
    replacesAssignmentId,
  });
}

export function planBlindReview(snapshot: TalentSnapshotVersion): BlindReviewPlan {
  const slots: readonly BlindReviewSlot[] = snapshot.route === "narrative" ? [1, 2, 3] : [1, 2];
  return Object.freeze({
    snapshotContentHash: snapshot.contentHash,
    assignments: Object.freeze(
      slots.map((slot) => assignmentFor(snapshot.contentHash, snapshot.versionId, slot)),
    ),
  });
}

const PROHIBITED_REVIEW_KEYS = [
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

function assertNoProhibitedContext(input: object): void {
  if (PROHIBITED_REVIEW_KEYS.some((key) => key in input)) {
    throw new BlindReviewError("NON_SYNTHETIC_INPUT");
  }
}

function mean(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function assertPolicy(policy: BlindReviewPolicy): void {
  if (
    policy.policyBundleId.trim().length === 0 ||
    policy.rubricVersion !== RUBRIC_VERSION ||
    !Number.isFinite(policy.minimumDimensionScore) ||
    !Number.isFinite(policy.maximumDimensionScore) ||
    policy.minimumDimensionScore > policy.maximumDimensionScore ||
    !Number.isFinite(policy.disagreementTolerance) ||
    policy.disagreementTolerance < 0 ||
    !Number.isFinite(policy.qualifyingCutoff) ||
    policy.qualifyingCutoff < policy.minimumDimensionScore ||
    policy.qualifyingCutoff > policy.maximumDimensionScore ||
    policy.humanOwnerId.trim().length === 0 ||
    policy.correctionRoute !== "factual_or_procedural_correction" ||
    !Number.isFinite(Date.parse(policy.decisionExpiresAt))
  ) {
    throw new BlindReviewError("VALIDATION_FAILED");
  }
}

function submissionContent(
  submission: Pick<
    BlindReviewSubmission,
    "assignment" | "blocker" | "disposition" | "rubricScore" | "scores"
  >,
  policy: BlindReviewPolicy,
): object {
  return {
    assignment: submission.assignment,
    blocker: submission.blocker,
    contractVersion: BLIND_REVIEW_CONTRACT_VERSION,
    disposition: submission.disposition,
    policyBundleId: policy.policyBundleId,
    rubricScore: submission.rubricScore,
    rubricVersion: policy.rubricVersion,
    scoreRange: {
      maximum: policy.maximumDimensionScore,
      minimum: policy.minimumDimensionScore,
    },
    scores: submission.scores,
  };
}

export function submitBlindReview(input: SubmitBlindReviewInput): BlindReviewSubmission {
  assertNoProhibitedContext(input);
  const { assignment, policy } = input;
  assertNoProhibitedContext(assignment);
  assertNoProhibitedContext(policy);
  assertPolicy(policy);
  if (
    assignment.assignmentId.trim().length === 0 ||
    !([1, 2, 3] as const).includes(assignment.slot) ||
    !Number.isInteger(assignment.attempt) ||
    assignment.attempt < 1 ||
    assignment.role !== (assignment.slot === 3 ? "supervisor" : "reviewer")
  ) {
    throw new BlindReviewError("VALIDATION_FAILED");
  }

  let scores: RubricScores | undefined;
  let rubricScore: number | null = null;
  if (input.disposition === "scored") {
    const dimensionCodes = RUBRIC_DIMENSIONS.map(({ code }) => code);
    if (
      Object.keys(input.scores).length !== dimensionCodes.length ||
      dimensionCodes.some(
        (code) =>
          !Number.isFinite(input.scores[code]) ||
          input.scores[code] < policy.minimumDimensionScore ||
          input.scores[code] > policy.maximumDimensionScore,
      )
    ) {
      throw new BlindReviewError("VALIDATION_FAILED");
    }
    scores = Object.freeze(
      Object.fromEntries(dimensionCodes.map((code) => [code, input.scores[code]])) as Record<
        RubricDimensionCode,
        number
      >,
    );
    rubricScore = mean(dimensionCodes.map((code) => scores![code]));
  }

  const blocker = input.disposition === "blocked" ? input.blocker : undefined;
  const content = submissionContent(
    { assignment, blocker, disposition: input.disposition, rubricScore, scores },
    policy,
  );
  return Object.freeze({
    submissionId: `${assignment.assignmentId}:submission`,
    assignment,
    policyBundleId: policy.policyBundleId,
    rubricVersion: policy.rubricVersion,
    locked: true,
    disposition: input.disposition,
    blocker,
    scores,
    rubricScore,
    contentHash: sha256ContentHash(content),
  });
}

export function createReplacementAssignment(
  submission: BlindReviewSubmission,
): BlindReviewAssignment {
  if (submission.disposition !== "abstained") {
    throw new BlindReviewError("ASSIGNMENT_CONFLICT");
  }
  const prior = submission.assignment;
  const assignmentBase = prior.assignmentId.replace(/:attempt-\d+$/, "");
  if (assignmentBase === prior.assignmentId) {
    throw new BlindReviewError("VALIDATION_FAILED");
  }
  return Object.freeze({
    assignmentId: `${assignmentBase}:attempt-${prior.attempt + 1}`,
    snapshotContentHash: prior.snapshotContentHash,
    slot: prior.slot,
    role: prior.role,
    attempt: prior.attempt + 1,
    replacesAssignmentId: prior.assignmentId,
  });
}

function assertAggregationInput(input: AggregateBlindReviewInput): void {
  assertNoProhibitedContext(input);
  const { policy, snapshot, submissions } = input;
  assertNoProhibitedContext(policy);
  assertPolicy(policy);
  if (new Set(submissions.map(({ submissionId }) => submissionId)).size !== submissions.length) {
    throw new BlindReviewError("VALIDATION_FAILED");
  }
  for (const submission of submissions) {
    assertNoProhibitedContext(submission);
    assertNoProhibitedContext(submission.assignment);
    if (
      submission.assignment.snapshotContentHash !== snapshot.contentHash ||
      submission.policyBundleId !== policy.policyBundleId ||
      submission.rubricVersion !== policy.rubricVersion ||
      !submission.locked ||
      submission.submissionId !== `${submission.assignment.assignmentId}:submission` ||
      submission.contentHash !== sha256ContentHash(submissionContent(submission, policy))
    ) {
      throw new BlindReviewError("ASSIGNMENT_CONFLICT");
    }
  }
}

interface DecisionParts {
  readonly outcome: TrackBEligibilityOutcome;
  readonly workflowStatus: WorkflowStatus;
  readonly reasonCodes: readonly ReasonCode[];
  readonly reviewScore: number | null;
  readonly retainedReviewerScores: BlindReviewDecision["retainedReviewerScores"];
  readonly observedDisagreement: BlindReviewDecision["observedDisagreement"];
  readonly requiredAssignment: BlindReviewAssignment | null;
  readonly pendingWork: BlindReviewDecision["pendingWork"];
}

function buildDecision(
  input: AggregateBlindReviewInput,
  parts: DecisionParts,
): BlindReviewDecision {
  const reasonCodes = Object.freeze([...parts.reasonCodes]);
  const retainedReviewerScores = Object.freeze(
    parts.retainedReviewerScores.map((score) => Object.freeze({ ...score })),
  );
  const reviewSubmissionHashes = Object.freeze(
    [...input.submissions]
      .sort(
        (left, right) =>
          left.assignment.slot - right.assignment.slot ||
          left.assignment.attempt - right.assignment.attempt,
      )
      .map(({ contentHash }) => contentHash),
  );
  const observedDisagreement = Object.freeze({ ...parts.observedDisagreement });
  const pendingWork = parts.pendingWork ? Object.freeze({ ...parts.pendingWork }) : null;
  const content = {
    correctionRoute: input.policy.correctionRoute,
    decisionExpiresAt: input.policy.decisionExpiresAt,
    decisionKind: "track_b_review",
    humanOwnerId: input.policy.humanOwnerId,
    observedDisagreement,
    outcome: parts.outcome,
    pendingWork,
    policy: {
      disagreementTolerance: input.policy.disagreementTolerance,
      maximumDimensionScore: input.policy.maximumDimensionScore,
      minimumDimensionScore: input.policy.minimumDimensionScore,
      policyBundleId: input.policy.policyBundleId,
      qualifyingCutoff: input.policy.qualifyingCutoff,
      rubricVersion: input.policy.rubricVersion,
    },
    reasonCodes,
    requiredAssignment: parts.requiredAssignment,
    retainedReviewerScores,
    reviewSubmissionHashes,
    reviewScore: parts.reviewScore,
    routingResultHash: input.snapshot.routingResultHash,
    snapshotContentHash: input.snapshot.contentHash,
    workflowStatus: parts.workflowStatus,
  };
  return Object.freeze({
    snapshotContentHash: input.snapshot.contentHash,
    policyBundleId: input.policy.policyBundleId,
    outcome: parts.outcome,
    workflowStatus: parts.workflowStatus,
    reasonCodes,
    reviewScore: parts.reviewScore,
    retainedReviewerScores,
    reviewSubmissionHashes,
    observedDisagreement,
    requiredAssignment: parts.requiredAssignment,
    pendingWork,
    humanOwnerId: input.policy.humanOwnerId,
    correctionRoute: input.policy.correctionRoute,
    decisionExpiresAt: input.policy.decisionExpiresAt,
    resultHash: sha256ContentHash(content),
  });
}

function pendingDecision(
  input: AggregateBlindReviewInput,
  reasonCode: ReasonCode,
  requiredAssignment: BlindReviewAssignment | null,
  observedDisagreement: BlindReviewDecision["observedDisagreement"],
): BlindReviewDecision {
  const pendingByReason = {
    ACCESSIBILITY_ROUTE_REQUIRED: {
      pendingReason: "pending_accessibility_route",
      ownerRole: "access_steward",
      workflowStatus: "review_pending_internal_action",
    },
    ADDITIONAL_BLIND_REVIEW_REQUIRED: {
      pendingReason: "pending_additional_blind_review",
      ownerRole: "admissions",
      workflowStatus: "review_pending_internal_action",
    },
    EVIDENCE_NEEDS_CORRECTION: {
      pendingReason: "pending_evidence_correction",
      ownerRole: "family",
      workflowStatus: "review_pending_family_action",
    },
  } as const;
  const pending = pendingByReason[reasonCode as keyof typeof pendingByReason];
  if (!pending) throw new BlindReviewError("VALIDATION_FAILED");
  return buildDecision(input, {
    outcome: "pending",
    workflowStatus: pending.workflowStatus,
    reasonCodes: [reasonCode],
    reviewScore: null,
    retainedReviewerScores: input.submissions
      .filter(
        (submission): submission is BlindReviewSubmission & { rubricScore: number } =>
          submission.disposition === "scored" && submission.rubricScore !== null,
      )
      .map(({ assignment, rubricScore }) => ({ slot: assignment.slot, rubricScore }))
      .sort((left, right) => left.slot - right.slot),
    observedDisagreement,
    requiredAssignment,
    pendingWork: {
      pendingReason: pending.pendingReason,
      ownerRole: pending.ownerRole,
      routeCode: reasonCode,
      deadline: input.policy.decisionExpiresAt,
      state: "open",
    },
  });
}

export function aggregateBlindReview(input: AggregateBlindReviewInput): BlindReviewDecision {
  assertAggregationInput(input);
  const blocked = input.submissions.find(({ disposition }) => disposition === "blocked");
  if (blocked) {
    return pendingDecision(
      input,
      blocked.blocker === "accessibility_route"
        ? "ACCESSIBILITY_ROUTE_REQUIRED"
        : "EVIDENCE_NEEDS_CORRECTION",
      null,
      { reviewerScoreDifference: null, exceedsTolerance: false },
    );
  }

  const scoredBySlot = new Map<BlindReviewSlot, BlindReviewSubmission>();
  for (const submission of input.submissions) {
    if (submission.disposition !== "scored") continue;
    if (scoredBySlot.has(submission.assignment.slot)) {
      throw new BlindReviewError("ASSIGNMENT_CONFLICT");
    }
    scoredBySlot.set(submission.assignment.slot, submission);
  }

  const initialSlots: readonly BlindReviewSlot[] =
    input.snapshot.route === "narrative" ? [1, 2, 3] : [1, 2];
  const missingInitialSlot = initialSlots.find((slot) => !scoredBySlot.has(slot));
  if (missingInitialSlot !== undefined) {
    const abstention = input.submissions
      .filter(
        (submission) =>
          submission.disposition === "abstained" &&
          submission.assignment.slot === missingInitialSlot,
      )
      .sort((left, right) => right.assignment.attempt - left.assignment.attempt)[0];
    const requiredAssignment = abstention
      ? createReplacementAssignment(abstention)
      : assignmentFor(input.snapshot.contentHash, input.snapshot.versionId, missingInitialSlot);
    return pendingDecision(input, "ADDITIONAL_BLIND_REVIEW_REQUIRED", requiredAssignment, {
      reviewerScoreDifference: null,
      exceedsTolerance: false,
    });
  }

  const firstScore = scoredBySlot.get(1)!.rubricScore!;
  const secondScore = scoredBySlot.get(2)!.rubricScore!;
  const reviewerScoreDifference = Math.abs(firstScore - secondScore);
  const exceedsTolerance = reviewerScoreDifference > input.policy.disagreementTolerance;
  const observedDisagreement = { reviewerScoreDifference, exceedsTolerance };
  if (input.snapshot.route === "artifact" && exceedsTolerance && !scoredBySlot.has(3)) {
    return pendingDecision(
      input,
      "ADDITIONAL_BLIND_REVIEW_REQUIRED",
      assignmentFor(input.snapshot.contentHash, input.snapshot.versionId, 3),
      observedDisagreement,
    );
  }
  if (input.snapshot.route === "artifact" && !exceedsTolerance && scoredBySlot.has(3)) {
    throw new BlindReviewError("ASSIGNMENT_CONFLICT");
  }

  const retainedReviewerScores = [...scoredBySlot.entries()]
    .sort(([left], [right]) => left - right)
    .map(([slot, submission]) => ({ slot, rubricScore: submission.rubricScore! }));
  const reviewScore = mean(retainedReviewerScores.map(({ rubricScore }) => rubricScore));
  const qualifies = reviewScore >= input.policy.qualifyingCutoff;
  const reasonCodes: ReasonCode[] = [];
  if (input.snapshot.route === "artifact" && exceedsTolerance) {
    reasonCodes.push("ADDITIONAL_BLIND_REVIEW_REQUIRED");
  }
  reasonCodes.push(
    qualifies ? "REVIEW_MAJORITY_QUALIFIES" : "REVIEW_MAJORITY_DOES_NOT_CURRENTLY_QUALIFY",
  );
  return buildDecision(input, {
    outcome: qualifies ? "qualifies" : "does_not_currently_qualify",
    workflowStatus: qualifies ? "track_b_eligible" : "track_b_does_not_currently_qualify",
    reasonCodes,
    reviewScore,
    retainedReviewerScores,
    observedDisagreement,
    requiredAssignment: null,
    pendingWork: null,
  });
}
