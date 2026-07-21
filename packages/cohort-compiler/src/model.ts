/** Developmental band used as an inviolable cohort constraint. */
export type AgeBand = "a6_8" | "a9_11" | "a12_14";

/** Private ordinal matchmaking input; never exposed as a rank or public tier. */
export type LevelBand = number;

/** Private ordinal pace input; never exposed as a rank or public tier. */
export type VelocityBand = number;

export interface ScheduleAvailability {
  blocks: string[];
}

export interface Accommodations {
  needs: string[];
  conflicts: string[];
}

export interface PairFlag {
  ref: string;
  flag: "positive" | "negative";
}

export type Role = "anchor" | "scout" | "builder" | "challenger" | "scribe";

export type WorkingRhythm = "steady" | "burst" | "flex";

/** Synthetic, pseudonymous solver input. */
export interface LearnerProfile {
  learnerRef: string;
  ageBand: AgeBand;
  schedule: ScheduleAvailability;
  accommodations: Accommodations;
  level: LevelBand;
  velocity: VelocityBand;
  separations: string[];
  priorAssignmentRef: string | null;
  pairHistory?: PairFlag[];
  preferredRole?: Role;
  workingRhythm?: WorkingRhythm;
}

export interface Caliper {
  levelTolerance: number;
  velocityTolerance: number;
  k: number;
}

export interface CandidateSet {
  learnerRef: string;
  candidates: { ref: string; distance: number }[];
  hash: string;
}

export interface ChurnBudget {
  weekKey: string;
  cap: number;
  used: number;
  exceptions: { approvedBy: string; reason: string; delta: number }[];
}

/**
 * Configuration for the seven always-on hard constraints.
 * The benefit function is injected, deterministic, and independent of the caliper.
 */
export interface HardConstraints {
  age: true;
  schedule: true;
  separations: true;
  accommodations: true;
  caliper: Caliper;
  nonHarmFloor: number;
  benefitOf: (member: LearnerProfile, cohort: LearnerProfile[]) => number;
  churn: ChurnBudget;
}

export interface ObjectiveWeights {
  closePace: number;
  compatibleIntensity: number;
  roleCoverage: number;
  pairHistory: number;
  rivalryDose: number;
  churn: number;
  repeatedPairings: number;
}

export interface ObjectiveTerms {
  closePace: number;
  compatibleIntensity: number;
  roleCoverage: number;
  pairHistory: number;
  rivalryDose: number;
  churn: number;
  repeatedPairings: number;
}

export interface Cohort {
  members: { ref: string; role: string }[];
}

/** Immutable-by-convention assignment snapshot; timestamps are injected ISO strings. */
export interface CohortAssignment {
  id: string;
  cohorts: Cohort[];
  memberRefs: string[];
  levelBands: {
    level: [number, number];
    velocity: [number, number];
  };
  candidateSetHash: string;
  objectiveTerms: ObjectiveTerms;
  constraints: HardConstraints;
  start: string;
  plannedReview: string;
  priorAssignmentId: string | null;
  rollbackRef: string | null;
  sizeExceptions: { cohortIndex: number; approvedBy: string; reason: string }[];
}

export interface CommitResult {
  ok: boolean;
  assignmentId: string | null;
  priorAssignmentId: string | null;
  reasons: string[];
}

export interface CohortHealthEvent {
  assignmentId: string;
  reporterRef: string;
  eventClass: "bullying" | "coercion" | "exclusion" | "other";
  affectedMembers: string[];
  severity: "low" | "medium" | "high";
  evidenceScope: string;
  immediateAction: string;
  safeguardingLink: string;
  followUpOwner: string;
}

export interface TurnEvent {
  speaker: string;
  start: number;
  duration: number;
  overlap: boolean;
  quality?: number;
}

/** Observable turn-taking descriptors only; trait or motivation fields are prohibited. */
export interface TurnAnalysis {
  perSpeaker: Record<string, { turnShare: number; speakingTime: number; interruptions: number }>;
  patterns: {
    kind: "dominance" | "repeated_interruption";
    evidence: string;
    subjects: string[];
  }[];
  confidence: number;
  suppressed: boolean;
}

/** Post-lock annotation only; never accepted by solve or repair inputs. */
export interface BenefitLCB {
  assignmentId: string;
  lcb: number;
  loggedAt: string;
  shadow: true;
}
