import { createHash } from "node:crypto";
import type { Interviewer, AnswerJudge } from "./ports.js";
import { runSession } from "./session.js";
import { assembleEvidenceRecord } from "./evidence.js";
import type { EvidenceRecord, Judgment, Hasher } from "./model.js";
import { PROFILE, READINESS, QUESTIONS, ANSWERS, JUDGMENTS } from "./__fixtures__/scripted-session.js";

// Inline node:crypto Hasher (a Node builtin, not a dependency) — keeps the domain free of an adapter import.
const demoHasher: Hasher = { hash: (b) => createHash("sha256").update(b).digest("hex") };

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

export async function runDemo(): Promise<EvidenceRecord> {
  const t = new InlineTutor();
  const s = await runSession({
    profile: PROFILE,
    readinessLevel: READINESS,
    ports: { interviewer: t, judge: t },
    answerSource: async ({ index }) => ANSWERS[index] ?? "",
  });
  return assembleEvidenceRecord(s, "2026-01-01T00:00:00.000Z", demoHasher);
}

// Headless entrypoint: `tsx src/demo.ts` prints the evidence record.
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo()
    .then((record) => {
      console.log(JSON.stringify(record, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
