/**
 * What a session must show regardless of what the model believes.
 *
 * Two findings decide this, and they pull in opposite directions.
 *
 * FALSIFIABILITY. If a surface only ever offers what the model expects a child to like, the model
 * cannot be wrong in a way anyone can see: every confirmation is one it arranged. A read that
 * cannot be disconfirmed is not a measurement. So some part of every slate has to be material the
 * model predicts against.
 *
 * BUT TRIGGERING IS NOT FREE. `06-activity-design-ages-6-8` §2.3: in a multi-session maths game
 * (n = 212) children whose situational interest was NOT maintained across sessions showed a marked
 * decline in domain interest pre-to-post — a triggered-then-abandoned domain ends up BELOW where it
 * started. The same section notes doing nothing is not neutral either: an untriggered control's
 * individual interest decayed (slope −.03, p < .001) while a triggered group's rose (+.03,
 * p < .001). "Both trigger-and-abandon and never-trigger lose ground. The only winning move is
 * trigger plus maintenance."
 *
 * So a hold-out cannot be a random probe. Showing a child something new incurs a DEBT: that domain
 * must come back, spaced, or the probe has cost them interest they had. §D5 lists three ways to
 * live with this and says not to ship coverage without picking one; this picks (ii), guarantee
 * every triggered domain a minimum number of spaced re-exposures before it may be dropped.
 *
 * Hence the ordering the tests below pin: debts first, then a falsification probe, and only a
 * genuinely new domain when nothing is owed. The engine would rather be slow to explore than
 * cheerful about abandoning things.
 */
import type { CellBelief } from "@gt100k/interest-inference";
import type { CabinId } from "@gt100k/two-axis-tagging";
import { describe, expect, it } from "vitest";

import { DEFAULT_COVERAGE_CONFIG, selectHoldOut, type Exposure } from "../src/holdout.js";

const day = (n: number): string => `2026-07-${String(n).padStart(2, "0")}T00:00:00.000Z`;
const NOW = day(30);

const belief = (domain: string, mean: number, mass = 8): CellBelief => ({
  cellKey: `${domain}::investigate`,
  domainPath: [domain],
  mode: "investigate",
  alpha: mean * 10,
  beta: (1 - mean) * 10,
  mean,
  sd: 0.05,
  lowerBound: mean - 0.05,
  evidenceMass: mass,
  observedMass: mass,
  distinctDays: 4,
  confident: true,
  attribution: null,
  supporting: [],
  disconfirming: [],
});

const seen = (domain: CabinId, days: readonly number[]): readonly Exposure[] =>
  days.map((d) => ({ domainPath: [domain] as const, timestamp: day(d) }));

const ALL = [
  "music-sound",
  "code-computers",
  "science-nature",
  "art-motion",
] as const satisfies readonly CabinId[];

describe("a slate always contains something the model bet against", () => {
  it("includes the domain the model most expects to be declined", () => {
    // Both debts paid, so neither is owed and the probe is free to be chosen. A domain still in
    // maintenance debt is offered as a debt, not as a probe, and never as both.
    const beliefs = [belief("music-sound", 0.9), belief("code-computers", 0.2)];
    const history = [
      ...seen("music-sound", [1, 8, 15, 22]),
      ...seen("code-computers", [1, 8, 15, 22]),
    ];

    const out = selectHoldOut({ beliefs, history, candidates: ALL, now: NOW });

    expect(out.probe?.[0]).toBe("code-computers");
  });

  it("names why, so a guide reading a slate is not guessing", () => {
    // Both debts paid, so neither is owed and the probe is free to be chosen. A domain still in
    // maintenance debt is offered as a debt, not as a probe, and never as both.
    const beliefs = [belief("music-sound", 0.9), belief("code-computers", 0.2)];
    const history = [
      ...seen("music-sound", [1, 8, 15, 22]),
      ...seen("code-computers", [1, 8, 15, 22]),
    ];

    const out = selectHoldOut({ beliefs, history, candidates: ALL, now: NOW });

    expect(out.reasons.get("code-computers")).toBe("falsification-probe");
  });

  it("has no probe to offer when nothing has been believed yet", () => {
    const out = selectHoldOut({ beliefs: [], history: [], candidates: ALL, now: NOW });

    expect(out.probe).toBeUndefined();
  });
});

