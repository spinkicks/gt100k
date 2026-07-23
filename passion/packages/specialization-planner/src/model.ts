// The specialization-planner domain model (spec §3.2) + golden constants (§3.7). Types + constants
// only — no logic. Everything is GUIDE-FACING and immutable: there is intentionally NO child-facing
// field and NO score/grade/reward/points/streak/rank anywhere on any type (guardrail SC-6 / [D7]).
//
// DomainPath is the two-axis (domain × mode) `DomainPath` — the same type `@gt100k/concierge`'s
// `CuratedResource` is tagged by — so the curated library (A6) grounds briefs directly (see
// .loop/decisions.md D-A). WellbeingRead is the 016 read, folded in as a replan input.
import type { DomainPath } from "@gt100k/two-axis-tagging";
import type { WellbeingRead } from "@gt100k/wellbeing";
import type { CuratedResource } from "@gt100k/concierge";

// Re-export the consumed concierge/taxonomy types from the barrel so the adapter + app can get them
// via @gt100k/specialization-planner without a direct concierge import (spec §10).
export type { CuratedResource } from "@gt100k/concierge";
export type { CuratedLibrary } from "@gt100k/concierge";
export type { AgeTier } from "@gt100k/concierge";
export type { DomainPath } from "@gt100k/two-axis-tagging";
export type { WellbeingRead } from "@gt100k/wellbeing";

// --- The four-stage spine (§3.1) ---
export type Stage = "S1_IGNITION" | "S2_FOUNDATIONS" | "S3_AUTHORSHIP" | "S4_SIGNATURE";

/** The four stages in ascending order (entry → signature). */
export const STAGES = [
  "S1_IGNITION",
  "S2_FOUNDATIONS",
  "S3_AUTHORSHIP",
  "S4_SIGNATURE",
] as const satisfies readonly Stage[];

/** The mentor relay — warm → technical → domain-expert → master ([D5]). */
export type MentorRole = "WARM" | "TECHNICAL" | "DOMAIN_EXPERT" | "MASTER";

/** The progression variable — audience + authenticity, NOT hours ([D2]). */
export type AudienceLevel = "SELF" | "MENTOR_PEERS" | "REAL_COMMUNITY" | "FIELD";

export type ProjectCadence = "MANY_SHORT" | "TERM_LENGTH" | "MAJOR_TYPE_III" | "FLAGSHIP";

/** The staged PCDE (psychological characteristics of developing excellence) curriculum ([D6]). */
export type Pcde =
  | "enjoyment"
  | "relatedness"
  | "identity"
  | "self_regulation"
  | "goal_setting"
  | "quality_practice"
  | "planning"
  | "self_evaluation"
  | "coping_feedback"
  | "strategic_risk"
  | "self_advocacy"
  | "self_direction"
  | "resilience"
  | "networking"
  | "producer_identity";

/** Mandatory rest ([D4], AAP). Always present on every plan. */
export interface RestCadence {
  readonly daysOffPerWeek: number; // AAP: ≥1–2 (golden: 2)
  readonly monthsOffPerYear: number; // AAP: ~3 months/yr off the primary spike
  readonly offInIncrementsOfMonths: number; // AAP: taken in ~1-month increments
}

/**
 * A bona-fide Renzulli Type III project (all four criteria) paired with a bounded craft floor.
 * `childOwnsChoice` is the literal `true` — the brief is always an OFFER, never an assignment ([D7]).
 * There is NO score/grade/reward field: `successLooksLike` is process-based prose.
 */
export interface ProjectBrief {
  readonly title: string;
  readonly drivingQuestion: string; // no pre-existing right answer (criterion 3)
  readonly authenticMethod: string; // real methodology of the field (criterion 2)
  readonly audience: AudienceLevel; // built to affect a real audience (criterion 4)
  readonly childOwnsChoice: true; // personalization of interest (criterion 1) — invariant
  readonly craftScaffold: string; // the bounded DP / Type I–II skill floor paired with the project
  readonly successLooksLike: string; // process-based, never a score/reward
  readonly source: "stub" | "llm"; // provenance of the brief
}

/** The port the engine `await`s for the next project (§3.4). Deterministic stub in the gate. */
export interface BriefContext {
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly stage: Stage;
  readonly audience: AudienceLevel;
  readonly craftFloorHint: string;
  readonly resources: readonly CuratedResource[]; // the A6 curated matches to ground the scaffold
}

