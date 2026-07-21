import type { CohortBase, CooperativeMissionResult } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type ApplyCohortContribution = (
  base: CohortBase,
  missionResult: CooperativeMissionResult,
) => CohortBase;

const applyCohortContribution = (
  arenaWorld as typeof arenaWorld & {
    applyCohortContribution?: ApplyCohortContribution;
  }
).applyCohortContribution;

const GOLDEN_SEQUENCE = [
  { missionId: "m1", feature: "campfire", by: "kestrel" },
  { missionId: "m2", feature: "banner", by: "otter" },
  { missionId: "m3", feature: "garden", by: "kestrel" },
] as const satisfies readonly CooperativeMissionResult[];

describe("applyCohortContribution", () => {
  it("matches the exact three-mission cohort-base sequence and replay", () => {
    expect(applyCohortContribution).toBeTypeOf("function");
    if (!applyCohortContribution) return;

    const first = replayGoldenSequence(applyCohortContribution);
    const second = replayGoldenSequence(applyCohortContribution);

    expect(first).toEqual({
      cohortRef: "cohort-synthetic-six",
      contributions: GOLDEN_SEQUENCE,
      unlockedFeatures: ["campfire", "banner", "garden"],
    });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
  });

  it("preserves the append-only contribution history and distinct feature order", () => {
    expect(applyCohortContribution).toBeTypeOf("function");
    if (!applyCohortContribution) return;

    const base: CohortBase = {
      cohortRef: "cohort-synthetic-six",
      contributions: [{ missionId: "m0", feature: "dock", by: "finch" }],
      unlockedFeatures: ["dock"],
    };
    Object.freeze(base.contributions[0]);
    Object.freeze(base.contributions);
    Object.freeze(base.unlockedFeatures);
    Object.freeze(base);

    const afterFirst = applyCohortContribution(base, {
      missionId: "m1",
      feature: "campfire",
      by: "kestrel",
    });
    const afterDuplicate = applyCohortContribution(afterFirst, {
      missionId: "m2",
      feature: "campfire",
      by: "otter",
    });

    expect(afterDuplicate).toEqual({
      cohortRef: "cohort-synthetic-six",
      contributions: [
        { missionId: "m0", feature: "dock", by: "finch" },
        { missionId: "m1", feature: "campfire", by: "kestrel" },
        { missionId: "m2", feature: "campfire", by: "otter" },
      ],
      unlockedFeatures: ["dock", "campfire"],
    });
    expect(base).toEqual({
      cohortRef: "cohort-synthetic-six",
      contributions: [{ missionId: "m0", feature: "dock", by: "finch" }],
      unlockedFeatures: ["dock"],
    });
  });

  it("keeps cohort-base state structurally unable to confer gameplay power", () => {
    expect(applyCohortContribution).toBeTypeOf("function");
    if (!applyCohortContribution) return;

    const result = applyCohortContribution(emptyBase(), GOLDEN_SEQUENCE[0]);

    expect(applyCohortContribution).toHaveLength(2);
    expect(Object.keys(result)).toEqual(["cohortRef", "contributions", "unlockedFeatures"]);
    expectTypeOf(applyCohortContribution).parameters.toEqualTypeOf<
      [base: CohortBase, missionResult: CooperativeMissionResult]
    >();
    expectTypeOf<keyof CohortBase>().toEqualTypeOf<
      "cohortRef" | "contributions" | "unlockedFeatures"
    >();
  });
});

function emptyBase(): CohortBase {
  return {
    cohortRef: "cohort-synthetic-six",
    contributions: [],
    unlockedFeatures: [],
  };
}

function replayGoldenSequence(apply: ApplyCohortContribution): CohortBase {
  return GOLDEN_SEQUENCE.reduce((base, missionResult) => apply(base, missionResult), emptyBase());
}
