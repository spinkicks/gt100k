/**
 * Sufficiency and strength are different questions, and until now one number answered both.
 *
 * `evidenceMass` is the sum of every event's weight AFTER recency decay, and it gated `confident`.
 * Because decay is geometric, a steady cadence produces a converging series with a hard ceiling: at
 * HALFLIFE_DAYS = 14, returns a fortnight apart ceiling at 2.0 against a threshold of 6, so a child
 * who came back every other week for two years could never be confident. Not "took a long time" —
 * could not, ever, at any n.
 *
 * That is the wrong shape for the question being asked. "Have we observed this child enough to say
 * something out loud" is about how much looking happened, and looking that happened does not
 * un-happen because time passed. Recency belongs in what we currently BELIEVE, which is alpha/beta
 * and therefore the mean, the bound and the marginal weighting. It does not belong in whether we
 * ever gathered enough to speak.
 *
 * So `observedMass` counts the same per-event weights with the decay factor removed, and it is what
 * `confident` gates on. `evidenceMass` keeps its decayed meaning and its job weighting the
 * marginals, where a stale cell SHOULD count for less.
 *
 * This also matters because the 013 promotion gate pulls the other way on purpose: it wants a span
 * of 56+ days containing a quiet gap of 14+ days that the child returned from. The two gates were
 * asking for incompatible things.
 */
import { describe, expect, it } from "vitest";

import { runInference } from "../src/inference.js";
import { MIN_EVIDENCE_MASS, type CellEvent } from "../src/model.js";

const NOW = Date.parse("2026-07-01T00:00:00.000Z");
const DAY = 86_400_000;

/** `n` across-day returns, `gapDays` apart, the most recent one landing on NOW. */
function steadyReturns(n: number, gapDays: number): readonly CellEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    domainPath: ["music-sound"] as const,
    mode: "build",
    kind: "cross_day_return" as const,
    novelty: false,
    timestamp: new Date(NOW - (n - 1 - i) * gapDays * DAY).toISOString(),
  }));
}

const cellOf = (events: readonly CellEvent[]) => runInference(events, [], NOW).cells[0];

describe("a durable slow pursuit can be believed (sufficiency is not decayed)", () => {
  it("a weekly returner becomes confident, which was previously impossible at any n", () => {
    // Under the old gate this child's decayed mass ceilinged at 3.41 against a threshold of 6, so
    // returning every week for a decade would not have got them there.
    const cell = cellOf(steadyReturns(12, 7));

    expect(cell?.observedMass).toBeGreaterThanOrEqual(MIN_EVIDENCE_MASS);
    expect(cell?.confident).toBe(true);
  });

  it("and their decayed mass is still below the bar, which is why this had to change", () => {
    const cell = cellOf(steadyReturns(12, 7));

    expect(cell?.evidenceMass).toBeLessThan(MIN_EVIDENCE_MASS);
  });

  it("persisting longer now moves the number, instead of converging on a ceiling", () => {
    const shorter = cellOf(steadyReturns(6, 14));
    const longer = cellOf(steadyReturns(24, 14));

    expect(longer?.observedMass).toBeGreaterThan((shorter?.observedMass ?? 0) * 2);
    // The decayed mass, by contrast, barely moves: both are pinned near the same ceiling.
    expect(Math.abs((longer?.evidenceMass ?? 0) - (shorter?.evidenceMass ?? 0))).toBeLessThan(0.2);
  });

  it("a fortnightly returner clears sufficiency but is still held back by the CI width", () => {
    // Worth pinning, because it is the honest limit of this change rather than an oversight.
    // Sufficiency is fixed: we looked plenty. The interval is a separate claim, about how PRECISE
    // the belief is, and it is computed from the decayed alpha/beta because that genuinely is what
    // we still believe. At a 14-day half-life a fortnightly cadence drives alpha to a ceiling of
    // 3.0, where 2*sd settles at 0.387 against MAX_CI_WIDTH of 0.35, and it stays there at any n.
    //
    // That is not a category error the way the mass gate was. It is the model saying, correctly,
    // that if we forget this fast then this little contact does not add up to a sharp belief. The
    // lever for it is HALFLIFE_DAYS, which is a separate decision about how fast a child's past
    // should stop counting, not something to fix by loosening the interval.
    const cell = cellOf(steadyReturns(24, 14));

    expect(cell?.observedMass).toBeGreaterThanOrEqual(MIN_EVIDENCE_MASS);
    expect(cell?.distinctDays).toBeGreaterThanOrEqual(2);
    expect(cell?.confident).toBe(false);
  });
});

describe("the gates that were doing real work still do it", () => {
  it("an afternoon's enthusiasm is still refused, however many events it contains", () => {
    // Twelve returns, all on one UTC day. Sufficiency passes now; the day gate is what stops it,
    // which is exactly the division of labour E6 intended.
    const sameDay = steadyReturns(12, 0);
    const cell = cellOf(sameDay);

    expect(cell?.observedMass).toBeGreaterThanOrEqual(MIN_EVIDENCE_MASS);
    expect(cell?.distinctDays).toBe(1);
    expect(cell?.confident).toBe(false);
  });

  it("too few observations is still too few", () => {
    const cell = cellOf(steadyReturns(3, 14));

    expect(cell?.observedMass).toBeLessThan(MIN_EVIDENCE_MASS);
    expect(cell?.confident).toBe(false);
  });

  it("novelty still buys nothing, so a first exposure cannot count toward sufficiency", () => {
    const [first, ...rest] = steadyReturns(12, 14);
    const withNovelty = [{ ...first!, novelty: true }, ...rest];

    expect(cellOf(withNovelty)?.observedMass).toBe(
      cellOf(steadyReturns(11, 14))?.observedMass ?? 0,
    );
  });
});
