import type {
  CohortAssignment,
  LearnerProfile,
  ObjectiveTerms,
  ObjectiveWeights,
  Role,
  WorkingRhythm,
} from "./model";

export interface ObjectiveScore {
  total: number;
  terms: ObjectiveTerms;
}

interface MemberPair {
  left: LearnerProfile;
  right: LearnerProfile;
}

const REQUIRED_ROLE_COUNTS = {
  anchor: 1,
  scout: 1,
  builder: 2,
  challenger: 1,
  scribe: 1,
} satisfies Record<Role, number>;

function compareRefs(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function memberPairs(members: LearnerProfile[]): MemberPair[] {
  const ordered = [...members].sort((left, right) =>
    compareRefs(left.learnerRef, right.learnerRef),
  );
  const pairs: MemberPair[] = [];

  for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
    const left = ordered[leftIndex];

    if (!left) {
      continue;
    }

    for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
      const right = ordered[rightIndex];

      if (right) {
        pairs.push({ left, right });
      }
    }
  }

  return pairs;
}

function closePace(members: LearnerProfile[]): number {
  if (members.length < 2) {
    return 1;
  }

  const velocities = members.map(({ velocity }) => velocity);
  const spread = Math.max(...velocities) - Math.min(...velocities);

  return 1 / (1 + spread);
}

function rhythmsAreCompatible(
  left: WorkingRhythm | undefined,
  right: WorkingRhythm | undefined,
): boolean {
  const normalizedLeft = left ?? "flex";
  const normalizedRight = right ?? "flex";

  return (
    normalizedLeft === "flex" || normalizedRight === "flex" || normalizedLeft === normalizedRight
  );
}

function compatibleIntensity(pairs: MemberPair[]): number {
  if (pairs.length === 0) {
    return 1;
  }

  const compatiblePairs = pairs.filter(({ left, right }) =>
    rhythmsAreCompatible(left.workingRhythm, right.workingRhythm),
  ).length;

  return compatiblePairs / pairs.length;
}

function roleCoverage(members: LearnerProfile[]): number {
  const preferences = members.flatMap(({ preferredRole }) =>
    preferredRole ? [preferredRole] : [],
  );

  if (preferences.length === 0) {
    return 1;
  }

  const coveredSlots = Object.entries(REQUIRED_ROLE_COUNTS).reduce(
    (total, [role, required]) =>
      total + Math.min(required, preferences.filter((preference) => preference === role).length),
    0,
  );

  return coveredSlots / preferences.length;
}

function flagsForPair({ left, right }: MemberPair): ("positive" | "negative")[] {
  return [
    ...(left.pairHistory ?? [])
      .filter(({ ref }) => ref === right.learnerRef)
      .map(({ flag }) => flag),
    ...(right.pairHistory ?? [])
      .filter(({ ref }) => ref === left.learnerRef)
      .map(({ flag }) => flag),
  ];
}

function pairHistory(pairs: MemberPair[]): number {
  if (pairs.length === 0) {
    return 0.5;
  }

  const total = pairs.reduce((sum, pair) => {
    const flags = flagsForPair(pair);

    if (flags.includes("negative")) {
      return sum;
    }

    return sum + (flags.includes("positive") ? 1 : 0.5);
  }, 0);

  return total / pairs.length;
}

function rivalryDose(members: LearnerProfile[]): number {
  const challengerCount = members.filter(
    ({ preferredRole }) => preferredRole === "challenger",
  ).length;

  return challengerCount <= 1 ? 1 : 1 / challengerCount;
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

function churn(members: LearnerProfile[], prior: CohortAssignment | null | undefined): number {
  if (!prior) {
    return 1;
  }

  const memberRefs = new Set(members.map(({ learnerRef }) => learnerRef));
  const priorRefs = closestPriorMemberRefs(memberRefs, prior);

  if (!priorRefs) {
    return 1 / (1 + memberRefs.size);
  }

  const removed = [...priorRefs].filter((ref) => !memberRefs.has(ref)).length;
  const added = [...memberRefs].filter((ref) => !priorRefs.has(ref)).length;

  return 1 / (1 + removed + added);
}

function repeatedPairings(pairs: MemberPair[]): number {
  if (pairs.length === 0) {
    return 1;
  }

  const repeats = pairs.filter((pair) => flagsForPair(pair).length > 0).length;

  return 1 - repeats / pairs.length;
}

/**
 * Scores an already-feasible cohort. Callers must apply the hard-constraint gate before ranking.
 */
export function scoreObjective(
  members: LearnerProfile[],
  weights: ObjectiveWeights,
  prior?: CohortAssignment | null,
): ObjectiveScore {
  const pairs = memberPairs(members);
  const terms: ObjectiveTerms = {
    closePace: closePace(members),
    compatibleIntensity: compatibleIntensity(pairs),
    roleCoverage: roleCoverage(members),
    pairHistory: pairHistory(pairs),
    rivalryDose: rivalryDose(members),
    churn: churn(members, prior),
    repeatedPairings: repeatedPairings(pairs),
  };
  const total =
    terms.closePace * weights.closePace +
    terms.compatibleIntensity * weights.compatibleIntensity +
    terms.roleCoverage * weights.roleCoverage +
    terms.pairHistory * weights.pairHistory +
    terms.rivalryDose * weights.rivalryDose +
    terms.churn * weights.churn +
    terms.repeatedPairings * weights.repeatedPairings;

  return { total, terms };
}
