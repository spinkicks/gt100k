import type { BuiltEvent } from "./actions.js";
import { exposureKey } from "./novelty.js";

const DAY_MS = 86400000;

/**
 * The return kind of one engagement (E2), plus the gap when it is a cross-day return.
 *
 * `dayGap` is present only on `cross_day_return`, mirroring `CellEvent.dayGap`.
 */
export interface ReturnClass {
  readonly kind: "cross_day_return" | "same_day_engagement" | "prompted_return";
  readonly dayGap?: number;
}

/** UTC calendar day as a whole-day index. Epoch ms are already UTC, so flooring is the date. */
function utcDay(ms: number): number {
  return Math.floor(ms / DAY_MS);
}

/** Largest entry of the ascending `sorted` strictly less than `t`, or undefined if none. */
function latestBefore(sorted: readonly number[], t: number): number | undefined {
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid]! < t) lo = mid + 1;
    else hi = mid;
  }
  return lo === 0 ? undefined : sorted[lo - 1];
}

/**
 * Classify each engagement's return horizon, returned parallel to `built`.
 *
 * A `cross_day_return` needs a prior engagement of the same `(kidId, cellKey)` on an *earlier UTC
 * calendar day*; that is the only shape the ages 6-8 evidence treats as durable interest. Everything
 * else — a first-ever engagement, a reopen inside one session, a re-entry in a different session on
 * the same day — is `same_day_engagement`. The same-day-different-session case is the one the
 * proposal left unspecified; it is grouped with the unscored kinds deliberately, since a return
 * hours later has not survived a night away.
 *
 * The predecessor is the latest engagement strictly before this one, prompted or not: a prompted
 * touch is still a touch, so a voluntary return the next day has genuinely crossed a day.
 *
 * Timestamps are re-sorted here rather than trusted from the input order, so an out-of-order
 * interaction log classifies identically to a sorted one.
 */
export function classifyReturns(built: readonly BuiltEvent[]): ReturnClass[] {
  const timeline = new Map<string, number[]>();
  for (const b of built) {
    const t = Date.parse(b.event.timestamp);
    if (Number.isNaN(t)) continue;
    const key = exposureKey(b.event.kidId, b.cellKey);
    const arr = timeline.get(key);
    if (arr) arr.push(t);
    else timeline.set(key, [t]);
  }
  for (const arr of timeline.values()) arr.sort((a, b) => a - b);

  return built.map((b) => {
    if (b.event.returnState === "prompted") return { kind: "prompted_return" };
    const t = Date.parse(b.event.timestamp);
    // An unparseable timestamp cannot be shown to have crossed a day, so it stays unscored.
    if (Number.isNaN(t)) return { kind: "same_day_engagement" };
    const prev = latestBefore(timeline.get(exposureKey(b.event.kidId, b.cellKey)) ?? [], t);
    if (prev === undefined) return { kind: "same_day_engagement" };
    const dayGap = utcDay(t) - utcDay(prev);
    return dayGap > 0 ? { kind: "cross_day_return", dayGap } : { kind: "same_day_engagement" };
  });
}
