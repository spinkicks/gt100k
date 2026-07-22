import {
  ADMISSION_CONTRACT_VERSION,
  APPLICANT_DECISION_MESSAGES,
  type AdmissionOutcome,
  type AdmissionPathway,
  type AidAllotmentOutcome,
  type ApplicantDecisionMessageCode,
  type ResearchInvitationState,
  type SyntheticAdmissionPolicy,
} from "../../admissions-contracts/src/admission.js";
import {
  SYNTHETIC_FINANCE_FIXTURES,
  type SyntheticFinanceFixture,
  type SyntheticFinanceFixtureId,
} from "../../admissions-contracts/src/allocation.js";
import {
  type Sha256ContentHash,
  canonicalize,
  sha256ContentHash,
} from "../../admissions-contracts/src/hash.js";
import type { ApplicantAllocation, LockedIncomeBandedLotteryDraw } from "./allocation.js";
import { replayIncomeBandedLottery } from "./allocation.js";
import type { BlindReviewDecision } from "./review.js";
import type { CogatRoutingDecision } from "./routing.js";

export interface TrackAAdmissionSource {
  readonly kind: "track_a_automatic";
  readonly routingDecision: CogatRoutingDecision;
  readonly financeFixtureId: SyntheticFinanceFixtureId;
}

export interface TrackBAllocationAdmissionSource {
  readonly kind: "track_b_allocation";
  readonly reviewDecision: BlindReviewDecision;
  readonly allocationDraw: LockedIncomeBandedLotteryDraw;
}

export interface TrackBNotEligibleAdmissionSource {
  readonly kind: "track_b_review_not_eligible";
  readonly reviewDecision: BlindReviewDecision;
}

export type AdmissionDecisionSource =
  | TrackAAdmissionSource
  | TrackBAllocationAdmissionSource
  | TrackBNotEligibleAdmissionSource;

export interface AdmissionDecisionInput {
  readonly applicationId: string;
  readonly decidedAt: string;
  readonly policy: SyntheticAdmissionPolicy;
  readonly source: AdmissionDecisionSource;
}

export interface RetainedAdmissionInput {
  readonly applicationId: string;
  readonly decidedAt: string;
  readonly source: AdmissionDecisionSource;
}

export interface FinalAdmissionDecision {
  readonly contractVersion: typeof ADMISSION_CONTRACT_VERSION;
  readonly decisionId: string;
  readonly locked: true;
  readonly pathway: AdmissionPathway;
  readonly admissionOutcome: AdmissionOutcome;
  readonly aid: {
    readonly outcome: AidAllotmentOutcome;
    readonly annualAidCents: number | null;
    readonly currency: "USD";
  };
  readonly researchInvitation: {
    readonly state: ResearchInvitationState;
    readonly nextCycleFeeWaiverCents: number | null;
    readonly voluntary: true;
    readonly affectsFutureAdmissions: false;
  };
  readonly applicantMessage: {
    readonly code: ApplicantDecisionMessageCode;
    readonly body: string;
  };
  readonly sourceResultHashes: {
    readonly routing: Sha256ContentHash | null;
    readonly review: Sha256ContentHash | null;
    readonly allocation: Sha256ContentHash | null;
  };
  readonly policy: SyntheticAdmissionPolicy;
  readonly policyHash: Sha256ContentHash;
  readonly retainedInput: RetainedAdmissionInput;
  readonly inputHash: Sha256ContentHash;
  readonly humanOwnerId: string;
  readonly decisionExpiresAt: string;
  readonly resultHash: Sha256ContentHash;
}

export class AdmissionDecisionError extends Error {
  readonly code:
    | "FIXTURE_NOT_ALLOWLISTED"
    | "INPUT_HASH_MISMATCH"
    | "NON_SYNTHETIC_INPUT"
    | "POLICY_HASH_MISMATCH"
    | "VALIDATION_FAILED";

  constructor(code: AdmissionDecisionError["code"]) {
    super(code);
    this.name = "AdmissionDecisionError";
    this.code = code;
  }
}

