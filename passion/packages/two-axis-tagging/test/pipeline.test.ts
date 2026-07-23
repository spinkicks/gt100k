// test/pipeline.test.ts
import { describe, it, expect } from "vitest";
import { createTaxonomy } from "../src/taxonomy.js";
import { validateSuggestion, acceptSuggestion, CONFIDENCE_FLOOR } from "../src/pipeline.js";

describe("pipeline", () => {
  it("accepts a valid suggestion into an auto artifact", () => {
    const tax = createTaxonomy();
    const a = acceptSuggestion(tax, { id: "r1", kind: "resource", label: "Subwoofer basics" }, {
      domainPath: ["music-sound", "audio-systems"], affordedModes: ["investigate", "build"],
      confidence: 0.8, rationale: "audio DIY",
    });
    expect(a.source).toBe("auto");
    expect(a.tagConfidence).toBe(0.8);
  });
  it("mints a novel sub-topic on accept", () => {
    const tax = createTaxonomy();
    const a = acceptSuggestion(tax, { id: "r2", kind: "resource", label: "Eurorack" }, {
      domainPath: ["music-sound", "modular-synthesis"], affordedModes: ["build"],
      confidence: 0.7, rationale: "novel niche",
    });
    expect(a.domainPath[1]).toBe("modular-synthesis");
    expect(tax.hasPath(["music-sound", "modular-synthesis"])).toBe(true);
  });
  it("rejects an unknown cabin, invalid mode, or low confidence", () => {
    const tax = createTaxonomy();
    expect(validateSuggestion(tax, { domainPath: ["nope"] as never, affordedModes: ["build"], confidence: 0.9, rationale: "" }).ok).toBe(false);
    expect(validateSuggestion(tax, { domainPath: ["music-sound"], affordedModes: ["boop" as never], confidence: 0.9, rationale: "" }).ok).toBe(false);
    expect(validateSuggestion(tax, { domainPath: ["music-sound"], affordedModes: ["build"], confidence: CONFIDENCE_FLOOR - 0.01, rationale: "" }).ok).toBe(false);
  });
});
