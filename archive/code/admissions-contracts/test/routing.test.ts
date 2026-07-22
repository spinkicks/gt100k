import { describe, expect, expectTypeOf, it } from "vitest";

import {
  COGAT_INSTRUMENT,
  type RoutingPolicy,
  SYNTHETIC_ROUTING_POLICY_V1,
} from "../src/routing.js";

describe("synthetic CogAT routing contract", () => {
  it("locks visible fictional defaults without presenting them as GT policy", () => {
    expect(COGAT_INSTRUMENT).toBe("COGAT_SYNTHETIC");
    expect(SYNTHETIC_ROUTING_POLICY_V1).toEqual({
      policyBundleId: "admissions-routing-syn-v1",
      trackACutoff: 90,
      trackBPromisingBand: { minimumInclusive: 80, maximumExclusive: 90 },
      trackBStrongBatteryCutoff: 90,
    });
    expect(Object.isFrozen(SYNTHETIC_ROUTING_POLICY_V1)).toBe(true);
    expect(Object.isFrozen(SYNTHETIC_ROUTING_POLICY_V1.trackBPromisingBand)).toBe(true);
    expectTypeOf(SYNTHETIC_ROUTING_POLICY_V1).toMatchTypeOf<RoutingPolicy>();
  });
});
