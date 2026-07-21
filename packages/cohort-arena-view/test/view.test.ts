import { describe, expect, it } from "vitest";

import {
  type CohortAssignment,
  type LearnerProfile,
  assignCohorts,
  generateCandidates,
} from "../../cohort-compiler/src/index.js";
import { cohort12 } from "../../cohort-compiler/test/fixtures/cohort-12.js";
import {
  type BuildCohortArenaViewInput,
  buildCohortArenaView,
  plainViewEquals,
} from "../src/index.js";

const HARD = cohort12.withBenefitOf(() => cohort12.expected.defaultBenefit);
const CANDIDATE_SETS = generateCandidates(cohort12.pool, cohort12.caliper);
const ASSIGNMENT = assignCohorts(
  cohort12.pool,
  CANDIDATE_SETS,
  HARD,
  cohort12.weights,
  cohort12.churn,
).assignment;

const FLAGS = {
  reducedMotion: false,
  plain: false,
  band: "9-11",
  standingsOptIn: false,
} as const;

function inputFor(
  assignment: CohortAssignment = ASSIGNMENT,
  priorAssignment: CohortAssignment | null = null,
  pool: readonly LearnerProfile[] = cohort12.pool,
): BuildCohortArenaViewInput {
  return {
    assignment,
    priorAssignment,
    pool,
    candidateSets: CANDIDATE_SETS,
    hard: HARD,
    churn: cohort12.churn,
    flags: FLAGS,
  };
}

function domainProjection(assignment: CohortAssignment) {
  return {
    id: assignment.id,
    cohorts: assignment.cohorts.map((cohort) =>
      cohort.members.map(({ ref, role }) => ({ ref, role })),
    ),
    memberRefs: [...assignment.memberRefs],
    priorAssignmentId: assignment.priorAssignmentId,
    rollbackRef: assignment.rollbackRef,
    objectiveTerms: { ...assignment.objectiveTerms },
  };
}

const EXPECTED_BADGES = [
  "age",
  "schedule",
  "safeguarding-separation",
  "accommodations",
  "level-velocity-caliper",
  "individual-non-harm-floor",
  "churn-budget",
] as const;

describe("the composed Cohort Arena view", () => {
  it("builds Fixture V1 as one exact deterministic renderer view", () => {
    const input = inputFor();
    const first = buildCohortArenaView(input);
    const second = buildCohortArenaView(input);

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first.constellation.hexes).toHaveLength(2);
    expect(first.constellation.bench).toEqual([]);
    expect(first.constellation.hexes.map((hex) => hex.members.map(({ ref }) => ref))).toEqual(
      cohort12.expected.cohortMemberRefs,
    );
    expect(first.cohorts).toHaveLength(2);

    for (const [cohortIndex, cohort] of first.cohorts.entries()) {
      expect(cohort.cohortIndex).toBe(cohortIndex);
      expect(cohort.members).toEqual(
        cohort12.expected.cohortMemberRefs[cohortIndex]?.map((ref, roleIndex) => ({
          ref,
          role: cohort12.expected.roles[roleIndex],
        })),
      );
      expect(cohort.badges).toEqual(
        EXPECTED_BADGES.map((constraint) => ({ constraint, satisfied: true })),
      );
      expect(cohort.nonHarmFloor).toEqual({
        minBenefit: 0.825,
        floor: 0.5,
        allAbove: true,
      });
      expect(cohort.churnDelta).toBe(0);
    }

    expect(first.standings).toBeNull();
    expect(first.rivalry).toBeNull();
    expect(first.safeguarding).toEqual({
      pending: [],
      pausedMoves: [],
      optimizationBypassed: false,
    });
    expect(Object.keys(first.motion)).toHaveLength(19);
    expect(first.presentation).toMatchObject({
      band: "9-11",
      labelStyle: "growth",
      markerScale: 1.1,
      celebrationCeiling: "standard",
      plain: false,
    });
    expect(first.ledger.cohortTree).toHaveLength(2);
    expect(first.ledger.cohortTree[0]?.label).toContain("0.825 ≥ 0.5");
    expect(first.ledger.cohortTree[0]?.children.map(({ label }) => label)).toEqual(
      expect.arrayContaining([
        "A1 — anchor — assigned",
        "age — satisfied",
        "churn-budget — satisfied",
      ]),
    );
    expect(first.ledger.standingsText).toBeNull();
    expect(first.ledger.rivalryList).toEqual([]);
    expect(first.ledger.safeguardingAlert).toBeNull();
    expect(first.ledger.announce).toBe("Compiled 2 cohorts with 12 assigned learners.");
  });

  it("changes only motion and presentation across reduced, plain, and age-band flags", () => {
    const baseline = buildCohortArenaView(inputFor());
    const alternate = buildCohortArenaView({
      ...inputFor(),
      flags: {
        reducedMotion: true,
        plain: true,
        band: "6-8",
        standingsOptIn: false,
      },
    });

    expect(plainViewEquals(baseline, alternate)).toBe(true);
    expect(alternate.constellation).toEqual(baseline.constellation);
    expect(alternate.cohorts).toEqual(baseline.cohorts);
    expect(alternate.standings).toEqual(baseline.standings);
    expect(alternate.rivalry).toEqual(baseline.rivalry);
    expect(alternate.safeguarding).toEqual(baseline.safeguarding);
    expect(alternate.motion.compile).toEqual({
      kind: "compile",
      mode: "reduced",
      durationMs: 0,
      easing: "linear",
    });
    expect(alternate.presentation).toMatchObject({
      band: "6-8",
      labelStyle: "story",
      markerScale: 1.25,
      celebrationCeiling: "gentle",
      plain: true,
    });
  });

  it("renders the A6 to A7 rollback diff without mutating either domain snapshot", () => {
    const replacement = {
      ...cohort12.pool.find(({ learnerRef }) => learnerRef === "A6")!,
      learnerRef: "A7",
    } satisfies LearnerProfile;
    const current: CohortAssignment = {
      ...ASSIGNMENT,
      id: "asg-2",
      cohorts: ASSIGNMENT.cohorts.map((cohort, cohortIndex) => ({
        members: cohort.members.map((member) =>
          cohortIndex === 0 && member.ref === "A6" ? { ...member, ref: "A7" } : { ...member },
        ),
      })),
      memberRefs: ASSIGNMENT.memberRefs.map((ref) => (ref === "A6" ? "A7" : ref)),
      priorAssignmentId: ASSIGNMENT.id,
      rollbackRef: ASSIGNMENT.id,
    };
    const currentBefore = domainProjection(current);
    const priorBefore = domainProjection(ASSIGNMENT);

    const view = buildCohortArenaView(
      inputFor(current, ASSIGNMENT, [...cohort12.pool, replacement]),
    );

    expect(view.cohorts.map(({ churnDelta }) => churnDelta)).toEqual([2, 0]);
    expect(view.ledger.announce).toBe("Assignment changed — removed:[A6]; added:[A7].");
    expect(domainProjection(current)).toEqual(currentBefore);
    expect(domainProjection(ASSIGNMENT)).toEqual(priorBefore);
  });
});
