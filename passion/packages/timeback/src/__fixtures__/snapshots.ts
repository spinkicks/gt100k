// Synthetic golden fixtures (spec §6). SYNTHETIC ONLY — hand-authored, deterministic, no real/child data.
// GOLDEN_SNAPSHOT spans math/science/writing/music with mixed mastery + XP and one `offered:false`
// subject (music), proving the not-offered path contributes nothing. totalDiscretionaryXp = 100.

import type { TimeBackSnapshot } from "../model.js";

export const GOLDEN_SNAPSHOT: TimeBackSnapshot = {
  kidId: "kid-golden",
  asOf: "2026-04-01T00:00:00.000Z",
  subjects: [
    { subject: "math", mastery: 0.8, discretionaryXp: 60, offered: true },
    { subject: "science", mastery: 0.5, discretionaryXp: 20, offered: true },
    { subject: "writing", mastery: 0.9, discretionaryXp: 20, offered: true },
    { subject: "music", mastery: 0.4, discretionaryXp: 0, offered: false }, // not offered → contributes nothing
  ],
};
