import {
  FIXTURE,
  type NodeMasterySignal,
  type ProgressionState,
  type QuestWorld,
  TIERS,
  type Tier,
  buildQuestWorld,
  createSyntheticMasteryFeed,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

type TierForReward = (reward: number, tierTable: readonly Tier[]) => Tier;
type ComputeProgression = (
  world: QuestWorld,
  signals: readonly NodeMasterySignal[],
  tierTable: readonly Tier[],
  previousReward?: number,
) => ProgressionState;

const tierForReward = (arenaWorld as typeof arenaWorld & { tierForReward?: TierForReward })
  .tierForReward;
const computeProgression = (
  arenaWorld as typeof arenaWorld & { computeProgression?: ComputeProgression }
).computeProgression;

const world = buildQuestWorld(FIXTURE);
const signals = createSyntheticMasteryFeed();

describe("tierForReward", () => {
  it("uses the highest inclusive reward threshold at every golden boundary", () => {
    expect(tierForReward).toBeTypeOf("function");
    if (!tierForReward) return;

    expect(
      [99, 100, 249, 250, 500, 899, 900, 1500].map((reward) => tierForReward(reward, TIERS).index),
    ).toEqual([0, 1, 1, 2, 3, 3, 4, 5]);
  });
});

describe("computeProgression", () => {
  it("matches the exact S1 progression state", () => {
    expect(computeProgression).toBeTypeOf("function");
    if (!computeProgression) return;

    expect(computeProgression(world, signals, TIERS)).toEqual({
      cumulativeIndependenceReward: 300,
      masteredCount: 4,
      regionsComplete: ["tinker-bluffs"],
      tier: TIERS[2],
      growthVsPast: { previous: 0, current: 300, delta: 300 },
    });
  });

  it("uses the supplied personal baseline and replays byte-identically", () => {
    expect(computeProgression).toBeTypeOf("function");
    if (!computeProgression) return;

    const first = computeProgression(world, signals, TIERS, 240);
    const second = computeProgression(world, signals, TIERS, 240);

    expect(first.growthVsPast).toEqual({ previous: 240, current: 300, delta: 60 });
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).not.toBe(second);
  });
});
