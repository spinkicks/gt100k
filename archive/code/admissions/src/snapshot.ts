import { type Sha256ContentHash, sha256ContentHash } from "../../admissions-contracts/src/hash.js";
import type { ErrorCode } from "../../admissions-contracts/src/registers.js";
import {
  SYNTHETIC_ARTIFACT_FIXTURES,
  SYNTHETIC_NARRATIVE_FIXTURES,
  type SyntheticArtifactFixture,
  type SyntheticArtifactFixtureId,
  type SyntheticNarrativeFixture,
  type SyntheticNarrativeFixtureId,
  TALENT_DOMAIN_CODES,
  TALENT_SNAPSHOT_CONTRACT_VERSION,
  type TalentDomainCode,
} from "../../admissions-contracts/src/snapshot.js";
import type { CogatRoutingDecision } from "./routing.js";

export interface TalentSnapshotRouteChoice {
  readonly route: "artifact" | "narrative";
  readonly automaticScoreAdjustment: 0;
}

interface SubmitTalentSnapshotBase {
  readonly snapshotId: string;
  readonly version: number;
  readonly supersedes: string | null;
  readonly routingDecision: CogatRoutingDecision;
  readonly domains: readonly TalentDomainCode[];
}

export interface SubmitArtifactTalentSnapshotInput extends SubmitTalentSnapshotBase {
  readonly route: "artifact";
  readonly artifactFixtureIds: readonly SyntheticArtifactFixtureId[];
}

export interface SubmitNarrativeTalentSnapshotInput extends SubmitTalentSnapshotBase {
  readonly route: "narrative";
  readonly narrativeFixtureId: SyntheticNarrativeFixtureId;
}

export type SubmitTalentSnapshotInput =
  | SubmitArtifactTalentSnapshotInput
  | SubmitNarrativeTalentSnapshotInput;

interface TalentSnapshotVersionBase {
  readonly snapshotId: string;
  readonly versionId: string;
  readonly version: number;
  readonly supersedes: string | null;
  readonly contractVersion: typeof TALENT_SNAPSHOT_CONTRACT_VERSION;
  readonly locked: true;
  readonly workflowStatus: "snapshot_under_review";
  readonly routingResultHash: Sha256ContentHash;
  readonly automaticScoreAdjustment: 0;
  readonly domains: readonly TalentDomainCode[];
  readonly contentHash: Sha256ContentHash;
}

export interface ArtifactTalentSnapshotVersion extends TalentSnapshotVersionBase {
  readonly route: "artifact";
  readonly evidence: {
    readonly artifactFixtures: readonly SyntheticArtifactFixture[];
  };
}

export interface NarrativeTalentSnapshotVersion extends TalentSnapshotVersionBase {
  readonly route: "narrative";
  readonly evidence: {
    readonly narrativeFixture: SyntheticNarrativeFixture;
  };
}

export type TalentSnapshotVersion = ArtifactTalentSnapshotVersion | NarrativeTalentSnapshotVersion;

type TalentSnapshotErrorCode = Extract<
  ErrorCode,
  "FIXTURE_NOT_ALLOWLISTED" | "NON_SYNTHETIC_INPUT" | "NOT_INVITED" | "VALIDATION_FAILED"
>;

export class TalentSnapshotSubmissionError extends Error {
  readonly code: TalentSnapshotErrorCode;

  constructor(code: TalentSnapshotErrorCode) {
    super(code);
    this.name = "TalentSnapshotSubmissionError";
    this.code = code;
  }
}

export function chooseTalentSnapshotRoute(hasExistingArtifact: boolean): TalentSnapshotRouteChoice {
  return Object.freeze({
    route: hasExistingArtifact ? "artifact" : "narrative",
    automaticScoreAdjustment: 0,
  });
}

function resolveArtifactFixtures(
  fixtureIds: readonly SyntheticArtifactFixtureId[],
): readonly SyntheticArtifactFixture[] {
  if (
    fixtureIds.length < 1 ||
    fixtureIds.length > 2 ||
    new Set(fixtureIds).size !== fixtureIds.length
  ) {
    throw new TalentSnapshotSubmissionError("VALIDATION_FAILED");
  }

  return Object.freeze(
    fixtureIds.map((fixtureId) => {
      const fixture = SYNTHETIC_ARTIFACT_FIXTURES.find(
        (candidate) => candidate.fixtureId === fixtureId,
      );
      if (!fixture) throw new TalentSnapshotSubmissionError("FIXTURE_NOT_ALLOWLISTED");
      return fixture;
    }),
  );
}

