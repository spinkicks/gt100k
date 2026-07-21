import type { CohortArenaView, LedgerView } from "./model.js";
import { sanitizeArenaRoomView } from "./rivalry.js";

type LedgerSource = Pick<CohortArenaView, "cohorts" | "standings" | "rivalry" | "safeguarding">;

function buildRivalryList(view: LedgerSource): string[] {
  if (!view.rivalry || view.rivalry.seats.length === 0) {
    return ["Analytics off — no turn-taking analytics were supplied."];
  }

  const rivalry = sanitizeArenaRoomView(view.rivalry);
  const confidence = Number((rivalry.confidence * 100).toFixed(1));
  const descriptors = rivalry.seats.map(({ speaker, turnShare, interruptions }) => {
    const share = Number((turnShare * 100).toFixed(1));
    return `${speaker}: turn share ${share}%; interruptions ${interruptions}.`;
  });

  if (rivalry.suppressed) {
    return ["Confidence low — prompts suppressed.", `Confidence ${confidence}%.`, ...descriptors];
  }

  return [
    `Confidence ${confidence}%.`,
    ...descriptors,
    ...rivalry.patterns.map(
      ({ kind, subjects, evidence }) => `${kind}: ${subjects.join(", ")} — ${evidence}`,
    ),
  ];
}

export function buildLedger(view: LedgerSource): LedgerView {
  const cohortTree = view.cohorts.map((cohort) => ({
    label: `Cohort ${cohort.cohortIndex + 1} — ${cohort.members.length} members — non-harm floor ${cohort.nonHarmFloor.minBenefit} ≥ ${cohort.nonHarmFloor.floor}`,
    children: [
      ...cohort.members.map(({ ref, role }) => ({ label: `${ref} — ${role} — assigned` })),
      ...cohort.badges.map(({ constraint, satisfied }) => ({
        label: `${constraint} — ${satisfied ? "satisfied" : "not satisfied"}`,
      })),
    ],
  }));
  const standingsText = view.standings
    ? `Own gain ${view.standings.selfGain}; ${view.standings.gainToBandTop} to the near-peer band top.`
    : null;
  const pausedMoveCount = view.safeguarding.pausedMoves.length;
  const safeguardingAlert = view.safeguarding.optimizationBypassed
    ? `Optimization bypassed; ${pausedMoveCount} conflicting ${pausedMoveCount === 1 ? "move" : "moves"} paused for the safeguarding lane.`
    : null;
  const assignedCount = view.cohorts.reduce((total, cohort) => total + cohort.members.length, 0);

  return {
    cohortTree,
    standingsText,
    rivalryList: buildRivalryList(view),
    safeguardingAlert,
    announce: `Compiled ${view.cohorts.length} cohorts with ${assignedCount} assigned learners.`,
  };
}
