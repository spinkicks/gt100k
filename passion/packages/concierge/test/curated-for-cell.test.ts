/**
 * The lookup a surface needs, as opposed to the one a chat needs.
 *
 * `resolve` infers a domain path from a typed message, which is right when a child has typed
 * something and wrong when the surface already knows where they are standing. A shelf in the maths
 * cabin would have had to compose a sentence for `inferDomainPaths` to take back apart, and the
 * only possible outcomes of that round trip are "the same answer" and "a worse one".
 */
import { describe, expect, it } from "vitest";

import { curatedForCell } from "../src/library.js";
import { SEED_LIBRARY } from "../src/seed-library.js";
import type { CuratedResource } from "../src/model.js";

const ALL = ["6-8", "9-11", "12-14"] as const;

describe("curatedForCell", () => {
  it("finds resources for a cabin-level path", () => {
    const out = curatedForCell(SEED_LIBRARY, ["math-puzzles"], ALL);
    expect(out.length).toBeGreaterThan(0);
    for (const r of out) expect(r.domainPath[0]).toBe("math-puzzles");
  });

  it("narrows to the subtopic when given one", () => {
    const out = curatedForCell(SEED_LIBRARY, ["math-puzzles", "logic-puzzles"], ALL);
    expect(out.length).toBeGreaterThan(0);
    // A cabin-level resource covers any of its subtopics, so it is allowed through; a *different*
    // subtopic is not.
    for (const r of out) {
      expect(r.domainPath[0]).toBe("math-puzzles");
      if (r.domainPath.length > 1) expect(r.domainPath[1]).toBe("logic-puzzles");
    }
  });

  it("serves a band rather than a birthday", () => {
    // The PRD is explicit that age is not a gate, so a resource is eligible if it suits any tier the
    // surface serves.
    const young = curatedForCell(SEED_LIBRARY, ["math-puzzles"], ["6-8"]);
    const older = curatedForCell(SEED_LIBRARY, ["math-puzzles"], ["9-11", "12-14"]);
    const both = curatedForCell(SEED_LIBRARY, ["math-puzzles"], ALL, 500);

    expect(both.length).toBeGreaterThanOrEqual(Math.max(young.length, older.length));
    for (const r of young) expect(r.ageTiers).toContain("6-8");
  });

  it("ranks by reputation and breaks ties by id, like resolve does", () => {
    const out = curatedForCell(SEED_LIBRARY, ["code-computers"], ALL, 500);
    for (let i = 1; i < out.length; i++) {
      const prev = out[i - 1]!;
      const cur = out[i]!;
      if (prev.reputation === cur.reputation) expect(prev.id < cur.id).toBe(true);
      else expect(prev.reputation).toBeGreaterThan(cur.reputation);
    }
  });

  it("returns nothing for a cabin the library does not cover, rather than something adjacent", () => {
    const empty: readonly CuratedResource[] = [];
    expect(curatedForCell(empty, ["math-puzzles"], ALL)).toEqual([]);
  });

  it("honours the limit, because a shelf has finite room", () => {
    expect(curatedForCell(SEED_LIBRARY, ["math-puzzles"], ALL, 2)).toHaveLength(2);
  });
});
