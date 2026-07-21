import { describe, expectTypeOf, it } from "vitest";
import type {
  ArtifactSignalSource,
  AssentRecordPort,
  Clock,
  InterestHypothesisRepository,
  OfferDecisionLog,
  OfferDecisionLogEntry,
  OfferSelector,
  ProbeCatalog,
} from "../src/ports";
import type { Probe, ProbeFamily } from "../src/probe";

interface TestHypothesis {
  hypothesisId: string;
  learnerRef: string;
}

interface TestRevision {
  hypothesisId: string;
  version: number;
}

interface TestArtifactTransition {
  artifactRef: string;
  transition: string;
}

interface TestSelectionContext {
  learnerRef: string;
}

describe("interest lab ports", () => {
  it("defines append-only hypothesis persistence and replay", () => {
    expectTypeOf<InterestHypothesisRepository<TestHypothesis, TestRevision>>().toEqualTypeOf<{
      load(hypothesisId: string): Promise<TestHypothesis | null>;
      currentFor(learnerRef: string): Promise<TestHypothesis | null>;
      appendRevision(hypothesisId: string, revision: TestRevision): Promise<void>;
      revisions(hypothesisId: string): Promise<TestRevision[]>;
    }>();
  });

  it("injects the probe catalog, assent record, artifact source, and clock", () => {
    expectTypeOf<ProbeCatalog>().toEqualTypeOf<{
      families(): Promise<ProbeFamily[]>;
      probe(id: string): Promise<Probe | null>;
    }>();
    expectTypeOf<AssentRecordPort>().toEqualTypeOf<{
      isWithdrawn(learnerRef: string, reflectionId: string): Promise<boolean>;
      recordWithdrawal(learnerRef: string, reflectionId: string): Promise<void>;
    }>();
    expectTypeOf<ArtifactSignalSource<TestArtifactTransition>>().toEqualTypeOf<{
      next(): Promise<TestArtifactTransition | null>;
    }>();
    expectTypeOf<Clock>().toEqualTypeOf<{
      dayOffset(): number;
    }>();
  });

  it("records the rules-engine decision inputs needed for later replay", () => {
    expectTypeOf<OfferDecisionLogEntry>().toEqualTypeOf<{
      eligibleSet: string[];
      policyVersion: string;
      coverageConstraints: string[];
    }>();
    expectTypeOf<OfferDecisionLog>().toEqualTypeOf<{
      record(entry: OfferDecisionLogEntry): Promise<void>;
    }>();
  });

  it("reserves a synchronous selector shape without implementing a bandit", () => {
    expectTypeOf<OfferSelector<TestSelectionContext>>().toEqualTypeOf<{
      pick(eligible: Probe[], context: TestSelectionContext): Probe[];
    }>();
  });
});
