export { assessAnswer } from "./assessment.js";
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
