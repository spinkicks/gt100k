import {
  type CohortAssignment,
  type Role,
  assignCohorts,
  generateCandidates,
} from "../../../cohort-compiler/src/index.js";
import { cohort12 } from "../../../cohort-compiler/test/fixtures/cohort-12.js";
import type {
  BuildCohortArenaViewInput,
  CohortArenaView,
  CohortCardView,
  MoteView,
  ViewFlags,
} from "../../src/index.js";

const hard = cohort12.withBenefitOf(() => cohort12.expected.defaultBenefit);
const candidateSets = generateCandidates(cohort12.pool, cohort12.caliper);
const assignment: CohortAssignment = assignCohorts(
  cohort12.pool,
  candidateSets,
  hard,
  cohort12.weights,
  cohort12.churn,
).assignment;

const flags = {
  reducedMotion: false,
  plain: false,
  band: "9-11",
  standingsOptIn: false,
} as const satisfies ViewFlags;

const input = {
  assignment,
  priorAssignment: null,
  pool: cohort12.pool,
  candidateSets,
  hard,
  churn: cohort12.churn,
  flags,
} satisfies BuildCohortArenaViewInput;

interface ViewCohort12Expected {
  readonly cohortMemberRefs: readonly (readonly string[])[];
  readonly roleVector: readonly Role[];
  readonly settledMembers: readonly (readonly Pick<MoteView, "ref" | "pos" | "pos2d">[])[];
  readonly badges: CohortCardView["badges"];
  readonly nonHarmFloor: CohortCardView["nonHarmFloor"];
  readonly safeguarding: CohortArenaView["safeguarding"];
}

export const viewCohort12 = {
  input,
  expected: {
    cohortMemberRefs: cohort12.expected.cohortMemberRefs,
    roleVector: cohort12.expected.roles,
    settledMembers: [
      [
        { ref: "A1", pos: { x: -11, y: 0, z: 6 }, pos2d: { x: 536, y: 306 } },
        { ref: "A2", pos: { x: -5.804, y: 0, z: 3 }, pos2d: { x: 661, y: 378 } },
        { ref: "A3", pos: { x: -5.804, y: 0, z: -3 }, pos2d: { x: 661, y: 522 } },
        { ref: "A4", pos: { x: -11, y: 0, z: -6 }, pos2d: { x: 536, y: 594 } },
        { ref: "A5", pos: { x: -16.196, y: 0, z: -3 }, pos2d: { x: 411, y: 522 } },
        { ref: "A6", pos: { x: -16.196, y: 0, z: 3 }, pos2d: { x: 411, y: 378 } },
      ],
      [
        { ref: "B1", pos: { x: 11, y: 0, z: 6 }, pos2d: { x: 1064, y: 306 } },
        { ref: "B2", pos: { x: 16.196, y: 0, z: 3 }, pos2d: { x: 1189, y: 378 } },
        { ref: "B3", pos: { x: 16.196, y: 0, z: -3 }, pos2d: { x: 1189, y: 522 } },
        { ref: "B4", pos: { x: 11, y: 0, z: -6 }, pos2d: { x: 1064, y: 594 } },
        { ref: "B5", pos: { x: 5.804, y: 0, z: -3 }, pos2d: { x: 939, y: 522 } },
        { ref: "B6", pos: { x: 5.804, y: 0, z: 3 }, pos2d: { x: 939, y: 378 } },
      ],
    ],
    badges: [
      { constraint: "age", satisfied: true },
      { constraint: "schedule", satisfied: true },
      { constraint: "safeguarding-separation", satisfied: true },
      { constraint: "accommodations", satisfied: true },
      { constraint: "level-velocity-caliper", satisfied: true },
      { constraint: "individual-non-harm-floor", satisfied: true },
      { constraint: "churn-budget", satisfied: true },
    ],
    nonHarmFloor: {
      minBenefit: 0.825,
      floor: 0.5,
      allAbove: true,
    },
    safeguarding: {
      pending: [],
      pausedMoves: [],
      optimizationBypassed: false,
    },
  } satisfies ViewCohort12Expected,
};
