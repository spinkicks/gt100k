// The pure, priority-ordered wellbeing decision engine (spec 016-wellbeing §3.3).
//
// Evaluate the seven §6.2 states in a DETERMINISTIC priority (highest first); the FIRST match wins:
//   1 BURNOUT_TIP → 2 EARLY_BURNOUT → 3 GAP → 4 DANGER_WINDOW → 5 OVER_CHALLENGED
//   → 6 UNDER_CHALLENGED → 7 IN_ZONE.
// The engine only PROPOSES: `rest`/`backOff` ALWAYS escalate to a human, nothing is applied to the
// child, and no state ever yields a child-facing label/score/reward. Any invalid/thrown input falls
// back to the SAFE default (IN_ZONE/HOLD/STEADY, no escalation) — it NEVER fabricates a PUSH.
import {
  SCAFFOLD_SUCCESS,
  type Trend,
  type WellbeingRead,
  type WellbeingSignals,
  type WellbeingState,
} from "./model.js";

const TRENDS = new Set<Trend>(["rising", "stable", "declining"]);
const isTrend = (x: unknown): x is Trend => typeof x === "string" && TRENDS.has(x as Trend);

// A never-gamify note carried on every read as a standing reminder of the contract.
const NEVER_GAMIFY = "never gamify; no child-facing label or score";
const HUMAN_DISPOSES = "system proposes, human disposes";

interface Decision {
  readonly state: WellbeingState;
  readonly challenge: WellbeingRead["challenge"];
  readonly pressure: WellbeingRead["pressure"];
  readonly backOff?: boolean;
  readonly rest?: boolean;
  readonly reduceEvaluativeSurfacing?: boolean;
  readonly escalate?: boolean;
  readonly escalationReason?: string;
  readonly rationale: string;
  readonly notes: readonly string[];
}

