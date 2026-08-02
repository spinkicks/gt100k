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

  it("never admits a child below a venue's stated floor", () => {
    for (const age of [6, 9, 13]) {
      for (const p of reachableAt(age)) expect(p.minAge).toBeLessThanOrEqual(age);
    }
  });
});

/**
 * WHAT THESE REPLACED, AND WHY THE OLD ONES HAD TO GO.
 *
 * Two assertions used to guard this data by counting it: at least fifteen pursuits reachable at six,
 * and six cabins covered at six. Their own comment gave the game away — "if this number moves, the
 * world changed or somebody entered an age floor they did not verify" — because the third
 * possibility, that somebody CORRECTED a floor they had entered wrongly, breaks the test in exactly
 * the same way. The assertion constrained the data it was meant to validate. When verification found
 * robotics was 9 and not 6, the suite went red and the only ways to green it were to revert the
 * correction or to lower a different floor to compensate. A test that argues for keeping a known
 * error is worse than no test.
 *
 * The replacements assert PROVENANCE instead of distribution: every floor says where it came from,
 * verified floors carry the venue's own words, and no entry cites a standard belonging to a
 * different programme than its venue. These are claims about honesty rather than about shape. They
 * cannot be satisfied by fudging a number, they do not fight corrections, and one of them is the
 * check that would have caught the FLL Explore fault on the day it was introduced.
 */
describe("every age floor says where it came from", () => {
  it("declares a basis for every pursuit, so a fact and an opinion are never confusable", () => {
    for (const p of PURSUITS) {
      expect(["verified", "judgement"], `${p.id} must declare a basis`).toContain(p.minAgeBasis);
    }
  });

  it("backs a verified floor with the venue's own words and a page to read them on", () => {
    for (const p of PURSUITS.filter((x) => x.minAgeBasis === "verified")) {
      expect(p.minAgeQuote, `${p.id} claims verified and must quote the rule`).toBeTruthy();
      expect((p.minAgeQuote ?? "").length, `${p.id} quote too short to be a rule`).toBeGreaterThan(
        8,
      );
      // The landing page is acceptable only when the rule is genuinely on it; otherwise the page
      // actually read must be named, because a reader checking us needs to reach the same words.
      const src = p.minAgeSource ?? p.venue.url;
      expect(src.startsWith("https://"), `${p.id} needs a real source url`).toBe(true);
    }
  });

  it("keeps a judgement clean of borrowed authority", () => {
    // A judgement with a quote attached would read as verified at a glance, which is the exact
    // confusion this field exists to remove.
    for (const p of PURSUITS.filter((x) => x.minAgeBasis === "judgement")) {
      expect(p.minAgeQuote, `${p.id} is a judgement and must not quote a rule`).toBeUndefined();
    }
  });

  it("does not let judgements quietly become the whole catalogue", () => {
    // Not a distribution target: a floor is verified or it is not, and we do not get to choose. This
    // guards the opposite failure from the old assertions — that the field gets added and then every
    // entry is marked `judgement` because that requires no work, leaving the honest-looking schema
    // carrying no information at all.
    const verified = PURSUITS.filter((p) => p.minAgeBasis === "verified");
    expect(verified.length, "no floor has been verified against a venue").toBeGreaterThan(0);
  });

  it("cites no standard belonging to a different programme than its venue", () => {
    // THE CHECK THAT WOULD HAVE CAUGHT THE FLL EXPLORE FAULT. An entry named one programme's venue
    // and another programme's rubric, so the standard a child would be judged against was not the
    // standard we told them to work to. Compared on significant words rather than exact strings,
    // because a venue and its standard legitimately word themselves differently.
    const significant = (s: string): readonly string[] =>
      s
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        // Three characters and up, because the programme names most likely to be shared between a
        // venue and its standard are acronyms: RSL, FLL, AMC, USACO. A four-character floor drops
        // exactly the words that carry the match.
        .filter((w) => w.length > 2 && !STOP.has(w));

    for (const p of PURSUITS) {
      const venueWords = new Set(significant(p.venue.name));
      const standardWords = significant(p.standard);
      const shares = standardWords.some((w) => venueWords.has(w));
      // Sharing a word is sufficient but not necessary: plenty of venues run a standard under an
      // unrelated name. Where nothing is shared the entry must say why in its `note`, which is what
      // makes the mismatch a recorded decision rather than an unnoticed fault.
      if (!shares) {
        expect(
          p.note,
          `${p.id}: standard "${p.standard}" shares no word with venue "${p.venue.name}" and no note explains it`,
        ).toBeTruthy();
      }
    }
  });
});

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "your",
  "youth",
  "junior",
  "national",
  "international",
  "association",
  "federation",
  "official",
  "program",
  "programme",
  "level",
  "levels",
  "grade",
  "grades",
]);

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
