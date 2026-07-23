import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { runSession } from "../src/session.js";
import { assembleEvidenceRecord, toEvidenceNode } from "../src/evidence.js";
import type { Interviewer, AnswerJudge } from "../src/ports.js";
import type { Judgment, Hasher } from "../src/model.js";
import { PROFILE, READINESS, QUESTIONS, ANSWERS, JUDGMENTS } from "../src/__fixtures__/scripted-session.js";

const CREATED_AT = "2026-01-01T00:00:00.000Z";
// Inline hasher (node:crypto builtin) — avoids importing the evidence-hash-node adapter into the domain.
const hasher: Hasher = { hash: (b) => createHash("sha256").update(b).digest("hex") };

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

async function build() {
  const tutor = new InlineTutor();
  const s = await runSession({
    profile: PROFILE,
    readinessLevel: READINESS,
    ports: { interviewer: tutor, judge: tutor },
    answerSource: async ({ index }) => ANSWERS[index] ?? "",
  });
  return assembleEvidenceRecord(s, CREATED_AT, hasher);
}

describe("evidence record", () => {
  it("has no grade field and a 64-hex content hash", async () => {
    const r = await build();
    expect("grade" in r).toBe(false);
    expect(r.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });
  it("hash is deterministic across two assemblies", async () => {
    const r1 = await build();
    const r2 = await build();
    expect(r1.contentHash).toBe(r2.contentHash);
  });
  it("maps to an Artifact-shaped evidence node carrying the hash", async () => {
    const r = await build();
    const node = toEvidenceNode(r);
    expect(node.type).toBe("Artifact");
    expect(node.actor.ref).toBe("stu-01");
    expect((node.payload as { recordHash: string }).recordHash).toBe(r.contentHash);
  });
  it("matches the locked golden content hash", async () => {
    const r = await build();
    expect(r.contentHash).toBe("e16d92cb0acfc90d383ebe4adfa2b32889c566e0a0acf875aa0efcb320f29b3b");
  });
});
