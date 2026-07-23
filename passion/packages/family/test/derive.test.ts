import { describe, expect, it } from "vitest";
import { assessFamily } from "../src/assess.js";
import { deriveFamilySignals } from "../src/derive.js";
import {
  DOMINANT_CATALOG,
  DOMINANT_KID,
  DOMINANT_NOW,
  buildDominantSpikeProfile,
  buildDominantWellbeingReads,
} from "../src/__fixtures__/derived-child.js";

// SC-7 — deriver end-to-end: a synthetic child with a dominant, declining spike + 016 reads (a stakes
// event + a devaluation) → derived signals → assessFamily returns risk:"elevated", escalate:true.
describe("deriveFamilySignals → assessFamily (SC-7)", () => {
  const profile = buildDominantSpikeProfile(DOMINANT_NOW);
  const reads = buildDominantWellbeingReads(DOMINANT_NOW);
  const signals = deriveFamilySignals(profile, profile.store, reads, DOMINANT_NOW, DOMINANT_CATALOG);

  it("the 016 reads produced a stakes window and a devaluation", () => {
    expect(reads.some((r) => r.state === "DANGER_WINDOW")).toBe(true);
    expect(reads.some((r) => r.state === "BURNOUT_TIP")).toBe(true);
  });

  it("derives anyStakesEvent, anyDevaluation, overIdentification from the child", () => {
    expect(signals.kidId).toBe(DOMINANT_KID);
    expect(signals.anyStakesEvent).toBe(true);
    expect(signals.anyDevaluation).toBe(true);
    expect(signals.overIdentification).toBe(true);
  });

  it("assessFamily on the derived signals → elevated pressure + escalation", () => {
    const read = assessFamily(signals);
    expect(read.pressureWatch.risk).toBe("elevated");
    expect(read.escalateToHuman).toBe(true);
    expect(read.pressureWatch.antecedents.length).toBeGreaterThan(0);
    // over-identification under rising stakes is the antecedent that fired.
    expect(read.pressureWatch.antecedents).toContain("over-identification under rising stakes");
  });
});

// A healthy derived child: no 016 windows, plural spikes → baseline, no escalation.
describe("deriveFamilySignals — healthy child → baseline", () => {
  it("no stakes/devaluation reads → risk none, no escalation", () => {
    const profile = buildDominantSpikeProfile(DOMINANT_NOW);
    const signals = deriveFamilySignals(profile, profile.store, [], DOMINANT_NOW, DOMINANT_CATALOG);
    expect(signals.anyStakesEvent).toBe(false);
    expect(signals.anyDevaluation).toBe(false);
    expect(signals.anyBackOffOrRest).toBe(false);
    const read = assessFamily(signals);
    expect(read.escalateToHuman).toBe(false);
  });
});
