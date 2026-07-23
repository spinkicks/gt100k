import {
  type CandidateGateEvaluation,
  type HypothesisRevision,
  type HypothesisState,
  type InterestHypothesis,
  LEGAL_TRANSITIONS,
  SIGNAL_FAMILIES,
  type SignalFamily,
} from "@gt100k/interest-lab";
import { PALETTE } from "./art";
import type { LifecycleStateView, RevisionHistoryView } from "./model";

export interface LifecycleGateInput extends CandidateGateEvaluation {
  familiesPresent: readonly SignalFamily[];
}

type ProposalInput = Pick<HypothesisRevision, "state" | "proposedBy" | "operative">;

const LIFECYCLE_STATES: LifecycleStateView["states"] = [
  { id: "EXPLORING", track: "main", tone: PALETTE.tide },
  { id: "EMERGING", track: "main", tone: PALETTE.spark },
  { id: "CANDIDATE_SPINE", track: "main", tone: PALETTE.beacon },
  { id: "ACTIVE", track: "main", tone: PALETTE.sprout },
  { id: "CONTESTED", track: "branch", tone: PALETTE.contested },
  { id: "PARKED", track: "branch", tone: PALETTE.parked },
  { id: "REOPENED", track: "branch", tone: PALETTE.tide },
];

export function buildLifecycleStateView(
  currentState: HypothesisState,
  gate: LifecycleGateInput,
  proposal?: ProposalInput,
): LifecycleStateView {
  if (proposal && (proposal.operative || proposal.proposedBy === "GUIDE")) {
    throw new Error("A lifecycle suggestion must be a shadow proposal");
  }

  const present = new Set(gate.familiesPresent);

  return {
    states: LIFECYCLE_STATES.map((state) => ({ ...state })),
    current: currentState,
    legalTransitions: LEGAL_TRANSITIONS.map(([from, to]) => ({ from, to })),
    gate: {
      eligible: gate.eligible,
      missing: [...gate.missing],
      families: SIGNAL_FAMILIES.map((family) => ({ family, present: present.has(family) })),
    },
    proposal: proposal
      ? {
          proposedBy: proposal.proposedBy,
          toState: proposal.state,
          operative: false,
          note: "A guide authors the record.",
        }
      : null,
    authoring: {
      canAuthor: true,
      note: "A guide authors the operative revision.",
    },
  };
}

export function buildRevisionHistoryView(hypothesis: InterestHypothesis): RevisionHistoryView {
  let previousVersion = Number.NEGATIVE_INFINITY;
  let previousRecordedAt = Number.NEGATIVE_INFINITY;

  for (const revision of hypothesis.revisions) {
    if (revision.version < previousVersion) {
      throw new Error("Revision history must preserve monotonic version order");
    }
    if (revision.recordedAtDayOffset < previousRecordedAt) {
      throw new Error("Revision history record time must preserve append order");
    }
    previousVersion = revision.version;
    previousRecordedAt = revision.recordedAtDayOffset;
  }

  return {
    versions: hypothesis.revisions.map((revision) => ({
      version: revision.version,
      state: revision.state,
      operative: revision.operative,
      validFromDayOffset: revision.validFromDayOffset,
      recordedAtDayOffset: revision.recordedAtDayOffset,
      authored: revision.guideReview !== null,
    })),
    currentVersion: hypothesis.revisions.reduce(
      (highest, revision) =>
        revision.operative && revision.version > highest ? revision.version : highest,
      0,
    ),
  };
}
