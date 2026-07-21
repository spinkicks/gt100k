import { buildLab } from "@gt100k/interest-lab-domain";
import type { ProbeFamily, WorkMode } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import {
  CAMERA3D,
  QUALITY_TIERS,
  SCENE3D,
  buildProbePickerView,
  buildSceneView,
  resolveCamera3D,
  resolveDomainHue,
  resolveIslandLayout,
  resolveQuestPlacement,
} from "../src/index";
import type { Vector3 } from "../src/index";

const SEED_DOMAINS = [
  "making",
  "living_systems",
  "symbols_math",
  "word_craft",
  "sound_music",
  "movement_body",
  "visual_design",
  "social_world",
] as const;

const GOLDEN_CENTERS: readonly Vector3[] = [
  [0, -0.6, -9],
  [6.364, 0, -6.364],
  [9, 0.6, 0],
  [6.364, -0.6, 6.364],
  [0, 0, 9],
  [-6.364, 0.6, 6.364],
  [-9, -0.6, 0],
  [-6.364, 0, -6.364],
];

const makeFamily = (id: string, domain: string, workMode: WorkMode): ProbeFamily => ({
  familyId: id,
  variants: [
    {
      id,
      familyId: id,
      domain,
      workMode,
      prerequisites: [],
      difficulty: "foundational",
      autonomy: "medium",
      social: "solo",
      audience: "no_audience",
      equipment: [],
      accessibilityVariants: [],
      expectedBurden: 0,
      safetyClass: "cleared",
      artifactEvidence: "synthetic scene fixture",
    },
  ],
});

const CATALOG: ProbeFamily[] = [
  makeFamily("p01", "making", "build"),
  makeFamily("p02", "making", "debug"),
  makeFamily("p03", "making", "compose"),
  makeFamily("p04", "living_systems", "investigate"),
  makeFamily("p05", "symbols_math", "explain"),
  makeFamily("p06", "word_craft", "persuade"),
  makeFamily("p07", "sound_music", "perform"),
  makeFamily("p08", "movement_body", "collaborate"),
  makeFamily("p09", "visual_design", "care"),
  makeFamily("p10", "social_world", "build"),
];

const makeLab = () =>
  buildLab(
    "synthetic-scene-learner",
    CATALOG,
    { metPrereqs: [], engagedDomains: [] },
    {
      probeCountTarget: 10,
      probeCountRange: { min: 10, max: 10 },
      minDomains: 8,
      minWorkModes: 8,
      explorationFloor: 0,
    },
  );

const FULL_SCENE_OPTIONS = {
  history: [],
  ageBand: "9-11",
  deviceCaps: {
    webglAvailable: true,
    deviceMemoryGB: 16,
    hardwareConcurrency: 12,
    coarsePointer: false,
    saveData: false,
  },
  reducedMotion: false,
  plainMode: false,
} as const;

const expectVectorClose = (actual: Vector3, expected: Vector3): void => {
  actual.forEach((value, index) => {
    expect(Math.abs(value - expected[index]!)).toBeLessThanOrEqual(0.001);
  });
};

describe("scene layout", () => {
  it("places the eight seed domains on the catalog-ordered golden ring deterministically", () => {
    const first = resolveIslandLayout(SEED_DOMAINS);
    const replay = resolveIslandLayout(SEED_DOMAINS);

    expect(first).toEqual(replay);
    expect(first.map(({ domain }) => domain)).toEqual(SEED_DOMAINS);
    first.forEach((island, index) => {
      expect(island.baseRadius).toBe(2.2);
      expect(island.hue).toBe(resolveDomainHue(SEED_DOMAINS, island.domain));
      expectVectorClose(island.center, GOLDEN_CENTERS[index]!);
    });

    const reversed = resolveIslandLayout([...SEED_DOMAINS].reverse());
    expectVectorClose(reversed[0]!.center, GOLDEN_CENTERS[0]!);
    expect(reversed[0]!.domain).toBe("social_world");
    expect(reversed.find(({ domain }) => domain === "making")?.center).not.toEqual(
      first[0]!.center,
    );
  });

  it("places making's three quest markers at the local-ring golden positions", () => {
    const center: Vector3 = [0, -0.6, -9];
    const expected: Vector3[] = [
      [0, 0.8, -7.9],
      [0.953, 0.929, -8.45],
      [-0.953, 0.664, -8.45],
    ];

    expected.forEach((position, index) => {
      expectVectorClose(resolveQuestPlacement(center, index, 3), position);
    });
  });
});

