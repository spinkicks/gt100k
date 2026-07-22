import { describe, expect, expectTypeOf, it } from "vitest";

import { SYNTHETIC_ROUTING_POLICY_V1 } from "../../admissions-contracts/src/routing.js";
import {
  type CogatAssessmentVersion,
  type CogatRoutingInput,
  type CogatScores,
  createCogatAssessmentVersion,
  routeCogatAssessment,
} from "../src/routing.js";

function assessment(
  versionId: string,
  scores: CogatScores,
  validity: "pending" | "valid" | "invalid" = "valid",
  locked = true,
): CogatAssessmentVersion {
  return createCogatAssessmentVersion({
    versionId,
    version: 1,
    supersedes: null,
    validity,
    locked,
    scores,
  });
}

const goldenCases: ReadonlyArray<{
  readonly label: string;
  readonly versionId: string;
  readonly scores: CogatScores;
  readonly expected: {
    readonly trackAOutcome: "eligible" | "not_eligible";
    readonly trackBInvitationOutcome: "invited" | "not_invited" | "not_applicable";
    readonly workflowStatus:
      | "track_a_eligible"
      | "track_b_snapshot_required"
      | "no_current_pathway";
    readonly reasonCodes: readonly string[];
    readonly resultHash: `sha256:${string}`;
  };
}> = [
  {
    label: "Track A at its boundary",
    versionId: "assessment-syn-track-a:v1",
    scores: { composite: 90, verbal: 70, quantitative: 80, nonverbal: 90 },
    expected: {
      trackAOutcome: "eligible",
      trackBInvitationOutcome: "not_applicable",
      workflowStatus: "track_a_eligible",
      reasonCodes: ["TA_MET_CONFIGURED_BOUNDARY"],
      resultHash: "sha256:9bf5ab0fdd6b4bc5a759a3af9b09683dddaa17a7fd03e21b4d7af809c82bcdee",
    },
  },
  {
    label: "Track B composite band",
    versionId: "assessment-syn-composite:v1",
    scores: { composite: 85, verbal: 70, quantitative: 79, nonverbal: 75 },
    expected: {
      trackAOutcome: "not_eligible",
      trackBInvitationOutcome: "invited",
      workflowStatus: "track_b_snapshot_required",
      reasonCodes: ["TA_BELOW_CONFIGURED_BOUNDARY", "TB_COMPOSITE_BAND", "SNAPSHOT_REQUIRED"],
      resultHash: "sha256:3cf66a46fc2e1238e804704aac276f9050ba6be2ded6aabdd4657c9fbe39ae73",
    },
  },
  {
    label: "Track B battery profile",
    versionId: "assessment-syn-battery:v1",
    scores: { composite: 70, verbal: 91, quantitative: 65, nonverbal: 60 },
    expected: {
      trackAOutcome: "not_eligible",
      trackBInvitationOutcome: "invited",
      workflowStatus: "track_b_snapshot_required",
      reasonCodes: ["TA_BELOW_CONFIGURED_BOUNDARY", "TB_BATTERY_PROFILE", "SNAPSHOT_REQUIRED"],
      resultHash: "sha256:4fd3f786c153c028ce411bf8671be727e91fbe7b4edebc377c2a4477dad4678c",
    },
  },
  {
    label: "both Track B invitation rules in contract order",
    versionId: "assessment-syn-both:v1",
    scores: { composite: 82, verbal: 95, quantitative: 75, nonverbal: 80 },
    expected: {
      trackAOutcome: "not_eligible",
      trackBInvitationOutcome: "invited",
      workflowStatus: "track_b_snapshot_required",
      reasonCodes: [
        "TA_BELOW_CONFIGURED_BOUNDARY",
        "TB_COMPOSITE_BAND",
        "TB_BATTERY_PROFILE",
        "SNAPSHOT_REQUIRED",
      ],
      resultHash: "sha256:a02127047940aee3b8deaca19363de199d39a99ee786d520f23d16cc8aed57a0",
    },
  },
  {
    label: "outside the configured Track B rules",
    versionId: "assessment-syn-outside:v1",
    scores: { composite: 79, verbal: 89, quantitative: 75, nonverbal: null },
    expected: {
      trackAOutcome: "not_eligible",
      trackBInvitationOutcome: "not_invited",
      workflowStatus: "no_current_pathway",
      reasonCodes: ["TA_BELOW_CONFIGURED_BOUNDARY", "TB_OUTSIDE_CONFIGURED_RULE"],
      resultHash: "sha256:81741690f3fad35f3273ec61175f45ef3e378d0adcba4bd94d0225978981230e",
    },
  },
];

