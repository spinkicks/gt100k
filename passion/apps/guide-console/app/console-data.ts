// Synthetic ROSTER for the guide console (SYNTHETIC ONLY — no real child data).
//
// Guides switch between children, so the console needs several kids with varied lifecycle states.
// kid-synthetic-001 is the canonical seed (reused verbatim from seed.ts, so the CI test and the
// LOOP_QA gate are unaffected); kids 002-004 are layered on top to exercise the switcher:
//   002 Bex    — a gate-passed EMERGING candidate + an EMERGING one still short of its gate
//   003 Cyrus  — sparse: everything EXPLORING, nothing confident yet ("nothing sticks — keep sampling")
//   004 Dulce  — established: an ACTIVE spike, a CANDIDATE, and a reversibly PARKED cell
import type { InterestRead } from "@gt100k/interest-inference";
import type { GateStatus, HumanActor, HypothesisStore, InterestHypothesis } from "@gt100k/hypothesis-store";
import { applyInterestRead, evaluateGate, getForKid, park, promote } from "@gt100k/hypothesis-store";
import { SEED_KID, SEED_NOW, SEED_TIMELINE, SEED_TOP_ID, buildSeedStore } from "./seed.js";

export interface Child {
  readonly id: string;
  readonly name: string;
}

export const ROSTER_NOW = SEED_NOW;
const GUIDE: HumanActor = { id: "guide-synthetic", role: "guide" };

export const CHILDREN: readonly Child[] = [
  { id: SEED_KID, name: "Ari Mercado" },
  { id: "kid-synthetic-002", name: "Bex Ito" },
  { id: "kid-synthetic-003", name: "Cyrus Okafor" },
  { id: "kid-synthetic-004", name: "Dulce Park" },
];

// A passing voluntary, non-novel return timeline (day 0 / day 20 / day 60) → clears the gate at NOW.
const PASS_TIMELINE: readonly string[] = SEED_TIMELINE;

interface SeedChild {
  readonly id: string;
  readonly read: InterestRead;
  readonly artifacts?: Readonly<Record<string, string>>; // cellKey → perseverance-artifact ref
  readonly timelines?: Readonly<Record<string, readonly string[]>>; // cellKey → passing return timeline
  readonly promoteTo?: Readonly<Record<string, "CANDIDATE" | "ACTIVE">>; // cellKey → target lifecycle state
  readonly parkCells?: readonly string[]; // cellKeys to reversibly PARK
}

const EXTRA_CHILDREN: readonly SeedChild[] = [
  {
    id: "kid-synthetic-002",
    read: {
      cells: [
        {
          cellKey: "games-logic/chess::compete",
          domainPath: ["games-logic", "chess"],
          mode: "compete",
          alpha: 7.5,
          beta: 2,
          mean: 0.79,
          sd: 0.1,
          lowerBound: 0.69,
          evidenceMass: 6,
          confident: true,
          attribution: "domain",
          supporting: ["voluntary_return", "depth_climb", "perseverance"],
          disconfirming: [],
        },
        {
          cellKey: "computers/software::build",
          domainPath: ["computers", "software"],
          mode: "build",
          alpha: 5,
          beta: 2.2,
          mean: 0.69,
          sd: 0.14,
          lowerBound: 0.58,
          evidenceMass: 4,
          confident: true,
          attribution: "style",
          supporting: ["voluntary_return", "depth_climb"],
          disconfirming: ["skip"],
        },
      ],
      candidates: [
        {
          cellKey: "games-logic/chess::compete",
          domainPath: ["games-logic", "chess"],
          mode: "compete",
          lowerBound: 0.69,
          attribution: "domain",
        },
        {
          cellKey: "computers/software::build",
          domainPath: ["computers", "software"],
          mode: "build",
          lowerBound: 0.58,
          attribution: "style",
        },
      ],
    },
    artifacts: { "games-logic/chess::compete": "defense-record-113" },
    timelines: { "games-logic/chess::compete": PASS_TIMELINE },
  },
  {
    id: "kid-synthetic-003",
    read: {
      cells: [
        {
          cellKey: "visual-art/drawing::create",
          domainPath: ["visual-art", "drawing"],
          mode: "create",
          alpha: 1.5,
          beta: 2,
          mean: 0.43,
          sd: 0.2,
          lowerBound: 0.22,
          evidenceMass: 1,
          confident: false,
          attribution: null,
          supporting: ["prompted_return"],
          disconfirming: ["skip"],
        },
        {
          cellKey: "writing-word/story::create",
          domainPath: ["writing-word", "story"],
          mode: "create",
          alpha: 1.4,
          beta: 1.8,
          mean: 0.44,
          sd: 0.21,
          lowerBound: 0.24,
          evidenceMass: 0.9,
          confident: false,
          attribution: null,
          supporting: ["prompted_return"],
          disconfirming: [],
        },
        {
          cellKey: "science-nature/biology::investigate",
          domainPath: ["science-nature", "biology"],
          mode: "investigate",
          alpha: 1.2,
          beta: 2.4,
          mean: 0.33,
          sd: 0.19,
          lowerBound: 0.18,
          evidenceMass: 1.1,
          confident: false,
          attribution: null,
          supporting: [],
          disconfirming: ["skip"],
        },
      ],
      candidates: [],
    },
  },
  {
    id: "kid-synthetic-004",
    read: {
      cells: [
        {
          cellKey: "games-logic/go::compete",
          domainPath: ["games-logic", "go"],
          mode: "compete",
          alpha: 9,
          beta: 2,
          mean: 0.82,
          sd: 0.09,
          lowerBound: 0.73,
          evidenceMass: 8,
          confident: true,
          attribution: "domain",
          supporting: ["voluntary_return", "depth_climb", "perseverance", "gap_survived"],
          disconfirming: [],
        },
        {
          cellKey: "music-sound/production::build",
          domainPath: ["music-sound", "production"],
          mode: "build",
          alpha: 6,
          beta: 2,
          mean: 0.75,
          sd: 0.12,
          lowerBound: 0.64,
          evidenceMass: 5,
          confident: true,
          attribution: "style",
          supporting: ["voluntary_return", "depth_climb"],
          disconfirming: [],
        },
        {
          cellKey: "sports-body/climbing::perform",
          domainPath: ["sports-body", "climbing"],
          mode: "perform",
          alpha: 4,
          beta: 2.5,
          mean: 0.61,
          sd: 0.16,
          lowerBound: 0.5,
          evidenceMass: 3.2,
          confident: true,
          attribution: "style",
          supporting: ["voluntary_return"],
          disconfirming: ["skip", "devaluation"],
        },
      ],
      candidates: [
        {
          cellKey: "games-logic/go::compete",
          domainPath: ["games-logic", "go"],
          mode: "compete",
          lowerBound: 0.73,
          attribution: "domain",
        },
        {
          cellKey: "music-sound/production::build",
          domainPath: ["music-sound", "production"],
          mode: "build",
          lowerBound: 0.64,
          attribution: "style",
        },
      ],
    },
    artifacts: {
      "games-logic/go::compete": "defense-record-201",
      "music-sound/production::build": "defense-record-202",
    },
    timelines: {
      "games-logic/go::compete": PASS_TIMELINE,
      "music-sound/production::build": PASS_TIMELINE,
    },
    promoteTo: {
      "games-logic/go::compete": "ACTIVE",
      "music-sound/production::build": "CANDIDATE",
    },
    parkCells: ["sports-body/climbing::perform"],
  },
];

