import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import type { Interaction, SurfacedRecord, PipelineConfig, DroppedInteraction } from "./model.js";
import { DEFAULTS } from "./model.js";
import { buildActionEvents } from "./actions.js";
import { actionToCellEvents } from "./cells.js";
import { deriveSkips } from "./skips.js";

export interface DeriveInput {
  readonly interactions: readonly Interaction[];
  readonly surfaced?: readonly SurfacedRecord[];
  readonly catalog: ReadonlyMap<string, Artifact>;
  readonly config?: Partial<PipelineConfig>;
}

/**
 * The Signal Firewall orchestrator. Turns raw child interactions into the CellEvent stream 011
 * consumes: resolve engaged modes (via 009), classify novelty + voluntary/prompted, extract depth,
 * and derive skips from surfaced-minus-engaged. Unresolved/unknown interactions emit nothing and
 * are reported in `dropped` (never guessed).
 */
export function deriveSignals(input: DeriveInput): {
  actionEvents: ActionEvent[];
  cellEvents: CellEvent[];
  dropped: DroppedInteraction[];
} {
  const config: PipelineConfig = { ...DEFAULTS, ...input.config };
  const { built, dropped } = buildActionEvents(input.interactions, input.catalog, config);

  const cellEvents: CellEvent[] = [];
  for (const b of built) cellEvents.push(...actionToCellEvents(b.event, b.artifact, b.depth, config));
  cellEvents.push(...deriveSkips(input.surfaced ?? [], built, input.catalog, config));

  return { actionEvents: built.map((b) => b.event), cellEvents, dropped };
}
