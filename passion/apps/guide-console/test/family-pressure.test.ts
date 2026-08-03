import { describe, expect, it } from "vitest";
import { familyPressureBlocks } from "../app/family.js";
import { parseFamilyReviews } from "../app/family-reviews.js";
import type { FamilyRead } from "@gt100k/family";

// familyPressureBlocks reads only `escalateToHuman`; a minimal cast keeps the test on the rule
// rather than on the shape of a whole FamilyRead.
const escalating = { escalateToHuman: true } as unknown as FamilyRead;
const calm = { escalateToHuman: false } as unknown as FamilyRead;

describe("familyPressureBlocks", () => {
  it("holds the promote when the engine escalated and the guide has not reviewed", () => {
    // The exact bug this closes: a flagged child was one tap from a promote. The hold is the default
    // for an escalated, unreviewed flag.
    expect(familyPressureBlocks(escalating, false)).toBe(true);
  });

  it("releases the promote once the guide has reviewed", () => {
    // Reviewing is the only thing that lifts the hold, so a flagged child is never permanently stuck.
    expect(familyPressureBlocks(escalating, true)).toBe(false);
  });

  it("never holds a non-escalated read, reviewed or not", () => {
    expect(familyPressureBlocks(calm, false)).toBe(false);
    expect(familyPressureBlocks(calm, true)).toBe(false);
  });

  it("never holds when there is no family read at all", () => {
    expect(familyPressureBlocks(undefined, false)).toBe(false);
  });
});

describe("parseFamilyReviews", () => {
  it("is an empty set for null, malformed JSON, or a non-array", () => {
    expect(parseFamilyReviews(null)).toEqual([]);
    expect(parseFamilyReviews("{oops")).toEqual([]);
    expect(parseFamilyReviews('{"a":1}')).toEqual([]);
  });

  it("keeps only non-empty string ids and drops the rest", () => {
    expect(parseFamilyReviews('["kid-1","",5,null,"kid-2"]')).toEqual(["kid-1", "kid-2"]);
  });

  it("round-trips a written set", () => {
    const ids = ["kid-synthetic-002", "kid-synthetic-003"];
    expect(parseFamilyReviews(JSON.stringify(ids))).toEqual(ids);
  });
});
