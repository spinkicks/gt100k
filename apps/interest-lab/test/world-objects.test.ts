import {
  EASINGS,
  type IslandView,
  MOTION,
  PALETTE,
  QUALITY_TIERS,
  type QuestMarkerView,
  SCENE3D,
} from "@gt100k/interest-lab-view";
import { Float, Sparkles } from "@react-three/drei";
import { isValidElement } from "react";
import { Texture } from "three";
import { describe, expect, it, vi } from "vitest";
import { Island, resolveIslandRender } from "../app/child/world3d/Island";
import { Motes, resolveMotesProps } from "../app/child/world3d/Motes";
import {
  QuestMarker,
  canHoverQuestMarker,
  createPickHopSpring,
  resolveQuestMarkerVisual,
} from "../app/child/world3d/QuestMarker";

const marker: QuestMarkerView = {
  probeId: "p1",
  familyId: "f1",
  workModeGlyph: "hammer",
  position: [1, 2, 3],
  returnState: "new",
  tone: "neutral",
  motionKind: "markerGlow",
  provenance: "RULE",
  whyCopy: "A new kind to try.",
  helpAffordance: true,
};

const island: IslandView = {
  domain: "making",
  hue: "#FF8A66",
  center: [0, -0.6, -9],
  baseRadius: 2.2,
  markers: [marker],
};

describe("3D world objects", () => {
  it("builds deterministic high- and low-detail islands from three low-poly primitives", () => {
    const full = resolveIslandRender(island, QUALITY_TIERS.full);
    const lite = resolveIslandRender(island, QUALITY_TIERS.lite);

    expect(full).toMatchObject({
      position: island.center,
      hue: island.hue,
      shadows: true,
      float: {
        durationMs: MOTION.islandFloat,
        rotationIntensity: 0.18,
        floatIntensity: 1,
        floatingRange: [-0.12, 0.12],
      },
      geometry: {
        cap: { args: [1.804, 2.2, 0.55, 10, 1, false] },
        underside: { args: [2.024, 1.6, 10] },
        rim: { args: [1.804, 0.07, 4, 10] },
      },
    });
    expect(full?.float.speed).toBeCloseTo((8 * Math.PI) / 6.5, 8);
    expect(lite).toMatchObject({
      shadows: false,
      geometry: {
        cap: { args: [1.804, 2.2, 0.55, 6, 1, false] },
        underside: { args: [2.024, 1.6, 6] },
        rim: { args: [1.804, 0.07, 4, 6] },
      },
    });
    expect(resolveIslandRender(island, QUALITY_TIERS.board2d)).toBeNull();

    const element = Island({
      island,
      quality: QUALITY_TIERS.full,
      scene3d: SCENE3D,
      haloTexture: new Texture(),
      pickedProbeIds: new Set(),
      onPick: vi.fn(),
    });
    expect(isValidElement(element)).toBe(true);
    expect(element?.type).toBe(Float);
    expect(element?.props).toMatchObject({
      speed: full?.float.speed,
      rotationIntensity: full?.float.rotationIntensity,
      floatIntensity: full?.float.floatIntensity,
      floatingRange: full?.float.floatingRange,
    });
  });

  it("uses immediate press feedback and the reserved interruptible pick spring", () => {
    expect(resolveQuestMarkerVisual(marker, SCENE3D, {})).toMatchObject({
      position: marker.position,
      scale: 1,
      emissiveIntensity: SCENE3D.markerEmissiveRest,
      haloOpacity: 0.36,
      spring: {
        durationMs: MOTION.pick,
        type: EASINGS.pickSpring.type,
        bounce: EASINGS.pickSpring.bounce,
        duration: EASINGS.pickSpring.duration,
        hopHeight: 0.5,
      },
    });
    expect(resolveQuestMarkerVisual(marker, SCENE3D, { hovered: true })).toMatchObject({
      position: [1, 2.18, 3],
      emissiveIntensity: SCENE3D.markerEmissivePulse,
      haloOpacity: 0.62,
    });
    expect(resolveQuestMarkerVisual(marker, SCENE3D, { focused: true })).toMatchObject({
      position: marker.position,
      emissiveIntensity: SCENE3D.markerEmissivePulse,
      haloOpacity: 0.62,
    });
    expect(resolveQuestMarkerVisual(marker, SCENE3D, { pressed: true })).toMatchObject({
      scale: 0.97,
    });
    expect(resolveQuestMarkerVisual(marker, SCENE3D, { picked: true })).toMatchObject({
      emissiveIntensity: SCENE3D.markerEmissivePulse,
      haloOpacity: 0.62,
    });
    expect(canHoverQuestMarker("mouse")).toBe(true);
    expect(canHoverQuestMarker("pen")).toBe(true);
    expect(canHoverQuestMarker("touch")).toBe(false);

    const spring = createPickHopSpring();
    spring.trigger();
    spring.step(1 / 60);
    expect(spring.value).toBeGreaterThan(0);

    const valueBeforeInterrupt = spring.value;
    spring.trigger();
    expect(spring.value).toBe(valueBeforeInterrupt);
    for (let frame = 0; frame < 120; frame += 1) spring.step(1 / 60);
    expect(spring.value).toBeCloseTo(0, 3);
    expect(spring.velocity).toBeCloseTo(0, 3);

    expect(QuestMarker).toEqual(expect.any(Function));
  });

  it("maps the quality tier to the exact ambient Sparkles contract", () => {
    expect(resolveMotesProps(QUALITY_TIERS.full)).toEqual({
      count: 60,
      color: PALETTE.sparkHi,
      size: 2,
      speed: 0.3,
      scale: [26, 10, 26],
    });
    expect(resolveMotesProps(QUALITY_TIERS.lite)).toEqual({
      count: 24,
      color: PALETTE.sparkHi,
      size: 2,
      speed: 0.3,
      scale: [26, 10, 26],
    });
    expect(resolveMotesProps(QUALITY_TIERS.board2d)).toBeNull();

    const element = Motes({ quality: QUALITY_TIERS.full });
    expect(isValidElement(element)).toBe(true);
    expect(element?.type).toBe(Sparkles);
    expect(element?.props).toMatchObject(resolveMotesProps(QUALITY_TIERS.full) ?? {});
  });
});
