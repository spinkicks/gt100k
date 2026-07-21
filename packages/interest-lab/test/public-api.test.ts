import { describe, expect, expectTypeOf, it } from "vitest";
import {
  AUDIENCE_CONDITIONS,
  CHILD_POSITIONS,
  DEFAULT_LAB_CONFIG,
  DIFFICULTY_BANDS,
  EVENT_TYPES,
  FORBIDDEN_PURPOSES,
  HYPOTHESIS_STATES,
  PROVENANCES,
  SAFETY_CLASSES,
  SIGNAL_FAMILIES,
  SOCIAL_MODES,
  WORK_MODES,
  buildCoverageMatrix,
  buildLab,
  isProbeEligible,
  rotateBySeed,
  selectEligibleFamilyVariants,
} from "../src/index";
import type {
  ArtifactSignalSource,
  AssentRecordPort,
  AudienceCondition,
  ChildPosition,
  Clock,
  CoverageConfig,
  CoverageItem,
  CoverageMatrix,
  DifficultyBand,
  Domain,
  EngagementEvent,
  EventType,
  ForbiddenPurpose,
  GuideReview,
  HypothesisRevision,
  HypothesisState,
  InterestHypothesis,
  InterestHypothesisRepository,
  InterventionContext,
  InterventionSource,
  Lab,
  LabConfig,
  LearnerEligibility,
  Offer,
  OfferDecisionLog,
  OfferDecisionLogEntry,
  OfferSelector,
  Probe,
  ProbeCatalog,
  ProbeFamily,
  Provenance,
  SafetyClass,
  SignalFamily,
  SignalSummary,
  SocialMode,
  Uncertainty,
  WorkMode,
} from "../src/index";

type FoundationalTypeExports = [
  ArtifactSignalSource<unknown>,
  AssentRecordPort,
  AudienceCondition,
  ChildPosition,
  Clock,
  CoverageMatrix,
  DifficultyBand,
  Domain,
  EngagementEvent,
  EventType,
  ForbiddenPurpose,
  GuideReview,
  HypothesisRevision,
  HypothesisState,
  InterestHypothesis,
  InterestHypothesisRepository<unknown, unknown>,
  InterventionContext,
  InterventionSource,
  OfferDecisionLog,
  OfferDecisionLogEntry,
  OfferSelector<unknown>,
  Probe,
  ProbeCatalog,
  ProbeFamily,
  Provenance,
  SafetyClass,
  SignalFamily,
  SignalSummary,
  SocialMode,
  Uncertainty,
  WorkMode,
];

type OfferTypeExports = [CoverageConfig, CoverageItem, Lab, LabConfig, LearnerEligibility, Offer];

describe("interest lab public API", () => {
  it("exports every foundational runtime vocabulary", () => {
    const vocabularies = [
      AUDIENCE_CONDITIONS,
      CHILD_POSITIONS,
      DIFFICULTY_BANDS,
      EVENT_TYPES,
      FORBIDDEN_PURPOSES,
      HYPOTHESIS_STATES,
      PROVENANCES,
      SAFETY_CLASSES,
      SIGNAL_FAMILIES,
      SOCIAL_MODES,
      WORK_MODES,
    ];

    expect(vocabularies).toHaveLength(11);
    expect(vocabularies.every((vocabulary) => vocabulary.length > 0)).toBe(true);
  });

  it("exports every foundational type", () => {
    expectTypeOf<FoundationalTypeExports>().toEqualTypeOf<FoundationalTypeExports>();
  });

  it("exports the complete P3 offer, coverage, and catalog API", () => {
    const functions = [
      buildCoverageMatrix,
      buildLab,
      isProbeEligible,
      rotateBySeed,
      selectEligibleFamilyVariants,
    ];

    expect(functions.every((exported) => typeof exported === "function")).toBe(true);
    expect(DEFAULT_LAB_CONFIG).toMatchObject({
      probeCountTarget: 20,
      probeCountRange: { min: 18, max: 24 },
      explorationFloor: 4,
    });
    expectTypeOf<OfferTypeExports>().toEqualTypeOf<OfferTypeExports>();
  });
});
