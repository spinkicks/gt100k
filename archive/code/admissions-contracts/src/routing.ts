export const COGAT_INSTRUMENT = "COGAT_SYNTHETIC" as const;

export interface RoutingPolicy {
  readonly policyBundleId: string;
  readonly trackACutoff: number;
  readonly trackBPromisingBand: {
    readonly minimumInclusive: number;
    readonly maximumExclusive: number;
  };
  readonly trackBStrongBatteryCutoff: number;
}

export const SYNTHETIC_ROUTING_POLICY_V1: RoutingPolicy = Object.freeze({
  policyBundleId: "admissions-routing-syn-v1",
  trackACutoff: 90,
  trackBPromisingBand: Object.freeze({
    minimumInclusive: 80,
    maximumExclusive: 90,
  }),
  trackBStrongBatteryCutoff: 90,
});
