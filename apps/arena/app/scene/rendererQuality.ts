import { type InitialArenaView, type QualityBudget, WORLD_SCALE } from "@gt100k/arena-world";

const BASE_ELEVATION = 0.8;

type Point3D = { x: number; y: number; z: number };

interface DynamicLightCandidate {
  id: string;
  nodeId: string | null;
  position: Point3D;
  declarationOrder: number;
}

export interface RendererQualityPlan {
  canvas: boolean;
  dpr: [number, number] | null;
  frameLoop: "always" | "demand";
  shadows: boolean;
  shadowMapSize: number | null;
  waterMode: "shader" | "cheap" | "static" | "none";
  postFxMode: QualityBudget["postfx"];
  ambientMotion: boolean;
  particleScale: number;
  staticMotion: boolean;
  dynamicLightIds: string[];
  dynamicNodeLightIds: string[];
  dynamicCampfireLight: boolean;
}

function distanceSquared(a: Point3D, b: Point3D): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
}

function lightCandidates(view: InitialArenaView): DynamicLightCandidate[] {
  const transforms = new Map(
    view.presentation.worldTransform.nodes.map((node) => [node.nodeId, node] as const),
  );
  const states = new Map(view.nodeStates.map((node) => [node.nodeId, node.state] as const));
  const candidates: DynamicLightCandidate[] = view.world.nodes.flatMap((node, declarationOrder) => {
    const position = transforms.get(node.id);
    if (states.get(node.id) === "locked" || !position) return [];
    return [
      {
        id: `node:${node.id}`,
        nodeId: node.id,
        position: { x: position.x, y: position.y, z: position.z },
        declarationOrder,
      },
    ];
  });
  const campfire = view.presentation.basePlacements.find(({ feature }) => feature === "campfire");
  if (campfire) {
    candidates.push({
      id: "base:campfire",
      nodeId: null,
      position: {
        x: campfire.x * WORLD_SCALE,
        y: BASE_ELEVATION,
        z: campfire.y * WORLD_SCALE,
      },
      declarationOrder: view.world.nodes.length,
    });
  }
  return candidates;
}

function shadowMapSize(shadows: QualityBudget["shadows"]): number | null {
  if (shadows === "soft-pcf-2048") return 2_048;
  if (shadows === "pcf-1024") return 1_024;
  return null;
}

export function buildRendererQualityPlan(
  view: InitialArenaView,
  cameraTarget: Point3D,
): RendererQualityPlan {
  const budget = view.presentation.qualityBudget;
  const selected = lightCandidates(view)
    .map((candidate) => ({
      ...candidate,
      distanceSquared: distanceSquared(candidate.position, cameraTarget),
    }))
    .sort(
      (a, b) => a.distanceSquared - b.distanceSquared || a.declarationOrder - b.declarationOrder,
    )
    .slice(0, budget.maxDynamicLights);
  const selectedIds = new Set(selected.map(({ id }) => id));

  return {
    canvas: budget.canvas,
    dpr: budget.dprMax === null ? null : [1, budget.dprMax],
    frameLoop: budget.ambientMotion ? "always" : "demand",
    shadows: budget.shadows !== "off" && budget.shadows !== null,
    shadowMapSize: shadowMapSize(budget.shadows),
    waterMode: budget.water === "2d" ? "none" : budget.water,
    postFxMode: budget.postfx,
    ambientMotion: budget.ambientMotion,
    particleScale: budget.particleScale,
    staticMotion: !budget.ambientMotion,
    dynamicLightIds: selected.map(({ id }) => id),
    dynamicNodeLightIds: view.world.nodes
      .filter(({ id }) => selectedIds.has(`node:${id}`))
      .map(({ id }) => id),
    dynamicCampfireLight: selectedIds.has("base:campfire"),
  };
}
