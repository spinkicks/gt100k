import { type DeviceCaps, QUALITY_TIERS, type RenderTier } from "@gt100k/interest-lab-view";
import { PerformanceMonitor } from "@react-three/drei";
import { type ReactNode, createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Texture } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Board2D, nextQuestFocusIndex } from "../app/child/Board2D";
import { updatePickedProbeIds } from "../app/child/QuestLedger";
import { QuestWorld, buildQuestWorldSceneGraph } from "../app/child/QuestWorld";
import { CameraRig } from "../app/child/world3d/CameraRig";
import { Island, resolveIslandRender } from "../app/child/world3d/Island";
import { Motes, resolveMotesProps } from "../app/child/world3d/Motes";
import { buildSyntheticInterestLabSeed } from "../app/seed";
import {
  applyRenderTierOverride,
  applySustainedPerformanceFloor,
} from "../app/ui/controls/settings";

const captures = vi.hoisted(() => ({
  worldProps: null as {
    scene?: { renderTier: RenderTier };
    children?: ReactNode;
    onContextLost?: () => void;
  } | null,
}));

vi.mock("../app/child/world3d/World3D", () => ({
  World3D: (props: NonNullable<typeof captures.worldProps>) => {
    captures.worldProps = props;
    return createElement("div", {
      "aria-hidden": "true",
      "data-world-3d-host": "true",
      "data-world-3d-tier": props.scene?.renderTier,
    });
  },
}));

const FULL_CAPS: DeviceCaps = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
};

const LITE_CAPS: DeviceCaps = {
  ...FULL_CAPS,
  deviceMemoryGB: 6,
};

const viewFor = (deviceCaps: DeviceCaps) => buildSyntheticInterestLabSeed({ deviceCaps }).view;

const QUALITY_CASES = [
  {
    name: "full",
    caps: FULL_CAPS,
    quality: QUALITY_TIERS.full,
    islandSegments: 10,
  },
  {
    name: "lite",
    caps: LITE_CAPS,
    quality: QUALITY_TIERS.lite,
    islandSegments: 6,
  },
] as const;

