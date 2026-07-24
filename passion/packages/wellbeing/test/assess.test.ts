import { describe, expect, it } from "vitest";
import { assessWellbeing } from "../src/assess.js";
import type { WellbeingRead, WellbeingSignals } from "../src/model.js";
import {
  BURNOUT_TIP_SIGNALS,
  DANGER_WINDOW_SIGNALS,
  EARLY_BURNOUT_SIGNALS,
  GAP_SIGNALS,
  IN_ZONE_SIGNALS,
  OVER_CHALLENGED_SIGNALS,
  UNDER_CHALLENGED_SIGNALS,
} from "../src/__fixtures__/rows.js";

// The exact flags each §6.2 row must produce (state + two knobs + the three action flags + escalate).
type RowExpectation = Pick<
  WellbeingRead,
  "state" | "challenge" | "pressure" | "backOff" | "rest" | "reduceEvaluativeSurfacing" | "escalateToHuman"
>;

const GOLDEN: ReadonlyArray<readonly [string, WellbeingSignals, RowExpectation]> = [
  [
    "BURNOUT_TIP",
    BURNOUT_TIP_SIGNALS,
    {
      state: "BURNOUT_TIP",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      backOff: false,
      rest: true,
      reduceEvaluativeSurfacing: false,
      escalateToHuman: true,
    },
  ],
  [
    "EARLY_BURNOUT",
    EARLY_BURNOUT_SIGNALS,
    {
      state: "EARLY_BURNOUT",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      backOff: true,
      rest: false,
      reduceEvaluativeSurfacing: false,
      escalateToHuman: true,
    },
  ],
  [
    "GAP",
    GAP_SIGNALS,
    {
      state: "GAP",
      challenge: "HOLD",
      pressure: "STEADY",
      backOff: false,
      rest: false,
      reduceEvaluativeSurfacing: false,
      escalateToHuman: true,
    },
  ],
  [
    "DANGER_WINDOW",
    DANGER_WINDOW_SIGNALS,
    {
      state: "DANGER_WINDOW",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      backOff: false,
      rest: false,
      reduceEvaluativeSurfacing: true,
      escalateToHuman: false,
    },
  ],
  [
    "OVER_CHALLENGED",
    OVER_CHALLENGED_SIGNALS,
    {
      state: "OVER_CHALLENGED",
      challenge: "SCAFFOLD",
      pressure: "STEADY",
      backOff: false,
      rest: false,
      reduceEvaluativeSurfacing: false,
      escalateToHuman: false,
    },
  ],
  [
    "UNDER_CHALLENGED",
    UNDER_CHALLENGED_SIGNALS,
    {
      state: "UNDER_CHALLENGED",
      challenge: "PUSH",
      pressure: "STEADY",
      backOff: false,
      rest: false,
      reduceEvaluativeSurfacing: false,
      escalateToHuman: false,
    },
  ],
  [
    "IN_ZONE",
    IN_ZONE_SIGNALS,
    {
      state: "IN_ZONE",
      challenge: "HOLD",
      pressure: "STEADY",
      backOff: false,
      rest: false,
      reduceEvaluativeSurfacing: false,
      escalateToHuman: false,
    },
  ],
];

describe("assessWellbeing — §6.2 golden decision table", () => {
  for (const [name, signals, expected] of GOLDEN) {
    it(`row ${name}: signal bundle → exact read`, () => {
      const read = assessWellbeing(signals);
      const actual: RowExpectation = {
        state: read.state,
        challenge: read.challenge,
        pressure: read.pressure,
        backOff: read.backOff,
        rest: read.rest,
        reduceEvaluativeSurfacing: read.reduceEvaluativeSurfacing,
        escalateToHuman: read.escalateToHuman,
      };
      expect(actual).toEqual(expected);
      // Carries the passed-through identity + a plain-language rationale + guardrail notes.
      expect(read.kidId).toBe(signals.kidId);
      expect(read.cellKey).toBe(signals.cellKey);
      expect(read.rationale.length).toBeGreaterThan(0);
      expect(read.guardrailNotes.length).toBeGreaterThan(0);
    });
  }

  it("attaches an escalationReason whenever it escalates, and none otherwise", () => {
    expect(assessWellbeing(BURNOUT_TIP_SIGNALS).escalationReason).toBeTruthy();
    expect(assessWellbeing(GAP_SIGNALS).escalationReason).toBeTruthy();
    expect(assessWellbeing(IN_ZONE_SIGNALS).escalationReason).toBeUndefined();
  });

  it("invalid / empty input → safe IN_ZONE/HOLD/STEADY, never a fabricated PUSH", () => {
    // A malformed bundle (bad trend values) must not throw and must not fabricate a PUSH.
    const bad = { kidId: "x", cellKey: "y", now: "nope" } as unknown as WellbeingSignals;
    const read = assessWellbeing(bad);
    expect(read.state).toBe("IN_ZONE");
    expect(read.challenge).toBe("HOLD");
    expect(read.pressure).toBe("STEADY");
    expect(read.escalateToHuman).toBe(false);
  });
});
