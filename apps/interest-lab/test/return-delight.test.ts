import { EASINGS, MOTION, PALETTE, type QuestMarkerView, SCENE3D } from "@gt100k/interest-lab-view";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Texture } from "three";
import { describe, expect, it } from "vitest";
import { QuestCard } from "../app/child/QuestCard";
import { buildQuestWorldSceneGraph } from "../app/child/QuestWorld";
import { WelcomeBack } from "../app/child/WelcomeBack";
import { CameraRig, createWelcomeCameraTransition } from "../app/child/world3d/CameraRig";
import {
  resolveQuestMarkerVisual,
  shouldRenderWelcomeBloom,
} from "../app/child/world3d/QuestMarker";
import { WELCOME_BLOOM_SPARKS, resolveWelcomeBloomFrame } from "../app/child/world3d/WelcomeBloom";
import { SYNTHETIC_RETURN_HISTORY, buildSyntheticInterestLabSeed } from "../app/seed";

const RETURN_HISTORY = [
  { probeId: "p01", returnKind: "voluntary", horizon: 7 },
  {
    probeId: "p02",
    returnKind: "prompted",
    interventionContext: "reminder",
  },
] as const;

const view = buildSyntheticInterestLabSeed({
  history: SYNTHETIC_RETURN_HISTORY,
  deviceCaps: {
    webglAvailable: true,
    deviceMemoryGB: 16,
    hardwareConcurrency: 12,
    coarsePointer: false,
    saveData: false,
  },
}).view;

const markerFor = (probeId: string) =>
  view.scene.islands
    .flatMap(({ markers }) => markers)
    .find((marker) => marker.probeId === probeId)!;

