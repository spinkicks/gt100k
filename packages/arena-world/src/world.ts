import type { QuestWorld } from "./model";

export function buildQuestWorld(graphDef: QuestWorld): QuestWorld {
  const nodesById = new Map(graphDef.nodes.map((node) => [node.id, node]));

  for (const node of graphDef.nodes) {
    for (const prerequisite of node.prerequisites) {
      if (!nodesById.has(prerequisite)) {
        throw new Error(`Dangling prerequisite: ${prerequisite}`);
      }
    }
  }

  const visitState = new Map<string, "visiting" | "visited">();
  const visit = (nodeId: string): void => {
    const state = visitState.get(nodeId);
    if (state === "visiting") throw new Error(`Prerequisite cycle: ${nodeId}`);
    if (state === "visited") return;

    visitState.set(nodeId, "visiting");
    const node = nodesById.get(nodeId);
    if (!node) throw new Error(`Dangling prerequisite: ${nodeId}`);
    for (const prerequisite of node.prerequisites) visit(prerequisite);
    visitState.set(nodeId, "visited");
  };

  for (const node of graphDef.nodes) visit(node.id);

  return {
    nodes: [...graphDef.nodes],
    edges: graphDef.nodes.flatMap((node) =>
      node.prerequisites.map((prerequisite) => ({ from: prerequisite, to: node.id })),
    ),
    regions: [...new Set(graphDef.nodes.map((node) => node.region))],
  };
}
