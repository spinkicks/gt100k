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
