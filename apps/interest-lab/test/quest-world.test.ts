import { type DeviceCaps, QUALITY_TIERS, type RenderTier } from "@gt100k/interest-lab-view";
import { type ReactNode, createElement, isValidElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Texture } from "three";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextQuestFocusIndex } from "../app/child/Board2D";
import { QuestWorld, buildQuestWorldSceneGraph } from "../app/child/QuestWorld";
import { CameraRig } from "../app/child/world3d/CameraRig";
import { Island } from "../app/child/world3d/Island";
import { Motes } from "../app/child/world3d/Motes";
import { buildSyntheticInterestLabSeed } from "../app/seed";
import { applyRenderTierOverride } from "../app/ui/controls/settings";

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
    const graph = buildQuestWorldSceneGraph({
      view,
      focusedProbeId,
      pickedProbeIds,
      haloTexture,
    });
    const islands = graph.filter((element) => element.type === Island);
    const camera = graph.find((element) => element.type === CameraRig);
    const motes = graph.find((element) => element.type === Motes);

    expect(islands).toHaveLength(8);
    expect(islands.reduce((count, element) => count + element.props.island.markers.length, 0)).toBe(
      20,
    );
    expect(islands.every((element) => element.props.haloTexture === haloTexture)).toBe(true);
    expect(islands.every((element) => element.props.pickedProbeIds === pickedProbeIds)).toBe(true);
    expect(islands.every((element) => element.props.focusedProbeId === focusedProbeId)).toBe(true);
    expect(camera?.props).toMatchObject({
      scene: view.scene,
      focusedProbeId,
      reducedMotion: false,
      worldCameraMode: view.probePicker.staging.worldCameraMode,
    });
    expect(motes?.props).toEqual({ quality: view.scene.quality });
  });

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