describe("rendered return delight", () => {
  it("keeps the rendered P11 preview synthetic and deterministic", () => {
    expect(SYNTHETIC_RETURN_HISTORY).toEqual(RETURN_HISTORY);
  });

  it("renders the voluntary return as concrete static DOM text and a warm halo", () => {
    const quest = view.probePicker.quests.find(({ probeId }) => probeId === "p01")!;
    const welcomeMarkup = renderToStaticMarkup(createElement(WelcomeBack, { quest }));
    const cardMarkup = renderToStaticMarkup(
      createElement(QuestCard, {
        quest,
        index: 0,
        picked: false,
        onPick: () => undefined,
      }),
    );

    expect(welcomeMarkup).toContain('data-return-delight="static"');
    expect(welcomeMarkup).toContain('class="welcome-back-halo"');
    expect(welcomeMarkup).toContain("You came back to this one.");
    expect(cardMarkup).toContain('data-return-state="voluntary-return"');
    expect(cardMarkup).toContain('data-return-tone="spark"');
    expect(cardMarkup).toContain('data-return-delight="static"');
    expect(cardMarkup).not.toMatch(/you are (a|an|the) /i);
    expect(cardMarkup).not.toMatch(/countdown|streak|scarcity|fomo|time-gated|level up|unlock in/i);
  });

  it("visibly recedes prompted returns without rendering any celebration", () => {
    const quest = view.probePicker.quests.find(({ probeId }) => probeId === "p02")!;
    const cardMarkup = renderToStaticMarkup(
      createElement(QuestCard, {
        quest,
        index: 1,
        picked: false,
        onPick: () => undefined,
      }),
    );
    const marker = markerFor("p02");
    const markerVisual = resolveQuestMarkerVisual(marker, SCENE3D, {});

    expect(cardMarkup).toContain('data-return-state="prompted-return"');
    expect(cardMarkup).toContain('data-return-tone="prompted"');
    expect(cardMarkup).toContain("quest-card--prompted");
    expect(cardMarkup).toContain('data-return-delight="none"');
    expect(cardMarkup).toContain('data-return-glyph="prompted"');
    expect(cardMarkup).toContain("Returned after a prompt.");
    expect(cardMarkup).not.toContain("welcome-back-halo");
    expect(cardMarkup).not.toMatch(/you came back|welcome back/i);
    expect(markerVisual).toMatchObject({
      color: PALETTE.prompted,
      scale: 0.92,
      emissiveIntensity: 0.14,
      haloOpacity: 0.12,
    });
    expect(shouldRenderWelcomeBloom(marker)).toBe(false);
  });

  it("peaks once at the exact 3D bloom value and settles within welcomeBack", () => {
    const marker = markerFor("p01") as QuestMarkerView;
    const start = resolveWelcomeBloomFrame(0, SCENE3D, false);
    const peak = resolveWelcomeBloomFrame(MOTION.welcomeBack / 2, SCENE3D, false);
    const settled = resolveWelcomeBloomFrame(MOTION.welcomeBack, SCENE3D, false);
    const reduced = resolveWelcomeBloomFrame(0, SCENE3D, true);

    expect(start).toMatchObject({
      durationMs: 480,
      easing: EASINGS.pop,
      sparkOpacity: 0,
      sparkRise: 0,
    });
    expect(peak).toMatchObject({
      emissiveIntensity: SCENE3D.bloomPeak,
      haloOpacity: 0.9,
      haloScale: 1.45,
    });
    expect(settled).toMatchObject({
      emissiveIntensity: SCENE3D.markerEmissivePulse,
      sparkOpacity: 0,
    });
    expect(reduced).toMatchObject({
      durationMs: 0,
      sparkOpacity: 0,
      sparkRise: 0,
    });
    expect(WELCOME_BLOOM_SPARKS).toHaveLength(8);
    expect(new Set(WELCOME_BLOOM_SPARKS.map((position) => position.join(","))).size).toBe(8);
    expect(shouldRenderWelcomeBloom(marker)).toBe(true);
    expect(
      resolveQuestMarkerVisual(marker, SCENE3D, {
        welcomeElapsedMs: MOTION.welcomeBack / 2,
      }),
    ).toMatchObject({
      emissiveIntensity: SCENE3D.bloomPeak,
      haloOpacity: 0.9,
    });
  });

  it("eases the camera toward the voluntary return until DOM focus takes over", () => {
    const haloTexture = new Texture();
    const welcomeGraph = buildQuestWorldSceneGraph({
      view,
      focusedProbeId: null,
      pickedProbeIds: new Set(),
      haloTexture,
    });
    const welcomeCamera = welcomeGraph.find((element) => element.type === CameraRig);
    const focusedGraph = buildQuestWorldSceneGraph({
      view,
      focusedProbeId: "p02",
      pickedProbeIds: new Set(),
      haloTexture,
    });
    const focusedCamera = focusedGraph.find((element) => element.type === CameraRig);

    expect(welcomeCamera?.props.focusedProbeId).toBeNull();
    expect(welcomeCamera?.props.welcomeProbeId).toBe("p01");
    expect(focusedCamera?.props.focusedProbeId).toBe("p02");
    expect(focusedCamera?.props.welcomeProbeId).toBe("p01");

    const target = view.scene.islands[0]!.center;
    const transition = createWelcomeCameraTransition(
      { pos: [0, 7, 22], target: [0, 0.4, 0] },
      { pos: [target[0], target[1] + 1.6, target[2] + 6.5], target, mode: "ease" },
      false,
    );
    expect(transition).toMatchObject({
      durationMs: MOTION.welcomeBack,
      easing: EASINGS.pop,
    });
    expect(transition.frameAt(MOTION.welcomeBack)).toEqual(transition.to);

    const scalarTransition = createWelcomeCameraTransition(
      { pos: [0, 0, 0], target: [0, 0, 0] },
      { pos: [10, 0, 0], target: [0, 0, 0], mode: "ease" },
      false,
    );
    const sampledX = Array.from(
      { length: 49 },
      (_, index) => scalarTransition.frameAt(index * 10).pos[0],
    );
    expect(Math.max(...sampledX)).toBeLessThanOrEqual(10.5);
  });
});
