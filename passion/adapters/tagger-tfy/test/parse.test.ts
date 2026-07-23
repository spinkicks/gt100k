// test/parse.test.ts
import { describe, it, expect } from "vitest";
import { parseTfySuggestion } from "../src/parse.js";
import { TFY_RESPONSE as fixture } from "../src/__fixtures__/tfy-response.js";

describe("parseTfySuggestion (SC-7)", () => {
  it("parses the recorded TFY JSON response into a valid TagSuggestion", () => {
    const s = parseTfySuggestion(JSON.stringify(fixture));
    expect(s).not.toBeNull();
    expect(s?.domainPath[0]).toBe("making-engineering");
    expect(s?.affordedModes).toContain("build");
    expect(s?.confidence).toBeCloseTo(0.97, 2);
  });

  it("returns null on malformed JSON (no throw, routed to review)", () => {
    expect(parseTfySuggestion("not json")).toBeNull();
  });

  it("returns null on an invalid work-mode", () => {
    expect(
      parseTfySuggestion(
        JSON.stringify({ domainPath: ["music-sound"], affordedModes: ["boop"], confidence: 0.9, rationale: "" }),
      ),
    ).toBeNull();
  });

  it("returns null on an unknown cabin", () => {
    expect(
      parseTfySuggestion(
        JSON.stringify({ domainPath: ["nope"], affordedModes: ["build"], confidence: 0.9, rationale: "" }),
      ),
    ).toBeNull();
  });

  it("returns null on out-of-range confidence", () => {
    expect(
      parseTfySuggestion(
        JSON.stringify({ domainPath: ["music-sound"], affordedModes: ["build"], confidence: 1.5, rationale: "" }),
      ),
    ).toBeNull();
  });

  it("parses a two-segment domainPath (cabin + sub-topic slug)", () => {
    const s = parseTfySuggestion(
      JSON.stringify({ domainPath: ["code-computers", "game-dev"], affordedModes: ["build"], confidence: 0.8, rationale: "" }),
    );
    expect(s?.domainPath).toEqual(["code-computers", "game-dev"]);
  });
});
