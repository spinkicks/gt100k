import type { CoverageByFacet, Facet } from "./model.js";
import { FACET_ORDER, COVERED, MAX_TURNS } from "./model.js";

export function initialCoverage(): CoverageByFacet {
  return { what: 0, why: 0, how: 0, challenge: 0, next: 0, audience: 0 };
}

export function updateCoverage(cov: CoverageByFacet, facet: Facet, judged: number): CoverageByFacet {
  return { ...cov, [facet]: Math.max(cov[facet], judged) };
}

export function selectNextFacet(cov: CoverageByFacet): Facet {
  let best: Facet = FACET_ORDER[0];
  let bestVal = cov[best];
  for (const f of FACET_ORDER) {
    if (cov[f] < bestVal) {
      best = f;
      bestVal = cov[f];
    }
  }
  return best; // FACET_ORDER iteration → ties resolve to the earliest facet
}

export function isComplete(cov: CoverageByFacet, turnCount: number): boolean {
  if (turnCount >= MAX_TURNS) return true;
  return FACET_ORDER.every((f) => cov[f] >= COVERED);
}

export function computeGaps(cov: CoverageByFacet): Facet[] {
  return FACET_ORDER.filter((f) => cov[f] < COVERED);
}
