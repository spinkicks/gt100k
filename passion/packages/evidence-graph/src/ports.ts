import type { EvidenceEdge, EvidenceGraph, EvidenceNode, VerificationResult } from "./model.js";

/** Pure, synchronous content hashing supplied by a runtime adapter. */
export interface Hasher {
  hash(input: Uint8Array): string;
}

/** Asynchronous whole-graph verification supplied by a deterministic or real verifier. */
export interface Verifier {
  verify(graph: EvidenceGraph, hasher: Hasher): Promise<VerificationResult>;
}

/** Persistence boundary for evidence records and per-project graphs (one graph per project). */
export interface EvidenceRepository {
  saveNode(node: EvidenceNode): Promise<void>;
  getNode(id: string): Promise<EvidenceNode | null>;
  saveEdge(edge: EvidenceEdge): Promise<void>;
  /** Persist the whole graph for a project. Erasure = delete everything under `projectId`. */
  saveGraph(projectId: string, graph: EvidenceGraph): Promise<void>;
  getGraph(projectId: string): Promise<EvidenceGraph | null>;
  deleteGraph(projectId: string): Promise<void>;
}

/** Non-production placeholder for a future transparency-log inclusion proof. */
export interface InclusionProofStub {
  root: string;
  logIndex: number;
  proof: string[];
  stub: true;
}

/** Pre-live D1 seam; implementations in this slice must remain deterministic stubs. */
export interface TransparencyLog {
  anchor(merkleRoot: string): Promise<InclusionProofStub>;
  verifyInclusion(root: string, proof: InclusionProofStub): Promise<boolean>;
}

/** Non-production placeholder for a future verifiable crypto-shred tombstone. */
export interface ErasureTombstoneStub {
  subjectKeyRef: string;
  shredded: true;
  stub: true;
}

/** Pre-live D2 seam; real key lifecycle and erasure are deferred. */
export interface ErasureService {
  shred(subjectKeyRef: string): Promise<ErasureTombstoneStub>;
}