describe("CogAT assessment intake", () => {
  it("snapshots a versioned, locked, deeply immutable synthetic assessment", () => {
    const scores: CogatScores = { composite: 90, verbal: 70, quantitative: 80, nonverbal: 90 };
    const version = assessment("assessment-syn-track-a:v1", scores);

    expect(version).toMatchObject({
      instrument: "COGAT_SYNTHETIC",
      versionId: "assessment-syn-track-a:v1",
      version: 1,
      supersedes: null,
      validity: "valid",
      locked: true,
      contentHash: "sha256:0c4d06869da448dfd9c8fc46f6fa8fa33e2b79a9b50b92b201e22f79edb26ed6",
    });
    expect(Object.isFrozen(version)).toBe(true);
    expect(Object.isFrozen(version.scores)).toBe(true);
  });

  it("rejects scores outside the synthetic 0-100 contract", () => {
    expect(() =>
      assessment("assessment-syn-invalid:v1", {
        composite: -1,
        verbal: null,
        quantitative: null,
        nonverbal: null,
      }),
    ).toThrow("composite must be null or a finite score from 0 through 100");
  });
});

describe("automatic CogAT routing", () => {
  it.each(goldenCases)("locks the golden result for $label", ({ versionId, scores, expected }) => {
    const decision = routeCogatAssessment({
      assessment: assessment(versionId, scores),
      policy: SYNTHETIC_ROUTING_POLICY_V1,
      trackBEnabled: true,
    });

    expect(decision).toMatchObject(expected);
    expect(Object.isFrozen(decision)).toBe(true);
    expect(Object.isFrozen(decision.reasonCodes)).toBe(true);
  });

  it.each([
    { validity: "pending" as const, locked: true, composite: null },
    { validity: "invalid" as const, locked: true, composite: 75 },
    { validity: "valid" as const, locked: false, composite: 75 },
    { validity: "valid" as const, locked: true, composite: null },
  ])("keeps $validity or unlocked/incomplete intake pending", ({ validity, locked, composite }) => {
    const decision = routeCogatAssessment({
      assessment: assessment(
        `assessment-syn-${validity}-${String(locked)}-${String(composite)}:v1`,
        { composite, verbal: null, quantitative: null, nonverbal: null },
        validity,
        locked,
      ),
      policy: SYNTHETIC_ROUTING_POLICY_V1,
      trackBEnabled: true,
    });

    expect(decision).toMatchObject({
      trackAOutcome: "pending",
      trackBInvitationOutcome: "pending",
      workflowStatus: "assessment_needs_correction",
      reasonCodes: ["ASSESSMENT_MISSING_OR_INVALID"],
    });
  });

  it("preserves the exact Track A baseline when Track B is disabled", () => {
    const locked = assessment("assessment-syn-track-a:v1", goldenCases[0]!.scores);
    const enabled = routeCogatAssessment({
      assessment: locked,
      policy: SYNTHETIC_ROUTING_POLICY_V1,
      trackBEnabled: true,
    });
    const disabled = routeCogatAssessment({
      assessment: locked,
      policy: SYNTHETIC_ROUTING_POLICY_V1,
      trackBEnabled: false,
    });

    expect(disabled).toEqual(enabled);
  });

  it("marks Track B not applicable when the below-cutoff pathway is disabled", () => {
    const decision = routeCogatAssessment({
      assessment: assessment("assessment-syn-composite:v1", goldenCases[1]!.scores),
      policy: SYNTHETIC_ROUTING_POLICY_V1,
      trackBEnabled: false,
    });

    expect(decision).toMatchObject({
      trackAOutcome: "not_eligible",
      trackBInvitationOutcome: "not_applicable",
      workflowStatus: "no_current_pathway",
      reasonCodes: ["TA_BELOW_CONFIGURED_BOUNDARY"],
    });
  });

  it("keeps prohibited context outside eligibility types and hashes", () => {
    type ProhibitedCapabilityKey = Extract<
      keyof CogatRoutingInput | keyof CogatAssessmentVersion | keyof CogatScores,
      "householdIncome" | "householdSize" | "address" | "accommodationUsed" | "researchConsent"
    >;
    expectTypeOf<ProhibitedCapabilityKey>().toEqualTypeOf<never>();

    const input: CogatRoutingInput = {
      assessment: assessment("assessment-syn-composite:v1", goldenCases[1]!.scores),
      policy: SYNTHETIC_ROUTING_POLICY_V1,
      trackBEnabled: true,
    };
    const enriched = {
      ...input,
      householdIncome: 12_345,
      householdSize: 9,
      accommodationUsed: true,
      researchConsent: false,
    } as CogatRoutingInput;

    expect(routeCogatAssessment(enriched)).toEqual(routeCogatAssessment(input));
  });
});
