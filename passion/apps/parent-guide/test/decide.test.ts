import { describe, it, expect } from "vitest";
import { assessFamily } from "@gt100k/family";
import { decide, SIGNAL_KEYS, type Signals } from "../app/lib/decide.js";

// Build the full FamilySignals the engine expects from the widget's boolean subset.
function toSignals(bits: Signals) {
  return {
    kidId: "t",
    now: "2026-01-01T00:00:00.000Z",
    // The engine's decide() ignores activeSpikes, so this constant does not affect parity.
    activeSpikes: 1,
    ...bits,
  };
}

describe("widget decide() is an exact mirror of assessFamily()", () => {
  it("agrees on branch-determining outputs across all 512 combinations", () => {
    for (let mask = 0; mask < 1 << SIGNAL_KEYS.length; mask += 1) {
      const bits = {} as Record<keyof Signals, boolean>;
      SIGNAL_KEYS.forEach((k, i) => {
        bits[k] = Boolean(mask & (1 << i));
      });
      const s = bits as Signals;
      const read = assessFamily(toSignals(s));
      const w = decide(s);
      const ctx = JSON.stringify(s);
      expect(w.risk, ctx).toBe(read.pressureWatch.risk);
      expect(w.escalate, ctx).toBe(read.escalateToHuman);
      expect(w.autonomySupport, ctx).toBe(read.posture.autonomySupport);
      expect(w.structure, ctx).toBe(read.posture.structure);
      expect(w.decouple, ctx).toBe(read.posture.decoupleWorthFromOutcome);
      expect(w.warmth, ctx).toBe(read.posture.warmth);
    }
  });
});
