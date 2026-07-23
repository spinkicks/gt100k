import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { isDepthFamily, clamp01 } from "@gt100k/interest-inference";
import type { PipelineConfig } from "./model.js";

/**
 * Map one ActionEvent to the CellEvent[] that 011 consumes:
 * - a primary return event (kind from returnState, magnitude = depth);
 * - if a secondary engaged mode is present, a return event at depth × secondaryWeight;
 * - one depth CellEvent per DEPTH_FAMILY depthSignal (non-family signals ignored).
 *
 * `depth` is passed explicitly because the 009 ActionEvent has no depth field — it is carried
 * from the source Interaction by the BuiltEvent.
 */
export function actionToCellEvents(event: ActionEvent, artifact: Artifact, depth: number, config: PipelineConfig): CellEvent[] {
  const kind = event.returnState === "voluntary" ? "voluntary_return" : "prompted_return";
  const mag = clamp01(depth);
  const out: CellEvent[] = [
    {
      domainPath: artifact.domainPath,
      mode: event.engagedModes.primary,
      kind,
      magnitude: mag,
      novelty: event.noveltyFlag,
      timestamp: event.timestamp,
    },
  ];
  if (event.engagedModes.secondary) {
    out.push({
      domainPath: artifact.domainPath,
      mode: event.engagedModes.secondary,
      kind,
      magnitude: clamp01(mag * config.secondaryWeight),
      novelty: event.noveltyFlag,
      timestamp: event.timestamp,
    });
  }
  for (const s of event.depthSignals) {
    if (isDepthFamily(s.kind)) {
      out.push({
        domainPath: artifact.domainPath,
        mode: event.engagedModes.primary,
        kind: s.kind,
        magnitude: clamp01(s.value),
        novelty: event.noveltyFlag,
        timestamp: event.timestamp,
      });
    }
  }
  return out;
}
