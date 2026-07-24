// Deterministic fake TimeBack data source (spec §2 / P5). There is NO real API yet — this synthetic source
// feeds the whole pipeline (crosswalk → priors → handoff → profile). SYNTHETIC ONLY: hand-authored,
// deterministic literals, no real/child data, no clock, no randomness, no network. `syntheticSnapshot`
// builds a snapshot from a fixed default subject set (overridable per subject); `PILOT_TIMEBACK` gives the
// four pilot kids distinct, stable profiles so their `toDomainPriors` output is reproducible.

import type { Subject, SubjectSignal, TimeBackSnapshot } from "./model.js";

// Default subject signals (all offered). totalDiscretionaryXp = 30+10+15+15+20+5+5 = 100, so every XP
// share is exact (e.g. art = 5/100 = 0.05). Editing these changes the golden — keep the total at 100.
const DEFAULT_SUBJECTS: readonly SubjectSignal[] = [
  { subject: "math", mastery: 0.7, discretionaryXp: 30, offered: true },
  { subject: "reading", mastery: 0.6, discretionaryXp: 10, offered: true },
  { subject: "writing", mastery: 0.5, discretionaryXp: 15, offered: true },
  { subject: "science", mastery: 0.65, discretionaryXp: 15, offered: true },
  { subject: "coding", mastery: 0.8, discretionaryXp: 20, offered: true },
  { subject: "music", mastery: 0.4, discretionaryXp: 5, offered: true },
  { subject: "art", mastery: 0.5, discretionaryXp: 5, offered: true },
];

/**
 * Build a deterministic synthetic snapshot. Starts from `DEFAULT_SUBJECTS`; `overrides` merge per subject
 * (the `subject` label is never overridable). Pure — same inputs always yield a deep-equal result.
 */
export function syntheticSnapshot(
  kidId: string,
  asOf: string,
  overrides?: Partial<Record<Subject, Partial<SubjectSignal>>>,
): TimeBackSnapshot {
  const subjects = DEFAULT_SUBJECTS.map((s) => {
    const o = overrides?.[s.subject];
    return o ? { ...s, ...o, subject: s.subject } : { ...s };
  });
  return { kidId, asOf, subjects };
}

const PILOT_ASOF = "2026-04-01T00:00:00.000Z";

/**
 * Snapshots for the four pilot kids — distinct, deterministic profiles. `001` is the balanced default;
 * `002` is math/coding-strong (STEM); `003` is reading/writing-strong (humanities); `004` is art/music-strong
 * (creative, with science not offered). Stable → reproducible `DomainPrior[]` for the pilot.
 */
export const PILOT_TIMEBACK: Readonly<Record<string, TimeBackSnapshot>> = {
  "kid-synthetic-001": syntheticSnapshot("kid-synthetic-001", PILOT_ASOF),
  "kid-synthetic-002": syntheticSnapshot("kid-synthetic-002", PILOT_ASOF, {
    math: { mastery: 0.9, discretionaryXp: 50 },
    coding: { mastery: 0.95, discretionaryXp: 30 },
    art: { mastery: 0.3, discretionaryXp: 2 },
    music: { mastery: 0.3, discretionaryXp: 2 },
  }),
  "kid-synthetic-003": syntheticSnapshot("kid-synthetic-003", PILOT_ASOF, {
    writing: { mastery: 0.9, discretionaryXp: 40 },
    reading: { mastery: 0.85, discretionaryXp: 35 },
    math: { mastery: 0.4, discretionaryXp: 10 },
  }),
  "kid-synthetic-004": syntheticSnapshot("kid-synthetic-004", PILOT_ASOF, {
    art: { mastery: 0.9, discretionaryXp: 45 },
    music: { mastery: 0.85, discretionaryXp: 35 },
    science: { mastery: 0.3, offered: false },
  }),
};
