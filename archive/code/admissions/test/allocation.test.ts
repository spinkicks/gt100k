import { describe, expect, expectTypeOf, it } from "vitest";

import {
  SYNTHETIC_ALLOCATION_POLICY_V1,
  type SyntheticAllocationPolicy,
  type SyntheticFinanceFixtureId,
} from "../../admissions-contracts/src/allocation.js";
import { canonicalize, sha256ContentHash } from "../../admissions-contracts/src/hash.js";
import {
  type IncomeBandedLotteryInput,
  type TrackBAllocationEligibility,
  replayIncomeBandedLottery,
  runIncomeBandedLottery,
} from "../src/allocation.js";

const GOLDEN_POOL = [
  ["applicant-syn-ada", "finance-syn-h2-045k"],
  ["applicant-syn-beck", "finance-syn-h4-090k"],
  ["applicant-syn-curie", "finance-syn-h2-090k"],
  ["applicant-syn-darwin", "finance-syn-h4-140k"],
  ["applicant-syn-euler", "finance-syn-h2-180k"],
  ["applicant-syn-faraday", "finance-syn-h4-220k"],
] as const satisfies readonly (readonly [string, SyntheticFinanceFixtureId])[];

function eligibility(applicationId: string): TrackBAllocationEligibility {
  return {
    outcome: "qualifies",
    workflowStatus: "track_b_eligible",
    resultHash: sha256ContentHash({
      decisionKind: "track_b_review",
      outcome: "qualifies",
      syntheticApplicationId: applicationId,
    }),
  };
}

function goldenInput(): IncomeBandedLotteryInput {
  return {
    cycleId: "cycle-syn-2026",
    seed: "allocation-seed-syn-2026-001",
    policy: SYNTHETIC_ALLOCATION_POLICY_V1,
    eligiblePool: GOLDEN_POOL.map(([applicationId, financeFixtureId]) => ({
      applicationId,
      eligibility: eligibility(applicationId),
      financeFixtureId,
    })),
  };
}

