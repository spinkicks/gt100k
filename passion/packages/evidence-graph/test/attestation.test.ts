import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { buildAttestation, buildGraphAttestation } from "../src/attestation.js";
import { addNode } from "../src/graph.js";
import type { EvidenceGraph, EvidenceNode } from "../src/model.js";
import type { Hasher } from "../src/ports.js";
import { goldenArtifact, goldenAttempt } from "./fixtures/seed.js";

const GOLDEN_SUBJECT_DIGEST = "fa6cc759cb3564394df561e6d4d2e9fe9ad76568ee10e37d22a83539bc3f6958";
const MERKLE_ROOT = "3c7f4d3c2a824ad9df7bbf211d8ebd3f1e2086ce2f5b0aea27f8bc994dea441c";

// Content id of the seed Artifact node — the single Artifact material in the synthetic graph below.
const GOLDEN_ARTIFACT_ID = "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039";

// RFC-6962 input-order (timestamp-ordered) root of the two-node {Artifact, Attempt} graph, recomputed
// from the actual `graphMerkleRoot` implementation via a real SHA-256 hasher.
const GOLDEN_TWO_NODE_GRAPH_ROOT =
  "ebd3df95a10300d3508edee05732769d26b79d3133a34c9bc98cf7bc7d8af440";

class Sha256Hasher implements Hasher {
  hash(input: Uint8Array): string {
    return createHash("sha256").update(input).digest("hex");
  }
}

type EvidenceNodeContent = Omit<EvidenceNode, "id">;

function buildGraph(...contents: EvidenceNodeContent[]): EvidenceGraph {
  const hasher = new Sha256Hasher();
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  for (const content of contents) {
    graph = addNode(graph, content, hasher).graph;
  }
  return graph;
}

describe("buildAttestation", () => {
  it("binds the golden subject digest and Merkle root in an in-toto Statement", () => {
    const attestation = buildAttestation({
      subjectDigest: GOLDEN_SUBJECT_DIGEST,
      merkleRoot: MERKLE_ROOT,
      milestoneRef: "milestone-synthetic-001",
      builder: { id: "gt100k-evidence-graph" },
      materials: [
        {
          uri: "urn:gt100k:evidence:node:artifact-synthetic-001",
          digest: { sha256: "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039" },
        },
      ],
    });

    expect(attestation).toEqual({
      _type: "https://in-toto.io/Statement/v1",
      predicateType: "https://gt100k.dev/attestations/evidence/v1",
      subject: [{ name: "artifact", digest: { sha256: GOLDEN_SUBJECT_DIGEST } }],
      predicate: {
        builder: { id: "gt100k-evidence-graph" },
        materials: [
          {
            uri: "urn:gt100k:evidence:node:artifact-synthetic-001",
            digest: {
              sha256: "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039",
            },
          },
        ],
        merkleRoot: MERKLE_ROOT,
        milestoneRef: "milestone-synthetic-001",
      },
    });
  });
});

describe("buildGraphAttestation", () => {
  it("attests the whole project graph: graphMerkleRoot, Artifact-node materials, and the bound subject", () => {
    const graph = buildGraph(goldenArtifact, goldenAttempt);
    const attestation = buildGraphAttestation(
      graph,
      { projectRef: "project-synthetic-001", subjectDigest: GOLDEN_SUBJECT_DIGEST },
      new Sha256Hasher(),
    );

    expect(attestation).toEqual({
      _type: "https://in-toto.io/Statement/v1",
      predicateType: "https://gt100k.dev/attestations/evidence/v1",
      subject: [{ name: "artifact", digest: { sha256: GOLDEN_SUBJECT_DIGEST } }],
      predicate: {
        builder: { id: "gt100k-evidence-graph" },
        materials: [
          {
            uri: `urn:gt100k:evidence:node:${GOLDEN_ARTIFACT_ID}`,
            digest: { sha256: GOLDEN_ARTIFACT_ID },
          },
        ],
        merkleRoot: GOLDEN_TWO_NODE_GRAPH_ROOT,
        milestoneRef: "project-synthetic-001",
      },
    });
  });
});
