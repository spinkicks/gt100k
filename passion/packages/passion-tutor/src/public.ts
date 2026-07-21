export { assessAnswer } from "./assessment.js";
export {
  type ContentHasher,
  type EmitEvidenceRecordInput,
  type EvidenceRecordEmission,
  emitEvidenceRecord,
  type PassionTutorEvidenceRecord,
} from "./evidence-record.js";
export {
  coverageFromTranscript,
  getGaps,
  isSessionComplete,
  selectNextQuestion,
} from "./engine.js";
export {
  COVERED,
  FACETS,
  MAX_TURNS,
  THIN,
  type CoverageByFacet,
  type Facet,
  type ProjectProfile,
  type QuestionPrompt,
  type QuestionSelectionInput,
  type TranscriptTurn,
} from "./model.js";
export { QUESTION_BANK } from "./question-bank.js";
export {
  answerCurrentQuestion,
  type InterviewSession,
  startSession,
  type StartSessionInput,
} from "./session.js";