describe("income-banded lottery", () => {
  it("locks the golden household-adjusted draw to exact outcomes and hashes", () => {
    const draw = runIncomeBandedLottery(goldenInput());

    expect(draw).toMatchObject({
      drawId: "cycle-syn-2026:admissions-allocation-syn-v1:draw",
      locked: true,
      policyHash: "sha256:c6bd206530dcac04e7054d14d726e7cb0418020c66a7cef9b6c138a0156135dd",
      inputHash: "sha256:c2fd36505dc8c731f1a9a634175b2e2d5d7b615aa34ba935769bec089c718dd3",
      resultHash: "sha256:dd82e1908468dcf2af52218cc0c3dca4f07466994683f3b1eec105ff5aee529c",
      bandDraws: [
        {
          bandId: "band-syn-access",
          seats: 1,
          eligibleCount: 2,
          ranking: ["applicant-syn-ada", "applicant-syn-beck"],
          offeredApplicationIds: ["applicant-syn-ada"],
        },
        {
          bandId: "band-syn-middle",
          seats: 1,
          eligibleCount: 2,
          ranking: ["applicant-syn-curie", "applicant-syn-darwin"],
          offeredApplicationIds: ["applicant-syn-curie"],
        },
        {
          bandId: "band-syn-broad",
          seats: 1,
          eligibleCount: 2,
          ranking: ["applicant-syn-faraday", "applicant-syn-euler"],
          offeredApplicationIds: ["applicant-syn-faraday"],
        },
      ],
    });
    expect(
      draw.allocations.map(({ applicationId, bandId, rank, outcome }) => ({
        applicationId,
        bandId,
        rank,
        outcome,
      })),
    ).toEqual([
      {
        applicationId: "applicant-syn-ada",
        bandId: "band-syn-access",
        rank: 1,
        outcome: "offered",
      },
      {
        applicationId: "applicant-syn-beck",
        bandId: "band-syn-access",
        rank: 2,
        outcome: "not_offered",
      },
      {
        applicationId: "applicant-syn-curie",
        bandId: "band-syn-middle",
        rank: 1,
        outcome: "offered",
      },
      {
        applicationId: "applicant-syn-darwin",
        bandId: "band-syn-middle",
        rank: 2,
        outcome: "not_offered",
      },
      {
        applicationId: "applicant-syn-euler",
        bandId: "band-syn-broad",
        rank: 2,
        outcome: "not_offered",
      },
      {
        applicationId: "applicant-syn-faraday",
        bandId: "band-syn-broad",
        rank: 1,
        outcome: "offered",
      },
    ]);
    expect(Object.isFrozen(draw)).toBe(true);
    expect(Object.isFrozen(draw.allocations)).toBe(true);
  });

  it("replays byte-for-byte and normalizes eligible-pool order", () => {
    const input = goldenInput();
    const draw = runIncomeBandedLottery(input);
    const reordered = runIncomeBandedLottery({
      ...input,
      eligiblePool: [...input.eligiblePool].reverse(),
    });
    const replayed = replayIncomeBandedLottery(draw);

    expect(reordered).toEqual(draw);
    expect(replayed).toEqual(draw);
    expect(canonicalize(replayed)).toBe(canonicalize(draw));
  });

  it("uses finance only in allocation while keeping eligibility income-free and unchanged", () => {
    type ProhibitedEligibilityKey = Extract<
      keyof TrackBAllocationEligibility,
      "address" | "householdIncome" | "householdSize" | "researchConsent" | "zipCode"
    >;
    expectTypeOf<ProhibitedEligibilityKey>().toEqualTypeOf<never>();

    const clean = goldenInput();
    const injected = {
      ...clean,
      eligiblePool: clean.eligiblePool.map((applicant, index) =>
        index === 0
          ? {
              ...applicant,
              eligibility: {
                ...applicant.eligibility,
                householdIncome: 1,
                householdSize: 99,
                researchConsent: false,
              } as TrackBAllocationEligibility,
            }
          : applicant,
      ),
    };
    expect(runIncomeBandedLottery(injected)).toEqual(runIncomeBandedLottery(clean));

    const movedByFinance = runIncomeBandedLottery({
      ...clean,
      eligiblePool: clean.eligiblePool.map((applicant, index) =>
        index === 0 ? { ...applicant, financeFixtureId: "finance-syn-h2-180k" } : applicant,
      ),
    });
    const original = runIncomeBandedLottery(clean);
    expect(movedByFinance.allocations[0]).toMatchObject({
      applicationId: "applicant-syn-ada",
      bandId: "band-syn-broad",
      eligibilityResultHash: original.allocations[0]!.eligibilityResultHash,
    });
  });

  it("rejects ineligible applicants, non-synthetic inputs, and unknown finance fixtures", () => {
    const input = goldenInput();
    expect(() =>
      runIncomeBandedLottery({
        ...input,
        eligiblePool: [
          {
            ...input.eligiblePool[0]!,
            eligibility: {
              ...input.eligiblePool[0]!.eligibility,
              outcome: "does_not_currently_qualify",
            } as unknown as TrackBAllocationEligibility,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "VALIDATION_FAILED" }));
    expect(() =>
      runIncomeBandedLottery({
        ...input,
        eligiblePool: [{ ...input.eligiblePool[0]!, applicationId: "real-applicant" }],
      }),
    ).toThrowError(expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }));
    expect(() => runIncomeBandedLottery({ ...input, seed: "live-seed" })).toThrowError(
      expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }),
    );
    expect(() =>
      runIncomeBandedLottery({
        ...input,
        policy: { ...input.policy, humanOwnerId: "internal-owner" },
      }),
    ).toThrowError(expect.objectContaining({ code: "NON_SYNTHETIC_INPUT" }));
    expect(() =>
      runIncomeBandedLottery({
        ...input,
        eligiblePool: [
          {
            ...input.eligiblePool[0]!,
            financeFixtureId: "finance-syn-unknown" as SyntheticFinanceFixtureId,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "FIXTURE_NOT_ALLOWLISTED" }));
  });

  it("rejects malformed band and seat policy instead of producing a partial draw", () => {
    const input = goldenInput();
    const malformedPolicy = {
      ...SYNTHETIC_ALLOCATION_POLICY_V1,
      bands: [
        { ...SYNTHETIC_ALLOCATION_POLICY_V1.bands[0], seatCount: -1 },
        {
          ...SYNTHETIC_ALLOCATION_POLICY_V1.bands[1],
          bandId: SYNTHETIC_ALLOCATION_POLICY_V1.bands[0]!.bandId,
        },
        SYNTHETIC_ALLOCATION_POLICY_V1.bands[2],
      ],
    } as SyntheticAllocationPolicy;

    expect(() => runIncomeBandedLottery({ ...input, policy: malformedPolicy })).toThrowError(
      expect.objectContaining({ code: "VALIDATION_FAILED" }),
    );
  });

  it("detects retained policy, input, and result tampering before replay", () => {
    const draw = runIncomeBandedLottery(goldenInput());
    const changedPolicy = {
      ...draw,
      policy: { ...draw.policy, taxYear: draw.policy.taxYear - 1 },
    } as typeof draw;
    const changedInput = {
      ...draw,
      retainedInputs: { ...draw.retainedInputs, seed: `${draw.retainedInputs.seed}-changed` },
    } as typeof draw;
    const changedResult = {
      ...draw,
      allocations: draw.allocations.map((allocation, index) =>
        index === 0 ? { ...allocation, outcome: "not_offered" as const } : allocation,
      ),
    } as typeof draw;

    expect(() => replayIncomeBandedLottery(changedPolicy)).toThrowError(
      expect.objectContaining({ code: "POLICY_HASH_MISMATCH" }),
    );
    expect(() => replayIncomeBandedLottery(changedInput)).toThrowError(
      expect.objectContaining({ code: "INPUT_HASH_MISMATCH" }),
    );
    expect(() => replayIncomeBandedLottery(changedResult)).toThrowError(
      expect.objectContaining({ code: "INPUT_HASH_MISMATCH" }),
    );
  });
});
