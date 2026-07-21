import { describe, expect, it } from "vitest";

import { GOLDEN_PROJECT_PROFILE, GOLDEN_SESSION } from "../src/__fixtures__/answer-fixtures.js";
import * as passionTutor from "../src/public.js";

const {
  COVERED,
  FACETS,
  MAX_TURNS,
  assessAnswer,
  coverageFromTranscript,
  getGaps,
  isSessionComplete,
  selectNextQuestion,
} = passionTutor;
const QUESTION_BANK = Reflect.get(passionTutor, "QUESTION_BANK") as
  | Record<(typeof FACETS)[number], { base: readonly unknown[]; followUp: readonly unknown[] }>
  | undefined;

function turn(facet: (typeof FACETS)[number], score: number, isFollowUp = false) {
  return {
    facet,
    questionId: `${facet}-test`,
    isFollowUp,
    answerText: "Synthetic answer",
    score,
  };
}

describe("question bank", () => {
  it("is part of the public domain contract", () => {
    expect(QUESTION_BANK).toBeDefined();
  });

  it.each(FACETS)(
    "provides at least three base questions and a thin-answer follow-up for %s",
    (facet) => {
      expect(QUESTION_BANK?.[facet].base.length).toBeGreaterThanOrEqual(3);
      expect(QUESTION_BANK?.[facet].followUp.length).toBeGreaterThanOrEqual(1);
    },
  );
});

describe("adaptive question engine", () => {
  it("uses fixed facet order to break an empty-coverage tie (SC-1)", () => {
    const prompt = selectNextQuestion({ profile: GOLDEN_PROJECT_PROFILE, seed: 7, transcript: [] });

    expect(prompt?.facet).toBe("what");
    expect(prompt?.isFollowUp).toBe(false);
  });

  it("picks the least-covered facet and is deterministic for the same inputs (SC-1)", () => {
    const transcript = [
      turn("what", 0.8),
      turn("why", 0.7),
      turn("how", 0.2),
      turn("challenge", 0.4),
      turn("next", 0.4),
      turn("audience", 0.5),
    ];
    const input = { profile: GOLDEN_PROJECT_PROFILE, seed: 11, transcript };

    expect(selectNextQuestion(input)).toEqual(selectNextQuestion(input));
    expect(selectNextQuestion(input)?.facet).toBe("how");
  });

  it("asks exactly one same-facet follow-up after a thin answer (SC-2)", () => {
    const baseTurn = turn("what", 0);
    const followUp = selectNextQuestion({
      profile: GOLDEN_PROJECT_PROFILE,
      seed: 3,
      transcript: [baseTurn],
    });

    expect(followUp).toMatchObject({ facet: "what", isFollowUp: true });

    const afterFollowUp = selectNextQuestion({
      profile: GOLDEN_PROJECT_PROFILE,
      seed: 3,
      transcript: [baseTurn, turn("what", 0, true)],
    });
    expect(afterFollowUp).toMatchObject({ facet: "why", isFollowUp: false });
  });

  it("follows up after a nonzero thin answer before visiting an untouched facet (SC-2)", () => {
    const transcript = [turn("what", 0.8), turn("why", 0.2)];

    expect(
      selectNextQuestion({ profile: GOLDEN_PROJECT_PROFILE, seed: 3, transcript }),
    ).toMatchObject({ facet: "why", isFollowUp: true });
  });
});

describe("coverage and completion", () => {
  it("keeps the strongest articulation per facet and reports ordered gaps (SC-4)", () => {
    const coverage = coverageFromTranscript([
      turn("what", 0.2),
      turn("what", 0.7, true),
      turn("why", 0.61),
      turn("how", 0.59),
    ]);

    expect(coverage).toEqual({
      what: 0.7,
      why: 0.61,
      how: 0.59,
      challenge: 0,
      next: 0,
      audience: 0,
    });
    expect(getGaps(coverage)).toEqual(["how", "challenge", "next", "audience"]);
  });

  it("normalizes a non-finite score to zero coverage", () => {
    const coverage = coverageFromTranscript([turn("what", Number.NaN)]);

    expect(coverage.what).toBe(0);
    expect(getGaps(coverage)).toContain("what");
  });

  it("treats a non-finite last answer as thin", () => {
    const prompt = selectNextQuestion({
      profile: GOLDEN_PROJECT_PROFILE,
      seed: 3,
      transcript: [turn("what", Number.NaN)],
    });

    expect(prompt).toMatchObject({ facet: "what", isFollowUp: true });
  });

  it("treats non-finite direct coverage as a gap", () => {
    const coverage = coverageFromTranscript([]);
    coverage.what = Number.NaN;

    expect(getGaps(coverage)).toContain("what");
  });

  it("ends when every facet is covered (SC-4)", () => {
    const transcript = FACETS.map((facet) => turn(facet, COVERED));

    expect(isSessionComplete(transcript)).toBe(true);
    expect(selectNextQuestion({ profile: GOLDEN_PROJECT_PROFILE, seed: 0, transcript })).toBeNull();
  });

  it("ends at MAX_TURNS even while gaps remain (SC-4)", () => {
    const beforeLimit = Array.from({ length: MAX_TURNS - 1 }, () => turn("what", 0));
    const atLimit = [...beforeLimit, turn("what", 0)];

    expect(isSessionComplete(beforeLimit)).toBe(false);
    expect(isSessionComplete(atLimit)).toBe(true);
    expect(
      selectNextQuestion({ profile: GOLDEN_PROJECT_PROFILE, seed: 0, transcript: atLimit }),
    ).toBeNull();
  });

  it("matches the fully worked seeded P0 session golden", () => {
    const transcript: ReturnType<typeof turn>[] = [];
    const questionIds: string[] = [];

    for (const answer of GOLDEN_SESSION.answers) {
      const prompt = selectNextQuestion({
        profile: GOLDEN_PROJECT_PROFILE,
        seed: GOLDEN_SESSION.seed,
        transcript,
      });
      expect(prompt).not.toBeNull();
      if (!prompt) throw new Error("Golden session ended before its scripted answers were used");

      questionIds.push(prompt.id);
      transcript.push({
        facet: prompt.facet,
        questionId: prompt.id,
        isFollowUp: prompt.isFollowUp,
        answerText: answer,
        score: assessAnswer(answer, GOLDEN_PROJECT_PROFILE),
      });
    }

    const coverage = coverageFromTranscript(transcript);
    expect(questionIds).toEqual(GOLDEN_SESSION.expectedQuestionIds);
    expect(coverage).toEqual(GOLDEN_SESSION.expectedCoverage);
    expect(getGaps(coverage)).toEqual(GOLDEN_SESSION.expectedGaps);
    expect(isSessionComplete(transcript)).toBe(true);
  });
});
