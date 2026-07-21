import { buildCoverageMatrix } from "./coverage";
import type { CoverageMatrix } from "./hypothesis";
import type {
  AudienceCondition,
  DifficultyBand,
  Domain,
  Probe,
  ProbeFamily,
  Provenance,
  SocialMode,
  WorkMode,
} from "./probe";

export interface LabConfig {
  cohort: string;
  probeCountTarget: number;
  probeCountRange: {
    min: number;
    max: number;
  };
  horizonWeeks: {
    min: number;
    max: number;
  };
  minDomains: number;
  minWorkModes: number;
  explorationFloor: number;
  seed: number;
}

export const DEFAULT_LAB_CONFIG: LabConfig = {
  cohort: "standard",
  probeCountTarget: 20,
  probeCountRange: { min: 18, max: 24 },
  horizonWeeks: { min: 8, max: 12 },
  minDomains: 6,
  minWorkModes: 6,
  explorationFloor: 4,
  seed: 42,
};

export interface LearnerEligibility {
  metPrereqs: readonly string[];
  engagedDomains: readonly Domain[];
}

export interface Offer {
  probeId: string;
  familyId: string;
  domain: Domain;
  workMode: WorkMode;
  difficulty: DifficultyBand;
  social: SocialMode;
  audience: AudienceCondition;
  provenance: Provenance;
  reason: string;
  eligible: true;
}

export interface Lab {
  learnerRef: string;
  offers: Offer[];
  coverage: CoverageMatrix;
  explorationReserved: number;
  choicePointsMinEligible: number;
  config: LabConfig;
}

const isEligible = (probe: Probe, metPrereqs: ReadonlySet<string>): boolean =>
  probe.safetyClass === "cleared" &&
  probe.prerequisites.every((prerequisite) => metPrereqs.has(prerequisite));

const toOffer = (probe: Probe): Offer => ({
  probeId: probe.id,
  familyId: probe.familyId,
  domain: probe.domain,
  workMode: probe.workMode,
  difficulty: probe.difficulty,
  social: probe.social,
  audience: probe.audience,
  provenance: "RULE",
  reason: "Balances domain and work-mode coverage while preserving exploration.",
  eligible: true,
});

export const buildLab = (
  learnerRef: string,
  catalogView: readonly ProbeFamily[],
  eligibility: LearnerEligibility,
  overrides: Partial<LabConfig> = {},
): Lab => {
  const config = { ...DEFAULT_LAB_CONFIG, ...overrides };
  const metPrereqs = new Set(eligibility.metPrereqs);
  const engagedDomains = new Set(eligibility.engagedDomains);
  const selectionLimit = Math.min(config.probeCountTarget, config.probeCountRange.max);

  const offers = catalogView
    .map((family) => family.variants.find((probe) => isEligible(probe, metPrereqs)))
    .filter((probe): probe is Probe => probe !== undefined)
    .slice(0, selectionLimit)
    .map(toOffer);

  return {
    learnerRef,
    offers,
    coverage: buildCoverageMatrix(offers, config),
    explorationReserved: offers.filter(({ domain }) => !engagedDomains.has(domain)).length,
    choicePointsMinEligible: offers.length,
    config,
  };
};
