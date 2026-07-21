import type { SignalSummary } from "./events";
import type { GuideReview, HypothesisRevision, HypothesisState } from "./hypothesis";
import type { Provenance } from "./probe";

export interface CandidateGateEvaluation {
  eligible: boolean;
  missing: string[];
}

export type TransitionVersions = Pick<
  HypothesisRevision,
  "modelVersion" | "policyVersion" | "validFromDayOffset" | "recordedAtDayOffset"
>;

export type ShadowProvenance = Exclude<Provenance, "GUIDE">;

export const LEGAL_TRANSITIONS = [
  ["EXPLORING", "EMERGING"],
  ["EMERGING", "CANDIDATE_SPINE"],
  ["CANDIDATE_SPINE", "ACTIVE"],
  ["EXPLORING", "CONTESTED"],
  ["EMERGING", "CONTESTED"],
  ["CANDIDATE_SPINE", "CONTESTED"],
  ["ACTIVE", "CONTESTED"],
  ["PARKED", "CONTESTED"],
  ["REOPENED", "CONTESTED"],
  ["EXPLORING", "PARKED"],
  ["EMERGING", "PARKED"],
  ["CANDIDATE_SPINE", "PARKED"],
  ["ACTIVE", "PARKED"],
  ["CONTESTED", "PARKED"],
  ["REOPENED", "PARKED"],
  ["PARKED", "REOPENED"],
  ["REOPENED", "EXPLORING"],
  ["REOPENED", "EMERGING"],
  ["CONTESTED", "EMERGING"],
] as const satisfies readonly (readonly [HypothesisState, HypothesisState])[];

export function evaluateCandidateGate(summary: SignalSummary): CandidateGateEvaluation {
  const families = new Set(summary.familiesPresent);
  const missing: string[] = [];

  if (families.size < 3) {
    missing.push(`<3 signal families (have ${families.size}, need 3)`);
  }
  if (!families.has("voluntary_return")) {
    missing.push("no delayed-discretionary signal");
  }
  if (!families.has("artifact_competence")) {
    missing.push("no artifact/competence signal");
  }

  return {
    eligible: missing.length === 0,
    missing,
  };
}

export function applyMissingData(current: HypothesisRevision): HypothesisRevision {
  return {
    ...current,
    version: current.version + 1,
  };
}

function assertLegalTransition(from: HypothesisState, to: HypothesisState): void {
  const legal = LEGAL_TRANSITIONS.some(
    ([legalFrom, legalTo]) => legalFrom === from && legalTo === to,
  );

  if (!legal) {
    throw new Error(`Illegal hypothesis transition: ${from} -> ${to}`);
  }
}

function assertCandidateGate(
  from: HypothesisState,
  to: HypothesisState,
  summary: SignalSummary,
  action: "propose" | "author",
): void {
  if (to !== "CANDIDATE_SPINE") {
    return;
  }

  const gate = evaluateCandidateGate(summary);
  if (!gate.eligible) {
    throw new Error(`Cannot ${action} ${from} -> ${to}: ${gate.missing.join("; ")}`);
  }
}

export function proposeTransition(
  current: HypothesisRevision,
  summary: SignalSummary,
  proposedBy: ShadowProvenance,
  versions: TransitionVersions,
  proposedState: HypothesisState = "CANDIDATE_SPINE",
): HypothesisRevision {
  assertLegalTransition(current.state, proposedState);
  assertCandidateGate(current.state, proposedState, summary, "propose");

  return {
    ...current,
    state: proposedState,
    signalSummary: summary,
    guideReview: null,
    proposedBy,
    operative: false,
    ...versions,
  };
}

export function authorRevision(
  current: HypothesisRevision,
  proposed: HypothesisRevision,
  guideReview: GuideReview,
): HypothesisRevision {
  assertLegalTransition(current.state, proposed.state);
  assertCandidateGate(current.state, proposed.state, proposed.signalSummary, "author");

  return {
    ...proposed,
    version: current.version + 1,
    guideReview,
    operative: true,
  };
}
