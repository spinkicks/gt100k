// programMetrics — aggregate, program-level health signals over the 014 roster (spec §3.3).
// Pure + deterministic; never kid-facing. Guards div-by-zero on an empty roster.
import { getForKid, LIFECYCLE, type Lifecycle } from "@gt100k/hypothesis-store";
import type { Roster } from "@gt100k/student-profile";
import { COVERAGE_MIN_DOMAINS, type ProgramMetrics } from "./model.js";

/** funnel record seeded with every Lifecycle state at 0 (zeros are meaningful — see spec §3.1). */
function emptyFunnel(): Record<Lifecycle, number> {
  const funnel = {} as Record<Lifecycle, number>;
  for (const state of LIFECYCLE) funnel[state] = 0;
  return funnel;
}

/**
 * Aggregate program metrics across a roster of per-kid stores:
 * - funnel: hypothesis counts by Lifecycle across all kids;
 * - coverage-breadth: distinct `domainPath[0]` sampled per kid → avg + pct passing ≥ COVERAGE_MIN_DOMAINS;
 * - calibration: confidentRate = confident/total; notSureYetRate = (EXPLORING & !confident)/total;
 * - reopenRate: hypotheses whose history includes a REOPENED transition / total.
 */
export function programMetrics(roster: Roster): ProgramMetrics {
  const funnel = emptyFunnel();
  let total = 0;
  let confident = 0;
  let notSureYet = 0;
  let reopened = 0;

  const distinctDomainsPerKid: number[] = [];

  for (const [kidId, profile] of roster) {
    const hyps = getForKid(profile.store, kidId);
    const domains = new Set<string>();
    for (const h of hyps) {
      total += 1;
      funnel[h.state] += 1;
      if (h.evidence.confident) confident += 1;
      if (h.state === "EXPLORING" && !h.evidence.confident) notSureYet += 1;
      if (h.history.some((e) => e.to === "REOPENED")) reopened += 1;
      domains.add(h.domainPath[0]);
    }
    distinctDomainsPerKid.push(domains.size);
  }

  const kids = roster.size;
  const sumDomains = distinctDomainsPerKid.reduce((a, b) => a + b, 0);
  const passing = distinctDomainsPerKid.filter((d) => d >= COVERAGE_MIN_DOMAINS).length;

  return {
    kids,
    funnel,
    coverage: {
      avgDomainsPerKid: kids === 0 ? 0 : sumDomains / kids,
      pctKidsCoveragePass: kids === 0 ? 0 : passing / kids,
    },
    calibration: {
      confidentRate: total === 0 ? 0 : confident / total,
      notSureYetRate: total === 0 ? 0 : notSureYet / total,
    },
    reopenRate: total === 0 ? 0 : reopened / total,
  };
}
