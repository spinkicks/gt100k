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
// ≥ 6 across ≥ 2 distinct days) AND leave a gate-spread of returns at ~day −90 / −70 / −30 so
// `deriveGates` sees a >14-day gap and a >56-day term — the confident recent cluster is what carries
// inference; the old spread barely feeds it (14-day recency half-life) but drives the gate timeline.
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
  // Elle
  artifact("elle-production", ["music-sound", "production"], ["build"]),
];

export const PILOT_CATALOG: ReadonlyMap<string, Artifact> = new Map(
  ARTIFACTS.map((a) => [a.id, a]),
);

// ── Synthetic priors (never gated on; a modest env/aptitude nudge per kid) ──────
const prior = (domain: string): DomainPrior => ({
  domain,
  inEnvironment: true,
  masteryTilt: 0.2,
  discretionaryTilt: 0.2,
});

export const PILOT_PRIORS: Readonly<Record<string, readonly DomainPrior[]>> = {
  "kid-synthetic-001": [prior("music-sound"), prior("art-motion")],
  "kid-synthetic-002": [prior("games-strategy"), prior("code-computers")],
  "kid-synthetic-003": [prior("games-strategy"), prior("science-nature")],
  "kid-synthetic-004": [prior("code-computers"), prior("music-sound"), prior("science-nature")],
  "kid-synthetic-005": [prior("music-sound")],
};

// ── Log builders ────────────────────────────────────────────────────────────────
// Timestamps relative to PILOT_NOW (2026-04-01): a novel first exposure at −97d (outside the 3-day
// novelty window before the first return), gate-spread voluntary returns at −90 / −70 / −30, and a
// recent cluster every other day from −19 to −1 (the last with a depth signal) for confidence.
//
// The cluster used to be five returns from −12 to −1, worth 3.82 of recency-weighted mass. E6
// raised `MIN_EVIDENCE_MASS` to 6, so Ari, Bex and Dulce would all have dropped to "not sure yet"
// and the guide-console roster would have had nothing to show. Ten returns over nineteen days is
// what the scenario always described — a child who is genuinely hooked — and it clears the floor
// on the evidence rather than on a lowered bar: 6.34 from the cluster plus 0.27 of what survives
// from the gate spread ≈ 6.61.
const NOVEL = "2025-12-25";
const NOVEL_NEXT = "2025-12-26"; // still inside the 3-day novelty window
const SPREAD = ["2026-01-01", "2026-01-21", "2026-03-02"]; // −90 / −70 / −30
const CLUSTER = [
  "2026-03-13",
  "2026-03-15",
  "2026-03-17",
  "2026-03-19",
  "2026-03-21",
  "2026-03-23",
  "2026-03-25",
  "2026-03-27",
  "2026-03-29",
  "2026-03-31",
];

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
function strongLog(
  kidId: string,
  artifactId: string,
  actionType: string,
  tag: string,
): Interaction[] {
  const returns = [...SPREAD, ...CLUSTER];
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    ...returns.map((d, i) =>
      mk(kidId, artifactId, actionType, d, `${tag}-r${i}`, {
        ...(i === returns.length - 1
          ? { depthSignals: [{ kind: "artifact_competence", value: 1 }] }
          : {}),
      }),
    ),
  ];
}

/** Confident but NO gate spread + NO artifact: novel + a recent cluster only (span < 56d). */
function confidentOnlyLog(
  kidId: string,
  artifactId: string,
  actionType: string,
  tag: string,
): Interaction[] {
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    ...CLUSTER.map((d, i) =>
      mk(kidId, artifactId, actionType, d, `${tag}-r${i}`, {
        ...(i === CLUSTER.length - 1
          ? { depthSignals: [{ kind: "artifact_competence", value: 1 }] }
          : {}),
      }),
    ),
  ];
}

/** Thin: a novel first exposure + a single prompted return → stays EXPLORING, empty gate timeline. */
function thinLog(
  kidId: string,
  artifactId: string,
  actionType: string,
  tag: string,
): Interaction[] {
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    mk(kidId, artifactId, actionType, "2026-03-25", `${tag}-p0`, { prompted: true }),
  ];
}

