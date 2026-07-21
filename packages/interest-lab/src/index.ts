export { isProbeEligible, rotateBySeed, selectEligibleFamilyVariants } from "./catalog";
export { buildCoverageMatrix } from "./coverage";
export type { CoverageConfig, CoverageItem } from "./coverage";
export { EVENT_TYPES, SIGNAL_FAMILIES, recordEvent } from "./events";
export type {
  EngagementEvent,
  EventType,
  InterventionContext,
  InterventionSource,
  SignalFamily,
  SignalSummary,
} from "./events";
export { summarizeSignals } from "./signals";
export {
  CHILD_POSITIONS,
  FORBIDDEN_PURPOSES,
  HYPOTHESIS_STATES,
  appendRevision,
  createHypothesis,
  currentFor,
} from "./hypothesis";
export type {
  ChildPosition,
  CoverageMatrix,
  ForbiddenPurpose,
  GuideReview,
  HypothesisRevision,
  HypothesisState,
  HypothesisViewTime,
  InterestHypothesis,
  Uncertainty,
} from "./hypothesis";
export { DEFAULT_LAB_CONFIG, buildLab } from "./offer";
export type { Lab, LabConfig, LearnerEligibility, Offer } from "./offer";
export type {
  ArtifactSignalSource,
  AssentRecordPort,
  Clock,
  InterestHypothesisRepository,
  OfferDecisionLog,
  OfferDecisionLogEntry,
  OfferSelector,
  ProbeCatalog,
} from "./ports";
export {
  LEGAL_TRANSITIONS,
  applyMissingData,
  authorRevision,
  evaluateCandidateGate,
  proposeTransition,
} from "./state-machine";
export type {
  CandidateGateEvaluation,
  ShadowProvenance,
  TransitionVersions,
} from "./state-machine";
export {
  AUDIENCE_CONDITIONS,
  DIFFICULTY_BANDS,
  PROVENANCES,
  SAFETY_CLASSES,
  SOCIAL_MODES,
  WORK_MODES,
} from "./probe";
export type {
  AudienceCondition,
  DifficultyBand,
  Domain,
  Probe,
  ProbeFamily,
  Provenance,
  SafetyClass,
  SocialMode,
  WorkMode,
} from "./probe";
