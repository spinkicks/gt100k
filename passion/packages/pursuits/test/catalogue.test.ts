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

/**
 * The second admission test (`docs/decisions/2026-07-30-catalogue-scope.md`), which asks a different
 * question from every other test in this file: not what a child can enter now, but what an
 * admissions reader can check at seventeen.
 */
describe("the later ceiling, which is not the same question as the venue", () => {
  it("names a ceiling for nearly every pursuit, and absence stays rare enough to mean something", () => {
    // Not "every": absence is a real state with a documented meaning, and asteroid hunting is the
    // case that proves it — its terminal honour arrives six to ten years after the application, so
    // there is genuinely nothing above the venue. But if absence became common the field would stop
    // carrying information, so it is bounded rather than banned.
    const without = PURSUITS.filter((p) => p.ceiling === undefined).map((p) => p.id);
    expect(without.length).toBeLessThan(PURSUITS.length * 0.1);
  });

  it("gives every ceiling that exists a name and a real url", () => {
    for (const p of PURSUITS) {
      if (p.ceiling === undefined) continue;
      expect(p.ceiling.name.length, p.id).toBeGreaterThan(3);
      expect(p.ceiling.url, p.id).toMatch(/^https?:\/\//);
    }
  });

  it("keeps the ceiling distinct from the venue, rather than restating it", () => {
    // If a ceiling were allowed to be the same venue, the field would record nothing and the two
    // tests would silently collapse into one.
    const same = PURSUITS.filter((p) => p.ceiling?.url === p.venue.url).map((p) => p.id);
    expect(same).toEqual([]);
  });

  it("records the age gap rather than hiding it", () => {
    // The audit's own strongest finding: Scholastic opens at 13, YoungArts at 15, Presidential
    // Scholar needs a graduating senior. So for most of a child's time in this product the ceiling
    // is out of reach, and a majority of entries should show that on their face. If this ever falls
    // to zero, either the data has been flattened or somebody has quietly set every `opensAt` to 0.
    const later = PURSUITS.filter((p) => (p.ceiling?.opensAt ?? 0) > p.minAge);
    expect(later.length).toBeGreaterThan(PURSUITS.length / 2);
  });

  it("keeps every ceiling a pre-college distinction", () => {
    // The field exists to describe what a reader can see on an application, so a distinction that
    // only opens at university is the wrong thing in this slot however impressive it is. That was
    // the mistake that disqualified Speaker Design: the one competition naming loudspeaker design
    // requires college enrolment.
    for (const p of PURSUITS) {
      expect(p.ceiling?.opensAt ?? 0, p.id).toBeLessThanOrEqual(18);
    }
  });

  it("allows a ceiling to open before the pursuit's own floor, because they are different floors", () => {
    // Not a bug, and worth an assertion so nobody 'fixes' it. `minAge` is our effective judgement
    // about the pursuit; `opensAt` is one venue's stated rule. Birding sits at 13 because eBird bars
    // under-13s, while the ABA Young Birder award takes entrants from 10 — so a ten-year-old can win
    // the award and still not be allowed the tool. Both numbers are right.
    const earlier = PURSUITS.filter(
      (p) => p.ceiling !== undefined && p.ceiling.opensAt !== 0 && p.ceiling.opensAt < p.minAge,
    ).map((p) => p.id);
    expect(earlier).toContain("birding");
  });

  it("has no ceiling for a pursuit that was cut", () => {
    // Guards the removal itself. Each of these failed the second test on a structural fact, and the
    // failure mode is somebody restoring one for a reason that is really about taste.
    const cut = [
      "sudoku",
      "ciphers",
      "pokemon-tcg",
      "backgammon",
      "demoscene",
      "speaker-design",
      "weather",
    ];
    expect(PURSUITS.filter((p) => cut.includes(p.id))).toEqual([]);
  });
});
