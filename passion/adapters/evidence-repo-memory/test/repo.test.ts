import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
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

function makeGraph(): EvidenceGraph {
  const node = makeNode();
  return {
    nodes: { [node.id]: node },
    edges: [
      { type: "authored_by", from: node.id, to: "actor-synthetic-1", label: "original edge" },
    ],
  };
}

describe("InMemoryEvidenceRepository", () => {
  it("implements the EvidenceRepository port and returns null for missing records", async () => {
    expectTypeOf<InMemoryEvidenceRepository>().toMatchTypeOf<EvidenceRepository>();

    const repository = new InMemoryEvidenceRepository();

    await expect(repository.getNode("missing-node")).resolves.toBeNull();
    await expect(repository.getGraph("missing-project")).resolves.toBeNull();
  });

  it("round-trips nodes, edges, and per-project graphs", async () => {
    const repository = new InMemoryEvidenceRepository();
    const node = makeNode();
    const edge = makeEdge();
    const graph = makeGraph();

    await repository.saveNode(node);
    await repository.saveEdge(edge);
    await repository.saveGraph("speaker-v1", graph);

    await expect(repository.getNode(node.id)).resolves.toEqual(node);
    await expect(repository.getEdges()).resolves.toEqual([edge]);
    await expect(repository.getGraph("speaker-v1")).resolves.toEqual(graph);
  });

  it("erases the whole project graph on deleteGraph (save → get → delete → get null)", async () => {
    const repository = new InMemoryEvidenceRepository();
    const graph = makeGraph();

    await repository.saveGraph("speaker-v1", graph);
    await expect(repository.getGraph("speaker-v1")).resolves.not.toBeNull();

    await repository.deleteGraph("speaker-v1");
    await expect(repository.getGraph("speaker-v1")).resolves.toBeNull();
  });

  it("isolates stored records from mutations through saved and loaded values", async () => {
    const repository = new InMemoryEvidenceRepository();
    const node = makeNode();
    const edge = makeEdge();
    const graph = makeGraph();

    await repository.saveNode(node);
    await repository.saveEdge(edge);
    await repository.saveGraph("speaker-v1", graph);

    (node.payload.metadata as { label: string }).label = "mutated saved node";
    edge.label = "mutated saved edge";
    graph.edges[0]!.label = "mutated saved graph";

    const loadedNode = await repository.getNode(node.id);
    const loadedEdges = await repository.getEdges();
    const loadedGraph = await repository.getGraph("speaker-v1");

    expect((loadedNode?.payload.metadata as { label: string }).label).toBe("original node");
    expect(loadedEdges[0]?.label).toBe("original edge");
    expect(loadedGraph?.edges[0]?.label).toBe("original edge");

    (loadedNode?.payload.metadata as { label: string }).label = "mutated loaded node";
    loadedEdges[0]!.label = "mutated loaded edge";
    loadedGraph!.edges[0]!.label = "mutated loaded graph";

    expect(((await repository.getNode(node.id))?.payload.metadata as { label: string }).label).toBe(
      "original node",
    );
    expect((await repository.getEdges())[0]?.label).toBe("original edge");
    expect((await repository.getGraph("speaker-v1"))?.edges[0]?.label).toBe("original edge");
  });
});
