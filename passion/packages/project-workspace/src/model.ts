// Domain model for @gt100k/project-workspace (spec §4.1). Types + one constant only — no logic.
//
// The child's Type III journey is a PURE, append-only list of `WorkEvent`s. There is intentionally
// NO score/grade/streak/points/badge/rank/reward field ANYWHERE on `Project`/`WorkEvent`
// (guardrail SC-5 / [D3]). `audience`/`ProjectBrief` are reused verbatim from the D1 planner so a
// real planner brief drops into `startProject` unchanged later (§4.5).
import type { AudienceLevel } from "@gt100k/specialization-planner";

export type { AudienceLevel, ProjectBrief } from "@gt100k/specialization-planner";

/** Synthetic age band (a supplied field, never derived here) — dials copy/mascot register (§D9). */
export type AgeBand = "6-8" | "9-11" | "12-14";

/** Where the project came from: a D1 planner brief (an offer) or the child's own idea ([D5]). */
export type ProjectSource = "planner" | "self";

/** The ten kinds of quest entry a child can log (§4.1). Closed set; iterated via WORK_EVENT_KINDS. */
export type WorkEventKind =
  | "session"
  | "attempt"
  | "outcome"
  | "revision"
  | "artifact"
  | "decision"
  | "reflection"
  | "ai_help"
  | "milestone"
  | "showcase";

/** The ten `WorkEventKind` members in the spec's order — for iteration + runtime validation. */
export const WORK_EVENT_KINDS = [
  "session",
  "attempt",
  "outcome",
  "revision",
  "artifact",
  "decision",
  "reflection",
  "ai_help",
  "milestone",
  "showcase",
] as const satisfies readonly WorkEventKind[];

/** A single immutable entry in the journey — the child's own words plus optional structured extras. */
export interface WorkEvent {
  readonly id: string;
  readonly kind: WorkEventKind;
  readonly at: string;
  readonly text: string; // the kid's words ("what I tried", …)
  readonly stuck?: boolean; // outcome: it broke / I got stuck (the perseverance seed §4.2)
  readonly refs?: readonly string[]; // ids of prior events/artifacts this builds on
  readonly artifact?: { readonly title: string; readonly kind: string; readonly ref?: string }; // local/by-reference; NO cloud store
  readonly aiTool?: { readonly name: string; readonly version: string }; // ai_help only (declared)
}

/** A child's Type III project + its append-only journey (§4.1). NO score/grade/reward field. */
export interface Project {
  readonly id: string;
  readonly kidId: string;
  readonly title: string;
  readonly drivingQuestion: string;
  readonly authenticMethod: string;
  readonly audience: AudienceLevel; // audience level (self → field)
  readonly craftScaffold?: string; // from a D1 brief when source === "planner"
  readonly source: ProjectSource;
  readonly ageBand: AgeBand;
  readonly createdAt: string;
  readonly events: readonly WorkEvent[]; // append-only journey
}
