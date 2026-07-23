import { graphMerkleRoot } from "./merkle.js";
import type { Attestation, EvidenceGraph } from "./model.js";
import type { Hasher } from "./ports.js";

const IN_TOTO_STATEMENT_TYPE = "https://in-toto.io/Statement/v1";
const EVIDENCE_PREDICATE_TYPE = "https://gt100k.dev/attestations/evidence/v1";
const SUBJECT_NAME = "artifact";
const BUILDER_ID = "gt100k-evidence-graph";
const MATERIAL_URI_PREFIX = "urn:gt100k:evidence:node:";

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

export interface GraphAttestationInput {
  /** Stable per-project reference (kept in the attestation's `milestoneRef` field for shape compatibility). */
  projectRef: string;
  /** Content id of the released artifact node this graph attests to. */
  subjectDigest: string;
}

/**
 * Builds the unsigned in-toto Statement for a whole project graph (one graph per project): the
 * Merkle root is derived from every node (via `graphMerkleRoot`), materials are the Artifact node
 * ids, and the subject binds the released artifact. Signing is deferred (§19.2 D6).
 */
export function buildGraphAttestation(
  graph: EvidenceGraph,
  { projectRef, subjectDigest }: GraphAttestationInput,
  hasher: Hasher,
): Attestation {
  const artifactIds = Object.values(graph.nodes)
    .filter((node) => node.type === "Artifact")
    .map((node) => node.id)
    .sort();

  return buildAttestation({
    subjectDigest,
    merkleRoot: graphMerkleRoot(graph, hasher),
    milestoneRef: projectRef,
    builder: { id: BUILDER_ID },
    materials: artifactIds.map((id) => ({
      uri: `${MATERIAL_URI_PREFIX}${id}`,
      digest: { sha256: id },
    })),
  });
}
