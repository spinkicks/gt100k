import { rotateBySeed, selectEligibleFamilyVariants } from "./catalog";
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

const coverageGain = (
  probe: Probe,
  selected: readonly Probe[],
  config: LabConfig,
  engagedDomains: ReadonlySet<Domain>,
): number => {
  const domains = new Set(selected.map(({ domain }) => domain));
  const workModes = new Set(selected.map(({ workMode }) => workMode));
  const socialModes = new Set(selected.map(({ social }) => social));
  const difficulties = new Set(selected.map(({ difficulty }) => difficulty));
  const audiences = new Set(selected.map(({ audience }) => audience));
  const dormantCount = selected.filter(({ domain }) => !engagedDomains.has(domain)).length;

  return (
    (domains.size < config.minDomains && !domains.has(probe.domain) ? 1 : 0) +
    (workModes.size < config.minWorkModes && !workModes.has(probe.workMode) ? 1 : 0) +
    (!socialModes.has(probe.social) ? 1 : 0) +
    (!difficulties.has(probe.difficulty) ? 1 : 0) +
    (!audiences.has(probe.audience) ? 1 : 0) +
    (dormantCount < config.explorationFloor && !engagedDomains.has(probe.domain) ? 1 : 0)
  );
};

/**
 * Surplus selection uses the spec-pinned fixed order: stable family-id sort,
 * then a seed rotation. At each step the candidate satisfying the most still-
 * unmet coverage dimensions wins; ties retain that fixed order.
 */
const selectCoverageGreedy = (
  candidates: readonly Probe[],
  selectionLimit: number,
  config: LabConfig,
  engagedDomains: ReadonlySet<Domain>,
): Probe[] => {
  const remaining = rotateBySeed(candidates, config.seed);
  const selected: Probe[] = [];

  while (selected.length < selectionLimit && remaining.length > 0) {
    let bestIndex = 0;
    let bestGain = -1;

    remaining.forEach((probe, index) => {
      const gain = coverageGain(probe, selected, config, engagedDomains);
      if (gain > bestGain) {
        bestGain = gain;
        bestIndex = index;
      }
    });

    selected.push(...remaining.splice(bestIndex, 1));
  }

  return selected;
};

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

  const eligible = selectEligibleFamilyVariants(catalogView, metPrereqs);
  const selected =
    eligible.length > selectionLimit
      ? selectCoverageGreedy(eligible, selectionLimit, config, engagedDomains)
      : eligible;
  const offers = selected.map(toOffer);

  return {
    learnerRef,
    offers,
    coverage: buildCoverageMatrix(offers, config),
    explorationReserved: offers.filter(({ domain }) => !engagedDomains.has(domain)).length,
    choicePointsMinEligible: offers.length,
    config,
  };
};
