// The roster the console renders: synthetic children, plus any real child whose play has been
// ingested.
//
// Both halves are produced the same way, by running the REAL discovery chain (`runCycle` =
// deriveSignals → runInference → applyInterestRead → attachArtifacts, 012 → 011 → 013) over an
// interaction log. The only difference is where the log came from: `buildPilotRoster` authors one,
// and `/api/ingest` receives one from the game. There is deliberately no second code path for real
// data, because a "live view" that rendered real children through different code would be a
// separate product wearing the console's clothes, and the first thing to diverge would be the
// derivation itself.
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
import { CATALOG as GADGET_CATALOG } from "@gt100k/discovery-catalog";
import type { Artifact } from "@gt100k/two-axis-tagging";

export interface Child {
  readonly id: string;
  readonly name: string;
}

/**
 * The synthetic clock, and the default for anything that has to name a moment without naming a
 * child. Real children are read at their own clock — see `nowFor`.
 */
export const ROSTER_NOW = PILOT_NOW;

/**
 * Every artifact either half of the roster can refer to.
 *
 * The pilot fixtures use their own synthetic artifacts and the game uses the gadget crosswalk, so a
 * roster containing both needs both. Ids are disjoint (the fixtures' are synthetic names, the
 * gadgets' are `nonogram`, `chess`, …), and if that ever stops being true the collision would
 * silently retag one child's play, so `mergedCatalog` throws instead.
 */
function mergedCatalog(): ReadonlyMap<string, Artifact> {
  const out = new Map(PILOT_CATALOG);
  for (const [id, art] of GADGET_CATALOG) {
    const clash = out.get(id);
    if (clash && clash.domainPath.join("/") !== art.domainPath.join("/")) {
      throw new Error(
        `artifact id "${id}" means two different things: ` +
          `${clash.domainPath.join("/")} in the pilot fixtures, ${art.domainPath.join("/")} in the gadget crosswalk`,
      );
    }
    out.set(id, art);
  }
  return out;
}

export const CONSOLE_CATALOG = mergedCatalog();
const CTX: OrchestratorContext = { catalog: CONSOLE_CATALOG };

// ── The roster, and the seam real children arrive through ─────────────────────
//
// Module state rather than React context, because forty-odd call sites read this synchronously at
// module scope and threading a provider through all of them would be a much larger change than the
// one that makes real data appear. Two constraints keep it honest.
//
// `setIngested` REPLACES rather than appends, and is called with the complete set every render. So
// although this module is shared across requests during SSR, every request writes the same value
// read from the same store, and the race between them is between two identical writes.
//
// And nothing is memoised across a `setIngested`, or a child ingested mid-session would be listed
// in the switcher and missing from every panel.

const PILOT: Roster = buildPilotRoster(PILOT_NOW);
let ingested: readonly StudentProfile[] = [];
let cache: Roster | null = null;

/**
 * Hand the console the profiles ingested from a real surface. Called by the server component on
 * each render with everything currently in the store.
 */
export function setIngested(profiles: readonly StudentProfile[]): void {
  const changed =
    profiles.length !== ingested.length ||
    profiles.some((p, i) => p.kidId !== ingested[i]?.kidId || p.updatedAt !== ingested[i]?.updatedAt);
  if (!changed) return;
  ingested = profiles;
  cache = null;
}

function roster(): Roster {
  if (cache) return cache;
  const out = new Map(PILOT);
  // Real children after the synthetic ones, so `children()[0]` stays Ari and the `window.__qa`
  // contract the LOOP_QA gate drives does not move under an ingest.
  for (const p of ingested) out.set(p.kidId, p);
  cache = out;
  return out;
}

export function children(): readonly Child[] {
  return [...roster().values()].map((p) => ({ id: p.kidId, name: p.displayName }));
}

/**
 * The moment a given child is read at.
 *
 * Per child rather than global because the two halves of the roster live in different times. The
 * synthetic children are pinned to `PILOT_NOW` so their fixtures stay stable and the QA harness
 * stays deterministic; a real child's log ends whenever they last played. Reading a real child at
 * the synthetic clock would date their July play three months in the future, and recency decay
 * would quietly discount everything they actually did.
 *
 * `updatedAt` is the right value because `runCycle` sets it to the clock it derived at, so this is
 * the same moment the stored beliefs were computed for.
 */
export function nowFor(kidId: string): string {
  return roster().get(kidId)?.updatedAt ?? ROSTER_NOW;
}

// Every hypothesis of every child lives in one store (byId union — ids are `${kidId}::${cellKey}`,
// unique per kid), matching the console's single-store controller.
export function buildRosterStore(): HypothesisStore {
  let byId: HypothesisStore["byId"] = {};
  for (const p of roster().values()) {
    byId = { ...byId, ...p.store.byId };
  }
  return { byId };
}

// Gate map for every hypothesis of every child, keyed by hypothesis id, derived from each kid's
// interaction log (spec §3.3). The gate is a function of the voluntary-return timeline + the
// perseverance artifact — NOT of the mutable store — so a human promote/park in the console never
// changes it; we ignore the passed store.
export function buildRosterGates(_store?: HypothesisStore): ReadonlyMap<string, GateStatus> {
  const gates = new Map<string, GateStatus>();
  for (const p of roster().values()) {
    for (const [id, gate] of deriveGates(p, CTX, nowFor(p.kidId))) gates.set(id, gate);
  }
  return gates;
}

// The derived profile for one child (the source for the wellbeing deriver).
export function profileFor(kidId: string): StudentProfile | undefined {
  return roster().get(kidId);
}

export { PILOT_CATALOG };

export function childInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
