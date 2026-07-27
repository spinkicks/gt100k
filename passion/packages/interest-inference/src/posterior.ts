import type { CellAccum } from "./fold.js";
import type { CellBelief } from "./model.js";
import { K_LCB, MIN_DISTINCT_DAYS, MIN_EVIDENCE_MASS, MAX_CI_WIDTH } from "./model.js";

export function toBelief(cell: CellAccum): CellBelief {
  const { alpha, beta, alphaPrior, betaPrior } = cell;
  const n = alpha + beta;
  const mean = alpha / n;
  const variance = (alpha * beta) / (n * n * (n + 1));
  const sd = Math.sqrt(variance);
  const lowerBound = Math.max(0, mean - K_LCB * sd);
  const evidenceMass = alpha - alphaPrior + (beta - betaPrior);
  // E6: enough evidence, spread over enough days, and tight enough to be worth saying out loud.
  // The day gate is the one that separates an afternoon's enthusiasm from a durable interest —
  // mass alone counts three returns in one sitting the same as three returns across three weeks.
  //
  // Sufficiency reads `observedMass`, not the decayed `evidenceMass`. The decayed sum converges:
  // at HALFLIFE_DAYS = 14 a fortnightly cadence ceilings at 2.0 against this threshold of 6, so
  // gating on it made a steady slow pursuit unconfirmable at any n, while 013's promotion gate was
  // asking for exactly that shape (a 56-day span with a 14-day gap survived). Decay says how much
  // of what we saw still bears on today's belief; it should not say whether we ever looked.
  const distinctDays = cell.days.size;
  const confident =
    cell.observedMass >= MIN_EVIDENCE_MASS &&
    distinctDays >= MIN_DISTINCT_DAYS &&
    2 * sd <= MAX_CI_WIDTH;

  const supporting = Object.entries(cell.positiveByKind)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => k);
  const disconfirming: string[] = [];
  if (cell.skips > 0) disconfirming.push(`skip:${cell.skips}`);
  if (cell.declines > 0) disconfirming.push(`decline:${cell.declines}`);
  if (cell.prompted > 0) disconfirming.push(`prompted_return:${cell.prompted}`);

  return {
    cellKey: cell.cellKey,
    domainPath: cell.domainPath,
    mode: cell.mode,
    alpha,
    beta,
    mean,
    sd,
    lowerBound,
    evidenceMass,
    observedMass: cell.observedMass,
    distinctDays,
    confident,
    attribution: null,
    supporting,
    disconfirming,
  };
}
