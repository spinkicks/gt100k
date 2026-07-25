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
}

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
