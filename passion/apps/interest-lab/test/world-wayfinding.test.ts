import type { DeviceCaps, IslandView } from "@gt100k/interest-lab-view";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorldWayfinding } from "../app/child/WorldWayfinding";
import { countWorldQuests, resolveWorldWayfinding } from "../app/child/world3d/wayfinding";
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
const firstProbeId = scene.islands[0]!.markers[0]!.probeId;

describe("resolveWorldWayfinding (where am I / what have I collected)", () => {
  it("counts every unique world marker as the quest total", () => {
    const uniqueMarkers = new Set(
      scene.islands.flatMap((island) => island.markers.map((m) => m.probeId)),
    );
    expect(countWorldQuests(scene.islands)).toBe(uniqueMarkers.size);
    expect(resolveWorldWayfinding(scene.islands, null, 0).questTotal).toBe(uniqueMarkers.size);
  });

  it("reports the picked count and a legible collected label", () => {
    const way = resolveWorldWayfinding(scene.islands, null, 3);
    expect(way.pickedCount).toBe(3);
    expect(way.countLabel).toBe(`3 of ${way.questTotal} quests collected`);
  });

  it("clamps the picked count into [0, questTotal]", () => {
    const total = countWorldQuests(scene.islands);
    expect(resolveWorldWayfinding(scene.islands, null, -5).pickedCount).toBe(0);
    expect(resolveWorldWayfinding(scene.islands, null, total + 99).pickedCount).toBe(total);
  });

  it("marks overview available only when an island is focused", () => {
    expect(resolveWorldWayfinding(scene.islands, null, 0).overviewAvailable).toBe(false);
    expect(resolveWorldWayfinding(scene.islands, null, 0).focusedDomainLabel).toBeNull();

    const focused = resolveWorldWayfinding(scene.islands, firstProbeId, 0);
    expect(focused.overviewAvailable).toBe(true);
    expect(focused.focusedDomainLabel).not.toBeNull();
  });

  it("handles an empty archipelago without dividing or throwing", () => {
    const way = resolveWorldWayfinding([] as IslandView[], null, 4);
    expect(way.questTotal).toBe(0);
    expect(way.pickedCount).toBe(0);
    expect(way.countLabel).toBe("No quests yet");
    expect(way.overviewAvailable).toBe(false);
  });

  it("uses the singular noun for a single-quest world", () => {
    const one: IslandView[] = [{ ...scene.islands[0]!, markers: [scene.islands[0]!.markers[0]!] }];
    expect(resolveWorldWayfinding(one, null, 1).countLabel).toBe("1 of 1 quest collected");
  });
});

describe("WorldWayfinding DOM affordance", () => {
  const render = (focusedProbeId: string | null, pickedCount: number) =>
    renderToStaticMarkup(
      createElement(WorldWayfinding, {
        islands: scene.islands,
        focusedProbeId,
        pickedCount,
        onOverview: () => undefined,
      }),
    );

  it("renders a persistent my-quests count reflecting collected picks", () => {
    const markup = render(null, 2);
    expect(markup).toContain('data-my-quests-count="2"');
    expect(markup).toContain("quests collected");
  });

  it("disables the overview control at the archipelago and enables it on an island", () => {
    const overview = render(null, 0);
    expect(overview).toContain('data-overview-available="false"');
    expect(overview).toContain("disabled");

    const island = render(firstProbeId, 0);
    expect(island).toContain('data-overview-available="true"');
    expect(island).toContain('data-overview-control="true"');
  });
});
