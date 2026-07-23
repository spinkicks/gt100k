import type { PipelineConfig } from "./model.js";

/** One (kid, cell) exposure — a resolved engagement or a surfaced cell — at a timestamp. */
export interface Exposure {
  readonly kidId: string;
  readonly cellKey: string;
  readonly timestamp: string;
}

/** Canonical composite key for the first-exposure map. Reused everywhere the map is read/written. */
export function exposureKey(kidId: string, cellKey: string): string {
  return `${kidId}::${cellKey}`;
}

/**
 * Earliest timestamp (ms epoch) per (kidId, cellKey) across the input exposures.
 * Unparseable timestamps are skipped.
 */
export function buildFirstExposure(exposures: readonly Exposure[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of exposures) {
    const t = Date.parse(e.timestamp);
    if (Number.isNaN(t)) continue;
    const key = exposureKey(e.kidId, e.cellKey);
    const prev = m.get(key);
    if (prev === undefined || t < prev) m.set(key, t);
  }
  return m;
}

/**
 * A cell exposure is novelty iff its timestamp is within `noveltyWindowDays` of that cell's
 * first-exposure (first exposure itself is novelty). Unknown/unparseable → treated as novelty
 * (safe: novelty events are excluded downstream by 011).
 */
export function isNovelty(
  idx: Map<string, number>,
  kidId: string,
  cellKey: string,
  timestamp: string,
  cfg: PipelineConfig,
): boolean {
  const first = idx.get(exposureKey(kidId, cellKey));
  const t = Date.parse(timestamp);
  if (first === undefined || Number.isNaN(t)) return true;
  const ageDays = (t - first) / 86400000;
  return ageDays <= cfg.noveltyWindowDays;
}
