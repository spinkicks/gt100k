import {
  EVENTS_GOLDEN_V1,
  buildLab,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab-domain";
import type { HypothesisRevision, InterestHypothesis, ProbeFamily } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import { buildEvidenceConstellationView } from "../src/constellation";
import { buildCoverageMatrixView } from "../src/coverage-view";
import { buildExplanationsView } from "../src/explanations";
import { buildLifecycleStateView, buildRevisionHistoryView } from "../src/lifecycle-view";
import type { InterestLabView } from "../src/model";
import { buildReturnTimelineView } from "../src/timeline";
import {
  type BuildInterestLabViewInputs,
  type BuildInterestLabViewOptions,
  buildInterestLabView,
  plainViewEquals,
} from "../src/view";

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
        artifactEvidence: "synthetic view-composition fixture",
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
        artifactEvidence: "synthetic view-composition fixture",
      },
    ],
  },
];

const lab = buildLab(
  "synthetic-view-composition-learner",
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
const summary = summarizeSignals(EVENTS_GOLDEN_V1);
const revision: HypothesisRevision = {
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: "synthetic-view-composition-learner",
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
  uncertainty: { kind: "grade", grade: "strong" },
  nextProbe: "compare a familiar tool with a new tool",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "retain competing explanations",
    rationale: "keep supporting and disconfirming accounts visible",
    reviewedAtDayOffset: 30,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 30,
  recordedAtDayOffset: 30,
};
const hypothesis: InterestHypothesis = {
  hypothesisId: revision.hypothesisId,
  learnerRef: revision.learnerRef,
  revisions: [revision],
};
const proposal: HypothesisRevision = {
  ...revision,
  state: "CANDIDATE_SPINE",
  guideReview: null,
  proposedBy: "RULE",
  operative: false,
};
const gate = {
  ...evaluateCandidateGate(summary),
  familiesPresent: summary.familiesPresent,
};

const buildFullView = (inputs: BuildInterestLabViewInputs): InterestLabView =>
  buildInterestLabView(inputs);

const options = (
  overrides: Partial<BuildInterestLabViewOptions> = {},
): BuildInterestLabViewOptions => ({
  surface: "child",
  ageBand: "9-11",
  reducedMotion: false,
  plainMode: false,
  deviceCaps: {
    webglAvailable: true,
    deviceMemoryGB: 16,
    hardwareConcurrency: 12,
    coarsePointer: false,
    saveData: false,
  },
  history: [],
  ...overrides,
});

const makeView = (viewOptions = options()): InterestLabView =>
  buildFullView({
    lab,
    coverage: lab.coverage,
    hypothesis,
    events: EVENTS_GOLDEN_V1,
    gate,
    proposal,
    options: viewOptions,
  });

describe("buildInterestLabView full composition", () => {
  it("composes every guide block from the same domain state", () => {
    const view = makeView(options({ surface: "guide" }));
    const timeline = buildReturnTimelineView(EVENTS_GOLDEN_V1);

    expect(view.surface).toBe("guide");
    expect(view.flags.surface).toBe("guide");
    expect(view.guide).toEqual({
      coverage: buildCoverageMatrixView(lab.coverage, lab.offers),
      explanations: buildExplanationsView(revision),
      timeline,
      lifecycle: buildLifecycleStateView(revision.state, gate, proposal),
      revisionHistory: buildRevisionHistoryView(hypothesis),
      constellation: buildEvidenceConstellationView(revision, timeline),
    });
    expect(
      view.scene.islands.flatMap(({ markers }) => markers).map(({ probeId }) => probeId),
    ).toEqual(view.probePicker.quests.map(({ probeId }) => probeId));
  });

  it("fails closed when no operative hypothesis revision can drive the guide", () => {
    expect(() =>
      buildFullView({
        lab,
        coverage: lab.coverage,
        hypothesis: { ...hypothesis, revisions: [] },
        events: EVENTS_GOLDEN_V1,
        gate,
        options: options(),
      }),
    ).toThrowError(/operative hypothesis revision/i);
  });
});

describe("plainViewEquals", () => {
  it("keeps one domain state across surface, age, motion, plain, camera, and tier changes", () => {
    const full = makeView();
    const reducedGuide = makeView(
      options({
        surface: "guide",
        ageBand: "12-14",
        reducedMotion: true,
        plainMode: true,
        deviceCaps: { webglAvailable: false, saveData: true },
      }),
    );

    expect(plainViewEquals(full, reducedGuide)).toBe(true);
    expect(full.flags).not.toEqual(reducedGuide.flags);
    expect(full.presentation.renderTier).not.toBe(reducedGuide.presentation.renderTier);
    expect(full.scene.camera).not.toEqual(reducedGuide.scene.camera);
  });

  it("keeps guide motion equal but reduced when reduced motion is requested", () => {
    const reduced = makeView(options({ reducedMotion: true }));

    expect(reduced.guide.timeline.motion.line).toMatchObject({
      kind: "timelineDraw",
      mode: "reduced",
      durationMs: 0,
    });
    expect(reduced.guide.timeline.motion.marker).toMatchObject({
      kind: "markerPop",
      mode: "reduced",
      durationMs: 0,
    });
  });

  it("compares state structurally rather than by object insertion order", () => {
    const baseline = makeView();
    const reordered = makeView();
    reordered.guide.explanations.uncertainty = {
      grade: "strong",
      kind: "grade",
    };

    expect(plainViewEquals(baseline, reordered)).toBe(true);
  });

  it("detects marker-by-probe and constellation-star state drift", () => {
    const baseline = makeView();
    const markerChanged = makeView();
    const marker = markerChanged.scene.islands[0]?.markers[0];
    if (!marker) {
      throw new Error("Synthetic fixture must contain a scene marker");
    }
    marker.whyCopy = "Different evidence-backed reason.";

    const constellationChanged = makeView();
    const star = constellationChanged.guide.constellation.stars[0];
    if (!star) {
      throw new Error("Synthetic fixture must contain a constellation star");
    }
    star.brightness = 0.18;

    expect(plainViewEquals(baseline, markerChanged)).toBe(false);
    expect(plainViewEquals(baseline, constellationChanged)).toBe(false);
  });
});
