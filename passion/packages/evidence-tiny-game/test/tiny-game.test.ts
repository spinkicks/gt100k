import { assertHumanAuthority, graphMerkleRoot } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";
import { describe, expect, it } from "vitest";
import { TINY_GAME_NODE_COUNT, buildTinyGameGraph } from "../src/index.js";

const hasher = new NodeCryptoHasher();

describe("buildTinyGameGraph", () => {
  it("is deterministic — two independent builds share the same Merkle root", () => {
    const a = buildTinyGameGraph(hasher);
    const b = buildTinyGameGraph(hasher);
    expect(graphMerkleRoot(a.graph, hasher)).toBe(graphMerkleRoot(b.graph, hasher));
  });

  it("builds a valid DAG (addEdge enforces no cycles / no dangling refs)", () => {
    // A throw during build would surface here; reaching this point means the wiring is a DAG.
    expect(() => buildTinyGameGraph(hasher)).not.toThrow();
  });

  it("has the expected node count", () => {
    const { graph } = buildTinyGameGraph(hasher);
    expect(Object.keys(graph.nodes)).toHaveLength(TINY_GAME_NODE_COUNT);
    expect(TINY_GAME_NODE_COUNT).toBe(12);
  });

  it("satisfies the human-authority invariant", () => {
    const { graph } = buildTinyGameGraph(hasher);
    const authority = assertHumanAuthority(graph);
    expect(authority.ok).toBe(true);
    expect(authority.reasons).toEqual([]);
  });

  it("passes the deterministic stub verifier", async () => {
    const { graph } = buildTinyGameGraph(hasher);
    const result = await new DeterministicStubVerifier().verify(graph, hasher);
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("grades via a human-owned Outcome (no model author on the grade)", () => {
    const { graph, ids } = buildTinyGameGraph(hasher);
    const outcomeId = ids["outcome-grade"];
    if (outcomeId === undefined) throw new Error("outcome-grade id missing");
    const outcome = graph.nodes[outcomeId];
    if (outcome === undefined) throw new Error("outcome-grade node missing");

    expect(outcome.type).toBe("Outcome");
    expect(outcome.payload.kind).toBe("grade");
    expect(outcome.actor.kind).toBe("human");

    // The only authored_by edge from the Outcome targets a human actor ref, and no model touches it.
    const authorEdges = graph.edges.filter(
      (edge) => edge.type === "authored_by" && edge.from === outcomeId,
    );
    expect(authorEdges).toHaveLength(1);
    expect(authorEdges[0]?.to).toBe(outcome.actor.ref);
    const authorRefs = new Set(authorEdges.map((edge) => edge.to));
    for (const node of Object.values(graph.nodes)) {
      if (authorRefs.has(node.actor.ref)) {
        expect(node.actor.kind).toBe("human");
      }
    }
  });

  it("exposes the released build as the subject digest", () => {
    const { ids, subjectDigest, projectId, projectName, studentId } = buildTinyGameGraph(hasher);
    expect(subjectDigest).toBe(ids["released-artifact"]);
    expect(projectId).toBe("tiny-runner-v1");
    expect(projectName).toBe("Tiny one-button runner");
    expect(studentId).toBe("learner-07");
  });
});
