// The access-broker domain model (spec 023 §4.1) + iteration constants. Types + constants only —
// no logic. Everything is GUIDE-FACING and immutable: there is intentionally NO child-facing field
// and NO score/rank/streak/points/badge/leaderboard field anywhere on any type (guardrail [D7]/SC-7).
//
// Reuses 018 (Stage/MentorRole/AudienceLevel/SpecializationPlan/STAGES), 016 (WellbeingRead), and
// 009 (WorkMode/DomainPath) — never redefined. `AgeBand` has NO shared export, so it is defined
// locally here (matching the project-studio/project-workspace convention) and re-exported.
import type { WorkMode } from "@gt100k/two-axis-tagging";

// ── Reused types re-exported from the barrel (so the adapter + app get them via @gt100k/access-broker) ──
export type {
  Stage,
  MentorRole,
  AudienceLevel,
  SpecializationPlan,
} from "@gt100k/specialization-planner";
export { STAGES } from "@gt100k/specialization-planner";
export type { WorkMode, DomainPath } from "@gt100k/two-axis-tagging";
export type { WellbeingRead } from "@gt100k/wellbeing";

import type { Stage, MentorRole, AudienceLevel } from "@gt100k/specialization-planner";

/**
 * The age-appropriateness band. There is NO shared `AgeBand` export in the workspace, so it is
 * defined here (identical to the project-studio / project-workspace convention) and re-exported.
 */
export type AgeBand = "6-8" | "9-11" | "12-14";

/** The age bands in ascending order (youngest → oldest) — the age-tier gate compares against this. */
export const AGE_BANDS = ["6-8", "9-11", "12-14"] as const satisfies readonly AgeBand[];

/** Two kinds of brokered access: a mentor relay handoff, or a real-audience opening ([D1]). */
export type OpportunityKind = "mentor" | "audience";

/** The §7.3 mentor-sourcing layers — who actually delivers the relay role. */
export type MentorSourceLayer = "AI" | "FAMILY" | "NEAR_PEER" | "THIN_EXPERT" | "MASTER";

/** The real-audience channels an audience opportunity opens onto. */
export type AudienceChannel = "COMPETITION" | "PUBLISHING" | "COMMUNITY" | "MARKETPLACE";

/** Synthetic vetting status (G4 is the real pre-live gate) — only `"vetted"` is surfaceable. */
export type VettingStatus = "vetted" | "pending" | "rejected";

/**
 * The full access-transfer lifecycle ([D2]). The ENGINE only ever emits `matched`/`proposed`/`held`
 * (system proposes); `approved`+ are reached only via the human-invoked lifecycle transitions
 * (guide disposes). `declined` + `held` are the two off-ladder states.
 */
export type HandoffState =
  | "matched"
  | "proposed"
  | "approved"
  | "introduced"
  | "active"
  | "transferred"
  | "declined"
  | "held";

/**
 * A single real-world opportunity in the synthetic catalog (§4.1). Carries the domain×mode fit
 * (`cellKey`, the planner's cell-key format), the role/level it fills, and every gate attribute
 * (`minStage`, `ageTier`, `vetting`). NO score/rank/streak/points/badge field — `reputation` is a
 * deterministic quality prior, never a competitive score.
 */
export interface Opportunity {
  readonly id: string;
  readonly kind: OpportunityKind;
  readonly title: string;
  /** The domain×mode key, in the planner's `cellKey` format — the engine matches on equality. */
  readonly cellKey: string;
  /** Optional work-mode context (the cell's mode is already encoded in `cellKey`). */
  readonly modes?: readonly WorkMode[];
  /** mentor-only: which relay role it serves. */
  readonly fillsRole?: MentorRole;
  /** mentor-only: who delivers it (§7.3 sourcing layer). */
  readonly sourceLayer?: MentorSourceLayer;
  /** audience-only: which audience level it opens. */
  readonly level?: AudienceLevel;
  /** audience-only: the channel. */
  readonly channel?: AudienceChannel;
  /** earliest appropriate stage (expert/master ⇒ S3/S4). */
  readonly minStage: Stage;
  /** age-appropriateness floor (the kid's band must be ≥ this). */
  readonly ageTier: AgeBand;
  /** only `"vetted"` is surfaceable. */
  readonly vetting: VettingStatus;
  /** [0,1] deterministic quality prior — NOT a competitive score. */
  readonly reputation: number;
  readonly availability?: { readonly deadline?: string; readonly slots?: number };
}

/**
 * A tracked brokered connection between a certified spike and an opportunity (§4.1). The lifecycle
 * `state` is human-gated past `proposed`. `guardianConsent` is a recorded attribute (a hard blocker
 * at approval); `approvedBy` is the GUIDE — the family never owns the gate ([D3]). NO score/rank
 * field anywhere.
 */
export interface Brokerage {
  readonly id: string;
  readonly kidId: string;
  /** the certified spike this serves, keyed the planner's way. */
  readonly spikeCell: { readonly cellKey: string };
  readonly opportunityId: string;
  readonly kind: OpportunityKind;
  readonly state: HandoffState;
  /** required `true` to leave `approved` — recorded at the guide gate. */
  readonly guardianConsent?: boolean;
  /** the guide id — the human who owns the single gate. */
  readonly approvedBy?: string;
  /** the engineered handoff event (warm intro / overlap / explicit "why now"). */
  readonly handoff?: { readonly warmIntro: boolean; readonly overlap: boolean; readonly whyNow: string };
  /** e.g. "held: protecting rest". */
  readonly note?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

// ── Iteration/validation constants (exact member sets) — do not re-open ───────────────────────────
export const OPPORTUNITY_KINDS = ["mentor", "audience"] as const satisfies readonly OpportunityKind[];

export const MENTOR_SOURCE_LAYERS = [
  "AI",
  "FAMILY",
  "NEAR_PEER",
  "THIN_EXPERT",
  "MASTER",
] as const satisfies readonly MentorSourceLayer[];

export const AUDIENCE_CHANNELS = [
  "COMPETITION",
  "PUBLISHING",
  "COMMUNITY",
  "MARKETPLACE",
] as const satisfies readonly AudienceChannel[];

export const VETTING_STATUSES = ["vetted", "pending", "rejected"] as const satisfies readonly VettingStatus[];

export const HANDOFF_STATES = [
  "matched",
  "proposed",
  "approved",
  "introduced",
  "active",
  "transferred",
  "declined",
  "held",
] as const satisfies readonly HandoffState[];

/** The mentor-relay ladder (ascending) — role ordering, reused for readability/validation. */
export const MENTOR_ROLES = [
  "WARM",
  "TECHNICAL",
  "DOMAIN_EXPERT",
  "MASTER",
] as const satisfies readonly MentorRole[];

/** The audience ladder (ascending) — SELF is "no real audience yet". */
export const AUDIENCE_LEVELS = [
  "SELF",
  "MENTOR_PEERS",
  "REAL_COMMUNITY",
  "FIELD",
] as const satisfies readonly AudienceLevel[];
