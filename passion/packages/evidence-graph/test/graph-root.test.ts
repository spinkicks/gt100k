import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { addNode } from "../src/graph.js";
import { graphMerkleRoot, merkleRoot, orderedGraphNodeIds } from "../src/merkle.js";
import type { EvidenceGraph, EvidenceNode } from "../src/model.js";
import type { Hasher } from "../src/ports.js";

// Real SHA-256 hasher (equivalent to the workspace `NodeCryptoHasher` adapter) so these are genuine,
// reproducible content ids and RFC-6962 roots rather than lookup-table placeholders.
class Sha256Hasher implements Hasher {
  hash(input: Uint8Array): string {
    return createHash("sha256").update(input).digest("hex");
  }
}

type EvidenceNodeContent = Omit<EvidenceNode, "id">;

const base = {
  actor: { kind: "human", ref: "learner-synthetic-001" },
  inputs: [],
  consentScope: { scope: "synthetic" },
} as const satisfies Partial<EvidenceNodeContent>;

const early = {
  ...base,
  type: "Artifact",
  timestamp: "2026-01-01T00:00:00.000Z",
  payload: { step: "early" },
} satisfies EvidenceNodeContent;
const mid = {
  ...base,
  type: "Attempt",
  timestamp: "2026-01-01T00:05:00.000Z",
  payload: { step: "mid" },
} satisfies EvidenceNodeContent;
const late = {
  ...base,
  type: "Claim",
  timestamp: "2026-01-01T00:10:00.000Z",
  payload: { step: "late" },
} satisfies EvidenceNodeContent;

// Content ids (`addNode` digests) and the RFC-6962 input-order (timestamp-ordered) graph root,
// recomputed from the actual `graphMerkleRoot` implementation.
const EARLY_ID = "0e8ceea9c81669435c17fd1995e9b26f60a28f95d4c098be92d262cdff04335d";
const MID_ID = "4ffac7403114ba8dd09d0bad8018aa46f6cfeb9c748163031e4db78a4cc1b0df";
const LATE_ID = "dd3587ef199bacf5ce1eb8009602f01be5600c3433563041927b61276b5670e5";
const GRAPH_ROOT = "9f6c102366cf64e512349d9dd12eccba1be1b6432c7853802f9d3de6303b9f64";

function buildGraph(...contents: EvidenceNodeContent[]): EvidenceGraph {
  const hasher = new Sha256Hasher();
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  for (const content of contents) {
    graph = addNode(graph, content, hasher).graph;
  }
  return graph;
}

describe("orderedGraphNodeIds", () => {
  it("orders node ids by ascending timestamp regardless of insertion order", () => {
    // Insert scrambled (late, early, mid); ordering must still be timestamp-ascending.
    const graph = buildGraph(late, early, mid);

    expect(orderedGraphNodeIds(graph)).toEqual([EARLY_ID, MID_ID, LATE_ID]);
  });

  it("breaks equal timestamps by ascending content id", () => {
    const stamp = "2026-01-01T00:00:00.000Z";
    const alpha = {
      ...base,
      type: "Artifact",
      timestamp: stamp,
      payload: { v: "alpha" },
    } satisfies EvidenceNodeContent;
    const bravo = {
      ...base,
      type: "Artifact",
      timestamp: stamp,
      payload: { v: "bravo" },
    } satisfies EvidenceNodeContent;
    const graph = buildGraph(alpha, bravo);

    const ordered = orderedGraphNodeIds(graph);
    expect(ordered).toEqual([...ordered].sort());
    expect(ordered).toHaveLength(2);
  });
});

describe("graphMerkleRoot", () => {
  it("reproduces the exact input-order (timestamp-ordered) root and is insertion-order independent", () => {
    const hasher = new Sha256Hasher();
    const forward = buildGraph(early, mid, late);
    const scrambled = buildGraph(late, early, mid);

    expect(graphMerkleRoot(forward, hasher)).toBe(GRAPH_ROOT);
    expect(graphMerkleRoot(scrambled, hasher)).toBe(GRAPH_ROOT);
  });

  it("equals merkleRoot over the ordered node ids", () => {
    const hasher = new Sha256Hasher();
    const graph = buildGraph(early, mid, late);

    expect(graphMerkleRoot(graph, hasher)).toBe(merkleRoot(orderedGraphNodeIds(graph), hasher));
  });

  it("changes the content-derived root when a node's content is tampered, but the stored-id root is stable", () => {
    const hasher = new Sha256Hasher();
    const graph = buildGraph(early, mid, late);

    // Tampering one byte of a node's content yields a different `addNode` id...
    const tamperedMid = { ...mid, payload: { step: "mid-TAMPERED" } } satisfies EvidenceNodeContent;
    const tamperedId = addNode({ nodes: {}, edges: [] }, tamperedMid, hasher).id;
    expect(tamperedId).not.toBe(MID_ID);

    // ...so a graph rebuilt from the tampered content has a different root...
    const tamperedGraph = buildGraph(early, tamperedMid, late);
    expect(graphMerkleRoot(tamperedGraph, hasher)).not.toBe(GRAPH_ROOT);

    // ...while the untouched graph's stored-id root is unchanged across recomputation.
    expect(graphMerkleRoot(graph, hasher)).toBe(GRAPH_ROOT);
  });
});
