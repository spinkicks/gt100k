import { describe, expect, it } from "vitest";
import {
  AGE_TIERS,
  FAITHFULNESS_MIN,
  MAX_DOCS,
  REPUTATION_FLOOR,
  STRICTNESS,
  type AgeTier,
  type Citation,
  type ConciergeRequest,
  type ConciergeResponse,
  type CuratedResource,
  type RetrievedDoc,
} from "../src/index.js";

describe("concierge model — golden constants (spec §3.4)", () => {
  it("pins the age tiers in order", () => {
    expect(AGE_TIERS).toEqual(["6-8", "9-11", "12-14"]);
  });

  it("pins the safety/grounding constants", () => {
    expect(FAITHFULNESS_MIN).toBe(0.6);
    expect(REPUTATION_FLOOR).toBe(0.5);
    expect(MAX_DOCS).toBe(5);
  });

  it("STRICTNESS covers every tier and 6-8 is the strictest (SC-7 floor)", () => {
    for (const tier of AGE_TIERS) {
      expect(STRICTNESS[tier]).toBeDefined();
      // Every tier's serve floor is at least the global minimum.
      expect(STRICTNESS[tier].faithfulnessMin).toBeGreaterThanOrEqual(FAITHFULNESS_MIN);
    }
    // 6-8 is strictest: highest grounding floor, smallest output.
    expect(STRICTNESS["6-8"].faithfulnessMin).toBeGreaterThan(STRICTNESS["12-14"].faithfulnessMin);
    expect(STRICTNESS["6-8"].maxChars).toBeLessThan(STRICTNESS["12-14"].maxChars);
    expect(STRICTNESS["6-8"].maxSentences).toBeLessThan(STRICTNESS["12-14"].maxSentences);
  });
});

describe("concierge model — type smoke (spec §3.1)", () => {
  it("constructs the domain shapes", () => {
    const tier: AgeTier = "9-11";
    const request: ConciergeRequest = {
      kidId: "kid-synthetic-001",
      ageTier: tier,
      message: "how do I start learning chess openings?",
      sessionId: "sess-001",
    };
    const citation: Citation = {
      url: "https://en.wikipedia.org/wiki/Chess_opening",
      title: "Chess opening",
      reputation: 0.9,
    };
    const resource: CuratedResource = {
      id: "res-chess-openings",
      title: "Chess Openings for Beginners",
      url: "https://www.khanacademy.org/chess-openings",
      domainPath: ["games-strategy", "chess"],
      affordedModes: ["perform", "explain"],
      reputation: 0.95,
      ageTiers: ["6-8", "9-11", "12-14"],
      provenance: "curated:seed",
    };
    const doc: RetrievedDoc = {
      url: "https://en.wikipedia.org/wiki/Chess_opening",
      title: "Chess opening",
      text: "A chess opening is the group of initial moves of a game.",
      reputation: 0.9,
    };
    const response: ConciergeResponse = {
      kind: "answer",
      text: "A chess opening is the group of initial moves.",
      citations: [citation],
      resources: [resource],
      probe: "Try playing the first three moves of the Italian Game.",
    };

    expect(request.ageTier).toBe("9-11");
    expect(doc.reputation).toBe(0.9);
    expect(response.kind).toBe("answer");
    expect(response.citations?.[0]?.title).toBe("Chess opening");
    expect(resource.domainPath[0]).toBe("games-strategy");
  });

  it("expresses refused and escalated responses", () => {
    const refused: ConciergeResponse = { kind: "refused", reason: "ungrounded" };
    const escalated: ConciergeResponse = { kind: "escalated", reason: "distress" };
    expect(refused.kind).toBe("refused");
    expect(escalated.kind).toBe("escalated");
  });
});
