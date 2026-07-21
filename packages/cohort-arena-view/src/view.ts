import type { CohortAssignment, LearnerProfile, Role } from "../../cohort-compiler/src/index.js";
import { PALETTE, TYPOGRAPHY } from "./art.js";
import { resolveVisualBand } from "./band.js";
import { layoutConstellation } from "./layout.js";
import { buildLedger } from "./ledger.js";
import type {
  BuildCohortArenaViewInput,
  CohortArenaView,
  CohortCardView,
  SafeguardingInput,
  SafeguardingView,
} from "./model.js";
import { MOTION_KINDS, resolveMotion } from "./motion.js";
import { buildArenaRoomView } from "./rivalry.js";
import { deriveStandingsView } from "./standings.js";

const HARD_CONSTRAINT_BADGES = [
  "age",
  "schedule",
  "safeguarding-separation",
  "accommodations",
  "level-velocity-caliper",
  "individual-non-harm-floor",
  "churn-budget",
] as const;

function compareRefs(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function membershipDelta(currentRefs: readonly string[], priorRefs: readonly string[]): number {
  const current = new Set(currentRefs);
  const prior = new Set(priorRefs);
  return (
    [...current].filter((ref) => !prior.has(ref)).length +
    [...prior].filter((ref) => !current.has(ref)).length
  );
}

function cohortCards(input: BuildCohortArenaViewInput): CohortCardView[] {
  const poolByRef = new Map((input.pool ?? []).map((member) => [member.learnerRef, member]));

  return input.assignment.cohorts.map((cohort, cohortIndex) => {
    const members = [...cohort.members]
      .sort((left, right) => compareRefs(left.ref, right.ref))
      .map(({ ref, role }) => ({ ref, role: role as Role }));
    const profiles = members
      .map(({ ref }) => poolByRef.get(ref))
      .filter((member): member is LearnerProfile => member !== undefined);
    const minBenefit =
      profiles.length === members.length
        ? Math.min(...profiles.map((member) => input.hard.benefitOf(member, profiles)))
        : input.hard.nonHarmFloor;
    const priorRefs =
      input.priorAssignment?.cohorts[cohortIndex]?.members.map(({ ref }) => ref) ?? [];

    return {
      cohortIndex,
      members,
      badges: HARD_CONSTRAINT_BADGES.map((constraint) => ({ constraint, satisfied: true })),
      nonHarmFloor: {
        minBenefit,
        floor: input.hard.nonHarmFloor,
        allAbove: minBenefit >= input.hard.nonHarmFloor,
      },
      churnDelta: input.priorAssignment
        ? membershipDelta(
            members.map(({ ref }) => ref),
            priorRefs,
          )
        : 0,
    };
  });
}

function assignmentDiff(
  assignment: CohortAssignment,
  priorAssignment: CohortAssignment | null | undefined,
): { readonly removed: string[]; readonly added: string[] } | null {
  if (!priorAssignment) return null;

  const current = new Set(assignment.memberRefs);
  const prior = new Set(priorAssignment.memberRefs);
  return {
    removed: [...prior].filter((ref) => !current.has(ref)).sort(compareRefs),
    added: [...current].filter((ref) => !prior.has(ref)).sort(compareRefs),
  };
}

function safeguardingView(input: SafeguardingInput | undefined): SafeguardingView {
  if (!input || input.pending.length === 0) {
    return { pending: [], pausedMoves: [], optimizationBypassed: false };
  }

  const affectedMembers = new Set(input.pending.flatMap((event) => event.affectedMembers));
  return {
    pending: input.pending.map((event) => ({
      ...event,
      affectedMembers: [...event.affectedMembers],
    })),
    pausedMoves: input.activeMoves
      .filter((move) => move.touches.some((learnerRef) => affectedMembers.has(learnerRef)))
      .map((move) => ({ moveId: move.moveId, touches: [...move.touches] })),
    optimizationBypassed: true,
  };
}

/** Composes the one deterministic view consumed by every visual and accessible renderer. */
export function buildCohortArenaView(input: BuildCohortArenaViewInput): CohortArenaView {
  const standings = input.standings
    ? deriveStandingsView(input.standings.self, input.standings.nearPeers, {
        optedIn: input.flags.standingsOptIn && input.standings.optedIn,
      })
    : null;
  const safeguarding = safeguardingView(input.safeguarding);
  const motion = Object.fromEntries(
    MOTION_KINDS.map((kind) => [
      kind,
      resolveMotion(kind, { reducedMotion: input.flags.reducedMotion }),
    ]),
  ) as CohortArenaView["motion"];
  const band = resolveVisualBand(input.flags.band);
  const core: Omit<CohortArenaView, "ledger"> = {
    constellation: layoutConstellation(input.assignment, input.pool),
    cohorts: cohortCards(input),
    standings,
    rivalry: input.rivalry ? buildArenaRoomView(input.rivalry) : null,
    safeguarding,
    motion,
    presentation: {
      palette: PALETTE,
      typography: TYPOGRAPHY,
      ...band,
      plain: input.flags.plain,
    },
  };
  const ledger = buildLedger(core);
  const diff = assignmentDiff(input.assignment, input.priorAssignment);

  return {
    ...core,
    ledger:
      diff && (diff.removed.length > 0 || diff.added.length > 0)
        ? {
            ...ledger,
            announce: `Assignment changed — removed:[${diff.removed.join(",")}]; added:[${diff.added.join(",")}].`,
          }
        : ledger,
  };
}

/** Compares renderer state while intentionally ignoring motion and presentation. */
export function plainViewEquals(left: CohortArenaView, right: CohortArenaView): boolean {
  return (
    JSON.stringify({
      constellation: left.constellation,
      cohorts: left.cohorts,
      standings: left.standings,
      rivalry: left.rivalry,
      safeguarding: left.safeguarding,
    }) ===
    JSON.stringify({
      constellation: right.constellation,
      cohorts: right.cohorts,
      standings: right.standings,
      rivalry: right.rivalry,
      safeguarding: right.safeguarding,
    })
  );
}
