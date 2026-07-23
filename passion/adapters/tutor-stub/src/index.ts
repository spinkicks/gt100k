import type { Interviewer, AnswerJudge, Judgment } from "@gt100k/socratic-defense";

export class ScriptedTutor implements Interviewer, AnswerJudge {
  private i = 0;
  constructor(private readonly script: { questions: readonly string[]; judgments: readonly Judgment[] }) {}
  async nextQuestion(): Promise<string> {
    return this.script.questions[this.i] ?? "Tell me more about your project.";
  }
  async judge(): Promise<Judgment> {
    const j = this.script.judgments[this.i];
    this.i += 1;
    return j ?? { facet: "what", coverage: 0, rationale: "stub-exhausted", thin: true };
  }
}
