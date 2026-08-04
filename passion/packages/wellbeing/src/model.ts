// Types + golden constants for the wellbeing engine (spec 016-wellbeing §3.2, §3.6).
//
// Two INDEPENDENT knobs (§3.1): a CHALLENGE move (PUSH | HOLD | SCAFFOLD) and a PRESSURE move
// (AUTONOMY_UP | STEADY). "Back off" = pressure down BEFORE touching challenge. The read is
// GUIDE-FACING ONLY — there is intentionally no child-facing field and no score/label/reward
// anywhere on `WellbeingRead` (guardrail: never gamify; no child-facing label — §3.4).

export type WellbeingState =
  | "UNDER_CHALLENGED"
  | "IN_ZONE"
  | "OVER_CHALLENGED"
  | "DANGER_WINDOW"
  | "EARLY_BURNOUT"
  | "BURNOUT_TIP"
  | "GAP";

export type Trend = "rising" | "stable" | "declining";

export type ChallengeMove = "PUSH" | "HOLD" | "SCAFFOLD";
export type PressureMove = "AUTONOMY_UP" | "STEADY";

/** Per-spike behavioral signals (§3.2). All BEHAVIORAL — never affect/emotion. */
export interface WellbeingSignals {
  readonly kidId: string;
  readonly cellKey: string;
  /** from 012/014 — voluntary, depth-weighted. */
  readonly returnTrend: Trend;
  readonly depthTrend: Trend;
  /** [0,1]; optional (not yet instrumented). */
  readonly successRate?: number;
  /** voluntarily picks harder (depth: chosen_challenge). */
  readonly stretchSeeking?: boolean;
  /** compliance-without-depth / cancels / stopped sharing. */
  readonly devaluation?: boolean;
  /**
   * An adult has reported the child seems worn out by this. NOT derived from behaviour.
   *
   * The old spec here was "shorter sessions, latency, sleep encroachment", which does not survive
   * the evidence. The best published attempt to read exhaustion from traces reached an ROC AUC of
   * 0.56 against a chance level of 0.50, in adults, with far richer sensing than we have. The sleep
   * half inverts: the validated instrument asks whether the child sleeps badly *because of* the
   * activity, which is an attribution only they can make, and reported sleep tracks wellbeing
   * better than measured sleep does.
   *
   * There is also no threshold to fire on. Mind Garden withdrew every MBI cut-off in 2016 for
   * having no diagnostic validity. So this is a direction an adult noticed, never a verdict, and
   * `RestReport` carries the words they used.
   *
   * Nothing in this literature is validated below about age 9.
   */
  readonly exhaustion?: boolean;
  /**
   * A competition, audition, recital or deadline is coming up.
   *
   * The one signal here that is not a mental state. It is a date an adult already knows, so we ask
   * for it and there is no inference to get wrong. See `docs/decisions/2026-08-04-what-can-be-sensed.md`.
   */
  readonly stakesEvent?: boolean;
  /** per-spike quiet-period gap (weak-point #2). */
  readonly missing?: boolean;
  readonly now: string;
}

/**
 * The guide-facing recommendation (§3.2). PROPOSES only: `backOff`/`rest` ALWAYS escalate to a human,
 * nothing is applied to the child, and there is NO child-facing label/score/reward field.
 */
export interface WellbeingRead {
  readonly kidId: string;
  readonly cellKey: string;
  readonly state: WellbeingState;
  readonly challenge: ChallengeMove;
  readonly pressure: PressureMove;
  readonly backOff: boolean;
  readonly rest: boolean;
  /** true in the danger window (counter-cyclical): reduce evaluative surfacing, never add stakes. */
  readonly reduceEvaluativeSurfacing: boolean;
  readonly escalateToHuman: boolean;
  readonly escalationReason?: string;
  /** guide-facing, plain language. */
  readonly rationale: string;
  /** e.g. "weight devaluation over exhaustion". */
  readonly guardrailNotes: readonly string[];
}

/**
 * Optional context for `assessWellbeing`. The engine stays pure and keyed on BEHAVIOUR, never age;
 * this only says whether the PRESSURE/burnout half is live for THIS spike.
 */
export interface AssessOptions {
  /**
   * Whether the pressure/burnout half of the engine is live for this spike. Defaults to true, so
   * every existing caller is unchanged. Set false while a spike is still in DISCOVERY — a child only
   * sampling an interest has too little invested to be burning out on it — and the four pressure
   * states (BURNOUT_TIP, EARLY_BURNOUT, GAP, DANGER_WINDOW) are skipped, so the read falls through to
   * the always-on challenge calibration. Keyed on pursuit PHASE (013 lifecycle), NEVER on age.
   */
  readonly pressureActive?: boolean;
}

// ── Golden constants (§3.6) — do not re-open ─────────────────────────────────────
/** success above which (with rising return + stretch) → PUSH. */
export const PUSH_SUCCESS = 0.9;
/** the stretch zone. */
export const ZONE_LOW = 0.8;
export const ZONE_HIGH = 0.9;
/** success below which → SCAFFOLD. */
export const SCAFFOLD_SUCCESS = 0.7;
/** per-spike quiet-period length (days) that counts as a gap. */
export const GAP_DAYS = 14;
/** recent-vs-older window (days) for trend derivation. */
export const TREND_WINDOW_DAYS = 21;
