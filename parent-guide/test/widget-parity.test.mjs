import { describe, it, expect } from "vitest";
import { assessFamily } from "@gt100k/family";
import { decide } from "../widget-logic.mjs";

// The nine parent-observable booleans the widget exposes (spec §5.1).
const KEYS = [
  "anyStakesEvent", "anyDevaluation", "anyBackOffOrRest", "pressuredSpecialization",
  "overIdentification", "parentalOverValuation", "conditionalRegardObserved",
  "familyControlObserved", "lowFamilyEngagement",
];

// Build the full FamilySignals the engine expects from the widget's boolean subset.
function toSignals(bits) {
  return {
    kidId: "t", now: "2026-01-01T00:00:00.000Z",
    activeSpikes: bits.overIdentification ? 1 : 2,
    ...bits,
  };
}

describe("widget decide() is an exact mirror of assessFamily()", () => {
  it("agrees on branch-determining outputs across all 512 combinations", () => {
    for (let mask = 0; mask < (1 << KEYS.length); mask += 1) {
      const bits = {};
      KEYS.forEach((k, i) => { bits[k] = Boolean(mask & (1 << i)); });
      const read = assessFamily(toSignals(bits));
      const w = decide(bits);
      const ctx = JSON.stringify(bits);
      expect(w.risk, ctx).toBe(read.pressureWatch.risk);
      expect(w.escalate, ctx).toBe(read.escalateToHuman);
      expect(w.autonomySupport, ctx).toBe(read.posture.autonomySupport);
      expect(w.structure, ctx).toBe(read.posture.structure);
      expect(w.decouple, ctx).toBe(read.posture.decoupleWorthFromOutcome);
      expect(w.warmth, ctx).toBe(read.posture.warmth);
    }
  });
});
