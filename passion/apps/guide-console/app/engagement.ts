// Pure voluntary-returns trend for the guide console. Splits the child's observed window into two
// equal halves and compares voluntary (unprompted) returns in the later half against the earlier
// one. A minimum-count guard suppresses the percentage on tiny samples, because "-100% vs a
// two-visit baseline" reads identically to a large-sample collapse and is not an honest fact.
import { profileFor } from "./console-data.js";

export const MIN_TREND_EVENTS = 5;
const MIN_TREND_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface VoluntaryTrend {
  readonly prev: number;
  readonly curr: number;
  readonly windowDays: number;
  readonly pct: number | null;
  readonly fading: boolean;
}

const EMPTY: VoluntaryTrend = { prev: 0, curr: 0, windowDays: 0, pct: null, fading: false };

export function computeVoluntaryTrend(
  interactions: readonly { prompted?: boolean; timestamp: string }[],
): VoluntaryTrend {
  if (interactions.length === 0) return EMPTY;
  const log = [...interactions].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  const first = Date.parse(log[0]!.timestamp);
  const last = Date.parse(log[log.length - 1]!.timestamp);
  const windowDays = (last - first) / DAY_MS;
  const midpoint = first + (last - first) / 2;
  let prev = 0;
  let curr = 0;
  for (const i of log) {
    if (i.prompted) continue;
    if (Date.parse(i.timestamp) < midpoint) prev += 1;
    else curr += 1;
  }
  const guarded = windowDays >= MIN_TREND_WINDOW_DAYS && prev + curr >= MIN_TREND_EVENTS;
  if (!guarded || prev <= 0) {
    return { prev, curr, windowDays, pct: null, fading: false };
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { prev, curr, windowDays, pct, fading: curr < prev };
}

export function voluntaryReturns(kidId: string): VoluntaryTrend {
  return computeVoluntaryTrend(profileFor(kidId)?.interactions ?? []);
}
