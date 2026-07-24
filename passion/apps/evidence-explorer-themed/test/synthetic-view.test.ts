import { describe, expect, it } from "vitest";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";

/**
 * App-level seeded smoke (UE010/UE012, SC-E15) — the page's server-side view builder produces the
 * committed "tiny-runner-v1" journey (student builds a one-button runner) deterministically, keeping
 * the gate green from iteration 1.
 */
describe("evidence-explorer synthetic view", () => {
  it("builds the deterministic tiny-runner-v1 view", () => {
    const view = buildSyntheticExplorerView({ tier: "calm2d" });

    expect(view.milestoneRef).toBe("tiny-runner-v1");
    // The tiny-game journey is 12 fully connected nodes (no island); every node is in-milestone.
    expect(view.nodes).toHaveLength(12);
    expect(view.nodes.filter((n) => n.isInMilestone)).toHaveLength(12);
    expect(view.nodes.filter((n) => n.isIsland)).toHaveLength(0);

    // Golden 2D world bounds (§U8.1) + authored 3D center (§U8.2).
    expect(view.bounds2d).toEqual({ x: 0, y: 0, width: 1440, height: 560 });
    expect(view.center3d).toEqual([15, -1, 0]);

    // Presentation flags never affect state — this is the calm tier here.
    expect(view.presentation.tier).toBe("calm2d");

    // Growth timeline populated (island excluded).
    expect(view.growthTimeline.count).toBe(12);
  });

  it("is deterministic across builds (byte-stable ids + layout)", () => {
    const a = buildSyntheticExplorerView();
    const b = buildSyntheticExplorerView();
    expect(a.nodes.map((n) => n.id)).toEqual(b.nodes.map((n) => n.id));
    expect(a.nodes.map((n) => n.pos2d)).toEqual(b.nodes.map((n) => n.pos2d));
  });

  it("carries the visual language on every node (shape + glyph + color, never color alone)", () => {
    const view = buildSyntheticExplorerView();
    for (const n of view.nodes) {
      expect(n.body.id).toBeTruthy();
      expect(n.glyph).toBeTruthy();
      expect(n.colorRole).toBeTruthy();
      expect(n.label.length).toBeGreaterThan(0);
    }
    // The Assistance comet carries a persistent, non-accusatory "cited" tag.
    const comet = view.nodes.find((n) => n.type === "Assistance");
    expect(comet?.body.declaredTag).toBe(true);
    expect(comet?.isCitedAssistance).toBe(true);
  });
});
