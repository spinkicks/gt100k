import { caliperDistance, generateCandidates, withinCaliper } from "@gt100k/cohort-compiler";
import type {
  Accommodations,
  AgeBand,
  BenefitLCB,
  Caliper,
  CandidateSet,
  ChurnBudget,
  Cohort,
  CohortAssignment,
  CohortHealthEvent,
  CommitResult,
  HardConstraints,
  LearnerProfile,
  LevelBand,
  ObjectiveTerms,
  ObjectiveWeights,
  PairFlag,
  Role,
  ScheduleAvailability,
  TurnAnalysis,
  TurnEvent,
  VelocityBand,
  WorkingRhythm,
} from "@gt100k/cohort-compiler";
import { describe, expect, expectTypeOf, it } from "vitest";
import { caliper8 } from "./fixtures/caliper-8";

type PublicModelSurface = {
  accommodations: Accommodations;
  ageBand: AgeBand;
  benefit: BenefitLCB;
  caliper: Caliper;
  candidates: CandidateSet;
  churn: ChurnBudget;
  cohort: Cohort;
  assignment: CohortAssignment;
  healthEvent: CohortHealthEvent;
  commit: CommitResult;
  hard: HardConstraints;
  learner: LearnerProfile;
  level: LevelBand;
  objectiveTerms: ObjectiveTerms;
  objectiveWeights: ObjectiveWeights;
  pairFlag: PairFlag;
  role: Role;
  schedule: ScheduleAvailability;
  turnAnalysis: TurnAnalysis;
  turnEvent: TurnEvent;
  velocity: VelocityBand;
  workingRhythm: WorkingRhythm;
};

describe("public package API (T010)", () => {
  it("publishes the complete domain model as type-only exports", () => {
    expectTypeOf<PublicModelSurface>().toBeObject();
  });

  it("publishes the P1 caliper and candidate functions", () => {
    const [subject, peer] = caliper8.pool;

    expect(subject).toBeDefined();
    expect(peer).toBeDefined();
    expectTypeOf(generateCandidates).parameter(0).toEqualTypeOf<LearnerProfile[]>();
    expectTypeOf(generateCandidates).parameter(1).toEqualTypeOf<Caliper>();
    expectTypeOf(generateCandidates).returns.toEqualTypeOf<CandidateSet[]>();
    expectTypeOf(withinCaliper).toEqualTypeOf<
      (a: LearnerProfile, b: LearnerProfile, caliper: Caliper) => boolean
    >();
    expectTypeOf(caliperDistance).toEqualTypeOf<(a: LearnerProfile, b: LearnerProfile) => number>();

    if (subject && peer) {
      expect(withinCaliper(subject, peer, caliper8.caliper)).toBe(true);
      expect(caliperDistance(subject, peer)).toBe(2);
    }
    const candidatesByLearner = Object.fromEntries(
      generateCandidates(caliper8.pool, caliper8.caliper).map(({ learnerRef, candidates }) => [
        learnerRef,
        candidates.map(({ ref }) => ref),
      ]),
    );

    expect(candidatesByLearner).toEqual(caliper8.expected.candidates);
  });
});
