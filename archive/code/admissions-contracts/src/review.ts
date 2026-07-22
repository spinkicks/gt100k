import { RUBRIC_VERSION, type RubricDimensionCode } from "./registers.js";

export const BLIND_REVIEW_CONTRACT_VERSION = "BR-SYN-01" as const;

export type BlindReviewSlot = 1 | 2 | 3;
export type BlindReviewRole = "reviewer" | "supervisor";
export type BlindReviewBlocker = "accessibility_route" | "evidence_correction";
export type RubricScores = Readonly<Record<RubricDimensionCode, number>>;

export interface BlindReviewPolicy {
  readonly policyBundleId: string;
  readonly rubricVersion: typeof RUBRIC_VERSION;
  readonly minimumDimensionScore: number;
  readonly maximumDimensionScore: number;
  readonly disagreementTolerance: number;
  readonly qualifyingCutoff: number;
  readonly humanOwnerId: string;
  readonly correctionRoute: "factual_or_procedural_correction";
  readonly decisionExpiresAt: string;
}

export const SYNTHETIC_BLIND_REVIEW_POLICY_V1 = Object.freeze({
  policyBundleId: "admissions-review-syn-v1",
  rubricVersion: RUBRIC_VERSION,
  minimumDimensionScore: 1,
  maximumDimensionScore: 5,
  disagreementTolerance: 1,
  qualifyingCutoff: 4,
  humanOwnerId: "admissions-owner-syn-01",
  correctionRoute: "factual_or_procedural_correction",
  decisionExpiresAt: "2026-12-31T23:59:59.999Z",
} as const satisfies BlindReviewPolicy);
