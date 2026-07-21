import { buildAttestation } from "./attestation.js";
import { assertHumanAuthority } from "./invariants.js";
import { merkleRoot } from "./merkle.js";
import type { EvidenceGraph, EvidenceNode, EvidencePacket } from "./model.js";
import type { Hasher } from "./ports.js";

const BUILDER_ID = "gt100k-evidence-graph";
const MATERIAL_URI_PREFIX = "urn:gt100k:evidence:node:";

export interface EvidencePacketSelection {
  milestoneRef: string;
  subjectDigest: string;
  nodeIds: readonly string[];
}

function selectedGraph(graph: EvidenceGraph, nodeIds: readonly string[]): EvidenceGraph {
  const selectedIds = new Set(nodeIds);
  const nodes = Object.fromEntries(nodeIds.map((id) => [id, graph.nodes[id] as EvidenceNode]));
  const edges = graph.edges.filter(
    (edge) =>
      selectedIds.has(edge.from) &&
      (selectedIds.has(edge.to) || graph.nodes[edge.to] === undefined),
  );

  return { nodes, edges };
}

function contributionMap(nodes: readonly EvidenceNode[]): Record<string, string[]> {
  const entries = new Map<string, string[]>();

  for (const node of nodes) {
    if (node.type !== "Contribution") {
      continue;
    }
    const contributions = entries.get(node.actor.ref) ?? [];
    contributions.push(node.id);
    entries.set(node.actor.ref, contributions);
  }

  return Object.fromEntries(
    [...entries.entries()].sort(([left], [right]) => left.localeCompare(right)),
  );
}

/** Assembles a deterministic, unsigned evidence packet from a selected milestone subgraph. */
export function assembleEvidencePacket(
  graph: EvidenceGraph,
  selection: EvidencePacketSelection,
  hasher: Hasher,
): EvidencePacket {
  if (selection.nodeIds.length === 0) {
    throw new Error("EMPTY_PACKET");
  }

  const nodeIds = [...new Set(selection.nodeIds)].sort();
  for (const id of nodeIds) {
    if (graph.nodes[id] === undefined) {
      throw new Error(`MISSING_NODE:${id}`);
    }
  }

  const subgraph = selectedGraph(graph, nodeIds);
  const authority = assertHumanAuthority(subgraph);
  if (!authority.ok) {
    throw new Error(`INVARIANT_VIOLATION:${authority.reasons.join(",")}`);
  }

  const nodes = nodeIds.map((id) => subgraph.nodes[id] as EvidenceNode);
  const artifactHashes = nodes.filter((node) => node.type === "Artifact").map((node) => node.id);
  const root = merkleRoot(nodeIds, hasher);

  return {
    milestoneRef: selection.milestoneRef,
    subjectDigest: selection.subjectDigest,
    nodeIds,
    merkleRoot: root,
    artifactHashes,
    failedBranches: nodes
      .filter((node) => node.type === "Attempt" && node.payload.success === "false")
      .map((node) => node.id),
    assistanceLedger: nodes.filter((node) => node.type === "Assistance").map((node) => node.id),
    contributionMap: contributionMap(nodes),
    reviewAnchors: nodes.filter((node) => node.type === "Review").map((node) => node.id),
    outcomes: nodes.filter((node) => node.type === "Outcome").map((node) => node.id),
    attestation: buildAttestation({
      subjectDigest: selection.subjectDigest,
      merkleRoot: root,
      milestoneRef: selection.milestoneRef,
      builder: { id: BUILDER_ID },
      materials: artifactHashes.map((id) => ({
        uri: `${MATERIAL_URI_PREFIX}${id}`,
        digest: { sha256: id },
      })),
    }),
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
