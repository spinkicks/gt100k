import {
  EVENTS_GOLDEN_V1,
  buildLab,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab";
import type { HypothesisRevision, InterestHypothesis, ProbeFamily } from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import {
  type AgeBand,
  type BuildInterestLabViewOptions,
  type DeviceCaps,
  type InterestLabView,
  type RenderTier,
  buildInterestLabView,
  plainViewEquals,
} from "../src/index";

const CATALOG: ProbeFamily[] = [
  {
    familyId: "parity-family",
    variants: [
      {
        id: "parity-probe",
        familyId: "parity-family",
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
        artifactEvidence: "synthetic one-view parity fixture",
      },
    ],
  },
];

const lab = buildLab(
  "synthetic-one-view-learner",
  CATALOG,
  { metPrereqs: [], engagedDomains: [] },
  {
    probeCountTarget: 1,
    probeCountRange: { min: 1, max: 1 },
    minDomains: 1,
    minWorkModes: 1,
    explorationFloor: 0,
  },
);
const summary = summarizeSignals(EVENTS_GOLDEN_V1);
const revision: HypothesisRevision = {
  hypothesisId: "synthetic-one-view-hypothesis",
  learnerRef: "synthetic-one-view-learner",
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
  nextProbe: "compare a familiar build with a new build",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide",
    decision: "retain competing explanations",
    rationale: "keep both accounts visible",
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
const gate = {
  ...evaluateCandidateGate(summary),
  familiesPresent: summary.familiesPresent,
};

const STRONG_CAPS = {
  webglAvailable: true,
  deviceMemoryGB: 16,
  hardwareConcurrency: 12,
  coarsePointer: false,
  saveData: false,
} as const satisfies DeviceCaps;

const options = (
  overrides: Partial<BuildInterestLabViewOptions> = {},
): BuildInterestLabViewOptions => ({
  surface: "child",
  ageBand: "9-11",
  reducedMotion: false,
  plainMode: false,
  deviceCaps: STRONG_CAPS,
  history: [],
  ...overrides,
});

const makeView = (viewOptions: BuildInterestLabViewOptions): InterestLabView =>
  buildInterestLabView({
    lab,
    coverage: lab.coverage,
    hypothesis,
    events: EVENTS_GOLDEN_V1,
    gate,
    options: viewOptions,
  });

const CASES: readonly {
  name: string;
  options: BuildInterestLabViewOptions;
  tier: RenderTier;
}[] = [
  { name: "child full 3D", options: options(), tier: "quest-world-3d" },
  {
    name: "guide full 3D",
    options: options({ surface: "guide" }),
    tier: "quest-world-3d",
  },
  {
    name: "3D lite",
    options: options({ deviceCaps: { ...STRONG_CAPS, deviceMemoryGB: 6 } }),
    tier: "quest-world-3d-lite",
  },
  {
    name: "2D fallback",
    options: options({ deviceCaps: { ...STRONG_CAPS, webglAvailable: false } }),
    tier: "board-2d",
  },
  { name: "plain", options: options({ plainMode: true }), tier: "board-2d" },
  { name: "reduced motion", options: options({ reducedMotion: true }), tier: "board-2d" },
  {
    name: "age 6-8",
    options: options({ ageBand: "6-8" }),
    tier: "quest-world-3d",
  },
  {
    name: "age 12-14",
    options: options({ ageBand: "12-14" }),
    tier: "quest-world-3d",
  },
];

const markerParity = (view: InterestLabView) =>
  Object.fromEntries(
    view.scene.islands.flatMap(({ markers }) =>
      markers.map(({ probeId, returnState, tone, provenance, whyCopy, workModeGlyph }) => [
        probeId,
        { returnState, tone, provenance, whyCopy, workModeGlyph },
      ]),
    ),
  );

const questParity = (view: InterestLabView) =>
  Object.fromEntries(
    view.probePicker.quests.map(
      ({ probeId, returnState, tone, provenance, whyCopy, workModeGlyph }) => [
        probeId,
        { returnState, tone, provenance, whyCopy, workModeGlyph },
      ],
    ),
  );

describe("one-view parity matrix", () => {
  it.each(CASES)("composes the $name surface from the complete view", ({ options, tier }) => {
    const view = makeView(options);

    expect(view.surface).toBe(options.surface);
    expect(view.flags).toMatchObject({
      surface: options.surface,
      ageBand: options.ageBand,
      reducedMotion: options.reducedMotion,
      plainMode: options.plainMode,
    });
    expect(view.presentation.renderTier).toBe(tier);
    expect(view.scene.renderTier).toBe(tier);
    expect(view.scene.islands).not.toHaveLength(0);
    expect(Object.keys(view.guide)).toEqual([
      "coverage",
      "explanations",
      "timeline",
      "lifecycle",
      "revisionHistory",
      "constellation",
    ]);
    expect(markerParity(view)).toEqual(questParity(view));
  });

  it("holds plainViewEquals across every surface, tier, mode, and age-band pair", () => {
    const views = CASES.map(({ name, options }) => ({ name, view: makeView(options) }));

    for (const left of views) {
      for (const right of views) {
        expect(
          plainViewEquals(left.view, right.view),
          `${left.name} should preserve domain state against ${right.name}`,
        ).toBe(true);
      }
    }

    expect(new Set(views.map(({ view }) => view.flags.ageBand))).toEqual(
      new Set<AgeBand>(["6-8", "9-11", "12-14"]),
    );
    expect(new Set(views.map(({ view }) => view.presentation.renderTier))).toEqual(
      new Set<RenderTier>(["quest-world-3d", "quest-world-3d-lite", "board-2d"]),
    );
  });

  it("rejects 2D card drift when the paired scene marker is unchanged", () => {
    const baseline = makeView(options());
    const copyDrift = makeView(options());
    const glyphDrift = makeView(options());
    copyDrift.probePicker.quests[0]!.whyCopy = "A different card-only reason.";
    glyphDrift.probePicker.quests[0]!.workModeGlyph = "different-card-only-glyph";

    expect(plainViewEquals(baseline, copyDrift)).toBe(false);
    expect(plainViewEquals(baseline, glyphDrift)).toBe(false);
  });
});
