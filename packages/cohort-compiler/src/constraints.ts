import { withinCaliper } from "./caliper";
import type { CohortAssignment, HardConstraints, LearnerProfile } from "./model";

interface PairViolation {
  constraint:
    | "age"
    | "schedule"
    | "safeguarding_separation"
    | "accommodations"
    | "level_velocity_caliper";
  members: [string, string];
}

interface NonHarmViolation {
  constraint: "individual_non_harm_floor";
  member: string;
  value: number;
  floor: number;
}

interface ChurnViolation {
  constraint: "churn_budget";
  value: number;
  used: number;
  cap: number;
}

export type ConstraintViolation = PairViolation | NonHarmViolation | ChurnViolation;

export interface FeasibilityResult {
  ok: boolean;
  violations: ConstraintViolation[];
}

function firstViolatingPair(
  members: LearnerProfile[],
  violates: (left: LearnerProfile, right: LearnerProfile) => boolean,
): [LearnerProfile, LearnerProfile] | undefined {
  for (let leftIndex = 0; leftIndex < members.length; leftIndex += 1) {
    const left = members[leftIndex];

    if (!left) {
      continue;
    }

    for (let rightIndex = leftIndex + 1; rightIndex < members.length; rightIndex += 1) {
      const right = members[rightIndex];

      if (right && violates(left, right)) {
        return [left, right];
      }
    }
  }

  return undefined;
}

function pairRefs(pair: [LearnerProfile, LearnerProfile]): [string, string] {
  return [pair[0].learnerRef, pair[1].learnerRef];
}

function sharesScheduleBlock(left: LearnerProfile, right: LearnerProfile): boolean {
  return left.schedule.blocks.some((block) => right.schedule.blocks.includes(block));
}

function hasSafeguardingSeparation(left: LearnerProfile, right: LearnerProfile): boolean {
  return left.separations.includes(right.learnerRef) || right.separations.includes(left.learnerRef);
}

function hasMutualAccommodationBlock(left: LearnerProfile, right: LearnerProfile): boolean {
  const leftNeedBlocked = left.accommodations.needs.some((need) =>
    right.accommodations.conflicts.includes(need),
  );
  const rightNeedBlocked = right.accommodations.needs.some((need) =>
    left.accommodations.conflicts.includes(need),
  );

  return leftNeedBlocked && rightNeedBlocked;
}

function closestPriorMemberRefs(
  memberRefs: Set<string>,
  prior: CohortAssignment,
): Set<string> | undefined {
  let closest: Set<string> | undefined;
  let greatestOverlap = -1;

  for (const cohort of prior.cohorts) {
    const priorRefs = new Set(cohort.members.map(({ ref }) => ref));
    const overlap = [...memberRefs].filter((ref) => priorRefs.has(ref)).length;

    if (overlap > greatestOverlap) {
      closest = priorRefs;
      greatestOverlap = overlap;
    }
  }

  return closest;
}

function churnFromPrior(members: LearnerProfile[], prior: CohortAssignment): number {
  const memberRefs = new Set(members.map(({ learnerRef }) => learnerRef));
  const priorRefs = closestPriorMemberRefs(memberRefs, prior);

  if (!priorRefs) {
    return memberRefs.size;
  }

  const removed = [...priorRefs].filter((ref) => !memberRefs.has(ref)).length;
  const added = [...memberRefs].filter((ref) => !priorRefs.has(ref)).length;
  return removed + added;
}

function pushPairViolation(
  violations: ConstraintViolation[],
  constraint: PairViolation["constraint"],
  pair: [LearnerProfile, LearnerProfile] | undefined,
): void {
  if (pair) {
    violations.push({ constraint, members: pairRefs(pair) });
  }
}

/** Checks the seven inviolable cohort constraints without scoring or I/O. */
export function isFeasibleCohort(
  members: LearnerProfile[],
  hard: HardConstraints,
  prior?: CohortAssignment,
): FeasibilityResult {
  const violations: ConstraintViolation[] = [];

  pushPairViolation(
    violations,
    "age",
    firstViolatingPair(members, (left, right) => left.ageBand !== right.ageBand),
  );
  pushPairViolation(
    violations,
    "schedule",
    firstViolatingPair(members, (left, right) => !sharesScheduleBlock(left, right)),
  );
  pushPairViolation(
    violations,
    "safeguarding_separation",
    firstViolatingPair(members, hasSafeguardingSeparation),
  );
  pushPairViolation(
    violations,
    "accommodations",
    firstViolatingPair(members, hasMutualAccommodationBlock),
  );
  pushPairViolation(
    violations,
    "level_velocity_caliper",
    firstViolatingPair(members, (left, right) => !withinCaliper(left, right, hard.caliper)),
  );

  for (const member of members) {
    const value = hard.benefitOf(member, members);

    if (value < hard.nonHarmFloor) {
      violations.push({
        constraint: "individual_non_harm_floor",
        member: member.learnerRef,
        value,
        floor: hard.nonHarmFloor,
      });
    }
  }

  if (prior) {
    const churn = churnFromPrior(members, prior);
    const exceptionAllowance = hard.churn.exceptions.reduce(
      (total, exception) => total + exception.delta,
      0,
    );

    if (hard.churn.used + churn > hard.churn.cap + exceptionAllowance) {
      violations.push({
        constraint: "churn_budget",
        value: churn,
        used: hard.churn.used,
        cap: hard.churn.cap,
      });
    }
  }

  return { ok: violations.length === 0, violations };
}
