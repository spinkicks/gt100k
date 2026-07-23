import { createHash } from "node:crypto";
import {
  type EvidenceGraph,
  NODE_TYPES,
  addEdge,
  addNode,
  canonicalize,
} from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

import { merkleRoot } from "../src/merkle.js";
import type { Hasher } from "../src/ports.js";
import { goldenArtifact, goldenLeaves } from "./fixtures/seed.js";

const GOLDEN_ARTIFACT_CANONICAL =
  '{"actor":{"kind":"human","ref":"learner-synthetic-001"},"consentScope":{"scope":"synthetic"},"inputs":[],"payload":{"title":"hello world"},"timestamp":"2026-01-01T00:00:00.000Z","tool":{"name":"gt100k-editor","version":"0.1.0"},"type":"Artifact"}';
const GOLDEN_ARTIFACT_ID = "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039";

// RFC-6962 leaf digest of `goldenLeaves.ha` = SHA-256(0x00 || ha); the single-leaf root is this leaf.
const GOLDEN_LEAF_HA = "a23bd5b06da9048238a65b3f1d9d0b9e15fae3dde262688e6489aa4c763d1820";

// Golden roots recomputed from the actual `merkleRoot`, which now PRESERVES caller input order
// (true RFC-6962 — no internal digest sort). Order is significant: `[ha,hb,hc]` and `[hc,hb,ha]`
// hash to different roots.
const GOLDEN_MERKLE_ROOTS = {
  one: GOLDEN_LEAF_HA,
  two: "ad5ca6cddc0b27c6a83e332bf28011769236e6c6a1f786ebf7b5267b37a5bd22",
  three: "cac3d448d4e20a2ad5eae1f500e63c2a7f9217cd14572ba7fd22e26dc1ec2648",
  reversed: "dd67a4e94fcb4fff954bcb093257364a5b5d0832bda9ffb7a5b6340e45ca647b",
} as const;

class PinnedGoldenHasher {
  hash(input: Uint8Array): string {
    if (new TextDecoder().decode(input) !== GOLDEN_ARTIFACT_CANONICAL) {
      throw new Error("unexpected bytes supplied to the G1 golden hasher");
    }
    return GOLDEN_ARTIFACT_ID;
  }
}

// Real SHA-256 (equivalent to the workspace `NodeCryptoHasher`) so the G2 roots are genuine, not
// lookup-table placeholders.
class Sha256Hasher implements Hasher {
  hash(input: Uint8Array): string {
    return createHash("sha256").update(input).digest("hex");
  }
}

describe("EvidenceGraph golden values", () => {
  it("reproduces the exact G1 Artifact id through the public API", () => {
    const graph = { nodes: {}, edges: [] } satisfies EvidenceGraph;

    expect(canonicalize(goldenArtifact)).toBe(GOLDEN_ARTIFACT_CANONICAL);
    expect(addNode(graph, goldenArtifact, new PinnedGoldenHasher()).id).toBe(GOLDEN_ARTIFACT_ID);
  });

  it("reproduces the exact G2 input-order Merkle roots and is order-significant", () => {
    const hasher = new Sha256Hasher();

    expect(merkleRoot([goldenLeaves.ha], hasher)).toBe(GOLDEN_MERKLE_ROOTS.one);
    expect(merkleRoot([goldenLeaves.ha, goldenLeaves.hb], hasher)).toBe(GOLDEN_MERKLE_ROOTS.two);
    expect(merkleRoot([goldenLeaves.ha, goldenLeaves.hb, goldenLeaves.hc], hasher)).toBe(
      GOLDEN_MERKLE_ROOTS.three,
    );

    // Permutation now yields a DIFFERENT root — input order is preserved, not sorted away.
    expect(merkleRoot([goldenLeaves.hc, goldenLeaves.hb, goldenLeaves.ha], hasher)).toBe(
      GOLDEN_MERKLE_ROOTS.reversed,
    );
    expect(GOLDEN_MERKLE_ROOTS.reversed).not.toBe(GOLDEN_MERKLE_ROOTS.three);
  });

  it("exposes the settled P1 model and graph surface", () => {
    expect(NODE_TYPES).toContain("Artifact");
    expect(addEdge).toBeTypeOf("function");
  });
});
