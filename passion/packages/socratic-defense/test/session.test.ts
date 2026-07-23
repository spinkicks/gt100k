import { describe, it, expect } from "vitest";
import { runSession } from "../src/session.js";
import type { Interviewer, AnswerJudge } from "../src/ports.js";
import type { Judgment } from "../src/model.js";
import { PROFILE, READINESS, QUESTIONS, ANSWERS, JUDGMENTS } from "../src/__fixtures__/scripted-session.js";

// Inline scripted tutor — the domain's own tests must NOT import @gt100k/tutor-stub, or tsc -b sees a
// cyclic project reference (adapter → domain → adapter).
class InlineTutor implements Interviewer, AnswerJudge {
  private i = 0;
  async nextQuestion(): Promise<string> {
    return QUESTIONS[this.i] ?? "Tell me more.";
  }
  async judge(): Promise<Judgment> {
    const j = JUDGMENTS[this.i];
    this.i += 1;
    return j ?? { facet: "what", coverage: 0, rationale: "", thin: true };
  }
}

// A judge that always reports the same facet as thin — exercises the follow-up cap per readiness.
class AlwaysThinTutor implements Interviewer, AnswerJudge {
  private i = 0;
  async nextQuestion({ targetFacet }: Parameters<Interviewer["nextQuestion"]>[0]): Promise<string> {
    return `q${this.i++}-${targetFacet}`;
  }
  async judge({ facet }: Parameters<AnswerJudge["judge"]>[0]): Promise<Judgment> {
    return { facet, coverage: 0.2, rationale: "thin", thin: true };
  }
}

describe("runSession (golden)", () => {
  it("produces the exact transcript, coverage, and gaps", async () => {
    const tutor = new InlineTutor();
    const s = await runSession({
      profile: PROFILE,
      readinessLevel: READINESS,
      ports: { interviewer: tutor, judge: tutor },
      answerSource: async ({ index }) => ANSWERS[index] ?? "",
    });

    expect(s.turns.map((t) => t.facet)).toEqual(["what", "why", "why", "how", "challenge", "next", "audience"]);
    expect(s.turns.map((t) => t.isFollowUp)).toEqual([false, false, true, false, false, false, false]);
    expect(s.turns.map((t) => t.coverage)).toEqual([0.7, 0.3, 0.7, 0.7, 0.7, 0.7, 0.7]);
    expect(s.coverageByFacet).toEqual({ what: 0.7, why: 0.7, how: 0.7, challenge: 0.7, next: 0.7, audience: 0.7 });
    expect(s.gaps).toEqual([]);
    expect(s.status).toBe("complete");
  });

  // SC-3: a thin answer re-probes the SAME facet, capped at MAX_FOLLOWUP(readiness), then advances.
  it("caps same-facet follow-ups at 2 for emerging then advances", async () => {
    const tutor = new AlwaysThinTutor();
    const s = await runSession({
      profile: PROFILE,
      readinessLevel: "emerging",
      ports: { interviewer: tutor, judge: tutor },
      answerSource: async () => "still vague",
    });
    // First facet ("what") is probed 3 times: initial + 2 follow-ups, then advances to "why".
    expect(s.turns.slice(0, 3).map((t) => t.facet)).toEqual(["what", "what", "what"]);
    expect(s.turns.slice(0, 3).map((t) => t.isFollowUp)).toEqual([false, true, true]);
    expect(s.turns[3]?.facet).toBe("why");
    expect(s.turns[3]?.isFollowUp).toBe(false);
  });

  it("caps same-facet follow-ups at 1 for fluent then advances", async () => {
    const tutor = new AlwaysThinTutor();
    const s = await runSession({
      profile: PROFILE,
      readinessLevel: "fluent",
      ports: { interviewer: tutor, judge: tutor },
      answerSource: async () => "still vague",
    });
    // First facet ("what") is probed 2 times: initial + 1 follow-up, then advances to "why".
    expect(s.turns.slice(0, 2).map((t) => t.facet)).toEqual(["what", "what"]);
    expect(s.turns.slice(0, 2).map((t) => t.isFollowUp)).toEqual([false, true]);
    expect(s.turns[2]?.facet).toBe("why");
    expect(s.turns[2]?.isFollowUp).toBe(false);
  });

  // SC-5: with all answers thin (never COVERED), the session stops at MAX_TURNS and reports gaps.
  it("stops at MAX_TURNS and reports remaining gaps when nothing gets covered", async () => {
    const tutor = new AlwaysThinTutor();
    const s = await runSession({
      profile: PROFILE,
      readinessLevel: "developing",
      ports: { interviewer: tutor, judge: tutor },
      answerSource: async () => "still vague",
    });
    expect(s.turns.length).toBe(12); // MAX_TURNS
    expect(s.status).toBe("complete");
    expect(s.gaps).toEqual(["what", "why", "how", "challenge", "next", "audience"]);
  });
});
