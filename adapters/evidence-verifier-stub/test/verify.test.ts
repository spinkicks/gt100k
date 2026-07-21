import { describe, expect, expectTypeOf, it } from "vitest";

import { merkleRoot } from "../../../packages/evidence-graph/src/merkle.js";
import type { Attestation, EvidencePacket } from "../../../packages/evidence-graph/src/model.js";
import type { Verifier } from "../../../packages/evidence-graph/src/ports.js";
import { NodeCryptoHasher } from "../../evidence-hash-node/src/index.js";
import { DeterministicStubVerifier } from "../src/index.js";

const SUBJECT_DIGEST = "fa6cc759cb3564394df561e6d4d2e9fe9ad76568ee10e37d22a83539bc3f6958";

function makePacket(): EvidencePacket {
  const hasher = new NodeCryptoHasher();
  const nodeIds = ["node-a", "node-b", "node-c"].map((value) =>
    hasher.hash(new TextEncoder().encode(value)),
  );
  const root = merkleRoot(nodeIds, hasher);

  return {
    milestoneRef: "milestone-verifier-synthetic",
    subjectDigest: SUBJECT_DIGEST,
    nodeIds,
    merkleRoot: root,
    artifactHashes: [nodeIds[0] as string],
    failedBranches: [],
    assistanceLedger: [],
    contributionMap: {},
    reviewAnchors: [],
    outcomes: [],
    attestation: {
      _type: "https://in-toto.io/Statement/v1",
      predicateType: "https://gt100k.dev/attestations/evidence/v1",
      subject: [{ name: "artifact", digest: { sha256: SUBJECT_DIGEST } }],
      predicate: {
        builder: { id: "gt100k-evidence-graph" },
        materials: [],
        merkleRoot: root,
        milestoneRef: "milestone-verifier-synthetic",
      },
    },
  };
}

describe("DeterministicStubVerifier", () => {
  it("implements Verifier and passes an untampered packet", async () => {
    expectTypeOf<DeterministicStubVerifier>().toMatchTypeOf<Verifier>();

    await expect(
      new DeterministicStubVerifier().verify(makePacket(), new NodeCryptoHasher()),
    ).resolves.toEqual({ ok: true, reasons: [] });
  });

  it("reports MERKLE_MISMATCH after any selected node digest is altered", async () => {
    const verifier = new DeterministicStubVerifier();
    const hasher = new NodeCryptoHasher();
    const packet = makePacket();

    for (const index of packet.nodeIds.keys()) {
      const tampered = structuredClone(packet);
      tampered.nodeIds[index] = hasher.hash(new TextEncoder().encode(`tampered-${index}`));

      await expect(verifier.verify(tampered, hasher)).resolves.toEqual({
        ok: false,
        reasons: ["MERKLE_MISMATCH"],
      });
    }
  });

  it("reports MERKLE_MISMATCH when either committed root no longer binds the packet", async () => {
    for (const alterRoot of [
      (packet: EvidencePacket) => {
        packet.merkleRoot = "0".repeat(64);
      },
      (packet: EvidencePacket) => {
        packet.attestation.predicate.merkleRoot = "0".repeat(64);
      },
    ]) {
      const packet = makePacket();
      alterRoot(packet);

      await expect(
        new DeterministicStubVerifier().verify(packet, new NodeCryptoHasher()),
      ).resolves.toEqual({ ok: false, reasons: ["MERKLE_MISMATCH"] });
    }
  });

  it("reports SUBJECT_DIGEST_MISMATCH when the attestation subject changes", async () => {
    const packet = makePacket();
    packet.attestation.subject[0]!.digest.sha256 = "0".repeat(64);

    await expect(
      new DeterministicStubVerifier().verify(packet, new NodeCryptoHasher()),
    ).resolves.toEqual({ ok: false, reasons: ["SUBJECT_DIGEST_MISMATCH"] });
  });

  it("returns ATTESTATION_STRUCTURE_MISMATCH for malformed or unbound statement structure", async () => {
    const alterStructure = [
      (packet: EvidencePacket) => {
        packet.attestation._type = "https://example.invalid/Statement";
      },
      (packet: EvidencePacket) => {
        packet.attestation.predicateType = "https://example.invalid/predicate";
      },
      (packet: EvidencePacket) => {
        packet.attestation.predicate.milestoneRef = "different-milestone";
      },
      (packet: EvidencePacket) => {
        (packet.attestation as Partial<Attestation>).subject = undefined;
      },
    ];

    for (const alter of alterStructure) {
      const packet = makePacket();
      alter(packet);

      await expect(
        new DeterministicStubVerifier().verify(packet, new NodeCryptoHasher()),
      ).resolves.toEqual({ ok: false, reasons: ["ATTESTATION_STRUCTURE_MISMATCH"] });
    }
  });
});
