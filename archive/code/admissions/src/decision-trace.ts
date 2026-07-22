import {
  type Sha256ContentHash,
  canonicalize,
  sha256ContentHash,
} from "../../admissions-contracts/src/hash.js";
import { type FinalAdmissionDecision, replayAdmissionDecision } from "./admission.js";
import { type LockedIncomeBandedLotteryDraw, replayIncomeBandedLottery } from "./allocation.js";
import {
  type AggregateBlindReviewInput,
  type BlindReviewDecision,
  aggregateBlindReview,
} from "./review.js";
import {
  type CogatRoutingDecision,
  type CogatRoutingInput,
  routeCogatAssessment,
} from "./routing.js";

export const DECISION_TRACE_CONTRACT_VERSION = "DT-SYN-01" as const;

export type DecisionStepKind = "admission" | "allocation" | "review" | "routing";

export interface CreateDecisionTraceInput {
  readonly traceId: string;
  readonly createdAt: string;
  readonly routing: {
    readonly input: CogatRoutingInput;
    readonly decision: CogatRoutingDecision;
  };
  readonly review: {
    readonly input: AggregateBlindReviewInput;
    readonly decision: BlindReviewDecision;
  } | null;
  readonly allocation: {
    readonly draw: LockedIncomeBandedLotteryDraw;
  } | null;
  readonly admission: FinalAdmissionDecision;
}

export interface DecisionTrace {
  readonly contractVersion: typeof DECISION_TRACE_CONTRACT_VERSION;
  readonly traceId: string;
  readonly createdAt: string;
  readonly stepKinds: readonly DecisionStepKind[];
  readonly routing: CreateDecisionTraceInput["routing"] & { readonly recordedAt: string };
  readonly review:
    | (NonNullable<CreateDecisionTraceInput["review"]> & { readonly recordedAt: string })
    | null;
  readonly allocation:
    | (NonNullable<CreateDecisionTraceInput["allocation"]> & { readonly recordedAt: string })
    | null;
  readonly admission: FinalAdmissionDecision;
  readonly traceHash: Sha256ContentHash;
}

export interface ReplayedDecision {
  readonly routing: CogatRoutingDecision;
  readonly review: BlindReviewDecision | null;
  readonly allocation: LockedIncomeBandedLotteryDraw | null;
  readonly admission: FinalAdmissionDecision;
}

export class DecisionTraceError extends Error {
  readonly code: "INPUT_HASH_MISMATCH" | "NON_SYNTHETIC_INPUT" | "VALIDATION_FAILED";

  constructor(code: DecisionTraceError["code"]) {
    super(code);
    this.name = "DecisionTraceError";
    this.code = code;
  }
}

