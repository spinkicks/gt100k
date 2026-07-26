// Synthetic WellbeingRead fixtures (016) — a calm "ok" read and a "rest" read (rest+backOff true,
// the counter-cyclical hold case SC-5). SYNTHETIC ONLY. Reused by the broker + guardrail tests.
import type { WellbeingRead } from "../model.js";

/** In-zone, steady — no back-off, no rest (the default; new access may be brokered). */
export function okWellbeing(kidId: string, cellKey: string): WellbeingRead {
  return {
    kidId,
    cellKey,
    state: "IN_ZONE",
    challenge: "HOLD",
    pressure: "STEADY",
    backOff: false,
    rest: false,
    reduceEvaluativeSurfacing: false,
    escalateToHuman: false,
    rationale: "in the stretch zone; steady",
    guardrailNotes: [],
  };
}

/** Strained — rest + back-off true ⇒ the broker HOLDS all new access (widening = raising stakes). */
export function restWellbeing(kidId: string, cellKey: string): WellbeingRead {
  return {
    kidId,
    cellKey,
    state: "BURNOUT_TIP",
    challenge: "SCAFFOLD",
    pressure: "AUTONOMY_UP",
    backOff: true,
    rest: true,
    reduceEvaluativeSurfacing: true,
    escalateToHuman: true,
    escalationReason: "obsessive-tip signals",
    rationale: "protect rest before widening access",
    guardrailNotes: ["back off pressure before touching challenge"],
  };
}