describe("triggering a domain is a debt, and debts come first", () => {
  it("owes re-exposures to a domain shown fewer times than the minimum", () => {
    // Shown once, twenty-nine days ago, and never again. That is the shape §2.3 measured as
    // ending BELOW untouched.
    const out = selectHoldOut({
      beliefs: [],
      history: seen("art-motion", [1]),
      candidates: ALL,
      now: NOW,
    });

    expect(out.owed).toContainEqual(["art-motion"]);
    expect(out.reasons.get("art-motion")).toBe("maintenance-debt");
  });

  it("stops owing once the minimum spaced re-exposures are met", () => {
    const days = [1, 8, 15, 22];
    expect(days.length).toBeGreaterThanOrEqual(DEFAULT_COVERAGE_CONFIG.minExposures);

    const out = selectHoldOut({
      beliefs: [],
      history: seen("art-motion", days),
      candidates: ALL,
      now: NOW,
    });

    expect(out.owed).toEqual([]);
  });

  it("does not count same-day repeats toward the debt", () => {
    // Four exposures in one afternoon is one occasion. §D4's dosage is spaced exposures; a burst
    // is the thing spacing exists to exclude.
    const out = selectHoldOut({
      beliefs: [],
      history: seen("art-motion", [1, 1, 1, 1]),
      candidates: ALL,
      now: NOW,
    });

    expect(out.owed).toContainEqual(["art-motion"]);
  });

  it("counts occasions as spaced, so four consecutive days is not four exposures", () => {
    // Distinct days alone are cheap: a child sent to the same domain on Mon/Tue/Wed/Thu has had one
    // week of it, not four spaced encounters. §D4's dosage is 4-6 SPACED exposures, and spacing is
    // the part that distinguishes maintenance from a burst. With the default of one day this is a
    // no-op, so it is pinned here at a week to prove the rule exists rather than only the dedupe.
    const burst = selectHoldOut({
      beliefs: [],
      history: seen("art-motion", [1, 2, 3, 4]),
      candidates: ALL,
      now: NOW,
      config: { spacingDays: 7 },
    });
    const spread = selectHoldOut({
      beliefs: [],
      history: seen("art-motion", [1, 8, 15, 22]),
      candidates: ALL,
      now: NOW,
      config: { spacingDays: 7 },
    });

    expect(burst.owed).toContainEqual(["art-motion"]);
    expect(spread.owed).toEqual([]);
  });

  it("introduces nothing new while a debt is outstanding", () => {
    // The rule that makes this a policy rather than a preference: breadth waits for maintenance.
    const out = selectHoldOut({
      beliefs: [],
      history: seen("art-motion", [1]),
      candidates: ALL,
      now: NOW,
    });

    expect(out.fresh).toBeUndefined();
  });

  it("introduces one new domain when nothing is owed", () => {
    const settled = [...seen("music-sound", [1, 8, 15, 22]), ...seen("art-motion", [2, 9, 16, 23])];

    const out = selectHoldOut({ beliefs: [], history: settled, candidates: ALL, now: NOW });

    expect(out.fresh).toBeDefined();
    expect(["code-computers", "science-nature"]).toContain(out.fresh?.[0]);
    expect(out.reasons.get(out.fresh![0]!)).toBe("never-offered");
  });
});

describe("it is deterministic and does not thrash", () => {
  it("returns the same slate for the same inputs", () => {
    const beliefs = [belief("music-sound", 0.9), belief("code-computers", 0.2)];
    const history = seen("art-motion", [1]);
    const args = { beliefs, history, candidates: ALL, now: NOW };

    expect(selectHoldOut(args)).toEqual(selectHoldOut(args));
  });

  it("breaks ties by name, so the choice does not depend on input order", () => {
    const a = selectHoldOut({
      beliefs: [],
      history: [],
      candidates: ["science-nature", "art-motion"],
      now: NOW,
    });
    const b = selectHoldOut({
      beliefs: [],
      history: [],
      candidates: ["art-motion", "science-nature"],
      now: NOW,
    });

    expect(a.fresh).toEqual(b.fresh);
  });

  it("never offers the same domain twice in one slate", () => {
    // A domain that is both owed and the worst-predicted must appear once, not in both roles.
    const beliefs = [belief("art-motion", 0.1)];
    const out = selectHoldOut({
      beliefs,
      history: seen("art-motion", [1]),
      candidates: ALL,
      now: NOW,
    });

    const all = [...out.owed, ...(out.probe ? [out.probe] : []), ...(out.fresh ? [out.fresh] : [])];
    const keys = all.map((p) => p.join("/"));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
