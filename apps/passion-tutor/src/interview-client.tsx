"use client";

import { type FormEventHandler, useState } from "react";

import {
  COVERED,
  FACETS,
  type Facet,
  type InterviewSession,
  answerCurrentQuestion,
} from "../../../packages/passion-tutor/src/public.js";

const FACET_LABELS: Record<Facet, string> = {
  what: "What it is",
  why: "Why it matters",
  how: "How it works",
  challenge: "A challenge",
  next: "What comes next",
  audience: "Who it is for",
};

const GAP_LABELS: Record<Facet, string> = {
  what: "what your project is",
  why: "why it matters to you",
  how: "how it works",
  challenge: "what feels hard",
  next: "your plans",
  audience: "who it is for",
};

export interface InterviewViewProps {
  readonly answer: string;
  readonly onAnswerChange: (value: string) => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly session: InterviewSession;
}

export interface InterviewClientProps {
  readonly initialSession: InterviewSession;
}

export function submitInterviewAnswer(
  session: InterviewSession,
  answerText: string,
): InterviewSession {
  return answerCurrentQuestion(session, answerText);
}

export function InterviewClient({ initialSession }: InterviewClientProps) {
  const [session, setSession] = useState(initialSession);
  const [answer, setAnswer] = useState("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    if (session.isComplete || answer.trim().length === 0) return;

    setSession((current) => submitInterviewAnswer(current, answer));
    setAnswer("");
  };

  return (
    <InterviewView
      answer={answer}
      onAnswerChange={setAnswer}
      onSubmit={handleSubmit}
      session={session}
    />
  );
}

function UnderstandingMap({ session }: { readonly session: InterviewSession }) {
  const exploredCount = FACETS.filter((facet) => session.coverageByFacet[facet] >= COVERED).length;

  return (
    <section className="understanding-map" aria-labelledby="understanding-map-title">
      <div className="understanding-heading">
        <h2 id="understanding-map-title">Your understanding map</h2>
        <p aria-atomic="true" aria-live="polite">
          {exploredCount} of {FACETS.length} explored
        </p>
      </div>

      <ol>
        {FACETS.map((facet) => {
          const isCovered = session.coverageByFacet[facet] >= COVERED;

          return (
            <li data-understanding-facet={facet} data-covered={isCovered} key={facet}>
              <div className="understanding-labels">
                <span>{FACET_LABELS[facet]}</span>
                <strong>{isCovered ? "Explored" : "Still exploring"}</strong>
              </div>
              <span className="understanding-track" aria-hidden="true">
                <span className="understanding-fill" />
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function CompletionSummary({ gaps }: { readonly gaps: readonly Facet[] }) {
  const isAllCovered = gaps.length === 0;

  return (
    <section
      className="reflection-summary"
      data-outcome={isAllCovered ? "all-covered" : "revisit"}
      aria-labelledby="reflection-summary-title"
    >
      <h2 id="reflection-summary-title">
        {isAllCovered
          ? "You found words for every part of your project."
          : "These are good places to begin next time."}
      </h2>

      {isAllCovered ? (
        <p>Your understanding map is full — keep building from here.</p>
      ) : (
        <ul>
          {gaps.map((facet) => (
            <li key={facet}>Let’s revisit {GAP_LABELS[facet]} next time.</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function InterviewView({ answer, onAnswerChange, onSubmit, session }: InterviewViewProps) {
  const question = session.currentQuestion;
  const interviewState = session.isComplete
    ? "complete"
    : session.transcript.length === 0
      ? "first-run"
      : "in-progress";

  return (
    <section
      className="question-stage"
      data-interview-state={interviewState}
      aria-labelledby={question ? "current-question" : "session-complete"}
    >
      <div className="question-copy">
        <div
          className="question-turn"
          data-animate={session.transcript.length > 0 ? "true" : "false"}
          key={question?.id ?? "complete"}
          aria-atomic="true"
          aria-live="polite"
        >
          <p className="question-cue">
            {question?.isFollowUp
              ? "Let’s look a little closer."
              : session.isComplete
                ? "Reflection complete."
                : session.transcript.length > 0
                  ? "Here’s the next one."
                  : "Let’s start here."}
          </p>

          {question ? (
            <>
              <h1 id="current-question" data-current-question="true">
                {question.text}
              </h1>
              <p className="take-time">Take your time. A few honest words are enough.</p>
            </>
          ) : (
            <>
              <h1 id="session-complete">You looked at your project from every side.</h1>
              <p className="take-time">Your answers are ready for the next step.</p>
            </>
          )}
        </div>

        {question ? (
          <form className="answer-form" onSubmit={onSubmit}>
            <label htmlFor="interview-answer">Your answer</label>
            <textarea
              id="interview-answer"
              name="answer"
              aria-describedby="answer-help"
              onChange={(event) => onAnswerChange(event.currentTarget.value)}
              required
              rows={4}
              value={answer}
            />
            <div className="answer-actions">
              <p id="answer-help">Write it in your own words.</p>
              <button className="answer-submit" disabled={answer.trim().length === 0} type="submit">
                Share my answer
              </button>
            </div>
          </form>
        ) : null}

        <UnderstandingMap session={session} />

        {session.isComplete ? <CompletionSummary gaps={session.gaps} /> : null}

        {session.transcript.length > 0 ? (
          <section className="response-trail" aria-labelledby="response-trail-title">
            <h2 id="response-trail-title">What you’ve shared</h2>
            <ol>
              {session.transcript.map((turn, index) => (
                <li key={`${turn.questionId}-${index}`}>
                  <span>{FACET_LABELS[turn.facet]}</span>
                  <p>{turn.answerText}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </section>
  );
}
