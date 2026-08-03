// @gt100k/wellbeing/recovery — what a guide DOES once a burnout or fading signal is already flagged.
//
// Companion to assess.ts: assess.ts says WHAT STATE a child's play is in; recovery.ts says WHAT TO
// DO about it. Both are pure and guide-facing; neither touches the child, and there is no child-
// facing label, score, or reward here either (016 guardrail).
//
// Moves are graded, subtraction-first, and aimed at the ADULT — the one place this literature has
// controlled child evidence is changing what the grown-ups do. Each move points at research claims
// by id (the surface resolves them via @gt100k/research); this module carries no sources of its own
// and imports no other package at runtime, so it stays trivially portable and testable.

import type { WellbeingState } from "./model.js";

/** How much weight a move deserves, strongest to weakest. Mirrors @gt100k/motivation's grading so a
 *  guide reads the same words wherever a move appears; copied, not imported, to keep this module's
 *  runtime dependency surface empty. */
export type EvidenceGrade = "controlled-in-children" | "correlational-or-older-sample" | "reasoned";

export type RecoveryMoveKind =
  | "SUBTRACT"
  | "RESTORE_AUTONOMY"
  | "REBUILD_COMPETENCE"
  | "BREAK"
  | "RENEGOTIATE_GOAL"
  | "DO_NOT";

export interface RecoveryMove {
  readonly id: string;
  readonly kind: RecoveryMoveKind;
  /** One sentence a guide can act on this week, in a teacher's words. */
  readonly does: string;
  /** Claim ids into @gt100k/research; the surface turns them into WhyThis popovers. */
  readonly claimIds: readonly string[];
  readonly grade: EvidenceGrade;
}

export interface BreakGuidance {
  readonly headline: string;
  readonly detail: string;
  readonly claimIds: readonly string[];
}

export interface PivotGuidance {
  readonly headline: string;
  readonly detail: string;
  readonly claimIds: readonly string[];
}

/** The signals a plan can be built for: the two burnout states, plus the console's own fading-
 *  engagement signal (engagement.ts), which is not a WellbeingState. */
export type RecoveryTrigger =
  | Extract<WellbeingState, "BURNOUT_TIP" | "EARLY_BURNOUT">
  | "ENGAGEMENT_FADING";

export interface RecoveryPlan {
  readonly trigger: RecoveryTrigger;
  readonly headline: string;
  /** Ordered strongest lever first; the two DO_NOT guardrails always come last. */
  readonly moves: readonly RecoveryMove[];
  readonly breakGuidance?: BreakGuidance;
  readonly pivotGuidance: PivotGuidance;
}

// The two guardrails every plan carries: the two most common ways an adult makes burnout worse.
const DO_NOT_QUIT: RecoveryMove = {
  id: "do-not-quit",
  kind: "DO_NOT",
  does: "Don't make the child quit outright — a forced, total stop tends to leave them worse off than a supported break, so rest rather than stop.",
  claimIds: ["do-not-force-quit"],
  grade: "correlational-or-older-sample",
};

const DO_NOT_REST_ONLY: RecoveryMove = {
  id: "do-not-rest-only",
  kind: "DO_NOT",
  does: "Don't rely on the break alone — if the pressure or workload that drained them is still there when they return, it builds straight back up.",
  claimIds: ["rest-alone-insufficient"],
  grade: "correlational-or-older-sample",
};

const GUARDRAILS: readonly RecoveryMove[] = [DO_NOT_QUIT, DO_NOT_REST_ONLY];

const PIVOT: PivotGuidance = {
  headline: "Is this a dip or a dead end?",
  detail:
    "A short dip usually clears within about two weeks and doesn't dent how well they do. If low interest and few return visits last past that, treat the goal as one that no longer fits — and change it with the child, not for them.",
  claimIds: ["dip-vs-disengagement", "goal-disengage-reengage"],
};

const SHORT_BREAK: BreakGuidance = {
  headline: "A few days to about a week away.",
  detail:
    'For this age and setting a short break is usually enough, and longer isn\'t reliably better. "Off" means doing other things they enjoy, not sitting still — total inactivity tends to backfire.',
  claimIds: ["break-dosage"],
};

const PLANS: Readonly<Record<RecoveryTrigger, RecoveryPlan>> = {
  BURNOUT_TIP: {
    trigger: "BURNOUT_TIP",
    headline: "Ease the pressure and protect free play.",
    moves: [
      {
        id: "drop-external-pressure",
        kind: "SUBTRACT",
        does: "Stop using rewards, grades, or being watched as the reason to do it — notice the effort, don't pay for the result.",
        claimIds: ["overjustification-reward-backfire"],
        grade: "controlled-in-children",
      },
      {
        id: "protect-free-play",
        kind: "SUBTRACT",
        does: "Guard free, unwatched time with the activity, and don't fill the freed-up time with more organised practice.",
        claimIds: ["overjustification-reward-backfire"],
        grade: "reasoned",
      },
      {
        id: "keep-it-doable",
        kind: "REBUILD_COMPETENCE",
        does: "Keep tasks hard enough to matter but clearly doable, and give specific, honest praise when they land one.",
        claimIds: ["optimal-difficulty"],
        grade: "correlational-or-older-sample",
      },
      ...GUARDRAILS,
    ],
    pivotGuidance: PIVOT,
  },
  EARLY_BURNOUT: {
    trigger: "EARLY_BURNOUT",
    headline: "A real break — and change what's draining them.",
    moves: [
      {
        id: "take-a-break",
        kind: "BREAK",
        does: "Give a genuine, guilt-free break from this activity now.",
        claimIds: ["break-dosage"],
        grade: "correlational-or-older-sample",
      },
      {
        id: "remove-the-load",
        kind: "SUBTRACT",
        does: "Before they come back, cut the load or pressure that led here — don't just rest and return to the same setup.",
        claimIds: ["rest-alone-insufficient"],
        grade: "correlational-or-older-sample",
      },
      {
        id: "re-enter-gently",
        kind: "REBUILD_COMPETENCE",
        does: "Come back through small, clearly winnable tasks so the first sessions back end on a high.",
        claimIds: ["optimal-difficulty"],
        grade: "correlational-or-older-sample",
      },
      ...GUARDRAILS,
    ],
    breakGuidance: SHORT_BREAK,
    pivotGuidance: PIVOT,
  },
  ENGAGEMENT_FADING: {
    trigger: "ENGAGEMENT_FADING",
    headline: "Hand back control, and check the goal still fits.",
    moves: [
      {
        id: "restore-choice",
        kind: "RESTORE_AUTONOMY",
        does: "Give real choices back — over what they do and how, and over the bigger goal, not just today's task; this is the strongest lever you have.",
        claimIds: ["autonomy-strongest-lever"],
        grade: "correlational-or-older-sample",
      },
      {
        id: "renegotiate-goal",
        kind: "RENEGOTIATE_GOAL",
        does: "If the goal has become a dead end, help them let it go and pick a new one — a chosen switch beats both pushing through and simply stopping.",
        claimIds: ["goal-disengage-reengage"],
        grade: "correlational-or-older-sample",
      },
      ...GUARDRAILS,
    ],
    pivotGuidance: PIVOT,
  },
};

/**
 * The recovery plan for a trigger, or null when the state is not a burnout/fading signal, so a
 * caller never renders an empty panel. Pure and total: any unknown string returns null.
 */
export function recoveryFor(trigger: string): RecoveryPlan | null {
  return (PLANS as Record<string, RecoveryPlan>)[trigger] ?? null;
}
