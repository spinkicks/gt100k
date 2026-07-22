// @vitest-environment jsdom

import type { ActivityEvent } from "@gt100k/interest-lab";
import { CABIN, type ZoneActionModel, buildZoneActivityModel } from "@gt100k/interest-lab-view";
import { musicStub } from "@gt100k/interest-zone-kit";
import { Children, type ReactNode, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { SoundingCabinRoom } from "../app/child/rooms/SoundingCabinRoom";
import {
  MUSIC_HUE,
  MUSIC_PALETTE,
  buildMusicScene,
  measureMusicFloors,
} from "../app/child/rooms/music-scene";

// Walk a rendered element tree for the interactive <mesh> action nodes (mirrors the zone-kit
// activity-dom-parity contract): a mesh carrying userData.action + onClick, in DFS order.
const meshActions = (node: ReactNode): Array<{ action: ZoneActionModel; activate: () => void }> => {
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  return Children.toArray(node.props.children).flatMap((child) => {
    if (
      isValidElement<{
        children?: ReactNode;
        onClick?: () => void;
        userData?: { action?: ZoneActionModel };
      }>(child) &&
      child.type === "mesh" &&
      child.props.userData?.action !== undefined &&
      child.props.onClick !== undefined
    ) {
      return [{ action: child.props.userData.action, activate: child.props.onClick }];
    }
    return meshActions(child);
  });
};

const roomProps = (actions: readonly ZoneActionModel[], emit = vi.fn<(e: ActivityEvent) => void>()) => ({
  emit,
  probes: musicStub.probes,
  actions,
  dayOffset: 7,
  tier: "room-3d" as const,
  reducedMotion: false,
});

describe("Sounding Cabin — the Music cabin interior (§7.2 / §8 hard floors)", () => {
  it("clears every §8 content floor from the pure scene description", () => {
    const floors = measureMusicFloors(buildMusicScene());

    expect(floors.dressedObjects).toBeGreaterThanOrEqual(42); // ≥42 dressed objects (music spec §8)
    expect(floors.surfaceClasses).toBeGreaterThanOrEqual(8); // ≥8 surface classes
    expect(floors.warmSources).toBeGreaterThanOrEqual(2); // window + stove (+ valves/lamps/sconces)
    expect(floors.shadowIsBlueViolet).toBe(true); // no dead gray shadow (Pillar B)
    expect(floors.allHuesOnPalette).toBe(true); // everything on the §3 palette + the music hue (Pillar A)
    expect(floors.satin).toBe(true); // roughness ≥ 0.4 everywhere (satin, not plastic — the piano hero call)
    // The three live craft objects exist: doorway screen + piano hero + turntable (§6.1).
    expect([...floors.actionRoles].sort()).toEqual(["console-screen", "piano", "turntable"]);
  });

  it("keeps every scene hue on the palette — lights, shadow, shaft, motes, env (§13.4 cohesion)", () => {
    const scene = buildMusicScene();
    const hues = [
      ...scene.lights.flatMap((l) => [l.color, l.groundColor].filter((c): c is string => Boolean(c))),
      ...Object.values(scene.env),
      scene.shadow.color,
      scene.shaft.color,
      scene.shaft.emissive,
      scene.motes.color,
    ];
    for (const hue of hues) expect(MUSIC_PALETTE.has(hue)).toBe(true);
  });

  it("lights the wood-stove as an emissive, blooming warm source (§13.3 firelight)", () => {
    const scene = buildMusicScene();
    const firebox = scene.props.find((p) => p.key === "stove-firebox");
    expect(firebox?.emissive).toBe(CABIN.fireEmber);
    expect(firebox?.emissiveIntensity ?? 0).toBeGreaterThanOrEqual(2);
    // A second warm source (the golden window) — the ≥2 floor is met by real diegetic light.
    const window = scene.props.find((p) => p.key === "window-glass");
    expect(window?.emissive).toBe(CABIN.windowSpill);
  });

  it("keeps the piano warm satin wood, never black-gloss plastic (§4.1 / §9 hero material call)", () => {
    const scene = buildMusicScene();
    const pianoParts = scene.props.filter((p) => p.surfaceClass === "piano");
    expect(pianoParts.length).toBeGreaterThan(0);
    for (const part of pianoParts) {
      // warm wood palette (or the emissive candle keybed) — never a dark near-black lacquer body,
      // and satin (roughness ≥ 0.4, no plastic gloss).
      expect(MUSIC_PALETTE.has(part.color)).toBe(true);
      expect(part.roughness).toBeGreaterThanOrEqual(0.4);
    }
    const body = scene.props.find((p) => p.key === "piano-body");
    expect(body?.color).toBe(CABIN.woodHoney); // honey satin, the deliberate cottage-parlour call
  });

  it("makes the doorway screen the single brightest, music-hued, blooming focal point (§2.4 value hierarchy)", () => {
    const scene = buildMusicScene();
    const screen = scene.props.find((p) => p.role === "console-screen");
    expect(screen?.emissive).toBe(MUSIC_HUE);
    expect(screen?.emissiveIntensity ?? 0).toBeGreaterThanOrEqual(1.2); // blooms + drops tone-mapping (the door)
    // Exactly one doorway (the screen), one hero (piano), one delight (turntable) — no second door.
    const roles = scene.props.filter((p) => p.role !== undefined).map((p) => p.role);
    expect(roles.filter((r) => r === "console-screen")).toHaveLength(1);
  });

  it("binds the 3 sorted actions to live meshes that emit exact events (§13.6 primary-action-live)", () => {
    const model = buildZoneActivityModel(musicStub);
    const emit = vi.fn<(e: ActivityEvent) => void>();
    const meshes = meshActions(SoundingCabinRoom(roomProps(model.actions, emit)));

    // mesh[i] ⇒ actions[i]: Build (screen doorway) · Debug (piano) · Perform (turntable).
    expect(meshes).toHaveLength(model.actions.length);
    for (const [index, mesh] of meshes.entries()) {
      expect(mesh.action.actionId).toBe(model.actions[index]!.actionId);
      mesh.activate();
      const action = model.actions[index]!;
      expect(emit).toHaveBeenNthCalledWith(index + 1, {
        zoneId: "music",
        probeId: action.probeId,
        domain: action.domain,
        workMode: action.workMode,
        action: action.actionId,
        kind: action.kind,
        dayOffset: 7,
      });
    }
    // The primary action (Build) drives the doorway object (the glowing console screen).
    expect(model.actions[0]!.primary).toBe(true);
  });

  it("renders a pure, mountable element tree (Island-style function call, no hooks at the top)", () => {
    const model = buildZoneActivityModel(musicStub);
    const element = SoundingCabinRoom(roomProps(model.actions));
    expect(isValidElement(element)).toBe(true);
    expect(element?.props.name).toBe("music-sounding-cabin-room");
  });
});
