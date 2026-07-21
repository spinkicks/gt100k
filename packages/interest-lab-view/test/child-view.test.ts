import { buildLab } from "@gt100k/interest-lab";
import type { ProbeFamily } from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import {
  CAMERA3D,
  PALETTE,
  QUALITY_TIERS,
  SCENE3D,
  TYPOGRAPHY,
  buildInterestLabView,
  buildProbePickerView,
  resolveMotion,
} from "../src/index";

const CATALOG: ProbeFamily[] = [
  {
    familyId: "family-build",
    variants: [
      {
        id: "probe-build",
        familyId: "family-build",
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
        artifactEvidence: "synthetic child-view fixture",
      },
    ],
  },
  {
    familyId: "family-investigate",
    variants: [
      {
        id: "probe-investigate",
        familyId: "family-investigate",
        domain: "living_systems",
        workMode: "investigate",
        prerequisites: [],
        difficulty: "stretch",
        autonomy: "medium",
        social: "group",
        audience: "audience",
        equipment: [],
        accessibilityVariants: [],
        expectedBurden: 0,
        safetyClass: "cleared",
        artifactEvidence: "synthetic child-view fixture",
      },
    ],
  },
];

const makeLab = () =>
  buildLab(
    "synthetic-child-view-learner",
    CATALOG,
    { metPrereqs: [], engagedDomains: [] },
    {
      probeCountTarget: 2,
      probeCountRange: { min: 2, max: 2 },
      minDomains: 2,
      minWorkModes: 2,
      explorationFloor: 0,
    },
  );

describe("buildInterestLabView child composition", () => {
  it("composes the picker, caller flags, and board presentation without a scene", () => {
    const lab = makeLab();
    const deviceCaps = {
      webglAvailable: true,
      deviceMemoryGB: 16,
      hardwareConcurrency: 12,
      coarsePointer: false,
      saveData: false,
    } as const;
    const view = buildInterestLabView({
      lab,
      options: {
        surface: "child",
        ageBand: "6-8",
        reducedMotion: true,
        plainMode: true,
        deviceCaps,
        history: [],
      },
    });

    expect(view).toMatchObject({
      surface: "child",
      flags: {
        reducedMotion: true,
        plainMode: true,
        ageBand: "6-8",
        surface: "child",
        deviceCaps,
      },
      presentation: {
        palette: PALETTE,
        typography: TYPOGRAPHY,
        scene3d: SCENE3D,
        camera3d: CAMERA3D,
        renderTier: "board-2d",
        quality: QUALITY_TIERS.board2d,
      },
    });
    expect(view.probePicker).toEqual(
      buildProbePickerView(lab, {
        history: [],
        band: "6-8",
        flags: { reducedMotion: true },
      }),
    );
    expect(view.presentation.motionOf("pick")).toEqual(
      resolveMotion("pick", { reducedMotion: true }),
    );
    expect("scene" in view).toBe(false);
    expect("guide" in view).toBe(false);
  });

  it("leaves the supplied domain Lab unchanged", () => {
    const lab = makeLab();
    const before = structuredClone(lab);

    buildInterestLabView({
      lab,
      options: {
        surface: "child",
        ageBand: "9-11",
        reducedMotion: false,
        plainMode: false,
        deviceCaps: { webglAvailable: false },
      },
    });

    expect(lab).toEqual(before);
  });
});
