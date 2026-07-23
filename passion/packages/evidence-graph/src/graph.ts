import { canonicalize } from "./canonicalize.js";
import type { EvidenceEdge, EvidenceGraph, EvidenceNode } from "./model.js";
import type { Hasher } from "./ports.js";

export interface AddNodeResult {
  graph: EvidenceGraph;
  id: string;
}

/** Adds content immutably under its injected-hasher digest. */
export function addNode(
  graph: EvidenceGraph,
  content: Omit<EvidenceNode, "id">,
  hasher: Hasher,
): AddNodeResult {
  const canonicalContent = canonicalize(content);
  const id = hasher.hash(new TextEncoder().encode(canonicalContent));

  if (graph.nodes[id] !== undefined) {
    return { graph, id };
  }

  const node: EvidenceNode = { ...content, id };

  return {
    graph: {
      nodes: { ...graph.nodes, [id]: node },
      edges: graph.edges,
    },
    id,
  };
}

function targetExists(graph: EvidenceGraph, edge: EvidenceEdge): boolean {
  if (graph.nodes[edge.to] !== undefined) {
    return true;
  }

  const nodes = Object.values(graph.nodes);
  if (edge.type === "authored_by") {
    return nodes.some((node) => node.actor.ref === edge.to);
  }
  if (edge.type === "used_tool") {
    return nodes.some((node) => node.tool?.name === edge.to);
  }

  return false;
}

function hasPath(graph: EvidenceGraph, start: string, target: string): boolean {
  const pending = [start];
  const visited = new Set<string>();

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined || visited.has(current)) {
      continue;
    }
    if (current === target) {
      return true;
    }

    visited.add(current);
    for (const edge of graph.edges) {
      if (edge.from === current && graph.nodes[edge.to] !== undefined) {
        pending.push(edge.to);
      }
    }
  }

  return false;
}

/** Appends a resolved edge immutably while preserving the graph's DAG invariant. */
export function addEdge(graph: EvidenceGraph, edge: EvidenceEdge): EvidenceGraph {
  if (graph.nodes[edge.from] === undefined) {
    throw new Error(`DANGLING_REF: missing edge source ${edge.from}`);
  }
  if (!targetExists(graph, edge)) {
    throw new Error(`DANGLING_REF: missing edge target ${edge.to}`);
  }
  if (edge.from === edge.to || hasPath(graph, edge.to, edge.from)) {
    throw new Error("CYCLE: edge would make the evidence graph cyclic");
  }

  return {
    nodes: graph.nodes,
    edges: [...graph.edges, edge],
  };
}

/** Returns the selected node's connected evidence support, excluding actor/tool targets and the node itself. */
export function traceEvidence(graph: EvidenceGraph, nodeId: string): string[] {
  if (graph.nodes[nodeId] === undefined) {
    throw new Error(`MISSING_NODE:${nodeId}`);
  }

  const adjacency = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (graph.nodes[edge.from] === undefined || graph.nodes[edge.to] === undefined) {
      continue;
    }
    const from = adjacency.get(edge.from) ?? new Set<string>();
    const to = adjacency.get(edge.to) ?? new Set<string>();
    from.add(edge.to);
    to.add(edge.from);
    adjacency.set(edge.from, from);
    adjacency.set(edge.to, to);
  }

  const visited = new Set([nodeId]);
  const pending = [nodeId];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) {
      continue;
    }
    for (const connected of adjacency.get(current) ?? []) {
      if (!visited.has(connected)) {
        visited.add(connected);
        pending.push(connected);
      }
    }
  }

  visited.delete(nodeId);
  return [...visited].sort();
}
