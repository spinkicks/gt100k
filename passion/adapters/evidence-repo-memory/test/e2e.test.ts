import { describe, expect, it } from "vitest";

import {
  type EvidenceEdge,
  type EvidenceGraph,
  addEdge,
  addNode,
  assembleEvidencePacket,
  assertHumanAuthority,
} from "../../../packages/evidence-graph/src/index.js";
import { syntheticMilestone } from "../../../packages/evidence-graph/test/fixtures/seed.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../../evidence-verifier-stub/src/index.js";
import { InMemoryEvidenceRepository } from "../src/index.js";

function resolveFixtureEdge(
  edge: EvidenceEdge,
  nodeIdsByKey: ReadonlyMap<string, string>,
): EvidenceEdge {
  return {
    ...edge,
    from: nodeIdsByKey.get(edge.from) ?? edge.from,
    to: nodeIdsByKey.get(edge.to) ?? edge.to,
  };
}

function requireNodeId(key: string, nodeIdsByKey: ReadonlyMap<string, string>): string {
  const id = nodeIdsByKey.get(key);
  if (id === undefined) {
    throw new Error(`missing synthetic fixture node: ${key}`);
  }
  return id;
}

describe("synthetic EvidenceGraph end-to-end flow", () => {
  it("builds, enforces, attests, persists, and verifies without external workflows", async () => {
    const hasher = new NodeCryptoHasher();
    const repository = new InMemoryEvidenceRepository();
    const verifier = new DeterministicStubVerifier();
    const nodeIdsByKey = new Map<string, string>();
    let graph: EvidenceGraph = { nodes: {}, edges: [] };

    for (const fixtureNode of syntheticMilestone.nodes) {
      const added = addNode(graph, fixtureNode.content, hasher);
      graph = added.graph;
      nodeIdsByKey.set(fixtureNode.key, added.id);
      await repository.saveNode(graph.nodes[added.id]!);
    }

    for (const fixtureEdge of syntheticMilestone.edges) {
      const edge = resolveFixtureEdge(fixtureEdge, nodeIdsByKey);
      graph = addEdge(graph, edge);
      await repository.saveEdge(edge);
    }

    expect(
      Object.values(graph.nodes).every((node) => node.consentScope.scope === "synthetic"),
    ).toBe(true);
    expect(assertHumanAuthority(graph)).toEqual({ ok: true, reasons: [] });

    const milestoneNodeIds = syntheticMilestone.milestoneNodeKeys.map((key) =>
      requireNodeId(key, nodeIdsByKey),
    );
    const islandNodeId = requireNodeId(syntheticMilestone.islandKey, nodeIdsByKey);

    const packet = assembleEvidencePacket(
      graph,
      {
        milestoneRef: syntheticMilestone.milestoneRef,
        subjectDigest: syntheticMilestone.subjectDigest,
        nodeIds: milestoneNodeIds,
      },
      hasher,
    );
    await repository.savePacket(packet);

    const persistedPacket = await repository.getPacket(syntheticMilestone.milestoneRef);
    if (persistedPacket === null) {
      throw new Error("synthetic milestone packet was not persisted");
    }
    expect(persistedPacket).toEqual(packet);
    expect(persistedPacket.nodeIds).not.toContain(islandNodeId);
    expect(persistedPacket.attestation.subject[0]?.digest.sha256).toBe(
      syntheticMilestone.subjectDigest,
    );
    await expect(verifier.verify(persistedPacket, hasher)).resolves.toEqual({
      ok: true,
      reasons: [],
    });
  });
});
