import type { CellEvent, DomainPrior } from "../model.js";

export const GOLDEN_NOW = Date.parse("2026-01-08T00:00:00.000Z");

export const GOLDEN_PRIORS: DomainPrior[] = [
  { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
];

export const GOLDEN_CELL_KEY = "music-sound/audio-systems::build";

/**
 * The golden cell: a child returning to one cell nearly every day of a week.
 *
 * This timeline deliberately spans SEVEN DISTINCT DAYS (Jan 2 → Jan 8, six of them carrying scored
 * evidence). The original fixture put every event on a single timestamp equal to `GOLDEN_NOW`,
 * which meant every recency weight was exactly 1 and the golden test exercised none of the decay
 * path; it would also be unusable under the E6 day gate, since one timestamp is one day.
 *
 * E6 raised `MIN_EVIDENCE_MASS` to 6 and the old timeline carried 4.457407, so the golden read
 * would have stopped being confident and stopped producing a spike — the one thing this fixture
 * exists to demonstrate. It was enriched rather than exempted: the span is unchanged, and the
 * child now returns on the two days inside it that previously held only a skip (Jan 4) or only a
 * depth signal (Jan 6), plus recovers a failed attempt on Jan 5. Days 4 and 6 are the honest place
 * to put them — a child who came back six days out of seven, rather than one who crammed extra
 * returns into a day they were already having.
 *
 * Hand-derived expectation (K_LCB = 1.0, HALFLIFE_DAYS = 14, prior α = ALPHA0 1 + W_ENV 0.5),
 * with w(d) = 0.5^(d/14) and d the whole days between the event and `GOLDEN_NOW`:
 *   returns  w(5)+w(4)+w(3)+w(2)+w(1)+w(0)
 *            = 0.780709 + 0.820335 + 0.861973 + 0.905724 + 0.951695 + 1  = 5.320436
 *   depth    0.5·w(3) + 0.5·w(2) = 0.430986 + 0.452862                   = 0.883848
 *   α = 1.5 + 5.320436 + 0.883848                                        = 7.704284
 *   β = 1.0 + 0.5·w(4)                                                   = 1.410168
 *   evidenceMass = (α − 1.5) + (β − 1.0) = 6.204284 + 0.410168           = 6.614452
 *   mean 0.845282 · sd 0.113710 · lowerBound 0.731572 · distinctDays 6
 * Confident: mass 6.614452 ≥ 6, days 6 ≥ 2, 2·sd 0.227421 ≤ 0.35. Spike: 0.731572 ≥ 0.6.
 *
 * Excluded from the belief, and each one is here to prove it stays excluded — including from the
 * day count, which is why Jan 2 is not one of the six scored days:
 *   - the day-6 return is the first exposure (`novelty: true`). It stays a `cross_day_return`
 *     rather than becoming a `same_day_engagement` under E2, deliberately: at a zero-weight kind
 *     it would prove nothing, whereas at a full-weight kind it proves the novelty flag still
 *     suppresses an event the scoring branch would otherwise have counted.
 *   - the day-0 `prompted_return` was system-surfaced
 *   - the day-1 `artifact_competence` is a work-quality judgement, unscored for interest (E11)
 */
const D = (day: number): string => `2026-01-0${day}T00:00:00.000Z`;

export const GOLDEN_EVENTS: CellEvent[] = [
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: true,
    timestamp: D(2),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: false,
    timestamp: D(3),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: false,
    timestamp: D(4),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "skip",
    novelty: false,
    timestamp: D(4),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: false,
    timestamp: D(5),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "failure_recovery",
    novelty: false,
    timestamp: D(5),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: false,
    timestamp: D(6),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "unrequired_revision",
    novelty: false,
    timestamp: D(6),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: false,
    timestamp: D(7),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "artifact_competence",
    novelty: false,
    timestamp: D(7),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "cross_day_return",
    novelty: false,
    timestamp: D(8),
  },
  {
    domainPath: ["music-sound", "audio-systems"],
    mode: "build",
    kind: "prompted_return",
    novelty: false,
    timestamp: D(8),
  },
];

// Two attribution grids (spec §6) — pre-set means to test attribution in isolation.
export interface AttrGrid {
  readonly domain: string;
  readonly mode: string;
  readonly mean: number;
}

export const MAKER_GRID: AttrGrid[] = [
  { domain: "audio", mode: "build", mean: 0.8 },
  { domain: "gamedev", mode: "build", mean: 0.8 },
  { domain: "audio", mode: "perform", mean: 0.4 },
  { domain: "gamedev", mode: "perform", mean: 0.35 },
];
export const MAKER_EXPECTED = "style" as const;

export const LOYALIST_GRID: AttrGrid[] = [
  { domain: "audio", mode: "build", mean: 0.8 },
  { domain: "audio", mode: "perform", mean: 0.8 },
  { domain: "gamedev", mode: "build", mean: 0.4 },
  { domain: "gamedev", mode: "perform", mean: 0.35 },
];
export const LOYALIST_EXPECTED = "domain" as const;
