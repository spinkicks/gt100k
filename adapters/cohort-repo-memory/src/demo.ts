import { pathToFileURL } from "node:url";
import {
  type ActiveCohortMove,
  analyzeTurns,
  assignCohorts,
  commit,
  generateCandidates,
  isFeasibleCohort,
  membershipChurn,
  repairCohort,
  rollback,
  routeHealthEvent,
  withinCaliper,
} from "../../../packages/cohort-compiler/src/index";
import type {
  CohortAssignment,
  CommitResult,
  LearnerProfile,
  TurnAnalysis,
} from "../../../packages/cohort-compiler/src/model";
import type { RepairAccepted } from "../../../packages/cohort-compiler/src/repair";
import { churnRollback } from "../../../packages/cohort-compiler/test/fixtures/churn-rollback";
import {
  cohort12,
  cohort12HardConstraints,
} from "../../../packages/cohort-compiler/test/fixtures/cohort-12";
import { safeguardingShadow } from "../../../packages/cohort-compiler/test/fixtures/safeguarding-shadow";
import {
  rivalryMixThresholds,
  turnsFixtures,
} from "../../../packages/cohort-compiler/test/fixtures/turns";
import { ShadowBenefitEstimator } from "../../cohort-benefit-shadow/src/index";
import { InMemorySafeguardingSink } from "../../cohort-safeguarding-memory/src/index";
import { InMemoryCohortRepository } from "./index";

interface DemoLifecycle {
  initialCommit: CommitResult;
  repairChurn: number;
  repairCommit: CommitResult;
  guideVeto: RepairAccepted["guideVeto"];
  oneClickRollback: RepairAccepted["oneClickRollback"];
  restoredAssignmentId: string;
  restoredByteIdentical: boolean;
  activeAssignmentAfterRollback: string | null;
}

export interface CohortCompilerDemoResult {
  source: "synthetic";
  candidates: {
    poolSize: number;
    setCount: number;
    deterministic: boolean;
    allWithinCaliper: boolean;
    excludesSelf: boolean;
  };
  solve: {
    assignmentId: string;
    cohortMemberRefs: string[][];
    unassignedRefs: string[];
    allCohortsFeasible: boolean;
  };
  lifecycle: DemoLifecycle;
  safeguarding: {
    pendingCount: number;
    pausedMoveIds: string[];
    untouchedMoveIds: string[];
    assignmentUnchanged: boolean;
  };
  shadowBenefit: Awaited<ReturnType<ShadowBenefitEstimator["logAfterLock"]>>;
  rivalryMix: TurnAnalysis;
}

function demoPool(): LearnerProfile[] {
  const a7 = churnRollback.pool.find(({ learnerRef }) => learnerRef === "A7");
  if (!a7) throw new Error("synthetic-demo-a7-missing");
  return [...cohort12.pool, a7];
}

function proposedRepair(
  assignment: CohortAssignment,
  pool: LearnerProfile[],
  incomingRef: string,
): CohortAssignment {
  const profileByRef = new Map(pool.map((profile) => [profile.learnerRef, profile]));
  const incoming = profileByRef.get(incomingRef);
  if (!incoming) throw new Error("synthetic-demo-unassigned-profile-missing");

  const cohortIndex = assignment.cohorts.findIndex(({ members }) =>
    members.some(({ ref }) => profileByRef.get(ref)?.ageBand === incoming.ageBand),
  );
  const cohort = assignment.cohorts[cohortIndex];
  const outgoing = cohort?.members.at(-1);
  if (cohortIndex < 0 || !cohort || !outgoing) {
    throw new Error("synthetic-demo-repair-cohort-missing");
  }

  return {
    ...assignment,
    id: `${assignment.id}-repair`,
    cohorts: assignment.cohorts.map((current, index) => ({
      members:
        index === cohortIndex
          ? current.members.map((member) =>
              member.ref === outgoing.ref ? { ...member, ref: incomingRef } : { ...member },
            )
          : current.members.map((member) => ({ ...member })),
    })),
    memberRefs: assignment.memberRefs
      .map((ref) => (ref === outgoing.ref ? incomingRef : ref))
      .sort(),
    priorAssignmentId: null,
    rollbackRef: null,
  };
}

