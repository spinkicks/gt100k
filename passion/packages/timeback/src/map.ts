// The core mapper (spec §3.4): a TimeBackSnapshot → 011's cabin-keyed `DomainPrior[]`. PURE + deterministic.
// For each cabin with ≥1 OFFERED contributing subject: inEnvironment=true; aptitudeTilt = weighted mean of
// subject mastery; discretionaryTilt = weighted sum of each subject's SHARE of the kid's total free-choice XP.
// Cabins with no offered contributor are OMITTED (→ 011 uses its blank prior). `clamp01` (011, verbatim) guards
// [0,1] so a NaN/negative/absent field never poisons a tilt. This produces the prior; it NEVER gates (011
// excludes the prior from evidenceMass, and only events create cells — proven by the standing no-gate test).

import { type DomainPrior, clamp01 } from "@gt100k/interest-inference";
import { CABINS } from "@gt100k/two-axis-tagging";
import { crosswalkFor } from "./crosswalk.js";
import type { TimeBackSnapshot } from "./model.js";

/**
 * Translate school signals into cabin-keyed `DomainPrior[]` — one per cabin with ≥1 offered contributing
 * subject, sorted by `domain` (cabin id) ascending. Deterministic; graceful (unknown subject / uncontributed
 * cabin → no prior, never a throw). A prior only shifts the discovery starting point; it never gates.
 */
export function toDomainPriors(
  snapshot: TimeBackSnapshot,
): readonly DomainPrior[] {
  const totalXp = snapshot.subjects.reduce((sum, s) => sum + s.discretionaryXp, 0);
  const offered = snapshot.subjects.filter((s) => s.offered);

  const priors: DomainPrior[] = [];
  for (const cabin of CABINS) {
    let sumW = 0;
    let sumWMastery = 0;
    let sumWShare = 0;
    for (const signal of offered) {
      const row = crosswalkFor(signal.subject).find((cw) => cw.cabin === cabin);
      if (!row) continue;
      const share = totalXp > 0 ? signal.discretionaryXp / totalXp : 0;
      sumW += row.weight;
      sumWMastery += row.weight * signal.mastery;
      sumWShare += row.weight * share;
    }
    if (sumW === 0) continue; // no offered contributor → omit (blank prior downstream)
    priors.push({
      domain: cabin,
      inEnvironment: true,
      aptitudeTilt: clamp01(sumWMastery / sumW),
      discretionaryTilt: clamp01(sumWShare),
    });
  }

  return priors.sort((a, b) => (a.domain < b.domain ? -1 : a.domain > b.domain ? 1 : 0));
}
