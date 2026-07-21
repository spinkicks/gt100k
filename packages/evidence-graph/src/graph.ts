import { canonicalize } from "./canonicalize.js";
import type { EvidenceGraph, EvidenceNode } from "./model.js";
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
