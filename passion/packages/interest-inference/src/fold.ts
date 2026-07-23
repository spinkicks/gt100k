import type { CellEvent, DomainPath, DomainPrior } from "./model.js";
import {
  A_RETURN,
  A_DEPTH,
  B_SKIP,
  ALPHA0,
  BETA0,
  W_ENV,
  W_APT,
  W_XP,
  clamp01,
  isDepthFamily,
  recencyWeight,
  serializeCellKey,
} from "./model.js";

export function buildPrior(prior?: DomainPrior): { alphaPrior: number; betaPrior: number } {
  const alphaPrior =
    ALPHA0 +
    (prior?.inEnvironment ? W_ENV : 0) +
    W_APT * clamp01(prior?.aptitudeTilt ?? 0) +
    W_XP * clamp01(prior?.discretionaryTilt ?? 0);
  return { alphaPrior, betaPrior: BETA0 };
}

export interface CellAccum {
  cellKey: string;
  domainPath: DomainPath;
  mode: string;
  alphaPrior: number;
  betaPrior: number;
  alpha: number;
  beta: number;
  positiveByKind: Record<string, number>;
  skips: number;
  prompted: number;
}

export function foldEvents(
  events: readonly CellEvent[],
  priors: readonly DomainPrior[],
  now: number,
): Map<string, CellAccum> {
  const priorByDomain = new Map<string, DomainPrior>();
  for (const p of priors) priorByDomain.set(p.domain, p);

  const cells = new Map<string, CellAccum>();
  for (const e of events) {
    const cellKey = serializeCellKey(e.domainPath, e.mode);
    let cell = cells.get(cellKey);
    if (!cell) {
      const { alphaPrior, betaPrior } = buildPrior(priorByDomain.get(e.domainPath[0]));
      cell = {
        cellKey,
        domainPath: e.domainPath,
        mode: e.mode,
        alphaPrior,
        betaPrior,
        alpha: alphaPrior,
        beta: betaPrior,
        positiveByKind: {},
        skips: 0,
        prompted: 0,
      };
      cells.set(cellKey, cell);
    }
    if (e.novelty) continue; // triggered situational interest → excluded
    if (e.kind === "prompted_return") {
      cell.prompted += 1;
      continue;
    }
    const w = recencyWeight(now, e.timestamp);
    const mag = clamp01(e.magnitude);
    if (e.kind === "voluntary_return") {
      const add = A_RETURN * mag * w;
      cell.alpha += add;
      cell.positiveByKind[e.kind] = (cell.positiveByKind[e.kind] ?? 0) + add;
    } else if (isDepthFamily(e.kind)) {
      const add = A_DEPTH * mag * w;
      cell.alpha += add;
      cell.positiveByKind[e.kind] = (cell.positiveByKind[e.kind] ?? 0) + add;
    } else if (e.kind === "skip") {
      cell.beta += B_SKIP * w;
      cell.skips += 1;
    }
  }
  return cells;
}
