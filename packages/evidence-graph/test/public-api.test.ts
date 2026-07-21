import {
  assembleEvidencePacket,
  buildAttestation,
  merkleRoot,
  traceEvidence,
} from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

describe("EvidenceGraph P3 public API", () => {
  it("exports the Merkle, attestation, and packet functions", () => {
    expect(merkleRoot).toBeTypeOf("function");
    expect(buildAttestation).toBeTypeOf("function");
    expect(assembleEvidencePacket).toBeTypeOf("function");
    expect(traceEvidence).toBeTypeOf("function");
  });
});
