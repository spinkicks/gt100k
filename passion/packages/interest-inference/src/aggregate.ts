import type { Attribution, CellBelief } from "./model.js";
import { SPIKE_THRESHOLD, MAX_CANDIDATES, ATTR_MARGIN } from "./model.js";

export function rankCandidates(beliefs: readonly CellBelief[]): CellBelief[] {
  return beliefs
    .filter((b) => b.confident && b.lowerBound >= SPIKE_THRESHOLD)
    .slice()
    .sort((a, b) => b.lowerBound - a.lowerBound || a.cellKey.localeCompare(b.cellKey))
    .slice(0, MAX_CANDIDATES);
}

function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function attributionFor(target: CellBelief, all: readonly CellBelief[]): Attribution {
  const dom = target.domainPath[0];
  const domainMarginal = mean(all.filter((b) => b.domainPath[0] === dom).map((b) => b.mean));
  const modeMarginal = mean(all.filter((b) => b.mode === target.mode).map((b) => b.mean));
  if (domainMarginal - modeMarginal > ATTR_MARGIN) return "domain";
  if (modeMarginal - domainMarginal > ATTR_MARGIN) return "style";
  return "mixed";
}
