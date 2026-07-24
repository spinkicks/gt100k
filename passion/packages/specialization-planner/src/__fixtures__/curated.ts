// A small synthetic curated library (A6) — a handful of @gt100k/concierge `CuratedResource`s tagged
// to the pilot cells (music-sound/production, games-strategy/chess) with reputations + age tiers, so
// `curatedForCell` returns a grounded match for one case and `[]` for a no-match case. SYNTHETIC
// ONLY: fictional titles/urls; no live/child data, no network.
import type { CuratedResource, CuratedLibrary } from "@gt100k/concierge";

export const CURATED_MUSIC_PROD_HIGH: CuratedResource = {
  id: "res-music-prod-01",
  title: "Home Studio: Recording & Mixing Basics",
  url: "https://curated.example/music/home-studio-basics",
  domainPath: ["music-sound", "production"],
  affordedModes: ["build", "compose"],
  reputation: 0.92,
  ageTiers: ["9-11", "12-14"],
  provenance: "synthetic-seed",
};

export const CURATED_MUSIC_PROD_MID: CuratedResource = {
  id: "res-music-prod-02",
  title: "Arranging Your First Track",
  url: "https://curated.example/music/arranging-first-track",
  domainPath: ["music-sound", "production"],
  affordedModes: ["compose"],
  reputation: 0.8,
  ageTiers: ["12-14"],
  provenance: "synthetic-seed",
};

/** Cabin-level music-sound resource — compatible with any music-sound sub-topic. */
export const CURATED_MUSIC_CABIN: CuratedResource = {
  id: "res-music-cabin-01",
  title: "How Sound Works",
  url: "https://curated.example/music/how-sound-works",
  domainPath: ["music-sound"],
  affordedModes: ["investigate"],
  reputation: 0.7,
  ageTiers: ["9-11", "12-14"],
  provenance: "synthetic-seed",
};

/** Younger-only music resource — excluded for the 12-14 tier (age filter). */
export const CURATED_MUSIC_YOUNG_ONLY: CuratedResource = {
  id: "res-music-prod-young",
  title: "Sound Games for Beginners",
  url: "https://curated.example/music/sound-games",
  domainPath: ["music-sound", "production"],
  affordedModes: ["build"],
  reputation: 0.99, // high reputation but wrong age tier → must still be excluded
  ageTiers: ["6-8"],
  provenance: "synthetic-seed",
};

export const CURATED_CHESS: CuratedResource = {
  id: "res-chess-01",
  title: "Chess Tactics: Forks, Pins, Skewers",
  url: "https://curated.example/chess/tactics-basics",
  domainPath: ["games-strategy", "chess"],
  affordedModes: ["investigate"],
  reputation: 0.88,
  ageTiers: ["9-11", "12-14"],
  provenance: "synthetic-seed",
};

/** The seed library value used by tests + the app panel. */
export const CURATED_LIBRARY: CuratedLibrary = [
  CURATED_MUSIC_PROD_HIGH,
  CURATED_MUSIC_PROD_MID,
  CURATED_MUSIC_CABIN,
  CURATED_MUSIC_YOUNG_ONLY,
  CURATED_CHESS,
];
