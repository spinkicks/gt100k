import type { ExplorerView } from "@gt100k/evidence-explorer-view";
/**
 * HUD filter / trace / search selectors (UE044, §U5.9 / UX5) — pure, framework-free, WebGL-free so
 * they are unit-testable (same pattern as `scrub.ts` / `verify-machine.ts`). Every function is
 * **read-only** over the one `ExplorerView`: filters, trace, and search are presentation concerns and
 * NEVER mutate the underlying state (SC-E14 / plainViewEquals). The trace re-derives the domain's
 * `traceEvidence` result from the view's own node→node threads, so it stays in lockstep with the
 * domain (the view-package integration test proves the topologies are equal).
 */
import type { NodeType } from "@gt100k/evidence-graph";

/** Ids of nodes whose type is currently shown by the type filters. Empty set → nothing shown. */
export function matchedNodeIds(
  view: ExplorerView,
  activeTypes: ReadonlySet<NodeType>,
): Set<string> {
  const out = new Set<string>();
  for (const n of view.nodes) {
    if (activeTypes.has(n.type)) out.add(n.id);
  }
  return out;
}

/**
 * The human-owned `Outcome` grade — the default anchor for "trace from Outcome". There is exactly one
 * such node in the milestone; `null` if (defensively) none is present.
 */
export function outcomeAnchorId(view: ExplorerView): string | null {
  const outcome = view.nodes.find((n) => n.type === "Outcome" && n.isHumanOwned && n.isInMilestone);
  return outcome?.id ?? null;
}

/**
 * Supporting-evidence trace from an anchor: an undirected BFS over the view's **node→node** provenance
 * threads, excluding the anchor itself — equivalent to the domain `traceEvidence` (SC-012). The
 * disconnected island carries no thread, so it is naturally excluded. `null` anchor → `null` (no trace
 * active, so nothing is dimmed).
 */
export function tracedNodeIds(view: ExplorerView, anchorId: string | null): Set<string> | null {
  if (anchorId === null) return null;
  if (!view.nodes.some((n) => n.id === anchorId)) return null;

  const adjacency = new Map<string, Set<string>>();
  const link = (a: string, b: string): void => {
    const neighbours = adjacency.get(a) ?? new Set<string>();
    neighbours.add(b);
    adjacency.set(a, neighbours);
  };
  for (const e of view.edges) {
    if (!e.isNodeEdge) continue;
    link(e.from, e.to);
    link(e.to, e.from);
  }

  const visited = new Set<string>([anchorId]);
  const pending = [anchorId];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) continue;
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        pending.push(next);
      }
    }
  }

  visited.delete(anchorId); // supporting-only: the anchor is never part of its own trace.
  return visited;
}

/** A node is emphasized by a trace when it is in the trace **or** it is the trace anchor itself. */
export function isTraceEmphasized(
  nodeId: string,
  traced: ReadonlySet<string> | null,
  anchorId: string | null,
): boolean {
  if (traced === null) return true; // no trace active → nothing is de-emphasized.
  return nodeId === anchorId || traced.has(nodeId);
}

/** Case-insensitive substring over label + type; matches returned in view (provenance) order. */
export function searchMatches(view: ExplorerView, query: string): string[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [];
  return view.nodes
    .filter((n) => `${n.label} ${n.type}`.toLowerCase().includes(q))
    .map((n) => n.id);
}

/** The first view-order search match, or `null`. Used by the HUD search box to fly-to/focus. */
export function firstSearchMatch(view: ExplorerView, query: string): string | null {
  return searchMatches(view, query)[0] ?? null;
}
