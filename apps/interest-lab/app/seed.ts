import { buildLab } from "@gt100k/interest-lab";
import {
  type BuildInterestLabViewOptions,
  type DeviceCaps,
  buildInterestLabView,
} from "@gt100k/interest-lab-view";
import { CATALOG_GOLDEN_V1 } from "@gt100k/interest-probe-catalog";

const SYNTHETIC_LEARNER_REF = "synthetic-interest-lab-preview";

export interface SyntheticInterestLabSeedOptions {
  ageBand?: BuildInterestLabViewOptions["ageBand"];
  reducedMotion?: boolean;
  plainMode?: boolean;
  deviceCaps?: DeviceCaps;
  history?: BuildInterestLabViewOptions["history"];
}

export function buildSyntheticInterestLabSeed(
  options: Readonly<SyntheticInterestLabSeedOptions> = {},
) {
  const lab = buildLab(
    SYNTHETIC_LEARNER_REF,
    CATALOG_GOLDEN_V1,
    { metPrereqs: [], engagedDomains: [] },
    { seed: 42 },
  );
  const view = buildInterestLabView({
    lab,
    options: {
      surface: "child",
      ageBand: options.ageBand ?? "9-11",
      reducedMotion: options.reducedMotion ?? false,
      plainMode: options.plainMode ?? false,
      deviceCaps: options.deviceCaps ?? { webglAvailable: false },
      history: options.history ?? [],
    },
  });

  return {
    kind: "synthetic" as const,
    lab,
    view,
  };
}
