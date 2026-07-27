/**
 * E10: the delayed out-of-product report.
 *
 * At ages 7 to 8, in-session telemetry discriminated nothing. In the arm that matches our band
 * (n = 58, 7y1m to 8y10m), condition differences appeared ONLY at delayed test
 * (F(2,48) = 7.49, p < .001, partial eta-squared .24); immediate engagement and immediate post-test
 * separated the groups not at all. So an engine that can only see what happened inside the product
 * is, for the youngest children, largely blind, and no amount of tidying the behavioural signal
 * fixes that.
 *
 * The validated instrument is a delayed adult interview at roughly seven weeks (range 32 to 67 days,
 * mean 51) that codes the interest as FOCUSED, bound to the specific materials the child was given,
 * or BROAD, transferred to the topic itself. That distinction is the wrapper-versus-domain question
 * already operationalised, which is exactly what a domain read needs.
 *
 * Only half of E10 is built here. Its other instrument, the pressure-off return, is already
 * representable: `prompted` distinguishes a self-initiated return from a surfaced one, and a
 * `cross_day_return` with `prompted: false` IS a return under no pressure. The two-week no-prompt
 * window is an operational guarantee that nobody prompts, not a thing the engine can know, and
 * building an abstraction nothing can emit is the mistake `chosen_challenge` already taught us.
 */
import { describe, expect, it } from "vitest";

import { runInference } from "../src/inference.js";
import {
  A_REPORT_BROAD,
  MIN_DISTINCT_DAYS,
  MIN_EVIDENCE_MASS,
  type CellEvent,
} from "../src/model.js";

const NOW = Date.parse("2026-07-01T00:00:00.000Z");
const DAY = 86_400_000;

const report = (
  scope: "focused" | "broad",
  daysAgo = 0,
  reporter = "parent-synthetic-1",
): CellEvent => ({
  domainPath: ["music-sound"],
  mode: "build",
  kind: "external_report",
  novelty: false,
  timestamp: new Date(NOW - daysAgo * DAY).toISOString(),
  reportScope: scope,
  reporter,
});

const returns = (n: number, gapDays = 7): readonly CellEvent[] =>
  Array.from({ length: n }, (_, i) => ({
    domainPath: ["music-sound"] as const,
    mode: "build",
    kind: "cross_day_return" as const,
    novelty: false,
    timestamp: new Date(NOW - (n - 1 - i) * gapDays * DAY).toISOString(),
  }));

const cellOf = (events: readonly CellEvent[]) => runInference(events, [], NOW).cells[0];

describe("a broad report is evidence about the topic", () => {
  it("moves the belief, because the interest transferred past the materials", () => {
    const withOut = cellOf(returns(4));
    const withIn = cellOf([...returns(4), report("broad")]);

    expect(withIn?.mean).toBeGreaterThan(withOut?.mean ?? 0);
    expect(withIn?.observedMass).toBeCloseTo((withOut?.observedMass ?? 0) + A_REPORT_BROAD, 6);
  });

  it("appears as a supporting reason a guide can read", () => {
    expect(cellOf([...returns(4), report("broad")])?.supporting).toContain("external_report");
  });
});

describe("a focused report is recorded and scores nothing", () => {
  it("does not move the belief, because it says the interest was in the materials", () => {
    // The whole point of the focused/broad coding is that only one of them is about the topic.
    // Scoring both would discard the discrimination the instrument exists to provide.
    const withOut = cellOf(returns(4));
    const withIn = cellOf([...returns(4), report("focused")]);

    expect(withIn?.mean).toBe(withOut?.mean);
    expect(withIn?.observedMass).toBe(withOut?.observedMass);
  });

  it("and is not listed as a supporting reason", () => {
    expect(cellOf([...returns(4), report("focused")])?.supporting).not.toContain("external_report");
  });
});

describe("an adult's report can never, on its own, make a child's interest confident", () => {
  it("buys no distinct day, however many reports arrive", () => {
    // The structural guarantee. `confident` needs MIN_DISTINCT_DAYS days on which the belief moved,
    // and a report is a day an ADULT spoke, not a day the child did anything. Without this, two
    // parent reports and nothing else would certify a spike, and 013 would then let a human promote
    // it. The child has to have done something.
    const many = [report("broad", 0), report("broad", 30), report("broad", 60)];

    const cell = cellOf(many);

    expect(cell?.distinctDays).toBe(0);
    expect(cell?.confident).toBe(false);
  });

  it("not even when the reports clear the sufficiency floor on their own", () => {
    const enough = Array.from({ length: Math.ceil(MIN_EVIDENCE_MASS / A_REPORT_BROAD) }, (_, i) =>
      report("broad", i * 3),
    );

    const cell = cellOf(enough);

    expect(cell?.observedMass).toBeGreaterThanOrEqual(MIN_EVIDENCE_MASS);
    expect(cell?.distinctDays).toBeLessThan(MIN_DISTINCT_DAYS);
    expect(cell?.confident).toBe(false);
  });

  it("but it can strengthen a belief the child's own behaviour already earned", () => {
    const behaviourOnly = cellOf(returns(8));
    const both = cellOf([...returns(8), report("broad")]);

    expect(behaviourOnly?.confident).toBe(true);
    expect(both?.confident).toBe(true);
    expect(both?.lowerBound).toBeGreaterThan(behaviourOnly?.lowerBound ?? 0);
  });
});

describe("it stays separable from behaviour", () => {
  it("keeps the reporter, so a report is always attributable to a person", () => {
    const events = [report("broad", 0, "guide-synthetic-2")];

    // The kind is the filter an analysis uses to exclude reports; the reporter is who stands behind
    // this one. A report with no one behind it would be an anonymous opinion moving a child's read.
    expect(events[0]?.reporter).toBe("guide-synthetic-2");
    expect(cellOf(events)?.observedMass).toBeCloseTo(A_REPORT_BROAD, 6);
  });

  it("decays like everything else, so a year-old report is not a current one", () => {
    const fresh = cellOf([...returns(4), report("broad", 0)]);
    const stale = cellOf([...returns(4), report("broad", 180)]);

    expect(fresh?.mean).toBeGreaterThan(stale?.mean ?? 0);
    // But sufficiency is not decayed, so both still count as having been observed.
    expect(fresh?.observedMass).toBeCloseTo(stale?.observedMass ?? 0, 6);
  });
});
