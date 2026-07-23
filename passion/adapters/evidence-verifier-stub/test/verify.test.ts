import { describe, expect, expectTypeOf, it } from "vitest";

import { addNode } from "../../../packages/evidence-graph/src/graph.js";
import type { EvidenceGraph, EvidenceNode } from "../../../packages/evidence-graph/src/model.js";
import type { Verifier } from "../../../packages/evidence-graph/src/ports.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../src/index.js";

type EvidenceNodeContent = Omit<EvidenceNode, "id">;

const learnerArtifact = (title: string): EvidenceNodeContent => ({
  type: "Artifact",
  actor: { kind: "human", ref: "learner-synthetic-1" },
  inputs: [],
  timestamp: "2026-07-20T00:00:00.000Z",
  consentScope: { scope: "synthetic" },
  payload: { title },
});

/** Build a content-addressed graph whose stored ids match their content (a clean, verifiable graph). */
function makeGraph(...contents: EvidenceNodeContent[]): EvidenceGraph {
  const hasher = new NodeCryptoHasher();
  let graph: EvidenceGraph = { nodes: {}, edges: [] };
  for (const content of contents) {
    graph = addNode(graph, content, hasher).graph;
  }
  return graph;
}

describe("DeterministicStubVerifier", () => {
  it("implements Verifier and passes an untampered whole-project graph", async () => {
    expectTypeOf<DeterministicStubVerifier>().toMatchTypeOf<Verifier>();

    const graph = makeGraph(learnerArtifact("a"), learnerArtifact("b"), learnerArtifact("c"));

    await expect(
      new DeterministicStubVerifier().verify(graph, new NodeCryptoHasher()),
    ).resolves.toEqual({ ok: true, reasons: [] });
  });

  it("reports CONTENT_HASH_MISMATCH when a stored node's content is tampered", async () => {
    const verifier = new DeterministicStubVerifier();
    const hasher = new NodeCryptoHasher();
    const graph = makeGraph(learnerArtifact("a"), learnerArtifact("b"), learnerArtifact("c"));

    // Tamper each node in turn: mutate its payload without re-keying → stored id no longer binds it.
    for (const storedId of Object.keys(graph.nodes)) {
      const tampered = structuredClone(graph);
      const node = tampered.nodes[storedId]!;
      tampered.nodes[storedId] = {
        ...node,
        payload: { ...node.payload, tampered: true },
      };

      await expect(verifier.verify(tampered, hasher)).resolves.toEqual({
        ok: false,
        reasons: ["CONTENT_HASH_MISMATCH"],
      });
    }
  });

  it("reports the human-authority invariant reasons over the whole graph", async () => {
    // A model-authored Artifact violates the human-authority invariant (MODEL_AUTHORED_PROHIBITED_TYPE).
    const modelArtifact: EvidenceNodeContent = {
      type: "Artifact",
      actor: { kind: "model", ref: "assistant-model-synthetic" },
      inputs: [],
      timestamp: "2026-07-20T00:01:00.000Z",
      consentScope: { scope: "synthetic" },
      payload: { title: "model-authored artifact" },
    };
    const graph = makeGraph(learnerArtifact("a"), modelArtifact);

    await expect(
      new DeterministicStubVerifier().verify(graph, new NodeCryptoHasher()),
    ).resolves.toEqual({ ok: false, reasons: ["MODEL_AUTHORED_PROHIBITED_TYPE"] });
  });

  it("surfaces both a content tamper and an invariant breach without duplicating reasons", async () => {
    const modelArtifact: EvidenceNodeContent = {
      type: "Artifact",
      actor: { kind: "model", ref: "assistant-model-synthetic" },
      inputs: [],
      timestamp: "2026-07-20T00:01:00.000Z",
      consentScope: { scope: "synthetic" },
      payload: { title: "model-authored artifact" },
    };
    const graph = makeGraph(learnerArtifact("a"), modelArtifact);

    // Tamper the first (human) node's content too.
    const cleanId = Object.keys(graph.nodes).find((id) => graph.nodes[id]?.actor.kind === "human")!;
    const tampered = structuredClone(graph);
    const node = tampered.nodes[cleanId]!;
    tampered.nodes[cleanId] = { ...node, payload: { ...node.payload, tampered: true } };

    const result = await new DeterministicStubVerifier().verify(tampered, new NodeCryptoHasher());
    expect(result.ok).toBe(false);
    expect(new Set(result.reasons)).toEqual(
      new Set(["CONTENT_HASH_MISMATCH", "MODEL_AUTHORED_PROHIBITED_TYPE"]),
    );
    // Reasons are de-duplicated even though multiple nodes could raise the same one.
    expect(result.reasons.length).toBe(new Set(result.reasons).size);
  });
});
