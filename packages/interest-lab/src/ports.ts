import type { Probe, ProbeFamily } from "./probe";

/** Append-only persistence and replay for versioned interest hypotheses. */
export interface InterestHypothesisRepository<Hypothesis, Revision> {
  load(hypothesisId: string): Promise<Hypothesis | null>;
  currentFor(learnerRef: string): Promise<Hypothesis | null>;
  appendRevision(hypothesisId: string, revision: Revision): Promise<void>;
  revisions(hypothesisId: string): Promise<Revision[]>;
}

/** Injected catalog so the domain contains no fixed domain taxonomy or I/O. */
export interface ProbeCatalog {
  families(): Promise<ProbeFamily[]>;
  probe(id: string): Promise<Probe | null>;
}

/** Synthetic assent/withdrawal boundary; real consent machinery is out of scope. */
export interface AssentRecordPort {
  isWithdrawn(learnerRef: string, reflectionId: string): Promise<boolean>;
  recordWithdrawal(learnerRef: string, reflectionId: string): Promise<void>;
}

/** Coarse semantic artifact transitions only; raw artifact content is prohibited. */
export interface ArtifactSignalSource<Transition> {
  next(): Promise<Transition | null>;
}

export interface OfferDecisionLogEntry {
  eligibleSet: string[];
  policyVersion: string;
  coverageConstraints: string[];
}

/** Rules-engine decision inputs retained for replay and future shadow selection. */
export interface OfferDecisionLog {
  record(entry: OfferDecisionLogEntry): Promise<void>;
}

/** Injected deterministic time source; the domain never reads wall-clock time. */
export interface Clock {
  dayOffset(): number;
}

/**
 * Deferred IL-021 selector contract. The MVP does not implement or invoke a bandit,
 * and downstream rules remain responsible for every safety and coverage constraint.
 */
export interface OfferSelector<Context> {
  pick(eligible: Probe[], context: Context): Probe[];
}
