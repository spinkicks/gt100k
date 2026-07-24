// The hand-authored subject→cabin crosswalk (spec §3.3) — DATA, not logic. It translates a TimeBack
// subject label into the discovery cabins that subject informs, each with a weight in [0,1]. Auditable +
// extensible: a new cabin/subtopic needs no code change, just a new row. GRACEFUL by construction —
// an unknown subject contributes nothing and NEVER throws; a cabin with no offered contributor yields
// no prior downstream.

import { type CabinId } from "@gt100k/two-axis-tagging";
import type { Subject, TimeBackSnapshot } from "./model.js";

export interface CabinWeight {
  readonly cabin: CabinId;
  readonly weight: number;
}

/** Subject → contributing cabins (weights in [0,1]). Seed table from spec §3.3; tune/extend freely. */
export const SUBJECT_CABIN_CROSSWALK = {
  math: [
    { cabin: "math-puzzles", weight: 1 },
    { cabin: "code-computers", weight: 0.5 },
    { cabin: "games-strategy", weight: 0.5 },
  ],
  science: [
    { cabin: "science-nature", weight: 1 },
    { cabin: "making-engineering", weight: 0.5 },
  ],
  reading: [{ cabin: "influence-media", weight: 0.6 }],
  writing: [{ cabin: "influence-media", weight: 1 }],
  coding: [
    { cabin: "code-computers", weight: 1 },
    { cabin: "math-puzzles", weight: 0.3 },
  ],
  music: [{ cabin: "music-sound", weight: 1 }],
  art: [{ cabin: "art-motion", weight: 1 }],
  "social-studies": [{ cabin: "influence-media", weight: 0.5 }],
} as const satisfies Record<string, readonly CabinWeight[]>;

/** The cabins a subject contributes to. Returns `[]` for an unknown subject (never throws). */
export function crosswalkFor(subject: Subject): readonly CabinWeight[] {
  return (
    (SUBJECT_CABIN_CROSSWALK as Record<string, readonly CabinWeight[]>)[
      subject
    ] ?? []
  );
}

/**
 * Provenance: per cabin, the OFFERED contributing subjects (why a cabin got a prior). Cabins with no
 * offered contributor are omitted. Pure + transparency-only — no UI, no side effects.
 */
export function explainPriors(
  snapshot: TimeBackSnapshot,
): ReadonlyMap<CabinId, readonly Subject[]> {
  const byCabin = new Map<CabinId, Subject[]>();
  for (const signal of snapshot.subjects) {
    if (!signal.offered) continue;
    for (const { cabin } of crosswalkFor(signal.subject)) {
      const existing = byCabin.get(cabin);
      if (existing) existing.push(signal.subject);
      else byCabin.set(cabin, [signal.subject]);
    }
  }
  return byCabin;
}
