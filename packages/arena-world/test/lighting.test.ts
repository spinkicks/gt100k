import { LIGHTING, resolveLighting } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

type QualityTier = "A" | "B" | "C" | "D";
type WorldTheme = "default" | "dawn" | "dusk";
type NodeState = "locked" | "available" | "unlocked";

interface LightCandidate {
  nodeId: string;
  state: NodeState;
  transferCritical: boolean;
  position: { x: number; y: number; z: number };
}

interface LightContribution {
  nodeId: string;
  state: NodeState;
  kind: "beacon" | "available-glow" | "none";
  renderMode: "dynamic" | "emissive" | "none";
  pointLight: {
    colorHex: string;
    intensity: number;
    distance: number;
    decay: number;
  } | null;
  emissiveHex: string | null;
  icon: "closed-padlock" | "start-pennant" | "filled-star";
  shape: "closed-marker" | "open-ring" | "raised-beacon";
}

type NodeLightResolver = (
  candidates: readonly LightCandidate[],
  tier: QualityTier,
  worldTheme: WorldTheme,
  cameraTarget: { x: number; y: number; z: number },
) => LightContribution[];

const resolveNodeLightContributions = (
  arenaWorld as typeof arenaWorld & {
    resolveNodeLightContributions?: NodeLightResolver;
  }
).resolveNodeLightContributions;

const CAMERA_TARGET = { x: 0, y: 0, z: 0 } as const;

