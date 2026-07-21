import { readFileSync } from "node:fs";
import {
  FIXTURE,
  type NodeMasterySignal,
  buildQuestWorld,
  deriveNodeStates,
} from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type SyntheticMasteryFeedFactory = () => readonly NodeMasterySignal[];

const createSyntheticMasteryFeed = (
  arenaWorld as typeof arenaWorld & {
    createSyntheticMasteryFeed?: SyntheticMasteryFeedFactory;
  }
).createSyntheticMasteryFeed;

const S1_SIGNALS = [
  { nodeId: "count-cove", masteryCleared: true, independenceReward: 60 },
  { nodeId: "add-atoll", masteryCleared: true, independenceReward: 80 },
  { nodeId: "place-value-point", masteryCleared: false, independenceReward: 0 },
  { nodeId: "observe-overlook", masteryCleared: true, independenceReward: 50 },
  { nodeId: "measure-mesa", masteryCleared: true, independenceReward: 110 },
  { nodeId: "phoneme-falls", masteryCleared: false, independenceReward: 0 },
] satisfies NodeMasterySignal[];

describe("createSyntheticMasteryFeed", () => {
  it("reproduces scenario S1 exactly in stable declaration order", () => {
    expect(createSyntheticMasteryFeed).toBeTypeOf("function");
    if (!createSyntheticMasteryFeed) return;

    expect(createSyntheticMasteryFeed()).toEqual(S1_SIGNALS);
    expect(createSyntheticMasteryFeed).toHaveLength(0);
    expectTypeOf(createSyntheticMasteryFeed).returns.toEqualTypeOf<readonly NodeMasterySignal[]>();
  });

  it("advances through cumulative prefixes without invalid unlocks", () => {
    expect(createSyntheticMasteryFeed).toBeTypeOf("function");
    if (!createSyntheticMasteryFeed) return;

    const world = buildQuestWorld(FIXTURE);
    const feed = createSyntheticMasteryFeed();
    const unlockedByStep = feed.map((_, index) =>
      [...deriveNodeStates(world, feed.slice(0, index + 1))]
        .filter(([, state]) => state === "unlocked")
        .map(([nodeId]) => nodeId),
    );

    expect(unlockedByStep).toEqual([
      ["count-cove"],
      ["count-cove", "add-atoll"],
      ["count-cove", "add-atoll"],
      ["count-cove", "add-atoll", "observe-overlook"],
      ["count-cove", "add-atoll", "observe-overlook", "measure-mesa"],
      ["count-cove", "add-atoll", "observe-overlook", "measure-mesa"],
    ]);

    for (let index = 0; index < feed.length; index += 1) {
      const prefix = feed.slice(0, index + 1);
      const cleared = new Set(
        prefix.filter(({ masteryCleared }) => masteryCleared).map(({ nodeId }) => nodeId),
      );

      for (const node of world.nodes) {
        if (deriveNodeStates(world, prefix).get(node.id) !== "unlocked") continue;
        expect(cleared.has(node.id)).toBe(true);
        expect(node.prerequisites.every((nodeId) => cleared.has(nodeId))).toBe(true);
      }
    }
  });

  it("replays byte-identically without wall-clock or random input", () => {
    expect(createSyntheticMasteryFeed).toBeTypeOf("function");
    if (!createSyntheticMasteryFeed) return;

    expect(JSON.stringify(createSyntheticMasteryFeed())).toBe(
      JSON.stringify(createSyntheticMasteryFeed()),
    );
    expect(createSyntheticMasteryFeed()).not.toBe(createSyntheticMasteryFeed());

    const source = readFileSync(new URL("../src/feed.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/Math\.random|\bDate\b|performance\.now|setTimeout|setInterval/);
  });
});
