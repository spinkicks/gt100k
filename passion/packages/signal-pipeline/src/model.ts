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
  readonly depth?: number; // [0,1] return-event magnitude (default DEFAULTS.defaultDepth)
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
  readonly secondaryWeight: number; // magnitude multiplier for the secondary-mode return event
  readonly defaultDepth: number; // return-event magnitude when interaction.depth is absent
}

// Golden defaults — spec §3.2. Do not re-open.
export const DEFAULTS: PipelineConfig = {
  noveltyWindowDays: 3,
  secondaryWeight: 0.5,
  defaultDepth: 1,
};

export type DropReason = "unknown-artifact" | "unresolved-action" | "invalid-for-artifact";

/** An interaction that emitted no signal, recorded for observability (never guessed). */
export interface DroppedInteraction {
  readonly interaction: Interaction;
  readonly reason: DropReason;
}
