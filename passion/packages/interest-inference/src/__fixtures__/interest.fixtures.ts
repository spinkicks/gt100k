import type { CellEvent, DomainPrior } from "../model.js";

export const GOLDEN_NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z";

export const GOLDEN_PRIORS: DomainPrior[] = [
  { domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 },
];

export const GOLDEN_CELL_KEY = "music-sound/audio-systems::build";

// The golden cell → α=5.5, β=1.5 (spec §6): 3 voluntary + 2 depth + 1 skip; 1 novelty + 1 prompted excluded.
export const GOLDEN_EVENTS: CellEvent[] = [
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "unrequired_revision", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "artifact_competence", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "skip", magnitude: 1, novelty: false, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "voluntary_return", magnitude: 1, novelty: true, timestamp: TS },
  { domainPath: ["music-sound", "audio-systems"], mode: "build", kind: "prompted_return", magnitude: 1, novelty: false, timestamp: TS },
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
