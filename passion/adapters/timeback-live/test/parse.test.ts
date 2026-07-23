// test/parse.test.ts — HERMETIC: parses canned assumed-API payloads into a `TimeBackSnapshot`.
// The network is NEVER exercised here and `../src/index.js` (the fetch-backed `TimeBackClient`) is
// NEVER imported — only the pure `parse` module + the synthetic fixtures + the domain mapper. Mirrors
// concierge-live/tagger-tfy. Proves SC-8 (parse + fail-safe; adapter never imported by a domain test).
import { describe, it, expect } from "vitest";
import { toDomainPriors, type TimeBackSnapshot } from "@gt100k/timeback";
import { parseSnapshot } from "../src/parse.js";
import { ASSUMED_PAYLOAD, MALFORMED_PAYLOAD } from "../src/__fixtures__/payloads.js";

const EMPTY_ASOF = "1970-01-01T00:00:00.000Z"; // the deterministic fail-safe fallback timestamp (epoch)

describe("parseSnapshot", () => {
  it("maps a well-formed assumed-API payload 1:1 to a TimeBackSnapshot", () => {
    const snap: TimeBackSnapshot = parseSnapshot("kid-1", ASSUMED_PAYLOAD);
    expect(snap.kidId).toBe("kid-1");
    expect(snap.asOf).toBe("2026-04-01T00:00:00.000Z");
    expect(snap.subjects).toHaveLength(4);
    expect(snap.subjects[0]).toEqual({
      subject: "math",
      mastery: 0.8,
      discretionaryXp: 60,
      offered: true,
    });
    expect(snap.subjects[3]).toEqual({
      subject: "music",
      mastery: 0.4,
      discretionaryXp: 0,
      offered: false,
    });
  });

  it("produces in-range tilts when the parsed snapshot is mapped to priors", () => {
    const priors = toDomainPriors(parseSnapshot("kid-1", ASSUMED_PAYLOAD));
    expect(priors.length).toBeGreaterThan(0);
    for (const p of priors) {
      expect(p.aptitudeTilt).toBeGreaterThanOrEqual(0);
      expect(p.aptitudeTilt).toBeLessThanOrEqual(1);
      expect(p.discretionaryTilt).toBeGreaterThanOrEqual(0);
      expect(p.discretionaryTilt).toBeLessThanOrEqual(1);
    }
  });

  it("returns a safe empty snapshot on a malformed payload (no throw)", () => {
    expect(parseSnapshot("k", MALFORMED_PAYLOAD)).toEqual({
      kidId: "k",
      asOf: EMPTY_ASOF,
      subjects: [],
    });
  });

  it("returns a safe empty snapshot on null / non-object / array (no throw)", () => {
    expect(parseSnapshot("k", null)).toEqual({ kidId: "k", asOf: EMPTY_ASOF, subjects: [] });
    expect(parseSnapshot("k", 42)).toEqual({ kidId: "k", asOf: EMPTY_ASOF, subjects: [] });
    expect(parseSnapshot("k", "nope")).toEqual({ kidId: "k", asOf: EMPTY_ASOF, subjects: [] });
    expect(parseSnapshot("k", [])).toEqual({ kidId: "k", asOf: EMPTY_ASOF, subjects: [] });
  });

  it("falls back safely when subjects is present but not an array", () => {
    expect(parseSnapshot("k", { asOf: "2026-01-01T00:00:00.000Z", subjects: "oops" })).toEqual({
      kidId: "k",
      asOf: EMPTY_ASOF,
      subjects: [],
    });
  });
});
