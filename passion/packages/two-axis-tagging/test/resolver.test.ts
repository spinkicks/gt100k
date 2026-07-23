import { describe, it, expect } from "vitest";
import { resolveEngagedModes } from "../src/resolver.js";
import { RESOLVER_CASES } from "../src/__fixtures__/resolver-cases.js";

describe("resolveEngagedModes (golden)", () => {
  for (const c of RESOLVER_CASES) {
    it(c.name, () => {
      const r = resolveEngagedModes(c.artifact, c.action);
      if (c.expect.ok) {
        expect(r.ok).toBe(true);
        if (r.ok) {
          expect(r.engagedModes.primary).toBe(c.expect.primary);
          expect(r.engagedModes.secondary).toBe(c.expect.secondary);
        }
      } else {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.reason).toBe(c.expect.reason);
      }
    });
  }

  it("guarantees engagedModes ⊆ affordedModes", () => {
    for (const c of RESOLVER_CASES) {
      const r = resolveEngagedModes(c.artifact, c.action);
      if (r.ok) {
        expect(c.artifact.affordedModes).toContain(r.engagedModes.primary);
        if (r.engagedModes.secondary) expect(c.artifact.affordedModes).toContain(r.engagedModes.secondary);
      }
    }
  });
});
