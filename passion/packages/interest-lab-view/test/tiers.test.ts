import { buildLab } from "@gt100k/interest-lab-domain";
import type { ProbeFamily } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import { QUALITY_TIERS, buildSceneView, resolveQualityTier, resolveRenderTier } from "../src/index";
import type { DeviceCaps, RenderTier } from "../src/index";

const STRONG_CAPS = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
} as const satisfies DeviceCaps;

const ANIMATED_FLAGS = {
  reducedMotion: false,
  plainMode: false,
} as const;

const CASES: readonly {
  name: string;
  caps: DeviceCaps;
  flags: typeof ANIMATED_FLAGS | { reducedMotion: boolean; plainMode: boolean };
  renderTier: RenderTier;
  quality: (typeof QUALITY_TIERS)[keyof typeof QUALITY_TIERS];
}[] = [
  {
    name: "strong device",
    caps: STRONG_CAPS,
    flags: ANIMATED_FLAGS,
    renderTier: "quest-world-3d",
    quality: QUALITY_TIERS.full,
  },
  {
    name: "six GB device",
    caps: { ...STRONG_CAPS, deviceMemoryGB: 6 },
    flags: ANIMATED_FLAGS,
    renderTier: "quest-world-3d-lite",
    quality: QUALITY_TIERS.lite,
  },
  {
    name: "low-concurrency device",
    caps: { ...STRONG_CAPS, hardwareConcurrency: 4 },
    flags: ANIMATED_FLAGS,
    renderTier: "quest-world-3d-lite",
    quality: QUALITY_TIERS.lite,
  },
  {
    name: "coarse-pointer device",
    caps: { ...STRONG_CAPS, coarsePointer: true },
    flags: ANIMATED_FLAGS,
    renderTier: "quest-world-3d-lite",
    quality: QUALITY_TIERS.lite,
  },
  {
    name: "under-four-GB device",
    caps: { ...STRONG_CAPS, deviceMemoryGB: 3 },
    flags: ANIMATED_FLAGS,
    renderTier: "board-2d",
    quality: QUALITY_TIERS.board2d,
  },
  {
    name: "reduced-motion presentation",
    caps: STRONG_CAPS,
    flags: { reducedMotion: true, plainMode: false },
    renderTier: "board-2d",
    quality: QUALITY_TIERS.board2d,
  },
  {
    name: "plain presentation",
    caps: STRONG_CAPS,
    flags: { reducedMotion: false, plainMode: true },
    renderTier: "board-2d",
    quality: QUALITY_TIERS.board2d,
  },
  {
    name: "device without WebGL",
    caps: { ...STRONG_CAPS, webglAvailable: false },
    flags: ANIMATED_FLAGS,
    renderTier: "board-2d",
    quality: QUALITY_TIERS.board2d,
  },
  {
    name: "Save-Data device",
    caps: { ...STRONG_CAPS, saveData: true },
    flags: ANIMATED_FLAGS,
    renderTier: "board-2d",
    quality: QUALITY_TIERS.board2d,
  },
];

const SINGLE_QUEST_CATALOG: ProbeFamily[] = [
  {
    familyId: "tier-family",
    variants: [
      {
        id: "tier-probe",
        familyId: "tier-family",
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
        artifactEvidence: "synthetic tier fixture",
      },
    ],
  },
];

const makeLab = () =>
  buildLab(
    "synthetic-tier-learner",
    SINGLE_QUEST_CATALOG,
    { metPrereqs: [], engagedDomains: [] },
    {
      probeCountTarget: 1,
      probeCountRange: { min: 1, max: 1 },
      minDomains: 1,
      minWorkModes: 1,
      explorationFloor: 0,
    },
  );

describe("render and quality tiers", () => {
  it.each(CASES)("resolves the $name golden", ({ caps, flags, renderTier, quality }) => {
    expect(resolveRenderTier(caps, flags)).toBe(renderTier);
    expect(resolveQualityTier(caps, flags)).toEqual(quality);
  });

  it("uses the pinned defaults and exact threshold boundaries", () => {
    expect(resolveRenderTier({ webglAvailable: true }, ANIMATED_FLAGS)).toBe("quest-world-3d");
    expect(
      resolveRenderTier(
        { ...STRONG_CAPS, deviceMemoryGB: 4, hardwareConcurrency: 8 },
        ANIMATED_FLAGS,
      ),
    ).toBe("quest-world-3d-lite");
    expect(
      resolveRenderTier(
        { ...STRONG_CAPS, deviceMemoryGB: 8, hardwareConcurrency: 8 },
        ANIMATED_FLAGS,
      ),
    ).toBe("quest-world-3d");
  });

  it("keeps scene state identical while presentation tiers change", () => {
    const lab = makeLab();
    const makeScene = (caps: DeviceCaps) =>
      buildSceneView(lab, {
        history: [],
        ageBand: "9-11",
        deviceCaps: caps,
        ...ANIMATED_FLAGS,
      });
    const full = makeScene(STRONG_CAPS);
    const lite = makeScene({ ...STRONG_CAPS, deviceMemoryGB: 6 });
    const board = makeScene({ ...STRONG_CAPS, saveData: true });
    const stateOf = ({ islands, camera, scene3d }: typeof full) => ({
      islands,
      camera,
      scene3d,
    });

    expect([full.renderTier, lite.renderTier, board.renderTier]).toEqual([
      "quest-world-3d",
      "quest-world-3d-lite",
      "board-2d",
    ]);
    expect([full.quality, lite.quality, board.quality]).toEqual([
      QUALITY_TIERS.full,
      QUALITY_TIERS.lite,
      QUALITY_TIERS.board2d,
    ]);
    expect([full.motes, lite.motes, board.motes]).toEqual([60, 24, 0]);
    expect(stateOf(lite)).toEqual(stateOf(full));
    expect(stateOf(board)).toEqual(stateOf(full));
  });
});
