// Synthetic PILOT ROSTER (SYNTHETIC ONLY — no real child data). The derived analogue of the
// console's old hand-built seed: instead of hand-authoring `InterestRead`s, we author per-kid
// synthetic *interaction logs* and run the REAL orchestrator (`runCycle`) over a shared synthetic
// catalog + priors. `buildPilotRoster` returns the roster the guide console renders.
//
// Cells use the REAL taxonomy cabins (music-sound, art-motion, games-strategy, code-computers,
// science-nature — see two-axis-tagging `CABINS`); the spec's illustrative cabin names
// (movement-body / games-logic / …) are not real cabins, so we map them to the closest real ones
// (recorded as a `minor` decision). Modes are the real 9 work-modes (build/perform/investigate/…);
// `compete` is not a work-mode, so chess/go use `perform` ("run the chess game" — its WORK_MODE_DEFS
// example).
//
// Ari (kid-synthetic-001, the window.__qa kid) is the important one: his audio-systems log must reach
// a *confident* `::build` (a recent cluster of voluntary, non-novel returns near NOW ⇒ evidenceMass
// ≥ 3) AND leave a gate-spread of returns at ~day −90 / −70 / −30 so `deriveGates` sees a >14-day gap
// and a >56-day term — the confident recent cluster is what carries inference; the old spread barely
// feeds it (14-day recency half-life) but drives the gate timeline.
import type { Interaction } from "@gt100k/signal-pipeline";
import type { DomainPrior } from "@gt100k/interest-inference";
import { serializeCellKey } from "@gt100k/interest-inference";
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { HumanActor } from "@gt100k/hypothesis-store";
import { park, promote } from "@gt100k/hypothesis-store";
import type { Roster, StudentProfile } from "../model.js";
import { emptyProfile } from "../model.js";
import { runCycle } from "../orchestrator.js";
import { deriveGates } from "../gates.js";

/** Fixed synthetic clock (matches the console's SEED_NOW so the app keeps the same "now"). */
export const PILOT_NOW = "2026-04-01T00:00:00.000Z";

const GUIDE: HumanActor = { id: "guide-synthetic", role: "guide" };

// ── Synthetic catalog ─────────────────────────────────────────────────────────
// One tagged artifact per roster cell. `source:"gold"` ⇒ tagConfidence 1, tagStatus TRUSTED.
function artifact(
  id: string,
  domainPath: Artifact["domainPath"],
  affordedModes: Artifact["affordedModes"],
): Artifact {
  return {
    id,
    domainPath,
    affordedModes,
    kind: "gadget",
    source: "gold",
    origin: "seed",
    tagConfidence: 1,
    tagStatus: "TRUSTED",
  };
}

const ARTIFACTS: readonly Artifact[] = [
  // Ari
  artifact("ari-audio", ["music-sound", "audio-systems"], ["build", "investigate", "perform"]),
  artifact("ari-dance", ["art-motion", "dance"], ["perform"]),
  // Bex
  artifact("bex-chess", ["games-strategy", "chess"], ["perform"]),
  artifact("bex-python", ["code-computers", "python"], ["build", "investigate"]),
  // Cyrus
  artifact("cyrus-chess", ["games-strategy", "chess"], ["perform"]),
  artifact("cyrus-astro", ["science-nature", "astronomy"], ["investigate"]),
  // Dulce
  artifact("dulce-gamedev", ["code-computers", "game-dev"], ["build"]),
  artifact("dulce-prod", ["music-sound", "production"], ["build"]),
  artifact("dulce-physics", ["science-nature", "physics"], ["investigate"]),
];

export const PILOT_CATALOG: ReadonlyMap<string, Artifact> = new Map(
  ARTIFACTS.map((a) => [a.id, a]),
);

// ── Synthetic priors (never gated on; a modest env/aptitude nudge per kid) ──────
const prior = (domain: string): DomainPrior => ({
  domain,
  inEnvironment: true,
  aptitudeTilt: 0.2,
  discretionaryTilt: 0.2,
});

export const PILOT_PRIORS: Readonly<Record<string, readonly DomainPrior[]>> = {
  "kid-synthetic-001": [prior("music-sound"), prior("art-motion")],
  "kid-synthetic-002": [prior("games-strategy"), prior("code-computers")],
  "kid-synthetic-003": [prior("games-strategy"), prior("science-nature")],
  "kid-synthetic-004": [prior("code-computers"), prior("music-sound"), prior("science-nature")],
};

// ── Log builders ────────────────────────────────────────────────────────────────
// Timestamps relative to PILOT_NOW (2026-04-01): a novel first exposure at −97d (outside the 3-day
// novelty window before the first return), gate-spread voluntary returns at −90 / −70 / −30, and a
// recent cluster at −12 / −8 / −5 / −3 / −1 (the last with a depth signal) for confidence.
const NOVEL = "2025-12-25";
const SPREAD = ["2026-01-01", "2026-01-21", "2026-03-02"]; // −90 / −70 / −30
const CLUSTER = ["2026-03-20", "2026-03-24", "2026-03-27", "2026-03-29", "2026-03-31"];

function iso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function mk(
  kidId: string,
  artifactId: string,
  actionType: string,
  date: string,
  session: string,
  extra: Partial<Interaction> = {},
): Interaction {
  return {
    kidId,
    artifactId,
    actionType,
    timestamp: iso(date),
    prompted: false,
    sessionId: session,
    ...extra,
  };
}

/** Confident AND gate-passing: novel first exposure + spread returns + a recent cluster. */
function strongLog(kidId: string, artifactId: string, actionType: string, tag: string): Interaction[] {
  const returns = [...SPREAD, ...CLUSTER];
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    ...returns.map((d, i) =>
      mk(kidId, artifactId, actionType, d, `${tag}-r${i}`, {
        depth: 1,
        ...(i === returns.length - 1
          ? { depthSignals: [{ kind: "artifact_competence", value: 1 }] }
          : {}),
      }),
    ),
  ];
}

