import {
  ALLOCATION_CONTRACT_VERSION,
  type IncomeBandedLotteryOutcome,
  SYNTHETIC_FINANCE_FIXTURES,
  type SyntheticAllocationPolicy,
  type SyntheticFinanceFixture,
  type SyntheticFinanceFixtureId,
  type SyntheticIncomeBand,
} from "../../admissions-contracts/src/allocation.js";
import {
  type Sha256ContentHash,
  canonicalize,
  sha256ContentHash,
} from "../../admissions-contracts/src/hash.js";

export interface TrackBAllocationEligibility {
  readonly outcome: "qualifies";
  readonly workflowStatus: "track_b_eligible";
  readonly resultHash: Sha256ContentHash;
}

export interface IncomeBandedLotteryApplicantInput {
  readonly applicationId: string;
  readonly eligibility: TrackBAllocationEligibility;
  readonly financeFixtureId: SyntheticFinanceFixtureId;
}

export interface IncomeBandedLotteryInput {
  readonly cycleId: string;
  readonly seed: string;
  readonly policy: SyntheticAllocationPolicy;
  readonly eligiblePool: readonly IncomeBandedLotteryApplicantInput[];
}

export interface RetainedLotteryApplicant {
  readonly applicationId: string;
  readonly eligibility: TrackBAllocationEligibility;
  readonly finance: SyntheticFinanceFixture;
}

export interface RetainedLotteryInputs {
  readonly cycleId: string;
  readonly seed: string;
  readonly eligiblePool: readonly RetainedLotteryApplicant[];
}

export interface IncomeBandDraw {
  readonly bandId: string;
  readonly seats: number;
  readonly eligibleCount: number;
  readonly ranking: readonly string[];
  readonly offeredApplicationIds: readonly string[];
}

export interface ApplicantAllocation {
  readonly applicationId: string;
  readonly eligibilityResultHash: Sha256ContentHash;
  readonly financeFixtureId: SyntheticFinanceFixtureId;
  readonly bandId: string;
  readonly rank: number;
  readonly outcome: IncomeBandedLotteryOutcome;
}

export interface LockedIncomeBandedLotteryDraw {
  readonly contractVersion: typeof ALLOCATION_CONTRACT_VERSION;
  readonly drawId: string;
  readonly locked: true;
  readonly policy: SyntheticAllocationPolicy;
  readonly policyHash: Sha256ContentHash;
  readonly retainedInputs: RetainedLotteryInputs;
  readonly inputHash: Sha256ContentHash;
  readonly bandDraws: readonly IncomeBandDraw[];
  readonly allocations: readonly ApplicantAllocation[];
  readonly resultHash: Sha256ContentHash;
}

export class LotteryAllocationError extends Error {
  readonly code:
    | "FIXTURE_NOT_ALLOWLISTED"
    | "INPUT_HASH_MISMATCH"
    | "NON_SYNTHETIC_INPUT"
    | "POLICY_HASH_MISMATCH"
    | "VALIDATION_FAILED";

  constructor(code: LotteryAllocationError["code"]) {
    super(code);
    this.name = "LotteryAllocationError";
    this.code = code;
  }
}

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function detachedSnapshot<Value>(value: Value): Value {
  return deepFreeze(JSON.parse(canonicalize(value)) as Value);
}

function assertSyntheticId(value: string): void {
  if (!value.includes("-syn-") || value.trim() !== value) {
    throw new LotteryAllocationError("NON_SYNTHETIC_INPUT");
  }
}

function assertPolicy(policy: SyntheticAllocationPolicy): void {
  assertSyntheticId(policy.policyBundleId);
  assertSyntheticId(policy.humanOwnerId);
  if (
    policy.currency !== "USD" ||
    !Number.isInteger(policy.taxYear) ||
    policy.bands.length === 0 ||
    policy.humanOwnerId.trim().length === 0 ||
    !Number.isFinite(Date.parse(policy.decisionExpiresAt))
  ) {
    throw new LotteryAllocationError("VALIDATION_FAILED");
  }

  const bandIds = new Set<string>();
  const householdSizes = policy.bands[0]!.maximumAnnualIncomeCentsByHouseholdSize.map(
    ({ householdSize }) => householdSize,
  );
  if (
    householdSizes.length === 0 ||
    new Set(householdSizes).size !== householdSizes.length ||
    householdSizes.some((size) => !Number.isInteger(size) || size < 1)
  ) {
    throw new LotteryAllocationError("VALIDATION_FAILED");
  }

  for (const band of policy.bands) {
    if (
      bandIds.has(band.bandId) ||
      !band.bandId.includes("-syn-") ||
      !Number.isInteger(band.seatCount) ||
      band.seatCount < 0 ||
      band.maximumAnnualIncomeCentsByHouseholdSize.length !== householdSizes.length
    ) {
      throw new LotteryAllocationError("VALIDATION_FAILED");
    }
    bandIds.add(band.bandId);
    const bandSizes = band.maximumAnnualIncomeCentsByHouseholdSize.map(
      ({ householdSize }) => householdSize,
    );
    if (
      new Set(bandSizes).size !== bandSizes.length ||
      householdSizes.some((size) => !bandSizes.includes(size))
    ) {
      throw new LotteryAllocationError("VALIDATION_FAILED");
    }
  }

  for (const householdSize of householdSizes) {
    let previousMaximum = -1;
    policy.bands.forEach((band, index) => {
      const maximum = band.maximumAnnualIncomeCentsByHouseholdSize.find(
        (candidate) => candidate.householdSize === householdSize,
      )!.maximumAnnualIncomeCents;
      const isLastBand = index === policy.bands.length - 1;
      if (
        (isLastBand && maximum !== null) ||
        (!isLastBand &&
          (maximum === null ||
            !Number.isInteger(maximum) ||
            maximum < 0 ||
            maximum <= previousMaximum))
      ) {
        throw new LotteryAllocationError("VALIDATION_FAILED");
      }
      if (maximum !== null) previousMaximum = maximum;
    });
  }
}

