import { describe, expect, it } from "vitest";
import { runInference, serializeCellKey, type CellEvent } from "@gt100k/interest-inference";
import { toDomainPriors } from "../src/map.js";
import { GOLDEN_SNAPSHOT } from "../src/__fixtures__/snapshots.js";

// SC-3 (the core guarantee): a prior only shifts the starting point — it NEVER gates.
// This is a STANDING test proving the guarantee against the merged 011 engine (no new impl here):
//   (a) empty events + any priors → an empty read (no cells, no candidates);
//   (b) per-cell `evidenceMass` is IDENTICAL with vs without the priors on an event-bearing fixture
//       (011's `evidenceMass = alpha − alphaPrior + beta − betaPrior` excludes the prior, so a prior can
//       never supply the ≥ MIN_EVIDENCE_MASS of *behavioral* evidence a candidate needs);
//   (c) a domain that has a prior but NO events never becomes a cell / candidate.
describe("no-gate proof: a prior never manufactures a cell or candidate (SC-3)", () => {
  const now = Date.parse("2026-04-01T00:00:00.000Z");
  const priors = toDomainPriors(GOLDEN_SNAPSHOT);

  // Sanity: the golden snapshot really does produce priors (incl. influence-media) — otherwise (a)/(c)
  // would pass vacuously.
  it("the golden snapshot yields a non-empty set of priors", () => {
    expect(priors.length).toBeGreaterThan(0);
    expect(priors.map((p) => p.domain)).toContain("influence-media");
    expect(priors.map((p) => p.domain)).toContain("math-puzzles");
  });

  it("(a) empty events + any priors → an empty read (no cells, no candidates)", () => {
    const r = runInference([], priors, now);
    expect(r.cells).toHaveLength(0);
    expect(r.candidates).toHaveLength(0);
  });

  // A small event-bearing fixture: 3 voluntary returns on math-puzzles/investigate near `now`
  // (novelty:false so they count; magnitude 1).
  const events: readonly CellEvent[] = [
    { domainPath: ["math-puzzles"], mode: "investigate", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: "2026-04-01T00:00:00.000Z" },
    { domainPath: ["math-puzzles"], mode: "investigate", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: "2026-03-31T00:00:00.000Z" },
    { domainPath: ["math-puzzles"], mode: "investigate", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: "2026-03-30T00:00:00.000Z" },
  ];

  it("(b) per-cell evidenceMass is IDENTICAL with vs without priors (prior excluded from evidence)", () => {
    const withP = runInference(events, priors, now);
    const without = runInference(events, [], now);

    // Same cell set either way (a prior never adds or removes a cell).
    expect(withP.cells.map((c) => c.cellKey).sort()).toEqual(without.cells.map((c) => c.cellKey).sort());
    expect(without.cells.length).toBeGreaterThan(0);

    for (const cell of without.cells) {
      const w = withP.cells.find((c) => c.cellKey === cell.cellKey)!;
      expect(w.evidenceMass).toBeCloseTo(cell.evidenceMass, 5);
    }
  });

  it("(c) a domain with a prior but NO events never becomes a cell or candidate", () => {
    // influence-media has a prior (from GOLDEN_SNAPSHOT) but no events → it must not appear.
    const key = serializeCellKey(["influence-media"], "investigate");
    const withP = runInference(events, priors, now);

    expect(withP.cells.some((c) => c.domainPath[0] === "influence-media")).toBe(false);
    expect(withP.cells.some((c) => c.cellKey === key)).toBe(false);
    expect(withP.candidates.some((c) => c.domainPath[0] === "influence-media")).toBe(false);
  });
});
