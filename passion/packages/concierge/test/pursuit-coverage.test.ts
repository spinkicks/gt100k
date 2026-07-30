// Every tile on the browse wall has a shelf of its own, and none of them is another tile's.
//
// The library already had a coverage gate and it passed: all 29 subtopics stocked, no errors, no
// warnings. It passed because it was asked the wrong question. A subtopic is where the CONCIERGE
// looks something up; a pursuit is what a CHILD taps. The two partition the same material
// differently — `music-sound/instruments` is one subtopic and four tiles — so the wall could not
// answer a tap without widening to the cabin, and widening to the cabin handed all eight music
// tiles one shelf. Tapping Speaker Design returned four links about orchestral instruments.
//
// This is the same question asked in the child's terms, and it is here rather than in the wall's
// app because the answer is a property of the library. A shelf can only be fixed by curating
// something, so the failure belongs next to the file you would edit to fix it.
//
// `@gt100k/pursuits` is a devDependency for exactly this. It is not a runtime dependency and must
// not become one: `mvp-jul24` imports this package for its shelf and holds the engine packages as
// `import type` so they erase at build, which is why `CuratedResource.pursuits` is opaque strings.
import { PURSUITS } from "@gt100k/pursuits";
import { describe, expect, it } from "vitest";

import { curatedForPursuit } from "../src/library.js";
import { SEED_LIBRARY } from "../src/seed-library.js";
import { validateLibrary } from "../src/validate-library.js";

const IDS = PURSUITS.map((p) => p.id);

/**
 * The band the wall serves, from `apps/design-lab/app/browse/model.ts`.
 *
 * Duplicated rather than imported because an app is not a dependency of a package. If the wall
 * widens its band this test gets easier, not wrong — the risk it guards is a shelf that is empty
 * for the children who are actually looking at it, and a narrower band is the stricter check.
 */
const SHOWN_TO = ["9-11", "12-14"] as const;

describe("the browse wall's shelves", () => {
  it("names only real pursuits", () => {
    const report = validateLibrary(SEED_LIBRARY, { knownPursuits: IDS });
    expect(report.problems.filter((p) => p.code === "UNKNOWN_PURSUIT")).toEqual([]);
  });

  it("gives every pursuit a shelf", () => {
    // The dead end memo 06 §2.3 measured: an interest raised and then not maintained leaves a child
    // BELOW where they started (n = 212). A tile with an empty shelf is that, in one tap.
    const report = validateLibrary(SEED_LIBRARY, { knownPursuits: IDS });
    expect(report.problems.filter((p) => p.code === "EMPTY_PURSUIT").map((p) => p.where)).toEqual(
      [],
    );
  });

  it("puts at least three things on every shelf", () => {
    // Patall, Cooper & Robinson (2008) put the useful range at 3-5 options per choice moment. Two is
    // the validator's warning floor because one excellent resource beats three padded ones; three is
    // what the wall is built to show, so falling short of it here is a hole rather than a judgement.
    const short = IDS.map((id) => [id, curatedForPursuit(SEED_LIBRARY, id, SHOWN_TO, 5).length])
      .filter(([, n]) => (n as number) < 3)
      .map(([id, n]) => `${id} (${n})`);
    expect(short).toEqual([]);
  });

  it("does not hand one pursuit another's shelf", () => {
    // The original bug, stated as a property rather than as an example. Two tiles in a cabin may
    // legitimately share a resource — Photography and Filmmaking both want the BBC's page on how
    // digital images are made — but two tiles whose shelves are IDENTICAL means neither was tagged
    // and both are resolving against something coarser.
    const seen = new Map<string, string>();
    for (const id of IDS) {
      const shelf = curatedForPursuit(SEED_LIBRARY, id, SHOWN_TO, 5)
        .map((r) => r.id)
        .join(",");
      if (shelf === "") continue;
      const twin = seen.get(shelf);
      expect(twin, `${id} and ${twin} show the same shelf`).toBeUndefined();
      seen.set(shelf, id);
    }
  });
});
