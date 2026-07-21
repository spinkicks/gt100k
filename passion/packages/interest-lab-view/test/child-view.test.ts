import {
  EVENTS_GOLDEN_V1,
  buildLab,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab-domain";
import type { HypothesisRevision, Lab, ProbeFamily } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import {
  CAMERA3D,
  PALETTE,
  QUALITY_TIERS,
  SCENE3D,
  TYPOGRAPHY,
  buildInterestLabView,
  buildProbePickerView,
  buildSceneView,
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

const makeGuideInputs = (lab: Lab) => {
  const summary = summarizeSignals(EVENTS_GOLDEN_V1);
  const revision = {
    hypothesisId: "synthetic-child-view-hypothesis",
    learnerRef: lab.learnerRef,
    version: 1,
    candidateDomains: ["making"],
    workModeProfile: { build: 1 },
    state: "EMERGING",
    evidenceRefs: EVENTS_GOLDEN_V1.map(({ id }) => id),
    signalSummary: summary,
    competingExplanations: [
      "Interest may sustain through repeated building.",
      "Novelty may explain the current pattern.",
    ],
    coverageGaps: [],
    uncertainty: { kind: "grade", grade: "moderate" },
    nextProbe: "compare a familiar tool with a new tool",
    childPosition: "UNSURE",
    guideReview: {
      guide: "synthetic-guide-001",
      decision: "retain competing explanations",
      rationale: "keep multiple accounts visible while evidence grows",
      reviewedAtDayOffset: 30,
    },
    proposedBy: "GUIDE",
    operative: true,
    modelVersion: "rules-only-v1",
    policyVersion: "rules-engine-v1",
    validFromDayOffset: 30,
    recordedAtDayOffset: 30,
  } satisfies HypothesisRevision;

  return {
    coverage: lab.coverage,
    hypothesis: {
      hypothesisId: revision.hypothesisId,
      learnerRef: revision.learnerRef,
      revisions: [revision],
    },
    events: EVENTS_GOLDEN_V1,
    gate: {
      ...evaluateCandidateGate(summary),
      familiesPresent: summary.familiesPresent,
    },
  };
};

describe("buildInterestLabView child composition", () => {
  it("composes the picker, deterministic scene, caller flags, and derived presentation", () => {
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
      ...makeGuideInputs(lab),
      options: {
        surface: "child",
        ageBand: "6-8",
        reducedMotion: false,
        plainMode: false,
        deviceCaps,
        history: [],
      },
    });

    expect(view).toMatchObject({
      surface: "child",
      flags: {
        reducedMotion: false,
        plainMode: false,
        ageBand: "6-8",
        surface: "child",
        deviceCaps,
      },
      presentation: {
        palette: PALETTE,
        typography: TYPOGRAPHY,
        scene3d: SCENE3D,
        camera3d: CAMERA3D,
        renderTier: "quest-world-3d",
        quality: QUALITY_TIERS.full,
      },
    });
    expect(view.probePicker).toEqual(
      buildProbePickerView(lab, {
        history: [],
        band: "6-8",
        flags: { reducedMotion: false },
      }),
    );
    expect(view.scene).toEqual(
      buildSceneView(lab, {
        history: [],
        ageBand: "6-8",
        reducedMotion: false,
        plainMode: false,
        deviceCaps,
      }),
    );
    expect(view.presentation.renderTier).toBe(view.scene.renderTier);
    expect(view.presentation.quality).toEqual(view.scene.quality);
    expect(view.presentation.motionOf("pick")).toEqual(
      resolveMotion("pick", { reducedMotion: false }),
    );
    expect(view.guide.constellation.stars).toHaveLength(6);
  });

  it("leaves the supplied domain Lab unchanged", () => {
    const lab = makeLab();
    const before = structuredClone(lab);

    buildInterestLabView({
      lab,
      ...makeGuideInputs(lab),
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
