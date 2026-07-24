// The deriver (spec 016-wellbeing §3.5): fill the per-spike `WellbeingSignals` it can from the 014
// StudentProfile interaction log (+ 013 store), for ONE cell. Pure + deterministic.
//
// The raw 014 log carries `artifactId`, not a cell — so it is resolved to the canonical CellEvent
// stream through the tested 012 Signal Firewall (`deriveSignals`), which needs the artifact catalog.
// The catalog is therefore a 4th input (default empty → no cell events → the SAFE default: stable
// trends, no devaluation, no missingness, and NEVER a fabricated PUSH). `successRate`/`exhaustion`/
// `obsessiveTip`/`stakesEvent` are not yet instrumented → left undefined.
import type { StudentProfile } from "@gt100k/student-profile";
import { deriveSignals } from "@gt100k/signal-pipeline";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { CellEvent } from "@gt100k/interest-inference";
import { isDepthFamily, serializeCellKey } from "@gt100k/interest-inference";
import { GAP_DAYS, TREND_WINDOW_DAYS, type Trend, type WellbeingSignals } from "./model.js";

const DAY_MS = 86_400_000;

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
): WellbeingSignals {
  const nowMs = Date.parse(now);
  const validNow = !Number.isNaN(nowMs);

  const { cellEvents } = deriveSignals({ interactions: profile.interactions, catalog });
  // Only the events for THIS spike, that have a parseable timestamp.
  const events: readonly CellEvent[] = cellEvents.filter(
    (e) => serializeCellKey(e.domainPath, e.mode) === cellKey && !Number.isNaN(Date.parse(e.timestamp)),
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

  const isVol = (e: CellEvent): boolean => e.kind === "voluntary_return";
  const isPromptedish = (e: CellEvent): boolean => e.kind === "prompted_return" || e.kind === "skip";
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
  const stretchSeeking = events.some(
    (e) => e.kind === "chosen_challenge" && inRecent(e.timestamp),
  );

  // devaluation (compliance-without-depth): they went deep by choice BEFORE, but recent returns are
  // prompted-only with no depth, and voluntary return is declining. Presence without depth.
  const hadPriorVoluntaryDepth = olderVol > 0 && olderDepth > 0;
  const recentComplianceOnly =
    count(isPromptedish, inRecent) > 0 && recentVol === 0 && recentDepth === 0;
  const devaluation =
    validNow && hadPriorVoluntaryDepth && recentComplianceOnly && returnTrend === "declining";

  // missingness: prior voluntary engagement, but no voluntary return within GAP_DAYS (a quiet period).
  const volTimes = events.filter(isVol).map((e) => Date.parse(e.timestamp));
  const latestVol = volTimes.length ? Math.max(...volTimes) : undefined;
  const missing =
    validNow && latestVol !== undefined && (nowMs - latestVol) / DAY_MS >= GAP_DAYS;

  return {
    kidId: profile.kidId,
    cellKey,
    returnTrend,
    depthTrend,
    stretchSeeking,
    devaluation,
    missing,
    now,
  };
}
