// @vitest-environment jsdom

import type { ActivityEvent } from "@gt100k/interest-lab";
import { CABIN, type ZoneActionModel, buildZoneActivityModel } from "@gt100k/interest-lab-view";
import { codeStub } from "@gt100k/interest-zone-kit";
import { Children, type ReactNode, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { TinkerWorkshopRoom } from "../app/child/rooms/TinkerWorkshopRoom";
import {
  CODE_HUE,
  CODE_PALETTE,
  buildCodeScene,
  measureCodeFloors,
} from "../app/child/rooms/code-scene";

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
  probes: codeStub.probes,
  actions,
  dayOffset: 7,
  tier: "room-3d" as const,
  reducedMotion: false,
});

describe("The Tinker Workshop — the Code cabin interior (§7 / §9 hard floors)", () => {
  it("clears every content floor from the pure scene description", () => {
    const floors = measureCodeFloors(buildCodeScene());

    expect(floors.dressedObjects).toBeGreaterThanOrEqual(40); // ≥40 dressed occupants (code spec §9)
    expect(floors.surfaceClasses).toBeGreaterThanOrEqual(6); // ≥6 surface classes
    expect(floors.warmSources).toBeGreaterThanOrEqual(2); // window + stove (+ lamps/bulbs/RUN key)
    expect(floors.shadowIsBlueViolet).toBe(true); // no dead gray shadow (Pillar B)
    expect(floors.allHuesOnPalette).toBe(true); // everything on the §3 palette + the sage code hue (Pillar A)
    expect(floors.satin).toBe(true); // roughness ≥ 0.4 everywhere (satin, not plastic)
    expect(floors.noColdBlueScreen).toBe(true); // NEVER a cold-blue screen (§6.4 / §11 code-room trap)
    // The three live craft objects exist: doorway monitor + keyboard hero + Sprout delight (§2.6).
    expect([...floors.actionRoles].sort()).toEqual(["keyboard", "monitor-screen", "sprout"]);
  });

  it("keeps every scene hue on the palette — lights, shadow, shaft, motes, env (§13.4 cohesion)", () => {
    const scene = buildCodeScene();
    const hues = [
      ...scene.lights.flatMap((l) => [l.color, l.groundColor].filter((c): c is string => Boolean(c))),
      ...Object.values(scene.env),
      scene.shadow.color,
      scene.shaft.color,
      scene.shaft.emissive,
      scene.motes.color,
    ];
    for (const hue of hues) expect(CODE_PALETTE.has(hue)).toBe(true);
  });

  it("lights the wood-stove as an emissive, blooming warm source (§13.3 firelight)", () => {
    const scene = buildCodeScene();
    const firebox = scene.props.find((p) => p.key === "stove-firebox");
    expect(firebox?.emissive).toBe(CABIN.fireEmber);
    expect(firebox?.emissiveIntensity ?? 0).toBeGreaterThanOrEqual(2);
    // A second warm source (the golden window) — the ≥2 floor is met by real diegetic light.
    const window = scene.props.find((p) => p.key === "window-glass");
    expect(window?.emissive).toBe(CABIN.windowSpill);
  });

  it("makes the monitor a SAGE-glowing (never cold-blue) doorway w/ bright legible code on a warm-dark bg (§4.1 / §6.4)", () => {
    const scene = buildCodeScene();
    const screen = scene.props.find((p) => p.role === "monitor-screen");
    expect(screen?.emissive).toBe(CODE_HUE); // sage code hue glow, warm-leaning green — never cold blue
    expect(screen?.emissiveIntensity ?? 0).toBeGreaterThanOrEqual(0.6); // a live, glowing door (not dead, not blown-white)
    expect(screen?.color).toBe(CABIN.forestDeep); // a warm-DARK editor background so the sage never blows to cold-cyan
    // Bright, blooming, legible code lines sit ON the dark screen (colorful syntax on warm-dark bg).
    const codeLines = scene.props.filter((p) => p.key.startsWith("code-line-"));
    expect(codeLines.length).toBeGreaterThanOrEqual(4);
    expect(codeLines.every((l) => (l.emissiveIntensity ?? 0) >= 1.2)).toBe(true); // the code blooms (the bright read)
    // Exactly one doorway (the monitor) — no second competing focal point (§4.1).
    const doorways = scene.props.filter((p) => p.role === "monitor-screen");
    expect(doorways).toHaveLength(1);
  });

  it("keeps the desk warm honey wood, not a cold RGB battlestation (§0 / §11 hero material call)", () => {
    const scene = buildCodeScene();
    const deskTop = scene.props.find((p) => p.key === "desk-top");
    expect(deskTop?.color).toBe(CABIN.woodHoney); // honey satin — the warm maker's desk, not black/neon
    expect(deskTop?.roughness ?? 0).toBeGreaterThanOrEqual(0.4); // satin, not plastic gloss
    // The one cool practical (verdigris dock-LED) is a "light", not a screen — never a cold-blue wash.
    const dockLed = scene.props.find((p) => p.key === "sprout-dock-led");
    expect(dockLed?.color).toBe(CABIN.verdigris);
    expect(dockLed?.surfaceClass).toBe("light");
  });

  it("binds the 3 sorted actions to live meshes that emit exact events (§13.6 primary-action-live)", () => {
    const model = buildZoneActivityModel(codeStub);
    const emit = vi.fn<(e: ActivityEvent) => void>();
    const meshes = meshActions(TinkerWorkshopRoom(roomProps(model.actions, emit)));

    // mesh[i] ⇒ actions[i]: Build (monitor doorway) · Debug (keyboard) · Investigate (Sprout).
    expect(meshes).toHaveLength(model.actions.length);
    for (const [index, mesh] of meshes.entries()) {
      expect(mesh.action.actionId).toBe(model.actions[index]!.actionId);
      mesh.activate();
      const action = model.actions[index]!;
      expect(emit).toHaveBeenNthCalledWith(index + 1, {
        zoneId: "code",
        probeId: action.probeId,
        domain: action.domain,
        workMode: action.workMode,
        action: action.actionId,
        kind: action.kind,
        dayOffset: 7,
      });
    }
    // The primary action (Build) drives the doorway object (the glowing monitor).
    expect(model.actions[0]!.primary).toBe(true);
  });

  it("renders a pure, mountable element tree (Island-style function call, no hooks at the top)", () => {
    const model = buildZoneActivityModel(codeStub);
    const element = TinkerWorkshopRoom(roomProps(model.actions));
    expect(isValidElement(element)).toBe(true);
    expect(element?.props.name).toBe("code-tinker-workshop-room");
  });
});
