import type { LabConfig, ProbeFamily } from "@gt100k/interest-lab";
import { artStub } from "./art";
import { codeStub } from "./code";
import { musicStub } from "./music";

export const V1_DOMAIN_ORDER = ["sound_music", "symbols_math", "visual_design"] as const;

export const STUB_ZONES = [musicStub, codeStub, artStub] as const;

export const STUB_MANIFESTS = STUB_ZONES.map(({ id, domain, mapBuilding }) => ({
  id,
  domain,
  mapBuilding,
}));

export const STUB_ZONE_CATALOG_V1: ProbeFamily[] = STUB_ZONES.flatMap(({ probes }) =>
  probes.map((probe) => ({ familyId: probe.familyId, variants: [probe] })),
);

export const ZONE_LAB_CONFIG_V1: LabConfig = {
  cohort: "interest-lab-v1",
  probeCountTarget: 9,
  probeCountRange: { min: 9, max: 9 },
  horizonWeeks: { min: 8, max: 12 },
  minDomains: 3,
  minWorkModes: 6,
  explorationFloor: 0,
  seed: 42,
};
