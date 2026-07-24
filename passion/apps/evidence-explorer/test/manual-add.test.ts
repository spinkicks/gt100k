import { addNode, assertHumanAuthority } from "@gt100k/evidence-graph";
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { buildTinyGameGraph } from "@gt100k/evidence-tiny-game";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";
import { describe, expect, it } from "vitest";
import {
  type AddNodeInput,
  applyAddEdge,
  applyAddNode,
  rebuildBundle,
} from "../components/manual-add.js";

/**
 * Phase-4 manual-add core (pure, no React). Pins that append-only adds round-trip through the real
 * domain: content-addressed nodes grow the graph deterministically, edges enforce the DAG +
 * no-dangling invariants, and a valid add still passes the human-authority invariant + stub verifier.
 */
const hasher = new NodeCryptoHasher();

const nodeInput = (over: Partial<AddNodeInput> = {}): AddNodeInput => ({
  type: "Claim",
  title: "Manual reflection",
  actorKind: "human",
  actorRef: "learner-07",
  timestamp: "2026-07-24T00:00:00.000Z",
  ...over,
});

describe("applyAddNode", () => {
  it("appends a content-addressed node — count grows by 1, id is deterministic", () => {
    const { graph } = buildTinyGameGraph(hasher);
    const before = Object.keys(graph.nodes).length;

    const first = applyAddNode(graph, nodeInput(), hasher);
    expect(Object.keys(first.graph.nodes).length).toBe(before + 1);
    expect(first.graph.nodes[first.id]).toBeDefined();

    // Deterministic + idempotent: the same input yields the same id and does not grow the graph.
    const again = applyAddNode(first.graph, nodeInput(), hasher);
    expect(again.id).toBe(first.id);
    expect(Object.keys(again.graph.nodes).length).toBe(before + 1);
  });

  it("throws INVALID_NODE_INPUT on a blank title or actor ref", () => {
    const { graph } = buildTinyGameGraph(hasher);
    expect(() => applyAddNode(graph, nodeInput({ title: "   " }), hasher)).toThrow(
      "INVALID_NODE_INPUT",
    );
    expect(() => applyAddNode(graph, nodeInput({ actorRef: "" }), hasher)).toThrow(
      "INVALID_NODE_INPUT",
    );
  });

  it("does not mutate the input graph", () => {
    const { graph } = buildTinyGameGraph(hasher);
    const before = Object.keys(graph.nodes).length;
    applyAddNode(graph, nodeInput(), hasher);
    expect(Object.keys(graph.nodes).length).toBe(before);
  });
});

describe("applyAddEdge", () => {
  it("appends a valid edge between two added nodes", () => {
    let graph: EvidenceGraph = { nodes: {}, edges: [] };
    const a = applyAddNode(graph, nodeInput({ title: "A", type: "Artifact" }), hasher);
    graph = a.graph;
    const b = applyAddNode(
      graph,
      nodeInput({ title: "B", type: "Transformation", timestamp: "2026-07-24T00:01:00.000Z" }),
      hasher,
    );
    graph = b.graph;

    const { graph: withEdge } = applyAddEdge(
      graph,
      { type: "derived_from", from: b.id, to: a.id },
      hasher,
    );
    expect(withEdge.edges).toContainEqual({ type: "derived_from", from: b.id, to: a.id });
  });

  it("throws CYCLE on a self-edge", () => {
    let graph: EvidenceGraph = { nodes: {}, edges: [] };
    const a = applyAddNode(graph, nodeInput({ title: "A", type: "Artifact" }), hasher);
    graph = a.graph;
    expect(() => applyAddEdge(graph, { type: "derived_from", from: a.id, to: a.id })).toThrow(
      /CYCLE/,
    );
  });

  it("throws DANGLING_REF on an edge to a missing target", () => {
    const a = applyAddNode(
      { nodes: {}, edges: [] },
      nodeInput({ title: "A", type: "Artifact" }),
      hasher,
    );
    expect(() =>
      applyAddEdge(a.graph, { type: "derived_from", from: a.id, to: "sha256-does-not-exist" }),
    ).toThrow(/DANGLING_REF/);
  });

  it("throws CYCLE when a new edge would form a cycle (A→B then B→A)", () => {
    let graph: EvidenceGraph = { nodes: {}, edges: [] };
    const a = applyAddNode(graph, nodeInput({ title: "A", type: "Artifact" }), hasher);
    graph = a.graph;
    const b = applyAddNode(
      graph,
      nodeInput({ title: "B", type: "Transformation", timestamp: "2026-07-24T00:01:00.000Z" }),
      hasher,
    );
    graph = applyAddEdge(b.graph, { type: "derived_from", from: b.id, to: a.id }).graph;

    expect(() => applyAddEdge(graph, { type: "derived_from", from: a.id, to: b.id })).toThrow(
      /CYCLE/,
    );
  });
});

describe("integrity after a valid add", () => {
  it("still passes human-authority + the stub verifier, and rebuilds a verified bundle", async () => {
    const { graph, projectId, subjectDigest } = buildTinyGameGraph(hasher);
    const { graph: grown } = applyAddNode(graph, nodeInput(), hasher);

    expect(assertHumanAuthority(grown).ok).toBe(true);
    expect((await new DeterministicStubVerifier().verify(grown, hasher)).ok).toBe(true);

    const bundle = await rebuildBundle(grown, projectId, subjectDigest, hasher);
    // The new node is present in the re-derived view and the honest seal still verifies.
    expect(bundle.view.nodes.length).toBe(Object.keys(grown.nodes).length);
    expect(bundle.verification.sealState).toBe("verified");
  });

  it("re-derives the same node id the domain addNode would (content-addressing parity)", () => {
    const { graph } = buildTinyGameGraph(hasher);
    const input = nodeInput();
    const viaCore = applyAddNode(graph, input, hasher);
    const viaDomain = addNode(
      graph,
      {
        type: input.type,
        actor: { kind: input.actorKind, ref: input.actorRef },
        inputs: [],
        timestamp: input.timestamp,
        consentScope: { scope: "manual", purpose: "manual-entry" },
        payload: { title: input.title },
      },
      hasher,
    );
    expect(viaCore.id).toBe(viaDomain.id);
  });
});
