import type { EdgeView } from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";
import {
  effectiveFocusId,
  isEdgeRevealed,
  isNodeRevealed,
  revealedNodeIds,
} from "../components/scrub.js";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";

/**
 * Time-scrub reveal logic (UE027, §U8.7) — the growth order is deterministic and drives which
 * bodies + threads are present at each scrub position. Pure logic, so it is testable without WebGL.
 */
describe("time-scrub reveal", () => {
  const view = buildSyntheticExplorerView();
  const count = view.growthTimeline.count; // 12 milestone beats.

  it("reveals nothing at t=0 and everything (incl. the island) at full reveal", () => {
    expect(revealedNodeIds(view, 0).size).toBe(0);
    expect(revealedNodeIds(view, count).size).toBe(view.nodes.length); // 13 = 12 + island.
  });

  it("grows exactly one milestone body per step, in birthOrder", () => {
    for (let t = 0; t <= count; t++) {
      const revealed = revealedNodeIds(view, t);
      // The island (no birthOrder) is absent until full reveal.
      const milestoneRevealed = [...revealed].filter(
        (id) => view.nodes.find((n) => n.id === id)?.birthOrder !== null,
      );
      expect(milestoneRevealed).toHaveLength(t);
    }
  });

  it("only reveals a body once its birthOrder is passed (monotonic)", () => {
    const beat = view.growthTimeline.beats[5];
    if (!beat) throw new Error("expected a 6th beat");
    const node = view.nodes.find((n) => n.id === beat.nodeId);
    if (!node) throw new Error("beat node missing from view");
    expect(isNodeRevealed(node, 5, count)).toBe(false); // birthOrder 5 not yet passed at t=5.
    expect(isNodeRevealed(node, 6, count)).toBe(true); // present at t=6.
  });

  it("draws a thread only when both endpoints are present", () => {
    const structural = view.edges.filter((e) => e.isNodeEdge);
    const edge = structural[0] as EdgeView;
    const fromOrder = view.nodes.find((n) => n.id === edge.from)?.birthOrder ?? 0;
    const toOrder = view.nodes.find((n) => n.id === edge.to)?.birthOrder ?? 0;
    const needed = Math.max(fromOrder, toOrder) + 1;

    expect(isEdgeRevealed(edge, revealedNodeIds(view, needed - 1))).toBe(false);
    expect(isEdgeRevealed(edge, revealedNodeIds(view, needed))).toBe(true);
  });

  it("keeps camera focus only while the focused body is revealed", () => {
    const lastBeat = view.growthTimeline.beats[count - 1];
    if (!lastBeat) throw new Error("expected a final beat");
    // Focused on the last-born body: gone when scrubbed back, present at full reveal.
    expect(effectiveFocusId(lastBeat.nodeId, revealedNodeIds(view, 1))).toBeNull();
    expect(effectiveFocusId(lastBeat.nodeId, revealedNodeIds(view, count))).toBe(lastBeat.nodeId);
  });
});
