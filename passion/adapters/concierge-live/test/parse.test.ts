// test/parse.test.ts — HERMETIC: parses canned TFY JSON bodies into the concierge port verdicts.
// The network is NEVER exercised here and `../src/index.js` (the fetch-backed classes) is NEVER
// imported — only the pure `parse` module + the synthetic fixtures. Mirrors tagger-tfy/tutor-tfy.
import { describe, it, expect } from "vitest";
import {
  parseModeration,
  parseDistress,
  parseGeneration,
  parseFaithfulness,
} from "../src/parse.js";
import {
  MODERATION_SAFE,
  MODERATION_UNSAFE,
  DISTRESS_NONE,
  DISTRESS_HIT,
  GENERATION,
  FAITHFULNESS_GROUNDED,
  FAITHFULNESS_UNGROUNDED,
} from "../src/__fixtures__/tfy-responses.js";

describe("parseModeration", () => {
  it("parses a safe verdict", () => {
    expect(parseModeration(JSON.stringify(MODERATION_SAFE))).toEqual({
      safe: true,
      reason: "no policy concerns",
    });
  });

  it("parses an unsafe verdict with its reason", () => {
    const v = parseModeration(JSON.stringify(MODERATION_UNSAFE));
    expect(v?.safe).toBe(false);
    expect(v?.reason).toBe("weapons instructions");
  });

  it("returns null on malformed JSON (⇒ caller uses the unsafe fallback)", () => {
    expect(parseModeration("not json")).toBeNull();
  });

  it("returns null when `safe` is missing or non-boolean", () => {
    expect(parseModeration(JSON.stringify({ reason: "hmm" }))).toBeNull();
    expect(parseModeration(JSON.stringify({ safe: "yes" }))).toBeNull();
  });
});

describe("parseDistress", () => {
  it("parses a no-distress verdict", () => {
    expect(parseDistress(JSON.stringify(DISTRESS_NONE))).toEqual({
      distress: false,
      reason: "topic question",
    });
  });

  it("parses a distress hit", () => {
    const v = parseDistress(JSON.stringify(DISTRESS_HIT));
    expect(v?.distress).toBe(true);
    expect(v?.reason).toBe("self-harm language");
  });

  it("returns null on malformed JSON (⇒ caller escalates on uncertainty)", () => {
    expect(parseDistress("not json")).toBeNull();
    expect(parseDistress(JSON.stringify({ distress: 1 }))).toBeNull();
  });
});

describe("parseGeneration", () => {
  it("parses text + citations and RECOMPUTES reputation from the URL (never trusts the model)", () => {
    const g = parseGeneration(JSON.stringify(GENERATION));
    expect(g?.text).toBe("Tardigrades survive space by entering a dried-out tun state.");
    expect(g?.citations).toHaveLength(1);
    expect(g?.citations[0]?.url).toBe("https://en.wikipedia.org/wiki/Tardigrade");
    expect(g?.citations[0]?.reputation).toBe(0.9); // wikipedia.org is allowlisted (REPUTATION_ALLOWLISTED)
  });

  it("scores an off-allowlist citation below the floor", () => {
    const g = parseGeneration(
      JSON.stringify({ text: "x", citations: [{ url: "https://spam.example/x", title: "X" }] }),
    );
    expect(g?.citations[0]?.reputation).toBe(0.2); // REPUTATION_UNKNOWN < REPUTATION_FLOOR
  });

  it("passes an empty generation through unchanged (⇒ pipeline refuses `empty-generation`)", () => {
    expect(parseGeneration(JSON.stringify({ text: "", citations: [] }))).toEqual({
      text: "",
      citations: [],
    });
  });

  it("returns null on malformed shape", () => {
    expect(parseGeneration("not json")).toBeNull();
    expect(parseGeneration(JSON.stringify({ text: 5, citations: [] }))).toBeNull();
    expect(parseGeneration(JSON.stringify({ text: "x", citations: "nope" }))).toBeNull();
    expect(
      parseGeneration(JSON.stringify({ text: "x", citations: [{ url: "u" }] })),
    ).toBeNull(); // citation missing title
  });
});

describe("parseFaithfulness", () => {
  it("parses a grounded verdict", () => {
    expect(parseFaithfulness(JSON.stringify(FAITHFULNESS_GROUNDED))).toEqual({
      grounded: true,
      score: 0.92,
    });
  });

  it("parses an ungrounded verdict", () => {
    expect(parseFaithfulness(JSON.stringify(FAITHFULNESS_UNGROUNDED))).toEqual({
      grounded: false,
      score: 0.2,
    });
  });

  it("returns null on an out-of-range score", () => {
    expect(parseFaithfulness(JSON.stringify({ grounded: true, score: 1.5 }))).toBeNull();
    expect(parseFaithfulness(JSON.stringify({ grounded: true, score: -0.1 }))).toBeNull();
  });

  it("returns null on malformed JSON (⇒ caller uses the ungrounded fallback)", () => {
    expect(parseFaithfulness("not json")).toBeNull();
    expect(parseFaithfulness(JSON.stringify({ grounded: "yes", score: 0.5 }))).toBeNull();
  });
});
