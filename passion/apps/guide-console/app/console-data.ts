// GENUINELY-DERIVED roster for the guide console (SYNTHETIC ONLY — no real child data).
//
// This replaces the old hand-built `InterestRead` seed: the roster is now produced by running the
// REAL discovery chain (`runCycle` = deriveSignals → runInference → applyInterestRead →
// attachArtifacts, 012 → 011 → 013) over per-kid synthetic *interaction logs*, via
// `buildPilotRoster` from `@gt100k/student-profile`. The console UI + the `window.__qa` / `LOOP_QA`
// contract are unchanged — only the DATA SOURCE changed (now genuinely derived).
//
// The four canonical synthetic kids (built in insertion order by `buildPilotRoster`):
//   001 Ari    — music-sound/audio-systems::build EMERGING + gate-passed (the window.__qa kid);
//                art-motion/dance::perform stays EXPLORING
//   002 Bex    — a gate-passed EMERGING candidate (chess) + an EMERGING one short of its gate (python)
//   003 Cyrus  — sparse: everything EXPLORING, nothing confident yet
//   004 Dulce  — established: an ACTIVE spike, a CANDIDATE, and a reversibly PARKED cell
import type { GateStatus, HypothesisStore } from "@gt100k/hypothesis-store";
import {
  buildPilotRoster,
  deriveGates,
  PILOT_CATALOG,
  PILOT_NOW,
  type OrchestratorContext,
  type Roster,
  type StudentProfile,
} from "@gt100k/student-profile";

export interface Child {
  readonly id: string;
  readonly name: string;
}

export const ROSTER_NOW = PILOT_NOW;
const CTX: OrchestratorContext = { catalog: PILOT_CATALOG };

// Build the derived roster ONCE (runCycle over the synthetic per-kid logs). Insertion order is
// 001 → 004, so Ari (the window.__qa kid) is CHILDREN[0].
const ROSTER: Roster = buildPilotRoster(PILOT_NOW);

export const CHILDREN: readonly Child[] = [...ROSTER.values()].map((p) => ({
  id: p.kidId,
  name: p.displayName,
}));

// Every hypothesis of every child lives in one store (byId union — ids are `${kidId}::${cellKey}`,
// unique per kid), matching the console's single-store controller.
export function buildRosterStore(): HypothesisStore {
  let byId: HypothesisStore["byId"] = {};
  for (const p of ROSTER.values()) {
    byId = { ...byId, ...p.store.byId };
  }
  return { byId };
}

// Gate map for every hypothesis of every child, keyed by hypothesis id, derived from each kid's
// interaction log (spec §3.3). The gate is a function of the voluntary-return timeline + the
// synthetic perseverance artifact — NOT of the mutable store — so a human promote/park in the
// console never changes it; we compute it once and ignore the passed store.
const ROSTER_GATES: ReadonlyMap<string, GateStatus> = (() => {
  const gates = new Map<string, GateStatus>();
  for (const p of ROSTER.values()) {
    for (const [id, gate] of deriveGates(p, CTX, PILOT_NOW)) gates.set(id, gate);
  }
  return gates;
})();

export function buildRosterGates(_store?: HypothesisStore): ReadonlyMap<string, GateStatus> {
  return ROSTER_GATES;
}

// The derived profile for one child (the source for the wellbeing deriver). The catalog + "now" are
// re-exported so the wellbeing panel can resolve the raw interaction log to cells (016-wellbeing).
export function profileFor(kidId: string): StudentProfile | undefined {
  return ROSTER.get(kidId);
}

export { PILOT_CATALOG };

export function childInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
