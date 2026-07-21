import { isFeasibleCohort } from "./constraints";
import type {
  CandidateSet,
  ChurnBudget,
  Cohort,
  CohortAssignment,
  HardConstraints,
  LearnerProfile,
  ObjectiveTerms,
  ObjectiveWeights,
  Role,
} from "./model";
import { scoreObjective } from "./objective";

const COHORT_SIZE = 6;
const MAX_GROUP_OPTIONS = 512;
const MAX_PARTITION_STATES = 2_048;
const MAX_SWAP_PASSES = 2;
const EPSILON = 1e-12;
const DAY_MS = 86_400_000;
const ROLES = ["anchor", "scout", "builder", "builder", "challenger", "scribe"] satisfies Role[];
const ZERO_TERMS = {
  closePace: 0,
  compatibleIntensity: 0,
  roleCoverage: 0,
  pairHistory: 0,
  rivalryDose: 0,
  churn: 0,
  repeatedPairings: 0,
} satisfies ObjectiveTerms;

export interface UnassignedLearner {
  ref: string;
  binding: string[];
}

export interface SolveResult {
  assignment: CohortAssignment;
  unassigned: UnassignedLearner[];
}

interface GroupOption {
  members: LearnerProfile[];
  score: number;
  key: string;
}

function compareRefs(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function ordered(members: LearnerProfile[]): LearnerProfile[] {
  return [...members].sort((left, right) => compareRefs(left.learnerRef, right.learnerRef));
}

function groupKey(members: LearnerProfile[]): string {
  return ordered(members)
    .map(({ learnerRef }) => learnerRef)
    .join(",");
}

function fnv1a32hex(value: string): string {
  let hash = 0x811c9dc5;

  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

function hashCandidateSets(candidateSets: CandidateSet[]): string {
  return fnv1a32hex(
    [...candidateSets]
      .sort((left, right) => compareRefs(left.learnerRef, right.learnerRef))
      .map(
        ({ learnerRef, candidates, hash }) =>
          `${learnerRef}>${candidates.map(({ ref }) => ref).join(",")}#${hash}`,
      )
      .join("|"),
  );
}

function combinations<T>(values: T[], count: number, limit: number): T[][] {
  const result: T[][] = [];
  const selected: T[] = [];

  function visit(start: number): void {
    if (result.length >= limit) return;
    if (selected.length === count) {
      result.push([...selected]);
      return;
    }

    for (let index = start; index <= values.length - (count - selected.length); index += 1) {
      const value = values[index];
      if (value === undefined) continue;
      selected.push(value);
      visit(index + 1);
      selected.pop();
    }
  }

  visit(0);
  return result;
}

function groupOptions(
  seed: LearnerProfile,
  remaining: LearnerProfile[],
  candidateByRef: Map<string, CandidateSet>,
  hard: HardConstraints,
  weights: ObjectiveWeights,
  prior: CohortAssignment | undefined,
): GroupOption[] {
  const remainingByRef = new Map(remaining.map((member) => [member.learnerRef, member]));
  const peers = (candidateByRef.get(seed.learnerRef)?.candidates ?? [])
    .flatMap(({ ref }) => {
      const member = remainingByRef.get(ref);
      return member ? [member] : [];
    })
    .sort((left, right) => compareRefs(left.learnerRef, right.learnerRef));

  return combinations(peers, COHORT_SIZE - 1, MAX_GROUP_OPTIONS)
    .map((peerGroup) => ordered([seed, ...peerGroup]))
    .filter((members) => isFeasibleCohort(members, hard, prior).ok)
    .map((members) => ({
      members,
      score: scoreObjective(members, weights, prior).total,
      key: groupKey(members),
    }))
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      return Math.abs(scoreDifference) > EPSILON
        ? scoreDifference
        : compareRefs(left.key, right.key);
    });
}

function assignmentChurn(prior: CohortAssignment, groups: LearnerProfile[][]): number {
  const indexes = (cohorts: { members: { ref: string }[] }[]) => {
    const result = new Map<string, number>();
    cohorts.forEach((cohort, cohortIndex) => {
      for (const { ref } of cohort.members) result.set(ref, cohortIndex);
    });
    return result;
  };
  const before = indexes(prior.cohorts);
  const after = indexes(
    groups.map((members) => ({ members: members.map(({ learnerRef: ref }) => ({ ref })) })),
  );
  const refs = new Set([...before.keys(), ...after.keys()]);

  return [...refs].filter((ref) => before.get(ref) !== after.get(ref)).length;
}