describe("scene camera", () => {
  it("uses home drift-in or reduced-motion cut framing", () => {
    expect(resolveCamera3D(null, { reducedMotion: false })).toEqual({
      ...CAMERA3D.home,
      mode: "drift-in",
    });
    expect(resolveCamera3D(null, { reducedMotion: true })).toEqual({
      ...CAMERA3D.home,
      mode: "cut",
    });
  });

  it("eases toward a focused island or cuts there under reduced motion", () => {
    const islandCenters = resolveIslandLayout(SEED_DOMAINS).map(({ center }) => center);
    const animated = resolveCamera3D(0, { reducedMotion: false, islandCenters });
    const reduced = resolveCamera3D(0, { reducedMotion: true, islandCenters });

    expectVectorClose(animated.target, [0, -0.6, -9]);
    expectVectorClose(animated.pos, [0, 1.718, -2.54]);
    expect(animated.mode).toBe("ease");
    expect(reduced).toEqual({ ...animated, mode: "cut" });
  });
});

describe("buildSceneView", () => {
  it("mirrors every 2D card into one marker without scalar or ranking fields", () => {
    const lab = makeLab();
    const picker = buildProbePickerView(lab, { history: [], band: "9-11" });
    const scene = buildSceneView(lab, FULL_SCENE_OPTIONS);
    const markers = scene.islands.flatMap(({ markers }) => markers);
    const parityFields = ({
      probeId,
      returnState,
      tone,
      provenance,
      whyCopy,
      workModeGlyph,
    }: (typeof picker.quests)[number] | (typeof markers)[number]) => ({
      probeId,
      returnState,
      tone,
      provenance,
      whyCopy,
      workModeGlyph,
    });

    expect(scene).toMatchObject({
      camera: { ...CAMERA3D.home, mode: "drift-in" },
      renderTier: "quest-world-3d",
      quality: QUALITY_TIERS.full,
      motes: 60,
      scene3d: SCENE3D,
    });
    expect(scene.islands.map(({ domain }) => domain)).toEqual(SEED_DOMAINS);
    expect(
      Object.fromEntries(markers.map((marker) => [marker.probeId, parityFields(marker)])),
    ).toEqual(
      Object.fromEntries(picker.quests.map((quest) => [quest.probeId, parityFields(quest)])),
    );

    const forbidden = /^(price|score|rank|percentile|verdict)$/;
    const allKeys = JSON.stringify(scene, (_key, value) => value).match(/"[^"]+"(?=:)/g) ?? [];
    expect(allKeys.map((key) => key.slice(1, -1)).filter((key) => forbidden.test(key))).toEqual([]);
  });

  it("keeps world and board on one truth: markers ⊆ quests and every quest is reachable", () => {
    const lab = makeLab();
    const picker = buildProbePickerView(lab, { history: [], band: "9-11" });
    const scene = buildSceneView(lab, FULL_SCENE_OPTIONS);
    const markerIds = scene.islands.flatMap(({ markers }) => markers.map((m) => m.probeId));
    const questIds = new Set(picker.quests.map((quest) => quest.probeId));

    // No orb picks a probe that has no matching quest (markers ⊆ quests).
    for (const id of markerIds) {
      expect(questIds.has(id)).toBe(true);
    }
    // Every quest is reachable as exactly one marker — no quest is board-only décor,
    // and no island is unreachable décor.
    expect(new Set(markerIds)).toEqual(questIds);
    expect(markerIds).toHaveLength(picker.quests.length);
    // The board stages fewer quests than the world at once, so this parity is load-bearing.
    expect(picker.quests.length).toBeGreaterThan(picker.visibleQuests.length);
  });
});
