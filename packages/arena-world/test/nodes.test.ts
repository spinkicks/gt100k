import {
  FIXTURE,
  type NodeMasterySignal,
  type QuestWorld,
  buildQuestWorld,
  deriveNodeStates,
} from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

const S1_SIGNALS = [
  { nodeId: "count-cove", masteryCleared: true, independenceReward: 60 },
  { nodeId: "add-atoll", masteryCleared: true, independenceReward: 80 },
  { nodeId: "place-value-point", masteryCleared: false, independenceReward: 0 },
  { nodeId: "observe-overlook", masteryCleared: true, independenceReward: 50 },
  { nodeId: "measure-mesa", masteryCleared: true, independenceReward: 110 },
  { nodeId: "phoneme-falls", masteryCleared: false, independenceReward: 0 },
] satisfies NodeMasterySignal[];

const world = buildQuestWorld(FIXTURE);

describe("deriveNodeStates", () => {
  it("matches the exact S1 mastery-gate states in world order", () => {
    expect(deriveNodeStates(world, S1_SIGNALS)).toEqual(
      new Map([
        ["count-cove", "unlocked"],
        ["add-atoll", "unlocked"],
        ["place-value-point", "available"],
        ["observe-overlook", "unlocked"],
        ["measure-mesa", "unlocked"],
        ["phoneme-falls", "available"],
        ["blend-bay", "locked"],
        ["letter-landing", "available"],
        ["sentence-summit", "locked"],
      ]),
    );
  });

  it("unlocks a node iff every prerequisite and its own gate are cleared", () => {
    const ownGateOnly = [
      ...S1_SIGNALS,
      { nodeId: "blend-bay", masteryCleared: true, independenceReward: 40 },
    ];
    const everyGate = ownGateOnly.map((signal) =>
      signal.nodeId === "phoneme-falls" ? { ...signal, masteryCleared: true } : signal,
    );

    expect(deriveNodeStates(world, ownGateOnly).get("blend-bay")).toBe("locked");
    expect(deriveNodeStates(world, everyGate).get("blend-bay")).toBe("unlocked");
    expect(deriveNodeStates(world, S1_SIGNALS).get("place-value-point")).toBe("available");
  });

  it("is deterministic and has no time or visit input", () => {
    const first = deriveNodeStates(world, S1_SIGNALS);
    const second = deriveNodeStates(world, S1_SIGNALS);

    expect(JSON.stringify([...first])).toBe(JSON.stringify([...second]));
    expect(deriveNodeStates).toHaveLength(2);
    expectTypeOf<Parameters<typeof deriveNodeStates>>().toEqualTypeOf<
      [world: QuestWorld, signals: readonly NodeMasterySignal[]]
    >();
  });
});
