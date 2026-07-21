import {
  assignCohorts,
  benefitOf,
  caliperDistance,
  commit,
  generateCandidates,
  isFeasibleCohort,
  membershipChurn,
  repairCohort,
  rollback,
  routeHealthEvent,
  scoreObjective,
  withinCaliper,
} from "@gt100k/cohort-compiler";
import type {
  Accommodations,
  ActiveCohortMove,
  AgeBand,
  BenefitEstimator,
  BenefitLCB,
  Caliper,
  CandidateSet,
  ChurnBudget,
  Cohort,
  CohortAssignment,
  CohortHealthEvent,
  CohortRepository,
  CommitResult,
  ConstraintViolation,
  FeasibilityResult,
  HardConstraints,
  LearnerProfile,
  LevelBand,
  ObjectiveScore,
  ObjectiveTerms,
  ObjectiveWeights,
  PairFlag,
  RepairAccepted,
  RepairRequiresStaffException,
  RepairResult,
  Role,
  SafeguardingSink,
  ScheduleAvailability,
  SolveResult,
  TurnAnalysis,
  TurnEvent,
  UnassignedLearner,
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

type PublicUs2Surface = {
  activeMove: ActiveCohortMove;
  benefitEstimator: BenefitEstimator;
  constraintViolation: ConstraintViolation;
  feasibility: FeasibilityResult;
  objectiveScore: ObjectiveScore;
  repairAccepted: RepairAccepted;
  repairRequiresStaffException: RepairRequiresStaffException;
  repairResult: RepairResult;
  repository: CohortRepository;
  safeguardingSink: SafeguardingSink;
  solveResult: SolveResult;
  unassignedLearner: UnassignedLearner;
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

describe("public package API (T028)", () => {
  it("publishes the complete US2 result and port types", () => {
    expectTypeOf<PublicUs2Surface>().toBeObject();
  });

  it("publishes exact US2 domain function signatures without a learned-model input", () => {
    expect([
      assignCohorts,
      benefitOf,
      commit,
      isFeasibleCohort,
      membershipChurn,
      repairCohort,
      rollback,
      routeHealthEvent,
      scoreObjective,
    ]).toSatisfy((apis: unknown[]) => apis.every((api) => typeof api === "function"));

    expectTypeOf(benefitOf).toEqualTypeOf<
      (member: LearnerProfile, cohort: LearnerProfile[]) => number
    >();
    expectTypeOf(isFeasibleCohort).toEqualTypeOf<
      (
        members: LearnerProfile[],
        hard: HardConstraints,
        prior?: CohortAssignment,
      ) => FeasibilityResult
    >();
    expectTypeOf(scoreObjective).toEqualTypeOf<
      (
        members: LearnerProfile[],
        weights: ObjectiveWeights,
        prior?: CohortAssignment | null,
      ) => ObjectiveScore
    >();
    expectTypeOf(assignCohorts).toEqualTypeOf<
      (
        pool: LearnerProfile[],
        candidates: CandidateSet[],
        hard: HardConstraints,
        weights: ObjectiveWeights,
        churn: ChurnBudget,
        prior?: CohortAssignment,
      ) => SolveResult
    >();
    expectTypeOf(membershipChurn).toEqualTypeOf<
      (prior: CohortAssignment, next: CohortAssignment) => number
    >();
    expectTypeOf(commit).toEqualTypeOf<
      (
        repository: CohortRepository,
        assignment: CohortAssignment,
        churn: ChurnBudget,
      ) => Promise<CommitResult>
    >();
    expectTypeOf(rollback).toEqualTypeOf<
      (repository: CohortRepository, assignmentId: string) => Promise<CohortAssignment>
    >();
    expectTypeOf(repairCohort).toEqualTypeOf<
      (assignment: CohortAssignment, churn: ChurnBudget, prior: CohortAssignment) => RepairResult
    >();
    expectTypeOf(routeHealthEvent).toEqualTypeOf<
      (
        sink: SafeguardingSink,
        event: CohortHealthEvent,
        activeMoves?: ActiveCohortMove[],
      ) => Promise<void>
    >();
  });
});
