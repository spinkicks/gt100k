export const ALLOCATION_CONTRACT_VERSION = "AL-SYN-01" as const;
export const FINANCE_FIXTURE_CATALOG_VERSION = "FI-SYN-01" as const;

export type IncomeBandedLotteryOutcome = "not_offered" | "offered";

export interface HouseholdSizeIncomeMaximum {
  readonly householdSize: number;
  readonly maximumAnnualIncomeCents: number | null;
}

export interface SyntheticIncomeBand {
  readonly bandId: string;
  readonly seatCount: number;
  readonly maximumAnnualIncomeCentsByHouseholdSize: readonly HouseholdSizeIncomeMaximum[];
}

export interface SyntheticAllocationPolicy {
  readonly policyBundleId: string;
  readonly currency: "USD";
  readonly taxYear: number;
  readonly bands: readonly SyntheticIncomeBand[];
  readonly humanOwnerId: string;
  readonly decisionExpiresAt: string;
}

export interface SyntheticFinanceFixture {
  readonly fixtureId: string;
  readonly catalogVersion: typeof FINANCE_FIXTURE_CATALOG_VERSION;
  readonly synthetic: true;
  readonly currency: "USD";
  readonly taxYear: number;
  readonly annualHouseholdIncomeCents: number;
  readonly householdSize: number;
}

const accessBand = Object.freeze({
  bandId: "band-syn-access",
  seatCount: 1,
  maximumAnnualIncomeCentsByHouseholdSize: Object.freeze([
    Object.freeze({ householdSize: 2, maximumAnnualIncomeCents: 6_500_000 }),
    Object.freeze({ householdSize: 4, maximumAnnualIncomeCents: 9_500_000 }),
  ]),
});

const middleBand = Object.freeze({
  bandId: "band-syn-middle",
  seatCount: 1,
  maximumAnnualIncomeCentsByHouseholdSize: Object.freeze([
    Object.freeze({ householdSize: 2, maximumAnnualIncomeCents: 12_000_000 }),
    Object.freeze({ householdSize: 4, maximumAnnualIncomeCents: 16_000_000 }),
  ]),
});

const broadBand = Object.freeze({
  bandId: "band-syn-broad",
  seatCount: 1,
  maximumAnnualIncomeCentsByHouseholdSize: Object.freeze([
    Object.freeze({ householdSize: 2, maximumAnnualIncomeCents: null }),
    Object.freeze({ householdSize: 4, maximumAnnualIncomeCents: null }),
  ]),
});

export const SYNTHETIC_ALLOCATION_POLICY_V1 = Object.freeze({
  policyBundleId: "admissions-allocation-syn-v1",
  currency: "USD",
  taxYear: 2026,
  bands: Object.freeze([accessBand, middleBand, broadBand]),
  humanOwnerId: "allocation-owner-syn-01",
  decisionExpiresAt: "2026-12-31T23:59:59.999Z",
} as const satisfies SyntheticAllocationPolicy);

export const SYNTHETIC_FINANCE_FIXTURES = Object.freeze([
  Object.freeze({
    fixtureId: "finance-syn-h2-045k",
    catalogVersion: FINANCE_FIXTURE_CATALOG_VERSION,
    synthetic: true,
    currency: "USD",
    taxYear: 2026,
    annualHouseholdIncomeCents: 4_500_000,
    householdSize: 2,
  }),
  Object.freeze({
    fixtureId: "finance-syn-h4-090k",
    catalogVersion: FINANCE_FIXTURE_CATALOG_VERSION,
    synthetic: true,
    currency: "USD",
    taxYear: 2026,
    annualHouseholdIncomeCents: 9_000_000,
    householdSize: 4,
  }),
  Object.freeze({
    fixtureId: "finance-syn-h2-090k",
    catalogVersion: FINANCE_FIXTURE_CATALOG_VERSION,
    synthetic: true,
    currency: "USD",
    taxYear: 2026,
    annualHouseholdIncomeCents: 9_000_000,
    householdSize: 2,
  }),
  Object.freeze({
    fixtureId: "finance-syn-h4-140k",
    catalogVersion: FINANCE_FIXTURE_CATALOG_VERSION,
    synthetic: true,
    currency: "USD",
    taxYear: 2026,
    annualHouseholdIncomeCents: 14_000_000,
    householdSize: 4,
  }),
  Object.freeze({
    fixtureId: "finance-syn-h2-180k",
    catalogVersion: FINANCE_FIXTURE_CATALOG_VERSION,
    synthetic: true,
    currency: "USD",
    taxYear: 2026,
    annualHouseholdIncomeCents: 18_000_000,
    householdSize: 2,
  }),
  Object.freeze({
    fixtureId: "finance-syn-h4-220k",
    catalogVersion: FINANCE_FIXTURE_CATALOG_VERSION,
    synthetic: true,
    currency: "USD",
    taxYear: 2026,
    annualHouseholdIncomeCents: 22_000_000,
    householdSize: 4,
  }),
] as const satisfies readonly SyntheticFinanceFixture[]);

export type SyntheticFinanceFixtureId = (typeof SYNTHETIC_FINANCE_FIXTURES)[number]["fixtureId"];
