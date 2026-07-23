import { describe, expect, expectTypeOf, it } from "vitest";

import type {
  EvidenceEdge,
  EvidenceGraph,
  EvidenceNode,
  VerificationResult,
} from "../src/model.js";
import type {
  ErasureService,
  ErasureTombstoneStub,
  EvidenceRepository,
  Hasher,
  InclusionProofStub,
  TransparencyLog,
  Verifier,
} from "../src/ports.js";

describe("EvidenceGraph ports", () => {
  it("keeps hashing synchronous and verification asynchronous", () => {
    expectTypeOf<Hasher>().toEqualTypeOf<{
      hash(input: Uint8Array): string;
    }>();
    expectTypeOf<Verifier>().toEqualTypeOf<{
      verify(graph: EvidenceGraph, hasher: Hasher): Promise<VerificationResult>;
    }>();

    const hasher: Hasher = {
      hash: (input) => `synthetic-${input.byteLength}`,
    };
    expect(hasher.hash(new Uint8Array([1, 2, 3]))).toBe("synthetic-3");
  });

  it("defines the complete asynchronous repository contract with per-project graphs", () => {
    expectTypeOf<EvidenceRepository>().toEqualTypeOf<{
      saveNode(node: EvidenceNode): Promise<void>;
      getNode(id: string): Promise<EvidenceNode | null>;
      saveEdge(edge: EvidenceEdge): Promise<void>;
      saveGraph(projectId: string, graph: EvidenceGraph): Promise<void>;
      getGraph(projectId: string): Promise<EvidenceGraph | null>;
      deleteGraph(projectId: string): Promise<void>;
    }>();
  });

  it("marks deferred transparency and erasure results as literal stubs", () => {
    expectTypeOf<InclusionProofStub>().toEqualTypeOf<{
      root: string;
      logIndex: number;
      proof: string[];
      stub: true;
    }>();
    expectTypeOf<ErasureTombstoneStub>().toEqualTypeOf<{
      subjectKeyRef: string;
      shredded: true;
      stub: true;
    }>();
    expectTypeOf<TransparencyLog>().toEqualTypeOf<{
      anchor(merkleRoot: string): Promise<InclusionProofStub>;
      verifyInclusion(root: string, proof: InclusionProofStub): Promise<boolean>;
    }>();
    expectTypeOf<ErasureService>().toEqualTypeOf<{
      shred(subjectKeyRef: string): Promise<ErasureTombstoneStub>;
    }>();

    const proof = {
      root: "synthetic-root",
      logIndex: 0,
      proof: [],
      stub: true,
    } satisfies InclusionProofStub;
    const tombstone = {
      subjectKeyRef: "synthetic-key-ref",
      shredded: true,
      stub: true,
    } satisfies ErasureTombstoneStub;

    expect(proof.stub).toBe(true);
    expect(tombstone).toMatchObject({ shredded: true, stub: true });
  });
});