function resolveNarrativeFixture(
  fixtureId: SyntheticNarrativeFixtureId,
): SyntheticNarrativeFixture {
  const fixture = SYNTHETIC_NARRATIVE_FIXTURES.find(
    (candidate) => candidate.fixtureId === fixtureId,
  );
  if (!fixture) throw new TalentSnapshotSubmissionError("FIXTURE_NOT_ALLOWLISTED");
  return fixture;
}

function assertSnapshotMetadata(input: SubmitTalentSnapshotInput): void {
  const prohibitedInputKeys = [
    "upload",
    "file",
    "url",
    "path",
    "bytes",
    "childName",
    "dateOfBirth",
    "householdIncome",
    "householdSize",
    "address",
    "zipCode",
    "schoolPrestige",
    "recommenderPrestige",
    "paidEnrichment",
    "awards",
    "accommodationUsed",
    "researchConsent",
  ] as const;
  if (prohibitedInputKeys.some((key) => key in input)) {
    throw new TalentSnapshotSubmissionError("NON_SYNTHETIC_INPUT");
  }

  if (
    input.snapshotId.trim().length === 0 ||
    !Number.isInteger(input.version) ||
    input.version < 1 ||
    (input.supersedes !== null && input.supersedes.trim().length === 0)
  ) {
    throw new TalentSnapshotSubmissionError("VALIDATION_FAILED");
  }

  if (
    input.domains.length < 1 ||
    input.domains.length > 2 ||
    new Set(input.domains).size !== input.domains.length ||
    input.domains.some((domain) => !TALENT_DOMAIN_CODES.includes(domain))
  ) {
    throw new TalentSnapshotSubmissionError("VALIDATION_FAILED");
  }
}

export function submitTalentSnapshot(input: SubmitTalentSnapshotInput): TalentSnapshotVersion {
  assertSnapshotMetadata(input);
  if (input.routingDecision.trackBInvitationOutcome !== "invited") {
    throw new TalentSnapshotSubmissionError("NOT_INVITED");
  }

  const domains = Object.freeze([...input.domains]);
  if (input.route === "artifact") {
    const artifactFixtures = resolveArtifactFixtures(input.artifactFixtureIds);
    if (artifactFixtures.some((fixture) => !domains.includes(fixture.domainCode))) {
      throw new TalentSnapshotSubmissionError("VALIDATION_FAILED");
    }
    const evidence = Object.freeze({
      artifactFixtures,
    });
    const content = Object.freeze({
      contractVersion: TALENT_SNAPSHOT_CONTRACT_VERSION,
      routingResultHash: input.routingDecision.resultHash,
      route: input.route,
      automaticScoreAdjustment: 0 as const,
      domains,
      evidence,
    });

    return Object.freeze({
      snapshotId: input.snapshotId,
      versionId: `${input.snapshotId}:v${input.version}`,
      version: input.version,
      supersedes: input.supersedes,
      locked: true,
      workflowStatus: "snapshot_under_review",
      ...content,
      contentHash: sha256ContentHash(content),
    });
  }

  const evidence = Object.freeze({
    narrativeFixture: resolveNarrativeFixture(input.narrativeFixtureId),
  });
  if (!domains.includes(evidence.narrativeFixture.domainCode)) {
    throw new TalentSnapshotSubmissionError("VALIDATION_FAILED");
  }
  const content = Object.freeze({
    contractVersion: TALENT_SNAPSHOT_CONTRACT_VERSION,
    routingResultHash: input.routingDecision.resultHash,
    route: input.route,
    automaticScoreAdjustment: 0 as const,
    domains,
    evidence,
  });

  return Object.freeze({
    snapshotId: input.snapshotId,
    versionId: `${input.snapshotId}:v${input.version}`,
    version: input.version,
    supersedes: input.supersedes,
    locked: true,
    workflowStatus: "snapshot_under_review",
    ...content,
    contentHash: sha256ContentHash(content),
  });
}
