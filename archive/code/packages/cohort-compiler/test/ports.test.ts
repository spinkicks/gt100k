import { describe, expectTypeOf, it } from "vitest";
import type {
  BenefitLCB,
  Caliper,
  CandidateSet,
  CohortAssignment,
  CohortHealthEvent,
  TurnEvent,
} from "../src/model";
import type {
  BenefitEstimator,
  CandidateIndex,
  CohortRepository,
  MediaTurnSource,
  SafeguardingSink,
} from "../src/ports";

type CandidateIndexContract = {
  candidatesFor(learnerRef: string, caliper: Caliper): Promise<CandidateSet>;
};

type CohortRepositoryContract = {
  activeFor(learnerRef: string): Promise<CohortAssignment | null>;
  commitAtomic(assignment: CohortAssignment): Promise<void>;
  getSnapshot(assignmentId: string): Promise<CohortAssignment | null>;
  restore(assignmentId: string): Promise<CohortAssignment>;
};

type SafeguardingSinkContract = {
  submit(event: CohortHealthEvent): Promise<void>;
  pending(): Promise<CohortHealthEvent[]>;
};

type MediaTurnSourceContract = {
  turns(roomRef: string): Promise<TurnEvent[]>;
};

type BenefitEstimatorContract = {
  logAfterLock(assignmentId: string, at: string): Promise<BenefitLCB>;
};

describe("domain port contracts (T003)", () => {
  it("defines the asynchronous candidate-index seam", () => {
    expectTypeOf<CandidateIndex>().toEqualTypeOf<CandidateIndexContract>();
  });

  it("defines the atomic snapshot repository seam", () => {
    expectTypeOf<CohortRepository>().toEqualTypeOf<CohortRepositoryContract>();
  });

  it("defines the human safeguarding queue seam", () => {
    expectTypeOf<SafeguardingSink>().toEqualTypeOf<SafeguardingSinkContract>();
  });

  it("keeps the deferred media plane behind an asynchronous source", () => {
    expectTypeOf<MediaTurnSource>().toEqualTypeOf<MediaTurnSourceContract>();
  });

  it("keeps shadow benefit logging post-lock and out of solver inputs", () => {
    expectTypeOf<BenefitEstimator>().toEqualTypeOf<BenefitEstimatorContract>();
  });
});
