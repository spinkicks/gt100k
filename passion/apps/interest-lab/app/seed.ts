import {
  EVENTS_GOLDEN_V1,
  appendRevision,
  authorRevision,
  buildLab,
  createHypothesis,
  evaluateCandidateGate,
  summarizeSignals,
} from "@gt100k/interest-lab-domain";
import type { HypothesisRevision } from "@gt100k/interest-lab-domain";
import {
  type BuildInterestLabViewOptions,
  type DeviceCaps,
  buildInterestLabView,
} from "@gt100k/interest-lab-view";
import { CATALOG_GOLDEN_V1 } from "@gt100k/interest-probe-catalog";
import type { GuideAuthoringInput } from "./guide/authoring";

const SYNTHETIC_LEARNER_REF = "synthetic-interest-lab-preview";

export const SYNTHETIC_RETURN_HISTORY = [
  { probeId: "p01", returnKind: "voluntary", horizon: 7 },
  { probeId: "p02", returnKind: "prompted", interventionContext: "reminder" },
] as const satisfies NonNullable<BuildInterestLabViewOptions["history"]>;

export interface SyntheticInterestLabSeedOptions {
  surface?: BuildInterestLabViewOptions["surface"];
  ageBand?: BuildInterestLabViewOptions["ageBand"];
  reducedMotion?: boolean;
  plainMode?: boolean;
  deviceCaps?: DeviceCaps;
  history?: BuildInterestLabViewOptions["history"];
  authoredReview?: GuideAuthoringInput;
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
  const proposal = {
    ...revision,
    state: "CANDIDATE_SPINE",
    guideReview: null,
    proposedBy: "RULE",
    operative: false,
    validFromDayOffset: 31,
    recordedAtDayOffset: 31,
  } satisfies HypothesisRevision;
  let hypothesis = appendRevision(createHypothesis(revision), proposal);
  let activeProposal: HypothesisRevision | undefined = proposal;

  if (options.authoredReview) {
    const authored = authorRevision(
      revision,
      { ...proposal, recordedAtDayOffset: 32 },
      {
        guide: "synthetic-guide-preview",
        decision: options.authoredReview.decision.trim(),
        rationale: options.authoredReview.rationale.trim(),
        reviewedAtDayOffset: 32,
      },
    );
    hypothesis = appendRevision(hypothesis, authored);
    activeProposal = undefined;
  }
  const view = buildInterestLabView({
    lab,
    coverage: lab.coverage,
    hypothesis,
    events: EVENTS_GOLDEN_V1,
    gate: {
      ...evaluateCandidateGate(summary),
      familiesPresent: summary.familiesPresent,
    },
    ...(activeProposal ? { proposal: activeProposal } : {}),
    options: {
      surface: options.surface ?? "child",
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