function withinChurnBudget(
  groups: LearnerProfile[][],
  churn: ChurnBudget,
  prior: CohortAssignment | undefined,
): boolean {
  if (!prior) return true;
  const allowance = churn.exceptions.reduce((sum, exception) => sum + exception.delta, 0);
  return churn.used + assignmentChurn(prior, groups) <= churn.cap + allowance;
}

function buildPartition(
  pool: LearnerProfile[],
  candidateByRef: Map<string, CandidateSet>,
  hard: HardConstraints,
  weights: ObjectiveWeights,
  churn: ChurnBudget,
  prior: CohortAssignment | undefined,
): LearnerProfile[][] {
  let bestGroups: LearnerProfile[][] = [];
  let bestScore = Number.NEGATIVE_INFINITY;
  let bestKey = "";
  let visited = 0;

  function visit(remaining: LearnerProfile[], groups: LearnerProfile[][], score: number): void {
    if (visited >= MAX_PARTITION_STATES) return;
    visited += 1;
    const normalized = groups
      .map(ordered)
      .sort((left, right) => compareRefs(groupKey(left), groupKey(right)));
    const key = normalized.map(groupKey).join("|");
    const hasMoreMembers = normalized.length > bestGroups.length;
    const hasBetterScore = score > bestScore + EPSILON;

    if (
      withinChurnBudget(normalized, churn, prior) &&
      (hasMoreMembers ||
        (normalized.length === bestGroups.length &&
          (hasBetterScore || (Math.abs(score - bestScore) <= EPSILON && key < bestKey))))
    ) {
      bestGroups = normalized;
      bestScore = score;
      bestKey = key;
    }

    if (remaining.length < COHORT_SIZE) return;
    const seed = remaining[0];
    if (!seed) return;

    for (const option of groupOptions(seed, remaining, candidateByRef, hard, weights, prior)) {
      const selected = new Set(option.members.map(({ learnerRef }) => learnerRef));
      visit(
        remaining.filter(({ learnerRef }) => !selected.has(learnerRef)),
        [...groups, option.members],
        score + option.score,
      );
    }

    visit(remaining.slice(1), groups, score);
  }

  visit(ordered(pool), [], 0);
  return bestGroups;
}

function totalScore(
  groups: LearnerProfile[][],
  weights: ObjectiveWeights,
  prior: CohortAssignment | undefined,
): number {
  return groups.reduce((sum, members) => sum + scoreObjective(members, weights, prior).total, 0);
}

function repairBySwaps(
  initial: LearnerProfile[][],
  hard: HardConstraints,
  weights: ObjectiveWeights,
  churn: ChurnBudget,
  prior: CohortAssignment | undefined,
): LearnerProfile[][] {
  let groups = initial.map(ordered);

  for (let pass = 0; pass < MAX_SWAP_PASSES; pass += 1) {
    const baseline = totalScore(groups, weights, prior);
    let best: { groups: LearnerProfile[][]; score: number; key: string } | undefined;

    for (let left = 0; left < groups.length; left += 1) {
      for (let right = left + 1; right < groups.length; right += 1) {
        for (let leftMember = 0; leftMember < COHORT_SIZE; leftMember += 1) {
          for (let rightMember = 0; rightMember < COHORT_SIZE; rightMember += 1) {
            const next = groups.map((members) => [...members]);
            const leftGroup = next[left];
            const rightGroup = next[right];
            const leftValue = leftGroup?.[leftMember];
            const rightValue = rightGroup?.[rightMember];
            if (!leftGroup || !rightGroup || !leftValue || !rightValue) continue;
            leftGroup[leftMember] = rightValue;
            rightGroup[rightMember] = leftValue;
            next[left] = ordered(leftGroup);
            next[right] = ordered(rightGroup);
            next.sort((first, second) => compareRefs(groupKey(first), groupKey(second)));
            if (
              !next.every((members) => isFeasibleCohort(members, hard, prior).ok) ||
              !withinChurnBudget(next, churn, prior)
            ) {
              continue;
            }

            const score = totalScore(next, weights, prior);
            const key = next.map(groupKey).join("|");
            if (
              score > baseline + EPSILON &&
              (!best ||
                score > best.score + EPSILON ||
                (Math.abs(score - best.score) <= EPSILON && key < best.key))
            ) {
              best = { groups: next, score, key };
            }
          }
        }
      }
    }

    if (!best) break;
    groups = best.groups;
  }

  return groups.sort((left, right) => compareRefs(groupKey(left), groupKey(right)));
}

