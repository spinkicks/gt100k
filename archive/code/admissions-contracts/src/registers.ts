export const APPLICATION_VERSION_STATES = Object.freeze([
  "draft",
  "submitted",
  "superseded",
] as const);

export const WORKFLOW_STATUSES = Object.freeze([
  "application_draft",
  "awaiting_assessment",
  "assessment_needs_correction",
  "track_a_eligible",
  "track_b_snapshot_required",
  "no_current_pathway",
  "snapshot_under_review",
  "review_pending_family_action",
  "review_pending_internal_action",
  "track_b_eligible",
  "track_b_does_not_currently_qualify",
  "policy_configuration_pending",
] as const);

export const REASON_CODES = Object.freeze([
  "TA_MET_CONFIGURED_BOUNDARY",
  "TA_BELOW_CONFIGURED_BOUNDARY",
  "TB_COMPOSITE_BAND",
  "TB_BATTERY_PROFILE",
  "TB_OUTSIDE_CONFIGURED_RULE",
  "ASSESSMENT_MISSING_OR_INVALID",
  "SNAPSHOT_REQUIRED",
  "REVIEW_MAJORITY_QUALIFIES",
  "REVIEW_MAJORITY_DOES_NOT_CURRENTLY_QUALIFY",
  "EVIDENCE_NEEDS_CORRECTION",
  "ADDITIONAL_BLIND_REVIEW_REQUIRED",
  "ACCESSIBILITY_ROUTE_REQUIRED",
  "POLICY_CONFIGURATION_PENDING",
] as const);

export const RUBRIC_VERSION = "RB-SYN-01" as const;

export const RUBRIC_DIMENSIONS = Object.freeze([
  Object.freeze({ code: "DE", label: "Domain Expertise" }),
  Object.freeze({ code: "LR", label: "Learning rate" }),
  Object.freeze({ code: "TA", label: "Transfer or abstraction" }),
  Object.freeze({ code: "IN", label: "Independence" }),
  Object.freeze({ code: "RE", label: "Recurrence" }),
  Object.freeze({ code: "SP", label: "Evidence specificity" }),
] as const);

export const ERROR_CODES = Object.freeze([
  "VALIDATION_FAILED",
  "AUTH_REQUIRED",
  "ROLE_FORBIDDEN",
  "RESOURCE_NOT_FOUND",
  "STALE_VERSION",
  "INVALID_STATE_TRANSITION",
  "SUBMISSION_LOCKED",
  "ASSIGNMENT_CONFLICT",
  "NOT_INVITED",
  "IDEMPOTENCY_KEY_REUSED",
  "INPUT_HASH_MISMATCH",
  "POLICY_HASH_MISMATCH",
  "CODE_VERSION_UNAVAILABLE",
  "FIXTURE_NOT_ALLOWLISTED",
  "NON_SYNTHETIC_INPUT",
  "FEATURE_DISABLED",
  "SERIALIZATION_RETRY_EXHAUSTED",
] as const);

export const DECISION_OUTCOMES = Object.freeze({
  trackA: Object.freeze(["eligible", "not_eligible", "pending"] as const),
  trackBInvitation: Object.freeze(["invited", "not_invited", "not_applicable", "pending"] as const),
  trackBEligibility: Object.freeze(["qualifies", "does_not_currently_qualify", "pending"] as const),
});

export type ApplicationVersionState = (typeof APPLICATION_VERSION_STATES)[number];
export type WorkflowStatus = (typeof WORKFLOW_STATUSES)[number];
export type ReasonCode = (typeof REASON_CODES)[number];
export type RubricDimension = (typeof RUBRIC_DIMENSIONS)[number];
export type RubricDimensionCode = RubricDimension["code"];
export type ErrorCode = (typeof ERROR_CODES)[number];
export type TrackAOutcome = (typeof DECISION_OUTCOMES.trackA)[number];
export type TrackBInvitationOutcome = (typeof DECISION_OUTCOMES.trackBInvitation)[number];
export type TrackBEligibilityOutcome = (typeof DECISION_OUTCOMES.trackBEligibility)[number];
