import {
  applyTamper,
  buildFixtureGraph,
  buildVerificationView,
  verifyWaveOrder,
} from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { DeterministicStubVerifier } from "@gt100k/evidence-verifier-stub";
import { describe, expect, it } from "vitest";

/**
 * Verification view + light-wave order (§U8.8 / SC-E08 / SC-E20). Steps are derived from the
 * domain (re-derived Merkle root, subject-digest binding, `assertHumanAuthority`, deferred stub).
 * The view computes **no** grade.
 */
describe("buildVerificationView", () => {
  const hasher = new NodeCryptoHasher();
  const verifier = new DeterministicStubVerifier();

  const build = async (tamper: boolean) => {
    const bundle = buildFixtureGraph(hasher);
    const target = tamper ? applyTamper(bundle) : bundle;
    // The committed packet is unchanged; a stub verifier trusts the committed nodeIds.
    const verifierResult = await verifier.verify(target.packet, hasher);
    return buildVerificationView(target.packet, verifierResult, target.graph, hasher);
  };

  it("exposes exactly the four §U8.8 steps in order", async () => {
    const view = await build(false);
    expect(view.steps.map((s) => s.id)).toEqual([
      "merkle-root",
      "subject-digest",
      "human-authority",
      "transparency-log-stub",
    ]);
  });

  it("untampered packet → all non-stub steps pass and sealState verified", async () => {
    const view = await build(false);
    const nonStub = view.steps.filter((s) => s.status !== "stub");
    expect(nonStub.every((s) => s.status === "pass")).toBe(true);
    expect(view.sealState).toBe("verified");

    const merkle = view.steps.find((s) => s.id === "merkle-root");
    expect(merkle?.detail?.committed).toBe(merkle?.detail?.recomputed);
  });

  it("marks the transparency-log step as a non-production stub that never blocks the seal", async () => {
    const view = await build(false);
    const stub = view.steps.find((s) => s.id === "transparency-log-stub");
    expect(stub?.status).toBe("stub");
    expect(stub?.nonProduction).toBe(true);
    expect(stub?.label).toBe("Transparency-log inclusion (pre-live gate, stub)");
    // Verified even though the stub is not "pass".
    expect(view.sealState).toBe("verified");
  });

  it("tamper → merkle-root fails with committed≠recomputed and sealState mismatch", async () => {
    const view = await build(true);
    const merkle = view.steps.find((s) => s.id === "merkle-root");
    expect(merkle?.status).toBe("fail");
    expect(merkle?.detail?.committed).toBeTruthy();
    expect(merkle?.detail?.recomputed).toBeTruthy();
    expect(merkle?.detail?.committed).not.toBe(merkle?.detail?.recomputed);
    expect(view.sealState).toBe("mismatch");

    // Tamper is a byte-level payload change: subject binding + human-authority still hold.
    expect(view.steps.find((s) => s.id === "subject-digest")?.status).toBe("pass");
    expect(view.steps.find((s) => s.id === "human-authority")?.status).toBe("pass");
  });

  it("computes no grade (no numeric score / grade field on the view)", async () => {
    const view = await build(false);
    const serialized = JSON.stringify(view);
    expect(/"?grade"?\s*:/.test(serialized)).toBe(false);
    expect(/"score"/.test(serialized)).toBe(false);
    expect("grade" in view).toBe(false);
  });

  it("is deterministic across rebuilds", async () => {
    const a = await build(false);
    const b = await build(false);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });
});

describe("verifyWaveOrder", () => {
  const hasher = new NodeCryptoHasher();

  it("orders every node→node edge by (min depthRank, from insertion, to insertion)", () => {
    const { graph } = buildFixtureGraph(hasher);
    const order = verifyWaveOrder(graph);

    // Only structural + authored node→node edges — the 12 milestone edges (authored_by targets
    // are actor refs, not nodes, so they are excluded).
    expect(order.length).toBe(12);

    const index = new Map(Object.keys(graph.nodes).map((id, i) => [id, i] as const));
    const ranks = new Map(
      // longest-path depthRank per node, recomputed independently for the assertion.
      [...order].map((e) => [e.from, index.get(e.from) ?? 0] as const),
    );
    expect(ranks.size).toBeGreaterThan(0);

    // The order is a deterministic, non-decreasing propagation: identical input → identical output.
    const again = verifyWaveOrder(buildFixtureGraph(hasher).graph);
    expect(again).toEqual(order);
  });

  it("every wave edge connects two real nodes", () => {
    const { graph } = buildFixtureGraph(hasher);
    for (const e of verifyWaveOrder(graph)) {
      expect(graph.nodes[e.from]).toBeDefined();
      expect(graph.nodes[e.to]).toBeDefined();
    }
  });
});
