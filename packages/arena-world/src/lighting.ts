import type { NodeState, QualityTier, WorldTheme } from "./model";
import { QUALITY_TIERS } from "./quality";
import { resolveLighting } from "./scene3d";

export interface NodeLightCandidate {
  nodeId: string;
  state: NodeState;
  transferCritical: boolean;
  position: { x: number; y: number; z: number };
}

export interface PointLightDescriptor {
  colorHex: string;
  intensity: number;
  distance: number;
  decay: number;
}

export interface NodeLightContribution {
  nodeId: string;
  state: NodeState;
  kind: "beacon" | "available-glow" | "none";
  renderMode: "dynamic" | "emissive" | "none";
  pointLight: PointLightDescriptor | null;
  emissiveHex: string | null;
  icon: "closed-padlock" | "start-pennant" | "filled-star";
  shape: "closed-marker" | "open-ring" | "raised-beacon";
}

export function resolveNodeLightContributions(
  candidates: readonly NodeLightCandidate[],
  tier: QualityTier,
  worldTheme: WorldTheme,
  cameraTarget: { x: number; y: number; z: number },
): NodeLightContribution[] {
  const lighting = resolveLighting(tier, worldTheme);
  const dynamicIndexes = new Set(
    candidates
      .map((candidate, index) => ({
        index,
        state: candidate.state,
        distanceSquared:
          (candidate.position.x - cameraTarget.x) ** 2 +
          (candidate.position.y - cameraTarget.y) ** 2 +
          (candidate.position.z - cameraTarget.z) ** 2,
      }))
      .filter(({ state }) => state !== "locked")
      .sort(
        (first, second) =>
          first.distanceSquared - second.distanceSquared || first.index - second.index,
      )
      .slice(0, QUALITY_TIERS[tier].maxDynamicLights)
      .map(({ index }) => index),
  );

  return candidates.map((candidate, index) => {
    if (candidate.state === "locked") {
      return {
        nodeId: candidate.nodeId,
        state: candidate.state,
        kind: "none",
        renderMode: "none",
        pointLight: null,
        emissiveHex: null,
        icon: "closed-padlock",
        shape: "closed-marker",
      };
    }

    const pointLight =
      candidate.state === "available"
        ? lighting.availableGlow
        : candidate.transferCritical
          ? lighting.beaconTransfer
          : lighting.beacon;
    const dynamic = dynamicIndexes.has(index);

    return {
      nodeId: candidate.nodeId,
      state: candidate.state,
      kind: candidate.state === "available" ? "available-glow" : "beacon",
      renderMode: dynamic ? "dynamic" : "emissive",
      pointLight: dynamic ? { ...pointLight } : null,
      emissiveHex: pointLight.colorHex,
      icon: candidate.state === "available" ? "start-pennant" : "filled-star",
      shape: candidate.state === "available" ? "open-ring" : "raised-beacon",
    };
  });
}
