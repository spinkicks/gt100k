import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  EvidenceEdge,
  EvidenceNode,
  EvidencePacket,
} from "../../../packages/evidence-graph/src/model.js";
import type { EvidenceRepository } from "../../../packages/evidence-graph/src/ports.js";
import { InMemoryEvidenceRepository } from "../src/index.js";

function makeNode(): EvidenceNode {
  return {
    id: "node-artifact-1",
    type: "Artifact",
    actor: { kind: "human", ref: "actor-synthetic-1" },
    inputs: [],
    timestamp: "2026-07-20T00:00:00.000Z",
    consentScope: { scope: "synthetic-test" },
    payload: { metadata: { label: "original node" } },
  };
}

function makeEdge(): EvidenceEdge {
  return {
    type: "derived_from",
    from: "node-artifact-1",
    to: "node-attempt-1",
    label: "original edge",
  };
}

function makePacket(): EvidencePacket {
  return {
    milestoneRef: "milestone-synthetic-1",
    subjectDigest: "subject-digest",
    nodeIds: ["node-artifact-1"],
    merkleRoot: "merkle-root",
    artifactHashes: ["node-artifact-1"],
    failedBranches: [],
    assistanceLedger: [],
    contributionMap: { "actor-synthetic-1": ["node-artifact-1"] },
    reviewAnchors: [],
    outcomes: [],
    attestation: {
      _type: "https://in-toto.io/Statement/v1",
      predicateType: "https://gt100k.dev/attestations/evidence/v1",
      subject: [{ name: "artifact-synthetic-1", digest: { sha256: "subject-digest" } }],
      predicate: {
        builder: { id: "gt100k-evidence-graph" },
        materials: [{ uri: "node:node-artifact-1", digest: { sha256: "node-artifact-1" } }],
        merkleRoot: "merkle-root",
        milestoneRef: "milestone-synthetic-1",
      },
    },
  };
}

describe("InMemoryEvidenceRepository", () => {
  it("implements the EvidenceRepository port and returns null for missing records", async () => {
    expectTypeOf<InMemoryEvidenceRepository>().toMatchTypeOf<EvidenceRepository>();

    const repository = new InMemoryEvidenceRepository();

    await expect(repository.getNode("missing-node")).resolves.toBeNull();
    await expect(repository.getPacket("missing-milestone")).resolves.toBeNull();
  });

  it("round-trips nodes, edges, and milestone packets", async () => {
    const repository = new InMemoryEvidenceRepository();
    const node = makeNode();
    const edge = makeEdge();
    const packet = makePacket();

    await repository.saveNode(node);
    await repository.saveEdge(edge);
    await repository.savePacket(packet);

    await expect(repository.getNode(node.id)).resolves.toEqual(node);
    await expect(repository.getEdges()).resolves.toEqual([edge]);
    await expect(repository.getPacket(packet.milestoneRef)).resolves.toEqual(packet);
  });

  it("isolates stored records from mutations through saved and loaded values", async () => {
    const repository = new InMemoryEvidenceRepository();
    const node = makeNode();
    const edge = makeEdge();
    const packet = makePacket();

    await repository.saveNode(node);
    await repository.saveEdge(edge);
    await repository.savePacket(packet);

    (node.payload.metadata as { label: string }).label = "mutated saved node";
    edge.label = "mutated saved edge";
    packet.attestation.subject[0]!.digest.sha256 = "mutated saved packet";

    const loadedNode = await repository.getNode(node.id);
    const loadedEdges = await repository.getEdges();
    const loadedPacket = await repository.getPacket(packet.milestoneRef);

    expect((loadedNode?.payload.metadata as { label: string }).label).toBe("original node");
    expect(loadedEdges[0]?.label).toBe("original edge");
    expect(loadedPacket?.attestation.subject[0]?.digest.sha256).toBe("subject-digest");

    (loadedNode?.payload.metadata as { label: string }).label = "mutated loaded node";
    loadedEdges[0]!.label = "mutated loaded edge";
    loadedPacket!.attestation.subject[0]!.digest.sha256 = "mutated loaded packet";

    expect(((await repository.getNode(node.id))?.payload.metadata as { label: string }).label).toBe(
      "original node",
    );
    expect((await repository.getEdges())[0]?.label).toBe("original edge");
    expect(
      (await repository.getPacket(packet.milestoneRef))?.attestation.subject[0]?.digest.sha256,
    ).toBe("subject-digest");
  });
});
