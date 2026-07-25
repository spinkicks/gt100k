import { describe, it, expect } from "vitest";
import { CLAIMS, claim, AREAS } from "../src/index.js";

describe("research registry", () => {
  it("has unique, stable ids", () => {
    const ids = CLAIMS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });

  it("cites a resolvable source for every evidence and policy claim", () => {
    for (const c of CLAIMS) {
      if (c.basis === "evidence" || c.basis === "policy") {
        expect(c.sources.length, `${c.id} has no source`).toBeGreaterThan(0);
        for (const s of c.sources) {
          expect(s.url, `${c.id} → ${s.authors}`).toMatch(/^https:\/\/\S+$/);
          expect(s.year).toBeGreaterThan(1900);
        }
      }
    }
  });

  it("makes every chosen default admit it is a default", () => {
    // A chosen number dressed up as science is the fastest way to lose a guide's trust,
    // so a `chosen` claim must carry a limit explaining that it is our pick.
    for (const c of CLAIMS) {
      if (c.basis === "chosen") {
        expect(c.limit, `${c.id} is a chosen default with no stated caveat`).toBeTruthy();
        expect(c.limit!.toLowerCase()).toMatch(/default|not a measured|our (own )?pick|picked/);
      }
    }
  });

  it("keeps every explanation to one plain sentence", () => {
    for (const c of CLAIMS) {
      expect(c.why.length, `${c.id} why is empty`).toBeGreaterThan(20);
      expect(c.why.length, `${c.id} why is too long to read in a popover`).toBeLessThan(240);
      // One sentence: no interior full stop followed by a capital.
      expect(c.why.replace(/\.$/, "")).not.toMatch(/\.\s+[A-Z]/);
    }
  });

  it("never phrases a claim as a statement about a specific child", () => {
    for (const c of CLAIMS) {
      expect(c.why.toLowerCase()).not.toMatch(/\bthis child is\b|\byour child is\b/);
    }
  });

  it("files every claim under a known area", () => {
    for (const c of CLAIMS) expect(AREAS).toContain(c.area);
  });

  it("resolves claims by id", () => {
    expect(claim("voluntary-returns")?.basis).toBe("evidence");
    expect(claim("nope")).toBeUndefined();
  });
});