describe("QuestWorld tier switch", () => {
  beforeEach(() => {
    captures.worldProps = null;
  });

  it("allows explicit tiers to step down but never bypasses the capability floor", () => {
    const cases = [
      { caps: FULL_CAPS, request: "auto", expected: "quest-world-3d" },
      { caps: FULL_CAPS, request: "quest-world-3d-lite", expected: "quest-world-3d-lite" },
      { caps: FULL_CAPS, request: "board-2d", expected: "board-2d" },
      { caps: LITE_CAPS, request: "quest-world-3d", expected: "quest-world-3d-lite" },
      {
        caps: { ...FULL_CAPS, webglAvailable: false },
        request: "quest-world-3d",
        expected: "board-2d",
      },
    ] as const;

    for (const { caps, request, expected } of cases) {
      const resolvedCaps = applyRenderTierOverride(caps, request);
      expect(viewFor(resolvedCaps).scene.renderTier).toBe(expected);
    }
  });

  it("steps repeated sustained low frame rate from full to lite to board-2d", () => {
    expect(viewFor(applySustainedPerformanceFloor(FULL_CAPS, 0)).scene.renderTier).toBe(
      "quest-world-3d",
    );
    expect(viewFor(applySustainedPerformanceFloor(FULL_CAPS, 1)).scene).toMatchObject({
      renderTier: "quest-world-3d-lite",
      quality: QUALITY_TIERS.lite,
    });
    expect(viewFor(applySustainedPerformanceFloor(FULL_CAPS, 2)).scene).toMatchObject({
      renderTier: "board-2d",
      quality: QUALITY_TIERS.board2d,
    });
  });

  it.each([
    ["Save-Data", { ...FULL_CAPS, saveData: true }],
    ["device memory below 4 GB", { ...FULL_CAPS, deviceMemoryGB: 3 }],
    ["unavailable WebGL", { ...FULL_CAPS, webglAvailable: false }],
  ] as const)("falls directly to board-2d for %s without losing a quest", (_reason, caps) => {
    const fullView = viewFor(FULL_CAPS);
    const fallbackView = viewFor(caps);
    const fullProbeIds = fullView.probePicker.visibleQuests.map(({ probeId }) => probeId);
    const fallbackProbeIds = fallbackView.probePicker.visibleQuests.map(({ probeId }) => probeId);
    const pickedProbeId = fullProbeIds[0] ?? "missing";
    const pickedProbeIds = updatePickedProbeIds([], { type: "pick", probeId: pickedProbeId });
    const markup = renderToStaticMarkup(
      createElement(Board2D, {
        quests: fallbackView.probePicker.visibleQuests,
        pickedProbeIds,
        onPick: vi.fn(),
        onFocus: vi.fn(),
        touchTargetPx: fallbackView.probePicker.staging.touchTargetPx,
      }),
    );

    expect(fallbackView.scene.renderTier).toBe("board-2d");
    expect(fallbackProbeIds).toEqual(fullProbeIds);
    expect(pickedProbeIds).toEqual([pickedProbeId]);
    expect(markup).toContain(`data-probe-id="${pickedProbeId}"`);
    expect(markup).toContain('aria-pressed="true"');
    expect(markup).toContain("In your tray");
  });

  it("keeps the same picked quest through every runtime performance tier", () => {
    const pickedProbeId = viewFor(FULL_CAPS).probePicker.visibleQuests[0]?.probeId ?? "missing";
    const pickedProbeIds = updatePickedProbeIds([], { type: "pick", probeId: pickedProbeId });

    for (const step of [0, 1, 2] as const) {
      const view = viewFor(applySustainedPerformanceFloor(FULL_CAPS, step));
      const markup = renderToStaticMarkup(
        createElement(Board2D, {
          quests: view.probePicker.visibleQuests,
          pickedProbeIds,
          onPick: vi.fn(),
          onFocus: vi.fn(),
          touchTargetPx: view.probePicker.staging.touchTargetPx,
        }),
      );

      expect(view.probePicker.visibleQuests.some(({ probeId }) => probeId === pickedProbeId)).toBe(
        true,
      );
      expect(markup).toContain(`data-probe-id="${pickedProbeId}"`);
      expect(markup).toContain('aria-pressed="true"');
    }
  });

  it.each([
    ["quest-world-3d", FULL_CAPS],
    ["quest-world-3d-lite", LITE_CAPS],
  ] as const)("composes the %s scene with an always-operable DOM ledger", (tier, caps) => {
    const view = viewFor(caps);
    const markup = renderToStaticMarkup(createElement(QuestWorld, { view }));

    expect(view.scene.renderTier).toBe(tier);
    expect(markup).toContain(`data-quest-world-tier="${tier}"`);
    expect(markup).toContain(`data-world-3d-tier="${tier}"`);
    expect(markup.match(/data-quest-card="true"/g)).toHaveLength(6);
    expect(markup).toContain("Your quest constellation");
    expect(captures.worldProps?.onContextLost).toEqual(expect.any(Function));
    expect(isValidElement(captures.worldProps?.children)).toBe(true);
  });

  it("uses the same DOM quest state for the no-WebGL board tier", () => {
    const fullMarkup = renderToStaticMarkup(
      createElement(QuestWorld, { view: viewFor(FULL_CAPS) }),
    );
    const fullProbeIds = [...fullMarkup.matchAll(/data-probe-id="([^"]+)"/g)].map(
      ([, probeId]) => probeId,
    );

    captures.worldProps = null;
    const boardView = viewFor({ ...FULL_CAPS, webglAvailable: false });
    const boardMarkup = renderToStaticMarkup(createElement(QuestWorld, { view: boardView }));
    const boardProbeIds = [...boardMarkup.matchAll(/data-probe-id="([^"]+)"/g)].map(
      ([, probeId]) => probeId,
    );

    expect(boardView.scene).toMatchObject({
      renderTier: "board-2d",
      quality: QUALITY_TIERS.board2d,
    });
    expect(boardMarkup).toContain('data-quest-world-tier="board-2d"');
    expect(boardMarkup).not.toContain("data-world-3d-host");
    expect(boardProbeIds).toEqual(fullProbeIds);
    expect(captures.worldProps).toBeNull();
  });

  it("builds one shared scene graph from ledger focus and pick state", () => {
    const view = viewFor(FULL_CAPS);
    const focusedProbeId = view.scene.islands[1]?.markers[0]?.probeId ?? null;
    const pickedProbeIds = new Set([view.scene.islands[0]?.markers[0]?.probeId ?? "missing"]);
    const haloTexture = new Texture();
    const onPick = vi.fn();
    const onPerformanceDecline = vi.fn();
    const graph = buildQuestWorldSceneGraph({
      view,
      focusedProbeId,
      pickedProbeIds,
      haloTexture,
      onPick,
      onPerformanceDecline,
    });
    const islands = graph.filter((element) => element.type === Island);
    const camera = graph.find((element) => element.type === CameraRig);
    const motes = graph.find((element) => element.type === Motes);
    const performanceMonitor = graph.find((element) => element.type === PerformanceMonitor);

    expect(islands).toHaveLength(8);
    expect(islands.reduce((count, element) => count + element.props.island.markers.length, 0)).toBe(
      20,
    );
    expect(islands.every((element) => element.props.haloTexture === haloTexture)).toBe(true);
    expect(islands.every((element) => element.props.pickedProbeIds === pickedProbeIds)).toBe(true);
    expect(islands.every((element) => element.props.focusedProbeId === focusedProbeId)).toBe(true);
    // Every island (all 8 — not just the ledger's visible slice) forwards the shared pick
    // handler down to its orbs, so a 3D click drives the same reducer as a DOM card.
    expect(islands.every((element) => element.props.onPick === onPick)).toBe(true);
    expect(camera?.props).toMatchObject({
      scene: view.scene,
      focusedProbeId,
      reducedMotion: false,
      worldCameraMode: view.probePicker.staging.worldCameraMode,
    });
    expect(motes?.props).toEqual({ quality: view.scene.quality });
    expect(performanceMonitor?.props.onDecline).toBe(onPerformanceDecline);
    expect(performanceMonitor?.props.bounds(120)).toEqual([55, 120]);
  });

  it.each(QUALITY_CASES)(
    "threads the composed $name quality through motes and every island",
    ({ caps, quality, islandSegments }) => {
      const view = viewFor(caps);
      const graph = buildQuestWorldSceneGraph({
        view,
        focusedProbeId: null,
        pickedProbeIds: new Set(),
        haloTexture: new Texture(),
      });
      const islands = graph.filter((element) => element.type === Island);
      const motes = graph.find((element) => element.type === Motes);

      expect(view.scene.quality).toEqual(quality);
      expect(islands).toHaveLength(view.scene.islands.length);
      expect(islands.every((element) => element.props.quality === view.scene.quality)).toBe(true);
      expect(motes?.props.quality).toBe(view.scene.quality);
      expect(resolveMotesProps(motes?.props.quality).count).toBe(quality.motes);

      for (const element of islands) {
        const render = resolveIslandRender(element.props.island, element.props.quality);
        expect(render?.shadows).toBe(quality.shadows);
        expect(render?.geometry.cap.args[3]).toBe(islandSegments);
      }
    },
  );

  it("moves arrow focus deterministically while native Tab remains available", () => {
    expect(nextQuestFocusIndex(0, "ArrowRight", 6)).toBe(1);
    expect(nextQuestFocusIndex(5, "ArrowRight", 6)).toBe(0);
    expect(nextQuestFocusIndex(0, "ArrowLeft", 6)).toBe(5);
    expect(nextQuestFocusIndex(3, "ArrowDown", 6)).toBe(4);
    expect(nextQuestFocusIndex(3, "ArrowUp", 6)).toBe(2);
    expect(nextQuestFocusIndex(3, "Tab", 6)).toBeNull();
    expect(nextQuestFocusIndex(0, "ArrowRight", 0)).toBeNull();
  });
});
