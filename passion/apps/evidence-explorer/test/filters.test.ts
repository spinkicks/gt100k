import { buildFixtureGraph } from "@gt100k/evidence-explorer-view";
import { NODE_TYPES } from "@gt100k/evidence-graph";
import type { NodeType } from "@gt100k/evidence-graph";
import { traceEvidence } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";
import {
  firstSearchMatch,
  matchedNodeIds,
  outcomeAnchorId,
  searchMatches,
  tracedNodeIds,
} from "../components/filters.js";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";

/**
 * HUD filter / trace / search selectors (UE044, §U5.9 / UX5). All pure — no React, no WebGL — so the
 * gate can prove the acceptance behaviour (SC-E14: the app reads the domain unchanged; trace equals
 * the domain `traceEvidence`; toggles are presentation-only and never mutate the `ExplorerView`).
 */
describe("HUD filter selectors", () => {
  const view = buildSyntheticExplorerView();
  const allTypes = new Set<NodeType>(NODE_TYPES);

  it("all types active → every node matches", () => {
    const matched = matchedNodeIds(view, allTypes);
    expect(matched.size).toBe(view.nodes.length);
    for (const n of view.nodes) expect(matched.has(n.id)).toBe(true);
  });

  it("a single active type → only that type matches", () => {
    const matched = matchedNodeIds(view, new Set<NodeType>(["Outcome"]));
    for (const n of view.nodes) {
      expect(matched.has(n.id)).toBe(n.type === "Outcome");
    }
    expect(matched.size).toBeGreaterThan(0);
  });

  it("no active types → nothing matches (a filter never mutates the view)", () => {
    const before = JSON.stringify(view.nodes);
    const matched = matchedNodeIds(view, new Set<NodeType>());
    expect(matched.size).toBe(0);
    // Selecting is read-only: the underlying node list is byte-identical after.
    expect(JSON.stringify(view.nodes)).toBe(before);
  });
});

describe("HUD trace selector", () => {
  const view = buildSyntheticExplorerView();

  it("finds exactly one human-owned Outcome grade as the default anchor", () => {
    const anchor = outcomeAnchorId(view);
    expect(anchor).not.toBeNull();
    const node = view.nodes.find((n) => n.id === anchor);
    expect(node?.type).toBe("Outcome");
    expect(node?.isHumanOwned).toBe(true);
  });

  it("null anchor → no trace active", () => {
    expect(tracedNodeIds(view, null)).toBeNull();
  });

  it("trace equals the domain traceEvidence (supporting-only; island excluded) — SC-012/SC-E14", () => {
    // The domain is the source of truth; the app's view-only BFS must reproduce it exactly.
    const { graph } = buildFixtureGraph(new NodeCryptoHasher());
    const anchor = outcomeAnchorId(view);
    expect(anchor).not.toBeNull();
    if (anchor === null) return;

    const domain = new Set(traceEvidence(graph, anchor));
    const traced = tracedNodeIds(view, anchor);
    expect(traced).not.toBeNull();
    if (traced === null) return;

    // Same set of node ids, both directions.
    expect([...traced].sort()).toEqual([...domain].sort());
    // Never includes the anchor itself (supporting-only).
    expect(traced.has(anchor)).toBe(false);
    // The disconnected island is excluded.
    const island = view.nodes.find((n) => n.isIsland);
    expect(island).toBeDefined();
    if (island) expect(traced.has(island.id)).toBe(false);
  });

  it("trace is deterministic across calls", () => {
    const anchor = outcomeAnchorId(view);
    if (anchor === null) throw new Error("no anchor");
    const a = [...(tracedNodeIds(view, anchor) ?? [])].sort();
    const b = [...(tracedNodeIds(view, anchor) ?? [])].sort();
    expect(a).toEqual(b);
  });
});

describe("HUD search selector", () => {
  const view = buildSyntheticExplorerView();

  it("empty query → no matches", () => {
    expect(searchMatches(view, "")).toEqual([]);
    expect(searchMatches(view, "   ")).toEqual([]);
    expect(firstSearchMatch(view, "")).toBeNull();
  });

  it("case-insensitive substring over label + type, in view order", () => {
    const outcomeMatches = searchMatches(view, "outcome");
    // Every match is genuinely an Outcome (by type) or has 'outcome' in its label.
    for (const id of outcomeMatches) {
      const n = view.nodes.find((x) => x.id === id);
      const hay = `${n?.label} ${n?.type}`.toLowerCase();
      expect(hay).toContain("outcome");
    }
    expect(outcomeMatches.length).toBeGreaterThan(0);
    // Matches preserve view (provenance) order.
    const order = view.nodes.map((n) => n.id).filter((id) => outcomeMatches.includes(id));
    expect(outcomeMatches).toEqual(order);
  });

  it("firstSearchMatch returns the first view-order match or null", () => {
    const first = firstSearchMatch(view, "outcome");
    expect(first).toBe(searchMatches(view, "outcome")[0] ?? null);
    expect(firstSearchMatch(view, "zzz-no-such-node")).toBeNull();
  });
});
