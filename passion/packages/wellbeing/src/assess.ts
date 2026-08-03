// The pure, priority-ordered wellbeing decision engine (spec 016-wellbeing §3.3).
//
// Evaluate the seven §6.2 states in a DETERMINISTIC priority (highest first); the FIRST match wins:
//   1 BURNOUT_TIP → 2 EARLY_BURNOUT → 3 GAP → 4 DANGER_WINDOW → 5 OVER_CHALLENGED
//   → 6 UNDER_CHALLENGED → 7 IN_ZONE.
// The engine only PROPOSES: `rest`/`backOff` ALWAYS escalate to a human, nothing is applied to the
// child, and no state ever yields a child-facing label/score/reward. Any invalid/thrown input falls
// back to the SAFE default (IN_ZONE/HOLD/STEADY, no escalation) — it NEVER fabricates a PUSH.
import {
  type AssessOptions,
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
// Carried on the read when the pressure half is held for a spike still in discovery: the four
// pressure states are skipped so the read is challenge-only. Keyed on pursuit phase, never on age.
const PRESSURE_HELD =
  "pressure half held: discovery phase (can't burn out on what you're sampling)";

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

/**
 * Pick the winning state from the priority-ordered table.
 *
 * `pressureActive` gates the four PRESSURE states (priorities 1–4). When false — a spike still in
 * discovery, where a child has too little invested to be burning out — those branches are skipped
 * and evaluation falls through to the always-on CHALLENGE calibration (priorities 5–7). Keyed on
 * pursuit phase, NEVER on age.
 */
function decide(s: WellbeingSignals, pressureActive: boolean): Decision {
  const returnTrend: Trend = isTrend(s.returnTrend) ? s.returnTrend : "stable";
  const depthTrend: Trend = isTrend(s.depthTrend) ? s.depthTrend : "stable";
  const successKnown = typeof s.successRate === "number" && !Number.isNaN(s.successRate);
  const success = successKnown ? (s.successRate as number) : undefined;

  // 1. BURNOUT_TIP: quiet devaluation (weighted HIGHEST) or an obsessive tip.
  if (pressureActive && (s.devaluation === true || s.obsessiveTip === true)) {
    return {
      state: "BURNOUT_TIP",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      rest: true,
      escalate: true,
      escalationReason:
        "They keep showing up but seem to have stopped caring, or it has taken over everything. Offer a break with no guilt attached, and open some other doors.",
      rationale:
        "Turning up without engaging is the earliest warning sign. Keep the difficulty steady, ease off, and offer a break they can undo.",
      notes: ["weight devaluation over exhaustion", HUMAN_DISPOSES, NEVER_GAMIFY],
    };
  }

  // 2. EARLY_BURNOUT: an exhaustion pattern with declining depth AND return.
  if (
    pressureActive &&
    s.exhaustion === true &&
    depthTrend === "declining" &&
    returnTrend === "declining"
  ) {
    return {
      state: "EARLY_BURNOUT",
      challenge: "HOLD",
      pressure: "AUTONOMY_UP",
      backOff: true,
      escalate: true,
      escalationReason: "They look worn out. Cut back how much and how often, and check in warmly.",
      rationale:
        "Sessions are getting shorter and further apart. Ease off the amount before you change the difficulty.",
      notes: ["back off = pressure down first", HUMAN_DISPOSES, NEVER_GAMIFY],
    };
  }

  // 3. GAP: a per-spike quiet period. NEVER an auto-nudge / label; escalate for a human check-in.
  if (pressureActive && s.missing === true) {
    return {
      state: "GAP",
      challenge: "HOLD",
      pressure: "STEADY",
      escalate: true,
      escalationReason: "Quiet for a while. Worth asking them about it yourself.",
      rationale: "Quiet for a while. That is a question rather than an answer, so ask them.",
      notes: [
        "missingness routes to a human check-in, never an auto-nudge/label",
        HUMAN_DISPOSES,
        NEVER_GAMIFY,
      ],
    };
  }

  // 4. DANGER_WINDOW: a stakes event. Counter-cyclical: autonomy up + reduce evaluative surfacing.
  if (pressureActive && s.stakesEvent === true) {
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
    rationale: "In the zone. Keep practice varied, and do not add points, streaks or stakes.",
    notes: ["resist adding stakes; protect autonomy", NEVER_GAMIFY],
  };
}

/**
 * Turn per-spike behavioral signals into a guide-facing recommendation on two independent knobs
 * (challenge × pressure) plus back-off / rest / escalate. Pure + deterministic.
 *
 * `opts.pressureActive` (default true) gates the pressure/burnout half: pass false for a spike still
 * in discovery so only challenge calibration can fire. Keyed on pursuit phase, NEVER on age.
 */
export function assessWellbeing(signals: WellbeingSignals, opts?: AssessOptions): WellbeingRead {
  const kidId = typeof signals?.kidId === "string" ? signals.kidId : "";
  const cellKey = typeof signals?.cellKey === "string" ? signals.cellKey : "";
  // Default true: an omitted/undefined flag keeps every existing caller's behaviour unchanged.
  const pressureActive = opts?.pressureActive !== false;
  let d: Decision;
  try {
    d = decide(signals, pressureActive);
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

  // Make the held pressure half visible on the read itself, so a guide (and a test) can see the
  // discovery-phase gate was applied rather than infer it from the absence of a pressure state.
  const guardrailNotes = pressureActive ? d.notes : [...d.notes, PRESSURE_HELD];

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
    guardrailNotes,
    ...(escalateToHuman && d.escalationReason ? { escalationReason: d.escalationReason } : {}),
  };
  return read;
}
