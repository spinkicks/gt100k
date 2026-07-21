import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { buildFixtureGraph, buildGrowthTimeline } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

/** Growth timeline order (§U8.7). */
describe("buildGrowthTimeline", () => {
  const { graph, packet, ids } = buildFixtureGraph(new NodeCryptoHasher());
  const timeline = buildGrowthTimeline(graph, packet);

  it("reveals the 12 milestone beats; island excluded", () => {
    expect(timeline.count).toBe(12);
    expect(timeline.beats.map((b) => b.nodeId)).not.toContain(ids["island-note"]);
  });

  it("birthOrder is a dense 0-based sequence in declaration order", () => {
    expect(timeline.beats.map((b) => b.birthOrder)).toEqual([...Array(12).keys()]);
    // Monotonic timestamps ⇒ order == milestone declaration order.
    const declared = [
      "plan",
      "assist-research",
      "assist-tutor",
      "src-artifact",
      "attempt-1",
      "attempt-2",
      "claim-repro",
      "review-technical",
      "released-artifact",
      "contribution-self",
      "review-craft",
      "outcome-grade",
    ].map((k) => ids[k as keyof typeof ids]);
    expect(timeline.beats.map((b) => b.nodeId)).toEqual(declared);
  });

  it("is deterministic across runs", () => {
    const rebuilt = buildFixtureGraph(new NodeCryptoHasher());
    const again = buildGrowthTimeline(rebuilt.graph, rebuilt.packet);
    expect(again.beats.map((b) => b.nodeId)).toEqual(timeline.beats.map((b) => b.nodeId));
  });
});
