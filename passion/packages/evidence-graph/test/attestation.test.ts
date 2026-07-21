import { describe, expect, it } from "vitest";

import { buildAttestation } from "../src/attestation.js";

const GOLDEN_SUBJECT_DIGEST = "fa6cc759cb3564394df561e6d4d2e9fe9ad76568ee10e37d22a83539bc3f6958";
const MERKLE_ROOT = "3c7f4d3c2a824ad9df7bbf211d8ebd3f1e2086ce2f5b0aea27f8bc994dea441c";

describe("buildAttestation", () => {
  it("binds the golden subject digest and Merkle root in an in-toto Statement", () => {
    const attestation = buildAttestation({
      subjectDigest: GOLDEN_SUBJECT_DIGEST,
      merkleRoot: MERKLE_ROOT,
      milestoneRef: "milestone-synthetic-001",
      builder: { id: "gt100k-evidence-graph" },
      materials: [
        {
          uri: "urn:gt100k:evidence:node:artifact-synthetic-001",
          digest: { sha256: "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039" },
        },
      ],
    });

    expect(attestation).toEqual({
      _type: "https://in-toto.io/Statement/v1",
      predicateType: "https://gt100k.dev/attestations/evidence/v1",
      subject: [{ name: "artifact", digest: { sha256: GOLDEN_SUBJECT_DIGEST } }],
      predicate: {
        builder: { id: "gt100k-evidence-graph" },
        materials: [
          {
            uri: "urn:gt100k:evidence:node:artifact-synthetic-001",
            digest: {
              sha256: "facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039",
            },
          },
        ],
        merkleRoot: MERKLE_ROOT,
        milestoneRef: "milestone-synthetic-001",
      },
    });
  });
});
