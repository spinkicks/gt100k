/**
 * The golden fixtures (spec §8). Two hand-built maps, one for a domain with a real external
 * syllabus and one for a domain with none, so both anchor classes run end to end.
 *
 * Every expectation below was derived BY HAND from the rules in spec §5 before the code was run,
 * and the derivation is written out at each fixture. A golden pasted from output is a mirror of the
 * implementation rather than a check on it.
 *
 * Warnings are asserted by `code`, `severity` and `milestoneId` and not by message prose, because
 * the spec makes `code` the stable thing and says in as many words that tests key on it and not on
 * wording. The messages are still asserted to exist, since a warning with nothing to read is
 * useless to the guide it is written for.
 */
import { describe, expect, it } from "vitest";

import { GAME_DEV_MAP, PIANO_MAP } from "../src/__fixtures__/maps.js";
import type { MasteryMap, ValidationProblem } from "../src/model.js";
import { validateMap } from "../src/validate.js";

/** Fixed clock. Both fixtures were re-checked well inside STALE_AFTER_DAYS of this, so W5 is quiet
    by construction and not by the engine failing to look. */
const NOW = "2026-07-26T00:00:00.000Z";

const ALL_WARNING_CODES = [
  "W1_MODEL_HEAVY",
  "W2_NO_SYLLABUS",
  "W3_EARLY_BRANCH",
  "W4_THIN_TRUNK",
  "W5_STALE",
  "W6_CONSUMPTION_VERB",
] as const;

type WarningShape = { code: string; severity: string; milestoneId: string | undefined };

const shapes = (problems: readonly ValidationProblem[]): WarningShape[] =>
  problems.map((p) => ({ code: p.code, severity: p.severity, milestoneId: p.milestoneId }));

const REACHABLE_TODAY = ["S1_IGNITION", "S2_FOUNDATIONS"];

/**
 * Nothing above S2_FOUNDATIONS is reachable by any child today, because both higher stages need
 * `stretchSeeking` and nothing emits `chosen_challenge`. So each fixture has to hold a complete
 * path made only of trunk milestones at or below that floor. Without it the golden would assert on
 * structure no child can enter.
 */
function assertReachableTrunkPath(map: MasteryMap): void {
  const trunk = map.milestones.filter((m) => m.modes.length === 0);
  const trunkIds = new Set(trunk.map((m) => m.id));
  expect(trunk.length).toBeGreaterThan(1);
  expect(trunk.filter((m) => m.requires.length === 0)).toHaveLength(1);
  for (const m of trunk) {
    expect(REACHABLE_TODAY).toContain(m.stageFloor);
    for (const dep of m.requires) expect(trunkIds.has(dep)).toBe(true);
  }
  // And the path is complete: every trunk milestone is reached from the single root.
  const reached = new Set<string>();
  let frontier = trunk.filter((m) => m.requires.length === 0).map((m) => m.id);
  while (frontier.length > 0) {
    for (const id of frontier) reached.add(id);
    frontier = trunk
      .filter((m) => !reached.has(m.id) && m.requires.every((d) => reached.has(d)))
      .map((m) => m.id);
  }
  expect(reached.size).toBe(trunk.length);
}

function assertOnlyTheseWarningsFire(
  record: ReturnType<typeof validateMap>,
  expected: readonly string[],
): void {
  for (const code of ALL_WARNING_CODES) {
    const fired = record.warnings.some((w) => w.code === code);
    expect({ code, fired }).toEqual({ code, fired: expected.includes(code) });
  }
}

/**
 * FIXTURE 1: piano, `["music-sound", "instruments"]`, anchored to ABRSM and Trinity.
 *
 * Hand derivation, 7 milestones: 5 trunk and 2 branch; bases are syllabus x4, research x2,
 * model x1.
 *
 * Errors. E1 the graph is a chain of five trunk milestones with two branches hanging off the last
 * of them, every id resolves, no cycle. E2 every capability and demonstration is filled. E3 each
 * capability shares a content word with its own demonstration. E4 the four syllabus and two
 * research milestones each carry a source; the one model milestone carries none. E5 every resource
 * has a provenance and a tier the map claims. E6 the floors run S1, S1, S2, S2, S2 and then S3 on
 * both branches, so nothing is gated later than what it unlocks. E7 both branch modes, `perform`
 * and `compose`, are afforded by the map. E8 no field is named from the banned lists; the word
 * "score" appears in the compose milestone's PROSE, which rule 8 does not touch. E9 no prose field
 * names a time by which a child should arrive. So: zero errors.
 *
 * Warnings. W1 model share is 1/7, about 14%, under the 34% default, quiet. W2 four milestones are
 * syllabus-anchored, quiet. W3 both branches sit at S3_AUTHORSHIP, which is expert entry and not
 * below it, quiet. W4 trunk share is 5/7, about 71%, over the 20% floor, quiet. W5 re-checked
 * 55 days before NOW, inside the 90-day default, quiet. W6 the capability openers are Play, Play,
 * Sight-read, Review, Write, Perform, Write; only "Review " is a consumption opener, so W6 fires
 * exactly once, on `pf-listen-back`. That milestone is the analytic one the spec singles out, and
 * a warning is the whole point: an error-level verb list would reject the highest-yield mode.
 *
 * Expected: errors [], warnings [W6_CONSUMPTION_VERB on pf-listen-back].
 */