const PROHIBITED_TRACE_KEYS = [
  "accommodationUsed",
  "address",
  "childName",
  "dateOfBirth",
  "demographics",
  "gender",
  "householdIncome",
  "householdSize",
  "researchConsent",
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

function assertSyntheticId(value: string): void {
  if (!value.includes("-syn-") || value.trim() !== value) {
    throw new DecisionTraceError("NON_SYNTHETIC_INPUT");
  }
}

function assertNoProhibitedContext(value: object): void {
  if (PROHIBITED_TRACE_KEYS.some((key) => key in value)) {
    throw new DecisionTraceError("NON_SYNTHETIC_INPUT");
  }
}

function assertSameDecision(expected: object, replayed: object): void {
  if (canonicalize(expected) !== canonicalize(replayed)) {
    throw new DecisionTraceError("VALIDATION_FAILED");
  }
}

function expectedStepKinds(
  review: DecisionTrace["review"] | CreateDecisionTraceInput["review"],
  allocation: DecisionTrace["allocation"] | CreateDecisionTraceInput["allocation"],
): readonly DecisionStepKind[] {
  const kinds: DecisionStepKind[] = ["routing"];
  if (review) kinds.push("review");
  if (allocation) kinds.push("allocation");
  kinds.push("admission");
  return kinds;
}

function validatePath(
  input: Pick<DecisionTrace, "admission" | "allocation" | "review" | "routing">,
): void {
  const { admission, allocation, review, routing } = input;
  if (admission.pathway === "track_a_automatic") {
    if (
      review !== null ||
      allocation !== null ||
      routing.decision.trackAOutcome !== "eligible" ||
      admission.sourceResultHashes.routing !== routing.decision.resultHash ||
      admission.sourceResultHashes.review !== null ||
      admission.sourceResultHashes.allocation !== null
    ) {
      throw new DecisionTraceError("VALIDATION_FAILED");
    }
    return;
  }

  if (
    review === null ||
    routing.decision.trackBInvitationOutcome !== "invited" ||
    review.input.snapshot.routingResultHash !== routing.decision.resultHash ||
    admission.sourceResultHashes.routing !== null ||
    admission.sourceResultHashes.review !== review.decision.resultHash
  ) {
    throw new DecisionTraceError("VALIDATION_FAILED");
  }

  if (admission.pathway === "track_b_review") {
    if (allocation !== null || admission.sourceResultHashes.allocation !== null) {
      throw new DecisionTraceError("VALIDATION_FAILED");
    }
    return;
  }

  if (
    allocation === null ||
    admission.sourceResultHashes.allocation !== allocation.draw.resultHash ||
    !allocation.draw.allocations.some(
      ({ applicationId, eligibilityResultHash }) =>
        applicationId === admission.retainedInput.applicationId &&
        eligibilityResultHash === review.decision.resultHash,
    )
  ) {
    throw new DecisionTraceError("VALIDATION_FAILED");
  }
}

function replayParts(
  input: Pick<DecisionTrace, "admission" | "allocation" | "review" | "routing">,
): ReplayedDecision {
  assertNoProhibitedContext(input.routing.input);
  assertNoProhibitedContext(input.routing.input.assessment);
  assertNoProhibitedContext(input.routing.decision);
  const routing = routeCogatAssessment(input.routing.input);
  assertSameDecision(input.routing.decision, routing);

  const review = input.review ? aggregateBlindReview(input.review.input) : null;
  if (input.review && review) assertSameDecision(input.review.decision, review);

  const allocation = input.allocation ? replayIncomeBandedLottery(input.allocation.draw) : null;
  const admission = replayAdmissionDecision(input.admission);
  assertSameDecision(input.admission, admission);
  validatePath(input);

  return deepFreeze({ routing, review, allocation, admission });
}

function traceContent(
  trace: Pick<
    DecisionTrace,
    "admission" | "allocation" | "createdAt" | "review" | "routing" | "stepKinds" | "traceId"
  >,
): object {
  return {
    admission: trace.admission,
    allocation: trace.allocation,
    contractVersion: DECISION_TRACE_CONTRACT_VERSION,
    createdAt: trace.createdAt,
    review: trace.review,
    routing: trace.routing,
    stepKinds: trace.stepKinds,
    traceId: trace.traceId,
  };
}

export function createDecisionTrace(input: CreateDecisionTraceInput): DecisionTrace {
  assertNoProhibitedContext(input);
  assertSyntheticId(input.traceId);
  if (!Number.isFinite(Date.parse(input.createdAt))) {
    throw new DecisionTraceError("VALIDATION_FAILED");
  }
  const stepKinds = expectedStepKinds(input.review, input.allocation);
  const snapshot = detachedSnapshot({
    traceId: input.traceId,
    createdAt: input.createdAt,
    stepKinds,
    routing: { ...input.routing, recordedAt: input.createdAt },
    review: input.review ? { ...input.review, recordedAt: input.createdAt } : null,
    allocation: input.allocation ? { ...input.allocation, recordedAt: input.createdAt } : null,
    admission: input.admission,
  });
  replayParts(snapshot);
  return deepFreeze({
    contractVersion: DECISION_TRACE_CONTRACT_VERSION,
    ...snapshot,
    traceHash: sha256ContentHash(traceContent(snapshot)),
  });
}

export function replayDecision(trace: DecisionTrace): ReplayedDecision {
  assertNoProhibitedContext(trace);
  if (
    trace.contractVersion !== DECISION_TRACE_CONTRACT_VERSION ||
    canonicalize(trace.stepKinds) !==
      canonicalize(expectedStepKinds(trace.review, trace.allocation)) ||
    sha256ContentHash(traceContent(trace)) !== trace.traceHash
  ) {
    throw new DecisionTraceError("INPUT_HASH_MISMATCH");
  }
  assertSyntheticId(trace.traceId);
  if (!Number.isFinite(Date.parse(trace.createdAt))) {
    throw new DecisionTraceError("VALIDATION_FAILED");
  }
  return replayParts(trace);
}
