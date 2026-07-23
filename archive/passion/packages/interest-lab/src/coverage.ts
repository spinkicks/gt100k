import type { CoverageMatrix } from "./hypothesis";
import {
  type AudienceCondition,
  type DifficultyBand,
  type Domain,
  type SocialMode,
  WORK_MODES,
  type WorkMode,
} from "./probe";

export interface CoverageItem {
  domain: Domain;
  workMode: WorkMode;
  difficulty: DifficultyBand;
  social: SocialMode;
  audience: AudienceCondition;
}

export interface CoverageConfig {
  probeCountRange: {
    min: number;
    max: number;
  };
  minDomains: number;
  minWorkModes: number;
}

const presenceGaps = (checks: readonly (readonly [present: boolean, gap: string])[]): string[] =>
  checks.filter(([present]) => !present).map(([, gap]) => gap);

export const buildCoverageMatrix = (
  offers: readonly CoverageItem[],
  config: CoverageConfig,
): CoverageMatrix => {
  const probeCountGaps =
    offers.length < config.probeCountRange.min
      ? [`probe count ${offers.length} below minimum ${config.probeCountRange.min}`]
      : offers.length > config.probeCountRange.max
        ? [`probe count ${offers.length} above maximum ${config.probeCountRange.max}`]
        : [];

  const domainsHave = [...new Set(offers.map(({ domain }) => domain))];
  const domainGaps =
    domainsHave.length < config.minDomains
      ? [`only ${domainsHave.length} of ≥${config.minDomains} required domains`]
      : [];

  const offeredWorkModes = new Set(offers.map(({ workMode }) => workMode));
  const workModesHave = WORK_MODES.filter((workMode) => offeredWorkModes.has(workMode));
  const workModeGaps =
    workModesHave.length < config.minWorkModes
      ? [`only ${workModesHave.length} of ≥${config.minWorkModes} required work modes`]
      : [];

  const solo = offers.some(({ social }) => social === "solo");
  const group = offers.some(({ social }) => social === "group");
  const socialGaps = presenceGaps([
    [solo, "no solo probe"],
    [group, "no collaborative (group) probe"],
  ]);

  const foundational = offers.some(({ difficulty }) => difficulty === "foundational");
  const stretch = offers.some(({ difficulty }) => difficulty === "stretch");
  const difficultyGaps = presenceGaps([
    [foundational, "no foundational-band probe"],
    [stretch, "no stretch-band probe"],
  ]);

  const audience = offers.some((offer) => offer.audience === "audience");
  const noAudience = offers.some((offer) => offer.audience === "no_audience");
  const audienceGaps = presenceGaps([
    [audience, "no audience-condition probe"],
    [noAudience, "no no-audience-condition probe"],
  ]);

  const gaps = [
    ...probeCountGaps,
    ...domainGaps,
    ...workModeGaps,
    ...socialGaps,
    ...difficultyGaps,
    ...audienceGaps,
  ];

  return {
    probeCount: {
      met: probeCountGaps.length === 0,
      count: offers.length,
      need: config.probeCountRange.min,
    },
    domains: {
      met: domainGaps.length === 0,
      count: domainsHave.length,
      need: config.minDomains,
      have: domainsHave,
      gaps: domainGaps,
    },
    workModes: {
      met: workModeGaps.length === 0,
      count: workModesHave.length,
      need: config.minWorkModes,
      have: workModesHave,
      gaps: workModeGaps,
    },
    social: { met: socialGaps.length === 0, solo, group, gaps: socialGaps },
    difficulty: {
      met: difficultyGaps.length === 0,
      foundational,
      stretch,
      gaps: difficultyGaps,
    },
    audience: {
      met: audienceGaps.length === 0,
      audience,
      no_audience: noAudience,
      gaps: audienceGaps,
    },
    complete: gaps.length === 0,
    gaps,
  };
};
