// @gt100k/access-broker-live — an OPT-IN OpportunityCatalog adapter shaped for a real mentor /
// competition / publishing / marketplace API. It returns DETERMINISTIC FAKE DATA now (no network, no
// SDK, no env) — a future `ACCESS_LIVE=1` server route can swap the stub for this, exactly as
// planner-live / TimeBack (020) do. NEVER imported by a domain test: the hermetic test here imports
// only this module + the shared `OpportunityCatalog` type; the gate never hits the network.
//
// The shape mirrors what a live source would return (roles/levels/channels/vetting/reputation),
// tagged to the same pilot `cellKey`s so it is drop-in compatible with the engine's gates + ranking.
import type { Opportunity, OpportunityCatalog, OpportunityKind } from "@gt100k/access-broker";

/** Pilot cellKeys the fake "live" source knows about (planner `cabin/subtopic|mode` format). */
export const LIVE_CELL_AUDIO = "music-sound/audio-systems|build";
export const LIVE_CELL_CHESS = "games-strategy/chess|perform";

// Deterministic fake "live" feed — stands in for a real mentor/competition/publishing/marketplace API.
const FAKE_LIVE_FEED: readonly Opportunity[] = [
  {
    id: "live-mn-warm-audio",
    kind: "mentor",
    title: "[live] Community audio mentor (warm)",
    cellKey: LIVE_CELL_AUDIO,
    modes: ["build", "investigate"],
    fillsRole: "WARM",
    sourceLayer: "NEAR_PEER",
    minStage: "S1_IGNITION",
    ageTier: "6-8",
    vetting: "vetted",
    reputation: 0.68,
  },
  {
    id: "live-mn-expert-audio",
    kind: "mentor",
    title: "[live] Loudspeaker-design reviewer (domain expert)",
    cellKey: LIVE_CELL_AUDIO,
    modes: ["build"],
    fillsRole: "DOMAIN_EXPERT",
    sourceLayer: "THIN_EXPERT",
    minStage: "S3_AUTHORSHIP",
    ageTier: "9-11",
    vetting: "vetted",
    reputation: 0.83,
  },
  {
    id: "live-au-competition-audio",
    kind: "audience",
    title: "[live] National build-off (deadline)",
    cellKey: LIVE_CELL_AUDIO,
    modes: ["build"],
    level: "REAL_COMMUNITY",
    channel: "COMPETITION",
    minStage: "S3_AUTHORSHIP",
    ageTier: "9-11",
    vetting: "vetted",
    reputation: 0.79,
    availability: { deadline: "2026-10-01" },
  },
  {
    id: "live-au-publishing-audio",
    kind: "audience",
    title: "[live] Trade-journal feature (field)",
    cellKey: LIVE_CELL_AUDIO,
    modes: ["build", "explain"],
    level: "FIELD",
    channel: "PUBLISHING",
    minStage: "S4_SIGNATURE",
    ageTier: "12-14",
    vetting: "vetted",
    reputation: 0.88,
  },
  {
    id: "live-mn-warm-chess",
    kind: "mentor",
    title: "[live] Local club coach (warm)",
    cellKey: LIVE_CELL_CHESS,
    modes: ["perform"],
    fillsRole: "WARM",
    sourceLayer: "NEAR_PEER",
    minStage: "S1_IGNITION",
    ageTier: "6-8",
    vetting: "vetted",
    reputation: 0.62,
  },
  {
    id: "live-au-competition-chess",
    kind: "audience",
    title: "[live] State scholastic championship (deadline)",
    cellKey: LIVE_CELL_CHESS,
    modes: ["perform"],
    level: "REAL_COMMUNITY",
    channel: "COMPETITION",
    minStage: "S3_AUTHORSHIP",
    ageTier: "9-11",
    vetting: "vetted",
    reputation: 0.81,
    availability: { deadline: "2026-09-20" },
  },
];

/**
 * Build the opt-in "live" `OpportunityCatalog`. Returns deterministic fake data synchronously — NO
 * network, NO env. Same port as the in-package `stubCatalog`, so it is a drop-in swap for the engine.
 */
export function liveCatalog(): OpportunityCatalog {
  return {
    search(q: { cellKey: string; kind: OpportunityKind }) {
      return FAKE_LIVE_FEED.filter((o) => o.cellKey === q.cellKey && o.kind === q.kind);
    },
  };
}
