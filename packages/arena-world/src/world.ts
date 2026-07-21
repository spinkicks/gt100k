import type { QuestWorld } from "./model";

export function buildQuestWorld(graphDef: QuestWorld): QuestWorld {
  return {
    nodes: [...graphDef.nodes],
    edges: [...graphDef.edges],
    regions: [...graphDef.regions],
  };
}
