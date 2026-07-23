// Synthetic seed for the guide-console (SYNTHETIC ONLY — no real child data).
//
// Builds a small in-memory hypothesis store from a synthetic 011 `InterestRead`: one confident
// candidate (music-sound/audio-systems::build) that auto-advances to EMERGING and carries a
// perseverance-artifact reference + a gate-passing return timeline, and one thin cell
// (movement-body/dance::perform) that stays EXPLORING. This gives the console a live primary action
// (promote the top gate-passed candidate) and a legible coverage gap.
import type { InterestRead } from "@gt100k/interest-inference";
import type { GateStatus, HypothesisStore, InterestHypothesis } from "@gt100k/hypothesis-store";
import { applyInterestRead, emptyStore, evaluateGate, getForKid } from "@gt100k/hypothesis-store";

export const SEED_KID = "kid-synthetic-001";
export const SEED_NOW = "2026-04-01T00:00:00.000Z";
export const ARTIFACT_REF = "defense-record-042"; // opaque perseverance-artifact ref (structural, §D6)

// The confident hypothesis' id — the store keys by `${kidId}::${cellKey}`.
export const SEED_TOP_ID = `${SEED_KID}::music-sound/audio-systems::build`;

// A synthetic 011 read: one confident candidate + one thin cell.
const SEED_READ: InterestRead = {
  cells: [
    {
      cellKey: "music-sound/audio-systems::build",
      domainPath: ["music-sound", "audio-systems"],
      mode: "build",
      alpha: 6,
      beta: 1.5,
      mean: 0.8,
      sd: 0.12,
      lowerBound: 0.7,
      evidenceMass: 5.2,
      confident: true,
      attribution: "style",
      supporting: ["voluntary_return", "depth_climb"],
      disconfirming: [],
    },
    {
      cellKey: "movement-body/dance::perform",
      domainPath: ["movement-body", "dance"],
      mode: "perform",
      alpha: 1.6,
      beta: 2.2,
      mean: 0.42,
      sd: 0.2,
      lowerBound: 0.24,
      evidenceMass: 1.1,
      confident: false,
      attribution: null,
      supporting: ["prompted_return"],
      disconfirming: ["skip"],
    },
  ],
  candidates: [
    {
      cellKey: "music-sound/audio-systems::build",
      domainPath: ["music-sound", "audio-systems"],
      mode: "build",
      lowerBound: 0.7,
      attribution: "style",
    },
  ],
};

// Voluntary, non-novel return timeline for the confident cell: day 0, day 20 (>14-day gap), day 60
// (>56-day term, 3rd occasion) → passes the graduation gate at SEED_NOW.
export const SEED_TIMELINE: readonly string[] = [
  "2026-01-01T00:00:00.000Z",
  "2026-01-21T00:00:00.000Z",
  "2026-03-02T00:00:00.000Z",
];

export function buildSeedStore(): HypothesisStore {
  const applied = applyInterestRead(emptyStore(), SEED_KID, SEED_READ, SEED_NOW);
  // Attach a synthetic perseverance-artifact ref to the confident hypothesis so its gate can pass —
  // applyInterestRead never fabricates artifacts (they arrive from 010/project work).
  const top = applied.byId[SEED_TOP_ID];
  if (!top) return applied;
  const withArtifact: InterestHypothesis = { ...top, perseveranceArtifactRef: ARTIFACT_REF };
  return { byId: { ...applied.byId, [SEED_TOP_ID]: withArtifact } };
}

// Deterministic gate map keyed by hypothesis id: the confident cell uses the passing timeline; every
// other cell has no returns (an empty, not-passed gate).
export function buildSeedGates(
  store: HypothesisStore,
  now: string = SEED_NOW,
): ReadonlyMap<string, GateStatus> {
  const gates = new Map<string, GateStatus>();
  const nowMs = Date.parse(now);
  for (const h of getForKid(store, SEED_KID)) {
    const timeline = h.id === SEED_TOP_ID ? SEED_TIMELINE : [];
    gates.set(h.id, evaluateGate(h, timeline, nowMs));
  }
  return gates;
}
