import {
  buildAttestation,
  buildGraphAttestation,
  graphMerkleRoot,
  merkleRoot,
  orderedGraphNodeIds,
  traceEvidence,
} from "@gt100k/evidence-graph";
import { describe, expect, it } from "vitest";

describe("EvidenceGraph P3 public API", () => {
  it("exports the Merkle, graph-root, attestation, and trace functions", () => {
    expect(merkleRoot).toBeTypeOf("function");
    expect(orderedGraphNodeIds).toBeTypeOf("function");
    expect(graphMerkleRoot).toBeTypeOf("function");
    expect(buildAttestation).toBeTypeOf("function");
    expect(buildGraphAttestation).toBeTypeOf("function");
    expect(traceEvidence).toBeTypeOf("function");
  });
});
