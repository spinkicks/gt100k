import type { CellBelief, CellEvent, Candidate, DomainPrior, InterestRead } from "./model.js";
import { foldEvents } from "./fold.js";
import { toBelief } from "./posterior.js";
import { rankCandidates, attributionFor } from "./aggregate.js";

export function runInference(
  events: readonly CellEvent[],
  priors: readonly DomainPrior[],
  now: number,
): InterestRead {
  const beliefs: CellBelief[] = [...foldEvents(events, priors, now).values()].map(toBelief);
  const ranked = rankCandidates(beliefs);

  const attrByKey = new Map<string, Candidate>();
  for (const b of ranked) {
    const attribution = attributionFor(b, beliefs);
    attrByKey.set(b.cellKey, {
      cellKey: b.cellKey,
      domainPath: b.domainPath,
      mode: b.mode,
      lowerBound: b.lowerBound,
      attribution,
    });
  }

  const cells: CellBelief[] = beliefs.map((b) => {
    const c = attrByKey.get(b.cellKey);
    return c ? { ...b, attribution: c.attribution } : b;
  });

  return { cells, candidates: [...attrByKey.values()] };
}
