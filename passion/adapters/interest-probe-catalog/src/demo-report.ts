import {
  EVENTS_GOLDEN_V1,
  authorRevision,
  buildLab,
  proposeTransition,
  summarizeSignals,
} from "@gt100k/interest-lab-domain";
import type {
  CoverageMatrix,
  GuideReview,
  HypothesisRevision,
  SignalSummary,
} from "@gt100k/interest-lab-domain";
import { CATALOG_GOLDEN_V1 } from "./index";

const SYNTHETIC_LEARNER = "synthetic-learner-001";

const INITIAL_REVISION: HypothesisRevision = {
  hypothesisId: "synthetic-hypothesis-001",
  learnerRef: SYNTHETIC_LEARNER,
  version: 1,
  candidateDomains: ["making"],
  workModeProfile: { build: 1 },
  state: "EMERGING",
  evidenceRefs: [],
  signalSummary: summarizeSignals([]),
  competingExplanations: ["novelty", "resource access"],
  coverageGaps: [],
  uncertainty: { kind: "grade", grade: "moderate" },
  nextProbe: "p02",
  childPosition: "UNSURE",
  guideReview: {
    guide: "synthetic-guide-001",
    decision: "retain emerging hypothesis",
    rationale: "await the complete synthetic evidence stream",
    reviewedAtDayOffset: 0,
  },
  proposedBy: "GUIDE",
  operative: true,
  modelVersion: "rules-only-v1",
  policyVersion: "rules-engine-v1",
  validFromDayOffset: 0,
  recordedAtDayOffset: 0,
};

const GUIDE_REVIEW: GuideReview = {
  guide: "synthetic-guide-001",
  decision: "author candidate transition",
  rationale: "golden evidence passes the candidate gate",
  reviewedAtDayOffset: 31,
};

interface DemoTransitionView {
  state: HypothesisRevision["state"];
  version: number;
  proposedBy: HypothesisRevision["proposedBy"];
  operative: boolean;
  guideReview: GuideReview | null;
}

export interface InterestLabDemoReport {
  lab: {
    learnerRef: string;
    offerCount: number;
    selectedProbeIds: string[];
  };
  coverage: CoverageMatrix;
  signals: SignalSummary;
  transition: {
    proposed: DemoTransitionView;
    authored: DemoTransitionView;
  };
}

const transitionView = (revision: HypothesisRevision): DemoTransitionView => ({
  state: revision.state,
  version: revision.version,
  proposedBy: revision.proposedBy,
  operative: revision.operative,
  guideReview: revision.guideReview,
});

export const buildInterestLabDemoReport = (): InterestLabDemoReport => {
  const lab = buildLab(
    SYNTHETIC_LEARNER,
    CATALOG_GOLDEN_V1,
    { metPrereqs: [], engagedDomains: [] },
    { seed: 42 },
  );
  const signals = summarizeSignals(EVENTS_GOLDEN_V1);
  const proposed = proposeTransition(INITIAL_REVISION, signals, "SHADOW_MODEL", {
    modelVersion: "shadow-model-v1",
    policyVersion: "rules-engine-v1",
    validFromDayOffset: 30,
    recordedAtDayOffset: 30,
  });
  const authored = authorRevision(INITIAL_REVISION, proposed, GUIDE_REVIEW);

  return {
    lab: {
      learnerRef: lab.learnerRef,
      offerCount: lab.offers.length,
      selectedProbeIds: lab.offers.map(({ probeId }) => probeId),
    },
    coverage: lab.coverage,
    signals,
    transition: {
      proposed: transitionView(proposed),
      authored: transitionView(authored),
    },
  };
};

export const renderInterestLabDemoReport = (report: InterestLabDemoReport): string =>
  JSON.stringify(report, null, 2);
