/**
 * The library is the product, under a launcher, so its failures are the product's failures.
 *
 * In the game, a thin library meant the concierge fell back to open-web retrieval — degraded, but
 * the child still got an answer. In a launcher the library IS the surface: a child taps a subtopic
 * and sees exactly what is filed under it. A subtopic with nothing behind it is not a degraded
 * experience, it is a dead end the child walks into, and it teaches them the thing they were
 * curious about is not here.
 *
 * That is worse than it sounds, because of what we already know about triggering: a domain that is
 * raised and then not maintained leaves a child BELOW where they started
 * (`06-activity-design-ages-6-8` §2.3). Offering a subtopic and having nothing behind it is the
 * purest form of that. So "every subtopic has something" is an ERROR here, not a nice-to-have, and
 * it is checked in the same pass as the per-entry rules.
 *
 * The age rules matter for the same reason. An entry tagged `6-8` that a six-year-old cannot use is
 * a dead end wearing a label, and the tier a child is in is the one that decides what they see.
 */
import { CABINS, SEED_SUBTOPICS } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import type { CuratedResource } from "../src/model.js";
import { validateLibrary } from "../src/validate-library.js";

const OK: CuratedResource = {
  id: "res-ok",
  title: "Solar System Exploration",
  url: "https://science.nasa.gov/solar-system/",
  domainPath: ["science-nature", "astronomy"],
  affordedModes: ["investigate"],
  reputation: 0.98,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated:seed",
};

const codesOf = (lib: readonly CuratedResource[], opts?: Parameters<typeof validateLibrary>[1]) =>
  validateLibrary(lib, opts).problems.map((p) => p.code);

describe("an entry has to be usable", () => {
  it("accepts a well-formed one", () => {
    expect(validateLibrary([OK], { requireFullCoverage: false }).problems).toEqual([]);
  });

  it("rejects a domain outside the taxonomy", () => {
    const bad = { ...OK, domainPath: ["underwater-basket-weaving"] } as unknown as CuratedResource;

    expect(codesOf([bad], { requireFullCoverage: false })).toContain("UNKNOWN_DOMAIN");
  });

  it("rejects a subtopic the cabin does not have", () => {
    const bad = { ...OK, domainPath: ["science-nature", "wizardry"] } as CuratedResource;

    expect(codesOf([bad], { requireFullCoverage: false })).toContain("UNKNOWN_SUBTOPIC");
  });

  it("rejects an entry that affords nothing, since it can form no cell", () => {
    expect(codesOf([{ ...OK, affordedModes: [] }], { requireFullCoverage: false })).toContain(
      "NO_MODES",
    );
  });

  it("rejects an entry that serves no age", () => {
    expect(codesOf([{ ...OK, ageTiers: [] }], { requireFullCoverage: false })).toContain(
      "NO_TIERS",
    );
  });

  it("rejects a reputation below the floor the pipeline would drop anyway", () => {
    // Curating something the retrieval filter would discard is a contradiction: it says a human
    // vouched for a source the system does not trust.
    expect(codesOf([{ ...OK, reputation: 0.3 }], { requireFullCoverage: false })).toContain(
      "BELOW_REPUTATION_FLOOR",
    );
  });

  it("rejects a non-https url", () => {
    // A child follows these. Plain http is both interceptable and, in practice, a rot signal.
    const bad = { ...OK, url: "http://science.nasa.gov/solar-system/" };

    expect(codesOf([bad], { requireFullCoverage: false })).toContain("NOT_HTTPS");
  });

  it("rejects an unparseable url", () => {
    expect(codesOf([{ ...OK, url: "not a url" }], { requireFullCoverage: false })).toContain(
      "BAD_URL",
    );
  });

  it("rejects provenance that is not hand-authored", () => {
    const bad = { ...OK, provenance: "web:promoted" };

    expect(codesOf([bad], { requireFullCoverage: false })).toContain("NOT_CURATED");
  });

  it("rejects a duplicate id, which would silently shadow an entry in the catalog", () => {
    expect(codesOf([OK, { ...OK, title: "Other" }], { requireFullCoverage: false })).toContain(
      "DUPLICATE_ID",
    );
  });

  it("rejects the same url filed twice under one subtopic", () => {
    const twice = { ...OK, id: "res-ok-2" };

    expect(codesOf([OK, twice], { requireFullCoverage: false })).toContain("DUPLICATE_URL");
  });
});

describe("no subtopic may be a dead end", () => {
  it("reports every subtopic with nothing behind it", () => {
    const report = validateLibrary([OK]);

    const empties = report.problems.filter((p) => p.code === "EMPTY_SUBTOPIC");
    expect(empties.length).toBeGreaterThan(20); // only astronomy is filled
    expect(empties.some((p) => p.where === "science-nature/astronomy")).toBe(false);
  });

  it("counts a cabin-level entry as covering the cabin but not its subtopics", () => {
    // A child who taps a subtopic sees that subtopic's shelf. A resource filed at the cabin is
    // about the whole cabin and does not stock the shelf they are looking at.
    const cabinWide: CuratedResource = { ...OK, id: "res-cabin", domainPath: ["science-nature"] };
    const report = validateLibrary([cabinWide]);

    const where = report.problems.filter((p) => p.code === "EMPTY_SUBTOPIC").map((p) => p.where);
    expect(where).toContain("science-nature/astronomy");
  });

  it("is satisfiable: a library covering every subtopic reports no dead end", () => {
    const full = fullyCovering();

    expect(codesOf(full)).not.toContain("EMPTY_SUBTOPIC");
  });
});

describe("age coverage is reported, not assumed", () => {
  it("warns when a subtopic serves no six-to-eights", () => {
    const report = validateLibrary([OK], { requireFullCoverage: false });

    const warn = report.warnings.find(
      (w) => w.where === "science-nature/astronomy" && w.code === "TIER_UNSERVED",
    );
    expect(warn).toBeDefined();
    expect(warn?.detail).toContain("6-8");
  });

  it("does not warn when every tier is served", () => {
    const all: CuratedResource = { ...OK, ageTiers: ["6-8", "9-11", "12-14"] };
    const report = validateLibrary([all], { requireFullCoverage: false });

    expect(report.warnings.filter((w) => w.code === "TIER_UNSERVED")).toEqual([]);
  });
});

/** One entry per subtopic, enough to satisfy the coverage rule. */
function fullyCovering(): readonly CuratedResource[] {
  const out: CuratedResource[] = [];
  for (const cabin of CABINS) {
    for (const sub of SEED_SUBTOPICS[cabin]) {
      out.push({
        ...OK,
        id: `res-${cabin}-${sub}`,
        url: `https://science.nasa.gov/${cabin}/${sub}/`,
        domainPath: [cabin, sub],
        ageTiers: ["6-8", "9-11", "12-14"],
      });
    }
  }
  return out;
}
