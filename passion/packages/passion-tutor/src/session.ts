import { assessAnswer } from "./assessment.js";
import {
  coverageFromTranscript,
  getGaps,
  isSessionComplete,
  selectNextQuestion,
} from "./engine.js";
import type {
  CoverageByFacet,
  Facet,
  ProjectProfile,
  QuestionPrompt,
  TranscriptTurn,
} from "./model.js";

export interface InterviewSession {
  readonly profile: ProjectProfile;
  readonly seed: number;
  readonly transcript: readonly TranscriptTurn[];
  readonly currentQuestion: QuestionPrompt | null;
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly isComplete: boolean;
}

export interface StartSessionInput {
  readonly profile: ProjectProfile;
  readonly seed: number;
}

function sessionFromTranscript(
  profile: ProjectProfile,
  seed: number,
  transcript: readonly TranscriptTurn[],
): InterviewSession {
  const coverageByFacet = coverageFromTranscript(transcript);
  const isComplete = isSessionComplete(transcript);

  return {
    profile,
    seed,
    transcript,
    currentQuestion: isComplete ? null : selectNextQuestion({ profile, seed, transcript }),
    coverageByFacet,
    gaps: getGaps(coverageByFacet),
    isComplete,
  };
}

export function startSession({ profile, seed }: StartSessionInput): InterviewSession {
  return sessionFromTranscript(profile, seed, []);
}

export function answerCurrentQuestion(
  session: InterviewSession,
  answerText: string,
): InterviewSession {
  const prompt = selectNextQuestion({
    profile: session.profile,
    seed: session.seed,
    transcript: session.transcript,
  });
  if (!prompt) throw new Error("SESSION_COMPLETE");

  const turn: TranscriptTurn = {
    facet: prompt.facet,
    questionId: prompt.id,
    isFollowUp: prompt.isFollowUp,
    answerText,
    score: assessAnswer(answerText, session.profile),
  };

  return sessionFromTranscript(session.profile, session.seed, [...session.transcript, turn]);
}
