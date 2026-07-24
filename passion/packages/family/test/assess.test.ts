import { describe, expect, it } from "vitest";
import { assessFamily } from "../src/assess.js";
import { MAX_ASKS, MAX_SHARED_ACTIVITIES } from "../src/model.js";
import {
  BASELINE_SIGNALS,
  ELEVATED_SIGNALS,
  LOW_ENGAGEMENT_SIGNALS,
  RISING_STAKES_SIGNALS,
  STRAIN_SIGNALS,
} from "../src/__fixtures__/signals.js";

// SC-1: each of the 5 §3.3 postures → the exact posture + pressureWatch.risk + escalateToHuman.
describe("assessFamily — the 5 §3.3 postures (SC-1)", () => {
  it("1. elevated pressure → risk elevated, autonomy up / structure steady, decouple, escalate", () => {
    const r = assessFamily(ELEVATED_SIGNALS);
    expect(r.pressureWatch.risk).toBe("elevated");
    expect(r.posture.autonomySupport).toBe("up");
    expect(r.posture.structure).toBe("steady");
    expect(r.posture.warmth).toBe("non_contingent");
    expect(r.posture.decoupleWorthFromOutcome).toBe(true);
    expect(r.escalateToHuman).toBe(true);
    expect(r.escalationReason).toBeTruthy();
    expect(r.pressureWatch.antecedents).toContain("parental over-valuation");
  });

  it("2. rising stakes → risk watch, autonomy up / structure steady, decouple, NO escalation", () => {
    const r = assessFamily(RISING_STAKES_SIGNALS);
    expect(r.pressureWatch.risk).toBe("watch");
    expect(r.posture.autonomySupport).toBe("up");
    expect(r.posture.structure).toBe("steady");
    expect(r.posture.decoupleWorthFromOutcome).toBe(true);
    expect(r.escalateToHuman).toBe(false);
  });

  it("3. strain present → risk watch, autonomy up / structure steady, escalate", () => {
    const r = assessFamily(STRAIN_SIGNALS);
    expect(r.pressureWatch.risk).toBe("watch");
    expect(r.posture.autonomySupport).toBe("up");
    expect(r.posture.structure).toBe("steady");
    expect(r.escalateToHuman).toBe(true);
    expect(r.escalationReason).toBeTruthy();
  });

  it("4. low family engagement → risk none, autonomy steady / structure up, shared activities, no escalation", () => {
    const r = assessFamily(LOW_ENGAGEMENT_SIGNALS);
    expect(r.pressureWatch.risk).toBe("none");
    expect(r.posture.autonomySupport).toBe("steady");
    expect(r.posture.structure).toBe("up");
    expect(r.escalateToHuman).toBe(false);
    expect(r.sharedActivities.length).toBeGreaterThan(0);
  });

  it("5. baseline healthy → risk none, autonomy steady / structure steady, no decouple, no escalation", () => {
    const r = assessFamily(BASELINE_SIGNALS);
    expect(r.pressureWatch.risk).toBe("none");
    expect(r.posture.autonomySupport).toBe("steady");
    expect(r.posture.structure).toBe("steady");
    expect(r.posture.decoupleWorthFromOutcome).toBe(false);
    expect(r.escalateToHuman).toBe(false);
    expect(r.pressureWatch.antecedents).toEqual([]);
  });
});

describe("assessFamily — shape + caps", () => {
  it("every read carries a rationale, guardrail notes, and capped asks/activities", () => {
    for (const s of [
      ELEVATED_SIGNALS,
      RISING_STAKES_SIGNALS,
      STRAIN_SIGNALS,
      LOW_ENGAGEMENT_SIGNALS,
      BASELINE_SIGNALS,
    ]) {
      const r = assessFamily(s);
      expect(r.kidId).toBe(s.kidId);
      expect(r.rationale.length).toBeGreaterThan(0);
      expect(r.guardrailNotes.length).toBeGreaterThan(0);
      expect(r.asks.length).toBeLessThanOrEqual(MAX_ASKS);
      expect(r.sharedActivities.length).toBeLessThanOrEqual(MAX_SHARED_ACTIVITIES);
    }
  });

  it("invalid input falls back to the safe baseline (risk none, no escalation, never 'push harder')", () => {
    // deliberately malformed input
    const r = assessFamily({ kidId: 42 } as unknown as typeof BASELINE_SIGNALS);
    expect(r.pressureWatch.risk).toBe("none");
    expect(r.posture.autonomySupport).toBe("steady");
    expect(r.posture.warmth).toBe("non_contingent");
    expect(r.escalateToHuman).toBe(false);
    const blob = JSON.stringify(r).toLowerCase();
    expect(blob).not.toContain("push harder");
  });
});
