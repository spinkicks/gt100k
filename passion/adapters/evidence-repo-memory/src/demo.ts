import {
  type EvidenceEdge,
  type EvidenceGraph,
  addEdge,
  addNode,
  assertHumanAuthority,
  graphMerkleRoot,
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

const PROJECT_ID = "speaker-v1";

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

  // One graph per project: persist the whole graph under its project id, then reload it.
  await repository.saveGraph(PROJECT_ID, graph);
  const persistedGraph = await repository.getGraph(PROJECT_ID);
  if (persistedGraph === null) {
    throw new Error("GRAPH_NOT_PERSISTED");
  }

  const verification = await verifier.verify(persistedGraph, hasher);
  if (!verification.ok) {
    throw new Error(`VERIFICATION_FAILED:${verification.reasons.join(",")}`);
  }

  console.log(`Synthetic project: ${PROJECT_ID}`);
  console.log(
    `Graph: ${Object.keys(persistedGraph.nodes).length} nodes, ${persistedGraph.edges.length} edges`,
  );
  console.log("Human authority: PASS");
  console.log(`Graph root: ${graphMerkleRoot(persistedGraph, hasher)}`);
  console.log("Persisted graph: PASS");
  console.log("Verification: PASS");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
