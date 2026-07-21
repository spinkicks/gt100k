import type { DeviceCaps, Vector3 } from "@gt100k/interest-lab-view";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Texture } from "three";
import { describe, expect, it } from "vitest";
import { QuestWorld, buildQuestWorldSceneGraph } from "../app/child/QuestWorld";
import { Beacon } from "../app/child/world3d/Beacon";
import { IslandBanner } from "../app/child/world3d/IslandBanner";
import {
  BEACON_TARGET,
  PICK_HOP_HEIGHT,
  domainBannerLabel,
  resolveBeaconRender,
  resolveFocusedDomain,
  resolveIslandBannerLabel,
  resolvePickHopPosition,
} from "../app/child/world3d/beacon";
import { buildSyntheticInterestLabSeed } from "../app/seed";

const FULL_CAPS: DeviceCaps = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
};

const seed = buildSyntheticInterestLabSeed({ deviceCaps: FULL_CAPS });
const { scene } = seed.view;

describe("pick hop travels toward the my-quests beacon", () => {
  const marker: Vector3 = [4, 1.4, -2];

  it("rests exactly on the marker while the hop spring is idle", () => {
    expect(resolvePickHopPosition(marker, BEACON_TARGET, 0)).toEqual(marker);
  });

  it("rises the full hop height and leans toward the beacon at the peak", () => {
    const peak = resolvePickHopPosition(marker, BEACON_TARGET, PICK_HOP_HEIGHT);
    // The orb rises by the whole hop height.
    expect(peak[1]).toBeCloseTo(marker[1] + PICK_HOP_HEIGHT, 6);
    // …and drifts partway toward the beacon on both horizontal axes (never past it).
    expect(peak[0]).toBeGreaterThan(BEACON_TARGET[0]);
    expect(peak[0]).toBeLessThan(marker[0]);
    expect(peak[2]).toBeGreaterThan(marker[2]);
    expect(peak[2]).toBeLessThan(BEACON_TARGET[2]);
  });

  it("clamps an over-triggered spring so the lean never overshoots the beacon", () => {
    const beyondPeak = resolvePickHopPosition(marker, BEACON_TARGET, PICK_HOP_HEIGHT * 4);
    const atPeak = resolvePickHopPosition(marker, BEACON_TARGET, PICK_HOP_HEIGHT);
    expect(beyondPeak[0]).toBeCloseTo(atPeak[0], 6);
    expect(beyondPeak[2]).toBeCloseTo(atPeak[2], 6);
  });
});

describe("beacon brightens as quests collect", () => {
  it("stays dim and inactive when the tray is empty", () => {
    const render = resolveBeaconRender(0);
    expect(render.active).toBe(false);
    expect(render.position).toEqual(BEACON_TARGET);
  });

  it("grows warmer with each collected quest, then plateaus", () => {
    expect(resolveBeaconRender(1).active).toBe(true);
    expect(resolveBeaconRender(2).emissiveIntensity).toBeGreaterThan(
      resolveBeaconRender(0).emissiveIntensity,
    );
    expect(resolveBeaconRender(99).emissiveIntensity).toEqual(
      resolveBeaconRender(6).emissiveIntensity,
    );
  });

  it("is placed in the 3D scene graph carrying the collected count", () => {
    const graph = buildQuestWorldSceneGraph({
      view: seed.view,
      focusedProbeId: null,
      pickedProbeIds: new Set(["p1", "p2"]),
      haloTexture: new Texture(),
    });
    const beacon = graph.find((element) => element.type === Beacon);
    expect(beacon).toBeDefined();
    expect(beacon?.props.pickedCount).toBe(2);
  });
});

describe("island-name banner names the visited domain", () => {
  it("title-cases snake_case catalog domains", () => {
    expect(domainBannerLabel("sound_music")).toBe("Sound Music");
    expect(domainBannerLabel("making")).toBe("Making");
  });

  it("resolves the focused orb's domain from the scene", () => {
    const island = scene.islands[1]!;
    const probeId = island.markers[0]!.probeId;
    expect(resolveFocusedDomain(scene.islands, probeId)).toBe(island.domain);
    expect(resolveFocusedDomain(scene.islands, null)).toBeNull();
    expect(resolveFocusedDomain(scene.islands, "no-such-probe")).toBeNull();
  });

  it("renders a DOM banner for the focused domain", () => {
    const island = scene.islands[0]!;
    const probeId = island.markers[0]!.probeId;
    const label = resolveIslandBannerLabel(scene.islands, probeId);
    expect(label).toBe(domainBannerLabel(island.domain));

    const markup = renderToStaticMarkup(createElement(IslandBanner, { label: label! }));
    expect(markup).toContain(domainBannerLabel(island.domain));
    expect(markup).toContain(`data-island-banner="${domainBannerLabel(island.domain)}"`);
    expect(markup).toContain("Visiting");
  });

  it("hides the banner until an island is visited", () => {
    const markup = renderToStaticMarkup(createElement(QuestWorld, { view: seed.view }));
    expect(markup).not.toContain("data-island-banner");
  });
});