function fixtureById(fixtureId: SyntheticFinanceFixtureId): SyntheticFinanceFixture {
  const fixture = SYNTHETIC_FINANCE_FIXTURES.find((candidate) => candidate.fixtureId === fixtureId);
  if (!fixture) throw new LotteryAllocationError("FIXTURE_NOT_ALLOWLISTED");
  return fixture;
}

function bandFor(
  finance: SyntheticFinanceFixture,
  bands: readonly SyntheticIncomeBand[],
): SyntheticIncomeBand {
  for (const band of bands) {
    const threshold = band.maximumAnnualIncomeCentsByHouseholdSize.find(
      ({ householdSize }) => householdSize === finance.householdSize,
    );
    if (
      threshold &&
      (threshold.maximumAnnualIncomeCents === null ||
        finance.annualHouseholdIncomeCents <= threshold.maximumAnnualIncomeCents)
    ) {
      return band;
    }
  }
  throw new LotteryAllocationError("VALIDATION_FAILED");
}

function retainedInputs(input: IncomeBandedLotteryInput): RetainedLotteryInputs {
  assertSyntheticId(input.cycleId);
  assertSyntheticId(input.seed);
  const seen = new Set<string>();
  const eligiblePool = [...input.eligiblePool]
    .map(({ applicationId, eligibility, financeFixtureId }) => {
      assertSyntheticId(applicationId);
      if (
        seen.has(applicationId) ||
        eligibility.outcome !== "qualifies" ||
        eligibility.workflowStatus !== "track_b_eligible" ||
        !/^sha256:[a-f0-9]{64}$/.test(eligibility.resultHash)
      ) {
        throw new LotteryAllocationError("VALIDATION_FAILED");
      }
      seen.add(applicationId);
      return {
        applicationId,
        eligibility: {
          outcome: eligibility.outcome,
          workflowStatus: eligibility.workflowStatus,
          resultHash: eligibility.resultHash,
        },
        finance: fixtureById(financeFixtureId),
      };
    })
    .sort((left, right) => left.applicationId.localeCompare(right.applicationId));
  return detachedSnapshot({ cycleId: input.cycleId, seed: input.seed, eligiblePool });
}

function assertRetainedInputs(
  retained: RetainedLotteryInputs,
  policy: SyntheticAllocationPolicy,
): void {
  assertSyntheticId(retained.cycleId);
  assertSyntheticId(retained.seed);
  const seen = new Set<string>();
  for (const applicant of retained.eligiblePool) {
    assertSyntheticId(applicant.applicationId);
    const fixture = fixtureById(applicant.finance.fixtureId as SyntheticFinanceFixtureId);
    if (
      seen.has(applicant.applicationId) ||
      applicant.eligibility.outcome !== "qualifies" ||
      applicant.eligibility.workflowStatus !== "track_b_eligible" ||
      !/^sha256:[a-f0-9]{64}$/.test(applicant.eligibility.resultHash) ||
      canonicalize(applicant.finance) !== canonicalize(fixture) ||
      applicant.finance.currency !== policy.currency ||
      applicant.finance.taxYear !== policy.taxYear
    ) {
      throw new LotteryAllocationError("INPUT_HASH_MISMATCH");
    }
    seen.add(applicant.applicationId);
  }
}

function resultContent(
  draw: Pick<
    LockedIncomeBandedLotteryDraw,
    "allocations" | "bandDraws" | "drawId" | "inputHash" | "locked" | "policyHash"
  >,
): object {
  return {
    allocations: draw.allocations,
    bandDraws: draw.bandDraws,
    contractVersion: ALLOCATION_CONTRACT_VERSION,
    drawId: draw.drawId,
    inputHash: draw.inputHash,
    locked: draw.locked,
    policyHash: draw.policyHash,
  };
}

