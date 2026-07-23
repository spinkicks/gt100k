import type { EvidenceRecord, Session, Hasher } from "./model.js";
import { canonicalize } from "@gt100k/evidence-graph";

export function assembleEvidenceRecord(session: Session, createdAt: string, hasher: Hasher): EvidenceRecord {
  const base = {
    studentId: session.profile.studentId,
    projectId: session.profile.id,
    title: session.profile.title,
    domain: session.profile.domain,
    readinessLevel: session.readinessLevel,
    turns: session.turns,
    coverageByFacet: session.coverageByFacet,
    gaps: session.gaps,
    createdAt,
  };
  const contentHash = hasher.hash(new TextEncoder().encode(canonicalize(base)));
  return { ...base, contentHash };
}

export interface EvidenceNodeLike {
  readonly type: "Artifact";
  readonly actor: { readonly kind: "human"; readonly ref: string };
  readonly tool: { readonly name: string; readonly version: string };
  readonly inputs: readonly string[];
  readonly timestamp: string;
  readonly consentScope: { readonly scope: string };
  readonly payload: Readonly<Record<string, unknown>>;
}

export function toEvidenceNode(record: EvidenceRecord): EvidenceNodeLike {
  return {
    type: "Artifact",
    actor: { kind: "human", ref: record.studentId },
    tool: { name: "socratic-defense", version: "0.1.0" },
    inputs: [],
    timestamp: record.createdAt,
    consentScope: { scope: "synthetic" },
    payload: { recordHash: record.contentHash, gaps: record.gaps, coverageByFacet: record.coverageByFacet },
  };
}
