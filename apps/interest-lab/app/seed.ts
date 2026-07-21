import {
  EVENTS_GOLDEN_V1,
  buildLab,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab";
import type { HypothesisRevision } from "@gt100k/interest-lab";
import {
  type BuildInterestLabViewOptions,
  type DeviceCaps,
  buildInterestLabView,
} from "@gt100k/interest-lab-view";
import { CATALOG_GOLDEN_V1 } from "@gt100k/interest-probe-catalog";

const SYNTHETIC_LEARNER_REF = "synthetic-interest-lab-preview";

export const SYNTHETIC_RETURN_HISTORY = [
  { probeId: "p01", returnKind: "voluntary", horizon: 7 },
  { probeId: "p02", returnKind: "prompted", interventionContext: "reminder" },
] as const satisfies NonNullable<BuildInterestLabViewOptions["history"]>;

export interface SyntheticInterestLabSeedOptions {
  ageBand?: BuildInterestLabViewOptions["ageBand"];
  reducedMotion?: boolean;
  plainMode?: boolean;
  deviceCaps?: DeviceCaps;
  history?: BuildInterestLabViewOptions["history"];
}

export function buildSyntheticInterestLabSeed(
  options: Readonly<SyntheticInterestLabSeedOptions> = {},
) {
  const lab = buildLab(
    SYNTHETIC_LEARNER_REF,
    CATALOG_GOLDEN_V1,
    { metPrereqs: [], engagedDomains: [] },
    { seed: 42 },
  );
  const summary = summarizeSignals(EVENTS_GOLDEN_V1);
  const revision = {
    hypothesisId: "synthetic-interest-lab-hypothesis",
    learnerRef: SYNTHETIC_LEARNER_REF,
    version: 1,
    candidateDomains: ["making", "living_systems"],
    workModeProfile: { build: 1, investigate: 1 },
    state: "EMERGING",
    evidenceRefs: EVENTS_GOLDEN_V1.map(({ id }) => id),
    signalSummary: summary,
    competingExplanations: [
      "Current evidence suggests repeated making may persist.",
      "Novelty or tool access may explain part of the pattern.",
    ],
    coverageGaps: [...lab.coverage.gaps],
    uncertainty: { kind: "grade", grade: "moderate" },
    nextProbe: "compare a familiar tool with a new tool",
    childPosition: "UNSURE",
    guideReview: {
      guide: "synthetic-guide-preview",
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
  const view = buildInterestLabView({
    lab,
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
    options: {
      surface: "child",
      ageBand: options.ageBand ?? "9-11",
      reducedMotion: options.reducedMotion ?? false,
      plainMode: options.plainMode ?? false,
      deviceCaps: options.deviceCaps ?? { webglAvailable: false },
      history: options.history ?? [],
    },
  });

  return {
    kind: "synthetic" as const,
    lab,
    view,
  };
}