/**
 * Thin AND gone quiet: `thinLog` plus one more self-initiated touch the day after the exposure, so
 * the cell has a real cross-day return to have gone quiet on. Both early touches sit inside the
 * novelty window, so the cell still reaches neither the belief nor the gate and still reads
 * EXPLORING; the extra day is visible only to wellbeing's missingness signal.
 *
 * Split out from `thinLog` under E2: a first-ever engagement is a `same_day_engagement`, not a
 * return, so a lone exposure leaves nothing to have gone quiet on. "Too sparse to say anything
 * about" (Cyrus) and "engaged once, then silence" (Ari's dance, Dulce's physics) used to be the
 * same log by coincidence and are now genuinely different shapes.
 */
function quietLog(
  kidId: string,
  artifactId: string,
  actionType: string,
  tag: string,
): Interaction[] {
  return [
    mk(kidId, artifactId, actionType, NOVEL, `${tag}-x0`),
    mk(kidId, artifactId, actionType, NOVEL_NEXT, `${tag}-x1`),
    mk(kidId, artifactId, actionType, "2026-03-25", `${tag}-p0`, { prompted: true }),
  ];
}

// Cell keys / artifact refs used both in fixtures and for the human transitions below.
const DULCE_GAMEDEV = serializeCellKey(["code-computers", "game-dev"], "build");
const DULCE_PROD = serializeCellKey(["music-sound", "production"], "build");
const DULCE_PHYSICS = serializeCellKey(["science-nature", "physics"], "investigate");
const ELLE_PROD = serializeCellKey(["music-sound", "production"], "build");

// ── Elle (kid-synthetic-005): an ACTIVE specialization that has gone quiet ────────────
// The one synthetic child whose ACTIVE pursuit raises a wellbeing escalation, so the 016 recovery
// surface (#282) has a realistic trigger to demo. She is built in TWO clock phases on purpose: a
// single-clock fixture cannot make a cell BOTH confident-at-now (which it must be to have been
// promoted to ACTIVE) AND gone-quiet (the burnout signal). The 14-day recency half-life means a cell
// quiet long enough to read as devaluation has already decayed below the MIN_EVIDENCE_MASS floor. So
// we run her hot log at an EARLIER clock (`ELLE_HOT_NOW`), promote to ACTIVE there — exactly as a
// guide would have when she was thriving — then append only prompted returns and re-derive at
// PILOT_NOW. 013 never demotes on silence, so the ACTIVE state persists while wellbeing now reads
// devaluation (still turning up, but prompted-only and no longer going deep) ⇒ BURNOUT_TIP.
const ELLE_HOT_NOW = "2026-03-08T00:00:00.000Z"; // when she was thriving and a guide promoted her
const ELLE_NOVEL = "2025-12-20";
const ELLE_SPREAD = ["2026-01-02", "2026-01-20"]; // gate spread: a >14d gap and a >56d term
// A dense voluntary cluster every other day, ending two days before ELLE_HOT_NOW so it is confident
// AT THAT CLOCK. By PILOT_NOW these have aged into the 21-42d "prior voluntary depth" window.
const ELLE_HOT = [
  "2026-02-16",
  "2026-02-18",
  "2026-02-20",
  "2026-02-22",
  "2026-02-24",
  "2026-02-26",
  "2026-02-28",
  "2026-03-02",
  "2026-03-04",
  "2026-03-06",
];
// Since promotion she only shows up when nudged: prompted, no depth, no voluntary return. This is the
// devaluation pattern — presence without depth — inside the recent 21-day wellbeing window.
const ELLE_PROMPTED = ["2026-03-13", "2026-03-16", "2026-03-20", "2026-03-24", "2026-03-28"];

/** Elle's hot phase: novel + gate spread + a confident voluntary cluster (depth on the last). */
function elleHotLog(): Interaction[] {
  const returns = [...ELLE_SPREAD, ...ELLE_HOT];
  return [
    mk("kid-synthetic-005", "elle-production", "assemble", ELLE_NOVEL, "elle-prod-x0"),
    ...returns.map((d, i) =>
      mk("kid-synthetic-005", "elle-production", "assemble", d, `elle-prod-r${i}`, {
        ...(i === returns.length - 1
          ? { depthSignals: [{ kind: "artifact_competence", value: 1 }] }
          : {}),
      }),
    ),
  ];
}

