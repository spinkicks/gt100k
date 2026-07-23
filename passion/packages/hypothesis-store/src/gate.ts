// The Phase 2→3 graduation gate — deterministic checks (spec §3.3).
// Promotion ALSO requires a human autonomySignOff (enforced in actions.promote), not here.
import type { InterestHypothesis } from "./model.js";
import { GAP_DAYS, MIN_TERM_DAYS, MIN_REVIEW_CYCLES } from "./lifecycle.js";

const DAY_MS = 86_400_000;

export interface GateStatus {
  readonly gapSurvived: boolean;
  readonly durable: boolean;
  readonly hasArtifact: boolean;
  readonly passed: boolean;
}

export function evaluateGate(
  hyp: InterestHypothesis,
  returnTimeline: readonly string[],
  now: number,
): GateStatus {
  const times = returnTimeline
    .map((t) => Date.parse(t))
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  // gap-survival: at least one consecutive pair separated by ≥ GAP_DAYS (a return after a quiet gap)
  let gapSurvived = false;
  for (let i = 1; i < times.length; i++) {
    if ((times[i]! - times[i - 1]!) / DAY_MS >= GAP_DAYS) {
      gapSurvived = true;
      break;
    }
  }

  // durability: span ≥ MIN_TERM_DAYS AND ≥ MIN_REVIEW_CYCLES distinct occasions
  const first = times[0];
  const last = times[times.length - 1];
  const spanDays = first !== undefined && last !== undefined ? (last - first) / DAY_MS : 0;
  const durable = times.length >= MIN_REVIEW_CYCLES && spanDays >= MIN_TERM_DAYS;

  const hasArtifact =
    typeof hyp.perseveranceArtifactRef === "string" && hyp.perseveranceArtifactRef.length > 0;

  return { gapSurvived, durable, hasArtifact, passed: gapSurvived && durable && hasArtifact };
}
