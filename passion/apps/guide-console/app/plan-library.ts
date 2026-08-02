// A small SYNTHETIC curated library (A6) for the guide-console Plan panel — a handful of
// @gt100k/concierge `CuratedResource`s (imported via the planner barrel) tagged to the pilot cells
// that actually appear in the derived roster (Dulce's ACTIVE game-dev + CANDIDATE production), so the
// panel shows real, grounded craft scaffolds.
//
// THE TITLES AND ADDRESSES ARE REAL, AND THEY DID NOT USED TO BE. Every entry pointed at
// `https://curated.example/...` with an invented title, because the tagging is what this fixture
// exists to demonstrate and the resources were treated as filler. But the panel renders them as
// links, so a demo offered five clicks that all went nowhere -- which reads as a broken product
// rather than as seed data. The tagging is still synthetic; the things it points at are now places
// a child could actually go, and every address is checked in CI by `check-links.ts`.
import type { CuratedResource, CuratedLibrary } from "@gt100k/specialization-planner";

// The synthetic age tier the panel grounds against. The engine advances on READINESS, not age — this
// tier is only a server-fact filter over the curated library (which is age-tiered for child-safety).
export const PLAN_AGE_TIER = "12-14" as const;

export const PLAN_LIBRARY: CuratedLibrary = [
  {
    id: "pl-gamedev-01",
    title: "Godot: build your first 2D game, start to finish",
    url: "https://docs.godotengine.org/en/stable/getting_started/first_2d_game/index.html",
    domainPath: ["code-computers", "game-dev"],
    pursuits: ["game-jam"],
    affordedModes: ["build"],
    reputation: 0.93,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-gamedev-02",
    title: "Game Programming Patterns (free to read online)",
    url: "https://gameprogrammingpatterns.com/",
    domainPath: ["code-computers", "game-dev"],
    pursuits: ["game-jam"],
    affordedModes: ["build", "investigate"],
    reputation: 0.85,
    ageTiers: ["12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-gamedev-03",
    title: "itch.io: what makes a game page worth publishing",
    url: "https://itch.io/docs/creators/quality-guidelines",
    domainPath: ["code-computers", "game-dev"],
    pursuits: ["game-jam"],
    affordedModes: ["build"],
    reputation: 0.78,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-music-prod-01",
    title: "Ableton Learning Music: make a track in the browser",
    url: "https://learningmusic.ableton.com/",
    domainPath: ["music-sound", "production"],
    pursuits: ["making-tracks"],
    affordedModes: ["build", "compose"],
    reputation: 0.92,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
  {
    id: "pl-chess-01",
    title: "Lichess Practice: tactics, endgames and checkmate patterns",
    url: "https://lichess.org/practice",
    domainPath: ["games-strategy", "chess"],
    pursuits: ["chess"],
    affordedModes: ["investigate"],
    reputation: 0.88,
    ageTiers: ["9-11", "12-14"],
    provenance: "synthetic-seed",
  },
] satisfies readonly CuratedResource[];