/** Elle's quiet phase: prompted-only returns, no depth (the devaluation the escalation reads). */
const ELLE_PROMPTED_LOG: Interaction[] = ELLE_PROMPTED.map((d, i) =>
  mk("kid-synthetic-005", "elle-production", "assemble", d, `elle-prod-p${i}`, { prompted: true }),
);

const ELLE_ARTIFACTS = {
  [ELLE_PROD]: "defense-record-305",
};

// ── Per-kid interaction logs ─────────────────────────────────────────────────────
const ARI_LOG: Interaction[] = [
  ...strongLog("kid-synthetic-001", "ari-audio", "assemble", "ari-audio"),
  ...quietLog("kid-synthetic-001", "ari-dance", "play", "ari-dance"),
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
  ...quietLog("kid-synthetic-004", "dulce-physics", "inspect", "dulce-physics"),
];

const ARI_ARTIFACTS = {
  [serializeCellKey(["music-sound", "audio-systems"], "build")]: "defense-record-042",
};
const BEX_ARTIFACTS = {
  [serializeCellKey(["games-strategy", "chess"], "perform")]: "defense-record-113",
};
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
    runCycle(
      emptyProfile(
        "kid-synthetic-001",
        "Ari Mercado",
        PILOT_PRIORS["kid-synthetic-001"],
        ARI_ARTIFACTS,
      ),
      { interactions: ARI_LOG, surfaced: [] },
      ctx,
      now,
    ),
  );
  roster.set(
    "kid-synthetic-002",
    runCycle(
      emptyProfile(
        "kid-synthetic-002",
        "Bex Ito",
        PILOT_PRIORS["kid-synthetic-002"],
        BEX_ARTIFACTS,
      ),
      { interactions: BEX_LOG, surfaced: [] },
      ctx,
      now,
    ),
  );
  roster.set(
    "kid-synthetic-003",
    runCycle(
      emptyProfile("kid-synthetic-003", "Cyrus Okafor", PILOT_PRIORS["kid-synthetic-003"]),
      { interactions: CYRUS_LOG, surfaced: [] },
      ctx,
      now,
    ),
  );

  // Dulce: derive, then apply the human transitions on top of the derived store.
  const dulce0 = runCycle(
    emptyProfile(
      "kid-synthetic-004",
      "Dulce Park",
      PILOT_PRIORS["kid-synthetic-004"],
      DULCE_ARTIFACTS,
    ),
    { interactions: DULCE_LOG, surfaced: [] },
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

  // Elle: promote to ACTIVE at the earlier clock she was thriving at, then re-derive at `now` with
  // only prompted returns appended (013 never demotes on silence). See ELLE_* block above.
  const elleHot = runCycle(
    emptyProfile(
      "kid-synthetic-005",
      "Elle Nkemelu",
      PILOT_PRIORS["kid-synthetic-005"],
      ELLE_ARTIFACTS,
    ),
    { interactions: elleHotLog(), surfaced: [] },
    ctx,
    ELLE_HOT_NOW,
  );
  const elleId = `kid-synthetic-005::${ELLE_PROD}`;
  const elleGate = deriveGates(elleHot, ctx, ELLE_HOT_NOW).get(elleId)!;
  let elleStore = elleHot.store;
  // production: EMERGING → CANDIDATE → ACTIVE (a guide promoted her when the pursuit was thriving)
  elleStore = promote(
    elleStore,
    elleId,
    GUIDE,
    { gate: elleGate, autonomySignOff: true },
    ELLE_HOT_NOW,
  );
  elleStore = promote(
    elleStore,
    elleId,
    GUIDE,
    { gate: elleGate, autonomySignOff: true },
    ELLE_HOT_NOW,
  );
  // Re-derive at `now` with the quiet prompted-only tail appended; ACTIVE is preserved.
  const elle = runCycle(
    { ...elleHot, store: elleStore },
    { interactions: ELLE_PROMPTED_LOG, surfaced: [] },
    ctx,
    now,
  );
  roster.set("kid-synthetic-005", elle);
  return roster;
}
