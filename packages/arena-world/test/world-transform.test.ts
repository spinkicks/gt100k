import {
  FIXTURE,
  buildQuestWorld,
  layoutQuestWorld,
  resolveWorldTransform,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

function buildFixtureLayout() {
  return layoutQuestWorld(buildQuestWorld(FIXTURE));
}

describe("resolveWorldTransform", () => {
  it("matches the exact fixture positions and 3D world bounds", () => {
    expect(resolveWorldTransform(buildFixtureLayout())).toEqual({
      nodes: [
        { nodeId: "count-cove", x: 3, y: 0.6, z: 3 },
        { nodeId: "add-atoll", x: 9, y: 0.6, z: 3 },
        { nodeId: "place-value-point", x: 15, y: 0.6, z: 3 },
        { nodeId: "observe-overlook", x: 35, y: 2.1, z: 3 },
        { nodeId: "measure-mesa", x: 41, y: 2.1, z: 3 },
        { nodeId: "phoneme-falls", x: 3, y: 0.1, z: 35 },
        { nodeId: "blend-bay", x: 9, y: 0.1, z: 35 },
        { nodeId: "letter-landing", x: 35, y: 2.8, z: 35 },
        { nodeId: "sentence-summit", x: 41, y: 2.8, z: 35 },
      ],
      worldScale: 0.03125,
      seaLevel: -3,
      bounds3D: {
        size: 64,
        center: { x: 32, y: 0, z: 32 },
      },
    });
  });

  it("returns byte-identical transforms for identical layouts", () => {
    const layout = buildFixtureLayout();

    expect(JSON.stringify(resolveWorldTransform(layout))).toBe(
      JSON.stringify(resolveWorldTransform(layout)),
    );
  });

  it("replays byte-identically from a serialized layout", () => {
    const layout = buildFixtureLayout();
    const replayedLayout = JSON.parse(JSON.stringify(layout)) as typeof layout;

    expect(JSON.stringify(resolveWorldTransform(replayedLayout))).toBe(
      JSON.stringify(resolveWorldTransform(layout)),
    );
  });
});
