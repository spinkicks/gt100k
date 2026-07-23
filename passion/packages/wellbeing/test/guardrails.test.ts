// The non-negotiable guardrail invariants (spec §3.4 / SC-2..SC-6). These are safety rules, not
// nice-to-haves — do NOT loosen them.
import { describe, expect, it } from "vitest";
import { assessWellbeing } from "../src/assess.js";
import type { WellbeingRead, WellbeingSignals } from "../src/model.js";

const NOW = "2026-04-01T00:00:00.000Z";
const sig = (over: Partial<WellbeingSignals>): WellbeingSignals => ({
  kidId: "kid-synthetic-001",
  cellKey: "music-sound/audio-systems::build",
  returnTrend: "stable",
  depthTrend: "stable",
  now: NOW,
  ...over,
});

// The keys a `WellbeingRead` is ALLOWED to carry. If any reward/streak/score/child-facing key ever
// appears, this set makes the leak a hard failure (guardrail: never gamify; no child-facing label).
const ALLOWED_KEYS = new Set([
  "kidId",
  "cellKey",
  "state",
  "challenge",
  "pressure",
  "backOff",
  "rest",
  "reduceEvaluativeSurfacing",
  "escalateToHuman",
  "escalationReason",
  "rationale",
  "guardrailNotes",
]);
const BANNED_SUBSTRINGS = ["score", "streak", "point", "reward", "prize", "leaderboard", "badge", "level"];

describe("guardrail invariants", () => {
  it("SC-2 devaluation outranks exhaustion: both present → BURNOUT_TIP (rest+escalate), not EARLY_BURNOUT", () => {
    const read = assessWellbeing(
      sig({ returnTrend: "declining", depthTrend: "declining", devaluation: true, exhaustion: true }),
    );
    expect(read.state).toBe("BURNOUT_TIP");
    expect(read.rest).toBe(true);
    expect(read.backOff).toBe(false);
    expect(read.escalateToHuman).toBe(true);
    expect(read.guardrailNotes).toContain("weight devaluation over exhaustion");
  });

  it("SC-3 push only from strength: high successRate but flat return / no stretch → NOT PUSH (→ IN_ZONE/HOLD)", () => {
    // high success, but return is flat and there is no stretch-seeking → must not push.
    const flat = assessWellbeing(sig({ returnTrend: "stable", depthTrend: "stable", successRate: 0.98 }));
    expect(flat.challenge).not.toBe("PUSH");
    expect(flat.state).toBe("IN_ZONE");
    // high success, rising return, but NO stretch-seeking → still not a push.
    const noStretch = assessWellbeing(
      sig({ returnTrend: "rising", depthTrend: "rising", successRate: 0.98 }),
    );
    expect(noStretch.challenge).not.toBe("PUSH");
    // high success but DECLINING return → not a push.
    const declining = assessWellbeing(
      sig({ returnTrend: "declining", depthTrend: "declining", successRate: 0.98, stretchSeeking: true }),
    );
    expect(declining.challenge).not.toBe("PUSH");
  });

  it("SC-4 missingness → no PUSH, no auto-nudge; escalate for a human check-in; never a label", () => {
    const read = assessWellbeing(sig({ missing: true }));
    expect(read.state).toBe("GAP");
    expect(read.challenge).toBe("HOLD"); // never PUSH
    expect(read.pressure).toBe("STEADY");
    expect(read.escalateToHuman).toBe(true);
    expect(read.escalationReason).toBeTruthy();
    // No back-off / rest is auto-applied to the child from a gap.
    expect(read.backOff).toBe(false);
    expect(read.rest).toBe(false);
  });

  it("SC-5 counter-cyclical: stakesEvent → AUTONOMY_UP + reduceEvaluativeSurfacing, never PUSH/streaks", () => {
    // even alongside otherwise strong (push-worthy) signals, a stakes event wins and never pushes.
    const read = assessWellbeing(
      sig({
        returnTrend: "rising",
        depthTrend: "rising",
        successRate: 0.98,
        stretchSeeking: true,
        stakesEvent: true,
      }),
    );
    expect(read.state).toBe("DANGER_WINDOW");
    expect(read.pressure).toBe("AUTONOMY_UP");
    expect(read.reduceEvaluativeSurfacing).toBe(true);
    expect(read.challenge).not.toBe("PUSH");
  });

  it("SC-6 system proposes, human disposes: every rest/backOff sets escalateToHuman", () => {
    const rest = assessWellbeing(sig({ devaluation: true }));
    expect(rest.rest).toBe(true);
    expect(rest.escalateToHuman).toBe(true);
    const backOff = assessWellbeing(
      sig({ exhaustion: true, returnTrend: "declining", depthTrend: "declining" }),
    );
    expect(backOff.backOff).toBe(true);
    expect(backOff.escalateToHuman).toBe(true);
  });

  it("SC-6 no output ever carries a child-facing label / score / reward field", () => {
    const samples: WellbeingRead[] = [
      assessWellbeing(sig({ devaluation: true })),
      assessWellbeing(sig({ exhaustion: true, returnTrend: "declining", depthTrend: "declining" })),
      assessWellbeing(sig({ missing: true })),
      assessWellbeing(sig({ stakesEvent: true })),
      assessWellbeing(sig({ successRate: 0.4 })),
      assessWellbeing(sig({ returnTrend: "rising", depthTrend: "rising", successRate: 0.95, stretchSeeking: true })),
      assessWellbeing(sig({})),
    ];
    for (const read of samples) {
      for (const key of Object.keys(read)) {
        expect(ALLOWED_KEYS.has(key)).toBe(true);
        for (const banned of BANNED_SUBSTRINGS) {
          expect(key.toLowerCase()).not.toContain(banned);
        }
      }
    }
  });
});
