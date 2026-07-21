import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { buildFixtureGraph, layoutExplorer2D } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Golden 2D layout (§U8.1, exact). */
describe("layoutExplorer2D", () => {
  const { graph, ids } = buildFixtureGraph(new NodeCryptoHasher());
  const { positions, bounds } = layoutExplorer2D(graph);
  const at = (key: string) => positions.get(ids[key as keyof typeof ids]);

  it("golden positions match §U8.1", () => {
    expect(at("plan")).toEqual({ x: 120, y: 120 });
    expect(at("assist-research")).toEqual({ x: 120, y: 280 });
    expect(at("assist-tutor")).toEqual({ x: 120, y: 440 });
    expect(at("src-artifact")).toEqual({ x: 360, y: 120 });
    expect(at("attempt-1")).toEqual({ x: 600, y: 120 });
    expect(at("attempt-2")).toEqual({ x: 840, y: 120 });
    expect(at("claim-repro")).toEqual({ x: 1080, y: 120 });
    expect(at("review-technical")).toEqual({ x: 1080, y: 280 });
    expect(at("released-artifact")).toEqual({ x: 1080, y: 440 });
    expect(at("contribution-self")).toEqual({ x: 1080, y: 600 });
    expect(at("review-craft")).toEqual({ x: 1320, y: 120 });
    expect(at("outcome-grade")).toEqual({ x: 1320, y: 280 });
  });

  it("island sits below the DAG at (MARGIN_X, ISLAND_Y)", () => {
    expect(at("island-note")).toEqual({ x: 120, y: 760 });
  });

  it("world bounds are exact", () => {
    expect(bounds).toEqual({ x: 0, y: 0, width: 1440, height: 880 });
  });

  it("x depends only on depthRank (same rank ⇒ same x)", () => {
    // Rank 4: claim-repro / review-technical / released-artifact / contribution-self.
    const xs = [
      at("claim-repro")?.x,
      at("review-technical")?.x,
      at("released-artifact")?.x,
      at("contribution-self")?.x,
    ];
    expect(new Set(xs)).toEqual(new Set([1080]));
  });

  it("is deterministic across runs", () => {
    const second = layoutExplorer2D(buildFixtureGraph(new NodeCryptoHasher()).graph);
    expect(second.bounds).toEqual(bounds);
  });
});