function buildLockedDraw(
  policy: SyntheticAllocationPolicy,
  retained: RetainedLotteryInputs,
): LockedIncomeBandedLotteryDraw {
  assertPolicy(policy);
  assertRetainedInputs(retained, policy);
  const policyHash = sha256ContentHash({ contractVersion: ALLOCATION_CONTRACT_VERSION, policy });
  const inputHash = sha256ContentHash({
    contractVersion: ALLOCATION_CONTRACT_VERSION,
    retainedInputs: retained,
  });

  const bandsByApplicant = new Map(
    retained.eligiblePool.map((applicant) => [
      applicant.applicationId,
      bandFor(applicant.finance, policy.bands),
    ]),
  );
  const bandDraws = policy.bands.map((band): IncomeBandDraw => {
    const ranked = retained.eligiblePool
      .filter((applicant) => bandsByApplicant.get(applicant.applicationId)?.bandId === band.bandId)
      .map((applicant) => ({
        applicationId: applicant.applicationId,
        rankHash: sha256ContentHash({
          applicationId: applicant.applicationId,
          bandId: band.bandId,
          contractVersion: ALLOCATION_CONTRACT_VERSION,
          cycleId: retained.cycleId,
          eligibilityResultHash: applicant.eligibility.resultHash,
          policyBundleId: policy.policyBundleId,
          seed: retained.seed,
        }),
      }))
      .sort(
        (left, right) =>
          left.rankHash.localeCompare(right.rankHash) ||
          left.applicationId.localeCompare(right.applicationId),
      );
    const ranking = ranked.map(({ applicationId }) => applicationId);
    return {
      bandId: band.bandId,
      seats: band.seatCount,
      eligibleCount: ranking.length,
      ranking,
      offeredApplicationIds: ranking.slice(0, band.seatCount),
    };
  });

  const allocations = retained.eligiblePool.map((applicant): ApplicantAllocation => {
    const band = bandsByApplicant.get(applicant.applicationId)!;
    const draw = bandDraws.find(({ bandId }) => bandId === band.bandId)!;
    const rank = draw.ranking.indexOf(applicant.applicationId) + 1;
    return {
      applicationId: applicant.applicationId,
      eligibilityResultHash: applicant.eligibility.resultHash,
      financeFixtureId: applicant.finance.fixtureId as SyntheticFinanceFixtureId,
      bandId: band.bandId,
      rank,
      outcome: rank <= draw.seats ? "offered" : "not_offered",
    };
  });
  const drawId = `${retained.cycleId}:${policy.policyBundleId}:draw`;
  const locked = true as const;
  const resultHash = sha256ContentHash(
    resultContent({
      allocations,
      bandDraws,
      drawId,
      inputHash,
      locked,
      policyHash,
    }),
  );
  return deepFreeze({
    contractVersion: ALLOCATION_CONTRACT_VERSION,
    drawId,
    locked,
    policy,
    policyHash,
    retainedInputs: retained,
    inputHash,
    bandDraws,
    allocations,
    resultHash,
  });
}

export function runIncomeBandedLottery(
  input: IncomeBandedLotteryInput,
): LockedIncomeBandedLotteryDraw {
  assertPolicy(input.policy);
  return buildLockedDraw(detachedSnapshot(input.policy), retainedInputs(input));
}

export function replayIncomeBandedLottery(
  draw: LockedIncomeBandedLotteryDraw,
): LockedIncomeBandedLotteryDraw {
  if (draw.contractVersion !== ALLOCATION_CONTRACT_VERSION || draw.locked !== true) {
    throw new LotteryAllocationError("VALIDATION_FAILED");
  }
  const policyHash = sha256ContentHash({
    contractVersion: ALLOCATION_CONTRACT_VERSION,
    policy: draw.policy,
  });
  if (policyHash !== draw.policyHash) {
    throw new LotteryAllocationError("POLICY_HASH_MISMATCH");
  }
  const inputHash = sha256ContentHash({
    contractVersion: ALLOCATION_CONTRACT_VERSION,
    retainedInputs: draw.retainedInputs,
  });
  if (inputHash !== draw.inputHash || sha256ContentHash(resultContent(draw)) !== draw.resultHash) {
    throw new LotteryAllocationError("INPUT_HASH_MISMATCH");
  }

  const replayed = buildLockedDraw(
    detachedSnapshot(draw.policy),
    detachedSnapshot(draw.retainedInputs),
  );
  if (replayed.resultHash !== draw.resultHash) {
    throw new LotteryAllocationError("INPUT_HASH_MISMATCH");
  }
  return replayed;
}
