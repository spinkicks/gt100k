// The console's side of the citation contract (app/why.tsx, app/evidence/page.tsx).
//
// `WhyThis` renders nothing when an id does not resolve — a missing citation must never take a
// screen down. The cost of that choice is that a typo, or a claim renamed in @gt100k/research,
// silently removes the reason from the Overview instead of failing loudly. This is the loud part.
import { describe, expect, test } from "vitest";
import { AREAS, CLAIMS, claim } from "@gt100k/research";

/** Every id the Overview tab cites, and what it is attached to. */
const CITED: readonly (readonly [string, string])[] = [
  ["voluntary-returns", "Voluntary returns tile"],
  ["depth-signals", "Depth signals tile"],
  ["coverage", "Coverage tile"],
  ["prompted-vs-voluntary", "Returns over time card"],
  ["wellbeing-behaviour-only", "Wellbeing card"],
  ["confidence-lower-bound", "Confidence column"],
];

describe("Overview citations", () => {
  test.each(CITED)("%s resolves (%s)", (id) => {
    expect(claim(id), `${id} is cited by the Overview but not in the registry`).toBeDefined();
  });

  test("every cited claim can fill a popover", () => {
    for (const [id] of CITED) {
      const c = claim(id)!;
      expect(c.label.length, `${id} has no label to head the popover`).toBeGreaterThan(0);
      expect(["evidence", "chosen", "policy"]).toContain(c.basis);
      // A chosen default carries no source, so it must say why it was picked instead.
      if (c.basis !== "chosen") expect(c.sources.length, `${id} has no source`).toBeGreaterThan(0);
      else expect(c.limit, `${id} is a default with no stated rationale`).toBeTruthy();
    }
  });
});

describe("Evidence base page", () => {
  test("every claim lands in a rendered group", () => {
    // The page walks AREAS in order; anything filed outside that list would still render, but the
    // ordering would be arbitrary, which is worth knowing about.
    const known = new Set<string>(AREAS);
    for (const c of CLAIMS) expect(known.has(c.area), `${c.id} is filed under ${c.area}`).toBe(true);
  });

  test("no area heading renders empty", () => {
    for (const area of AREAS) {
      expect(CLAIMS.some((c) => c.area === area), `${area} has no claims`).toBe(true);
    }
  });
});
