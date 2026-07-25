// Pure derivations for the Overview dashboard. Everything here is computed from the child's REAL
// append-only interaction log (`profileFor(kidId).interactions`), the synthetic artifact catalog, and
// the already-derived hypothesis / wellbeing view-models. Nothing is invented and nothing is stored:
// there is no score, grade or rank field anywhere — status is a *view* classification produced here
// and thrown away on the next render (guardrails GC1/GC6).
//
// Two rules run through the whole file:
//   1. A chart only renders when it can say something true. Every "not enough data yet" path returns
//      `ok: false` plus a plain-language reason, so the sparse child (003 Cyrus) reads as intentional
//      rather than broken. No NaN axis, no divide-by-zero, no 0% donut slice.
//   2. Colour never carries meaning on its own — every status here ships with a text label.
import { serializeCellKey } from "@gt100k/interest-inference";
import type { HypothesisCard } from "@gt100k/hypothesis-store";
import type { StudentProfile } from "@gt100k/student-profile";
import { PILOT_CATALOG, profileFor } from "./console-data.js";
import type { WellbeingCardVM } from "./wellbeing.js";
import { domainLabel, modeLabel, specPath, stateTerm } from "./vocab.js";

type Interaction = StudentProfile["interactions"][number];

// ── Thresholds ────────────────────────────────────────────────────────────────
// A line or a bar chart claims a *trend*, so it needs more than a handful of events spread over more
// than one period; below that a chart would over-read noise and mislead a guide. A share chart makes
// no claim about time, so it needs less. These are the only magic numbers in the file.
const MIN_TREND_EVENTS = 5;
const MIN_ACTIVE_PERIODS = 2;
const MIN_SHARE_EVENTS = 4;
/** A window shorter than this cannot be split into two comparable halves. */
const MIN_TREND_WINDOW_DAYS = 14;
const WEEKS_SHOWN = 8;
const DAY_MS = 86_400_000;

export type Status = "good" | "warn" | "bad";

/** A trend chip. `null` everywhere it cannot be computed honestly — never a guessed direction. */
export interface Trend {
  readonly dir: "up" | "down" | "flat";
  readonly label: string;
  readonly aria: string;
}

export interface StatTile {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  /** Plain-language context under the number (e.g. "2 of 11 areas"). Never colour-only. */
  readonly context: string;
  readonly trend: Trend | null;
  readonly spark: readonly number[] | null;
}

export interface TimeSeries {
  readonly ok: boolean;
  readonly reason: string;
  readonly labels: readonly string[];
  readonly a: readonly number[];
  readonly b: readonly number[];
  readonly range: string;
}

export interface ShareSlice {
  readonly key: string;
  readonly label: string;
  readonly percent: number;
  readonly count: number;
}

export interface ShareChart {
  readonly ok: boolean;
  readonly reason: string;
  readonly slices: readonly ShareSlice[];
  readonly total: number;
}

export interface SpecRow {
  readonly id: string;
  readonly index: number;
  readonly area: string;
  readonly mode: string;
  readonly stage: string;
  readonly confidence: number;
  readonly spark: readonly number[] | null;
  readonly status: Status;
  readonly statusLabel: string;
}

export interface WellbeingCheck {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly status: Status;
}

export interface WellbeingSummary {
  readonly status: Status;
  readonly badge: string;
  readonly checks: readonly WellbeingCheck[];
  readonly tracked: number;
}

export interface Overview {
  readonly tiles: readonly StatTile[];
  readonly returns: TimeSeries;
  readonly engagement: TimeSeries;
  readonly share: ShareChart;
  readonly rows: readonly SpecRow[];
  readonly wellbeing: WellbeingSummary;
  readonly events: number;
}

// ── Date helpers (all UTC; the log timestamps are UTC ISO) ────────────────────
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ms = (iso: string): number => Date.parse(iso);

