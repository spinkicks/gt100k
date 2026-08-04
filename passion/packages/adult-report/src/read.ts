/**
 * Turning what an adult said into something the engines can use, and refusing where we should.
 *
 * The governing constraint is that adult report corroborates and never establishes. The
 * gifted-identification literature is the natural experiment in making it load-bearing: nomination
 * gating produces false-negative rates above 60%, and high-scoring Black students are half as
 * likely to be referred, a gap that mostly closes with a same-race teacher. Adults are also much
 * better at judging what a child is good at than what a child likes -- teacher judgment accuracy
 * runs around .63 for achievement and low for interest specifically -- so this channel will
 * over-name the academically legible, and it must not be able to promote anything on its own.
 */
import type { AdultReports, RestDirection, Sighting, StakesEvent } from "./model.js";

/**
 * Days a sighting must span before it counts for anything.
 *
 * Two, for the same reason the belief math wants distinct days: one afternoon is an afternoon. This
 * is the difference between "she built a den on Saturday" and "she has been building dens all week",
 * and only the second is worth a fraction of a unit of evidence.
 */
export const MIN_SIGHTING_DAYS = 2;

/** Why a sighting was recorded and then not counted. Shown to nobody but a developer. */
export type SightingRefusal = "one-day-only" | "no-cell" | "already-counted-this-window";

/**
 * How long one cell may be corroborated by adult report before another counts.
 *
 * A parent enthusiastic about chess could otherwise file a sighting a day and walk a hypothesis up
 * on their own opinion. Matched to the belief math's half-life so at most one report is live at a
 * time.
 */
export const REPORT_WINDOW_DAYS = 14;

const DAY_MS = 86_400_000;

/** Distinct calendar days in a sighting, ignoring anything unparseable. */
function distinctDays(s: Sighting): number {
  return new Set(s.days.filter((d) => !Number.isNaN(Date.parse(d))).map((d) => d.slice(0, 10)))
    .size;
}

/**
 * The sightings that may become evidence, and the ones that may not.
 *
 * Sorted oldest first so the window rule is deterministic: the earliest qualifying report in a
 * window is the one that counts, not whichever happened to be written last.
 */
export function scorable(reports: AdultReports): {
  readonly counted: readonly Sighting[];
  readonly refused: readonly { readonly sighting: Sighting; readonly why: SightingRefusal }[];
} {
  const counted: Sighting[] = [];
  const refused: { sighting: Sighting; why: SightingRefusal }[] = [];
  const lastPerCell = new Map<string, number>();

  const ordered = [...reports.sightings].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  for (const s of ordered) {
    if (s.cellKey === undefined) {
      // Recorded, and a guide can read it. It just cannot move a belief about a cell nobody named.
      refused.push({ sighting: s, why: "no-cell" });
      continue;
    }
    if (distinctDays(s) < MIN_SIGHTING_DAYS) {
      refused.push({ sighting: s, why: "one-day-only" });
      continue;
    }
    const at = Date.parse(s.at);
    const prev = lastPerCell.get(s.cellKey);
    if (prev !== undefined && (at - prev) / DAY_MS < REPORT_WINDOW_DAYS) {
      refused.push({ sighting: s, why: "already-counted-this-window" });
      continue;
    }
    lastPerCell.set(s.cellKey, at);
    counted.push(s);
  }
  return { counted, refused };
}

/**
 * Whether an adult currently reads the child as running down.
 *
 * The MOST RECENT report wins rather than any average, because this is a direction someone observed
 * on a day and not a quantity to pool. Anything staler than the window is ignored: "worn out in
 * March" says nothing about August.
 */
export function restDirection(
  reports: AdultReports,
  now: string,
  windowDays = REPORT_WINDOW_DAYS * 2,
): RestDirection | undefined {
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) return undefined;
  const live = reports.rest
    .filter((r) => !Number.isNaN(Date.parse(r.at)))
    .filter((r) => (nowMs - Date.parse(r.at)) / DAY_MS <= windowDays)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return live[0]?.direction;
}

/** How close something with stakes is. `undefined` means nothing is coming. */
export interface StakesWindow {
  readonly event: StakesEvent;
  readonly daysAway: number;
  /**
   * Where in the run-up we are.
   *
   * The shape is documented: intrusive anxious thoughts climb across the final week, and cognitive
   * and somatic anxiety rise while confidence FALLS inside the last two hours. So the last day is
   * its own phase rather than the tail of the week, and `after` exists because the ride home is
   * where the strongest evidence in this area lives.
   */
  readonly phase: "week-before" | "day-of" | "after";
}

/** How far ahead we start treating something as imminent. One week, per the anxiety trajectory. */
export const STAKES_LEAD_DAYS = 7;
/** How long afterwards the advice about what an adult should say still applies. */
export const STAKES_TAIL_DAYS = 2;

/**
 * The event that should be shaping advice right now, if any.
 *
 * Nearest first, so a child with a recital on Friday and a tournament next month is read against
 * Friday.
 */
export function stakesWindow(reports: AdultReports, now: string): StakesWindow | undefined {
  const nowMs = Date.parse(now);
  if (Number.isNaN(nowMs)) return undefined;

  let best: StakesWindow | undefined;
  for (const event of reports.stakes) {
    const on = Date.parse(event.on);
    if (Number.isNaN(on)) continue;
    const daysAway = Math.round((on - nowMs) / DAY_MS);
    if (daysAway > STAKES_LEAD_DAYS || daysAway < -STAKES_TAIL_DAYS) continue;
    const phase: StakesWindow["phase"] =
      daysAway < 0 ? "after" : daysAway === 0 ? "day-of" : "week-before";
    if (best === undefined || Math.abs(daysAway) < Math.abs(best.daysAway)) {
      best = { event, daysAway, phase };
    }
  }
  return best;
}

/**
 * What to tell the adult, given where in the window we are.
 *
 * The `after` line is the one worth having. A conversation-analysis study recorded four and a half
 * hours of real car journeys home from tennis competitions and found children resisted or
 * disengaged whenever a parent opened a review of their performance -- including when the parent
 * was being supportive. When the CHILD opened the subject, extended affiliative talk followed,
 * whether they had won or lost. The rule is about who speaks first, not about tone, which is why
 * this says wait rather than says praise.
 */
export function stakesAdvice(w: StakesWindow): string {
  switch (w.phase) {
    case "week-before":
      return "Something they care about is close. Keep the difficulty where it is, do not add anything new, and talk about the work rather than the result.";
    case "day-of":
      return "Today. Confidence usually dips in the last couple of hours, so this is the worst moment to tell them anything. Feed them and be nearby.";
    case "after":
      return "Let them raise it first. Children disengage when a parent opens the review, even a kind one, and talk warmly for ages when they start it themselves. It holds either way, whatever happened.";
  }
}