const PROHIBITED_DIRECT_KEYS = [
  "accommodationUsed",
  "address",
  "awards",
  "childName",
  "dateOfBirth",
  "demographics",
  "disciplineHistory",
  "disability",
  "familyStructure",
  "gender",
  "homeLanguage",
  "householdIncome",
  "householdSize",
  "paidEnrichment",
  "priorGtRelative",
  "proseQuality",
  "recommenderPrestige",
  "referralSource",
  "researchConsent",
  "schoolPrestige",
  "withdrawalHistory",
  "zipCode",
] as const;

function deepFreeze<Value>(value: Value): Value {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function detachedSnapshot<Value>(value: Value): Value {
  return deepFreeze(JSON.parse(canonicalize(value)) as Value);
}

function assertNoProhibitedContext(value: object): void {
  if (PROHIBITED_DIRECT_KEYS.some((key) => key in value)) {
    throw new AdmissionDecisionError("NON_SYNTHETIC_INPUT");
  }
}

function assertSyntheticId(value: string): void {
  if (!value.includes("-syn-") || value.trim() !== value) {
    throw new AdmissionDecisionError("NON_SYNTHETIC_INPUT");
  }
}

function assertPolicy(policy: SyntheticAdmissionPolicy): void {
  assertNoProhibitedContext(policy);
  assertSyntheticId(policy.policyBundleId);
  assertSyntheticId(policy.humanOwnerId);
  const knownFixtureIds = new Set(SYNTHETIC_FINANCE_FIXTURES.map(({ fixtureId }) => fixtureId));
  const configuredIds = new Set(
    policy.aidAllotments.map(({ financeFixtureId }) => financeFixtureId),
  );
  if (
    policy.currency !== "USD" ||
    configuredIds.size !== policy.aidAllotments.length ||
    configuredIds.size !== knownFixtureIds.size ||
    [...knownFixtureIds].some((fixtureId) => !configuredIds.has(fixtureId)) ||
    policy.aidAllotments.some(
      ({ annualAidCents }) => !Number.isInteger(annualAidCents) || annualAidCents < 0,
    ) ||
    !Number.isInteger(policy.nextCycleFeeWaiverCents) ||
    policy.nextCycleFeeWaiverCents < 0 ||
    !Number.isFinite(Date.parse(policy.decisionExpiresAt))
  ) {
    throw new AdmissionDecisionError("VALIDATION_FAILED");
  }
}

function financeFixture(fixtureId: SyntheticFinanceFixtureId): SyntheticFinanceFixture {
  const fixture = SYNTHETIC_FINANCE_FIXTURES.find((candidate) => candidate.fixtureId === fixtureId);
  if (!fixture) throw new AdmissionDecisionError("FIXTURE_NOT_ALLOWLISTED");
  return fixture;
}

function aidFor(
  policy: SyntheticAdmissionPolicy,
  fixtureId: SyntheticFinanceFixtureId,
): FinalAdmissionDecision["aid"] {
  financeFixture(fixtureId);
  const allotment = policy.aidAllotments.find(
    (candidate) => candidate.financeFixtureId === fixtureId,
  );
  if (!allotment) throw new AdmissionDecisionError("FIXTURE_NOT_ALLOWLISTED");
  return {
    outcome: "allotted",
    annualAidCents: allotment.annualAidCents,
    currency: policy.currency,
  };
}

function noAid(policy: SyntheticAdmissionPolicy): FinalAdmissionDecision["aid"] {
  return { outcome: "not_applicable", annualAidCents: null, currency: policy.currency };
}

function researchInvitation(
  policy: SyntheticAdmissionPolicy,
  invited: boolean,
): FinalAdmissionDecision["researchInvitation"] {
  return {
    state: invited ? "invited" : "not_applicable",
    nextCycleFeeWaiverCents: invited ? policy.nextCycleFeeWaiverCents : null,
    voluntary: true,
    affectsFutureAdmissions: false,
  };
}

interface DecisionParts {
  readonly pathway: AdmissionPathway;
  readonly admissionOutcome: AdmissionOutcome;
  readonly aid: FinalAdmissionDecision["aid"];
  readonly researchInvitation: FinalAdmissionDecision["researchInvitation"];
  readonly messageCode: ApplicantDecisionMessageCode;
  readonly sourceResultHashes: FinalAdmissionDecision["sourceResultHashes"];
}

function allocationFor(
  applicationId: string,
  reviewDecision: BlindReviewDecision,
  draw: LockedIncomeBandedLotteryDraw,
): ApplicantAllocation {
  const replayed = replayIncomeBandedLottery(draw);
  const allocation = replayed.allocations.find(
    (candidate) => candidate.applicationId === applicationId,
  );
  if (
    !allocation ||
    reviewDecision.outcome !== "qualifies" ||
    reviewDecision.workflowStatus !== "track_b_eligible" ||
    allocation.eligibilityResultHash !== reviewDecision.resultHash
  ) {
    throw new AdmissionDecisionError("VALIDATION_FAILED");
  }
  return allocation;
}

function decisionParts(
  retained: RetainedAdmissionInput,
  policy: SyntheticAdmissionPolicy,
): DecisionParts {
  const { source } = retained;
  assertNoProhibitedContext(source);
  if (source.kind === "track_a_automatic") {
    assertNoProhibitedContext(source.routingDecision);
    if (
      source.routingDecision.trackAOutcome !== "eligible" ||
      source.routingDecision.trackBInvitationOutcome !== "not_applicable" ||
      source.routingDecision.workflowStatus !== "track_a_eligible"
    ) {
      throw new AdmissionDecisionError("VALIDATION_FAILED");
    }
    return {
      pathway: "track_a_automatic",
      admissionOutcome: "offered",
      aid: aidFor(policy, source.financeFixtureId),
      researchInvitation: researchInvitation(policy, false),
      messageCode: "TRACK_A_OFFER",
      sourceResultHashes: {
        routing: source.routingDecision.resultHash,
        review: null,
        allocation: null,
      },
    };
  }

  assertNoProhibitedContext(source.reviewDecision);
  if (source.kind === "track_b_review_not_eligible") {
    if (
      source.reviewDecision.outcome !== "does_not_currently_qualify" ||
      source.reviewDecision.workflowStatus !== "track_b_does_not_currently_qualify"
    ) {
      throw new AdmissionDecisionError("VALIDATION_FAILED");
    }
    return {
      pathway: "track_b_review",
      admissionOutcome: "not_eligible",
      aid: noAid(policy),
      researchInvitation: researchInvitation(policy, false),
      messageCode: "TRACK_B_DOES_NOT_CURRENTLY_QUALIFY",
      sourceResultHashes: {
        routing: null,
        review: source.reviewDecision.resultHash,
        allocation: null,
      },
    };
  }

  const allocation = allocationFor(
    retained.applicationId,
    source.reviewDecision,
    source.allocationDraw,
  );
  const offered = allocation.outcome === "offered";
  return {
    pathway: "track_b_lottery",
    admissionOutcome: offered ? "offered" : "not_offered",
    aid: offered ? aidFor(policy, allocation.financeFixtureId) : noAid(policy),
    researchInvitation: researchInvitation(policy, !offered),
    messageCode: offered ? "TRACK_B_OFFER" : "TRACK_B_NOT_OFFERED",
    sourceResultHashes: {
      routing: null,
      review: source.reviewDecision.resultHash,
      allocation: source.allocationDraw.resultHash,
    },
  };
}

function resultContent(
  decision: Pick<
    FinalAdmissionDecision,
    | "admissionOutcome"
    | "aid"
    | "applicantMessage"
    | "decisionExpiresAt"
    | "decisionId"
    | "humanOwnerId"
    | "inputHash"
    | "locked"
    | "pathway"
    | "policyHash"
    | "researchInvitation"
    | "sourceResultHashes"
  >,
): object {
  return {
    admissionOutcome: decision.admissionOutcome,
    aid: decision.aid,
    applicantMessage: decision.applicantMessage,
    contractVersion: ADMISSION_CONTRACT_VERSION,
    decisionExpiresAt: decision.decisionExpiresAt,
    decisionId: decision.decisionId,
    humanOwnerId: decision.humanOwnerId,
    inputHash: decision.inputHash,
    locked: decision.locked,
    pathway: decision.pathway,
    policyHash: decision.policyHash,
    researchInvitation: decision.researchInvitation,
    sourceResultHashes: decision.sourceResultHashes,
  };
}

function buildDecision(
  policy: SyntheticAdmissionPolicy,
  retainedInput: RetainedAdmissionInput,
): FinalAdmissionDecision {
  assertPolicy(policy);
  assertNoProhibitedContext(retainedInput);
  assertSyntheticId(retainedInput.applicationId);
  if (!Number.isFinite(Date.parse(retainedInput.decidedAt))) {
    throw new AdmissionDecisionError("VALIDATION_FAILED");
  }
  const parts = decisionParts(retainedInput, policy);
  const policyHash = sha256ContentHash({ contractVersion: ADMISSION_CONTRACT_VERSION, policy });
  const inputHash = sha256ContentHash({
    contractVersion: ADMISSION_CONTRACT_VERSION,
    retainedInput,
  });
  const decisionId = `${retainedInput.applicationId}:${policy.policyBundleId}:decision`;
  const applicantMessage = {
    code: parts.messageCode,
    body: APPLICANT_DECISION_MESSAGES[parts.messageCode],
  };
  const base = {
    decisionId,
    locked: true as const,
    pathway: parts.pathway,
    admissionOutcome: parts.admissionOutcome,
    aid: parts.aid,
    researchInvitation: parts.researchInvitation,
    applicantMessage,
    sourceResultHashes: parts.sourceResultHashes,
    policyHash,
    inputHash,
    humanOwnerId: policy.humanOwnerId,
    decisionExpiresAt: policy.decisionExpiresAt,
  };
  return deepFreeze({
    contractVersion: ADMISSION_CONTRACT_VERSION,
    ...base,
    policy,
    retainedInput,
    resultHash: sha256ContentHash(resultContent(base)),
  });
}

export function decideAdmission(input: AdmissionDecisionInput): FinalAdmissionDecision {
  assertNoProhibitedContext(input);
  assertPolicy(input.policy);
  return buildDecision(
    detachedSnapshot(input.policy),
    detachedSnapshot({
      applicationId: input.applicationId,
      decidedAt: input.decidedAt,
      source: input.source,
    }),
  );
}

export function replayAdmissionDecision(decision: FinalAdmissionDecision): FinalAdmissionDecision {
  assertNoProhibitedContext(decision);
  if (decision.contractVersion !== ADMISSION_CONTRACT_VERSION || decision.locked !== true) {
    throw new AdmissionDecisionError("VALIDATION_FAILED");
  }
  const policyHash = sha256ContentHash({
    contractVersion: ADMISSION_CONTRACT_VERSION,
    policy: decision.policy,
  });
  if (policyHash !== decision.policyHash) {
    throw new AdmissionDecisionError("POLICY_HASH_MISMATCH");
  }
  const inputHash = sha256ContentHash({
    contractVersion: ADMISSION_CONTRACT_VERSION,
    retainedInput: decision.retainedInput,
  });
  if (
    inputHash !== decision.inputHash ||
    sha256ContentHash(resultContent(decision)) !== decision.resultHash
  ) {
    throw new AdmissionDecisionError("INPUT_HASH_MISMATCH");
  }
  const replayed = buildDecision(
    detachedSnapshot(decision.policy),
    detachedSnapshot(decision.retainedInput),
  );
  if (replayed.resultHash !== decision.resultHash) {
    throw new AdmissionDecisionError("INPUT_HASH_MISMATCH");
  }
  return replayed;
}
