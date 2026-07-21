import type { CohortBase, CooperativeMissionResult } from "./model";

export function applyCohortContribution(
  base: CohortBase,
  missionResult: CooperativeMissionResult,
): CohortBase {
  const contributions = [
    ...base.contributions.map((contribution) => ({ ...contribution })),
    { ...missionResult },
  ];

  return {
    cohortRef: base.cohortRef,
    contributions,
    unlockedFeatures: [...new Set(contributions.map(({ feature }) => feature))],
  };
}
