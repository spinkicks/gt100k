import type { DepthSignal } from "@gt100k/two-axis-tagging";

/**
 * A raw child-interaction trace. `actionType` maps to a work-mode via 009 ACTION_MODE_RULES;
 * `prompted` distinguishes a self-initiated (voluntary) return from a system-surfaced one.
 */
export interface Interaction {
  readonly kidId: string;
  readonly artifactId: string;
  readonly actionType: string;
  readonly timestamp: string; // ISO-8601
  readonly prompted: boolean; // true = system surfaced/nudged the child here
  readonly sessionId: string;
  /**
   * Which depth families this occurrence exhibited. Presence is what counts; `value` is only
   * checked for being positive (E1). There is deliberately no duration or `depth` field: the
   * ages 6-8 evidence is that dwell is non-monotonic in interest, so nothing time-shaped is
   * allowed to reach the belief math.
   */
  readonly depthSignals?: readonly DepthSignal[];
  /** How long the open held attention, bucketed. See `DwellBucket`. */
  readonly dwellBucket?: DwellBucket;
}

/**
 * How long an open held attention, as a closed ordinal set rather than a number (E9).
 *
 * Two constraints meet here. Sub-floor opens **must** be emitted: dropping them leaves
 * "surfaced this session, never engaged", which E4 reads as a decline, so discarding a brief
 * attempt would silently turn it into *negative* evidence and invert the sign of the strongest
 * signal we have. But duration must **not** reach the belief math, because dwell is
 * non-monotonic in interest (stronger performers stay as learning progress rises, weaker ones
 * stay with the most familiar option).
 *
 * A closed enum satisfies both: the observation survives, and it cannot be multiplied into
 * alpha. Same reasoning that moved the secondary-mode weight to `A_SECONDARY`.
 *
 * Deliberately NOT carried onto `CellEvent`. The belief math only ever sees `CellEvent`s, so
 * keeping this off that type makes it structurally impossible for dwell to enter a posterior,
 * which is a stronger guarantee than a comment asking people not to. It may be read here as a
 * validity gate or surfaced as a diagnostic; it may not be scored.
 */
export type DwellBucket = "under_floor" | "short" | "medium" | "long";

/** A cell/artifact that was shown or available in a session (for skip derivation). */
export interface SurfacedRecord {
  readonly kidId: string;
  readonly artifactId: string;
  readonly sessionId: string;
  readonly timestamp: string; // ISO-8601
}

export interface PipelineConfig {
  readonly noveltyWindowDays: number; // exposures within this window of first-exposure are novelty
}

// Golden defaults — spec §3.2. The secondary-mode weight moved to `A_SECONDARY` in 011, where it
// is an engine constant rather than a per-event multiplier an emitter can reach.
export const DEFAULTS: PipelineConfig = {
  noveltyWindowDays: 3,
};

export type DropReason = "unknown-artifact" | "unresolved-action" | "invalid-for-artifact";

/** An interaction that emitted no signal, recorded for observability (never guessed). */
export interface DroppedInteraction {
  readonly interaction: Interaction;
  readonly reason: DropReason;
}
