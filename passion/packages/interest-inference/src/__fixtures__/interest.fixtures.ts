import type { CellEvent, DomainPrior } from "../model.js";

export const GOLDEN_NOW = Date.parse("2026-01-08T00:00:00.000Z");

export const GOLDEN_PRIORS: DomainPrior[] = [
  { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
];

export const GOLDEN_CELL_KEY = "music-sound/audio-systems::build";

/**
 * The golden cell: a child returning to one cell across a week.
 *
 * This timeline deliberately spans SEVEN DISTINCT DAYS. The previous fixture put every event on
 * a single timestamp equal to `GOLDEN_NOW`, which meant every recency weight was exactly 1 and
 * the golden test exercised none of the decay path. It also made the fixture unusable the moment
 * a distinct-day gate exists, since one timestamp is one day.
 *
 * Hand-derived expectation (K_LCB = 1.0, HALFLIFE_DAYS = 14, prior α = ALPHA0 1 + W_ENV 0.5):
 *   α = 1.5 + [1.0·w(5) + 1.0·w(3) + 1.0·w(1) + 1.0·w(0) + 0.5·w(2)] = 5.547239
 *   β = 1.0 + 0.5·w(4)                                              = 1.410168
 *   mean 0.797314 · sd 0.142508 · lowerBound 0.654806 · evidenceMass 4.457407
 *
 * Excluded from the belief, and each one is here to prove it stays excluded:
 *   - the day-6 return is the first exposure (`novelty: true`). It stays a `cross_day_return`
 *     rather than becoming a `same_day_engagement` under E2, deliberately: at a zero-weight kind
 *     it would prove nothing, whereas at a full-weight kind it proves the novelty flag still
 *     suppresses an event the scoring branch would otherwise have counted.
 *   - the day-0 `prompted_return` was system-surfaced
 *   - the day-1 `artifact_competence` is a work-quality judgement, unscored for interest (E11)
 */
const D = (day: number): string => `2026-01-0${day}T00:00:00.000Z`;

export const GOLDEN_EVENTS: CellEvent[] = [
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: true, timestamp: D(2) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: D(3) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "skip", novelty: false, timestamp: D(4) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: D(5) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "unrequired_revision", novelty: false, timestamp: D(6) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: D(7) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", novelty: false, timestamp: D(7) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "cross_day_return", novelty: false, timestamp: D(8) },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "prompted_return", novelty: false, timestamp: D(8) },
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