const idFor = (kidId: string, cellKey: string): string => `${kidId}::${cellKey}`;

function attachArtifact(store: HypothesisStore, id: string, ref: string): HypothesisStore {
  const h = store.byId[id];
  if (!h) return store;
  const withRef: InterestHypothesis = { ...h, perseveranceArtifactRef: ref };
  return { byId: { ...store.byId, [id]: withRef } };
}

// Build one store holding all four synthetic children. kid-001 comes from the verified seed; the rest
// are applied on top, then artifacts are attached and the human promote/park transitions are replayed
// so the roster shows the full lifecycle range.
export function buildRosterStore(now: string = ROSTER_NOW): HypothesisStore {
  let store = buildSeedStore();
  const nowMs = Date.parse(now);

  for (const child of EXTRA_CHILDREN) {
    store = applyInterestRead(store, child.id, child.read, now);
    for (const [cellKey, ref] of Object.entries(child.artifacts ?? {})) {
      store = attachArtifact(store, idFor(child.id, cellKey), ref);
    }
    for (const [cellKey, target] of Object.entries(child.promoteTo ?? {})) {
      const id = idFor(child.id, cellKey);
      const h = store.byId[id];
      if (!h) continue;
      const gate = evaluateGate(h, child.timelines?.[cellKey] ?? [], nowMs);
      store = promote(store, id, GUIDE, { gate, autonomySignOff: true }, now); // → CANDIDATE
      if (target === "ACTIVE") {
        store = promote(store, id, GUIDE, { gate, autonomySignOff: true }, now); // → ACTIVE
      }
    }
    for (const cellKey of child.parkCells ?? []) {
      const id = idFor(child.id, cellKey);
      if (store.byId[id]) store = park(store, id, GUIDE, "guide parked from console", now);
    }
  }
  return store;
}

// Gate map for EVERY hypothesis of every child, keyed by hypothesis id. kid-001 reuses SEED_TIMELINE
// for its top candidate; the extra children use their own passing timelines (empty ⇒ gate not passed).
export function buildRosterGates(
  store: HypothesisStore,
  now: string = ROSTER_NOW,
): ReadonlyMap<string, GateStatus> {
  const nowMs = Date.parse(now);
  const timelineById = new Map<string, readonly string[]>();
  timelineById.set(SEED_TOP_ID, SEED_TIMELINE);
  for (const child of EXTRA_CHILDREN) {
    for (const [cellKey, timeline] of Object.entries(child.timelines ?? {})) {
      timelineById.set(idFor(child.id, cellKey), timeline);
    }
  }

  const gates = new Map<string, GateStatus>();
  for (const child of CHILDREN) {
    for (const h of getForKid(store, child.id)) {
      gates.set(h.id, evaluateGate(h, timelineById.get(h.id) ?? [], nowMs));
    }
  }
  return gates;
}

export function childInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
