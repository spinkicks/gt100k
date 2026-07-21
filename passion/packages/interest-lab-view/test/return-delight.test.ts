import { buildLab } from "@gt100k/interest-lab-domain";
import type { ProbeFamily } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import { buildProbePickerView, buildSceneView, resolveMotion } from "../src/index";

const CATALOG = [
  {
    familyId: "p01",
    variants: [
      {
        id: "p01",
        familyId: "p01",
        domain: "making",
        workMode: "build",
        prerequisites: [],
        difficulty: "foundational",
        autonomy: "medium",
        social: "solo",
        audience: "no_audience",
        equipment: [],
        accessibilityVariants: [],
        expectedBurden: 0,
        safetyClass: "cleared",
        artifactEvidence: "synthetic voluntary-return fixture",
      },
    ],
  },
  {
    familyId: "p02",
    variants: [
      {
        id: "p02",
        familyId: "p02",
        domain: "making",
        workMode: "debug",
        prerequisites: [],
        difficulty: "stretch",
        autonomy: "medium",
        social: "solo",
        audience: "no_audience",
        equipment: [],
        accessibilityVariants: [],
        expectedBurden: 0,
        safetyClass: "cleared",
        artifactEvidence: "synthetic prompted-return fixture",
      },
    ],
  },
] satisfies ProbeFamily[];

const makeLab = () =>
  buildLab(
    "synthetic-return-delight-learner",
    CATALOG,
    { metPrereqs: [], engagedDomains: [] },
    {
      probeCountTarget: 2,
      probeCountRange: { min: 2, max: 2 },
      minDomains: 1,
      minWorkModes: 2,
      explorationFloor: 0,
    },
  );

const DEVICE_CAPS = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
} as const;

const sceneOptions = (
  history: readonly {
    probeId: string;
    returnKind: "voluntary" | "prompted";
    horizon?: 7 | 30;
    interventionContext?: string;
  }[],
  reducedMotion = false,
) => ({
  history,
  ageBand: "9-11" as const,
  deviceCaps: DEVICE_CAPS,
  reducedMotion,
  plainMode: false,
});

const markerFor = (scene: ReturnType<typeof buildSceneView>, probeId: string) =>
  scene.islands.flatMap(({ markers }) => markers).find((marker) => marker.probeId === probeId);

describe("voluntary-return delight", () => {
  it.each([7, 30] as const)(
    "reserves the welcome-back delight for a voluntary return at day %i",
    (horizon) => {
      const lab = makeLab();
      const history = [{ probeId: "p01", returnKind: "voluntary", horizon }] as const;
      const picker = buildProbePickerView(lab, { history, band: "9-11" });
      const scene = buildSceneView(lab, sceneOptions(history));
      const card = picker.quests.find(({ probeId }) => probeId === "p01");
      const marker = markerFor(scene, "p01");

      expect(card).toMatchObject({
        returnState: "voluntary-return",
        tone: "spark",
        motion: resolveMotion("welcomeBack", { reducedMotion: false }),
        whyCopy: "You came back to this one.",
      });
      expect(card?.whyCopy).not.toMatch(/you are (a|an|the) /i);
      expect(marker).toMatchObject({
        returnState: "voluntary-return",
        tone: "spark",
        motionKind: "welcomeBack",
        whyCopy: "You came back to this one.",
      });
    },
  );

  it("recedes a prompted return without welcome-back delight", () => {
    const lab = makeLab();
    const history = [
      {
        probeId: "p02",
        returnKind: "prompted",
        interventionContext: "reminder",
      },
    ] as const;
    const picker = buildProbePickerView(lab, { history, band: "9-11" });
    const scene = buildSceneView(lab, sceneOptions(history));
    const card = picker.quests.find(({ probeId }) => probeId === "p02");
    const marker = markerFor(scene, "p02");

    expect(card).toMatchObject({
      returnState: "prompted-return",
      tone: "prompted",
      motion: resolveMotion("promptedRecede", { reducedMotion: false }),
    });
    expect(card?.whyCopy).not.toMatch(/came back|welcome/i);
    expect(marker).toMatchObject({
      returnState: "prompted-return",
      tone: "prompted",
      motionKind: "promptedRecede",
      whyCopy: card?.whyCopy,
    });
  });

  it("uses a static warm halo and concrete text under reduced motion", () => {
    const lab = makeLab();
    const history = [{ probeId: "p01", returnKind: "voluntary", horizon: 7 }] as const;
    const picker = buildProbePickerView(lab, {
      history,
      band: "9-11",
      flags: { reducedMotion: true },
    });
    const scene = buildSceneView(lab, sceneOptions(history, true));
    const card = picker.quests.find(({ probeId }) => probeId === "p01");
    const marker = markerFor(scene, "p01");

    expect(card).toMatchObject({
      returnState: "voluntary-return",
      tone: "spark",
      motion: resolveMotion("welcomeBack", { reducedMotion: true }),
      whyCopy: "You came back to this one.",
    });
    expect(card?.motion.durationMs).toBe(0);
    expect(scene.renderTier).toBe("board-2d");
    expect(marker).toMatchObject({
      returnState: "voluntary-return",
      tone: "spark",
      motionKind: "welcomeBack",
      whyCopy: "You came back to this one.",
    });
  });
});
