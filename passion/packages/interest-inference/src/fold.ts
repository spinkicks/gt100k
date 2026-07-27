import type { CellEvent, DomainPath, DomainPrior } from "./model.js";
import {
  A_RETURN,
  A_DEPTH,
  A_SECONDARY,
  B_SKIP,
  B_DECLINED,
  ALPHA0,
  BETA0,
  W_ENV,
  W_APT,
  W_XP,
  clamp01,
  isDepthFamily,
  scoresInterest,
  recencyWeight,
  serializeCellKey,
  utcDay,
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
  /** `decline` occurrences (E4) — passed over, and never engaged. Counted apart from `skips`. */
  declines: number;
  prompted: number;
  /** `same_day_engagement` occurrences (E2). Context for a reader; never scored. */
  sameDay: number;
  /**
   * The distinct UTC calendar days (`YYYY-MM-DD`) on which an event moved alpha or beta (E6).
   *
   * Membership is granted only inside a scoring branch, so the set is exactly the days the belief
   * changed on. Everything the fold declines to score is therefore absent by construction rather
   * than by a parallel list of exclusions: a novelty event, a `prompted_return`, a
   * `same_day_engagement`, and a depth family `scoresInterest` rejects all leave the belief where
   * they found it, so none of them can help satisfy a gate about evidence being spread over time.
   */
  days: Set<string>;
  /**
   * The same per-event weights as alpha/beta, summed WITHOUT the recency factor: how much looking
   * happened, as opposed to how much of it still counts toward today's belief.
   *
   * These have to be separate numbers. Decay is geometric, so a steady cadence sums to a converging
   * series: at HALFLIFE_DAYS = 14, returns a fortnight apart ceiling at 2.0, and MIN_EVIDENCE_MASS
   * is 6. A child returning every other week could therefore never be confident at any n, while the
   * 013 promotion gate was simultaneously demanding a 56-day span with a 14-day quiet gap in it. The
   * two gates were asking for opposite things and the arithmetic made the slow, durable pursuit
   * unrepresentable.
   *
   * Recency answers "what do we believe now" and belongs in alpha/beta. It does not answer "have we
   * observed enough to say anything", because observing does not un-happen. Membership follows the
   * same rule as `days`: only events that actually scored contribute.
   */
  observedMass: number;
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
        declines: 0,
        prompted: 0,
        sameDay: 0,
        days: new Set<string>(),
        observedMass: 0,
      };
      cells.set(cellKey, cell);
    }
    if (e.novelty) continue; // triggered situational interest → excluded
    if (e.kind === "prompted_return") {
      cell.prompted += 1;
      continue;
    }
    if (e.kind === "same_day_engagement") {
      // E2: an engagement with no earlier-day predecessor asserts nothing about delayed return, so
      // it moves neither alpha nor beta. Kept out of `positiveByKind` too — that list is the
      // supporting-reason display, and a zero-weight event must not read as a reason to believe.
      cell.sameDay += 1;
      continue;
    }
    const w = recencyWeight(now, e.timestamp);
    // E6: the day is recorded once the event is known to score, so `days` counts days the belief
    // moved rather than days the child was seen.
    const day = utcDay(e.timestamp);
    const markDay = (): void => {
      if (day !== null) cell.days.add(day);
    };
    // One event = one occurrence (E1). The only scaling left is the secondary reading of a
    // two-mode action, which is inferred rather than observed.
    const roleScale = e.role === "secondary" ? A_SECONDARY : 1;
    if (e.kind === "cross_day_return") {
      const add = A_RETURN * roleScale * w;
      cell.alpha += add;
      cell.observedMass += A_RETURN * roleScale;
      cell.positiveByKind[e.kind] = (cell.positiveByKind[e.kind] ?? 0) + add;
      markDay();
    } else if (isDepthFamily(e.kind)) {
      // E11: not every depth family scores interest. `artifact_competence` is a work-quality
      // judgement, so it passes through to downstream consumers without touching the belief or
      // appearing as a supporting reason for it.
      if (!scoresInterest(e.kind)) continue;
      const add = A_DEPTH * roleScale * w;
      cell.alpha += add;
      cell.observedMass += A_DEPTH * roleScale;
      cell.positiveByKind[e.kind] = (cell.positiveByKind[e.kind] ?? 0) + add;
      markDay();
    } else if (e.kind === "skip" || e.kind === "decline") {
      // E4: picking one gadget out of seven is ONE observation, so the disconfirming mass is
      // shared across the alternatives instead of applied in full to each. Unnormalized, a child
      // who returns to their favourite cell every session accrues a full decrement on every other
      // known cell every session, so breadth of discovery suppresses the very spike the engine
      // exists to find. Absent `choiceSetSize` means "not a choice moment" and scores at full
      // weight; the floor of 1 keeps a zero or negative size from dividing by zero.
      const divisor = Math.max(1, e.choiceSetSize ?? 1);
      if (e.kind === "skip") {
        cell.beta += (B_SKIP * w) / divisor;
        cell.observedMass += B_SKIP / divisor;
        cell.skips += 1;
      } else {
        cell.beta += (B_DECLINED * w) / divisor;
        cell.observedMass += B_DECLINED / divisor;
        cell.declines += 1;
      }
      markDay();
    }
  }
  return cells;
}
