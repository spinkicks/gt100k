// test/records.test.ts
import { describe, it, expect } from "vitest";
import { makeArtifact } from "../src/records.js";
import { createTaxonomy } from "../src/taxonomy.js";

describe("records", () => {
  const t = createTaxonomy();
  it("builds a valid gold artifact", () => {
    const a = makeArtifact(t, {
      id: "synth-01", domainPath: ["music-sound", "audio-systems"],
      affordedModes: ["perform", "build", "investigate"], kind: "gadget", source: "gold",
    });
    expect(a.tagConfidence).toBe(1);
    expect(a.tagStatus).toBe("PROVISIONAL"); // trust is set later by the validity gate
    expect(a.affordedModes).toEqual(["perform", "build", "investigate"]);
  });
  it("rejects an empty afforded set", () => {
    expect(() => makeArtifact(t, {
      id: "x", domainPath: ["music-sound"], affordedModes: [], kind: "gadget", source: "gold",
    })).toThrow();
  });
  it("rejects an invalid domain path", () => {
    expect(() => makeArtifact(t, {
      id: "x", domainPath: ["nope"] as never, affordedModes: ["build"], kind: "gadget", source: "gold",
    })).toThrow();
  });
});
