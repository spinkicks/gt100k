import { describe, expect, it } from "vitest";

import {
  ALLOCATION_CONTRACT_VERSION,
  FINANCE_FIXTURE_CATALOG_VERSION,
  SYNTHETIC_ALLOCATION_POLICY_V1,
  SYNTHETIC_FINANCE_FIXTURES,
} from "../src/allocation.js";

describe("synthetic allocation contract", () => {
  it("locks versioned household-size-adjusted bands and finance fixtures", () => {
    expect(ALLOCATION_CONTRACT_VERSION).toBe("AL-SYN-01");
    expect(FINANCE_FIXTURE_CATALOG_VERSION).toBe("FI-SYN-01");
    expect(SYNTHETIC_ALLOCATION_POLICY_V1).toMatchObject({
      policyBundleId: "admissions-allocation-syn-v1",
      currency: "USD",
      taxYear: 2026,
      bands: [
        {
          bandId: "band-syn-access",
          seatCount: 1,
          maximumAnnualIncomeCentsByHouseholdSize: [
            { householdSize: 2, maximumAnnualIncomeCents: 6_500_000 },
            { householdSize: 4, maximumAnnualIncomeCents: 9_500_000 },
          ],
        },
        {
          bandId: "band-syn-middle",
          seatCount: 1,
          maximumAnnualIncomeCentsByHouseholdSize: [
            { householdSize: 2, maximumAnnualIncomeCents: 12_000_000 },
            { householdSize: 4, maximumAnnualIncomeCents: 16_000_000 },
          ],
        },
        {
          bandId: "band-syn-broad",
          seatCount: 1,
          maximumAnnualIncomeCentsByHouseholdSize: [
            { householdSize: 2, maximumAnnualIncomeCents: null },
            { householdSize: 4, maximumAnnualIncomeCents: null },
          ],
        },
      ],
    });
    expect(SYNTHETIC_FINANCE_FIXTURES).toHaveLength(6);
    expect(SYNTHETIC_FINANCE_FIXTURES.every(({ synthetic }) => synthetic)).toBe(true);
    expect(Object.isFrozen(SYNTHETIC_ALLOCATION_POLICY_V1.bands[0])).toBe(true);
    expect(Object.isFrozen(SYNTHETIC_FINANCE_FIXTURES[0])).toBe(true);
  });
});
