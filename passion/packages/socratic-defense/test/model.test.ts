import { describe, it, expect } from "vitest";
import { FACET_ORDER, isFacet, maxFollowup, THIN, COVERED, MAX_TURNS } from "../src/model.js";

describe("model", () => {
  it("golden facet order", () => {
    expect(FACET_ORDER).toEqual(["what", "why", "how", "challenge", "next", "audience"]);
  });
  it("readiness → follow-up cap", () => {
    expect(maxFollowup("emerging")).toBe(2);
    expect(maxFollowup("developing")).toBe(1);
    expect(maxFollowup("fluent")).toBe(1);
  });
  it("constants", () => {
    expect(THIN).toBe(0.45);
    expect(COVERED).toBe(0.6);
    expect(MAX_TURNS).toBe(12);
  });
  it("isFacet guards", () => {
    expect(isFacet("what")).toBe(true);
    expect(isFacet("nope")).toBe(false);
  });
});
