import { generateCandidates } from "../../../packages/cohort-compiler/src/candidates";
import type {
  Caliper,
  CandidateSet,
  LearnerProfile,
} from "../../../packages/cohort-compiler/src/model";
import type { CandidateIndex } from "../../../packages/cohort-compiler/src/ports";

/** Buildable MVP candidate index over an injected synthetic learner pool. */
export class InMemoryCandidateIndex implements CandidateIndex {
  constructor(private readonly pool: LearnerProfile[]) {}

  async candidatesFor(learnerRef: string, caliper: Caliper): Promise<CandidateSet> {
    const candidateSet = generateCandidates(this.pool, caliper).find(
      (candidate) => candidate.learnerRef === learnerRef,
    );

    if (!candidateSet) {
      throw new Error(`Learner ${learnerRef} is not present in the candidate pool`);
    }

    return candidateSet;
  }
}

/** Production HNSW ANN seam; deliberately unavailable in the buildable MVP. */
export class DeferredHnswCandidateIndex implements CandidateIndex {
  async candidatesFor(_learnerRef: string, _caliper: Caliper): Promise<CandidateSet> {
    throw new Error("HNSW candidate index is deferred and not implemented");
  }
}
