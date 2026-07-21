/**
 * Deterministic provenance ranking (§U7.2) — shared by the 2D and 3D layouts.
 *
 * `depthRank` = longest path over the "depends-on" relation:
 *   • `derived_from` (from depends on to)   • `validates` (from depends on to)
 *   • `released_as`  (to depends on from)
 * Sources (no prerequisites) sit at rank 0. `orderInRank` is the node's index within its rank in
 * graph **insertion order** (`Object.values(graph.nodes)`, preserved by `addNode`).
 *
 * A node is an **island** when it has no node→node structural edge (`derived_from` / `validates` /
 * `released_as` / `contradicts`); `authored_by`/`used_tool` target actor/tool refs, not nodes, so
 * they do not connect it. Islands carry `depthRank = -1` and are laid out separately.
 *
 * Pure: no `Math.random`, no `Math.sin`/`Math.cos` (§U8.14).
 */
import type { EdgeType, EvidenceGraph, EvidenceNode } from "@gt100k/evidence-graph";

const STRUCTURAL: ReadonlySet<EdgeType> = new Set<EdgeType>([
  "derived_from",
  "validates",
  "released_as",
  "contradicts",
]);

export interface RankInfo {
  readonly node: EvidenceNode;
  /** -1 for islands. */
  readonly depthRank: number;
  readonly orderInRank: number;
  readonly countInRank: number;
  readonly isIsland: boolean;
}

export function provenanceRanks(graph: EvidenceGraph): RankInfo[] {
  const ordered = Object.values(graph.nodes); // insertion order
  const isNode = (id: string): boolean => graph.nodes[id] !== undefined;

  const structural = graph.edges.filter(
    (e) => STRUCTURAL.has(e.type) && isNode(e.from) && isNode(e.to),
  );

  // Connectivity (island detection): any structural node→node edge connects a node.
  const connected = new Set<string>();
  for (const e of structural) {
    connected.add(e.from);
    connected.add(e.to);
  }

  // Prerequisites for the longest-path rank (depends-on; excludes `contradicts`).
  const prereqs = new Map<string, string[]>();
  for (const n of ordered) {
    prereqs.set(n.id, []);
  }
  for (const e of structural) {
    if (e.type === "released_as") {
      prereqs.get(e.to)?.push(e.from);
    } else if (e.type === "derived_from" || e.type === "validates") {
      prereqs.get(e.from)?.push(e.to);
    }
  }

  // Memoized longest-path depth.
  const depth = new Map<string, number>();
  const visiting = new Set<string>();
  const rankOf = (id: string): number => {
    const cached = depth.get(id);
    if (cached !== undefined) {
      return cached;
    }
    if (visiting.has(id)) {
      return 0; // domain guarantees a DAG; guard defensively.
    }
    visiting.add(id);
    let max = -1;
    for (const p of prereqs.get(id) ?? []) {
      max = Math.max(max, rankOf(p));
    }
    visiting.delete(id);
    const value = max + 1; // sources → 0
    depth.set(id, value);
    return value;
  };

  // Assign depthRank; group counts + within-rank order in insertion order.
  const rankSeen = new Map<number, number>();
  const rankTotals = new Map<number, number>();
  const withRank = ordered.map((node) => {
    const isIsland = !connected.has(node.id);
    const depthRank = isIsland ? -1 : rankOf(node.id);
    rankTotals.set(depthRank, (rankTotals.get(depthRank) ?? 0) + 1);
    return { node, depthRank, isIsland };
  });

  return withRank.map(({ node, depthRank, isIsland }) => {
    const orderInRank = rankSeen.get(depthRank) ?? 0;
    rankSeen.set(depthRank, orderInRank + 1);
    return {
      node,
      depthRank,
      orderInRank,
      countInRank: rankTotals.get(depthRank) ?? 1,
      isIsland,
    };
  });
}
