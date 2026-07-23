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
import { createPgliteRepository } from "./index.js";

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
const NOW = "2026-07-23T00:00:00.000Z";

async function main(): Promise<void> {
  const hasher = new NodeCryptoHasher();
  const verifier = new DeterministicStubVerifier();
  // Embedded pglite: the same PostgresEvidenceRepository that runs against real Postgres in prod.
  const { repo } = await createPgliteRepository();

  const nodeIdsByKey = new Map<string, string>();
  let graph: EvidenceGraph = { nodes: {}, edges: [] };

  for (const fixtureNode of syntheticMilestone.nodes) {
    const added = addNode(graph, fixtureNode.content, hasher);
    graph = added.graph;
    nodeIdsByKey.set(fixtureNode.key, added.id);
  }

  for (const fixtureEdge of syntheticMilestone.edges) {
    graph = addEdge(graph, resolveFixtureEdge(fixtureEdge, nodeIdsByKey));
  }

  const authority = assertHumanAuthority(graph);
  if (!authority.ok) {
    throw new Error(`HUMAN_AUTHORITY_FAILED:${authority.reasons.join(",")}`);
  }

  await repo.saveProject({
    id: PROJECT_ID,
    name: "Synthetic Speaker milestone",
    studentId: "learner-synthetic-001",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  });
  await repo.saveGraph(PROJECT_ID, graph);

  const persistedGraph = await repo.getGraph(PROJECT_ID);
  if (persistedGraph === null) {
    throw new Error("GRAPH_NOT_PERSISTED");
  }

  // Byte-identical reconstruction: the reloaded graph must hash to the same Merkle root.
  const originalRoot = graphMerkleRoot(graph, hasher);
  const reloadedRoot = graphMerkleRoot(persistedGraph, hasher);
  if (originalRoot !== reloadedRoot) {
    throw new Error(`ROOT_MISMATCH:${originalRoot}!=${reloadedRoot}`);
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
  console.log(`Graph root: ${reloadedRoot}`);
  console.log("Persisted graph: PASS");
  console.log("Verification: PASS");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
