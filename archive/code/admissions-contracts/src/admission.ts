import type { SyntheticFinanceFixtureId } from "./allocation.js";

export const ADMISSION_CONTRACT_VERSION = "AD-SYN-01" as const;

export type AdmissionPathway = "track_a_automatic" | "track_b_lottery" | "track_b_review";
export type AdmissionOutcome = "not_eligible" | "not_offered" | "offered";
export type AidAllotmentOutcome = "allotted" | "not_applicable";
export type ResearchInvitationState = "invited" | "not_applicable";
export type ApplicantDecisionMessageCode =
  | "TRACK_A_OFFER"
  | "TRACK_B_DOES_NOT_CURRENTLY_QUALIFY"
  | "TRACK_B_NOT_OFFERED"
  | "TRACK_B_OFFER";

export interface SyntheticAidAllotment {
  readonly financeFixtureId: SyntheticFinanceFixtureId;
  readonly annualAidCents: number;
}

export interface SyntheticAdmissionPolicy {
  readonly policyBundleId: string;
  readonly currency: "USD";
  readonly aidAllotments: readonly SyntheticAidAllotment[];
  readonly nextCycleFeeWaiverCents: number;
  readonly humanOwnerId: string;
  readonly decisionExpiresAt: string;
}

export const SYNTHETIC_ADMISSION_POLICY_V1 = Object.freeze({
  policyBundleId: "admissions-finalization-syn-v1",
  currency: "USD",
  aidAllotments: Object.freeze([
    Object.freeze({ financeFixtureId: "finance-syn-h2-045k", annualAidCents: 1_000_000 }),
    Object.freeze({ financeFixtureId: "finance-syn-h4-090k", annualAidCents: 1_000_000 }),
    Object.freeze({ financeFixtureId: "finance-syn-h2-090k", annualAidCents: 500_000 }),
    Object.freeze({ financeFixtureId: "finance-syn-h4-140k", annualAidCents: 500_000 }),
    Object.freeze({ financeFixtureId: "finance-syn-h2-180k", annualAidCents: 0 }),
    Object.freeze({ financeFixtureId: "finance-syn-h4-220k", annualAidCents: 0 }),
  ]),
  nextCycleFeeWaiverCents: 10_000,
  humanOwnerId: "admission-owner-syn-01",
  decisionExpiresAt: "2026-12-31T23:59:59.999Z",
} as const satisfies SyntheticAdmissionPolicy);

export const APPLICANT_DECISION_MESSAGES = Object.freeze({
  TRACK_A_OFFER:
    "You have an admission offer for this cycle through the configured Track A pathway. Your synthetic aid allotment and next steps are shown separately.",
  TRACK_B_OFFER:
    "You received a seat offer for this cycle through the locked Track B allocation. Your synthetic aid allotment and next steps are shown separately.",
  TRACK_B_NOT_OFFERED:
    "You were eligible through Track B but were not offered a seat this cycle. This allocation outcome is separate from capability eligibility. The optional next-cycle fee-waiver research invitation will not affect future admissions.",
  TRACK_B_DOES_NOT_CURRENTLY_QUALIFY:
    "The Track B review did not meet the configured threshold for this cycle. You may use the factual or procedural correction route or apply in a later cycle.",
} as const satisfies Readonly<Record<ApplicantDecisionMessageCode, string>>);
