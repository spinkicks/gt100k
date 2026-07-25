import type { Attribution, CellBelief } from "./model.js";
import { SPIKE_THRESHOLD, MAX_CANDIDATES, ATTR_MARGIN } from "./model.js";

export function rankCandidates(beliefs: readonly CellBelief[]): CellBelief[] {
  return beliefs
    .filter((b) => b.confident && b.lowerBound >= SPIKE_THRESHOLD)
    .slice()
    .sort((a, b) => b.lowerBound - a.lowerBound || a.cellKey.localeCompare(b.cellKey))
    .slice(0, MAX_CANDIDATES);
}

/**
 * A marginal over cells, weighted by how much evidence each cell actually rests on (E7).
 *
 * Unweighted means let a thin cell outvote a dense one: a cabin holding a single gadget the child
 * touched once would count as much as a cabin holding seven they returned to repeatedly, which
 * biases the topic-vs-style split toward whichever side happens to be sparsely populated.
 *
 * Falls back to the unweighted mean when there is no evidence mass at all, so a grid of zero-mass
 * cells still yields a defined attribution instead of dividing by zero.
 */
function weightedMarginal(cells: readonly CellBelief[]): number {
  if (cells.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const b of cells) {
    const w = b.evidenceMass > 0 ? b.evidenceMass : 0;
    num += b.mean * w;
    den += w;
  }
  if (den > 0) return num / den;
  let s = 0;
  for (const b of cells) s += b.mean;
  return s / cells.length;
}

export function attributionFor(target: CellBelief, all: readonly CellBelief[]): Attribution {
  const dom = target.domainPath[0];
  const domainMarginal = weightedMarginal(all.filter((b) => b.domainPath[0] === dom));
  const modeMarginal = weightedMarginal(all.filter((b) => b.mode === target.mode));
  if (domainMarginal - modeMarginal > ATTR_MARGIN) return "domain";
  if (modeMarginal - domainMarginal > ATTR_MARGIN) return "style";
  return "mixed";
}
