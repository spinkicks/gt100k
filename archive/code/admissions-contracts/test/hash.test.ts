import { describe, expect, it } from "vitest";

import { canonicalize, sha256ContentHash } from "../src/hash.js";

const GOLDEN_CANONICAL = '{"a":"start","z":["last",{"a":"first","b":"second"}]}';
const GOLDEN_HASH = "sha256:8cd87629bb1fa0359ac93785fa43b571c5ffcd875bc21220ce02f2a54a7b954e";

describe("admissions content hashing", () => {
  it("canonicalizes nested keys while preserving significant array order", () => {
    const keyShuffled = {
      z: ["last", { b: "second", a: "first" }],
      omitted: undefined,
      a: "start",
    };

    expect(canonicalize(keyShuffled)).toBe(GOLDEN_CANONICAL);
    expect(canonicalize(JSON.parse(GOLDEN_CANONICAL))).toBe(GOLDEN_CANONICAL);
  });

  it("locks the lowercase sha256-prefixed hash for canonical UTF-8 content", () => {
    expect(
      sha256ContentHash({
        z: ["last", { b: "second", a: "first" }],
        a: "start",
      }),
    ).toBe(GOLDEN_HASH);
    expect(sha256ContentHash(JSON.parse(GOLDEN_CANONICAL))).toBe(GOLDEN_HASH);
  });

  it("rejects values that cannot be represented unambiguously as JSON", () => {
    expect(() => canonicalize([undefined])).toThrow("JSON-compatible");
    expect(() => canonicalize({ value: Number.NaN })).toThrow("JSON-compatible");
    expect(() => canonicalize(new Date("2026-01-01T00:00:00.000Z"))).toThrow("JSON-compatible");
  });
});
