import { readFileSync } from "node:fs";

import { type ComponentType, type FormEventHandler, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  GOLDEN_PROJECT_PROFILE,
  GOLDEN_SESSION,
} from "../../../packages/passion-tutor/src/__fixtures__/answer-fixtures.js";
import {
  type InterviewSession,
  answerCurrentQuestion,
  startSession,
} from "../../../packages/passion-tutor/src/public.js";
import { loadSeededInterview } from "../src/load-seeded-interview.js";

function occurrences(value: string, token: string): number {
  return value.split(token).length - 1;
}

const noOp = () => undefined;

interface InterviewViewProps {
  readonly answer: string;
  readonly onAnswerChange: (value: string) => void;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly session: InterviewSession;
}

type SubmitInterviewAnswer = (session: InterviewSession, answerText: string) => InterviewSession;

async function interviewApi() {
  const api = (await import("../src/interview-client.js").catch(() => ({}))) as Record<
    string,
    unknown
  >;

  expect(api.InterviewView).toBeTypeOf("function");
  expect(api.submitInterviewAnswer).toBeTypeOf("function");

  if (typeof api.InterviewView !== "function" || typeof api.submitInterviewAnswer !== "function") {
    throw new Error("P4 interview client API is not implemented");
  }

  return {
    InterviewView: api.InterviewView as ComponentType<InterviewViewProps>,
    submitInterviewAnswer: api.submitInterviewAnswer as SubmitInterviewAnswer,
  };
}

function renderInterview(
  InterviewView: ComponentType<InterviewViewProps>,
  session: InterviewSession,
) {
  return renderToStaticMarkup(
    createElement(InterviewView, {
      answer: "",
      onAnswerChange: noOp,
      onSubmit: noOp,
      session,
    }),
  );
}

function answerUntilComplete(session: InterviewSession, answers: readonly string[]) {
  let current = session;
  for (const answer of answers) current = answerCurrentQuestion(current, answer);
  return current;
}

describe("P4 one-question interview acceptance", () => {
  it("renders one current question with a labeled answer control", async () => {
    const { InterviewView } = await interviewApi();
    const { session } = await loadSeededInterview();
    const markup = renderToStaticMarkup(
      createElement(InterviewView, {
        answer: "",
        onAnswerChange: noOp,
        onSubmit: noOp,
        session,
      }),
    );

    expect(occurrences(markup, 'data-current-question="true"')).toBe(1);
    expect(markup).toContain("How would you describe your project to someone new?");
    expect(markup).toMatch(/<label[^>]*for="interview-answer"[^>]*>Your answer<\/label>/);
    expect(markup).toMatch(
      /<textarea[^>]*id="interview-answer"[^>]*name="answer"[^>]*aria-describedby="answer-help"/,
    );
    expect(markup).toContain("Share my answer");
  });

  it("submits a thin answer, records it, and replaces the prompt with the exact follow-up", async () => {
    const { InterviewView, submitInterviewAnswer } = await interviewApi();
    const { session } = await loadSeededInterview();
    const answer = "It warms snacks.";
    const nextSession = submitInterviewAnswer(session, answer);

    expect(nextSession.transcript).toHaveLength(1);
    expect(nextSession.transcript[0]).toMatchObject({
      answerText: answer,
      questionId: "what-2",
      isFollowUp: false,
    });
    expect(nextSession.currentQuestion).toEqual({
      facet: "what",
      id: "what-follow-up",
      isFollowUp: true,
      text: "What is one detail that makes it your project?",
    });

    const markup = renderToStaticMarkup(
      createElement(InterviewView, {
        answer: "",
        onAnswerChange: noOp,
        onSubmit: noOp,
        session: nextSession,
      }),
    );

    expect(occurrences(markup, 'data-current-question="true"')).toBe(1);
    expect(markup).not.toContain("How would you describe your project to someone new?");
    expect(markup).toContain("What is one detail that makes it your project?");
    expect(markup).toContain(answer);
  });

  it("advances to the next least-covered facet after a substantial answer", async () => {
    const { submitInterviewAnswer } = await interviewApi();
    const { session } = await loadSeededInterview();
    const nextSession = submitInterviewAnswer(
      session,
      "My renewable energy oven uses 3 foil panels first, then it warms food because a black tray absorbs sunlight.",
    );

    expect(nextSession.currentQuestion).toMatchObject({
      facet: "why",
      id: "why-3",
      isFollowUp: false,
    });
  });

  it("keeps reduced motion as a visual-only alternative", async () => {
    const { submitInterviewAnswer } = await interviewApi();
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const { session } = await loadSeededInterview();
    const nextSession = submitInterviewAnswer(session, "It warms snacks.");

    expect(nextSession.transcript).toHaveLength(1);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.question-turn\[data-animate="true"\]\s*\{[^}]*transform:\s*none/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.question-turn\[data-animate="true"\]\s*\{[^}]*transition-property:\s*opacity/s,
    );
    expect(css).toMatch(
      /\.question-turn\[data-animate="true"\]\s*\{[^}]*--question-start-y:\s*0\.375rem/s,
    );
    expect(css).toMatch(
      /@starting-style\s*\{\s*\.question-turn\[data-animate="true"\]\s*\{[^}]*transform:\s*translateY\(var\(--question-start-y\)\)/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.question-turn\[data-animate="true"\]\s*\{[^}]*--question-start-y:\s*0rem/s,
    );
  });
});

