import { describe, expect, it } from "vitest";
import { DEMO_BADGE, HEADLINE, SUBTITLE, nodeGloss, verifyLine } from "../components/copy.js";

describe("plain-language copy", () => {
  it("headline and subtitle lead with the story, no jargon", () => {
    expect(HEADLINE).toMatch(/built/i);
    expect(SUBTITLE.toLowerCase()).not.toMatch(/merkle|provenance|observatory|milestone/);
  });

  it("demo badge is plain", () => {
    expect(DEMO_BADGE).toBe("Demo data");
  });

  it("every node type has a plain gloss", () => {
    for (const t of [
      "Artifact", "Attempt", "Transformation", "Claim",
      "Assistance", "Contribution", "Review", "Outcome",
    ] as const) {
      expect(nodeGloss(t).length).toBeGreaterThan(0);
      expect(nodeGloss(t).toLowerCase()).not.toBe(t.toLowerCase());
    }
    expect(nodeGloss("Attempt")).toBe("a run or test");
    expect(nodeGloss("Assistance")).toBe("help used");
  });

  it("verify line is plain in both states, no crypto terms", () => {
    expect(verifyLine(true)).toMatch(/hasn't changed|has not changed|nothing.*changed/i);
    expect(verifyLine(false)).toMatch(/changed/i);
    expect((verifyLine(true) + verifyLine(false)).toLowerCase()).not.toMatch(/merkle|digest|hash/);
  });
});
