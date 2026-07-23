import { describe, expect, it } from "vitest";

import {
  type EvidenceEdge,
  type EvidenceGraph,
  addEdge,
  addNode,
  assertHumanAuthority,
} from "../../../packages/evidence-graph/src/index.js";
import { syntheticMilestone } from "../../../packages/evidence-graph/test/fixtures/seed.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../../evidence-verifier-stub/src/index.js";
import { InMemoryEvidenceRepository } from "../src/index.js";

const PROJECT_ID = "speaker-v1";

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
  it("builds, enforces, persists the whole project graph, reloads, and verifies", async () => {
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

    // One graph per project: persist the whole graph (island included) and reload it byte-identically.
    await repository.saveGraph(PROJECT_ID, graph);
    const persistedGraph = await repository.getGraph(PROJECT_ID);
    if (persistedGraph === null) {
      throw new Error("synthetic project graph was not persisted");
    }
    expect(persistedGraph).toEqual(graph);

    // The disconnected island is part of the whole-project graph (no packet culls it).
    const islandNodeId = requireNodeId(syntheticMilestone.islandKey, nodeIdsByKey);
    expect(persistedGraph.nodes[islandNodeId]).toBeDefined();

    await expect(verifier.verify(persistedGraph, hasher)).resolves.toEqual({
      ok: true,
      reasons: [],
    });
  });
});
