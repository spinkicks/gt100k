// Types + golden constants for the Family Co-Engagement engine (spec 019 §3.2, §3.6).
//
// The coaching target is WARM-DEMANDING / authoritative (§3.1, research Category C + §6.5): high warmth
// + high structure, delivered through AUTONOMY SUPPORT, with warmth kept NON-CONTINGENT (never
// conditional on performance). The engine moves TWO knobs — autonomy support and structure — while
// warmth is a constant `"non_contingent"`, NEVER a knob toward contingent praise/reward. "Family
// back-off" = pressure/valuation down + autonomy support up, never "care less".
//
// `FamilyRead` is GUIDE-FACING ONLY. There is intentionally NO child- or family-facing label, NO
// score, and NO reward/streak/points field anywhere on this type (guardrail §3.4: never gamify; no
// child-facing label; system proposes, human disposes).

/** The family-driven-pressure watch level (§3.2). */
export type PressureRisk = "none" | "watch" | "elevated";

/** A coaching knob: dial a dimension UP or hold it STEADY (§3.1). */
export type Knob = "up" | "steady";

/**
 * Per-CHILD signals, aggregated across the child's tracked spikes (§3.2). Every signal is BEHAVIORAL
 * or an explicit guide observation — the engine NEVER infers a parent's or child's emotional state.
 */
export interface FamilySignals {
  readonly kidId: string;
  readonly now: string;
  /** ACTIVE + CANDIDATE count (013) — plurality vs over-identification. */
  readonly activeSpikes: number;
  /** any spike's 016 read flags a stakes/danger window. */
  readonly anyStakesEvent: boolean;
  /** any spike shows quiet devaluation (016). */
  readonly anyDevaluation: boolean;
  /** any spike's 016 read set backOff/rest. */
  readonly anyBackOffOrRest: boolean;
  /** single dominant spike + high concentration (proxy). */
  readonly overIdentification: boolean;
  /** a specialization/stakes push coinciding with declining return (proxy). */
  readonly pressuredSpecialization: boolean;
  /** optional: little shared co-engagement (build the complex environment). */
  readonly lowFamilyEngagement?: boolean;
  // OPTIONAL guide-supplied observations (NOT software-inferred; synthetic for now):
  /** family over-values the activity (Mageau antecedent). */
  readonly parentalOverValuation?: boolean;
  /** approval made contingent on performance (Assor). */
  readonly conditionalRegardObserved?: boolean;
  /** pressure/intrusion/surveillance (Grolnick control, not structure). */
  readonly familyControlObserved?: boolean;
}

/**
 * The warm-demanding coaching posture the engine recommends (§3.2). Warmth is ALWAYS
 * `"non_contingent"`; the engine never recommends contingent praise/reward.
 */
export interface CoachingPosture {
  /** up when stakes/pressure present (counter-cyclical). */
  readonly autonomySupport: Knob;
  /** up to build the complex environment. */
  readonly structure: Knob;
  /** ALWAYS — never contingent praise/reward. */
  readonly warmth: "non_contingent";
  /** true whenever stakes/pressure present. */
  readonly decoupleWorthFromOutcome: boolean;
}

/**
 * The guide-facing family-coaching read (§3.2). GUIDE-FACING ONLY: no child/family label, no score,
 * no reward field. `asks` are OFFERS (the child keeps choosing problem/method/pace), never mandates.
 */
export interface FamilyRead {
  readonly kidId: string;
  readonly posture: CoachingPosture;
  /** concrete door-opening asks (opportunity/structure/access) — OFFERS, capped at MAX_ASKS. */
  readonly asks: readonly string[];
  /** structured shared-activity / showcase ideas (complex environment), capped at MAX_SHARED_ACTIVITIES. */
  readonly sharedActivities: readonly string[];
  /** the family-driven-pressure watch + exactly which antecedents fired. */
  readonly pressureWatch: { readonly risk: PressureRisk; readonly antecedents: readonly string[] };
  /** re-coaching the guide must dispose (system proposes, human disposes). */
  readonly escalateToHuman: boolean;
  readonly escalationReason?: string;
  /** guide-facing, plain language. */
  readonly rationale: string;
  readonly guardrailNotes: readonly string[];
}

// ── Golden constants (§3.6) — do not re-open ─────────────────────────────────────
/** one spike this dominant (of the child's tracked spikes) ⇒ over-identification proxy. */
export const OVER_IDENTIFICATION_MIN_SHARE = 0.8;
/** door-opening asks surfaced per read (avoid overwhelm). */
export const MAX_ASKS = 4;
/** shared-activity ideas per read. */
export const MAX_SHARED_ACTIVITIES = 3;