export interface ProjectBriefGenerator {
  generate(ctx: BriefContext): Promise<ProjectBrief>;
}

/** The engine's inputs for ONE spike (§3.2). Readiness signals — NEVER an age. */
export interface PlanInputs {
  readonly kidId: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath; // the (domain × work-mode) cell of the spike
  readonly mode: string;
  readonly hypothesisState: string; // 013 state (expects ACTIVE / CANDIDATE)
  readonly monthsInPursuit: number; // indicative only — surfaced, never a gate
  readonly voluntaryReturnsRecent: number; // sustained voluntary return (readiness, not age)
  readonly depthAccumulation: number; // depth-weighted craft-floor proxy
  readonly stretchSeeking: boolean; // voluntarily picks harder (depth: chosen_challenge)
  readonly producerIdentity: boolean; // ships/shares for others (learner→producer proxy)
  readonly wellbeing: WellbeingRead; // 016 — the replan input
  readonly now: string;
}

/** The 016 wellbeing read folded into the plan as a PROPOSAL — never applied to the child. */
export interface Replan {
  readonly deload: boolean; // reduce DP / soften cadence (back-off or over-challenge)
  readonly restWindow: boolean; // propose a guilt-free, reversible rest (rest/burnout-tip)
  readonly autonomyUp: boolean; // more choice/voice; decouple worth from outcome
  readonly holdStage: boolean; // do NOT advance the stage this cycle (strain present)
}

/**
 * The guide-facing staged plan (§3.2). GUIDE-FACING ONLY — no child-facing field, no score, no
 * reward/streak/rank, and no grade. The system PROPOSES; the human DISPOSES.
 */
export interface SpecializationPlan {
  readonly kidId: string;
  readonly cellKey: string;
  readonly domainPath: DomainPath;
  readonly mode: string;
  readonly stage: Stage;
  readonly mentorRole: MentorRole;
  readonly audience: AudienceLevel;
  readonly cadence: ProjectCadence;
  readonly dpDose: number; // [0,1] fraction, ≤ the stage cap, hard-capped < INVESTMENT_LOAD
  readonly restCadence: RestCadence; // always present (AAP)
  readonly pcdeFocus: readonly Pcde[]; // the stage's lead psychosocial skills
  readonly nextProject: ProjectBrief; // always present; always carries a craftScaffold
  readonly replan: Replan; // 016 wellbeing folded in — a proposal, never applied
  readonly escalateToHuman: boolean; // rest/back-off OR a proposed stage advance — the guide disposes
  readonly escalationReason?: string;
  readonly rationale: string; // guide-facing, plain language
  readonly guardrailNotes: readonly string[];
  readonly terminalNote: string; // honest scope: by ~14 = a ready-to-invest performer, not an expert
}

// ── Golden constants (§3.7) — do not re-open ─────────────────────────────────────
/** Bounded DP fraction by stage (rising, all `< INVESTMENT_LOAD`). */
export const DP_S1 = 0.0;
export const DP_S2 = 0.15;
export const DP_S3 = 0.3;
export const DP_S4 = 0.45;
/** The investment-year DP fraction we NEVER reach before 14 (the hard ceiling). */
export const INVESTMENT_LOAD = 0.6;

/** Craft-floor (depth-accumulation) thresholds to reach each stage. */
export const DEPTH_S2 = 3;
export const DEPTH_S3 = 8;
export const DEPTH_S4 = 16;

/** Sustained voluntary-return thresholds to reach each stage. */
export const RETURN_S2 = 4;
export const RETURN_S3 = 8;
export const RETURN_S4 = 12;

/** AAP rest cadence. */
export const REST_DAYS_PER_WEEK = 2;
export const REST_MONTHS_PER_YEAR = 3;
export const REST_INCREMENT_MONTHS = 1;

/** Recency window (days) for "sustained voluntary return". */
export const RETURN_WINDOW_DAYS = 90;

/** DP dose by stage — the rising-but-capped fraction, every value `< INVESTMENT_LOAD` ([D3]). */
export const DP_BY_STAGE = {
  S1_IGNITION: DP_S1,
  S2_FOUNDATIONS: DP_S2,
  S3_AUTHORSHIP: DP_S3,
  S4_SIGNATURE: DP_S4,
} as const satisfies Record<Stage, number>;
