import {
  ASSET_KEYS,
  CAMERA3D,
  FIXTURE,
  MOTION,
  PALETTE,
  QUALITY_TIERS,
  buildQuestWorld,
  layoutQuestWorld,
  resolveWorldTransform,
} from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

describe("arena-world seeded smoke", () => {
  it("builds the synthetic world through the public package API", () => {
    const world = buildQuestWorld(FIXTURE);
    const layout = layoutQuestWorld(world);
    const worldTransform = resolveWorldTransform(layout);

    expect(world.nodes).toHaveLength(9);
    expect(world.regions).toHaveLength(4);
    expect(layout.positions.length).toBeGreaterThan(0);
    expect(worldTransform.nodes).toHaveLength(9);

    for (const registry of [PALETTE, MOTION, CAMERA3D, QUALITY_TIERS, ASSET_KEYS]) {
      expect(Object.keys(registry).length).toBeGreaterThan(0);
    }
  });
});
