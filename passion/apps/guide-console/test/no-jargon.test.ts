/**
 * Words a guide should never have to look up.
 *
 * The console is read by homeschool parents and teachers, not by the people who wrote the papers.
 * Its readability score has always been fine, around grade six or seven, which is why "make it
 * simpler" kept producing no change: the sentences were never the problem. The problem is that
 * short sentences made of terms of art still do not parse. "Ignition", "practice dose", "producer
 * identity" and "CONDITIONAL REGARD" are all precise, all correct, and all opaque to the person
 * holding the screen.
 *
 * This test guards the labels rather than the prose, because labels are where jargon survives
 * longest: nobody rereads a lookup table.
 */
import { describe, expect, it } from "vitest";

import { evidenceBand } from "../app/components.js";
import { assessFamily } from "@gt100k/family";
import { assessWellbeing } from "@gt100k/wellbeing";

/** Terms that carry meaning in a paper and none at a kitchen table. */
const JARGON =
  /\b(ignition|authorship|signature stage|producer identity|relatedness|self-regulation|conditional regard|over-valuation|antecedent|counter-cyclical|evaluative surfacing|setpoint|scaffold|deload|rage to master|lower.?bound|evidence mass|posterior|cell key|work-mode|type iii|pcde|dp dose)\b/i;

describe("evidence strength is not a grade", () => {
  it("reads as words, never a percentage", () => {
    // A teacher shown 80% ranks children by it and chases a hundred. The figure is a Beta lower
    // bound over a handful of events and cannot carry that weight.
    for (const v of [0, 0.2, 0.44, 0.45, 0.69, 0.7, 0.99, 1]) {
      expect(evidenceBand(v)).not.toMatch(/\d/);
      expect(evidenceBand(v).length).toBeGreaterThan(2);
    }
  });

  it("separates a thin read from a strong one", () => {
    expect(evidenceBand(0.9)).not.toBe(evidenceBand(0.1));
  });

  it("never implies the child is good at the thing", () => {
    // Evidence strength says how much we have seen, not how well they did. A band called
    // "Excellent" would quietly turn a measure of attention into a measure of talent.
    for (const v of [0, 0.5, 1]) {
      expect(evidenceBand(v)).not.toMatch(/good|great|excellent|poor|weak|high|low/i);
    }
  });
});

describe("what the engines hand the guide", () => {
  it("keeps research vocabulary out of family antecedents", () => {
    // The worst offender before this: a card about a real family reading "CONDITIONAL REGARD".
    const read = assessFamily({
      kidId: "k",
      parentalOverValuation: true,
      conditionalRegardObserved: true,
      familyControlObserved: true,
      overIdentification: true,
      pressuredSpecialization: true,
      anyStakesEvent: true,
      anyDevaluation: true,
    } as never);
    for (const a of read.pressureWatch.antecedents) {
      expect(a).not.toMatch(JARGON);
    }
  });

  it("keeps it out of the wellbeing rationale a guide reads", () => {
    const reads = [
      assessWellbeing(
        {
          kidId: "k",
          cellKey: "c",
          returnTrend: "rising",
          depthTrend: "rising",
          successRate: 0.95,
          stretchSeeking: true,
          now: "2026-08-04T00:00:00.000Z",
        } as never,
        { pressureActive: true },
      ),
      assessWellbeing(
        {
          kidId: "k",
          cellKey: "c",
          returnTrend: "stable",
          depthTrend: "stable",
          successRate: 0.2,
          now: "2026-08-04T00:00:00.000Z",
        } as never,
        { pressureActive: true },
      ),
    ];
    for (const r of reads) {
      expect(r.rationale).not.toMatch(JARGON);
      // And short enough to read at a glance between children.
      expect(r.rationale.split(/\s+/).length).toBeLessThan(45);
    }
  });
});
