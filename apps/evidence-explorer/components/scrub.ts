/**
 * Time-scrub reveal logic (§U5.4 / §U8.7) — pure, deterministic, framework-free so it can be unit
 * tested without a WebGL context and shared identically by the 3D cosmos, the calm-2D constellation,
 * and the accessible beat list.
 *
 * A scrub position `revealedCount` runs 0…`growthTimeline.count`. A milestone body is present once
 * its `birthOrder < revealedCount` (bodies ignite in build order as `t` advances). The unlinked
 * island node has no `birthOrder` and is not part of the build history — it appears only at full
 * reveal, as the "note outside this milestone". A thread draws only once **both** its endpoints are
 * present, matching §U8.7 ("edges whose both endpoints are revealed").
 */
import type { EdgeView, ExplorerView, NodeView } from "@gt100k/evidence-explorer-view";

/** Is this node present at scrub position `revealedCount` (0…count)? */
export function isNodeRevealed(node: NodeView, revealedCount: number, count: number): boolean {
  if (node.birthOrder === null) return revealedCount >= count; // island: only at full reveal.
  return node.birthOrder < revealedCount;
}

/** The set of node ids present at a scrub position — the single source both tiers filter against. */
export function revealedNodeIds(view: ExplorerView, revealedCount: number): Set<string> {
  const count = view.growthTimeline.count;
  const ids = new Set<string>();
  for (const n of view.nodes) {
    if (isNodeRevealed(n, revealedCount, count)) ids.add(n.id);
  }
  return ids;
}

/** A structural thread draws only when both endpoints are already present. */
export function isEdgeRevealed(edge: EdgeView, revealed: ReadonlySet<string>): boolean {
  return edge.isNodeEdge && revealed.has(edge.from) && revealed.has(edge.to);
}

/**
 * The effective focus target for the camera: the requested body, but only while it is still
 * revealed. Scrubbing back past a focused body returns the camera to the overview (null).
 */
export function effectiveFocusId(
  focusNodeId: string | null,
  revealed: ReadonlySet<string>,
): string | null {
  return focusNodeId && revealed.has(focusNodeId) ? focusNodeId : null;
}