describe("golden: a domain WITH a real external syllabus", () => {
  const record = validateMap(PIANO_MAP, NOW);

  it("validates with zero errors", () => {
    expect(record.errors).toEqual([]);
  });

  it("fires exactly one warning, and it is the analytic capability", () => {
    expect(shapes(record.warnings)).toEqual([
      {
        code: "W6_CONSUMPTION_VERB",
        severity: "warning",
        milestoneId: "pf-listen-back",
      },
    ]);
  });

  it("fires no other warning rule", () => {
    assertOnlyTheseWarningsFire(record, ["W6_CONSUMPTION_VERB"]);
  });

  it("stamps the record with the supplied clock and the validator version", () => {
    expect(record.validatedAt).toBe(NOW);
    expect(record.validatorVersion).toBe("v1");
  });

  it("gives the guide something to read on every warning", () => {
    for (const w of record.warnings) expect(w.message.trim().length).toBeGreaterThan(0);
  });

  it("holds a complete trunk-only path a child can actually enter today", () => {
    assertReachableTrunkPath(PIANO_MAP);
  });

  it("exercises the syllabus basis with sources on every syllabus milestone", () => {
    const syllabus = PIANO_MAP.milestones.filter((m) => m.ordering.basis === "syllabus");
    expect(syllabus.length).toBeGreaterThan(0);
    for (const m of syllabus) expect(m.ordering.sources.length).toBeGreaterThan(0);
  });

  /** Rule 8 scans KEYS and never values, and this fixture proves it on real content: a published
      score is ordinary domain language and must survive. */
  it("keeps a milestone whose prose says 'score'", () => {
    const composing = PIANO_MAP.milestones.find((m) => m.id === "pf-write-your-own");
    expect(composing?.demonstration).toMatch(/score/);
    expect(record.errors.map((e) => e.code)).not.toContain("E8_BANNED_KEY");
  });
});

/**
 * FIXTURE 2: game development, `["code-computers", "game-dev"]`, no syllabus anywhere.
 *
 * Hand derivation, 7 milestones: 4 trunk and 3 branch; bases are community x4, research x1,
 * model x2, syllabus x0.
 *
 * Errors. Same walk as above. E1 a chain of four trunk milestones with three branches off the
 * last. E4 the four community and one research milestones carry sources; the two model milestones
 * carry none. E6 the floors run S1, S1, S2, S2 and then S3 on all three branches. E7 `build`,
 * `collaborate` and `debug` are all afforded. E9 the playtest milestone's reason contains the
 * number 85, which is a finding about a success rate and not a date by which a child should
 * arrive, and the rule is scoped so that it passes. So: zero errors.
 *
 * Warnings. W1 model share is 2/7, about 29%, under the 34% default, quiet, and deliberately close
 * to it because a domain with no syllabus is exactly where a map leans on the model. W2 no
 * milestone is syllabus-anchored, so it FIRES, at map level with no milestoneId. That is the
 * honest result for this domain: there is no recognised published curriculum for children making
 * games, and the map says so rather than dressing an engine tutorial up as one. W3 all three
 * branches sit at S3_AUTHORSHIP, quiet. W4 trunk share is 4/7, about 57%, quiet. W5 re-checked
 * 41 days before NOW, quiet. W6 the openers are Build, Reproduce, Run, Put, Build, Make, Profile;
 * none is a consumption opener, quiet.
 *
 * Expected: errors [], warnings [W2_NO_SYLLABUS, map level].
 */
describe("golden: a domain with NO syllabus", () => {
  const record = validateMap(GAME_DEV_MAP, NOW);

  it("validates with zero errors", () => {
    expect(record.errors).toEqual([]);
  });

  it("fires exactly one warning: nothing here is externally anchored", () => {
    expect(shapes(record.warnings)).toEqual([
      { code: "W2_NO_SYLLABUS", severity: "warning", milestoneId: undefined },
    ]);
  });

  it("fires no other warning rule", () => {
    assertOnlyTheseWarningsFire(record, ["W2_NO_SYLLABUS"]);
  });

  it("stamps the record with the supplied clock and the validator version", () => {
    expect(record.validatedAt).toBe(NOW);
    expect(record.validatorVersion).toBe("v1");
  });

  it("gives the guide something to read on every warning", () => {
    for (const w of record.warnings) expect(w.message.trim().length).toBeGreaterThan(0);
  });

  it("holds a complete trunk-only path a child can actually enter today", () => {
    assertReachableTrunkPath(GAME_DEV_MAP);
  });

  it("exercises research, community and model together and claims no syllabus", () => {
    const bases = new Set(GAME_DEV_MAP.milestones.map((m) => m.ordering.basis));
    expect([...bases].sort()).toEqual(["community", "model", "research"]);
  });

  it("carries sources on every basis that needs them and none on the model ones", () => {
    for (const m of GAME_DEV_MAP.milestones) {
      if (m.ordering.basis === "model") {
        // Empty, exactly: a model basis carrying a citation is claiming support it just disclaimed.
        expect({ id: m.id, sources: m.ordering.sources }).toEqual({ id: m.id, sources: [] });
      } else {
        expect({ id: m.id, cited: m.ordering.sources.length > 0 }).toEqual({
          id: m.id,
          cited: true,
        });
      }
    }
  });
});
