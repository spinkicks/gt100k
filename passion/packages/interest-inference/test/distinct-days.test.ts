/**
 * The distinct-day gate (E6).
 *
 * `MIN_EVIDENCE_MASS` alone cannot tell three returns in one afternoon apart from three returns
 * across three weeks, and only the second is evidence of a durable interest — preference
 * hierarchies are roughly 60% stable within a single sitting against ~40% over months, so a count
 * run up inside one sitting is close to what mood alone produces. `MIN_DISTINCT_DAYS` is the gate
 * that reads the calendar instead of the counter, and it is the half of E6 that matters more.
 *
 * A day is only earned by an event that actually moved alpha or beta, and it is a UTC day.
 */
import { describe, it, expect } from "vitest";
import { foldEvents } from "../src/fold.js";
import { toBelief } from "../src/posterior.js";
import type { CellAccum } from "../src/fold.js";
import type { CellEvent, EventKind } from "../src/model.js";
import { MIN_DISTINCT_DAYS, MIN_EVIDENCE_MASS } from "../src/model.js";

const NOW = Date.parse("2026-01-08T00:00:00.000Z");
const KEY = "music-sound/audio-systems::build";

const at = (timestamp: string, kind: EventKind = "cross_day_return", novelty = false): CellEvent => ({
  domainPath: ["music-sound", "audio-systems"],
  mode: "build",
  kind,
  novelty,
  timestamp,
});

/** Midnight UTC on the given January 2026 day. */
const day = (d: number): string => `2026-01-${String(d).padStart(2, "0")}T00:00:00.000Z`;

const read = (events: readonly CellEvent[]) => toBelief(foldEvents(events, [], NOW).get(KEY)!);

/** A hand-built accumulator, for the boundary cases an event stream cannot hit exactly. */
function accum(over: Partial<CellAccum>): CellAccum {
  return {
    cellKey: KEY,
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    alphaPrior: 1,
    betaPrior: 1,
    alpha: 1,
    beta: 1,
    positiveByKind: {},
    skips: 0,
    declines: 0,
    prompted: 0,
    sameDay: 0,
    days: new Set<string>(),
    ...over,
  };
}

describe("one day is never enough (E6)", () => {
  it("three scored events on a single UTC day are not confident", () => {
    const b = read([at(day(8)), at(day(8)), at(day(8))]);
    expect(b.distinctDays).toBe(1);
    expect(b.confident).toBe(false);
  });

  it("stays not-confident on one day however much mass is piled onto it", () => {
    // Ten returns at zero age, so every recency weight is 1 and the mass floor is cleared with
    // room to spare. The child still only showed up once.
    const b = read(Array.from({ length: 10 }, () => at(day(8))));
    expect(b.evidenceMass).toBeCloseTo(10, 6);
    expect(b.evidenceMass).toBeGreaterThanOrEqual(MIN_EVIDENCE_MASS);
    expect(2 * b.sd).toBeLessThanOrEqual(0.35);
    expect(b.distinctDays).toBe(1);
    expect(b.confident).toBe(false); // the day gate is the only thing failing
  });

  it("the same evidence spread over two days, at the mass floor, is confident", () => {
    // Seven returns: four today, three yesterday. Mass = 4 + 3·0.5^(1/14) = 6.855086 ≥ 6.
    const b = read([
      ...Array.from({ length: 4 }, () => at(day(8))),
      ...Array.from({ length: 3 }, () => at(day(7))),
    ]);
    expect(b.evidenceMass).toBeCloseTo(6.855086, 5);
    expect(b.distinctDays).toBe(2);
    expect(b.confident).toBe(true);
  });
});

