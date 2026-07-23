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
  /** shorter sessions / latency / sleep encroachment (optional). */
  readonly exhaustion?: boolean;
  /** can't take a day off / guilt / plays hurt / single-identity (optional). */
  readonly obsessiveTip?: boolean;
  /** competition / deadline / audience / specialization / parental-valuation spike. */
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