/** Run the synthetic-only quickstart flow without network, media capture, or production I/O. */
export async function runCohortCompilerDemo(): Promise<CohortCompilerDemoResult> {
  const pool = demoPool();
  const candidateSets = generateCandidates(pool, cohort12.caliper);
  const repeatedCandidateSets = generateCandidates(pool, cohort12.caliper);
  const profileByRef = new Map(pool.map((profile) => [profile.learnerRef, profile]));
  const solve = assignCohorts(
    pool,
    candidateSets,
    cohort12HardConstraints,
    cohort12.weights,
    cohort12.churn,
  );
  const repository = new InMemoryCohortRepository();
  const initialCommit = await commit(repository, solve.assignment, cohort12.churn);
  const incomingRef = solve.unassigned[0]?.ref;
  if (!initialCommit.ok || !incomingRef) throw new Error("synthetic-demo-initial-stage-failed");

  const proposal = proposedRepair(solve.assignment, pool, incomingRef);
  const repair = repairCohort(proposal, churnRollback.budgets.capTwo, solve.assignment);
  if (!("repaired" in repair)) throw new Error("synthetic-demo-repair-requires-staff");
  const repairCommit = await commit(repository, repair.repaired, churnRollback.budgets.capTwo);
  if (!repairCommit.ok) throw new Error("synthetic-demo-repair-commit-failed");
  const restored = await rollback(repository, repair.repaired.id);
  const activeAfterRollback = await repository.activeFor(restored.memberRefs[0] ?? "");

  const sink = new InMemorySafeguardingSink();
  const assignmentBeforeSafeguarding = JSON.stringify(solve.assignment);
  const moves: ActiveCohortMove[] = safeguardingShadow.activeMoves.map((move) => ({
    ...move,
    touches: [...move.touches],
  }));
  await routeHealthEvent(
    sink,
    { ...safeguardingShadow.event, assignmentId: solve.assignment.id },
    moves,
  );
  const pendingEvents = await sink.pending();

  const shadowEstimator = new ShadowBenefitEstimator([solve.assignment.id]);
  const shadowBenefit = await shadowEstimator.logAfterLock(
    solve.assignment.id,
    safeguardingShadow.expected.shadowBenefit.loggedAt,
  );
  const rivalryMix = analyzeTurns(turnsFixtures.dominance.turns, rivalryMixThresholds);

  return {
    source: "synthetic",
    candidates: {
      poolSize: pool.length,
      setCount: candidateSets.length,
      deterministic: JSON.stringify(candidateSets) === JSON.stringify(repeatedCandidateSets),
      allWithinCaliper: candidateSets.every(({ learnerRef, candidates }) => {
        const learner = profileByRef.get(learnerRef);
        return Boolean(
          learner &&
            candidates.every(({ ref }) => {
              const candidate = profileByRef.get(ref);
              return candidate ? withinCaliper(learner, candidate, cohort12.caliper) : false;
            }),
        );
      }),
      excludesSelf: candidateSets.every(({ learnerRef, candidates }) =>
        candidates.every(({ ref }) => ref !== learnerRef),
      ),
    },
    solve: {
      assignmentId: solve.assignment.id,
      cohortMemberRefs: solve.assignment.cohorts.map(({ members }) =>
        members.map(({ ref }) => ref),
      ),
      unassignedRefs: solve.unassigned.map(({ ref }) => ref),
      allCohortsFeasible: solve.assignment.cohorts.every(
        ({ members }) =>
          isFeasibleCohort(
            members.flatMap(({ ref }) => {
              const member = profileByRef.get(ref);
              return member ? [member] : [];
            }),
            cohort12HardConstraints,
          ).ok,
      ),
    },
    lifecycle: {
      initialCommit,
      repairChurn: membershipChurn(solve.assignment, repair.repaired),
      repairCommit,
      guideVeto: repair.guideVeto,
      oneClickRollback: repair.oneClickRollback,
      restoredAssignmentId: restored.id,
      restoredByteIdentical: JSON.stringify(restored) === JSON.stringify(solve.assignment),
      activeAssignmentAfterRollback: activeAfterRollback?.id ?? null,
    },
    safeguarding: {
      pendingCount: pendingEvents.length,
      pausedMoveIds: moves.filter(({ paused }) => paused).map(({ moveId }) => moveId),
      untouchedMoveIds: moves.filter(({ paused }) => !paused).map(({ moveId }) => moveId),
      assignmentUnchanged: JSON.stringify(solve.assignment) === assignmentBeforeSafeguarding,
    },
    shadowBenefit,
    rivalryMix,
  };
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  runCohortCompilerDemo()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    });
}
