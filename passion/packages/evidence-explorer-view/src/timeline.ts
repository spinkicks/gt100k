/**
 * Growth-timeline / time-scrub order (§U8.7, exact) — milestone beats ordered by
 * (timestamp asc, then depthRank asc, then graph insertion order). Each beat carries a 0-based
 * `birthOrder`. Deterministic + stable; islands excluded (they are not in the milestone selection).
 */
import type { EvidenceGraph, EvidenceNode } from "@gt100k/evidence-graph";
import type { GrowthTimelineView, TimelineBeat } from "./model.js";
import { provenanceRanks } from "./ranks.js";

export function buildGrowthTimeline(
  graph: EvidenceGraph,
  milestoneNodeIds: readonly string[],
): GrowthTimelineView {
  const rankById = new Map(provenanceRanks(graph).map((r) => [r.node.id, r.depthRank]));
  const insertionIndex = new Map(Object.values(graph.nodes).map((n, i) => [n.id, i]));

  const milestone = milestoneNodeIds
    .map((id) => graph.nodes[id])
    .filter((n): n is EvidenceNode => n !== undefined);

  const sorted = [...milestone].sort((a, b) => {
    if (a.timestamp !== b.timestamp) {
      return a.timestamp < b.timestamp ? -1 : 1;
    }
    const ra = rankById.get(a.id) ?? 0;
    const rb = rankById.get(b.id) ?? 0;
    if (ra !== rb) {
      return ra - rb;
    }
    return (insertionIndex.get(a.id) ?? 0) - (insertionIndex.get(b.id) ?? 0);
  });

  const beats: TimelineBeat[] = sorted.map((node, i) => ({
    nodeId: node.id,
    birthOrder: i,
    group: node.type,
  }));

  return { beats, count: beats.length };
}
