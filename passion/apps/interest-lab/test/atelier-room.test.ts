// @vitest-environment jsdom

import type { ActivityEvent } from "@gt100k/interest-lab";
import { CABIN, type ZoneActionModel, buildZoneActivityModel } from "@gt100k/interest-lab-view";
import { artStub } from "@gt100k/interest-zone-kit";
import { Children, type ReactNode, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { AtelierRoom } from "../app/child/rooms/AtelierRoom";
import {
  ATELIER_PALETTE,
  buildAtelierScene,
  measureAtelierFloors,
} from "../app/child/rooms/atelier-scene";

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
  probes: artStub.probes,
  actions,
  dayOffset: 7,
  tier: "room-3d" as const,
  reducedMotion: false,
});

describe("Atelier — the Art cabin interior (§7.2 / §9 hard floors)", () => {
  it("clears every §9 content floor from the pure scene description", () => {
    const floors = measureAtelierFloors(buildAtelierScene());

    expect(floors.dressedObjects).toBeGreaterThanOrEqual(30); // ≥30 dressed objects
    expect(floors.surfaceClasses).toBeGreaterThanOrEqual(5); // ≥5 surface classes
    expect(floors.warmSources).toBeGreaterThanOrEqual(2); // window + hearth (+ lanterns)
    expect(floors.shadowIsBlueViolet).toBe(true); // no dead gray shadow (Pillar B)
    expect(floors.allHuesOnPalette).toBe(true); // everything on the §3 palette (Pillar A)
    expect(floors.satin).toBe(true); // roughness ≥ 0.4 everywhere (satin, not plastic)
    // The three live craft objects exist: doorway easel + Storybox + half-finished frame (§8.2).
    expect([...floors.actionRoles].sort()).toEqual(["easel-canvas", "gallery-hero", "storybox"]);
  });

  it("keeps every scene hue on the palette — lights, shadow, shaft, motes, env (§13.4 cohesion)", () => {
    const scene = buildAtelierScene();
    const hues = [
      ...scene.lights.flatMap((l) => [l.color, l.groundColor].filter((c): c is string => Boolean(c))),
      ...scene.env.map((l) => l.color),
      scene.shadow.color,
      scene.shaft.color,
      scene.shaft.emissive,
      scene.motes.color,
    ];
    for (const hue of hues) expect(ATELIER_PALETTE.has(hue)).toBe(true);
  });

  it("lights the hearth as an emissive, blooming warm source (§13.3 firelight)", () => {
    const scene = buildAtelierScene();
    const firebox = scene.props.find((p) => p.key === "stove-firebox");
    expect(firebox?.emissive).toBe(CABIN.fireEmber);
    expect(firebox?.emissiveIntensity ?? 0).toBeGreaterThanOrEqual(2);
    // A second warm source (the golden window) — the ≥2 floor is met by real diegetic light.
    const window = scene.props.find((p) => p.key === "window-glass");
    expect(window?.emissive).toBe(CABIN.windowSpill);
  });

  it("binds the 3 sorted actions to live meshes that emit exact events (§13.6 primary-action-live)", () => {
    const model = buildZoneActivityModel(artStub);
    const emit = vi.fn<(e: ActivityEvent) => void>();
    const meshes = meshActions(AtelierRoom(roomProps(model.actions, emit)));

    // mesh[i] ⇒ actions[i]: Build (easel doorway) · Compose (Storybox) · Explain (gallery frame).
    expect(meshes).toHaveLength(model.actions.length);
    for (const [index, mesh] of meshes.entries()) {
      expect(mesh.action.actionId).toBe(model.actions[index]!.actionId);
      mesh.activate();
      const action = model.actions[index]!;
      expect(emit).toHaveBeenNthCalledWith(index + 1, {
        zoneId: "art",
        probeId: action.probeId,
        domain: action.domain,
        workMode: action.workMode,
        action: action.actionId,
        kind: action.kind,
        dayOffset: 7,
      });
    }
    // The primary action (Build) drives the doorway object (the luminous easel canvas).
    expect(model.actions[0]!.primary).toBe(true);
  });

  it("renders a pure, mountable element tree (Island-style function call, no hooks at the top)", () => {
    const model = buildZoneActivityModel(artStub);
    const element = AtelierRoom(roomProps(model.actions));
    expect(isValidElement(element)).toBe(true);
    expect(element?.props.name).toBe("art-atelier-room");
  });
});
