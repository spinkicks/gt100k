import type { ForbiddenPurpose } from "./hypothesis";

export interface PurposeGuardAudit {
  decision: "DENY";
  purpose: ForbiddenPurpose;
  reasonCode: "FORBIDDEN_PURPOSE";
}

/** Structured denial that a caller can persist in its audit stream. */
export class PurposeGuardDeniedError extends Error {
  readonly code = "PURPOSE_DENIED";
  readonly audit: PurposeGuardAudit;

  constructor(readonly purpose: ForbiddenPurpose) {
    super(`read denied for forbidden purpose: ${purpose}`);
    this.name = "PurposeGuardDeniedError";
    this.audit = {
      decision: "DENY",
      purpose,
      reasonCode: "FORBIDDEN_PURPOSE",
    };
  }
}

/** Every purpose in this boundary is forbidden, so the guard always fails closed. */
export function guardRead(purpose: ForbiddenPurpose): never {
  throw new PurposeGuardDeniedError(purpose);
}

export const SOLO_PROOF_KINDS = ["EXPLANATION", "EXTENSION", "TRACEABLE_CONTRIBUTION"] as const;

export type SoloProofKind = (typeof SOLO_PROOF_KINDS)[number];

export interface SoloProof {
  kind: SoloProofKind;
  evidenceRef: string;
}

export interface TeamArtifactEvidence {
  artifactRef: string;
  learnerRef: string;
  source: "TEAM";
}

export interface IndividualArtifactEvidence extends TeamArtifactEvidence {
  credit: "INDIVIDUAL";
  soloProof: SoloProof;
}

export class TeamArtifactProofRequiredError extends Error {
  readonly code = "SOLO_PROOF_REQUIRED";

  constructor(readonly artifactRef: string) {
    super(`solo proof is required for individual credit: ${artifactRef}`);
    this.name = "TeamArtifactProofRequiredError";
  }
}

export function promoteTeamArtifact(
  evidence: TeamArtifactEvidence,
  soloProof?: SoloProof,
): IndividualArtifactEvidence {
  if (
    soloProof === undefined ||
    !SOLO_PROOF_KINDS.includes(soloProof.kind) ||
    soloProof.evidenceRef.trim().length === 0
  ) {
    throw new TeamArtifactProofRequiredError(evidence.artifactRef);
  }

  return {
    ...evidence,
    credit: "INDIVIDUAL",
    soloProof: { ...soloProof },
  };
}

export const ARTIFACT_TRANSITION_KINDS = [
  "CREATED",
  "REVISED",
  "TESTED",
  "EXPLAINED",
  "EXTENDED",
] as const;

export type ArtifactTransitionKind = (typeof ARTIFACT_TRANSITION_KINDS)[number];

export interface ArtifactTransition {
  artifactRef: string;
  learnerRef: string;
  transition: ArtifactTransitionKind;
  dayOffset: number;
}

const ARTIFACT_TRANSITION_FIELDS = new Set([
  "artifactRef",
  "learnerRef",
  "transition",
  "dayOffset",
]);

export class ArtifactSignalRejectedError extends Error {
  readonly code = "ARTIFACT_SIGNAL_REJECTED";

  constructor(message: string) {
    super(message);
    this.name = "ArtifactSignalRejectedError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strictly projects an untrusted adapter payload to the coarse PASS-007 shape. */
export function acceptArtifactSignal(payload: unknown): ArtifactTransition {
  if (!isRecord(payload)) {
    throw new ArtifactSignalRejectedError("invalid coarse artifact transition");
  }

  const keys = Reflect.ownKeys(payload);
  if (keys.some((key) => typeof key !== "string" || !ARTIFACT_TRANSITION_FIELDS.has(key))) {
    throw new ArtifactSignalRejectedError("raw or unrelated artifact content is prohibited");
  }

  if (
    keys.length !== ARTIFACT_TRANSITION_FIELDS.size ||
    typeof payload.artifactRef !== "string" ||
    payload.artifactRef.trim().length === 0 ||
    typeof payload.learnerRef !== "string" ||
    payload.learnerRef.trim().length === 0 ||
    typeof payload.transition !== "string" ||
    !ARTIFACT_TRANSITION_KINDS.includes(payload.transition as ArtifactTransitionKind) ||
    typeof payload.dayOffset !== "number" ||
    !Number.isInteger(payload.dayOffset) ||
    payload.dayOffset < 0
  ) {
    throw new ArtifactSignalRejectedError("invalid coarse artifact transition");
  }

  return {
    artifactRef: payload.artifactRef,
    learnerRef: payload.learnerRef,
    transition: payload.transition as ArtifactTransitionKind,
    dayOffset: payload.dayOffset,
  };
}
