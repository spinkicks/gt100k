import type {
  HypothesisRevision,
  InterestHypothesis,
  InterestHypothesisRepository,
} from "@gt100k/interest-lab";

function deepCopy<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** In-memory, append-only persistence for synthetic interest hypotheses. */
export class InMemoryInterestHypothesisRepository
  implements InterestHypothesisRepository<InterestHypothesis, HypothesisRevision>
{
  private readonly revisionStore = new Map<string, HypothesisRevision[]>();
  private readonly hypothesisByLearner = new Map<string, string>();

  async load(hypothesisId: string): Promise<InterestHypothesis | null> {
    const revisions = this.revisionStore.get(hypothesisId);
    if (revisions === undefined || revisions.length === 0) {
      return null;
    }

    return deepCopy({
      hypothesisId,
      learnerRef: revisions[0]!.learnerRef,
      revisions,
    });
  }

  async currentFor(learnerRef: string): Promise<InterestHypothesis | null> {
    const hypothesisId = this.hypothesisByLearner.get(learnerRef);
    return hypothesisId === undefined ? null : this.load(hypothesisId);
  }

  async appendRevision(hypothesisId: string, revision: HypothesisRevision): Promise<void> {
    const stored = deepCopy(revision);
    const revisions = this.revisionStore.get(hypothesisId) ?? [];
    this.revisionStore.set(hypothesisId, [...revisions, stored]);
    this.hypothesisByLearner.set(stored.learnerRef, hypothesisId);
  }

  async revisions(hypothesisId: string): Promise<HypothesisRevision[]> {
    return deepCopy(this.revisionStore.get(hypothesisId) ?? []);
  }
}
