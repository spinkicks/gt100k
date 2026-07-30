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
 *
 * Coverage against the game's own gadget registry is NOT here. Only the app knows what furniture it
 * has, and this package must not depend on an app, so that half lives in
 * `mvp-jul24/src/signals/catalog-covers-registry.test.ts` and fails there instead.
 */
import { PURSUITS } from "@gt100k/pursuits";
import { type CABINS, SEED_SUBTOPICS, isCabinId, isWorkMode } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import { CATALOG, artifactFor, pursuitsFor } from "../src/gadgets.js";

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
    // They are balance, ratio, fractions and functions. Competition maths is a different thing on
    // the belief axis, and moving them there would put a child's engagement with a balance scale
    // into a cell about timed problem sets. The TILE they appear on is a separate question — see
    // the pursuits tests below, where the answer is different and deliberately so.
    for (const id of ["balance-scale", "fraction-laser", "function-machine", "ratio-mixing"]) {
      expect(artifactFor(id)?.domainPath, id).toEqual(["math-puzzles", "foundations"]);
    }
  });
});

describe("every gadget is reachable from a tile that exists", () => {
  // The wall offers games per pursuit, so a row naming a tile the catalogue does not have is a game
  // no child can find — silently, because nothing else in the build has an opinion about it.
  const IDS = new Set(PURSUITS.map((p) => p.id));

  it("names only real pursuits", () => {
    for (const [id] of CATALOG) {
      for (const p of pursuitsFor(id)) {
        expect(IDS.has(p), `${id} -> ${p}`).toBe(true);
      }
    }
  });

  it("leaves no gadget without a tile", () => {
    const orphans = [...CATALOG.keys()].filter((id) => pursuitsFor(id).length === 0);
    expect(orphans).toEqual([]);
  });

  it("puts the maths activities on Competition Maths even though the belief is foundations", () => {
    // The point of the two columns, pinned so it changes deliberately. There is no Foundations tile,
    // because "fractions, ratios and functions" share no action program and so are not a thing a
    // child does. The belief still lands on `foundations`; what a child reaches from the tile is the
    // shelf curated for Competition Maths, which is Beast Academy's playground and Math Kangaroo's
    // grade 1-2 papers — the right next thing for someone who liked a balance scale.
    for (const id of ["balance-scale", "fraction-laser", "function-machine", "ratio-mixing"]) {
      expect(pursuitsFor(id), id).toEqual(["competition-maths"]);
    }
  });

  it("splits the three music activities across three tiles", () => {
    // The module header records that all three land on one cell and so cannot say whether melody,
    // harmony or rhythm held a child. The tiles recover it: the cell is still one, but a child who
    // was held by rhythm found the game under Drums.
    expect(pursuitsFor("tune-repair")).toEqual(["singing"]);
    expect(pursuitsFor("chord-fit")).toEqual(["songwriting"]);
    expect(pursuitsFor("downbeat")).toEqual(["drums"]);
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
