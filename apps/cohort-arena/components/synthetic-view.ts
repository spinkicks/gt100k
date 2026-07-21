import {
  type BuildCohortArenaViewInput,
  type CohortArenaView,
  type ViewFlags,
  buildCohortArenaView,
} from "@gt100k/cohort-arena-view";

type SyntheticLearner = NonNullable<BuildCohortArenaViewInput["pool"]>[number];

export const SYNTHETIC_CHURN_BUDGET: BuildCohortArenaViewInput["churn"] = {
  weekKey: "2026-W30",
  cap: 4,
  used: 0,
  exceptions: [],
};

const HARD = {
  age: true,
  schedule: true,
  separations: true,
  accommodations: true,
  caliper: { levelTolerance: 2, velocityTolerance: 2, k: 10 },
  nonHarmFloor: 0.5,
  benefitOf: () => 0.825,
  churn: SYNTHETIC_CHURN_BUDGET,
} satisfies BuildCohortArenaViewInput["hard"];

const ROLE_VECTOR = ["anchor", "scout", "builder", "builder", "challenger", "scribe"] as const;

const STANDINGS = {
  self: { selfGain: 300 },
  nearPeers: [
    { pseudonym: "kestrel", gain: 260 },
    { pseudonym: "otter", gain: 340 },
    { pseudonym: "finch", gain: 300 },
  ],
  optedIn: true,
} satisfies NonNullable<BuildCohortArenaViewInput["standings"]>;

const RIVALRY = {
  perSpeaker: {
    S1: { turnShare: 4 / 6, speakingTime: 40, interruptions: 0 },
    S2: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
    S3: { turnShare: 1 / 6, speakingTime: 5, interruptions: 0 },
  },
  patterns: [
    {
      kind: "dominance",
      subjects: ["S1"],
      evidence: "S1 holds 4/6 turns (66.7%) > 50%",
    },
  ],
  confidence: 1,
  suppressed: false,
} satisfies NonNullable<BuildCohortArenaViewInput["rivalry"]>;

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

const ROLLBACK_POOL = [
  ...POOL,
  learner("A7", "a9_11", 12, 11),
] satisfies readonly SyntheticLearner[];

const ROLLBACK_CURRENT_ASSIGNMENT = {
  ...ASSIGNMENT,
  id: "asg-view-v2",
  cohorts: ASSIGNMENT.cohorts.map((existingCohort, cohortIndex) => ({
    members: existingCohort.members.map((member) =>
      cohortIndex === 0 && member.ref === "A6" ? { ...member, ref: "A7" } : { ...member },
    ),
  })),
  memberRefs: ASSIGNMENT.memberRefs.map((ref) => (ref === "A6" ? "A7" : ref)),
  priorAssignmentId: ASSIGNMENT.id,
  rollbackRef: ASSIGNMENT.id,
} satisfies BuildCohortArenaViewInput["assignment"];

export const SYNTHETIC_ROLLBACK_ASSIGNMENTS = {
  current: ROLLBACK_CURRENT_ASSIGNMENT,
  prior: ASSIGNMENT,
} as const;

const INPUT = {
  assignment: ASSIGNMENT,
  priorAssignment: null,
  pool: POOL,
  hard: HARD,
  churn: SYNTHETIC_CHURN_BUDGET,
  standings: STANDINGS,
  rivalry: RIVALRY,
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

export function buildSyntheticRollbackViews(flags: Partial<ViewFlags> = {}): {
  readonly current: CohortArenaView;
  readonly prior: CohortArenaView;
} {
  const mergedFlags = { ...INPUT.flags, ...flags };

  return {
    current: buildCohortArenaView({
      ...INPUT,
      assignment: ROLLBACK_CURRENT_ASSIGNMENT,
      priorAssignment: ASSIGNMENT,
      pool: ROLLBACK_POOL,
      flags: mergedFlags,
    }),
    prior: buildCohortArenaView({
      ...INPUT,
      assignment: ASSIGNMENT,
      priorAssignment: ROLLBACK_CURRENT_ASSIGNMENT,
      pool: ROLLBACK_POOL,
      flags: mergedFlags,
    }),
  };
}