/** Confident but NO gate spread + NO artifact: novel + a recent cluster only (span < 56d). */
function confidentOnlyLog(kidId: string, artifactId: string, actionType: string, tag: string): Interaction[] {
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    ...CLUSTER.map((d, i) =>
      mk(kidId, artifactId, actionType, d, `${tag}-r${i}`, {
        depth: 1,
        ...(i === CLUSTER.length - 1
          ? { depthSignals: [{ kind: "artifact_competence", value: 1 }] }
          : {}),
      }),
    ),
  ];
}

/** Thin: a novel first exposure + a single prompted return → stays EXPLORING, empty gate timeline. */
function thinLog(kidId: string, artifactId: string, actionType: string, tag: string): Interaction[] {
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    mk(kidId, artifactId, actionType, "2026-03-25", `${tag}-p0`, { prompted: true }),
  ];
}

// Cell keys / artifact refs used both in fixtures and for the human transitions below.
const DULCE_GAMEDEV = serializeCellKey(["code-computers", "game-dev"], "build");
const DULCE_PROD = serializeCellKey(["music-sound", "production"], "build");
const DULCE_PHYSICS = serializeCellKey(["science-nature", "physics"], "investigate");

// ── Per-kid interaction logs ─────────────────────────────────────────────────────
const ARI_LOG: Interaction[] = [
  ...strongLog("kid-synthetic-001", "ari-audio", "assemble", "ari-audio"),
  ...thinLog("kid-synthetic-001", "ari-dance", "play", "ari-dance"),
];
const BEX_LOG: Interaction[] = [
  ...strongLog("kid-synthetic-002", "bex-chess", "play", "bex-chess"),
  ...confidentOnlyLog("kid-synthetic-002", "bex-python", "assemble", "bex-python"),
];
const CYRUS_LOG: Interaction[] = [
  ...thinLog("kid-synthetic-003", "cyrus-chess", "play", "cyrus-chess"),
  ...thinLog("kid-synthetic-003", "cyrus-astro", "inspect", "cyrus-astro"),
];
const DULCE_LOG: Interaction[] = [
  ...strongLog("kid-synthetic-004", "dulce-gamedev", "assemble", "dulce-gamedev"),
  ...strongLog("kid-synthetic-004", "dulce-prod", "assemble", "dulce-prod"),
  ...thinLog("kid-synthetic-004", "dulce-physics", "inspect", "dulce-physics"),
];

const ARI_ARTIFACTS = { [serializeCellKey(["music-sound", "audio-systems"], "build")]: "defense-record-042" };
const BEX_ARTIFACTS = { [serializeCellKey(["games-strategy", "chess"], "perform")]: "defense-record-113" };
const DULCE_ARTIFACTS = {
  [DULCE_GAMEDEV]: "defense-record-201",
  [DULCE_PROD]: "defense-record-202",
};

// ── Roster builder ────────────────────────────────────────────────────────────────
/**
 * Build the synthetic pilot roster by running `runCycle` per kid, then applying Dulce's human
 * transitions (a guide promotes one confident cell to ACTIVE, another to CANDIDATE, and parks a
 * thin one) — exactly as 013 allows a human to revise the auto-derived record.
 */
export function buildPilotRoster(now: string = PILOT_NOW): Roster {
  const ctx = { catalog: PILOT_CATALOG };
  const roster = new Map<string, StudentProfile>();

  roster.set(
    "kid-synthetic-001",
    runCycle(emptyProfile("kid-synthetic-001", "Ari Mercado", PILOT_PRIORS["kid-synthetic-001"], ARI_ARTIFACTS), ARI_LOG, ctx, now),
  );
  roster.set(
    "kid-synthetic-002",
    runCycle(emptyProfile("kid-synthetic-002", "Bex Ito", PILOT_PRIORS["kid-synthetic-002"], BEX_ARTIFACTS), BEX_LOG, ctx, now),
  );
  roster.set(
    "kid-synthetic-003",
    runCycle(emptyProfile("kid-synthetic-003", "Cyrus Okafor", PILOT_PRIORS["kid-synthetic-003"]), CYRUS_LOG, ctx, now),
  );

  // Dulce: derive, then apply the human transitions on top of the derived store.
  const dulce0 = runCycle(
    emptyProfile("kid-synthetic-004", "Dulce Park", PILOT_PRIORS["kid-synthetic-004"], DULCE_ARTIFACTS),
    DULCE_LOG,
    ctx,
    now,
  );
  const gates = deriveGates(dulce0, ctx, now);
  const gamedevId = `kid-synthetic-004::${DULCE_GAMEDEV}`;
  const prodId = `kid-synthetic-004::${DULCE_PROD}`;
  const physicsId = `kid-synthetic-004::${DULCE_PHYSICS}`;

  const gamedevGate = gates.get(gamedevId)!;
  const prodGate = gates.get(prodId)!;
  let store = dulce0.store;
  // game-dev: EMERGING → CANDIDATE → ACTIVE
  store = promote(store, gamedevId, GUIDE, { gate: gamedevGate, autonomySignOff: true }, now);
  store = promote(store, gamedevId, GUIDE, { gate: gamedevGate, autonomySignOff: true }, now);
  // production: EMERGING → CANDIDATE
  store = promote(store, prodId, GUIDE, { gate: prodGate, autonomySignOff: true }, now);
  // physics: EXPLORING → PARKED (parked for now; reversible)
  store = park(store, physicsId, GUIDE, "parked — revisit next term", now);

  roster.set("kid-synthetic-004", { ...dulce0, store });
  return roster;
}
