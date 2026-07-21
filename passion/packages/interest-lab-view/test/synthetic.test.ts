import {
  EVENTS_GOLDEN_V1,
  buildLab,
  createHypothesis,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab";
import type { HypothesisRevision } from "@gt100k/interest-lab";
import { CATALOG_GOLDEN_V1 } from "@gt100k/interest-probe-catalog";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  type BuildInterestLabViewInputs,
  type BuildInterestLabViewOptions,
  buildInterestLabView,
} from "../src/index";

type GovernanceInputKey = Extract<
  keyof BuildInterestLabViewInputs | keyof BuildInterestLabViewOptions,
  "assent" | "consent" | "admissions" | "discipline" | "legal"
>;

const catalogSnapshot = JSON.stringify(CATALOG_GOLDEN_V1);
const eventsSnapshot = JSON.stringify(EVENTS_GOLDEN_V1);
const lab = buildLab(
  "synthetic-view-learner",
  CATALOG_GOLDEN_V1,
  { metPrereqs: [], engagedDomains: [] },
  { seed: 42 },
);
const summary = summarizeSignals(EVENTS_GOLDEN_V1);
const revision = {
  hypothesisId: "synthetic-view-hypothesis",
  learnerRef: "synthetic-view-learner",
  version: 1,
  candidateDomains: ["making", "living_systems"],
  workModeProfile: { build: 1, investigate: 1 },
  state: "EMERGING",
  evidenceRefs: EVENTS_GOLDEN_V1.map(({ id }) => id),
  signalSummary: summary,
  competingExplanations: [
    "Repeated making may persist across settings.",
    "Novelty or tool access may explain part of the pattern.",
  ],
  coverageGaps: [...lab.coverage.gaps],
  uncertainty: { kind: "grade", grade: "moderate" },
  nextProbe: "compare a familiar tool with a new tool",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide",
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
} satisfies HypothesisRevision;
const hypothesis = createHypothesis(revision);
const gate = {
  ...evaluateCandidateGate(summary),
  familiesPresent: summary.familiesPresent,
};

const inputsFor = (
  surface: BuildInterestLabViewOptions["surface"],
): BuildInterestLabViewInputs => ({
  lab,
  coverage: lab.coverage,
  hypothesis,
  events: EVENTS_GOLDEN_V1,
  gate,
  options: {
    surface,
    ageBand: "9-11",
    reducedMotion: false,
    plainMode: false,
    deviceCaps: { webglAvailable: false },
    history: [],
  },
});

describe("synthetic-only Interest Lab view", () => {
  it("accepts no governance machinery as view input", () => {
    expectTypeOf<GovernanceInputKey>().toEqualTypeOf<never>();

    expect(Object.keys(inputsFor("child")).sort()).toEqual([
      "coverage",
      "events",
      "gate",
      "hypothesis",
      "lab",
      "options",
    ]);
    expect(Object.keys(inputsFor("child").options).sort()).toEqual([
      "ageBand",
      "deviceCaps",
      "history",
      "plainMode",
      "reducedMotion",
      "surface",
    ]);
  });

  it.each(["child", "guide"] as const)(
    "builds the complete %s view from the canonical Part-I fixtures",
    (surface) => {
      const view = buildInterestLabView(inputsFor(surface));

      expect(view.surface).toBe(surface);
      expect(view.probePicker.quests).toHaveLength(20);
      expect(view.scene.islands.flatMap(({ markers }) => markers)).toHaveLength(20);
      expect(view.guide.timeline.markers).toHaveLength(EVENTS_GOLDEN_V1.length);
      expect(view.guide.constellation.stars).toHaveLength(6);
      expect(Object.keys(view.guide)).toEqual([
        "coverage",
        "explanations",
        "timeline",
        "lifecycle",
        "revisionHistory",
        "constellation",
      ]);
    },
  );

  it("consumes the shared synthetic fixtures without mutating them", () => {
    buildInterestLabView(inputsFor("child"));
    buildInterestLabView(inputsFor("guide"));

    expect(JSON.stringify(CATALOG_GOLDEN_V1)).toBe(catalogSnapshot);
    expect(JSON.stringify(EVENTS_GOLDEN_V1)).toBe(eventsSnapshot);
  });
});
