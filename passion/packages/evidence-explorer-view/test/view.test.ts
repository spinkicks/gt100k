import {
  buildExplorerView,
  buildFixtureGraph,
  plainViewEquals,
} from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";

/** `buildExplorerView` composition + presentation-independence (SC-E02/E03/E04). */
describe("buildExplorerView", () => {
  const bundle = buildFixtureGraph(new NodeCryptoHasher());
  const full = buildExplorerView(bundle.graph, bundle, { tier: "cinematic" });

  it("maps every node to a body/glyph/color + a text label", () => {
    for (const node of full.nodes) {
      expect(node.body.id).toBeTruthy();
      expect(node.glyph).toBeTruthy();
      expect(node.colorRole).toBeTruthy();
      expect(node.label.length).toBeGreaterThan(0);
    }
  });

  it("derives human-authority + cited-assistance flags", () => {
    const grade = full.nodes.find((n) => n.type === "Outcome");
    expect(grade?.isHumanOwned).toBe(true);
    expect(grade?.actor.tone).toBe("human");

    const assist = full.nodes.filter((n) => n.type === "Assistance");
    expect(assist.length).toBeGreaterThan(0);
    for (const a of assist) {
      expect(a.isCitedAssistance).toBe(true);
      expect(a.actor.tone).toBe("model");
      expect(a.body).toEqual({ id: "comet", declaredTag: true });
    }
  });

  it("island node is not in the milestone", () => {
    const island = full.nodes.find((n) => n.isIsland);
    expect(island).toBeDefined();
    expect(island?.isInMilestone).toBe(false);
  });

  it("state is identical across presentation flags (plainViewEquals)", () => {
    const plain = buildExplorerView(bundle.graph, bundle, { tier: "cinematic", plainMode: true });
    const reduced = buildExplorerView(bundle.graph, bundle, {
      tier: "cinematic",
      reducedMotion: true,
    });
    const swapped = buildExplorerView(bundle.graph, bundle, { tier: "calm2d" });
    expect(plainViewEquals(full, plain)).toBe(true);
    expect(plainViewEquals(full, reduced)).toBe(true);
    expect(plainViewEquals(full, swapped)).toBe(true);
  });

  it("carries presentation flags without mutating state", () => {
    const calm = buildExplorerView(bundle.graph, bundle, { tier: "calm2d", reducedMotion: true });
    expect(calm.presentation.tier).toBe("calm2d");
    expect(calm.presentation.reducedMotion).toBe(true);
    expect(full.presentation.tier).toBe("cinematic");
  });
});
