// The deriver (spec 016-wellbeing §3.5): fill the per-spike `WellbeingSignals` it can from the 014
// StudentProfile interaction log (+ 013 store), for ONE cell. Pure + deterministic.
//
// The raw 014 log carries `artifactId`, not a cell — so it is resolved to the canonical CellEvent
// stream through the tested 012 Signal Firewall (`deriveSignals`), which needs the artifact catalog.
// The catalog is therefore a 4th input (default empty → no cell events → the SAFE default: stable
// trends, no devaluation, no missingness, and NEVER a fabricated PUSH).
//
// `successRate` comes from `Interaction.tries` and is read off the RAW log rather than the cell
// stream, because tries are deliberately absent from `CellEvent`: performance must never become
// interest evidence.
//
// `exhaustion` and `stakesEvent` come from `@gt100k/adult-report`, because neither can be read from
// behaviour: the best published attempt to sense exhaustion from traces managed an ROC AUC of 0.56
// against a chance level of 0.50, and a competition date is a calendar fact rather than anything a
// log contains. `obsessiveTip` used to sit in this list and has been deleted, since the theory it
// borrowed from does not contain a tipping point at all. See
// `docs/decisions/2026-08-04-what-can-be-sensed.md`.
import type { StudentProfile } from "@gt100k/student-profile";
import { deriveSignals } from "@gt100k/signal-pipeline";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { isDepthFamily, serializeCellKey } from "@gt100k/interest-inference";
import { GAP_DAYS, TREND_WINDOW_DAYS, type Trend, type WellbeingSignals } from "./model.js";
import { NO_REPORTS, restDirection, stakesWindow, type AdultReports } from "@gt100k/adult-report";

const DAY_MS = 86_400_000;

/**
 * How many judged pieces of work before a success rate means anything.
 *
 * OURS, NOT A FINDING. Below this the ratio swings on a single puzzle, and the engine turns a low
 * rate into SCAFFOLD, so a child having one bad afternoon would get their difficulty pulled down.
 * Staying undefined is the safe answer: the engine already refuses to fabricate a PUSH without a
 * rate, and treats an absent one as "no reason to back off".
 */
const MIN_JUDGED = 4;

/** rising if recent activity exceeds older; declining if it falls; else stable. */
function trend(recent: number, older: number): Trend {
  if (recent > older) return "rising";
  if (recent < older) return "declining";
  return "stable";
}

/**
 * Derive the per-spike behavioral signals for `cellKey` from the profile's interaction log.
 * @param catalog artifact catalog used to resolve the raw log to cells (default empty → safe default).
 */
