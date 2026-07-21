import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";
import { canonicalize } from "../../evidence-graph/src/index.js";

import { GOLDEN_PROJECT_PROFILE, GOLDEN_SESSION } from "../src/__fixtures__/answer-fixtures.js";
import type { ContentHasher } from "../src/evidence-record.js";
import type {
  CoverageByFacet,
  Facet,
  ProjectProfile,
  QuestionPrompt,
  TranscriptTurn,
} from "../src/model.js";

interface SessionView {
  readonly profile: ProjectProfile;
  readonly seed: number;
  readonly transcript: readonly TranscriptTurn[];
  readonly currentQuestion: QuestionPrompt | null;
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly isComplete: boolean;
}

interface EvidenceRecordView {
  readonly studentId: string;
  readonly projectId: string;
  readonly transcript: readonly TranscriptTurn[];
  readonly coverageByFacet: CoverageByFacet;
  readonly gaps: readonly Facet[];
  readonly createdAt: string;
}

interface EvidenceEmissionView {
  readonly record: EvidenceRecordView;
  readonly canonicalJson: string;
  readonly contentHash: string;
}

type StartSession = (input: {
  readonly profile: ProjectProfile;
  readonly seed: number;
}) => SessionView;
type AnswerCurrentQuestion = (session: SessionView, answerText: string) => SessionView;
type EmitEvidenceRecord = (input: {
  readonly session: SessionView;
  readonly createdAt: string;
  readonly hasher: ContentHasher;
}) => EvidenceEmissionView;

class Sha256Hasher implements ContentHasher {
  hash(input: Uint8Array): string {
    return createHash("sha256").update(input).digest("hex");
  }
}

async function sessionApi() {
  const api = (await import("../src/public.js")) as Record<string, unknown>;

  expect(api.startSession).toBeTypeOf("function");
  expect(api.answerCurrentQuestion).toBeTypeOf("function");
  expect(api.emitEvidenceRecord).toBeTypeOf("function");

  if (
    typeof api.startSession !== "function" ||
    typeof api.answerCurrentQuestion !== "function" ||
    typeof api.emitEvidenceRecord !== "function"
  ) {
    throw new Error("P1 session API is not implemented");
  }

  return {
    startSession: api.startSession as StartSession,
    answerCurrentQuestion: api.answerCurrentQuestion as AnswerCurrentQuestion,
    emitEvidenceRecord: api.emitEvidenceRecord as EmitEvidenceRecord,
  };
}

async function runGoldenSession() {
  const api = await sessionApi();
  let session = api.startSession({
    profile: GOLDEN_PROJECT_PROFILE,
    seed: GOLDEN_SESSION.seed,
  });
  const questionIds: string[] = [];

  for (const answer of GOLDEN_SESSION.answers) {
    expect(session.currentQuestion).not.toBeNull();
    if (!session.currentQuestion) throw new Error("Golden session ended before all answers ran");
    questionIds.push(session.currentQuestion.id);
    session = api.answerCurrentQuestion(session, answer);
  }

  return { api, questionIds, session };
}

describe("P1 interview session runner", () => {
  it("records the fully worked seed-7 session and ends when every facet is covered", async () => {
    const { questionIds, session } = await runGoldenSession();

    expect(questionIds).toEqual(GOLDEN_SESSION.expectedQuestionIds);
    expect(session.transcript).toHaveLength(GOLDEN_SESSION.answers.length);
    expect(session.transcript.map((turn) => turn.questionId)).toEqual(
      GOLDEN_SESSION.expectedQuestionIds,
    );
    expect(session.coverageByFacet).toEqual(GOLDEN_SESSION.expectedCoverage);
    expect(session.gaps).toEqual(GOLDEN_SESSION.expectedGaps);
    expect(session.currentQuestion).toBeNull();
    expect(session.isComplete).toBe(true);
  });

  it("ends deterministically at MAX_TURNS and refuses an answer after completion", async () => {
    const { answerCurrentQuestion, startSession } = await sessionApi();
    let session = startSession({ profile: GOLDEN_PROJECT_PROFILE, seed: 7 });

    while (!session.isComplete) {
      session = answerCurrentQuestion(session, "I am not sure yet.");
    }

    expect(session.transcript).toHaveLength(12);
    expect(session.currentQuestion).toBeNull();
    expect(session.gaps).toEqual(["what", "why", "how", "challenge", "next", "audience"]);
    expect(() => answerCurrentQuestion(session, "One more answer")).toThrowError(
      "SESSION_COMPLETE",
    );
  });
});

describe("P1 evidence-record emission", () => {
  it("refuses to emit evidence for an unfinished session", async () => {
    const { emitEvidenceRecord, startSession } = await sessionApi();
    const session = startSession({ profile: GOLDEN_PROJECT_PROFILE, seed: GOLDEN_SESSION.seed });

    expect(() =>
      emitEvidenceRecord({
        session,
        createdAt: "2026-07-21T12:00:00.000Z",
        hasher: new Sha256Hasher(),
      }),
    ).toThrowError("SESSION_INCOMPLETE");
  });

  it("canonicalizes the fixed session and pins its SHA-256 content hash (SC-5)", async () => {
    const { api, session } = await runGoldenSession();
    const emission = api.emitEvidenceRecord({
      session,
      createdAt: "2026-07-21T12:00:00.000Z",
      hasher: new Sha256Hasher(),
    });

    expect(emission.record).toEqual({
      studentId: GOLDEN_PROJECT_PROFILE.studentId,
      projectId: GOLDEN_PROJECT_PROFILE.id,
      transcript: session.transcript,
      coverageByFacet: GOLDEN_SESSION.expectedCoverage,
      gaps: GOLDEN_SESSION.expectedGaps,
      createdAt: "2026-07-21T12:00:00.000Z",
    });
    expect(emission.canonicalJson).toBe(canonicalize(emission.record));
    expect(emission.contentHash).toBe(
      "5795259c6e2f1b94869fa935e89d3a577093a69c50e316eac05bdbe915ddace2",
    );
  });
});
