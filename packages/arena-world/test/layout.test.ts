import { FIXTURE, buildQuestWorld, layoutQuestWorld } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

describe("layoutQuestWorld", () => {
  it("matches the exact regional-grid layout and world bounds", () => {
    const layout = layoutQuestWorld(buildQuestWorld(FIXTURE));

    expect(layout).toEqual({
      positions: [
        { nodeId: "count-cove", x: 96, y: 96 },
        { nodeId: "add-atoll", x: 288, y: 96 },
        { nodeId: "place-value-point", x: 480, y: 96 },
        { nodeId: "observe-overlook", x: 1120, y: 96 },
        { nodeId: "measure-mesa", x: 1312, y: 96 },
        { nodeId: "phoneme-falls", x: 96, y: 1120 },
        { nodeId: "blend-bay", x: 288, y: 1120 },
        { nodeId: "letter-landing", x: 1120, y: 1120 },
        { nodeId: "sentence-summit", x: 1312, y: 1120 },
      ],
      bounds: { x: 0, y: 0, width: 2048, height: 2048 },
    });
  });

  it("returns byte-identical layouts for identical inputs", () => {
    const world = buildQuestWorld(FIXTURE);

    expect(JSON.stringify(layoutQuestWorld(world))).toBe(JSON.stringify(layoutQuestWorld(world)));
  });
});
