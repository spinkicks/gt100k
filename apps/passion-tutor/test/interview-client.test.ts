import { readFileSync } from "node:fs";

import { type ComponentType, type FormEventHandler, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { InterviewSession } from "../../../packages/passion-tutor/src/public.js";
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
