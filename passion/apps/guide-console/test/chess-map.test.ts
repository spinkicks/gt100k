/**
 * The chess map, which is the first one authored under `docs/decisions/2026-07-30-mastery-scaffold.md`
 * and the one the authoring method was derived from.
 *
 * These tests are almost entirely about HONESTY rather than about structure, because the structural
 * rules already have a validator and the thing that can rot here is the claims. A map is allowed to
 * rest on our own reasoning; it is not allowed to dress that up as a published curriculum. And a map
 * of chess in particular is the one most likely to acquire a sentence implying grandmaster is a
 * normal destination, which would be a lie told to a child through an adult.
 */
import { describe, expect, it } from "vitest";
import { validateMap, type Milestone } from "@gt100k/mastery-map";

import { CONSOLE_CHESS_MAP } from "../app/maps-seed.js";
import { CHESS_RESOURCES } from "../app/maps-seed-chess-resources.js";
import { REVIEW_NOW } from "../app/maps.js";

const MS = CONSOLE_CHESS_MAP.milestones;
const byId = (id: string): Milestone => {
  const m = MS.find((x) => x.id === id);
  if (m === undefined) throw new Error(`no milestone ${id}`);
  return m;
};

describe("the chess map is fit to be in use", () => {
  it("clears the validator, which is the only gate a map has", () => {
    expect(validateMap(CONSOLE_CHESS_MAP, REVIEW_NOW).errors).toEqual([]);
  });

  it("runs from a first game to a published rating", () => {
    expect(MS.length).toBeGreaterThanOrEqual(10);
    expect(MS[0]?.requires).toEqual([]);
    expect(byId("ch-rating-that-means-something").requires.length).toBeGreaterThan(0);
  });

  it("names no prerequisite it does not contain", () => {
    const ids = new Set(MS.map((m) => m.id));
    for (const m of MS) for (const r of m.requires) expect(ids.has(r), `${m.id} → ${r}`).toBe(true);
  });
});

describe("what each ordering rests on", () => {
  it("claims a published curriculum for most of the ladder, which is why chess went first", () => {
    // Chess is the most favourable domain that exists for this: a federation, a numeric rating and a
    // curriculum in institutional use. If even chess could not reach mostly-`syllabus`, the whole
    // premise of the mastery map would be in question.
    const syllabus = MS.filter((m) => m.ordering.basis === "syllabus");
    expect(syllabus.length).toBeGreaterThanOrEqual(MS.length - 2);
  });

  it("gives every non-model ordering at least one source", () => {
    // The rule the basis type exists for: a claim to external backing has to name the external
    // thing. `model` is the only basis allowed to stand alone, and it must stand alone.
    for (const m of MS) {
      if (m.ordering.basis === "model") expect(m.ordering.sources, m.id).toEqual([]);
      else expect(m.ordering.sources.length, m.id).toBeGreaterThan(0);
    }
  });

  it("admits where the placement is the curriculum's but the content is not", () => {
    // Playing a rated game is FIDE's rulebook, which is not a progression syllabus. Only its
    // position in the ladder comes from the Steps Method, and that is a weaker claim than the
    // milestones around it, so it says so.
    expect(byId("ch-real-tournament-game").ordering.limit).toMatch(/rulebook|placement/i);
  });

  it("does not claim the research says what it does not", () => {
    // The tempting sentence here is "patterns must precede calculation". The Steps Method places
    // thinking-ahead at Step 3, and Chase & Simon found masters lose their recall advantage on
    // random positions — but neither source draws the teaching conclusion, so the map says so
    // rather than borrowing authority the citation does not carry.
    expect(byId("ch-see-ahead").ordering.limit).toMatch(/neither source says it/i);
  });

  it("refuses a contested finding even though it would support the milestone", () => {
    // Charness et al. (2005) found solitary study the strongest predictor of rating, which would
    // prop up "you can teach yourself" nicely. Howard (2011) followed 533 players for seven years
    // and found the opposite. The milestone leans on the syllabus leg alone and records the clash.
    const limit = byId("ch-teach-yourself").ordering.limit ?? "";
    expect(limit).toMatch(/Howard/);
    expect(limit).toMatch(/contested|not settled/i);
  });
});

describe("the honest ceiling", () => {
  const limit = byId("ch-rating-that-means-something").ordering.limit ?? "";

  it("says the curriculum itself tops out below the lowest title", () => {
    // The most useful honest fact available, and it comes from the publisher rather than from us:
    // all six Steps claim about 2100, and Candidate Master starts at 2200.
    expect(limit).toMatch(/2100/);
    expect(limit).toMatch(/2200/);
  });

  it("says what the grandmaster path actually costs", () => {
    // Not to discourage anybody, but because a family reading "grandmaster" without this is being
    // sold something. The youngest ever needed years of daily private coaching and norm events
    // abroad, with family spending over $200,000.
    expect(limit).toMatch(/\$200,000/);
  });

  it("names a realistic strong outcome rather than implying the top one", () => {
    expect(limit).toMatch(/Class A to Expert/i);
  });

  it("never promises a title", () => {
    const prose = JSON.stringify(CONSOLE_CHESS_MAP);
    expect(prose).not.toMatch(/\b(will|can) become a (grand)?master\b/i);
    expect(prose).not.toMatch(/\bguarantee/i);
  });
});

describe("what a child has to produce", () => {
  it("asks for an artefact at every rung, since a standing is read off work", () => {
    for (const m of MS) expect(m.demonstration.length, m.id).toBeGreaterThan(10);
  });

  it("asks for things chess pedagogy actually produces", () => {
    // Scoresheets, solved workbook pages and rated results are conventional and, for the first two,
    // syllabus-mandated. An annotated game is convention rather than curriculum, which is why it
    // appears higher up the ladder rather than at the start.
    expect(byId("ch-write-it-down").demonstration).toMatch(/scoresheet/i);
    expect(byId("ch-rating-that-means-something").demonstration).toMatch(/rating/i);
  });
});

describe("the chess resource library is real and vetted", () => {
  it("carries a substantial, distinct set of resources", () => {
    expect(CHESS_RESOURCES.length).toBeGreaterThanOrEqual(14);
    const urls = new Set(CHESS_RESOURCES.map((r) => r.url));
    expect(urls.size).toBe(CHESS_RESOURCES.length); // no duplicate URLs
  });

  it("every resource is hand-vetted with a real shape", () => {
    for (const r of CHESS_RESOURCES) {
      expect(r.provenance, r.id).toBe("curated-library:human-vetted");
      expect(r.url.startsWith("https://"), r.id).toBe(true);
      expect(r.ageTiers.length, r.id).toBeGreaterThan(0);
      expect(r.reputation, r.id).toBeGreaterThan(0);
      expect(r.pursuits, r.id).toContain("chess");
      expect(r.domainPath, r.id).toEqual(["games-strategy", "chess"]);
    }
  });
});
