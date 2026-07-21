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
import { InMemoryEvidenceRepository } from "./index.js";

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
    throw new Error(`MISSING_SYNTHETIC_NODE:${key}`);
  }
  return id;
}

async function main(): Promise<void> {
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

  const authority = assertHumanAuthority(graph);
  if (!authority.ok) {
    throw new Error(`HUMAN_AUTHORITY_FAILED:${authority.reasons.join(",")}`);
  }

  const milestoneNodeIds = syntheticMilestone.milestoneNodeKeys.map((key) =>
    requireNodeId(key, nodeIdsByKey),
  );
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
    throw new Error("PACKET_NOT_PERSISTED");
  }

  const verification = await verifier.verify(persistedPacket, hasher);
  if (!verification.ok) {
    throw new Error(`VERIFICATION_FAILED:${verification.reasons.join(",")}`);
  }

  console.log(`Synthetic milestone: ${syntheticMilestone.milestoneRef}`);
  console.log(`Graph: ${Object.keys(graph.nodes).length} nodes, ${graph.edges.length} edges`);
  console.log("Human authority: PASS");
  console.log(
    `Packet: ${persistedPacket.nodeIds.length} nodes, root ${persistedPacket.merkleRoot}`,
  );
  console.log("Persisted packet: PASS");
  console.log("Verification: PASS");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
