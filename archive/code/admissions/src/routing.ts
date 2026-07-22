import { type Sha256ContentHash, sha256ContentHash } from "../../admissions-contracts/src/hash.js";
import type {
  ReasonCode,
  TrackAOutcome,
  TrackBInvitationOutcome,
  WorkflowStatus,
} from "../../admissions-contracts/src/registers.js";
import { COGAT_INSTRUMENT, type RoutingPolicy } from "../../admissions-contracts/src/routing.js";

export type CogatValidity = "pending" | "valid" | "invalid";

export interface CogatScores {
  readonly composite: number | null;
  readonly verbal: number | null;
  readonly quantitative: number | null;
  readonly nonverbal: number | null;
}

export interface CreateCogatAssessmentVersionInput {
  readonly versionId: string;
  readonly version: number;
  readonly supersedes: string | null;
  readonly validity: CogatValidity;
  readonly locked: boolean;
  readonly scores: CogatScores;
}

export interface CogatAssessmentVersion extends CreateCogatAssessmentVersionInput {
  readonly instrument: typeof COGAT_INSTRUMENT;
  readonly contentHash: Sha256ContentHash;
}

export interface CogatRoutingInput {
  readonly assessment: CogatAssessmentVersion;
  readonly policy: RoutingPolicy;
  readonly trackBEnabled: boolean;
}

export interface CogatRoutingDecision {
  readonly assessmentVersionId: string;
  readonly policyBundleId: string;
  readonly trackAOutcome: TrackAOutcome;
  readonly trackBInvitationOutcome: TrackBInvitationOutcome;
  readonly workflowStatus: WorkflowStatus;
  readonly reasonCodes: readonly ReasonCode[];
  readonly resultHash: Sha256ContentHash;
}

function assertAssessmentMetadata(input: CreateCogatAssessmentVersionInput): void {
  if (input.versionId.trim().length === 0) {
    throw new TypeError("versionId must be non-empty");
  }
  if (!Number.isInteger(input.version) || input.version < 1) {
    throw new TypeError("version must be a positive integer");
  }
  if (input.supersedes !== null && input.supersedes.trim().length === 0) {
    throw new TypeError("supersedes must be null or a non-empty versionId");
  }

  for (const [name, score] of Object.entries(input.scores)) {
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) {
      throw new TypeError(`${name} must be null or a finite score from 0 through 100`);
    }
  }
}

export function createCogatAssessmentVersion(
  input: CreateCogatAssessmentVersionInput,
): CogatAssessmentVersion {
  assertAssessmentMetadata(input);
  const scores = Object.freeze({
    composite: input.scores.composite,
    verbal: input.scores.verbal,
    quantitative: input.scores.quantitative,
    nonverbal: input.scores.nonverbal,
  });
  const contentHash = sha256ContentHash({
    instrument: COGAT_INSTRUMENT,
    scores,
    validity: input.validity,
  });

  return Object.freeze({
    versionId: input.versionId,
    version: input.version,
    supersedes: input.supersedes,
    validity: input.validity,
    locked: input.locked,
    scores,
    instrument: COGAT_INSTRUMENT,
    contentHash,
  });
}

interface RoutingOutcome {
  readonly trackAOutcome: TrackAOutcome;
  readonly trackBInvitationOutcome: TrackBInvitationOutcome;
  readonly workflowStatus: WorkflowStatus;
  readonly reasonCodes: readonly ReasonCode[];
}

function buildDecision(
  input: CogatRoutingInput,
  outcome: RoutingOutcome,
  evaluatedPolicy: object,
): CogatRoutingDecision {
  const reasonCodes = Object.freeze([...outcome.reasonCodes]);
  const frozenOutcome = Object.freeze({ ...outcome, reasonCodes });
  const resultHash = sha256ContentHash({
    assessment: {
      contentHash: input.assessment.contentHash,
      locked: input.assessment.locked,
      version: input.assessment.version,
      versionId: input.assessment.versionId,
    },
    decisionKind: "cogat_routing",
    outcome: frozenOutcome,
    policy: evaluatedPolicy,
  });

  return Object.freeze({
    assessmentVersionId: input.assessment.versionId,
    policyBundleId: input.policy.policyBundleId,
    ...frozenOutcome,
    resultHash,
  });
}

export function routeCogatAssessment(input: CogatRoutingInput): CogatRoutingDecision {
  const { assessment, policy } = input;
  const trackAPolicy = {
    policyBundleId: policy.policyBundleId,
    trackACutoff: policy.trackACutoff,
  };

  if (
    assessment.validity !== "valid" ||
    !assessment.locked ||
    assessment.scores.composite === null
  ) {
    return buildDecision(
      input,
      {
        trackAOutcome: "pending",
        trackBInvitationOutcome: "pending",
        workflowStatus: "assessment_needs_correction",
        reasonCodes: ["ASSESSMENT_MISSING_OR_INVALID"],
      },
      trackAPolicy,
    );
  }

  if (assessment.scores.composite >= policy.trackACutoff) {
    return buildDecision(
      input,
      {
        trackAOutcome: "eligible",
        trackBInvitationOutcome: "not_applicable",
        workflowStatus: "track_a_eligible",
        reasonCodes: ["TA_MET_CONFIGURED_BOUNDARY"],
      },
      trackAPolicy,
    );
  }

  if (!input.trackBEnabled) {
    return buildDecision(
      input,
      {
        trackAOutcome: "not_eligible",
        trackBInvitationOutcome: "not_applicable",
        workflowStatus: "no_current_pathway",
        reasonCodes: ["TA_BELOW_CONFIGURED_BOUNDARY"],
      },
      { ...trackAPolicy, trackBEnabled: false },
    );
  }

  const inCompositeBand =
    assessment.scores.composite >= policy.trackBPromisingBand.minimumInclusive &&
    assessment.scores.composite < policy.trackBPromisingBand.maximumExclusive;
  const hasStrongBattery = [
    assessment.scores.verbal,
    assessment.scores.quantitative,
    assessment.scores.nonverbal,
  ].some((score) => score !== null && score >= policy.trackBStrongBatteryCutoff);
  const reasonCodes: ReasonCode[] = ["TA_BELOW_CONFIGURED_BOUNDARY"];
  if (inCompositeBand) reasonCodes.push("TB_COMPOSITE_BAND");
  if (hasStrongBattery) reasonCodes.push("TB_BATTERY_PROFILE");
  const invited = inCompositeBand || hasStrongBattery;
  reasonCodes.push(invited ? "SNAPSHOT_REQUIRED" : "TB_OUTSIDE_CONFIGURED_RULE");

  return buildDecision(
    input,
    {
      trackAOutcome: "not_eligible",
      trackBInvitationOutcome: invited ? "invited" : "not_invited",
      workflowStatus: invited ? "track_b_snapshot_required" : "no_current_pathway",
      reasonCodes,
    },
    {
      policyBundleId: policy.policyBundleId,
      trackACutoff: policy.trackACutoff,
      trackBPromisingBand: {
        minimumInclusive: policy.trackBPromisingBand.minimumInclusive,
        maximumExclusive: policy.trackBPromisingBand.maximumExclusive,
      },
      trackBStrongBatteryCutoff: policy.trackBStrongBatteryCutoff,
      trackBEnabled: true,
    },
  );
}
