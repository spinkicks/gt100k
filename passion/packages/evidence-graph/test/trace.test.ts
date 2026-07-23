import { describe, expect, it } from "vitest";

import { traceEvidence } from "../src/graph.js";
import type { EvidenceEdge, EvidenceGraph, EvidenceNode } from "../src/model.js";
import { syntheticMilestone } from "./fixtures/seed.js";

function graph(nodes: EvidenceNode[], edges: EvidenceEdge[] = []): EvidenceGraph {
  return {
    nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
    edges,
  };
}

/**
 * Assigns each seed node a synthetic 64-hex id and rewires the edges so actor/tool refs are left
 * untouched while node-to-node edges point at the assigned ids. `traceEvidence` never hashes, so a
 * placeholder id is sufficient to exercise connected-support traversal.
 */
function fixtureGraph(): { graph: EvidenceGraph; idsByKey: ReadonlyMap<string, string> } {
  const idsByKey = new Map(
    syntheticMilestone.nodes.map((item, index) => [
      item.key,
      (index + 1).toString(16).padStart(64, "0"),
    ]),
  );
  const nodes = syntheticMilestone.nodes.map((item) => ({
    ...item.content,
    id: idsByKey.get(item.key) as string,
  }));
  const edges = syntheticMilestone.edges.map((edge) => ({
    ...edge,
    from: idsByKey.get(edge.from) ?? edge.from,
    to: idsByKey.get(edge.to) ?? edge.to,
  }));

  return { graph: graph(nodes, edges), idsByKey };
}

describe("traceEvidence", () => {
  it("returns exactly the synthetic Outcome's connected support and excludes the island", () => {
    const fixture = fixtureGraph();
    const outcomeId = fixture.idsByKey.get(syntheticMilestone.outcomeKey) as string;
    const islandId = fixture.idsByKey.get(syntheticMilestone.islandKey) as string;
    const expected = syntheticMilestone.milestoneNodeKeys
      .filter((key) => key !== syntheticMilestone.outcomeKey)
      .map((key) => fixture.idsByKey.get(key) as string)
      .sort();

    const traced = traceEvidence(fixture.graph, outcomeId);

    expect(traced).toEqual(expected);
    expect(traced).not.toContain(outcomeId);
    expect(traced).not.toContain(islandId);
  });

  it("rejects an unresolved trace origin", () => {
    expect(() => traceEvidence(graph([]), "missing-node")).toThrow("MISSING_NODE:missing-node");
  });
});
