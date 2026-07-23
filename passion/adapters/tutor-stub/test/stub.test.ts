import { describe, it, expect } from "vitest";
import { ScriptedTutor } from "../src/index.js";

describe("ScriptedTutor", () => {
  it("returns scripted questions and judgments per turn, then falls back", async () => {
    const t = new ScriptedTutor({
      questions: ["q0", "q1"],
      judgments: [{ facet: "what", coverage: 0.7, rationale: "", thin: false }],
    });
    expect(await t.nextQuestion()).toBe("q0");
    expect((await t.judge()).coverage).toBe(0.7); // consumes turn 0
    expect(await t.nextQuestion()).toBe("q1"); // turn 1 question
    expect((await t.judge()).thin).toBe(true); // exhausted → safe fallback
  });
});
