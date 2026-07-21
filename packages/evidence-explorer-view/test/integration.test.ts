import {
  buildExplorerView,
  buildFixtureGraph,
  plainViewEquals,
} from "@gt100k/evidence-explorer-view";
import { traceEvidence } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";
import type { Hasher } from "../../evidence-graph/src/ports.js";

/**
 * Integration / port-boundary guarantees (UE042 · SC-E14 · SC-012).
 *
 * The view reads `@gt100k/evidence-graph` **unchanged**: it consumes the domain through its public
 * API + the `Hasher`/`Verifier` **ports**, so swapping a hasher adapter changes only the
 * content-address strings, never the view logic (layout / ranks / timeline / mapping are pure
 * topology). The domain's own golden values stay deterministic, and the domain `traceEvidence`
 * drives a supporting-only trace that excludes the disconnected island.
 */

/**
 * A second, non-crypto `Hasher` adapter used ONLY to prove adapter-swap needs no view change.
 * The `Hasher` port is contractually SHA-256-*shaped* (the domain's merkle step rejects anything
 * that is not 64-hex), so this stand-in emits a deterministic, distinct 64-hex digest — four
 * salted 64-bit FNV-1a rounds concatenated — giving a different id space with zero collisions over
 * the fixture's 13 distinct node contents. Never shipped; the app uses `NodeCryptoHasher` server-side.
 */
class AltFnvHasher implements Hasher {
  hash(input: Uint8Array): string {
    const mask = (1n << 64n) - 1n;
    const prime = 1099511628211n;
    let out = "";
    for (let salt = 0; salt < 4; salt++) {
      let h = 14695981039346656037n; // FNV-1a 64-bit offset basis
      h = (h ^ BigInt(0x9e + salt)) & mask;
      for (const byte of input) {
        h = (h ^ BigInt(byte)) & mask;
        h = (h * prime) & mask;
      }
      out += h.toString(16).padStart(16, "0");
    }
    return out; // 64 hex chars — conforms to the port's SHA-256 shape.
  }
}

/** Structural fingerprint of a view that is independent of the hasher's id strings (topology only). */
function topology(view: ReturnType<typeof buildExplorerView>) {
  return {
    milestoneRef: view.milestoneRef,
    nodeCount: view.nodes.length,
    edgeCount: view.edges.length,
    types: view.nodes.map((n) => n.type),
    bodies: view.nodes.map((n) => n.body),
    glyphs: view.nodes.map((n) => n.glyph),
    colorRoles: view.nodes.map((n) => n.colorRole),
    depthRanks: view.nodes.map((n) => n.depthRank),
    orderInRanks: view.nodes.map((n) => n.orderInRank),
    inMilestone: view.nodes.map((n) => n.isInMilestone),
    islands: view.nodes.map((n) => n.isIsland),
    humanOwned: view.nodes.map((n) => n.isHumanOwned),
    citedAssistance: view.nodes.map((n) => n.isCitedAssistance),
    birthOrders: view.nodes.map((n) => n.birthOrder),
    pos2d: view.nodes.map((n) => n.pos2d),
    pos3d: view.nodes.map((n) => n.pos3d),
    bounds2d: view.bounds2d,
    bounds3d: view.bounds3d,
    center3d: view.center3d,
    edgeStyles: view.edges.map((e) => [e.type, e.threadStyle, e.flow] as const),
    beats: view.growthTimeline.beats.map((b) => [b.phase, b.birthOrder] as const),
  };
}

describe("integration — port boundary (SC-E14 / SC-012)", () => {
  it("builds the view with the real node hasher + produces content-addressed sha256 ids", () => {
    const hasher = new NodeCryptoHasher();
    const { graph, packet, ids } = buildFixtureGraph(hasher);
    const view = buildExplorerView(graph, packet);

    // Real SHA-256 content addressing (64 hex). The domain — not the view — computes these.
    expect(packet.subjectDigest).toMatch(/^[0-9a-f]{64}$/);
    expect(packet.merkleRoot).toMatch(/^[0-9a-f]{64}$/);
    for (const id of Object.values(ids)) {
      expect(id).toMatch(/^[0-9a-f]{64}$/);
    }
    // Subject binding is the released artifact's content address (domain invariant, not recomputed).
    expect(packet.subjectDigest).toBe(ids["released-artifact"]);
    expect(view.milestoneRef).toBe(packet.milestoneRef);
    expect(view.nodes).toHaveLength(13);
  });

  it("the domain's golden values are deterministic across rebuilds (unchanged by the view)", () => {
    const a = buildFixtureGraph(new NodeCryptoHasher());
    const b = buildFixtureGraph(new NodeCryptoHasher());
    // Same hasher → byte-for-byte identical graph + packet (the domain's golden guarantee).
    expect(a.graph).toEqual(b.graph);
    expect(a.packet).toEqual(b.packet);
    expect(a.ids).toEqual(b.ids);
    // And the composed view is likewise deterministic.
    expect(
      plainViewEquals(buildExplorerView(a.graph, a.packet), buildExplorerView(b.graph, b.packet)),
    ).toBe(true);
  });

  it("swapping the Hasher adapter needs no view change — topology is identical, only ids differ", () => {
    const real = buildFixtureGraph(new NodeCryptoHasher());
    const alt = buildFixtureGraph(new AltFnvHasher());

    const realView = buildExplorerView(real.graph, real.packet);
    const altView = buildExplorerView(alt.graph, alt.packet);

    // The two adapters produce DIFFERENT content addresses …
    expect(alt.ids["released-artifact"]).not.toBe(real.ids["released-artifact"]);
    expect(alt.packet.merkleRoot).not.toBe(real.packet.merkleRoot);
    // … yet the view (layout / ranks / timeline / mapping) is byte-for-byte the same shape.
    expect(topology(altView)).toEqual(topology(realView));
    // Alt hasher still yields a valid, verifiable packet shape (subject binding holds).
    expect(alt.packet.subjectDigest).toBe(alt.ids["released-artifact"]);
  });

  it("domain traceEvidence drives a supporting-only trace and excludes the island (SC-012)", () => {
    const { graph, ids } = buildFixtureGraph(new NodeCryptoHasher());
    const view = buildExplorerView(graph, buildFixtureGraph(new NodeCryptoHasher()).packet);

    const trace = traceEvidence(graph, ids["outcome-grade"]);
    const traceSet = new Set(trace);

    // The disconnected island is never in a trace …
    expect(traceSet.has(ids["island-note"])).toBe(false);
    // … and the view marks it as such (excluded from the milestone).
    const island = view.nodes.find((n) => n.id === ids["island-note"]);
    expect(island?.isIsland).toBe(true);
    expect(island?.isInMilestone).toBe(false);

    // Every traced id is an in-milestone node (supporting-only; no actor/tool refs, no island).
    const milestoneIds = new Set(
      Object.entries(ids)
        .filter(([k]) => k !== "island-note")
        .map(([, v]) => v),
    );
    for (const id of trace) {
      expect(milestoneIds.has(id)).toBe(true);
      const node = view.nodes.find((n) => n.id === id);
      expect(node?.isInMilestone).toBe(true);
    }
    // The whole milestone component (all 11 others) supports the outcome; the self node is excluded.
    expect(trace).toHaveLength(11);
    expect(traceSet.has(ids["outcome-grade"])).toBe(false);
    expect(traceSet.has(ids["released-artifact"])).toBe(true);
  });
});
