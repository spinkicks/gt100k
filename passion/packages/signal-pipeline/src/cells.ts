import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { isDepthFamily } from "@gt100k/interest-inference";

/**
 * Map one ActionEvent to the CellEvent[] that 011 consumes:
 * - a primary return event (kind from returnState);
 * - if a secondary engaged mode is present, the same event against that cell, marked
 *   `role: "secondary"` so the engine can down-weight an inferred mode;
 * - one depth CellEvent per DEPTH_FAMILY depthSignal (non-family signals ignored).
 *
 * One event = one occurrence (E1). There is no `magnitude`: the old field was specified only as
 * "depth for returns, strength for depth families", which invited an emitter to fill it with
 * active time, and it multiplied alpha directly. The ages 6-8 evidence is that duration is a poor
 * and non-monotonic proxy for interest, so nothing time-shaped may enter the belief math.
 */
export function actionToCellEvents(event: ActionEvent, artifact: Artifact): CellEvent[] {
  const kind = event.returnState === "voluntary" ? "voluntary_return" : "prompted_return";
  const out: CellEvent[] = [
    {
      domainPath: artifact.domainPath,
      mode: event.engagedModes.primary,
      kind,
      novelty: event.noveltyFlag,
      timestamp: event.timestamp,
    },
  ];
  if (event.engagedModes.secondary) {
    out.push({
      domainPath: artifact.domainPath,
      mode: event.engagedModes.secondary,
      kind,
      novelty: event.noveltyFlag,
      timestamp: event.timestamp,
      role: "secondary",
    });
  }
  for (const s of event.depthSignals) {
    // A depth signal either happened or it did not. `value` is no longer read as a strength; a
    // non-positive value is treated as the signal being absent rather than as a weak occurrence.
    if (isDepthFamily(s.kind) && s.value > 0) {
      out.push({
        domainPath: artifact.domainPath,
        mode: event.engagedModes.primary,
        kind: s.kind,
        novelty: event.noveltyFlag,
        timestamp: event.timestamp,
      });
    }
  }
  return out;
}