describe("the mass floor and the day gate are independent (E6)", () => {
  it("many distinct days do not excuse mass below the floor", () => {
    // Six returns on six consecutive days. Decay alone puts the mass at
    // 1 + 0.951695 + 0.905724 + 0.861973 + 0.820335 + 0.780709 = 5.320436 — just short of 6.
    const b = read([3, 4, 5, 6, 7, 8].map((d) => at(day(d))));
    expect(b.evidenceMass).toBeCloseTo(5.320436, 5);
    expect(b.distinctDays).toBe(6);
    expect(b.confident).toBe(false);
  });

  it("mass exactly at the floor with exactly MIN_DISTINCT_DAYS days is confident", () => {
    // alpha 7 / beta 1.5 over priors 1.5 / 1 → mass (7 − 1.5) + (1.5 − 1) = 6.0 exactly.
    const b = toBelief(
      accum({
        alphaPrior: 1.5,
        alpha: 7,
        beta: 1.5,
        days: new Set(["2026-01-07", "2026-01-08"]),
      }),
    );
    expect(b.evidenceMass).toBe(MIN_EVIDENCE_MASS);
    expect(b.distinctDays).toBe(MIN_DISTINCT_DAYS);
    expect(b.confident).toBe(true);
  });

  it("a hair below the floor, on the same two days, is not", () => {
    const b = toBelief(
      accum({
        alphaPrior: 1.5,
        alpha: 6.999999,
        beta: 1.5,
        days: new Set(["2026-01-07", "2026-01-08"]),
      }),
    );
    expect(b.evidenceMass).toBeLessThan(MIN_EVIDENCE_MASS);
    expect(b.confident).toBe(false);
  });
});

describe("only evidence that moved the belief buys a day (E6)", () => {
  const cases: ReadonlyArray<readonly [string, CellEvent]> = [
    ["prompted_return", at(day(7), "prompted_return")],
    ["same_day_engagement", at(day(7), "same_day_engagement")],
    ["a novelty-excluded return", at(day(7), "cross_day_return", true)],
    ["artifact_competence", at(day(7), "artifact_competence")],
  ];

  for (const [label, event] of cases) {
    it(`${label} contributes no distinct day`, () => {
      const withoutIt = read([at(day(8))]);
      const withIt = read([at(day(8)), event]);
      expect(withoutIt.distinctDays).toBe(1);
      // Jan 7 is a day the child was seen. It is not a day the belief moved, so it is not a day.
      expect(withIt.distinctDays).toBe(1);
      expect(withIt.alpha).toBeCloseTo(withoutIt.alpha, 12);
      expect(withIt.beta).toBeCloseTo(withoutIt.beta, 12);
    });
  }

  it("but a skip does — it moves beta, so it is evidence spread over time", () => {
    const b = read([at(day(8)), at(day(7), "skip")]);
    expect(b.distinctDays).toBe(2);
  });

  it("a cell whose every event is excluded has no days at all", () => {
    const b = read([
      at(day(6), "prompted_return"),
      at(day(7), "same_day_engagement"),
      at(day(8), "cross_day_return", true),
    ]);
    expect(b.distinctDays).toBe(0);
    expect(b.confident).toBe(false);
  });
});

describe("days are UTC days (E6)", () => {
  it("two sittings either side of local midnight, inside one UTC day, count once", () => {
    // 2026-01-05T23:30 and 2026-01-06T01:30 in UTC−05:00 — two calendar days to the child, and
    // 2026-01-06 04:30Z / 06:30Z to the engine. The engine takes no timezone, so it must answer
    // the same wherever it runs; under-counting here is the safe direction for a gate whose job
    // is to be slow to call an interest durable.
    const b = read([at("2026-01-05T23:30:00.000-05:00"), at("2026-01-06T01:30:00.000-05:00")]);
    expect(b.distinctDays).toBe(1);
  });

  it("two sittings inside one local day that straddle UTC midnight count twice", () => {
    // The same rule read the other way: 18:00 and 20:00 on 2026-01-05 in UTC−05:00 are one
    // evening to the child but 23:00Z on Jan 5 and 01:00Z on Jan 6 to the engine.
    const b = read([at("2026-01-05T18:00:00.000-05:00"), at("2026-01-05T20:00:00.000-05:00")]);
    expect(b.distinctDays).toBe(2);
  });

  it("an unparseable timestamp buys no day, though it still scores at full weight", () => {
    // `recencyWeight` declines to decay what it cannot date. A gate that is entirely a claim
    // about dates must likewise refuse to be satisfied by one.
    const b = read([at(day(8)), at("not-a-timestamp")]);
    expect(b.alpha).toBeCloseTo(3, 12); // ALPHA0 1 + 1.0 + 1.0, the second at weight 1
    expect(b.distinctDays).toBe(1);
  });
});
