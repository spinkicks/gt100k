// test/parse.test.ts — HERMETIC: parses canned TFY JSON bodies into a ProjectBrief. The network is
// NEVER exercised here and `../src/index.js` (the fetch-backed generator) is NEVER imported — only
// the pure `parse` module + synthetic fixtures. Mirrors concierge-live / tagger-tfy / tutor-tfy.
import { describe, it, expect } from "vitest";
import { parseBriefFields, coerceBriefOrStub } from "../src/parse.js";
import type { BriefContext } from "@gt100k/specialization-planner";
import { BRIEF_VALID, BRIEF_MISSING_FIELD, BRIEF_EMPTY_FIELD } from "../src/__fixtures__/tfy-responses.js";

const ctx: BriefContext = {
  domainPath: ["music-sound", "production"],
  mode: "build",
  stage: "S3_AUTHORSHIP",
  audience: "REAL_COMMUNITY",
  craftFloorHint: "practice one clean edit",
  resources: [],
};

describe("parseBriefFields", () => {
  it("extracts the five model-authored text fields from a well-formed payload", () => {
    expect(parseBriefFields(JSON.stringify(BRIEF_VALID))).toEqual({
      title: BRIEF_VALID.title,
      drivingQuestion: BRIEF_VALID.drivingQuestion,
      authenticMethod: BRIEF_VALID.authenticMethod,
      craftScaffold: BRIEF_VALID.craftScaffold,
      successLooksLike: BRIEF_VALID.successLooksLike,
    });
  });

  it("returns null on malformed JSON", () => {
    expect(parseBriefFields("not json")).toBeNull();
  });

  it("returns null when a required field is missing", () => {
    expect(parseBriefFields(JSON.stringify(BRIEF_MISSING_FIELD))).toBeNull();
  });

  it("returns null when a field is present but empty/blank", () => {
    expect(parseBriefFields(JSON.stringify(BRIEF_EMPTY_FIELD))).toBeNull();
  });

  it("returns null when a field is the wrong type", () => {
    expect(parseBriefFields(JSON.stringify({ ...BRIEF_VALID, title: 42 }))).toBeNull();
  });
});

describe("coerceBriefOrStub — validate → llm brief, else stub fallback ([D11] fail-safe)", () => {
  it("builds an llm-sourced Type III brief from a valid payload", () => {
    const brief = coerceBriefOrStub(JSON.stringify(BRIEF_VALID), ctx);
    expect(brief.source).toBe("llm");
    expect(brief.title).toBe(BRIEF_VALID.title);
    expect(brief.craftScaffold).toBe(BRIEF_VALID.craftScaffold);
    expect(brief.audience).toBe("REAL_COMMUNITY"); // set by the adapter, from the context
    expect(brief.childOwnsChoice).toBe(true); // always an offer, never an assignment
  });

  it("falls back to the deterministic stub on a malformed payload (never empty/invalid)", () => {
    const brief = coerceBriefOrStub("not json", ctx);
    expect(brief.source).toBe("stub");
    expect(brief.title.length).toBeGreaterThan(0);
    expect(brief.craftScaffold.length).toBeGreaterThan(0);
    expect(brief.childOwnsChoice).toBe(true);
  });

  it("falls back to the stub when a required field is missing", () => {
    const brief = coerceBriefOrStub(JSON.stringify(BRIEF_MISSING_FIELD), ctx);
    expect(brief.source).toBe("stub");
  });
});
