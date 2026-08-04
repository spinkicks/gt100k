import { describe, expect, it } from "vitest";
import { assessFamily } from "../src/assess.js";
import type { FamilyRead } from "../src/model.js";
import {
  BASELINE_SIGNALS,
  CONDITIONAL_REGARD_SIGNALS,
  ELEVATED_SIGNALS,
  FAMILY_CONTROL_SIGNALS,
  LOW_ENGAGEMENT_SIGNALS,
  OVER_IDENTIFICATION_SIGNALS,
  PRESSURED_SPECIALIZATION_SIGNALS,
  RISING_STAKES_SIGNALS,
  STRAIN_SIGNALS,
} from "../src/__fixtures__/signals.js";

const ALL = [
  BASELINE_SIGNALS,
  RISING_STAKES_SIGNALS,
  STRAIN_SIGNALS,
  LOW_ENGAGEMENT_SIGNALS,
  ELEVATED_SIGNALS,
  OVER_IDENTIFICATION_SIGNALS,
  PRESSURED_SPECIALIZATION_SIGNALS,
  CONDITIONAL_REGARD_SIGNALS,
  FAMILY_CONTROL_SIGNALS,
];

const blob = (r: FamilyRead): string => JSON.stringify(r).toLowerCase();
// The ACTIONABLE recommendations only — asks + shared activities. The rationale and guardrail notes
// legitimately NEGATE terms like "reward" / "tighten control", so a violation can only live here.
const recs = (r: FamilyRead): string =>
  [...r.asks, ...r.sharedActivities].join(" | ").toLowerCase();

// SC-2 — counter-cyclical: stakes/pressure ⇒ autonomy up + decouple; never "raise pressure".
describe("guardrail: counter-cyclical (SC-2)", () => {
  it("any stakes/elevated ⇒ autonomySupport up + decoupleWorthFromOutcome, never a push", () => {
    for (const s of [RISING_STAKES_SIGNALS, ELEVATED_SIGNALS, OVER_IDENTIFICATION_SIGNALS]) {
      const r = assessFamily(s);
      expect(r.posture.autonomySupport).toBe("up");
      expect(r.posture.decoupleWorthFromOutcome).toBe(true);
    }
  });

  it("no read ever recommends raising pressure / pushing harder", () => {
    for (const s of ALL) {
      const b = recs(assessFamily(s));
      expect(b).not.toContain("push harder");
      expect(b).not.toContain("raise pressure");
      expect(b).not.toContain("tighten control");
      expect(b).not.toContain("push the child");
    }
  });
});

// SC-4 — non-contingent warmth + no gamification.
describe("guardrail: non-contingent warmth + no gamification (SC-4)", () => {
  it("posture.warmth === 'non_contingent' in every read", () => {
    for (const s of ALL) {
      expect(assessFamily(s).posture.warmth).toBe("non_contingent");
    }
  });

  it("the read/posture shape carries NO reward/streak/points/score/label field", () => {
    const r = assessFamily(BASELINE_SIGNALS);
    const readKeys = Object.keys(r).sort();
    expect(readKeys).toEqual(
      [
        "asks",
        "escalateToHuman",
        "guardrailNotes",
        "kidId",
        "posture",
        "pressureWatch",
        "rationale",
        "sharedActivities",
      ].sort(),
    );
    const postureKeys = Object.keys(r.posture).sort();
    expect(postureKeys).toEqual(
      ["autonomySupport", "decoupleWorthFromOutcome", "structure", "warmth"].sort(),
    );
    const banned = /reward|streak|points|score|leaderboard|badge|rank/;
    for (const k of [...readKeys, ...postureKeys]) expect(k).not.toMatch(banned);
  });

  it("no read ever coaches a contingent praise/reward or a gamified element", () => {
    for (const s of ALL) {
      const b = recs(assessFamily(s));
      expect(b).not.toContain("reward");
      expect(b).not.toContain("streak");
      expect(b).not.toContain("leaderboard");
      expect(b).not.toContain("points");
    }
  });
});

// SC-3 — elevated pressure escalates + names the antecedents that fired.
describe("guardrail: elevated pressure escalates (SC-3)", () => {
  // Named by what fired, not by the sentence it produces. The wording is guide-facing copy and
  // should be free to improve; what must hold is that SOMETHING is named, and that it reads as an
  // observation a person could have watched rather than a construct from a paper.
  const cases: ReadonlyArray<readonly [typeof ELEVATED_SIGNALS, string]> = [
    [ELEVATED_SIGNALS, "parental over-valuation"],
    [CONDITIONAL_REGARD_SIGNALS, "conditional regard"],
    [FAMILY_CONTROL_SIGNALS, "family control"],
    [PRESSURED_SPECIALIZATION_SIGNALS, "pressured specialization"],
    [OVER_IDENTIFICATION_SIGNALS, "over-identification"],
  ];
  for (const [signals, what] of cases) {
    it(`${what} → risk elevated + escalate + antecedent named`, () => {
      const r = assessFamily(signals);
      expect(r.pressureWatch.risk).toBe("elevated");
      expect(r.escalateToHuman).toBe(true);
      expect(r.pressureWatch.antecedents.length).toBeGreaterThan(0);
    });
  }

  it("names the antecedent in words a guide can act on", () => {
    // The load-bearing one. A guide shown "CONDITIONAL REGARD" about a real family learns nothing;
    // shown what to look for, they can recognise it or raise it with the parent.
    for (const signals of [
      ELEVATED_SIGNALS,
      CONDITIONAL_REGARD_SIGNALS,
      FAMILY_CONTROL_SIGNALS,
      PRESSURED_SPECIALIZATION_SIGNALS,
      OVER_IDENTIFICATION_SIGNALS,
    ]) {
      for (const a of assessFamily(signals).pressureWatch.antecedents) {
        expect(a).not.toMatch(
          /conditional regard|over-valuation|intrusion|specialization|identification/i,
        );
        // Long enough to be a description rather than a label.
        expect(a.split(/\s+/).length).toBeGreaterThan(4);
      }
    }
  });
});

// SC-5 — over-identification protects plurality/reversibility; never narrows to one identity.
describe("guardrail: over-identification protects plurality (SC-5)", () => {
  it("recommends keeping spikes plural + reversible, never narrowing to a single identity", () => {
    const r = assessFamily(OVER_IDENTIFICATION_SIGNALS);
    const b = blob(r);
    expect(b).toContain("plural");
    expect(b).toContain("reversible");
    expect(b).not.toContain("narrow to one");
    expect(b).not.toContain("single identity — commit");
    expect(b).not.toContain("specialize on the one");
  });
});

// SC-6 — system proposes: strain escalates; nothing is family/child-facing; no label field.
describe("guardrail: system proposes, human disposes (SC-6)", () => {
  it("strain (backOff/rest OR devaluation) ⇒ escalateToHuman", () => {
    expect(assessFamily(STRAIN_SIGNALS).escalateToHuman).toBe(true);
    expect(assessFamily({ ...BASELINE_SIGNALS, anyDevaluation: true }).escalateToHuman).toBe(true);
  });

  it("no read carries a child- or family-facing label/verdict field", () => {
    for (const s of ALL) {
      const r = assessFamily(s);
      expect(r).not.toHaveProperty("label");
      expect(r).not.toHaveProperty("verdict");
      expect(r).not.toHaveProperty("childFacing");
      expect(r).not.toHaveProperty("familyMessage");
      // the read is guide-facing; escalation routes to a human, never an auto parent message.
      expect(blob(r)).not.toContain("send to parent");
    }
  });
});
