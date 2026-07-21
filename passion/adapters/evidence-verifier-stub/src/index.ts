import { merkleRoot } from "../../../packages/evidence-graph/src/merkle.js";
import type {
  Attestation,
  EvidencePacket,
  VerificationResult,
} from "../../../packages/evidence-graph/src/model.js";
import type { Hasher, Verifier } from "../../../packages/evidence-graph/src/ports.js";

const IN_TOTO_STATEMENT_TYPE = "https://in-toto.io/Statement/v1";
const EVIDENCE_PREDICATE_TYPE = "https://gt100k.dev/attestations/evidence/v1";
const ATTESTATION_STRUCTURE_MISMATCH = "ATTESTATION_STRUCTURE_MISMATCH";
const MERKLE_MISMATCH = "MERKLE_MISMATCH";
const SUBJECT_DIGEST_MISMATCH = "SUBJECT_DIGEST_MISMATCH";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasDigest(value: unknown): boolean {
  return isRecord(value) && typeof value.sha256 === "string";
}

function hasAttestationStructure(value: unknown): value is Attestation {
  if (!isRecord(value) || !isRecord(value.predicate)) {
    return false;
  }

  const { predicate } = value;
  return (
    value._type === IN_TOTO_STATEMENT_TYPE &&
    value.predicateType === EVIDENCE_PREDICATE_TYPE &&
    Array.isArray(value.subject) &&
    value.subject.every(
      (subject) =>
        isRecord(subject) && typeof subject.name === "string" && hasDigest(subject.digest),
    ) &&
    isRecord(predicate.builder) &&
    typeof predicate.builder.id === "string" &&
    Array.isArray(predicate.materials) &&
    predicate.materials.every(
      (material) =>
        isRecord(material) && typeof material.uri === "string" && hasDigest(material.digest),
    ) &&
    typeof predicate.merkleRoot === "string" &&
    typeof predicate.milestoneRef === "string"
  );
}

function hasSubjectBinding(packet: EvidencePacket, attestation: Attestation): boolean {
  return (
    attestation.subject.length > 0 &&
    attestation.subject.every((subject) => subject.digest.sha256 === packet.subjectDigest)
  );
}

function addReason(reasons: string[], reason: string): void {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

/** Deterministic unsigned verifier stub; real WASI and signature checks remain deferred. */
export class DeterministicStubVerifier implements Verifier {
  async verify(packet: EvidencePacket, hasher: Hasher): Promise<VerificationResult> {
    const reasons: string[] = [];
    const attestation: unknown = packet.attestation;
    const validAttestation =
      hasAttestationStructure(attestation) &&
      attestation.predicate.milestoneRef === packet.milestoneRef;

    if (!validAttestation) {
      addReason(reasons, ATTESTATION_STRUCTURE_MISMATCH);
    }

    try {
      const derivedRoot = merkleRoot(packet.nodeIds, hasher);
      if (derivedRoot !== packet.merkleRoot) {
        addReason(reasons, MERKLE_MISMATCH);
      }
      if (validAttestation && derivedRoot !== attestation.predicate.merkleRoot) {
        addReason(reasons, MERKLE_MISMATCH);
      }
    } catch {
      addReason(reasons, MERKLE_MISMATCH);
    }

    if (validAttestation && !hasSubjectBinding(packet, attestation)) {
      addReason(reasons, SUBJECT_DIGEST_MISMATCH);
    }

    return { ok: reasons.length === 0, reasons };
  }
}
