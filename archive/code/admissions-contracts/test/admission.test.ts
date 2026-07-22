import { describe, expect, expectTypeOf, it } from "vitest";

import {
  ADMISSION_CONTRACT_VERSION,
  APPLICANT_DECISION_MESSAGES,
  type AdmissionOutcome,
  type ApplicantDecisionMessageCode,
  type ResearchInvitationState,
  SYNTHETIC_ADMISSION_POLICY_V1,
} from "../src/admission.js";

describe("admission, aid, and research contracts", () => {
  it("locks the synthetic policy and final outcome registers", () => {
    expect(ADMISSION_CONTRACT_VERSION).toBe("AD-SYN-01");
    expect(SYNTHETIC_ADMISSION_POLICY_V1).toEqual({
      policyBundleId: "admissions-finalization-syn-v1",
      currency: "USD",
      aidAllotments: [
        { financeFixtureId: "finance-syn-h2-045k", annualAidCents: 1_000_000 },
        { financeFixtureId: "finance-syn-h4-090k", annualAidCents: 1_000_000 },
        { financeFixtureId: "finance-syn-h2-090k", annualAidCents: 500_000 },
        { financeFixtureId: "finance-syn-h4-140k", annualAidCents: 500_000 },
        { financeFixtureId: "finance-syn-h2-180k", annualAidCents: 0 },
        { financeFixtureId: "finance-syn-h4-220k", annualAidCents: 0 },
      ],
      nextCycleFeeWaiverCents: 10_000,
      humanOwnerId: "admission-owner-syn-01",
      decisionExpiresAt: "2026-12-31T23:59:59.999Z",
    });
    expectTypeOf<AdmissionOutcome>().toEqualTypeOf<"not_eligible" | "not_offered" | "offered">();
    expectTypeOf<ResearchInvitationState>().toEqualTypeOf<"invited" | "not_applicable">();
  });

  it("locks four non-stigmatizing, non-causal applicant messages", () => {
    expect(Object.keys(APPLICANT_DECISION_MESSAGES)).toEqual([
      "TRACK_A_OFFER",
      "TRACK_B_OFFER",
      "TRACK_B_NOT_OFFERED",
      "TRACK_B_DOES_NOT_CURRENTLY_QUALIFY",
    ] satisfies ApplicantDecisionMessageCode[]);

    for (const message of Object.values(APPLICANT_DECISION_MESSAGES)) {
      const normalized = message.toLowerCase();
      expect(normalized).not.toContain("not gifted");
      expect(normalized).not.toContain("less gifted");
      expect(normalized).not.toContain("measured effect");
      expect(normalized).not.toContain("program effect");
      expect(normalized).not.toContain("caused");
      expect(normalized).not.toContain("improved");
    }
  });

  it("exposes deeply frozen policy and message values", () => {
    expect(Object.isFrozen(SYNTHETIC_ADMISSION_POLICY_V1)).toBe(true);
    expect(Object.isFrozen(SYNTHETIC_ADMISSION_POLICY_V1.aidAllotments)).toBe(true);
    expect(SYNTHETIC_ADMISSION_POLICY_V1.aidAllotments.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(APPLICANT_DECISION_MESSAGES)).toBe(true);
  });
});
