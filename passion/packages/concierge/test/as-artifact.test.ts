/**
 * A curated resource IS the artifact, under a launcher.
 *
 * The game needed a crosswalk because its furniture ("nonogram", topic "logic-games") had no
 * relationship to the taxonomy. A launcher has no furniture: the child picks a subtopic, which is
 * already a `DomainPath`, and follows a resource that already declares its `affordedModes`. The
 * three fields `buildActionEvents` resolves against are `id`, `domainPath` and `affordedModes`, and
 * `CuratedResource` carries all three. So the mapping is a projection, not a translation.
 *
 * The fields it does NOT carry are provenance claims about tagging, and this is where an adapter
 * can quietly lie. A curated entry is hand-authored and reviewed, so it is `gold`/`seed`/`TRUSTED`
 * at confidence 1 — but only because a human wrote it, and the type must not be usable to launder
 * an auto-tagged or generated resource into that status. Hence the explicit provenance check.
 */
import { describe, expect, it } from "vitest";

import { asArtifact, CURATED_PROVENANCE_PREFIX } from "../src/as-artifact.js";
import type { CuratedResource } from "../src/model.js";

const RES: CuratedResource = {
  id: "res-nasa-solar-system",
  title: "Solar System Exploration",
  url: "https://science.nasa.gov/solar-system/",
  domainPath: ["science-nature", "astronomy"],
  affordedModes: ["investigate", "explain"],
  reputation: 0.98,
  ageTiers: ["9-11", "12-14"],
  provenance: "curated:seed",
};

describe("a curated resource projects onto an artifact", () => {
  it("carries the three fields the pipeline actually resolves against", () => {
    const a = asArtifact(RES);

    expect(a.id).toBe(RES.id);
    expect(a.domainPath).toEqual(RES.domainPath);
    expect(a.affordedModes).toEqual(RES.affordedModes);
  });

  it("is a resource, hand-authored and trusted", () => {
    const a = asArtifact(RES);

    expect(a.kind).toBe("resource");
    expect(a.source).toBe("gold");
    expect(a.origin).toBe("seed");
    expect(a.tagConfidence).toBe(1);
    expect(a.tagStatus).toBe("TRUSTED");
  });

  it("round-trips through the signal pipeline's resolver", () => {
    // The point of the whole adapter: a catalog built from curated entries is a catalog
    // `deriveSignals` can use, with no crosswalk in between.
    const catalog = new Map([[RES.id, asArtifact(RES)]]);

    expect(catalog.get(RES.id)?.domainPath).toEqual(["science-nature", "astronomy"]);
  });
});

describe("it refuses to launder a resource into trusted status", () => {
  it("rejects provenance that is not curated", () => {
    // `promote` can add a web document to the library. Such an entry is a candidate, not a
    // hand-authored one, and must not arrive downstream claiming `gold`/`TRUSTED` at confidence 1.
    const promoted: CuratedResource = { ...RES, provenance: "web:promoted" };

    expect(() => asArtifact(promoted)).toThrow(/provenance/);
  });

  it("names the prefix it requires, so the failure is actionable", () => {
    expect(CURATED_PROVENANCE_PREFIX).toBe("curated:");
    expect(() => asArtifact({ ...RES, provenance: "" })).toThrow(/curated:/);
  });

  it("rejects a resource with no afforded mode, which could form no cell", () => {
    expect(() => asArtifact({ ...RES, affordedModes: [] })).toThrow(/mode/);
  });

  it("de-duplicates modes rather than double-counting a cell", () => {
    const a = asArtifact({ ...RES, affordedModes: ["investigate", "investigate", "explain"] });

    expect(a.affordedModes).toEqual(["investigate", "explain"]);
  });
});
