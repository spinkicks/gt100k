import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import { resolveEngagedModes } from "@gt100k/two-axis-tagging";
import { serializeCellKey } from "@gt100k/interest-inference";
import type { Interaction, PipelineConfig, DroppedInteraction } from "./model.js";
import { buildFirstExposure, isNovelty } from "./novelty.js";

/**
 * An ActionEvent plus the context downstream steps need, so they never re-`find` the source
 * interaction (which would need a fragile kid+artifact+timestamp composite key).
 */
export interface BuiltEvent {
  readonly event: ActionEvent;
  readonly artifact: Artifact;
  readonly cellKey: string; // serializeCellKey(artifact.domainPath, engagedModes.primary)
  readonly depth: number; // return-event magnitude (interaction.depth ?? config.defaultDepth)
  readonly sessionId: string;
}

/**
 * Resolve each engagement Interaction into a BuiltEvent (via 009 resolveEngagedModes),
 * setting returnState (voluntary/prompted) and noveltyFlag (first-exposure window over the
 * resolved engaged cells). The Signal Firewall: an unknown artifact or an action that does not
 * resolve to an afforded mode emits nothing and is recorded in `dropped`.
 */
export function buildActionEvents(
  interactions: readonly Interaction[],
  catalog: ReadonlyMap<string, Artifact>,
  config: PipelineConfig,
): { built: BuiltEvent[]; dropped: DroppedInteraction[] } {
  // First-exposure over the ENGAGEMENTS that resolve to a cell (per kid+cell).
  const exposures: Array<{ kidId: string; cellKey: string; timestamp: string }> = [];
  for (const i of interactions) {
    const art = catalog.get(i.artifactId);
    if (!art) continue;
    const r = resolveEngagedModes(art, { artifactId: i.artifactId, actionType: i.actionType });
    if (!r.ok) continue;
    exposures.push({ kidId: i.kidId, cellKey: serializeCellKey(art.domainPath, r.engagedModes.primary), timestamp: i.timestamp });
  }
  const firstExposure = buildFirstExposure(exposures);

  const built: BuiltEvent[] = [];
  const dropped: DroppedInteraction[] = [];
  for (const i of interactions) {
    const art = catalog.get(i.artifactId);
    if (!art) {
      dropped.push({ interaction: i, reason: "unknown-artifact" });
      continue;
    }
    const r = resolveEngagedModes(art, { artifactId: i.artifactId, actionType: i.actionType });
    if (!r.ok) {
      dropped.push({ interaction: i, reason: r.reason === "invalid-for-artifact" ? "invalid-for-artifact" : "unresolved-action" });
      continue;
    }
    const cellKey = serializeCellKey(art.domainPath, r.engagedModes.primary);
    const event: ActionEvent = {
      kidId: i.kidId,
      artifactId: i.artifactId,
      engagedModes: r.engagedModes,
      depthSignals: i.depthSignals ?? [],
      timestamp: i.timestamp,
      returnState: i.prompted ? "prompted" : "voluntary",
      noveltyFlag: isNovelty(firstExposure, i.kidId, cellKey, i.timestamp, config),
    };
    built.push({ event, artifact: art, cellKey, depth: i.depth ?? config.defaultDepth, sessionId: i.sessionId });
  }
  return { built, dropped };
}