describe("arena mastery-as-light", () => {
  it("keeps every per-tier and world-theme lighting rig exact", () => {
    expect(resolveLighting("A", "default")).toEqual(LIGHTING);
    expect(resolveLighting("B", "default")).toEqual({
      ...LIGHTING,
      shadow: { ...LIGHTING.shadow, mapSize: 1024, soft: false },
    });

    const staticLighting = {
      ...LIGHTING,
      key: { ...LIGHTING.key, castShadow: false },
      sunDriftDeg: 0,
      sunDriftMs: 0,
    };
    expect(resolveLighting("C", "default")).toEqual(staticLighting);
    expect(resolveLighting("D", "default")).toEqual(staticLighting);
    expect(resolveLighting("A", "dawn")).toEqual({
      ...LIGHTING,
      key: { ...LIGHTING.key, colorHex: "#FFCDB0", intensity: 2.2 },
      hemi: { ...LIGHTING.hemi, skyHex: "#FBD9C0" },
    });
    expect(resolveLighting("A", "dusk")).toEqual({
      ...LIGHTING,
      key: { ...LIGHTING.key, intensity: 1.6 },
      ambient: { ...LIGHTING.ambient, colorHex: "#1B2A4A", intensity: 0.35 },
      beacon: { ...LIGHTING.beacon, intensity: 2.4 },
      beaconTransfer: { ...LIGHTING.beaconTransfer, intensity: 3 },
    });
  });

  it("maps unlocked, available, and locked states to light plus icon and shape cues", () => {
    expect(resolveNodeLightContributions).toBeTypeOf("function");
    if (!resolveNodeLightContributions) return;

    const contributions = resolveNodeLightContributions(
      [
        {
          nodeId: "ordinary-unlock",
          state: "unlocked",
          transferCritical: false,
          position: { x: 0, y: 0, z: 0 },
        },
        {
          nodeId: "transfer-unlock",
          state: "unlocked",
          transferCritical: true,
          position: { x: 1, y: 0, z: 0 },
        },
        {
          nodeId: "ready-node",
          state: "available",
          transferCritical: false,
          position: { x: 2, y: 0, z: 0 },
        },
        {
          nodeId: "locked-node",
          state: "locked",
          transferCritical: false,
          position: { x: 3, y: 0, z: 0 },
        },
      ],
      "A",
      "default",
      CAMERA_TARGET,
    );

    expect(contributions).toEqual([
      {
        nodeId: "ordinary-unlock",
        state: "unlocked",
        kind: "beacon",
        renderMode: "dynamic",
        pointLight: LIGHTING.beacon,
        emissiveHex: LIGHTING.beacon.colorHex,
        icon: "filled-star",
        shape: "raised-beacon",
      },
      {
        nodeId: "transfer-unlock",
        state: "unlocked",
        kind: "beacon",
        renderMode: "dynamic",
        pointLight: LIGHTING.beaconTransfer,
        emissiveHex: LIGHTING.beaconTransfer.colorHex,
        icon: "filled-star",
        shape: "raised-beacon",
      },
      {
        nodeId: "ready-node",
        state: "available",
        kind: "available-glow",
        renderMode: "dynamic",
        pointLight: LIGHTING.availableGlow,
        emissiveHex: LIGHTING.availableGlow.colorHex,
        icon: "start-pennant",
        shape: "open-ring",
      },
      {
        nodeId: "locked-node",
        state: "locked",
        kind: "none",
        renderMode: "none",
        pointLight: null,
        emissiveHex: null,
        icon: "closed-padlock",
        shape: "closed-marker",
      },
    ]);
  });

  it("enforces A=8, B=3, C=0, D=0 using nearest stable selection", () => {
    expect(resolveNodeLightContributions).toBeTypeOf("function");
    if (!resolveNodeLightContributions) return;

    const candidates = Array.from({ length: 10 }, (_, index) => ({
      nodeId: `node-${index}`,
      state: index % 2 === 0 ? ("unlocked" as const) : ("available" as const),
      transferCritical: index === 2,
      position: { x: index, y: 0, z: 0 },
    }));

    const dynamicIds = (tier: QualityTier) =>
      resolveNodeLightContributions(candidates, tier, "default", CAMERA_TARGET)
        .filter(({ renderMode }) => renderMode === "dynamic")
        .map(({ nodeId }) => nodeId);

    expect(dynamicIds("A")).toEqual(candidates.slice(0, 8).map(({ nodeId }) => nodeId));
    expect(dynamicIds("B")).toEqual(candidates.slice(0, 3).map(({ nodeId }) => nodeId));
    expect(dynamicIds("C")).toEqual([]);
    expect(dynamicIds("D")).toEqual([]);

    const tied = candidates.slice(0, 4).map((candidate, index) => ({
      ...candidate,
      position: index === 3 ? { x: 1, y: 0, z: 0 } : { x: 2, y: 0, z: 0 },
    }));
    expect(dynamicIdsFor(tied, "B")).toEqual(["node-0", "node-1", "node-3"]);
  });

  it("uses theme-adjusted lights and returns fresh deterministic contributions", () => {
    expect(resolveNodeLightContributions).toBeTypeOf("function");
    if (!resolveNodeLightContributions) return;

    const candidate = {
      nodeId: "dusk-beacon",
      state: "unlocked",
      transferCritical: false,
      position: CAMERA_TARGET,
    } as const;
    const first = resolveNodeLightContributions([candidate], "A", "dusk", CAMERA_TARGET);
    const second = resolveNodeLightContributions([candidate], "A", "dusk", CAMERA_TARGET);

    expect(first).toEqual(second);
    expect(first[0]?.pointLight).toEqual({ ...LIGHTING.beacon, intensity: 2.4 });
    if (first[0]?.pointLight) first[0].pointLight.intensity = 99;
    expect(resolveNodeLightContributions([candidate], "A", "dusk", CAMERA_TARGET)).toEqual(second);
  });
});

function dynamicIdsFor(candidates: readonly LightCandidate[], tier: QualityTier): string[] {
  if (!resolveNodeLightContributions) return [];
  return resolveNodeLightContributions(candidates, tier, "default", CAMERA_TARGET)
    .filter(({ renderMode }) => renderMode === "dynamic")
    .map(({ nodeId }) => nodeId);
}