export function deriveWellbeingSignals(
  profile: StudentProfile,
  cellKey: string,
  now: string,
  catalog: ReadonlyMap<string, Artifact> = new Map(),
  /** What adults have told us. Defaults to nothing, which reads as no report rather than no risk. */
  reports: AdultReports = NO_REPORTS,
): WellbeingSignals {
  const nowMs = Date.parse(now);
  const validNow = !Number.isNaN(nowMs);

  const { cellEvents } = deriveSignals({ interactions: profile.interactions, catalog });
  // Only the events for THIS spike, that have a parseable timestamp.
  const events: readonly CellEvent[] = cellEvents.filter(
    (e) =>
      serializeCellKey(e.domainPath, e.mode) === cellKey && !Number.isNaN(Date.parse(e.timestamp)),
  );

  // Age-bucket each event: recent = ≤ TREND_WINDOW_DAYS old, older = the previous equal window.
  const ageDays = (ts: string): number => (nowMs - Date.parse(ts)) / DAY_MS;
  const inRecent = (ts: string): boolean => {
    const a = ageDays(ts);
    return a >= 0 && a <= TREND_WINDOW_DAYS;
  };
  const inOlder = (ts: string): boolean => {
    const a = ageDays(ts);
    return a > TREND_WINDOW_DAYS && a <= 2 * TREND_WINDOW_DAYS;
  };

  // Across-day returns only (E2). The trend this feeds is about a pursuit holding up over time, so
  // counting same-day re-entries would let one busy afternoon read as a rising trend.
  const isVol = (e: CellEvent): boolean => e.kind === "cross_day_return";
  const isPromptedish = (e: CellEvent): boolean =>
    e.kind === "prompted_return" || e.kind === "skip";
  const isDepth = (e: CellEvent): boolean => isDepthFamily(e.kind);

  const count = (pred: (e: CellEvent) => boolean, win: (ts: string) => boolean): number =>
    events.filter((e) => win(e.timestamp) && pred(e)).length;

  const recentVol = count(isVol, inRecent);
  const olderVol = count(isVol, inOlder);
  const recentDepth = count(isDepth, inRecent);
  const olderDepth = count(isDepth, inOlder);

  const returnTrend: Trend = validNow ? trend(recentVol, olderVol) : "stable";
  const depthTrend: Trend = validNow ? trend(recentDepth, olderDepth) : "stable";

  // stretch-seeking: the child voluntarily reaches for harder work RIGHT NOW (recent chosen_challenge).
  const stretchSeeking = events.some((e) => e.kind === "chosen_challenge" && inRecent(e.timestamp));

  // devaluation (compliance-without-depth): they went deep by choice BEFORE, but recent returns are
  // prompted-only with no depth, and voluntary return is declining. Presence without depth.
  const hadPriorVoluntaryDepth = olderVol > 0 && olderDepth > 0;
  const recentComplianceOnly =
    count(isPromptedish, inRecent) > 0 && recentVol === 0 && recentDepth === 0;
  const devaluation =
    validNow && hadPriorVoluntaryDepth && recentComplianceOnly && returnTrend === "declining";

  // successRate: solves over tries, across the recent window only, from interactions this cell's
  // artifacts produced. Absent unless the child actually met enough judged work to say anything --
  // one lucky puzzle is not a success rate, and a wrong number here moves a real recommendation.
  // Resolved through the CATALOG, not the cell stream: `CellEvent` deliberately drops `artifactId`,
  // which is the firewall doing its job. An artifact belongs to this cell when its domain matches
  // and it affords the cell's mode -- the same join the firewall itself makes.
  const inCell = (artifactId: string): boolean => {
    const a = catalog.get(artifactId);
    if (!a) return false;
    return a.affordedModes.some((m) => serializeCellKey(a.domainPath, m) === cellKey);
  };
  const judged = profile.interactions.filter(
    (i) =>
      typeof i.tries === "number" &&
      i.tries > 0 &&
      inCell(i.artifactId) &&
      !Number.isNaN(Date.parse(i.timestamp)) &&
      inRecent(i.timestamp),
  );
  const totalTries = judged.reduce((n, i) => n + (i.tries ?? 0), 0);
  const successRate =
    validNow && judged.length >= MIN_JUDGED && totalTries > 0
      ? judged.length / totalTries
      : undefined;

  // missingness: prior voluntary engagement, but no voluntary return within GAP_DAYS (a quiet period).
  const volTimes = events.filter(isVol).map((e) => Date.parse(e.timestamp));
  const latestVol = volTimes.length ? Math.max(...volTimes) : undefined;
  const missing = validNow && latestVol !== undefined && (nowMs - latestVol) / DAY_MS >= GAP_DAYS;

  return {
    kidId: profile.kidId,
    cellKey,
    returnTrend,
    depthTrend,
    stretchSeeking,
    devaluation,
    missing,
    ...(successRate === undefined ? {} : { successRate }),
    // Asked, never inferred. `flagging` deliberately does not set this: the engine turns exhaustion
    // into a rest recommendation, and one adult noticing a quiet week is not grounds for standing a
    // child down from something they chose. It reaches the guide either way.
    ...(restDirection(reports, now) === "worn-out" ? { exhaustion: true } : {}),
    // Scoped to THIS cell when the adult named one. A recital does not make a child's chess fragile.
    ...(stakesFor(reports, cellKey, now) ? { stakesEvent: true } : {}),
    now,
  };
}

/**
 * Whether something with stakes is coming that belongs to THIS spike.
 *
 * An event an adult filed without naming a specialization counts for all of them, because a child
 * with a competition on Saturday is a child with a competition on Saturday. One filed against a
 * different cell does not: a piano recital says nothing about how hard to push their chess.
 */
function stakesFor(reports: AdultReports, cellKey: string, now: string): boolean {
  const w = stakesWindow(reports, now);
  if (w === undefined) return false;
  return w.event.cellKey === undefined || w.event.cellKey === cellKey;
}
