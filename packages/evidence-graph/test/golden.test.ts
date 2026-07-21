import {
  type EvidenceGraph,
  NODE_TYPES,
  addEdge,
  addNode,
  canonicalize,
} from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

import { merkleRoot } from "../src/merkle.js";
import { goldenArtifact, goldenLeaves } from "./fixtures/seed.js";

const GOLDEN_ARTIFACT_CANONICAL =
  '{"actor":{"kind":"human","ref":"learner-synthetic-001"},"consentScope":{"scope":"synthetic"},"inputs":[],"payload":{"title":"hello world"},"timestamp":"2026-01-01T00:00:00.000Z","tool":{"name":"gt100k-editor","version":"0.1.0"},"type":"Artifact"}';
const GOLDEN_ARTIFACT_ID = "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039";
const GOLDEN_LEAF_DIGESTS = {
  ha: "a23bd5b06da9048238a65b3f1d9d0b9e15fae3dde262688e6489aa4c763d1820",
  hb: "a0d9f0a50b35b9f7d7edc57fb64f4771ddef0fefeaca4e6f949a1514db5b136d",
  hc: "6a3fc11b79f836bda340e75c8906e961b8adf4d6a08a2b992e3f38cd6ff38ebf",
} as const;
const GOLDEN_MERKLE_ROOTS = {
  one: GOLDEN_LEAF_DIGESTS.ha,
  two: "73a57aee9ae28c072b7e0ed9b56a57a69cc6fb048a723d7f052177084d1250ee",
  three: "dd67a4e94fcb4fff954bcb093257364a5b5d0832bda9ffb7a5b6340e45ca647b",
} as const;
const GOLDEN_HC_HB_INTERIOR = "291208811668f898eaaa99780c66db0f4cfd2e5b36f6c03fdca445fdec208cf0";

function prefixedHex(prefix: 0x00 | 0x01, ...digests: readonly string[]): string {
  return prefix.toString(16).padStart(2, "0") + digests.join("");
}

const GOLDEN_MERKLE_HASHES: Readonly<Record<string, string>> = {
  [prefixedHex(0x00, goldenLeaves.ha)]: GOLDEN_LEAF_DIGESTS.ha,
  [prefixedHex(0x00, goldenLeaves.hb)]: GOLDEN_LEAF_DIGESTS.hb,
  [prefixedHex(0x00, goldenLeaves.hc)]: GOLDEN_LEAF_DIGESTS.hc,
  [prefixedHex(0x01, GOLDEN_LEAF_DIGESTS.hb, GOLDEN_LEAF_DIGESTS.ha)]: GOLDEN_MERKLE_ROOTS.two,
  [prefixedHex(0x01, GOLDEN_LEAF_DIGESTS.hc, GOLDEN_LEAF_DIGESTS.hb)]: GOLDEN_HC_HB_INTERIOR,
  [prefixedHex(0x01, GOLDEN_HC_HB_INTERIOR, GOLDEN_LEAF_DIGESTS.ha)]: GOLDEN_MERKLE_ROOTS.three,
};

class PinnedGoldenHasher {
  hash(input: Uint8Array): string {
    if (new TextDecoder().decode(input) !== GOLDEN_ARTIFACT_CANONICAL) {
      throw new Error("unexpected bytes supplied to the G1 golden hasher");
    }
    return GOLDEN_ARTIFACT_ID;
  }
}

class PinnedGoldenMerkleHasher {
  hash(input: Uint8Array): string {
    const encoded = Array.from(input, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const digest = GOLDEN_MERKLE_HASHES[encoded];
    if (digest === undefined) {
      throw new Error(`unexpected bytes supplied to the G2 golden hasher: ${encoded}`);
    }
    return digest;
  }
}

describe("EvidenceGraph golden values", () => {
  it("reproduces the exact G1 Artifact id through the public API", () => {
    const graph = { nodes: {}, edges: [] } satisfies EvidenceGraph;

    expect(canonicalize(goldenArtifact)).toBe(GOLDEN_ARTIFACT_CANONICAL);
    expect(addNode(graph, goldenArtifact, new PinnedGoldenHasher()).id).toBe(GOLDEN_ARTIFACT_ID);
  });

  it("reproduces the exact G2 Merkle roots and canonical permutation", () => {
    const hasher = new PinnedGoldenMerkleHasher();

    expect(merkleRoot([goldenLeaves.ha], hasher)).toBe(GOLDEN_MERKLE_ROOTS.one);
    expect(merkleRoot([goldenLeaves.ha, goldenLeaves.hb], hasher)).toBe(GOLDEN_MERKLE_ROOTS.two);
    expect(merkleRoot([goldenLeaves.ha, goldenLeaves.hb, goldenLeaves.hc], hasher)).toBe(
      GOLDEN_MERKLE_ROOTS.three,
    );
    expect(merkleRoot([goldenLeaves.hc, goldenLeaves.hb, goldenLeaves.ha], hasher)).toBe(
      GOLDEN_MERKLE_ROOTS.three,
    );
  });

  it("exposes the settled P1 model and graph surface", () => {
    expect(NODE_TYPES).toContain("Artifact");
    expect(addEdge).toBeTypeOf("function");
  });
});
