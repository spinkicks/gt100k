import type { Attestation } from "./model.js";

const IN_TOTO_STATEMENT_TYPE = "https://in-toto.io/Statement/v1";
const EVIDENCE_PREDICATE_TYPE = "https://gt100k.dev/attestations/evidence/v1";
const SUBJECT_NAME = "artifact";

export interface BuildAttestationInput {
  subjectDigest: string;
  merkleRoot: string;
  milestoneRef: string;
  builder: Attestation["predicate"]["builder"];
  materials: Attestation["predicate"]["materials"];
}

/** Builds the unsigned in-toto Statement used by this synthetic feature slice. */
export function buildAttestation({
  subjectDigest,
  merkleRoot,
  milestoneRef,
  builder,
  materials,
}: BuildAttestationInput): Attestation {
  return {
    _type: IN_TOTO_STATEMENT_TYPE,
    predicateType: EVIDENCE_PREDICATE_TYPE,
    subject: [{ name: SUBJECT_NAME, digest: { sha256: subjectDigest } }],
    predicate: {
      builder: { id: builder.id },
      materials: materials.map(({ uri, digest }) => ({
        uri,
        digest: { sha256: digest.sha256 },
      })),
      merkleRoot,
      milestoneRef,
    },
  };
}