describe("P5 understanding map and kind summary acceptance", () => {
  it("renders all six facets in canonical order with state derived from coverage", async () => {
    const { InterviewView, submitInterviewAnswer } = await interviewApi();
    const { session } = await loadSeededInterview();
    const initialMarkup = renderInterview(InterviewView, session);

    expect(occurrences(initialMarkup, "data-understanding-facet=")).toBe(6);
    expect(occurrences(initialMarkup, 'data-covered="false"')).toBe(6);

    const labels = [
      "What it is",
      "Why it matters",
      "How it works",
      "A challenge",
      "What comes next",
      "Who it is for",
    ];
    const labelPositions = labels.map((label) => initialMarkup.indexOf(label));
    expect(labelPositions.every((position) => position >= 0)).toBe(true);
    expect(labelPositions).toEqual([...labelPositions].sort((left, right) => left - right));

    const nextSession = submitInterviewAnswer(
      session,
      "My renewable energy oven uses 3 foil panels first, then it warms food because a black tray absorbs sunlight.",
    );
    const nextMarkup = renderInterview(InterviewView, nextSession);

    expect(nextMarkup).toMatch(
      /data-understanding-facet="what"[^>]*data-covered="true"[\s\S]*?Explored/,
    );
    expect(nextMarkup).toMatch(
      /data-understanding-facet="why"[^>]*data-covered="false"[\s\S]*?Still exploring/,
    );
    expect(occurrences(nextMarkup, 'data-current-question="true"')).toBe(1);
  });

  it("names MAX_TURNS gaps kindly in canonical order", async () => {
    const { InterviewView } = await interviewApi();
    const { session } = await loadSeededInterview();
    let completed = session;

    while (!completed.isComplete) {
      completed = answerCurrentQuestion(completed, "I am not sure yet.");
    }

    const markup = renderInterview(InterviewView, completed);
    const revisitCopy = [
      "Let’s revisit what your project is next time.",
      "Let’s revisit why it matters to you next time.",
      "Let’s revisit how it works next time.",
      "Let’s revisit what feels hard next time.",
      "Let’s revisit your plans next time.",
      "Let’s revisit who it is for next time.",
    ];
    const copyPositions = revisitCopy.map((copy) => markup.indexOf(copy));

    expect(completed.gaps).toEqual(["what", "why", "how", "challenge", "next", "audience"]);
    expect(copyPositions.every((position) => position >= 0)).toBe(true);
    expect(copyPositions).toEqual([...copyPositions].sort((left, right) => left - right));
    expect(markup).toContain("These are good places to begin next time.");
    expect(markup).not.toContain('data-current-question="true"');
  });

  it("celebrates an all-covered session without inventing gaps", async () => {
    const { InterviewView } = await interviewApi();
    const completed = answerUntilComplete(
      startSession({ profile: GOLDEN_PROJECT_PROFILE, seed: GOLDEN_SESSION.seed }),
      GOLDEN_SESSION.answers,
    );
    const markup = renderInterview(InterviewView, completed);

    expect(completed.isComplete).toBe(true);
    expect(completed.gaps).toEqual([]);
    expect(occurrences(markup, 'data-covered="true"')).toBe(6);
    expect(markup).toContain("You found words for every part of your project.");
    expect(markup).toContain("Your understanding map is full — keep building from here.");
    expect(markup).not.toContain("Let’s revisit");
  });

  it("keeps map state legible without motion", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

    expect(css).toMatch(
      /\.understanding-fill\s*\{[^}]*transform-origin:\s*left[^}]*transition:\s*opacity 180ms var\(--ease-out\), transform 180ms var\(--ease-out\)/s,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.understanding-fill\s*\{[^}]*transition-duration:\s*120ms[^}]*transition-property:\s*opacity/s,
    );
  });
});
