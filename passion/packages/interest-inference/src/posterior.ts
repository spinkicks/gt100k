import type { CellAccum } from "./fold.js";
import type { CellBelief } from "./model.js";
import { K_LCB, MIN_EVIDENCE_MASS, MAX_CI_WIDTH } from "./model.js";

export function toBelief(cell: CellAccum): CellBelief {
  const { alpha, beta, alphaPrior, betaPrior } = cell;
  const n = alpha + beta;
  const mean = alpha / n;
  const variance = (alpha * beta) / (n * n * (n + 1));
  const sd = Math.sqrt(variance);
  const lowerBound = Math.max(0, mean - K_LCB * sd);
  const evidenceMass = alpha - alphaPrior + (beta - betaPrior);
  const confident = evidenceMass >= MIN_EVIDENCE_MASS && 2 * sd <= MAX_CI_WIDTH;

  const supporting = Object.entries(cell.positiveByKind)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([k]) => k);
  const disconfirming: string[] = [];
  if (cell.skips > 0) disconfirming.push(`skip:${cell.skips}`);
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
    confident,
    attribution: null,
    supporting,
    disconfirming,
  };
}
