import {
  type BuildCohortArenaViewInput,
  type CohortArenaView,
  type ViewFlags,
  buildCohortArenaView,
} from "@gt100k/cohort-arena-view";

type SyntheticLearner = NonNullable<BuildCohortArenaViewInput["pool"]>[number];

const CHURN = {
  weekKey: "2026-W30",
  cap: 4,
  used: 0,
  exceptions: [],
} satisfies BuildCohortArenaViewInput["churn"];

const HARD = {
  age: true,
  schedule: true,
  separations: true,
  accommodations: true,
  caliper: { levelTolerance: 2, velocityTolerance: 2, k: 10 },
  nonHarmFloor: 0.5,
  benefitOf: () => 0.825,
  churn: CHURN,
} satisfies BuildCohortArenaViewInput["hard"];

const ROLE_VECTOR = ["anchor", "scout", "builder", "builder", "challenger", "scribe"] as const;

function learner(
  learnerRef: string,
  ageBand: SyntheticLearner["ageBand"],
  level: number,
  velocity: number,
): SyntheticLearner {
  return {
    learnerRef,
    ageBand,
    schedule: { blocks: ["mon-pm", "wed-am"] },
    accommodations: { needs: [], conflicts: [] },
    level,
    velocity,
    separations: [],
    priorAssignmentRef: null,
    pairHistory: [],
  };
}

const POOL = [
  learner("A1", "a9_11", 10, 10),
  learner("A2", "a9_11", 11, 10),
  learner("A3", "a9_11", 10, 11),
  learner("A4", "a9_11", 12, 10),
  learner("A5", "a9_11", 11, 12),
  learner("A6", "a9_11", 12, 11),
  learner("B1", "a12_14", 20, 20),
  learner("B2", "a12_14", 21, 20),
  learner("B3", "a12_14", 20, 21),
  learner("B4", "a12_14", 22, 20),
  learner("B5", "a12_14", 21, 22),
  learner("B6", "a12_14", 22, 21),
] satisfies readonly SyntheticLearner[];

function cohort(prefix: "A" | "B") {
  return {
    members: ROLE_VECTOR.map((role, index) => ({
      ref: `${prefix}${index + 1}`,
      role,
    })),
  };
}

const ASSIGNMENT = {
  id: "asg-view-v1",
  cohorts: [cohort("A"), cohort("B")],
  memberRefs: POOL.map(({ learnerRef }) => learnerRef),
  levelBands: { level: [10, 22], velocity: [10, 22] },
  candidateSetHash: "fixture-v1-synthetic",
  objectiveTerms: {
    closePace: 1,
    compatibleIntensity: 1,
    roleCoverage: 1,
    pairHistory: 1,
    rivalryDose: 1,
    churn: 1,
    repeatedPairings: 1,
  },
  constraints: HARD,
  start: "2026-07-21T00:00:00.000Z",
  plannedReview: "2026-07-28T00:00:00.000Z",
  priorAssignmentId: null,
  rollbackRef: null,
  sizeExceptions: [],
} satisfies BuildCohortArenaViewInput["assignment"];

const INPUT = {
  assignment: ASSIGNMENT,
  priorAssignment: null,
  pool: POOL,
  hard: HARD,
  churn: CHURN,
  flags: {
    reducedMotion: false,
    plain: false,
    band: "9-11",
    standingsOptIn: false,
  },
} satisfies BuildCohortArenaViewInput;

export function buildSyntheticCohortView(flags: Partial<ViewFlags> = {}): CohortArenaView {
  return buildCohortArenaView({
    ...INPUT,
    flags: { ...INPUT.flags, ...flags },
  });
}
