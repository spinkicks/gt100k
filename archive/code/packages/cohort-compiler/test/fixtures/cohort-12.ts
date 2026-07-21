import type {
  AgeBand,
  Caliper,
  ChurnBudget,
  HardConstraints,
  LearnerProfile,
  ObjectiveWeights,
  Role,
} from "../../src/model";

type HardFixtureConfig = Omit<HardConstraints, "benefitOf">;

function withBenefitOf(
  config: HardFixtureConfig,
  benefitOf: HardConstraints["benefitOf"],
): HardConstraints {
  return { ...config, benefitOf };
}

const roleVector = [
  "anchor",
  "scout",
  "builder",
  "builder",
  "challenger",
  "scribe",
] satisfies Role[];

function learner(
  learnerRef: string,
  ageBand: AgeBand,
  level: number,
  velocity: number,
): LearnerProfile {
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

export const cohort12Churn = {
  weekKey: "2026-W30",
  cap: 4,
  used: 0,
  exceptions: [],
} satisfies ChurnBudget;

const cohort12HardConfig = {
  age: true,
  schedule: true,
  separations: true,
  accommodations: true,
  caliper: { levelTolerance: 2, velocityTolerance: 2, k: 10 },
  nonHarmFloor: 0.5,
  churn: cohort12Churn,
} satisfies HardFixtureConfig;

export const cohort12 = {
  caliper: { levelTolerance: 2, velocityTolerance: 2, k: 10 },
  hardConfig: cohort12HardConfig,
  withBenefitOf: (benefitOf: HardConstraints["benefitOf"]) =>
    withBenefitOf(cohort12HardConfig, benefitOf),
  churn: cohort12Churn,
  weights: {
    closePace: 1,
    compatibleIntensity: 1,
    roleCoverage: 1,
    pairHistory: 1,
    rivalryDose: 1,
    churn: 1,
    repeatedPairings: 1,
  },
  prior: null,
  pool: [
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
  ],
  expected: {
    cohortMemberRefs: [
      ["A1", "A2", "A3", "A4", "A5", "A6"],
      ["B1", "B2", "B3", "B4", "B5", "B6"],
    ],
    roles: roleVector,
    unassigned: [],
    hardConstraintViolations: 0,
    defaultBenefit: 0.825,
  },
} satisfies {
  caliper: Caliper;
  hardConfig: HardFixtureConfig;
  withBenefitOf: (benefitOf: HardConstraints["benefitOf"]) => HardConstraints;
  churn: ChurnBudget;
  weights: ObjectiveWeights;
  prior: null;
  pool: LearnerProfile[];
  expected: {
    cohortMemberRefs: string[][];
    roles: Role[];
    unassigned: { ref: string; binding: string[] }[];
    hardConstraintViolations: number;
    defaultBenefit: number;
  };
};

export const cohort12HardConstraints = {
  ...cohort12.withBenefitOf(() => cohort12.expected.defaultBenefit),
} satisfies HardConstraints;

const infeasibleLearner = learner("C1", "a6_8", 5, 5);

export const cohort13Infeasible = {
  pool: [...cohort12.pool, infeasibleLearner],
  expected: {
    cohortMemberRefs: cohort12.expected.cohortMemberRefs,
    unassigned: [
      {
        ref: "C1",
        binding: ["age: fewer than six near-peers in age band a6_8"],
      },
    ],
  },
} satisfies {
  pool: LearnerProfile[];
  expected: {
    cohortMemberRefs: string[][];
    unassigned: { ref: string; binding: string[] }[];
  };
};

const nonHarmMembers = [
  learner("M1", "a9_11", 10, 10),
  learner("M2", "a9_11", 10, 10),
  learner("M3", "a9_11", 10, 10),
  learner("M4", "a9_11", 10, 10),
  learner("M5", "a9_11", 10, 10),
  learner("M6", "a9_11", 10, 10),
] satisfies LearnerProfile[];

const benefitByRef: Record<string, number> = {
  M1: 0.9,
  M2: 0.8,
  M3: 0.7,
  M4: 0.6,
  M5: 0.45,
  M6: 0.8,
};

const boundaryBenefitByRef: Record<string, number> = { ...benefitByRef, M5: 0.5 };

export const nonHarmReject = {
  members: nonHarmMembers,
  benefitByRef,
  hard: {
    ...cohort12.hardConfig,
    benefitOf: (member) => benefitByRef[member.learnerRef] ?? 0,
  },
  boundaryHard: {
    ...cohort12.hardConfig,
    benefitOf: (member) => boundaryBenefitByRef[member.learnerRef] ?? 0,
  },
  expected: {
    meanBenefit: 4.25 / 6,
    rejected: {
      ok: false,
      violations: [
        {
          constraint: "individual_non_harm_floor",
          member: "M5",
          value: 0.45,
          floor: 0.5,
        },
      ],
    },
    boundary: { ok: true, violations: [] },
  },
} satisfies {
  members: LearnerProfile[];
  benefitByRef: Record<string, number>;
  hard: HardConstraints;
  boundaryHard: HardConstraints;
  expected: {
    meanBenefit: number;
    rejected: {
      ok: boolean;
      violations: { constraint: string; member: string; value: number; floor: number }[];
    };
    boundary: { ok: boolean; violations: never[] };
  };
};

const nonHarmDefaultMembers = [
  {
    ...learner("D1", "a9_11", 10, 10),
    preferredRole: "anchor",
    workingRhythm: "steady",
  },
  {
    ...learner("D2", "a9_11", 11, 10),
    preferredRole: "scout",
    workingRhythm: "steady",
  },
  {
    ...learner("D3", "a9_11", 10, 11),
    accommodations: { needs: [], conflicts: ["low-stim"] },
    preferredRole: "challenger",
    workingRhythm: "steady",
  },
  {
    ...learner("D4", "a9_11", 12, 10),
    preferredRole: "builder",
    workingRhythm: "flex",
  },
  {
    ...learner("D5", "a9_11", 11, 12),
    preferredRole: "builder",
    workingRhythm: "burst",
  },
  {
    ...learner("D6", "a9_11", 12, 11),
    accommodations: { needs: ["quiet", "low-stim"], conflicts: [] },
    pairHistory: [{ ref: "D2", flag: "negative" }],
    preferredRole: "builder",
    workingRhythm: "burst",
  },
] satisfies LearnerProfile[];

const nonHarmDefaultBoundaryMembers: LearnerProfile[] = nonHarmDefaultMembers.map((member) =>
  member.learnerRef === "D3"
    ? { ...member, accommodations: { ...member.accommodations, conflicts: [] } }
    : member,
);

export const nonHarmDefaultBind = {
  members: nonHarmDefaultMembers,
  boundaryMembers: nonHarmDefaultBoundaryMembers,
  hardConfig: cohort12.hardConfig,
  withBenefitOf: cohort12.withBenefitOf,
  expected: {
    factorsByRef: {
      D1: { accommodation: 1, history: 0.5, pace: 0.8 },
      D2: { accommodation: 1, history: 0.5, pace: 0.8 },
      D3: { accommodation: 1, history: 0.5, pace: 0.8 },
      D4: { accommodation: 1, history: 0.5, pace: 0.8 },
      D5: { accommodation: 1, history: 0.5, pace: 0.5 },
      D6: { accommodation: 0.5, history: 0.3, pace: 0.5 },
    },
    benefitByRef: {
      D1: 0.775,
      D2: 0.775,
      D3: 0.775,
      D4: 0.775,
      D5: 0.7,
      D6: 0.43,
    },
    meanBenefit: 0.705,
    rejected: {
      ok: false,
      violations: [
        {
          constraint: "individual_non_harm_floor",
          member: "D6",
          value: 0.43,
          floor: 0.5,
        },
      ],
    },
    boundaryBenefit: 0.63,
    boundary: { ok: true, violations: [] },
    tolerance: 1e-9,
  },
} satisfies {
  members: LearnerProfile[];
  boundaryMembers: LearnerProfile[];
  hardConfig: HardFixtureConfig;
  withBenefitOf: (benefitOf: HardConstraints["benefitOf"]) => HardConstraints;
  expected: {
    factorsByRef: Record<string, { accommodation: number; history: number; pace: number }>;
    benefitByRef: Record<string, number>;
    meanBenefit: number;
    rejected: {
      ok: boolean;
      violations: { constraint: string; member: string; value: number; floor: number }[];
    };
    boundaryBenefit: number;
    boundary: { ok: boolean; violations: never[] };
    tolerance: number;
  };
};
