import { canonicalize } from "../../evidence-graph/src/index.js";

import { coverageFromTranscript, getGaps, isSessionComplete } from "./engine.js";
import type { CoverageByFacet, Facet, TranscriptTurn } from "./model.js";
import type { InterviewSession } from "./session.js";

export interface PassionTutorEvidenceRecord {
  readonly studentId: string;
  readonly projectId: string;
  readonly transcript: readonly TranscriptTurn[];
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly createdAt: string;
}

export interface EvidenceRecordEmission {
  readonly record: PassionTutorEvidenceRecord;
  readonly canonicalJson: string;
  readonly contentHash: string;
}

export interface ContentHasher {
  hash(input: Uint8Array): string;
}

export interface EmitEvidenceRecordInput {
  readonly session: InterviewSession;
  readonly createdAt: string;
  readonly hasher: ContentHasher;
}

export function emitEvidenceRecord({
  session,
  createdAt,
  hasher,
}: EmitEvidenceRecordInput): EvidenceRecordEmission {
  if (!isSessionComplete(session.transcript)) throw new Error("SESSION_INCOMPLETE");

  const transcript = [...session.transcript];
  const coverageByFacet = coverageFromTranscript(transcript);
  const record: PassionTutorEvidenceRecord = {
    studentId: session.profile.studentId,
    projectId: session.profile.id,
    transcript,
    coverageByFacet,
    gaps: getGaps(coverageByFacet),
    createdAt,
  };
  const canonicalJson = canonicalize(record);

  return {
    record,
    canonicalJson,
    contentHash: hasher.hash(new TextEncoder().encode(canonicalJson)),
  };
}