function averageTerms(
  groups: LearnerProfile[][],
  weights: ObjectiveWeights,
  prior: CohortAssignment | undefined,
): ObjectiveTerms {
  if (groups.length === 0) return { ...ZERO_TERMS };
  const totals = { ...ZERO_TERMS };
  for (const members of groups) {
    const terms = scoreObjective(members, weights, prior).terms;
    for (const key of Object.keys(totals) as (keyof ObjectiveTerms)[]) totals[key] += terms[key];
  }
  for (const key of Object.keys(totals) as (keyof ObjectiveTerms)[]) totals[key] /= groups.length;
  return totals;
}

function isoWeekStart(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return "1970-01-01T00:00:00.000Z";
  const januaryFourth = Date.UTC(Number(match[1]), 0, 4);
  const day = (new Date(januaryFourth).getUTCDay() + 6) % 7;
  return new Date(januaryFourth - day * DAY_MS + (Number(match[2]) - 1) * 7 * DAY_MS).toISOString();
}

function toCohort(members: LearnerProfile[]): Cohort {
  return {
    members: ordered(members).map(({ learnerRef: ref }, index) => ({
      ref,
      role: ROLES[index] ?? "builder",
    })),
  };
}

/** Greedy-first deterministic construction with bounded partition and pair-swap repair. */
export function assignCohorts(
  pool: LearnerProfile[],
  candidates: CandidateSet[],
  hard: HardConstraints,
  weights: ObjectiveWeights,
  churn: ChurnBudget,
  prior?: CohortAssignment,
): SolveResult {
  const effectiveHard = { ...hard, churn } satisfies HardConstraints;
  const candidateByRef = new Map(
    candidates.map((candidateSet) => [candidateSet.learnerRef, candidateSet]),
  );
  const built = buildPartition(pool, candidateByRef, effectiveHard, weights, churn, prior);
  const groups = repairBySwaps(built, effectiveHard, weights, churn, prior);
  const assignedRefs = new Set(
    groups.flatMap((group) => group.map(({ learnerRef }) => learnerRef)),
  );
  const budgetBlocked = Boolean(prior) && !withinChurnBudget(groups, churn, prior);
  const unassigned = ordered(pool)
    .filter(({ learnerRef }) => !assignedRefs.has(learnerRef))
    .map((member) => {
      const sameAgeCount = pool.filter(({ ageBand }) => ageBand === member.ageBand).length;
      const candidateCount = candidateByRef.get(member.learnerRef)?.candidates.length ?? 0;
      const binding = budgetBlocked
        ? ["churn_budget: proposed assignment exceeds weekly cap"]
        : sameAgeCount < COHORT_SIZE
          ? [`age: fewer than six near-peers in age band ${member.ageBand}`]
          : candidateCount < COHORT_SIZE - 1
            ? ["candidates: fewer than five available near-peers"]
            : ["hard_constraints: no feasible six-member cohort"];
      return { ref: member.learnerRef, binding };
    });
  const assigned = groups.flat();
  const levels = assigned.map(({ level }) => level);
  const velocities = assigned.map(({ velocity }) => velocity);
  const candidateSetHash = hashCandidateSets(candidates);
  const cohorts = groups.map(toCohort);
  const cohortPreimage = cohorts
    .map((cohort) => cohort.members.map(({ ref }) => ref).join(","))
    .join("|");
  const start = isoWeekStart(churn.weekKey);
  const assignment: CohortAssignment = {
    id: `asg-${fnv1a32hex(`${candidateSetHash}|${cohortPreimage}|${prior?.id ?? "none"}`)}`,
    cohorts,
    memberRefs: ordered(assigned).map(({ learnerRef }) => learnerRef),
    levelBands: {
      level: assigned.length ? [Math.min(...levels), Math.max(...levels)] : [0, 0],
      velocity: assigned.length ? [Math.min(...velocities), Math.max(...velocities)] : [0, 0],
    },
    candidateSetHash,
    objectiveTerms: averageTerms(groups, weights, prior),
    constraints: effectiveHard,
    start,
    plannedReview: new Date(Date.parse(start) + 7 * DAY_MS).toISOString(),
    priorAssignmentId: prior?.id ?? null,
    rollbackRef: prior?.id ?? null,
    sizeExceptions: [],
  };

  return { assignment, unassigned };
}
