import { describe, expect, expectTypeOf, it } from "vitest";

import {
  APPLICATION_VERSION_STATES,
  DECISION_OUTCOMES,
  ERROR_CODES,
  type ErrorCode,
  REASON_CODES,
  RUBRIC_DIMENSIONS,
  RUBRIC_VERSION,
  type ReasonCode,
  WORKFLOW_STATUSES,
  type WorkflowStatus,
} from "../src/registers.js";

describe("admissions contract registers", () => {
  it("locks the twelve family-facing workflow statuses in PRD order", () => {
    expect(WORKFLOW_STATUSES).toEqual([
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
    ]);
    expectTypeOf<WorkflowStatus>().toEqualTypeOf<(typeof WORKFLOW_STATUSES)[number]>();
  });

  it("locks the thirteen ordered decision reason codes", () => {
    expect(REASON_CODES).toEqual([
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
    ]);
    expectTypeOf<ReasonCode>().toEqualTypeOf<(typeof REASON_CODES)[number]>();
  });

  it("locks rubric RB-SYN-01 and its six separately retained dimensions", () => {
    expect(RUBRIC_VERSION).toBe("RB-SYN-01");
    expect(RUBRIC_DIMENSIONS).toEqual([
      { code: "DE", label: "Domain Expertise" },
      { code: "LR", label: "Learning rate" },
      { code: "TA", label: "Transfer or abstraction" },
      { code: "IN", label: "Independence" },
      { code: "RE", label: "Recurrence" },
      { code: "SP", label: "Evidence specificity" },
    ]);
  });

  it("locks all seventeen machine error codes", () => {
    expect(ERROR_CODES).toEqual([
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
    ]);
    expectTypeOf<ErrorCode>().toEqualTypeOf<(typeof ERROR_CODES)[number]>();
  });

  it("locks application states and the three eligibility decision outcome enums", () => {
    expect(APPLICATION_VERSION_STATES).toEqual(["draft", "submitted", "superseded"]);
    expect(DECISION_OUTCOMES).toEqual({
      trackA: ["eligible", "not_eligible", "pending"],
      trackBInvitation: ["invited", "not_invited", "not_applicable", "pending"],
      trackBEligibility: ["qualifies", "does_not_currently_qualify", "pending"],
    });
  });

  it("exposes registers as deeply frozen values", () => {
    expect(Object.isFrozen(WORKFLOW_STATUSES)).toBe(true);
    expect(Object.isFrozen(RUBRIC_DIMENSIONS)).toBe(true);
    expect(RUBRIC_DIMENSIONS.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(DECISION_OUTCOMES)).toBe(true);
    expect(Object.values(DECISION_OUTCOMES).every(Object.isFrozen)).toBe(true);
  });
});