function monthKey(t: number): string {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthShort(key: string): string {
  const month = Number(key.slice(5, 7));
  return MONTH_NAMES[month - 1] ?? key;
}

function monthLong(key: string): string {
  return `${monthShort(key)} ${key.slice(0, 4)}`;
}

/** Every month key from `from` to `to` inclusive, so an inactive month shows as a real zero. */
function monthRange(from: number, to: number): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(new Date(from).getUTCFullYear(), new Date(from).getUTCMonth(), 1));
  const end = Date.UTC(new Date(to).getUTCFullYear(), new Date(to).getUTCMonth(), 1);
  while (d.getTime() <= end) {
    out.push(monthKey(d.getTime()));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

/** Midnight UTC on the Monday of the week containing `t`. */
function weekStart(t: number): number {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - day * DAY_MS;
}

function dayLabel(t: number): string {
  const d = new Date(t);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ── Catalog helpers ───────────────────────────────────────────────────────────
/** Every `domain::mode` cell the catalog can currently observe — the coverage denominator. */
function affordedCells(): ReadonlySet<string> {
  const cells = new Set<string>();
  for (const a of PILOT_CATALOG.values()) {
    for (const mode of a.affordedModes) cells.add(serializeCellKey(a.domainPath, mode));
  }
  return cells;
}

/** The artifacts whose domain + afforded modes place them in `cellKey`. */
function artifactsInCell(cellKey: string): readonly string[] {
  const ids: string[] = [];
  for (const a of PILOT_CATALOG.values()) {
    if (a.affordedModes.some((m) => serializeCellKey(a.domainPath, m) === cellKey)) ids.push(a.id);
  }
  return ids;
}

const hasDepth = (i: Interaction): boolean => (i.depthSignals?.length ?? 0) > 0;

// ── Trend ─────────────────────────────────────────────────────────────────────
/**
 * Compare the most recent half of the child's observed window against the half before it. Calendar
 * months are not usable as periods here: the log has whole empty months, and "+∞% vs a zero month" is
 * not a fact. Halves of the actual observed window are two equal, consecutive, comparable periods.
 * Returns null (chip omitted) when the window is too short or the earlier half has nothing to compare
 * against, because there is then no honest percentage to state.
 */
function trendFrom(previous: number, current: number, windowDays: number, noun: string): Trend | null {
  if (windowDays < MIN_TREND_WINDOW_DAYS) return null;
  if (previous <= 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) {
    return { dir: "flat", label: "No change", aria: `${noun} unchanged versus the previous period` };
  }
  const dir = pct > 0 ? "up" : "down";
  const word = pct > 0 ? "up" : "down";
  return {
    dir,
    label: `${pct > 0 ? "+" : "\u2212"}${Math.abs(pct)}%`,
    aria: `${noun} ${word} ${Math.abs(pct)} percent versus the previous period`,
  };
}

// ── Share apportionment ───────────────────────────────────────────────────────
/**
 * Largest-remainder rounding so the donut legend always sums to exactly 100%, and no slice is ever
 * shown as 0% (a 0% wedge draws nothing and reads as a rendering bug).
 */
function apportion(groups: readonly { key: string; label: string; count: number }[], total: number): ShareSlice[] {
  const raw = groups.map((g) => ({ ...g, exact: (g.count / total) * 100 }));
  const floors = raw.map((g) => ({ ...g, percent: Math.floor(g.exact) }));
  let left = 100 - floors.reduce((a, g) => a + g.percent, 0);
  const order = [...floors].sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)));
  for (const g of order) {
    if (left <= 0) break;
    g.percent += 1;
    left -= 1;
  }
  return floors
    .filter((g) => g.percent > 0)
    .map((g) => ({ key: g.key, label: g.label, percent: g.percent, count: g.count }));
}

