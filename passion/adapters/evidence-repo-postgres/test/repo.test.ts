// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";

import {
  type EvidenceEdge,
  type EvidenceGraph,
  type EvidenceNode,
  addEdge,
  addNode,
  graphMerkleRoot,
} from "../../../packages/evidence-graph/src/index.js";
import { syntheticMilestone } from "../../../packages/evidence-graph/test/fixtures/seed.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../../evidence-verifier-stub/src/index.js";
import {
  type BlobStore,
  type PostgresEvidenceRepository,
  createPgliteRepository,
} from "../src/index.js";

const PROJECT_ID = "speaker-v1";
const hasher = new NodeCryptoHasher();

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

/** Build the synthetic fixture graph with real content-addressed node ids. */
function buildFixtureGraph(): EvidenceGraph {
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
  return graph;
}

/** Edges are stored as rows and reloaded via ORDER BY; compare them order-insensitively. */
function sortEdges(edges: readonly EvidenceEdge[]): EvidenceEdge[] {
  return edges.slice().sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
}

let repo: PostgresEvidenceRepository;
let blobStore: BlobStore;

beforeEach(async () => {
  ({ repo, blobStore } = await createPgliteRepository());
});

describe("PostgresEvidenceRepository (pglite-backed)", () => {
  it("round-trips a whole graph byte-identically (nodes deep-equal, Merkle root preserved)", async () => {
    const graph = buildFixtureGraph();
    await repo.saveGraph(PROJECT_ID, graph);

    const reloaded = await repo.getGraph(PROJECT_ID);
    expect(reloaded).not.toBeNull();
    // Nodes are a Record (order-insensitive); reloaded jsonb must equal the originals exactly.
    expect(reloaded?.nodes).toEqual(graph.nodes);
    // Edges reload via ORDER BY, so compare as an order-independent set.
    expect(sortEdges(reloaded?.edges ?? [])).toEqual(sortEdges(graph.edges));
    // Byte-identical reconstruction: the reloaded graph hashes to the same root.
    expect(graphMerkleRoot(reloaded as EvidenceGraph, hasher)).toBe(graphMerkleRoot(graph, hasher));
  });

  it("reads back every node and edge (complete read)", async () => {
    const graph = buildFixtureGraph();
    await repo.saveGraph(PROJECT_ID, graph);

    const reloaded = await repo.getGraph(PROJECT_ID);
    expect(Object.keys(reloaded?.nodes ?? {}).length).toBe(Object.keys(graph.nodes).length);
    expect(reloaded?.edges.length).toBe(graph.edges.length);
    for (const id of Object.keys(graph.nodes)) {
      expect(reloaded?.nodes[id]).toEqual(graph.nodes[id]);
    }
  });

  it("returns null for a project with no persisted nodes", async () => {
    await expect(repo.getGraph("does-not-exist")).resolves.toBeNull();
  });

  it("replaces (does not merge) the graph on re-save", async () => {
    const graph = buildFixtureGraph();
    await repo.saveGraph(PROJECT_ID, graph);

    const smaller: EvidenceGraph = { nodes: {}, edges: [] };
    const only = addNode(smaller, syntheticMilestone.nodes[0]!.content, hasher);
    await repo.saveGraph(PROJECT_ID, only.graph);

    const reloaded = await repo.getGraph(PROJECT_ID);
    expect(Object.keys(reloaded?.nodes ?? {})).toEqual([only.id]);
    expect(reloaded?.edges).toEqual([]);
  });

  it("supports project CRUD (saveProject → getProject → listProjects)", async () => {
    await expect(repo.getProject(PROJECT_ID)).resolves.toBeNull();

    const now = "2026-07-23T00:00:00.000Z";
    await repo.saveProject({
      id: PROJECT_ID,
      name: "Synthetic Speaker milestone",
      studentId: "learner-synthetic-001",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    const fetched = await repo.getProject(PROJECT_ID);
    expect(fetched).toMatchObject({
      id: PROJECT_ID,
      name: "Synthetic Speaker milestone",
      studentId: "learner-synthetic-001",
      status: "active",
    });

    const later = "2026-07-24T00:00:00.000Z";
    await repo.saveProject({
      id: PROJECT_ID,
      name: "Renamed milestone",
      studentId: "learner-synthetic-001",
      status: "archived",
      createdAt: now,
      updatedAt: later,
    });
    const updated = await repo.getProject(PROJECT_ID);
    expect(updated?.name).toBe("Renamed milestone");
    expect(updated?.status).toBe("archived");

    const all = await repo.listProjects();
    expect(all.map((p) => p.id)).toEqual([PROJECT_ID]);
  });

  it("erases rows AND blobs on deleteGraph (the v1 delete-the-project story)", async () => {
    const graph = buildFixtureGraph();
    await repo.saveProject({
      id: PROJECT_ID,
      name: "Synthetic",
      studentId: "learner-synthetic-001",
      status: "active",
      createdAt: "2026-07-23T00:00:00.000Z",
      updatedAt: "2026-07-23T00:00:00.000Z",
    });
    await repo.saveGraph(PROJECT_ID, graph);

    const blobKey = `${PROJECT_ID}/deadbeef`;
    await blobStore.put(blobKey, new Uint8Array([1, 2, 3]));

    // Before erasure: graph, project row, and blob all present.
    expect(await repo.getGraph(PROJECT_ID)).not.toBeNull();
    expect(await repo.getProject(PROJECT_ID)).not.toBeNull();
    expect(await blobStore.get(blobKey)).not.toBeNull();

    await repo.deleteGraph(PROJECT_ID);

    // After erasure: nothing left in rows or blobs.
    expect(await repo.getGraph(PROJECT_ID)).toBeNull();
    expect(await repo.getProject(PROJECT_ID)).toBeNull();
    expect(await blobStore.get(blobKey)).toBeNull();
  });

  it("throws PII_ON_GRAPH when an email leaks into actor.ref", async () => {
    const graph: EvidenceGraph = {
      nodes: {
        "node-1": {
          id: "node-1",
          type: "Claim",
          actor: { kind: "human", ref: "student@example.com" },
          inputs: [],
          timestamp: "2026-07-23T00:00:00.000Z",
          consentScope: { scope: "synthetic" },
          payload: { statement: "hi" },
        } satisfies EvidenceNode,
      },
      edges: [],
    };
    await expect(repo.saveGraph(PROJECT_ID, graph)).rejects.toThrow(/^PII_ON_GRAPH:/);
    // The write must have rolled back — nothing persisted.
    await expect(repo.getGraph(PROJECT_ID)).resolves.toBeNull();
  });

  it("throws PII_ON_GRAPH when an email leaks into a payload string", async () => {
    const graph: EvidenceGraph = {
      nodes: {
        "node-1": {
          id: "node-1",
          type: "Claim",
          actor: { kind: "human", ref: "learner-01" },
          inputs: [],
          timestamp: "2026-07-23T00:00:00.000Z",
          consentScope: { scope: "synthetic" },
          payload: { note: "contact me at teacher@school.org" },
        } satisfies EvidenceNode,
      },
      edges: [],
    };
    await expect(repo.saveGraph(PROJECT_ID, graph)).rejects.toThrow(/^PII_ON_GRAPH:/);
  });

  it("does not flag the clean synthetic fixture (pseudonyms pass)", async () => {
    const graph = buildFixtureGraph();
    await expect(repo.saveGraph(PROJECT_ID, graph)).resolves.toBeUndefined();
  });

  it("reloaded graph passes DeterministicStubVerifier verification", async () => {
    const graph = buildFixtureGraph();
    await repo.saveGraph(PROJECT_ID, graph);
    const reloaded = await repo.getGraph(PROJECT_ID);
    expect(reloaded).not.toBeNull();

    const verifier = new DeterministicStubVerifier();
    await expect(verifier.verify(reloaded as EvidenceGraph, hasher)).resolves.toEqual({
      ok: true,
      reasons: [],
    });
  });
});