/** Pick the winning state from the priority-ordered table. */
function decide(s: WellbeingSignals): Decision {
  const returnTrend: Trend = isTrend(s.returnTrend) ? s.returnTrend : "stable";
  const depthTrend: Trend = isTrend(s.depthTrend) ? s.depthTrend : "stable";
  const successKnown = typeof s.successRate === "number" && !Number.isNaN(s.successRate);
  const success = successKnown ? (s.successRate as number) : undefined;

  // 1. BURNOUT_TIP: quiet devaluation (weighted HIGHEST) or an obsessive tip.
  if (s.devaluation === true || s.obsessiveTip === true) {
    return {
      state: "BURNOUT_TIP",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      rest: true,
      escalate: true,
      escalationReason:
        "Possible devaluation or an obsessive tip. A human should decide on a guilt-free, reversible break, and broaden identity by re-opening plural spikes.",
      rationale:
        "Presence without depth (or an obsessive tip) is the earliest alarm. Hold the challenge, lift pressure (more autonomy), and hand this to a mentor for a guilt-free, reversible rest.",
      notes: ["weight devaluation over exhaustion", HUMAN_DISPOSES, NEVER_GAMIFY],
    };
  }

  // 2. EARLY_BURNOUT: an exhaustion pattern with declining depth AND return.
  if (s.exhaustion === true && depthTrend === "declining" && returnTrend === "declining") {
    return {
      state: "EARLY_BURNOUT",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      backOff: true,
      escalate: true,
      escalationReason: "Early exhaustion pattern. Cut load and pressure, and route a warm human check-in.",
      rationale:
        "An early exhaustion pattern (shorter or later sessions with declining return and depth). Back off (pressure down and load down before touching challenge) and route a warm check-in to a mentor.",
      notes: ["back off = pressure down first", HUMAN_DISPOSES, NEVER_GAMIFY],
    };
  }

  // 3. GAP: a per-spike quiet period. NEVER an auto-nudge / label; escalate for a human check-in.
  if (s.missing === true) {
    return {
      state: "GAP",
      challenge: "HOLD",
      pressure: "STEADY",
      escalate: true,
      escalationReason:
        "A per-spike quiet period. A gap is a question, not a verdict, so a human should check in (never an automated nudge or label).",
      rationale:
        "A quiet period on this spike. A gap is a question, not a verdict: no automated nudge and no label. A human decides whether to check in.",
      notes: ["missingness routes to a human check-in, never an auto-nudge/label", HUMAN_DISPOSES, NEVER_GAMIFY],
    };
  }

  // 4. DANGER_WINDOW: a stakes event. Counter-cyclical: autonomy up + reduce evaluative surfacing.
  if (s.stakesEvent === true) {
    return {
      state: "DANGER_WINDOW",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      reduceEvaluativeSurfacing: true,
      rationale:
        "A stakes event (competition, deadline, audience, or valuation spike). Act counter-cyclically: hold challenge, lift autonomy, and reduce evaluative surfacing. Never add stakes or streaks.",
      notes: ["counter-cyclical autonomy on a stakes event", NEVER_GAMIFY],
    };
  }

  // 5. OVER_CHALLENGED: success below the scaffold threshold and not rising. (Devaluation is
  // already excluded here: it wins at priority 1, so reaching this branch means !devaluation.)
  if ((success ?? 1) < SCAFFOLD_SUCCESS && returnTrend !== "rising") {
    return {
      state: "OVER_CHALLENGED",
      challenge: "SCAFFOLD",
      pressure: "STEADY",
      rationale:
        "Success is below the comfortable stretch zone and return is not rising. Scaffold: lower difficulty or add support to bring success back toward the 80 to 90% setpoint.",
      notes: ["setpoint 80 to 90% success", NEVER_GAMIFY],
    };
  }

  // 6. UNDER_CHALLENGED: PUSH ONLY FROM STRENGTH: rising return + rising depth + stretch-seeking.
  if (
    returnTrend === "rising" &&
    depthTrend === "rising" &&
    (success ?? 0) > 0.9 &&
    s.stretchSeeking === true
  ) {
    return {
      state: "UNDER_CHALLENGED",
      challenge: "PUSH",
      pressure: "STEADY",
      rationale:
        "Rising return and depth with the child voluntarily reaching for harder work. Push from strength: raise difficulty or fade scaffold, co-set with the child, and hold pressure steady.",
      notes: ["push only from strength (rising return + depth + stretch-seeking)", NEVER_GAMIFY],
    };
  }

  // 7. IN_ZONE: otherwise. Protect autonomy; resist adding stakes.
  return {
    state: "IN_ZONE",
    challenge: "HOLD",
    pressure: "STEADY",
    rationale:
      "In the zone. Consolidate and vary reps; resist adding stakes or streaks and protect the child's autonomy.",
    notes: ["resist adding stakes; protect autonomy", NEVER_GAMIFY],
  };
}

/**
 * Turn per-spike behavioral signals into a guide-facing recommendation on two independent knobs
 * (challenge × pressure) plus back-off / rest / escalate. Pure + deterministic.
 */
export function assessWellbeing(signals: WellbeingSignals): WellbeingRead {
  const kidId = typeof signals?.kidId === "string" ? signals.kidId : "";
  const cellKey = typeof signals?.cellKey === "string" ? signals.cellKey : "";
  let d: Decision;
  try {
    d = decide(signals);
  } catch {
    // Never let a malformed input fabricate a PUSH — fall back to the benign zone.
    d = {
      state: "IN_ZONE",
      challenge: "HOLD",
      pressure: "STEADY",
      rationale: "Signals could not be assessed; defaulting to hold with steady pressure.",
      notes: [NEVER_GAMIFY],
    };
  }

  const backOff = d.backOff === true;
  const rest = d.rest === true;
  // GUARDRAIL: any back-off or rest ALWAYS escalates to a human (system proposes, human disposes).
  const escalateToHuman = d.escalate === true || backOff || rest;

  const read: WellbeingRead = {
    kidId,
    cellKey,
    state: d.state,
    challenge: d.challenge,
    pressure: d.pressure,
    backOff,
    rest,
    reduceEvaluativeSurfacing: d.reduceEvaluativeSurfacing === true,
    escalateToHuman,
    rationale: d.rationale,
    guardrailNotes: d.notes,
    ...(escalateToHuman && d.escalationReason ? { escalationReason: d.escalationReason } : {}),
  };
  return read;
}
