import type {
  BenefitLCB,
  Caliper,
  CandidateSet,
  CohortAssignment,
  CohortHealthEvent,
  TurnEvent,
} from "./model";

/** Candidate lookup seam; the MVP adapter is in-memory and HNSW remains deferred. */
export interface CandidateIndex {
  candidatesFor(learnerRef: string, caliper: Caliper): Promise<CandidateSet>;
}

/** Atomic assignment persistence seam; the MVP adapter retains in-memory snapshots. */
export interface CohortRepository {
  activeFor(learnerRef: string): Promise<CohortAssignment | null>;
  commitAtomic(assignment: CohortAssignment): Promise<void>;
  getSnapshot(assignmentId: string): Promise<CohortAssignment | null>;
  restore(assignmentId: string): Promise<CohortAssignment>;
}

/** Human safeguarding queue seam. Events bypass cohort optimization. */
export interface SafeguardingSink {
  submit(event: CohortHealthEvent): Promise<void>;
  pending(): Promise<CohortHealthEvent[]>;
}

/** Non-production media seam; real WebRTC/AudioWorklet/LiveKit ingestion is deferred. */
export interface MediaTurnSource {
  turns(roomRef: string): Promise<TurnEvent[]>;
}

/** Shadow-only seam. Benefit estimates are logged after lock and never feed a solve. */
export interface BenefitEstimator {
  logAfterLock(assignmentId: string, at: string): Promise<BenefitLCB>;
}
