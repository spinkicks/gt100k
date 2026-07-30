import { CABINS } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import {
  byId,
  inRegion,
  PURSUITS,
  reachableAlone,
  reachableAt,
  withinBudget,
} from "../src/index.js";

describe("the catalogue is well formed", () => {
  it("has a unique id for every pursuit", () => {
    const ids = PURSUITS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("files every pursuit under a real cabin", () => {
    const cabins = new Set<string>(CABINS);
    for (const p of PURSUITS) expect(cabins.has(p.cabin)).toBe(true);
  });

  it("covers every cabin, because a cabin with no pursuits is a domain no child can enter", () => {
    const covered = new Set(PURSUITS.map((p) => p.cabin));
    for (const c of CABINS) expect(covered).toContain(c);
  });

  it("gives every pursuit a named standard and a reachable venue", () => {
    // The two things that separate a pursuit from a topic. An entry missing either has failed the
    // test it was admitted under, and would tell a child the world will judge their work when
    // nothing will.
    for (const p of PURSUITS) {
      expect(p.standard.length).toBeGreaterThan(0);
      expect(p.venue.name.length).toBeGreaterThan(0);
      expect(p.venue.url).toMatch(/^https:\/\//);
    }
  });

  it("keeps every skew figure a share between zero and one, with its source", () => {
    for (const p of PURSUITS) {
      if (p.skew === undefined) continue;
      expect(p.skew.male).toBeGreaterThanOrEqual(0);
      expect(p.skew.male).toBeLessThanOrEqual(1);
      expect(p.skew.source.length).toBeGreaterThan(0);
    }
  });
});

describe("no label is a category rather than an activity", () => {
  /**
   * The failure this whole catalogue exists to fix.
   *
   * A label passes Rosch's basic level when a common action program applies to it. There is a way
   * you play chess and a way you bow a cello; there is no shared action across "board games" or
   * "instruments", so a child can neither picture doing them nor specialise in them. This cannot be
   * checked mechanically in general, so it checks the specific words that failed before — which at
   * least stops the exact regression, and names the rule for anyone adding an entry.
   */
  const SUPERORDINATES = [
    "board games",
    "instruments",
    "sports",
    "science",
    "art",
    "music",
    "coding",
    "puzzles",
    "games",
    "foundations",
    "audio systems",
  ];

  it("rejects the abstractions the taxonomy used to render", () => {
    for (const p of PURSUITS) {
      expect(SUPERORDINATES).not.toContain(p.label.toLowerCase());
    }
  });
});

describe("age is a hard filter, because a locked door is worse than no door", () => {
  it("admits far fewer pursuits at six than at fourteen", () => {
    expect(reachableAt(6).length).toBeLessThan(reachableAt(14).length / 2);
  });

  it("records how thin the bottom of the band really is", () => {
    // Not a target, a measurement. Most venues open at 10 to 13: eBird's terms bar under-13s,
    // picoCTF and the game jams are 13 by COPPA, and 4-H Cloverbuds are usually barred from the
    // competitive judging that is the reason to enter. If this number moves, the world changed or
    // somebody entered an age floor they did not verify.
    expect(reachableAt(6).length).toBeGreaterThanOrEqual(15);
    expect(reachableAt(6).length).toBeLessThanOrEqual(30);
  });

  it("never admits a child below a venue's stated floor", () => {
    for (const age of [6, 9, 13]) {
      for (const p of reachableAt(age)) expect(p.minAge).toBeLessThanOrEqual(age);
    }
  });

  it("has at least one pursuit in reach of a six-year-old in most cabins", () => {
    // Deliberately "most" and not "every". Birding genuinely has no route below thirteen, and the
    // catalogue should not invent one to make a test pass.
    const covered = new Set(reachableAt(6).map((p) => p.cabin));
    expect(covered.size).toBeGreaterThanOrEqual(6);
  });
});

describe("the unaffiliated child", () => {
  it("excludes anything needing an organisation that may not exist nearby", () => {
    for (const p of reachableAlone()) expect(p.reach).not.toBe("needs-organisation");
  });

  it("still leaves most of the catalogue, which is the point of choosing these venues", () => {
    expect(reachableAlone().length).toBeGreaterThan(PURSUITS.length * 0.8);
  });
});

describe("money and geography sort children too", () => {
  it("offers a real catalogue to a family that can spend nothing", () => {
    const free = withinBudget(0);
    expect(free.length).toBeGreaterThanOrEqual(10);
    // And spanning domains rather than concentrated in one, which was the original finding: every
    // free entry used to sit in Art & Animation, so a child with no money could only reach the art.
    expect(new Set(free.map((p) => p.cabin)).size).toBeGreaterThanOrEqual(5);
  });

  it("leaves a usable catalogue in either region", () => {
    for (const r of ["us", "uk"] as const) {
      expect(inRegion(r).length).toBeGreaterThan(PURSUITS.length * 0.6);
    }
  });
});

describe("lookup", () => {
  it("finds a pursuit by id and returns undefined for anything else", () => {
    expect(byId("chess")?.label).toBe("Chess");
    expect(byId("board-games")).toBeUndefined();
  });
});
