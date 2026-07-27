/**
 * The crosswalk: the app's furniture, named in the taxonomy's terms.
 *
 * Emission is on as of #216, so records are being written. Every one of them is still discarded,
 * because `buildActionEvents` looks the artifact id up in a catalog and there has never been one:
 * nothing in the repo mapped `nonogram` to a domain. This is that catalog.
 *
 * It is needed because the app's own taxonomy and the product's are different on purpose. The game
 * splits `logic-games` from `math` because its seven original puzzles survive replacing every
 * numeral with an arbitrary symbol, so they measure deduction rather than mathematics. The product's
 * taxonomy models the same split one level down, as `math-puzzles/logic-puzzles` against the rest of
 * `math-puzzles`. Two taxonomies, two purposes, and this is where they meet.
 *
 * The crosswalk is allowed to disagree with the game where the product's read is finer. Chess is the
 * case: the game files it under `logic-games` for a sound reason, and the product has
 * `games-strategy/chess` exactly. A child returning to the chess puzzle is telling us about chess,
 * and routing that into `logic-puzzles` would discard it.
 */
import { type CABINS, SEED_SUBTOPICS, isCabinId, isWorkMode } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import { GADGETS } from "../gadgets/registry";
import { CATALOG, artifactFor } from "./catalog";

describe("every gadget in the room is on the map", () => {
  it("maps each one, so nothing a child can touch emits into nothing", () => {
    for (const g of GADGETS) {
      expect(artifactFor(g.id), `${g.id} has no crosswalk row`).toBeDefined();
    }
  });

  it("has no rows for gadgets that do not exist", () => {
    // A stale row is a silent lie: it resolves, so nothing fails, and it files a child's engagement
    // under a domain nothing in the app can reach.
    const ids = new Set(GADGETS.map((g) => g.id));
    for (const id of CATALOG.keys()) {
      expect(ids.has(id), `${id} is in the crosswalk but not in the registry`).toBe(true);
    }
  });
});

describe("every row names something the taxonomy actually has", () => {
  it("uses a real cabin", () => {
    for (const [id, a] of CATALOG) {
      expect(isCabinId(a.domainPath[0]), `${id} → ${a.domainPath[0]}`).toBe(true);
    }
  });

  it("uses a real subtopic where it gives one", () => {
    for (const [id, a] of CATALOG) {
      const [cabin, sub] = a.domainPath;
      if (sub === undefined) continue;
      expect(
        SEED_SUBTOPICS[cabin as (typeof CABINS)[number]].includes(sub),
        `${id} → ${cabin}/${sub} is not a subtopic`,
      ).toBe(true);
    }
  });

  it("affords at least one real work-mode, or the cell cannot form", () => {
    for (const [id, a] of CATALOG) {
      expect(a.affordedModes.length, `${id} affords nothing`).toBeGreaterThan(0);
      for (const m of a.affordedModes) expect(isWorkMode(m), `${id} → ${m}`).toBe(true);
    }
  });
});

describe("the judgement calls are pinned, so they change deliberately", () => {
  it("routes chess to games-strategy/chess and not to logic-puzzles", () => {
    // Disagrees with the game's own topic on purpose. The reasoning is in the module header; this
    // is here so a future edit has to argue with it rather than drift past it.
    expect(artifactFor("chess")?.domainPath).toEqual(["games-strategy", "chess"]);
  });

  it("routes gear-train to making-engineering, because it is mechanisms and not arithmetic", () => {
    expect(artifactFor("gear-train")?.domainPath).toEqual(["making-engineering"]);
  });

  it("keeps the deduction puzzles together under logic-puzzles", () => {
    for (const id of ["nonogram", "mirror", "pipes"]) {
      expect(artifactFor(id)?.domainPath, id).toEqual(["math-puzzles", "logic-puzzles"]);
    }
  });

  it("files the maths activities as foundations, not as competition maths", () => {
    // They are balance, ratio, fractions and functions. Competition maths is a different pursuit,
    // and filing them there would serve a child AMC papers because they liked a balance scale.
    for (const id of ["balance-scale", "fraction-laser", "function-machine", "ratio-mixing"]) {
      expect(artifactFor(id)?.domainPath, id).toEqual(["math-puzzles", "foundations"]);
    }
  });
});

describe("the catalog is what the pipeline expects", () => {
  it("marks every entry as a hand-authored gadget, since a person wrote each row", () => {
    for (const [id, a] of CATALOG) {
      expect(a.kind, id).toBe("gadget");
      expect(a.source, id).toBe("gold");
      expect(a.tagConfidence, id).toBe(1);
    }
  });
});
