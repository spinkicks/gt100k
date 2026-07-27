import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import type { Interaction, SurfacedRecord, PipelineConfig, DroppedInteraction } from "./model.js";
import { DEFAULTS } from "./model.js";
import { buildActionEvents } from "./actions.js";
import { actionToCellEvents } from "./cells.js";
import { classifyReturns } from "./returns.js";
import { deriveSkips } from "./skips.js";

export interface DeriveInput {
  readonly interactions: readonly Interaction[];
  readonly surfaced?: readonly SurfacedRecord[];
  readonly catalog: ReadonlyMap<string, Artifact>;
  readonly config?: Partial<PipelineConfig>;
}

/**
 * The Signal Firewall orchestrator. Turns raw child interactions into the CellEvent stream 011
 * consumes: resolve engaged modes (via 009), classify novelty and the return horizon
 * (cross-day / same-day / prompted), extract depth, and derive the disconfirming skip/decline
 * signals from surfaced-minus-engaged.
 * Unresolved/unknown interactions emit nothing and are reported in `dropped` (never guessed).
 */
export function deriveSignals(input: DeriveInput): {
  actionEvents: ActionEvent[];
  cellEvents: CellEvent[];
  dropped: DroppedInteraction[];
  /** Sessions that offered something and recorded no choice. See `SkipDerivation`. */
  silentSessions: readonly string[];
} {
  const config: PipelineConfig = { ...DEFAULTS, ...input.config };
  const { built, dropped, present } = buildActionEvents(input.interactions, input.catalog, config);

  // Classification needs the whole stream (the previous engagement of the same kid+cell), so it
  // runs once over `built` and is handed to the per-event mapping.
  const returns = classifyReturns(built);
  const cellEvents: CellEvent[] = [];
  built.forEach((b, i) => cellEvents.push(...actionToCellEvents(b.event, b.artifact, returns[i]!)));
  const skips = deriveSkips(input.surfaced ?? [], built, input.catalog, config, present);
  cellEvents.push(...skips.events);

  return {
    actionEvents: built.map((b) => b.event),
    cellEvents,
    dropped,
    silentSessions: skips.silentSessions,
  };
}
