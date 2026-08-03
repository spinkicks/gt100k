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
  | "state"
  | "challenge"
  | "pressure"
  | "backOff"
  | "rest"
  | "reduceEvaluativeSurfacing"
  | "escalateToHuman"
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

describe("assessWellbeing — discovery phase gate (pressureActive)", () => {
  // The four signal bundles that land on a PRESSURE state; each must be HELD in discovery.
  const PRESSURE_ROWS: ReadonlyArray<readonly [string, WellbeingSignals]> = [
    ["BURNOUT_TIP", BURNOUT_TIP_SIGNALS],
    ["EARLY_BURNOUT", EARLY_BURNOUT_SIGNALS],
    ["GAP", GAP_SIGNALS],
    ["DANGER_WINDOW", DANGER_WINDOW_SIGNALS],
  ];

  // The three CHALLENGE bundles, which must be IDENTICAL in both phases (the gate never touches them).
  const CHALLENGE_ROWS: ReadonlyArray<readonly [string, WellbeingSignals]> = [
    ["OVER_CHALLENGED", OVER_CHALLENGED_SIGNALS],
    ["UNDER_CHALLENGED", UNDER_CHALLENGED_SIGNALS],
    ["IN_ZONE", IN_ZONE_SIGNALS],
  ];

  for (const [name, signals] of PRESSURE_ROWS) {
    it(`discovery holds ${name}: falls through to IN_ZONE, no escalation, note carried`, () => {
      const read = assessWellbeing(signals, { pressureActive: false });
      // Only the always-on challenge calibration can fire; with no challenge signal it is IN_ZONE.
      expect(read.state).toBe("IN_ZONE");
      expect(read.challenge).toBe("HOLD");
      expect(read.pressure).toBe("STEADY");
      // The whole point: a spike being sampled never routes a burnout escalation to a human.
      expect(read.escalateToHuman).toBe(false);
      expect(read.escalationReason).toBeUndefined();
      // The held gate is visible on the read, not merely inferred from the absent pressure state.
      expect(read.guardrailNotes.some((n) => n.includes("discovery"))).toBe(true);
    });

    it(`specialization (pressureActive:true) preserves ${name} exactly like the default`, () => {
      const gated = assessWellbeing(signals, { pressureActive: true });
      const def = assessWellbeing(signals);
      expect(gated).toEqual(def);
      expect(gated.state).toBe(name);
      // No held-gate note when the pressure half is live.
      expect(gated.guardrailNotes.some((n) => n.includes("discovery"))).toBe(false);
    });
  }

  for (const [name, signals] of CHALLENGE_ROWS) {
    it(`challenge state ${name} is identical in discovery and specialization`, () => {
      const discovery = assessWellbeing(signals, { pressureActive: false });
      const specialization = assessWellbeing(signals, { pressureActive: true });
      expect(discovery.state).toBe(name);
      // The gate leaves the read untouched apart from the informational held note.
      expect({ ...discovery, guardrailNotes: [] }).toEqual({
        ...specialization,
        guardrailNotes: [],
      });
    });
  }
});
