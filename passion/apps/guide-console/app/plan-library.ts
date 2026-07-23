// A small SYNTHETIC curated library (A6) for the guide-console Plan panel — a handful of
// @gt100k/concierge `CuratedResource`s (imported via the planner barrel) tagged to the pilot cells
// that actually appear in the derived roster (Dulce's ACTIVE game-dev + CANDIDATE production), so the
// panel shows real, grounded craft scaffolds. SYNTHETIC ONLY: fictional titles/urls, no live data.
import type { CuratedResource, CuratedLibrary } from "@gt100k/specialization-planner";

// The synthetic age tier the panel grounds against. The engine advances on READINESS, not age — this
// tier is only a server-fact filter over the curated library (which is age-tiered for child-safety).
export const PLAN_AGE_TIER = "12-14" as const;

export const PLAN_LIBRARY: CuratedLibrary = [
  {
    id: "pl-gamedev-01",
    title: "Ship Your First Game: Loops, Input, Feedback",
    url: "https://curated.example/gamedev/first-game",
    domainPath: ["code-computers", "game-dev"],
    affordedModes: ["build"],
    reputation: 0.93,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-gamedev-02",
    title: "Playtesting: Watching Real Players Without Steering Them",
    url: "https://curated.example/gamedev/playtesting",
    domainPath: ["code-computers", "game-dev"],
    affordedModes: ["build", "investigate"],
    reputation: 0.85,
    ageTiers: ["12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-music-prod-01",
    title: "Home Studio: Recording & Mixing Basics",
    url: "https://curated.example/music/home-studio-basics",
    domainPath: ["music-sound", "production"],
    affordedModes: ["build", "compose"],
    reputation: 0.92,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-music-prod-02",
    title: "Arranging a Track People Come Back To",
    url: "https://curated.example/music/arranging",
    domainPath: ["music-sound", "production"],
    affordedModes: ["compose"],
    reputation: 0.81,
    ageTiers: ["12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-chess-01",
    title: "Chess Tactics: Forks, Pins, Skewers",
    url: "https://curated.example/chess/tactics",
    domainPath: ["games-strategy", "chess"],
    affordedModes: ["investigate"],
    reputation: 0.88,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
] satisfies readonly CuratedResource[];
