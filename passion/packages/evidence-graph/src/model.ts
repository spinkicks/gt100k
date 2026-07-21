/** Closed evidence-node taxonomy from PRD §19. */
export const NODE_TYPES = [
  "Artifact",
  "Attempt",
  "Transformation",
  "Claim",
  "Assistance",
  "Review",
  "Contribution",
  "Outcome",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

/** W3C PROV bases recorded by the domain taxonomy; this is not a serializer. */
export const NODE_TYPE_PROV_BASE = {
  Artifact: "Entity",
  Attempt: "Activity",
  Transformation: "Activity",
  Claim: "Entity",
  Assistance: "Activity",
  Review: "Activity",
  Contribution: "Activity (Association)",
  Outcome: "Entity",
} as const satisfies Record<NodeType, "Entity" | "Activity" | "Activity (Association)">;

/** Closed evidence-edge taxonomy from PRD §19. */
export const EDGE_TYPES = [
  "derived_from",
  "authored_by",
  "used_tool",
  "validates",
  "contradicts",
  "released_as",
] as const;

export type EdgeType = (typeof EDGE_TYPES)[number];

/** Approximate W3C PROV relations for the domain edge taxonomy. */
export const EDGE_TYPE_PROV_RELATION = {
  derived_from: "wasDerivedFrom",
  authored_by: "wasAttributedTo / wasAssociatedWith",
  used_tool: "used",
  validates: "wasInfluencedBy (+)",
  contradicts: "wasInfluencedBy (−)",
  released_as: "wasDerivedFrom / specializationOf",
} as const satisfies Record<EdgeType, string>;

export const ACTOR_KINDS = ["human", "model", "tool", "system"] as const;

export type ActorKind = (typeof ACTOR_KINDS)[number];

/** Pseudonymous actor reference; real PII is outside this feature. */
export interface ActorRef {
  kind: ActorKind;
  ref: string;
  displayName?: string;
}

export interface ToolRef {
  name: string;
  version: string;
}

/** Carried scope metadata only; no consent decision is made in this feature. */
export interface ConsentScope {
  scope: string;
  purpose?: string;
}

/** A content-addressed provenance record. Its id is derived from every other field. */
export interface EvidenceNode {
  id: string;
  type: NodeType;
  actor: ActorRef;
  tool?: ToolRef;
  inputs: string[];
  timestamp: string;
  consentScope: ConsentScope;
  payload: Record<string, unknown>;
}

export interface EvidenceEdge {
  type: EdgeType;
  from: string;
  to: string;
  label?: string;
}

export interface EvidenceGraph {
  nodes: Record<string, EvidenceNode>;
  edges: EvidenceEdge[];
}

export interface Attestation {
  _type: string;
  predicateType: string;
  subject: Array<{
    name: string;
    digest: { sha256: string };
  }>;
  predicate: {
    builder: { id: string };
    materials: Array<{
      uri: string;
      digest: { sha256: string };
    }>;
    merkleRoot: string;
    milestoneRef: string;
  };
}

export interface EvidencePacket {
  milestoneRef: string;
  subjectDigest: string;
  nodeIds: string[];
  merkleRoot: string;
  artifactHashes: string[];
  failedBranches: string[];
  assistanceLedger: string[];
  contributionMap: Record<string, string[]>;
  reviewAnchors: string[];
  outcomes: string[];
  attestation: Attestation;
}

/** Machine-readable validation result; not persisted. */
export interface VerificationResult {
  ok: boolean;
  reasons: string[];
}
