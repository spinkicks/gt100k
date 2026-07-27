/**
 * The shipped library's own health, pinned.
 *
 * These are not tests of `validateLibrary` (that has its own file). They are tests of the CONTENT,
 * and they exist because a curated library degrades quietly: an entry gets edited, a subtopic gets
 * added to the taxonomy, someone pads a shelf to make a warning go away, and nothing fails until a
 * child taps a subtopic and finds nothing there.
 *
 * URL liveness is deliberately NOT here. It needs the network, and a gate that fails because
 * someone else's server is down is a gate people learn to ignore. `scripts/check-links.ts` does
 * that on a schedule instead. Pew (2024) puts the stakes on it: about one in five pages from 2021
 * were gone within two years, so this file is necessary and nowhere near sufficient.
 */
import { CABINS, SEED_SUBTOPICS } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import { asArtifact } from "../src/as-artifact.js";
import { SEED_LIBRARY } from "../src/seed-library.js";
import { validateLibrary } from "../src/validate-library.js";

describe("the shipped library", () => {
  it("has no errors at all", () => {
    const report = validateLibrary(SEED_LIBRARY);

    // Printed rather than merely asserted: a failure here should tell you WHICH entry, not just
    // that the count moved.
    expect(report.problems.map((p) => `${p.code} ${p.where}: ${p.detail}`)).toEqual([]);
    expect(report.ok).toBe(true);
  });

  it("leaves no subtopic empty, which is the failure a child would actually meet", () => {
    for (const cabin of CABINS) {
      for (const sub of SEED_SUBTOPICS[cabin]) {
        const here = SEED_LIBRARY.filter(
          (r) => r.domainPath[0] === cabin && r.domainPath[1] === sub,
        );
        expect(here.length, `${cabin}/${sub} has nothing behind it`).toBeGreaterThan(0);
      }
    }
  });

  it("gives every subtopic a real choice, not a single take-it-or-leave-it link", () => {
    // Patall et al. (2008) put the useful range at 3-5 options per choice moment. Two is the floor
    // below which a child who does not like the first has nowhere to go but back.
    for (const cabin of CABINS) {
      for (const sub of SEED_SUBTOPICS[cabin]) {
        const here = SEED_LIBRARY.filter(
          (r) => r.domainPath[0] === cabin && r.domainPath[1] === sub,
        );
        expect(here.length, `${cabin}/${sub} is a shelf of ${here.length}`).toBeGreaterThanOrEqual(
          2,
        );
      }
    }
  });

  it("every entry can become an artifact, so the whole library is measurable", () => {
    // If an entry cannot project onto an Artifact, a child engaging with it emits nothing and the
    // engine never learns they were there.
    for (const r of SEED_LIBRARY) {
      expect(() => asArtifact(r), `${r.id} cannot be tagged`).not.toThrow();
    }
  });

  it("uses https everywhere, since a child follows these off our site", () => {
    for (const r of SEED_LIBRARY) {
      expect(r.url.startsWith("https://"), `${r.id} is not https`).toBe(true);
    }
  });

  it("keeps ids and urls unique", () => {
    expect(new Set(SEED_LIBRARY.map((r) => r.id)).size).toBe(SEED_LIBRARY.length);
    expect(new Set(SEED_LIBRARY.map((r) => r.url)).size).toBe(SEED_LIBRARY.length);
  });

  it("uses more than one mode, so the second axis is not dead on arrival", () => {
    // A launcher's only mode signal is which resource a child picks. If everything afforded the
    // same mode there would be no signal to read.
    const modes = new Set(SEED_LIBRARY.flatMap((r) => r.affordedModes));

    expect(modes.size).toBeGreaterThanOrEqual(5);
  });
});