// ── Main derivation ───────────────────────────────────────────────────────────
export function buildOverview(
  kidId: string,
  cards: readonly HypothesisCard[],
  wellbeing: readonly WellbeingCardVM[],
): Overview {
  const log = [...(profileFor(kidId)?.interactions ?? [])].sort(
    (a, b) => ms(a.timestamp) - ms(b.timestamp),
  );

  const first = log.length > 0 ? ms(log[0]!.timestamp) : 0;
  const last = log.length > 0 ? ms(log[log.length - 1]!.timestamp) : 0;
  const windowDays = log.length > 0 ? (last - first) / DAY_MS : 0;
  const midpoint = first + (last - first) / 2;

  const months = log.length > 0 ? monthRange(first, last) : [];
  const monthIndex = new Map(months.map((m, i) => [m, i]));
  const rangeLabel =
    months.length > 0 ? `${monthLong(months[0]!)} to ${monthLong(months[months.length - 1]!)}` : "";

  // ── Returns over time: monthly, split voluntary vs prompted ────────────────
  const voluntaryByMonth = months.map(() => 0);
  const promptedByMonth = months.map(() => 0);
  const sessionsByMonth = months.map(() => new Set<string>());
  const depthByMonth = months.map(() => 0);
  for (const i of log) {
    const idx = monthIndex.get(monthKey(ms(i.timestamp)));
    if (idx === undefined) continue;
    if (i.prompted) promptedByMonth[idx]! += 1;
    else voluntaryByMonth[idx]! += 1;
    sessionsByMonth[idx]!.add(i.sessionId);
    if (hasDepth(i)) depthByMonth[idx]! += 1;
  }
  const activeMonths = months.filter(
    (_, i) => voluntaryByMonth[i]! + promptedByMonth[i]! > 0,
  ).length;

  const returnsOk =
    log.length >= MIN_TREND_EVENTS &&
    months.length >= MIN_ACTIVE_PERIODS &&
    activeMonths >= MIN_ACTIVE_PERIODS;
  const returns: TimeSeries = {
    ok: returnsOk,
    reason: notEnoughReason(log.length, activeMonths, "month"),
    labels: months.map(monthShort),
    a: voluntaryByMonth,
    b: promptedByMonth,
    range: rangeLabel,
  };

  // ── Weekly engagement: the last 8 weeks up to the most recent activity ─────
  const weekStarts: number[] = [];
  if (log.length > 0) {
    const lastWeek = weekStart(last);
    for (let k = WEEKS_SHOWN - 1; k >= 0; k -= 1) weekStarts.push(lastWeek - k * 7 * DAY_MS);
  }
  const weekSessions = weekStarts.map(() => new Set<string>());
  const weekDepth = weekStarts.map(() => 0);
  const firstWeek = weekStarts[0] ?? 0;
  for (const i of log) {
    const t = ms(i.timestamp);
    if (t < firstWeek) continue;
    const idx = Math.floor((weekStart(t) - firstWeek) / (7 * DAY_MS));
    if (idx < 0 || idx >= weekStarts.length) continue;
    weekSessions[idx]!.add(i.sessionId);
    if (hasDepth(i)) weekDepth[idx]! += 1;
  }
  const sessionCounts = weekSessions.map((s) => s.size);
  const activeWeeks = sessionCounts.filter((n) => n > 0).length;
  const windowEvents = sessionCounts.reduce((a, n) => a + n, 0);
  const engagementOk = activeWeeks >= MIN_ACTIVE_PERIODS && windowEvents >= 3;
  const engagement: TimeSeries = {
    ok: engagementOk,
    reason:
      activeWeeks <= 1
        ? "There is activity in only one of the last eight weeks, so there is no week-to-week pattern to show yet."
        : "There are too few visits in the last eight weeks to draw a weekly pattern.",
    labels: weekStarts.map(dayLabel),
    a: sessionCounts,
    b: weekDepth,
    range:
      weekStarts.length > 0
        ? `Weeks beginning ${dayLabel(weekStarts[0]!)} through ${dayLabel(weekStarts[weekStarts.length - 1]!)}`
        : "",
  };

  // ── Where their time goes: share by top-level domain ───────────────────────
  const byDomain = new Map<string, number>();
  let placed = 0;
  for (const i of log) {
    const domain = PILOT_CATALOG.get(i.artifactId)?.domainPath[0];
    if (!domain) continue;
    byDomain.set(domain, (byDomain.get(domain) ?? 0) + 1);
    placed += 1;
  }
  const ranked = [...byDomain.entries()]
    .map(([key, count]) => ({ key, label: domainLabel(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  // More than four areas would make the donut unreadable, so the tail is honestly named, not dropped.
  const grouped =
    ranked.length > 4
      ? [
          ...ranked.slice(0, 3),
          {
            key: "other",
            label: "Everything else",
            count: ranked.slice(3).reduce((a, g) => a + g.count, 0),
          },
        ]
      : ranked;
  const shareOk = placed >= MIN_SHARE_EVENTS && grouped.length > 0;
  const share: ShareChart = {
    ok: shareOk,
    reason:
      log.length === 0
        ? "Nothing has been logged for this child yet."
        : placed === 0
          ? "None of the logged visits can be placed in an area yet."
          : "There are too few logged visits to split their time into a meaningful share.",
    slices: shareOk ? apportion(grouped, placed) : [],
    total: placed,
  };

  // ── Stat tiles ─────────────────────────────────────────────────────────────
  const voluntaryTotal = log.filter((i) => !i.prompted).length;
  const depthTotal = log.filter(hasDepth).length;
  const sessionTotal = new Set(log.map((i) => i.sessionId)).size;

  const afforded = affordedCells();
  const covered = new Set(cards.map((c) => c.cellKey).filter((k) => afforded.has(k)));
  const coveragePct =
    afforded.size > 0 ? Math.round((covered.size / afforded.size) * 100) : 0;

  // When each covered cell first had evidence: the earliest interaction on any artifact that sits in
  // that cell. That is what makes a cumulative coverage line derivable from the log rather than guessed.
  const coveredByMonth = months.map(() => 0);
  for (const cell of covered) {
    const ids = new Set(artifactsInCell(cell));
    const firstTouch = log.find((i) => ids.has(i.artifactId));
    const idx = firstTouch ? (monthIndex.get(monthKey(ms(firstTouch.timestamp))) ?? 0) : 0;
    coveredByMonth[idx]! += 1;
  }
  let running = 0;
  const coverageCumulative = coveredByMonth.map((n) => {
    running += n;
    return running;
  });

  const half = (pred: (i: Interaction) => boolean): [number, number] => [
    log.filter((i) => ms(i.timestamp) < midpoint && pred(i)).length,
    log.filter((i) => ms(i.timestamp) >= midpoint && pred(i)).length,
  ];
  const [volPrev, volCurr] = half((i) => !i.prompted);
  const [depthPrev, depthCurr] = half(hasDepth);
  const sessPrev = new Set(
    log.filter((i) => ms(i.timestamp) < midpoint).map((i) => i.sessionId),
  ).size;
  const sessCurr = new Set(
    log.filter((i) => ms(i.timestamp) >= midpoint).map((i) => i.sessionId),
  ).size;
  const coveredAtMid = [...covered].filter((cell) => {
    const ids = new Set(artifactsInCell(cell));
    const firstTouch = log.find((i) => ids.has(i.artifactId));
    return firstTouch !== undefined && ms(firstTouch.timestamp) < midpoint;
  }).length;

  const tiles: readonly StatTile[] = [
    {
      key: "voluntary",
      label: "Voluntary returns",
      value: String(voluntaryTotal),
      context: `${voluntaryTotal} of ${log.length} visits came with no prompt`,
      trend: trendFrom(volPrev, volCurr, windowDays, "Voluntary returns"),
      spark: sparkOrNull(voluntaryByMonth),
    },
    {
      key: "depth",
      label: "Depth signals",
      value: String(depthTotal),
      context:
        depthTotal === 0
          ? "No going-deeper moments logged yet"
          : `Logged on ${depthTotal} of ${log.length} visits`,
      trend: trendFrom(depthPrev, depthCurr, windowDays, "Depth signals"),
      spark: sparkOrNull(depthByMonth),
    },
    {
      key: "sessions",
      label: "Sessions",
      value: String(sessionTotal),
      context: rangeLabel === "" ? "No sessions logged yet" : rangeLabel,
      trend: trendFrom(sessPrev, sessCurr, windowDays, "Sessions"),
      spark: sparkOrNull(sessionsByMonth.map((s) => s.size)),
    },
    {
      key: "coverage",
      label: "Coverage",
      value: `${coveragePct}%`,
      context: `${covered.size} of ${afforded.size} areas we can observe`,
      trend: trendFrom(coveredAtMid, covered.size, windowDays, "Coverage"),
      spark: sparkOrNull(coverageCumulative),
    },
  ];

  // ── Specializations table ──────────────────────────────────────────────────
  const escalating = new Set(
    wellbeing.filter((w) => w.read.escalateToHuman).map((w) => w.id),
  );
  const rows: readonly SpecRow[] = cards.map((card, index) => {
    const status: Status = escalating.has(card.id) ? "bad" : card.confident ? "good" : "warn";
    const ids = new Set(artifactsInCell(card.cellKey));
    const perMonth = months.map(() => 0);
    for (const i of log) {
      if (!ids.has(i.artifactId)) continue;
      const idx = monthIndex.get(monthKey(ms(i.timestamp)));
      if (idx !== undefined) perMonth[idx]! += 1;
    }
    let acc = 0;
    const cumulative = perMonth.map((n) => {
      acc += n;
      return acc;
    });
    return {
      id: card.id,
      index,
      area: specPath(card.domainPath),
      mode: modeLabel(card.mode),
      stage: stateTerm(card.state).label,
      confidence: Math.round(card.lowerBound * 100),
      spark: sparkOrNull(cumulative),
      status,
      statusLabel:
        status === "bad" ? "Needs review" : status === "warn" ? "Needs a look" : "On track",
    };
  });

  // ── Wellbeing checks ───────────────────────────────────────────────────────
  const tracked = wellbeing.length;
  const count = (pred: (w: WellbeingCardVM) => boolean): number => wellbeing.filter(pred).length;
  const nReview = count((w) => w.read.escalateToHuman);
  const nBackOff = count((w) => w.read.backOff);
  const nRest = count((w) => w.read.rest);
  const nGap = count((w) => w.read.state === "GAP");
  const of = (n: number): string => (n === 0 ? "None" : `${n} of ${tracked}`);
  const checks: readonly WellbeingCheck[] = [
    {
      key: "review",
      label: "Flagged for your review",
      value: of(nReview),
      status: nReview > 0 ? "bad" : "good",
    },
    {
      key: "backoff",
      label: "Ease off suggested",
      value: of(nBackOff),
      status: nBackOff > 0 ? "bad" : "good",
    },
    { key: "rest", label: "Rest suggested", value: of(nRest), status: nRest > 0 ? "warn" : "good" },
    { key: "gap", label: "Quiet period", value: of(nGap), status: nGap > 0 ? "warn" : "good" },
  ];
  const wbStatus: Status =
    nReview > 0 || nBackOff > 0 ? "bad" : nRest > 0 || nGap > 0 ? "warn" : "good";

  return {
    tiles,
    returns,
    engagement,
    share,
    rows,
    wellbeing: {
      status: wbStatus,
      badge: wbStatus === "bad" ? "Needs review" : wbStatus === "warn" ? "Watch" : "Looks steady",
      checks,
      tracked,
    },
    events: log.length,
  };
}

/**
 * A sparkline needs two points and some actual movement. A constant series (including all-zero) is
 * drawn by the Spark primitive as a rule pinned to the floor, which reads as "zero" rather than
 * "unchanged" — so it is omitted and the tile's text carries the story instead.
 */
function sparkOrNull(data: readonly number[]): readonly number[] | null {
  if (data.length < 2) return null;
  if (new Set(data).size === 1) return null;
  return data;
}

function notEnoughReason(events: number, activePeriods: number, unit: string): string {
  if (events === 0) return "Nothing has been logged for this child yet.";
  if (activePeriods <= 1) {
    return `All ${events} logged visits fall in a single ${unit}, so there is no trend to draw yet.`;
  }
  return `Only ${events} visits have been logged so far. A few more will make the trend meaningful.`;
}
