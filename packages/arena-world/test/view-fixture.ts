import type { CohortBase } from "@gt100k/arena-world";

export function createSyntheticCohortBase(): CohortBase {
  return {
    cohortRef: "cohort-synthetic-six",
    contributions: [
      { missionId: "m1", feature: "campfire", by: "kestrel" },
      { missionId: "m2", feature: "banner", by: "otter" },
      { missionId: "m3", feature: "garden", by: "kestrel" },
    ],
    unlockedFeatures: ["campfire", "banner", "garden"],
  };
}
