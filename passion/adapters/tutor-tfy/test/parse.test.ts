import { describe, it, expect } from "vitest";
import { parseJudgment } from "../src/parse.js";
import { JUDGE_RESPONSE as fixture } from "../src/__fixtures__/judge-response.js";

describe("parseJudgment", () => {
  it("parses a valid judgment", () => {
    const j = parseJudgment(JSON.stringify(fixture), "how");
    expect(j).not.toBeNull();
    expect(j?.facet).toBe("how");
    expect(j?.coverage).toBeCloseTo(0.72, 2);
    expect(j?.thin).toBe(false);
  });
  it("null on malformed JSON", () => {
    expect(parseJudgment("nope", "how")).toBeNull();
  });
  it("null on out-of-range coverage", () => {
    expect(parseJudgment(JSON.stringify({ coverage: 2, rationale: "", thin: false }), "how")).toBeNull();
  });
});
