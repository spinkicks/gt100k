import type { SignalSummary } from "./events";
import type { Domain, Provenance, WorkMode } from "./probe";

export const HYPOTHESIS_STATES = [
  "EXPLORING",
  "EMERGING",
  "CANDIDATE_SPINE",
  "ACTIVE",
  "CONTESTED",
  "PARKED",
  "REOPENED",
] as const;

export type HypothesisState = (typeof HYPOTHESIS_STATES)[number];

export const CHILD_POSITIONS = [
  "AGREE",
  "UNSURE",
  "DISAGREE",
  "DECLINE_TO_LABEL",
  "REQUEST_TO_PARK",
] as const;

export type ChildPosition = (typeof CHILD_POSITIONS)[number];

export const FORBIDDEN_PURPOSES = [
  "admissions",
  "discipline",
  "family_fidelity",
  "public_ranking",
  "commercial_targeting",
] as const;

export type ForbiddenPurpose = (typeof FORBIDDEN_PURPOSES)[number];

export interface CoverageMatrix {
  probeCount: {
    met: boolean;
    count: number;
    need: number;
  };
  domains: {
    met: boolean;
    count: number;
    need: number;
    have: Domain[];
    gaps: string[];
  };
  workModes: {
    met: boolean;
    count: number;
    need: number;
    have: WorkMode[];
    gaps: string[];
  };
  social: {
    met: boolean;
    solo: boolean;
    group: boolean;
    gaps: string[];
  };
  difficulty: {
    met: boolean;
    foundational: boolean;
    stretch: boolean;
    gaps: string[];
  };
  audience: {
    met: boolean;
    audience: boolean;
    no_audience: boolean;
    gaps: string[];
  };
  complete: boolean;
  gaps: string[];
}

export type Uncertainty =
  | {
      kind: "interval";
      lo: number;
      hi: number;
    }
  | {
      kind: "grade";
      grade: "thin" | "moderate" | "strong";
    };

export interface GuideReview {
  guide: string;
  decision: string;
  rationale: string;
  reviewedAtDayOffset: number;
}

export interface HypothesisRevision {
  hypothesisId: string;
  learnerRef: string;
  version: number;
  candidateDomains: Domain[];
  workModeProfile: Partial<Record<WorkMode, number>>;
  state: HypothesisState;
  evidenceRefs: string[];
  signalSummary: SignalSummary;
  competingExplanations: string[];
  coverageGaps: string[];
  uncertainty: Uncertainty;
  nextProbe?: string;
  childPosition: ChildPosition;
  familyContext?: Record<string, unknown>;
  guideReview: GuideReview | null;
  proposedBy: Provenance;
  operative: boolean;
  modelVersion: string;
  policyVersion: string;
  validFromDayOffset: number;
  recordedAtDayOffset: number;
}

export interface InterestHypothesis {
  hypothesisId: string;
  learnerRef: string;
  revisions: HypothesisRevision[];
}

export interface HypothesisViewTime {
  validAtDayOffset: number;
  recordedAtDayOffset: number;
}

const UNCERTAINTY_GRADES = new Set(["thin", "moderate", "strong"]);

function assertRevision(revision: HypothesisRevision): void {
  const record = revision as unknown as Record<string, unknown>;
  if ("passionScore" in record || "driveScore" in record) {
    const forbidden = "passionScore" in record ? "passionScore" : "driveScore";
    throw new Error(`Hypothesis revisions cannot contain ${forbidden}`);
  }

  const uncertainty = record.uncertainty;
  if (uncertainty === null || typeof uncertainty !== "object") {
    throw new Error("Uncertainty must be an interval or evidence grade");
  }

  const value = uncertainty as Record<string, unknown>;
  if (
    value.kind === "grade" &&
    typeof value.grade === "string" &&
    UNCERTAINTY_GRADES.has(value.grade)
  ) {
    return;
  }

  if (
    value.kind === "interval" &&
    typeof value.lo === "number" &&
    Number.isFinite(value.lo) &&
    typeof value.hi === "number" &&
    Number.isFinite(value.hi) &&
    value.lo >= 0 &&
    value.lo <= value.hi &&
    value.hi <= 1
  ) {
    return;
  }

  throw new Error("Uncertainty must be an interval in [0,1] or a thin/moderate/strong grade");
}

function assertAuthorship(revision: HypothesisRevision): void {
  if (revision.operative && revision.guideReview === null) {
    throw new Error("Operative hypothesis revisions require a guide review");
  }
  if (!revision.operative && revision.guideReview !== null) {
    throw new Error("Shadow hypothesis revisions cannot carry a guide review");
  }
}

export function createHypothesis(initialRevision: HypothesisRevision): InterestHypothesis {
  assertRevision(initialRevision);
  assertAuthorship(initialRevision);
  if (!initialRevision.operative || initialRevision.version !== 1) {
    throw new Error("An initial hypothesis must be an operative version 1 revision");
  }

  return {
    hypothesisId: initialRevision.hypothesisId,
    learnerRef: initialRevision.learnerRef,
    revisions: [initialRevision],
  };
}

export function appendRevision(
  hypothesis: InterestHypothesis,
  revision: HypothesisRevision,
): InterestHypothesis {
  assertRevision(revision);
  assertAuthorship(revision);

  if (
    revision.hypothesisId !== hypothesis.hypothesisId ||
    revision.learnerRef !== hypothesis.learnerRef
  ) {
    throw new Error("Revision identity must match the hypothesis identity");
  }

  const currentVersion = hypothesis.revisions.reduce(
    (highest, candidate) =>
      candidate.operative && candidate.version > highest ? candidate.version : highest,
    0,
  );
  const expectedVersion = revision.operative ? currentVersion + 1 : currentVersion;
  if (revision.version !== expectedVersion) {
    const kind = revision.operative ? "operative" : "shadow";
    throw new Error(`Expected ${kind} version ${expectedVersion}, got ${revision.version}`);
  }

  const latestRecordedAt = hypothesis.revisions.reduce(
    (latest, candidate) => Math.max(latest, candidate.recordedAtDayOffset),
    Number.NEGATIVE_INFINITY,
  );
  if (revision.recordedAtDayOffset < latestRecordedAt) {
    throw new Error("Revision record time cannot precede the latest appended record");
  }

  return {
    ...hypothesis,
    revisions: [...hypothesis.revisions, revision],
  };
}

export function currentFor(
  hypothesis: InterestHypothesis,
  view: HypothesisViewTime = {
    validAtDayOffset: Number.POSITIVE_INFINITY,
    recordedAtDayOffset: Number.POSITIVE_INFINITY,
  },
): HypothesisRevision | null {
  let current: HypothesisRevision | null = null;

  for (const revision of hypothesis.revisions) {
    const visible =
      revision.operative &&
      revision.validFromDayOffset <= view.validAtDayOffset &&
      revision.recordedAtDayOffset <= view.recordedAtDayOffset;
    if (visible && (current === null || revision.version > current.version)) {
      current = revision;
    }
  }

  return current;
}
