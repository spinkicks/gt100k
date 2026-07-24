import { buildExplorerView, explorerFixture } from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";

/** Seeded smoke test (UE009 / SC-E15) — keeps the gate green from iteration 1. */
describe("explorer smoke (seeded speaker-v1)", () => {
  it("builds the fixture view with the real node hasher", async () => {
    const hasher = new NodeCryptoHasher();
    const fixture = await explorerFixture(hasher);

    // The whole domain flow assembles + verifies (human-authority + stub verifier).
    expect(fixture.verifierResult.ok).toBe(true);

    const view = buildExplorerView(fixture.graph, fixture);
    expect(view.milestoneRef).toBe("speaker-v1");
    expect(view.nodes).toHaveLength(13);
    expect(view.nodes.filter((n) => n.isInMilestone)).toHaveLength(12);
    expect(view.nodes.filter((n) => n.isIsland)).toHaveLength(1);

    // Golden 2D world bounds (§U8.1) + authored 3D center (§U8.2).
    expect(view.bounds2d).toEqual({ x: 0, y: 0, width: 1440, height: 880 });
    expect(view.center3d).toEqual([15, -1, 0]);

    // Non-empty growth timeline (island excluded).
    expect(view.growthTimeline.count).toBe(12);
    expect(view.growthTimeline.beats.length).toBeGreaterThan(0);
  });
});
