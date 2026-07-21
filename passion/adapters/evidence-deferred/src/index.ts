import type {
  ErasureService,
  ErasureTombstoneStub,
  InclusionProofStub,
  TransparencyLog,
} from "../../../packages/evidence-graph/src/ports.js";

/**
 * NON-PRODUCTION D1 pre-live gate. External transparency-log anchoring is deferred.
 */
export class StubTransparencyLog implements TransparencyLog {
  async anchor(merkleRoot: string): Promise<InclusionProofStub> {
    return {
      root: merkleRoot,
      logIndex: 0,
      proof: [],
      stub: true,
    };
  }

  async verifyInclusion(root: string, proof: InclusionProofStub): Promise<boolean> {
    return (
      proof.stub === true && proof.root === root && proof.logIndex === 0 && proof.proof.length === 0
    );
  }
}

/**
 * NON-PRODUCTION D2 pre-live gate. Real key lifecycle and crypto-shred are deferred.
 */
export class StubErasureService implements ErasureService {
  async shred(subjectKeyRef: string): Promise<ErasureTombstoneStub> {
    return {
      subjectKeyRef,
      shredded: true,
      stub: true,
    };
  }
}
