# Hypothesis Store + Guide Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps.

**Goal:** Build `013-hypothesis-store` per its spec — a headless domain package (`@gt100k/hypothesis-store`: hypotheses, lifecycle, graduation gate, console view-model) + a Next guide-console app (`@gt100k/guide-console`) that renders it and implements the `window.__qa` contract.

**Architecture:** Pure domain package (immutable store value + pure transitions) importing `@gt100k/interest-inference`. A Next 14 app renders the view-model and drives the transitions; CI tests cover the domain + pure app helpers; the served app is verified by the `LOOP_QA` usability gate.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; Next 14 / React 18 / motion@12 for the app (mirrors `apps/evidence-explorer`).

## Global Constraints
- **SYNTHETIC ONLY.** Domain gate = `pnpm exec tsc -b` + `pnpm test`; app = `next build` + `LOOP_QA` usability pass.
- **`pnpm install` (NOT `--frozen`) required** after each new `package.json` (imports `@gt100k/interest-inference` by name; the app adds Next/React deps). Lockfile committed.
- `import type` for types; guard `T | undefined`. Store is an **immutable value**; transitions return a new store; **never mutate**, **never delete** (park/reopen).
- **Human authority:** `promote/park/reopen/contest` require a `HumanActor` whose role is not `MODEL`/`SYSTEM`; `promote` also requires `gate.passed && autonomySignOff`.
- **Never** a scalar passion score / fixed label. Constants golden (spec §3.4). Commit after each task.
- **App `window.__qa`:** `ready`, `error`, `state()` (small: `{ selectedId, count, states }`), `primaryAction()` (promote the top gate-passed candidate).

---

### Task 0: Scaffold domain package

**Files:** `passion/packages/hypothesis-store/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.

- [ ] **Step 1: smoke test** (as in prior plans).
- [ ] **Step 2: package.json**
```json
{
  "name": "@gt100k/hypothesis-store", "version": "0.1.0", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" },
  "dependencies": { "@gt100k/interest-inference": "workspace:*" },
  "scripts": { "test": "vitest run --root ../.. packages/hypothesis-store/test" }
}
```
- [ ] **Step 3: tsconfig.json** — extends base; `references: [{ "path": "../interest-inference" }]`; include src+test.
- [ ] **Step 4:** `src/index.ts` → `export {};`
- [ ] **Step 5:** append `{ "path": "passion/packages/hypothesis-store" }` to root references (keep existing).
- [ ] **Step 6: Install + gate** → `pnpm install` then `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 7: Commit** → `feat(hypothesis): scaffold @gt100k/hypothesis-store` (add pnpm-lock.yaml).

---

### Task 1: Lifecycle types + transition legality (P0)

**Files:** `src/lifecycle.ts`, `test/lifecycle.test.ts`.

**Interfaces:** `Lifecycle`, `LIFECYCLE`, `TransitionKind`, `canTransition(from, to, by): boolean`, constants `GAP_DAYS/MIN_TERM_DAYS/MIN_REVIEW_CYCLES/SPIKE_THRESHOLD`.

- [ ] **Step 1: Failing test**
```ts
// test/lifecycle.test.ts
import { describe, it, expect } from "vitest";
import { canTransition } from "../src/lifecycle.js";

describe("transition legality", () => {
  it("auto EXPLORING→EMERGING allowed; auto EMERGING→CANDIDATE forbidden", () => {
    expect(canTransition("EXPLORING", "EMERGING", "auto")).toBe(true);
    expect(canTransition("EMERGING", "CANDIDATE", "auto")).toBe(false); // human-only
    expect(canTransition("EMERGING", "CANDIDATE", "human")).toBe(true);
  });
  it("no demote on silence (EMERGING→EXPLORING never)", () => {
    expect(canTransition("EMERGING", "EXPLORING", "auto")).toBe(false);
    expect(canTransition("EMERGING", "EXPLORING", "human")).toBe(false);
  });
  it("park is human + always from a live state; reopen→EMERGING", () => {
    expect(canTransition("CANDIDATE", "PARKED", "human")).toBe(true);
    expect(canTransition("PARKED", "REOPENED", "human")).toBe(true);
    expect(canTransition("REOPENED", "EMERGING", "human")).toBe(true);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: lifecycle.ts**
```ts
// src/lifecycle.ts
export const LIFECYCLE = ["EXPLORING", "EMERGING", "CANDIDATE", "ACTIVE", "PARKED", "CONTESTED", "REOPENED"] as const;
export type Lifecycle = (typeof LIFECYCLE)[number];
export type TransitionKind = "auto" | "human";

export const GAP_DAYS = 14;
export const MIN_TERM_DAYS = 56;
export const MIN_REVIEW_CYCLES = 2;
export const SPIKE_THRESHOLD = 0.6;

// Allowed transitions. `auto` = system (applyInterestRead); `human` = a named human actor.
const AUTO: ReadonlyArray<readonly [Lifecycle, Lifecycle]> = [
  ["EXPLORING", "EMERGING"],
  ["EMERGING", "CONTESTED"],
  ["CANDIDATE", "CONTESTED"],
];
const HUMAN: ReadonlyArray<readonly [Lifecycle, Lifecycle]> = [
  ["EMERGING", "CANDIDATE"],
  ["CANDIDATE", "ACTIVE"],
  ["EMERGING", "PARKED"], ["CANDIDATE", "PARKED"], ["ACTIVE", "PARKED"], ["CONTESTED", "PARKED"], ["EXPLORING", "PARKED"],
  ["PARKED", "REOPENED"],
  ["REOPENED", "EMERGING"],
  ["CONTESTED", "EMERGING"],
];

export function canTransition(from: Lifecycle, to: Lifecycle, by: TransitionKind): boolean {
  const table = by === "auto" ? AUTO : [...AUTO, ...HUMAN]; // humans may also do the auto ones
  return table.some(([f, t]) => f === from && t === to);
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(hypothesis): lifecycle states + transition legality`.

---

### Task 2: Hypothesis records + applyInterestRead (P1)

**Files:** `src/model.ts`, `src/store.ts`, `test/apply.test.ts`.

**Interfaces:** `InterestHypothesis`, `HumanActor`, `HistoryEntry`, `HypothesisStore`, `emptyStore()`, `applyInterestRead(store, kidId, read, now): HypothesisStore`.

- [ ] **Step 1: Failing test**
```ts
// test/apply.test.ts
import { describe, it, expect } from "vitest";
import { emptyStore, applyInterestRead, getForKid } from "../src/store.js";
import type { InterestRead } from "@gt100k/interest-inference";

const NOW = "2026-02-01T00:00:00.000Z";
function read(confident: boolean, lowerBound: number): InterestRead {
  return {
    cells: [{ cellKey: "music-sound/audio-systems::build", domainPath: ["music-sound", "audio-systems"], mode: "build",
      alpha: 5, beta: 1.5, mean: 0.77, sd: 0.14, lowerBound, evidenceMass: 4.5, confident,
      attribution: confident ? "style" : null, supporting: ["voluntary_return"], disconfirming: [] }],
    candidates: confident ? [{ cellKey: "music-sound/audio-systems::build", domainPath: ["music-sound", "audio-systems"], mode: "build", lowerBound, attribution: "style" }] : [],
  };
}

describe("applyInterestRead", () => {
  it("creates EXPLORING, auto-advances to EMERGING when confident, bumps version + history", () => {
    let s = applyInterestRead(emptyStore(), "kid-1", read(false, 0.4), NOW);
    let h = getForKid(s, "kid-1")[0]!;
    expect(h.state).toBe("EXPLORING");
    s = applyInterestRead(s, "kid-1", read(true, 0.64), "2026-02-08T00:00:00.000Z");
    h = getForKid(s, "kid-1")[0]!;
    expect(h.state).toBe("EMERGING");
    expect(h.version).toBe(2);
    expect(h.history.at(-1)!.to).toBe("EMERGING");
  });
  it("sets CONTESTED when lowerBound falls below threshold after being above", () => {
    let s = applyInterestRead(emptyStore(), "kid-1", read(true, 0.7), NOW);
    s = applyInterestRead(s, "kid-1", read(true, 0.5), "2026-03-01T00:00:00.000Z");
    expect(getForKid(s, "kid-1")[0]!.state).toBe("CONTESTED");
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: model.ts**
```ts
// src/model.ts
import type { Attribution, DomainPath } from "@gt100k/interest-inference";
import type { Lifecycle } from "./lifecycle.js";

export interface HumanActor { readonly id: string; readonly role: string; }
export interface HistoryEntry { readonly at: string; readonly from: Lifecycle; readonly to: Lifecycle; readonly actor: string; readonly reason: string; }

export interface HypothesisEvidence {
  readonly mean: number; readonly lowerBound: number; readonly confident: boolean;
  readonly attribution: Attribution | null; readonly supporting: readonly string[]; readonly disconfirming: readonly string[];
  readonly wasAboveThreshold: boolean; // sticky: true once lowerBound ≥ SPIKE_THRESHOLD (for CONTESTED detection)
}

export interface InterestHypothesis {
  readonly id: string; readonly kidId: string; readonly cellKey: string; readonly domainPath: DomainPath; readonly mode: string;
  readonly state: Lifecycle; readonly version: number;
  readonly evidence: HypothesisEvidence;
  readonly perseveranceArtifactRef?: string;
  readonly history: readonly HistoryEntry[];
  readonly createdAt: string; readonly updatedAt: string;
}

export interface HypothesisStore { readonly byId: Readonly<Record<string, InterestHypothesis>>; }
```
- [ ] **Step 4: store.ts**
```ts
// src/store.ts
import type { InterestRead } from "@gt100k/interest-inference";
import type { HypothesisStore, InterestHypothesis, HistoryEntry } from "./model.js";
import { SPIKE_THRESHOLD, canTransition } from "./lifecycle.js";

export function emptyStore(): HypothesisStore { return { byId: {} }; }
export function getForKid(store: HypothesisStore, kidId: string): InterestHypothesis[] {
  return Object.values(store.byId).filter((h) => h.kidId === kidId).sort((a, b) => b.evidence.lowerBound - a.evidence.lowerBound || a.cellKey.localeCompare(b.cellKey));
}
const hid = (kidId: string, cellKey: string): string => `${kidId}::${cellKey}`;

export function applyInterestRead(store: HypothesisStore, kidId: string, read: InterestRead, now: string): HypothesisStore {
  const byId: Record<string, InterestHypothesis> = { ...store.byId };
  for (const cell of read.cells) {
    const id = hid(kidId, cell.cellKey);
    const prev = byId[id];
    const wasAbove = (prev?.evidence.wasAboveThreshold ?? false) || cell.lowerBound >= SPIKE_THRESHOLD;
    const evidence = {
      mean: cell.mean, lowerBound: cell.lowerBound, confident: cell.confident,
      attribution: cell.attribution, supporting: cell.supporting, disconfirming: cell.disconfirming, wasAboveThreshold: wasAbove,
    };
    if (!prev) {
      const created: InterestHypothesis = { id, kidId, cellKey: cell.cellKey, domainPath: cell.domainPath, mode: cell.mode,
        state: "EXPLORING", version: 1, evidence, history: [{ at: now, from: "EXPLORING", to: "EXPLORING", actor: "SYSTEM", reason: "created" }],
        createdAt: now, updatedAt: now };
      byId[id] = advance(created, now); // MUST advance on creation too — a first read that is already `confident` auto-advances EXPLORING→EMERGING
    } else {
      byId[id] = advance({ ...prev, evidence, version: prev.version + 1, updatedAt: now }, now);
    }
  }
  return { byId };
}

// Auto transitions only (system): EXPLORING→EMERGING on confident; →CONTESTED when it fell below threshold after being above.
function advance(h: InterestHypothesis, now: string): InterestHypothesis {
  const below = h.evidence.lowerBound < SPIKE_THRESHOLD && h.evidence.wasAboveThreshold;
  if ((h.state === "EMERGING" || h.state === "CANDIDATE") && below && canTransition(h.state, "CONTESTED", "auto")) {
    return withState(h, "CONTESTED", "SYSTEM", "lowerBound fell below threshold", now);
  }
  if (h.state === "EXPLORING" && h.evidence.confident && canTransition("EXPLORING", "EMERGING", "auto")) {
    return withState(h, "EMERGING", "SYSTEM", "confident", now);
  }
  return h;
}

export function withState(h: InterestHypothesis, to: InterestHypothesis["state"], actor: string, reason: string, now: string): InterestHypothesis {
  const entry: HistoryEntry = { at: now, from: h.state, to, actor, reason };
  return { ...h, state: to, updatedAt: now, history: [...h.history, entry] };
}
```
- [ ] **Step 5: Run** → PASS. **Step 6: Commit** → `feat(hypothesis): records + applyInterestRead (auto lifecycle)`.

---

### Task 3: Graduation gate (P2)

**Files:** `src/gate.ts`, `test/gate.test.ts`.

**Interfaces:** `GateStatus`, `evaluateGate(hyp, returnTimeline, now): GateStatus` where `returnTimeline: readonly string[]` = voluntary, non-novel return timestamps for the cell.

- [ ] **Step 1: Failing golden test**
```ts
// test/gate.test.ts
import { describe, it, expect } from "vitest";
import { evaluateGate } from "../src/gate.js";
import type { InterestHypothesis } from "../src/model.js";

const base: InterestHypothesis = {
  id: "kid::c", kidId: "kid", cellKey: "c", domainPath: ["music-sound"], mode: "build",
  state: "EMERGING", version: 1,
  evidence: { mean: 0.8, lowerBound: 0.7, confident: true, attribution: "style", supporting: [], disconfirming: [], wasAboveThreshold: true },
  perseveranceArtifactRef: "defense-1", history: [], createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
};
const NOW = Date.parse("2026-04-01T00:00:00.000Z");
// returns: day 0, day 20 (>14 gap), day 60 (>56 term, 3rd occasion)
const timeline = ["2026-01-01T00:00:00.000Z", "2026-01-21T00:00:00.000Z", "2026-03-02T00:00:00.000Z"];

describe("evaluateGate", () => {
  it("passes with gap + durability + artifact", () => {
    const g = evaluateGate(base, timeline, NOW);
    expect(g).toEqual({ gapSurvived: true, durable: true, hasArtifact: true, passed: true });
  });
  it("flips gapSurvived when all returns are clustered (<14d apart)", () => {
    const g = evaluateGate(base, ["2026-01-01T00:00:00.000Z", "2026-01-05T00:00:00.000Z"], NOW);
    expect(g.gapSurvived).toBe(false);
    expect(g.passed).toBe(false);
  });
  it("flips hasArtifact when the ref is absent", () => {
    const g = evaluateGate({ ...base, perseveranceArtifactRef: undefined }, timeline, NOW);
    expect(g.hasArtifact).toBe(false);
    expect(g.passed).toBe(false);
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: gate.ts**
```ts
// src/gate.ts
import type { InterestHypothesis } from "./model.js";
import { GAP_DAYS, MIN_TERM_DAYS, MIN_REVIEW_CYCLES } from "./lifecycle.js";

export interface GateStatus {
  readonly gapSurvived: boolean;
  readonly durable: boolean;
  readonly hasArtifact: boolean;
  readonly passed: boolean;
}

export function evaluateGate(hyp: InterestHypothesis, returnTimeline: readonly string[], now: number): GateStatus {
  const times = returnTimeline.map((t) => Date.parse(t)).filter((t) => !Number.isNaN(t)).sort((a, b) => a - b);

  // gap-survival: at least one consecutive pair separated by ≥ GAP_DAYS (a return after a quiet gap)
  let gapSurvived = false;
  for (let i = 1; i < times.length; i++) {
    if ((times[i]! - times[i - 1]!) / 86400000 >= GAP_DAYS) { gapSurvived = true; break; }
  }

  // durability: span ≥ MIN_TERM_DAYS AND ≥ MIN_REVIEW_CYCLES distinct occasions
  const first = times[0];
  const last = times[times.length - 1];
  const spanDays = first !== undefined && last !== undefined ? (last - first) / 86400000 : 0;
  const durable = times.length >= MIN_REVIEW_CYCLES && spanDays >= MIN_TERM_DAYS;

  const hasArtifact = typeof hyp.perseveranceArtifactRef === "string" && hyp.perseveranceArtifactRef.length > 0;
  return { gapSurvived, durable, hasArtifact, passed: gapSurvived && durable && hasArtifact };
}
```
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(hypothesis): Phase 2→3 graduation gate`.

---

### Task 4: Human transitions (P3)

**Files:** `src/actions.ts`, `test/actions.test.ts`.

**Interfaces:** `promote(store, id, actor, opts)`, `park(store, id, actor, reason)`, `reopen(store, id, actor)`, `contest(store, id, actor, reason)` — all return a new store or throw.

- [ ] **Step 1: Failing test**
```ts
// test/actions.test.ts
import { describe, it, expect } from "vitest";
import { emptyStore, applyInterestRead, getForKid } from "../src/store.js";
import { promote, park, reopen } from "../src/actions.js";
import type { HumanActor } from "../src/model.js";
import type { GateStatus } from "../src/gate.js";
import type { InterestRead } from "@gt100k/interest-inference";

const human: HumanActor = { id: "guide-1", role: "guide" };
const model: HumanActor = { id: "m", role: "MODEL" };
const passed: GateStatus = { gapSurvived: true, durable: true, hasArtifact: true, passed: true };
const NOW = "2026-04-01T00:00:00.000Z";
const emerging: InterestRead = { cells: [{ cellKey: "c", domainPath: ["music-sound"], mode: "build", alpha: 5, beta: 1, mean: 0.8, sd: 0.1, lowerBound: 0.7, evidenceMass: 4, confident: true, attribution: "style", supporting: [], disconfirming: [] }], candidates: [{ cellKey: "c", domainPath: ["music-sound"], mode: "build", lowerBound: 0.7, attribution: "style" }] };

function seed() { return applyInterestRead(emptyStore(), "kid", emerging, NOW); } // → EMERGING

describe("human transitions", () => {
  it("promote requires human + passed gate + signOff", () => {
    const s = seed(); const id = getForKid(s, "kid")[0]!.id;
    expect(() => promote(s, id, model, { gate: passed, autonomySignOff: true }, NOW)).toThrow();          // non-human
    expect(() => promote(s, id, human, { gate: { ...passed, passed: false }, autonomySignOff: true }, NOW)).toThrow(); // gate not passed
    expect(() => promote(s, id, human, { gate: passed, autonomySignOff: false }, NOW)).toThrow();          // no signOff
    const s2 = promote(s, id, human, { gate: passed, autonomySignOff: true }, NOW);
    expect(getForKid(s2, "kid")[0]!.state).toBe("CANDIDATE");
  });
  it("park is always allowed + reversible; reopen→EMERGING; nothing deleted", () => {
    const s = seed(); const id = getForKid(s, "kid")[0]!.id;
    const parked = park(s, id, human, "kid asked to pause", NOW);
    expect(getForKid(parked, "kid")[0]!.state).toBe("PARKED");
    const reopened = reopen(parked, id, human, NOW);
    expect(["REOPENED", "EMERGING"]).toContain(getForKid(reopened, "kid")[0]!.state);
    expect(Object.keys(reopened.byId)).toHaveLength(1); // never deleted
  });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: actions.ts**
```ts
// src/actions.ts
import type { HypothesisStore, HumanActor } from "./model.js";
import { withState } from "./store.js";
import { canTransition } from "./lifecycle.js";
import type { GateStatus } from "./gate.js";

function assertHuman(actor: HumanActor): void {
  const role = actor.role.toUpperCase();
  if (role === "MODEL" || role === "SYSTEM") throw new Error(`human actor required; got role=${actor.role}`);
}
function require(store: HypothesisStore, id: string) {
  const h = store.byId[id];
  if (!h) throw new Error(`no hypothesis ${id}`);
  return h;
}
function put(store: HypothesisStore, h: HypothesisStore["byId"][string]): HypothesisStore {
  return { byId: { ...store.byId, [h.id]: h } };
}

export function promote(store: HypothesisStore, id: string, actor: HumanActor, opts: { gate: GateStatus; autonomySignOff: boolean }, now: string): HypothesisStore {
  assertHuman(actor);
  const h = require(store, id);
  const to = h.state === "CANDIDATE" ? "ACTIVE" : "CANDIDATE";
  if (to === "CANDIDATE") {
    if (!opts.gate.passed) throw new Error("gate not passed");
    if (!opts.autonomySignOff) throw new Error("autonomy sign-off required");
  }
  if (!canTransition(h.state, to, "human")) throw new Error(`illegal transition ${h.state}→${to}`);
  return put(store, withState(h, to, actor.id, to === "CANDIDATE" ? "promoted (gate+signoff)" : "activated", now));
}

export function park(store: HypothesisStore, id: string, actor: HumanActor, reason: string, now: string): HypothesisStore {
  assertHuman(actor);
  const h = require(store, id);
  if (!canTransition(h.state, "PARKED", "human")) throw new Error(`cannot park from ${h.state}`);
  return put(store, withState(h, "PARKED", actor.id, reason, now));
}

export function reopen(store: HypothesisStore, id: string, actor: HumanActor, now: string): HypothesisStore {
  assertHuman(actor);
  const h = require(store, id);
  if (h.state !== "PARKED") throw new Error(`can only reopen a PARKED hypothesis`);
  const reopened = withState(h, "REOPENED", actor.id, "reopened", now);
  return put(store, withState(reopened, "EMERGING", actor.id, "resume exploring", now));
}

export function contest(store: HypothesisStore, id: string, actor: HumanActor, reason: string, now: string): HypothesisStore {
  assertHuman(actor);
  const h = require(store, id);
  if (!canTransition(h.state, "CONTESTED", "human")) throw new Error(`cannot contest from ${h.state}`);
  return put(store, withState(h, "CONTESTED", actor.id, reason, now));
}
```
> `require` shadows a global-ish name; rename to `mustGet` to avoid confusion with CommonJS `require` (ESM has none, but keep it clean). Use `mustGet` in the final code.
- [ ] **Step 4: Run** → PASS. **Step 5: Commit** → `feat(hypothesis): human-owned transitions (promote/park/reopen/contest)`.

---

### Task 5: Console view-model (P4)

**Files:** `src/view.ts`, `test/view.test.ts`.

**Interfaces:** `HypothesisCard`, `consoleViewModel(store, kidId, gates?): { kidId; cards: HypothesisCard[] }`.

- [ ] **Step 1: Failing test** — assert cards ranked by lowerBound; `supporting`/`disconfirming` present as separate arrays; `allowedActions` reflects state per `actionsFor` (EMERGING → `["promote","park","contest"]`; CANDIDATE → `["promote","park","contest"]`; ACTIVE/CONTESTED → `["park"]`; PARKED → `["reopen"]`); no scalar `score` field. (Assert against the exact `actionsFor` output — do not hand-write a shorter list.)
- [ ] **Step 2: Implement view.ts**
```ts
// src/view.ts
import type { HypothesisStore, InterestHypothesis } from "./model.js";
import type { GateStatus } from "./gate.js";
import { getForKid } from "./store.js";

export interface HypothesisCard {
  readonly id: string; readonly cellKey: string; readonly domainPath: readonly string[]; readonly mode: string;
  readonly state: InterestHypothesis["state"]; readonly lowerBound: number; readonly confident: boolean;
  readonly attribution: string | null;
  readonly supporting: readonly string[]; readonly disconfirming: readonly string[]; // separate — never summed
  readonly gate?: GateStatus;
  readonly allowedActions: readonly string[];
}

function actionsFor(state: InterestHypothesis["state"]): string[] {
  switch (state) {
    case "EMERGING": return ["promote", "park", "contest"];
    case "CANDIDATE": return ["promote", "park", "contest"];
    case "ACTIVE": return ["park"];
    case "CONTESTED": return ["park"];
    case "PARKED": return ["reopen"];
    default: return ["park"];
  }
}

export function consoleViewModel(store: HypothesisStore, kidId: string, gates: ReadonlyMap<string, GateStatus> = new Map()): { kidId: string; cards: HypothesisCard[] } {
  const cards = getForKid(store, kidId).map((h): HypothesisCard => ({
    id: h.id, cellKey: h.cellKey, domainPath: h.domainPath, mode: h.mode, state: h.state,
    lowerBound: h.evidence.lowerBound, confident: h.evidence.confident, attribution: h.evidence.attribution,
    supporting: h.evidence.supporting, disconfirming: h.evidence.disconfirming,
    gate: gates.get(h.id),
    allowedActions: actionsFor(h.state),
  }));
  return { kidId, cards };
}
```
- [ ] **Step 3: index.ts** → export lifecycle, model, store, gate, actions, view.
- [ ] **Step 4: Run + Commit** → `feat(hypothesis): console view-model`.

---

### Task 6: Guide-console app scaffold + `window.__qa` (P5)

**Files:** `passion/apps/guide-console/{package.json,next.config.mjs,tsconfig.json,app/layout.tsx,app/page.tsx,app/qa.ts,app/seed.ts,app/console-state.ts,test/state.test.ts,vitest.config.mts}`; root `tsconfig.json`.

- [ ] **Step 1: package.json** (mirror evidence-explorer)
```json
{
  "name": "@gt100k/guide-console", "version": "0.1.0", "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start", "test": "vitest run --config vitest.config.mts" },
  "dependencies": {
    "@gt100k/hypothesis-store": "workspace:*", "@gt100k/interest-inference": "workspace:*",
    "motion": "^12.42.0", "next": "^14.2.15", "react": "^18.3.1", "react-dom": "^18.3.1"
  },
  "devDependencies": { "@types/react": "^18.3.12", "@types/react-dom": "^18.3.1" }
}
```
- [ ] **Step 2: next.config.mjs** — `transpilePackages: ["@gt100k/hypothesis-store","@gt100k/interest-inference"]` + the `.js→.ts/.tsx` extensionAlias (mirror evidence-explorer).
- [ ] **Step 3: seed.ts** — build a synthetic store from a seeded `InterestRead` (one confident candidate + one thin cell) via `applyInterestRead`.
- [ ] **Step 4: console-state.ts** — a pure `buildQaState(store, kidId, selectedId)` → `{ selectedId, count, states }` (used by both the page and the CI test).
```ts
// app/console-state.ts
import type { HypothesisStore } from "@gt100k/hypothesis-store";
import { getForKid } from "@gt100k/hypothesis-store";
export function buildQaState(store: HypothesisStore, kidId: string, selectedId: string | null) {
  const cards = getForKid(store, kidId);
  return { selectedId, count: cards.length, states: cards.map((h) => h.state) };
}
```
- [ ] **Step 5: qa.ts** — a helper that installs `window.__qa` given `state()` + `primaryAction()`; called from the page's effect. `ready:true`, `error:null`.
- [ ] **Step 6: page.tsx** — a client component: holds `store` in `useState` (seeded), renders `consoleViewModel(store, kidId).cards` (each card: domain/mode, state, separate supporting/disconfirming lists, lowerBound, allowedActions as buttons); buttons call `promote/park/reopen` (with a hardcoded synthetic `guide` actor + a passed-gate/signoff toggle for the demo) and `setStore`.
  - **`window.__qa` must not go stale.** Keep the latest `store`/`selectedId` in a `ref` updated every render, and install `window.__qa` once with `state: () => buildQaState(ref.current.store, kidId, ref.current.selectedId)` and `primaryAction: () => ref.current.promoteTopCandidate()` — so the harness's before/after `state()` diff reads *current* state, never a stale closure. (Equivalently, re-run the install effect on `[store, selectedId]`; the ref pattern is simpler + avoids re-registering.)
  - `ready:true`, `error:null` set once mounted. Reduced-motion respected; WCAG roles/labels; calm styling (no game).
- [ ] **Step 7: layout.tsx** — minimal HTML shell + a `globals.css` (calm, legible, `prefers-reduced-motion`).
- [ ] **Step 8: vitest.config.mts** — node env; include `test/**`.
- [ ] **Step 9: state.test.ts** — CI test on `buildQaState` + `consoleViewModel` wiring (pure; no jsdom). The real DOM is verified by `LOOP_QA`.
- [ ] **Step 10:** **Do NOT add the app to root `tsconfig.json` references.** Confirmed: root references list only packages + adapters, never apps (`apps/evidence-explorer` is absent). Next apps are typechecked/built by `next build` + their own tsconfig, not the root `tsc -b` composite. Only `passion/packages/hypothesis-store` goes in root references (Task 0 Step 5). The guide-console app gets its own `tsconfig.json` (extends base, `jsx: "preserve"`, `noEmit`, includes `app/**` + `test/**`; mirror `apps/evidence-explorer/tsconfig.json`).
- [ ] **Step 11: Install + gate** → `pnpm install`; `pnpm exec tsc -b && pnpm test`; `pnpm --filter @gt100k/guide-console build`.
- [ ] **Step 12: Commit** → `feat(guide-console): Next app scaffold + window.__qa + seed`.

> **Check evidence-explorer's root-reference treatment first** (Step 10): Next apps often aren't part of the `tsc -b` composite (they build via `next build`). Match whatever `apps/evidence-explorer` does so `tsc -b` stays green.

---

### Task 7: Console interactions + a11y + LOOP_QA (P6)

- [ ] **Step 1:** Wire promote/park/reopen buttons → store transitions → re-render; a selection state drives `selectedId`.
- [ ] **Step 2:** `primaryAction()` promotes the top gate-passed candidate (for the demo, seed one hypothesis whose gate passes so `primaryAction` is live and changes `state()`).
- [ ] **Step 3:** a11y pass — semantic landmarks, labelled buttons, focus states, color-independent status, `prefers-reduced-motion` disables motion.
- [ ] **Step 4:** empty/first-run state ("No hypotheses yet — exploration in progress").
- [ ] **Step 5:** README (what the console shows; the `window.__qa` contract; `LOOP_QA` run command).
- [ ] **Step 6: LOOP_QA note** — run with `LOOP_QA=1 LOOP_QA_CMD="pnpm --filter @gt100k/guide-console start" LOOP_QA_PORT=<port>` (after `next build`); the gate drives the console, reads `window.__qa.state()` before/after a promote, and hard-fails if the primary action is dead.
- [ ] **Step 7: Commit** → `feat(guide-console): interactions, a11y, primary action`.

---

## Self-Review
**0. Verification fixes applied (reconstruct-and-run, 30/30 green after fix):** BLOCKER — `applyInterestRead` now routes the **creation** path through `advance()` (a first read that is already `confident` auto-advances EXPLORING→EMERGING; previously it stayed EXPLORING, breaking CONTESTED, promote, §6, and the app's live primaryAction). Minor — Task 5 view-test asserts the exact `actionsFor` output (EMERGING = `["promote","park","contest"]`, not a shorter hand-written list); the app `window.__qa` uses a ref so `state()`/`primaryAction()` never read a stale closure; spec §6 fixtures may be inline. Confirmed-correct + unchanged: gate math (day0/20/60 → passed), lifecycle tables, human-authority, immutability, `mustGet` rename, dependency direction, and the app plan (imports, `transpilePackages`, `window.__qa`, root-tsconfig exclusion, pure `buildQaState`).

**1. Spec coverage:** SC-1→Task1; SC-2→Task2; SC-3→Task3; SC-4→Task4; SC-5→Task4; SC-6→Task5; SC-7→Tasks6–7 (app + LOOP_QA); SC-8→gates. ✓
**2. Placeholders:** the two inline notes (`require`→`mustGet` rename; check evidence-explorer's root-reference treatment) are explicit corrections, not TODOs; all code blocks are complete.
**3. Type consistency:** `HypothesisStore`/`InterestHypothesis`/`HumanActor`/`GateStatus`/`Lifecycle`/`HypothesisCard` defined once; `InterestRead`/`Attribution`/`DomainPath` imported from 011. Store is immutable; transitions return new stores.
**4. Dependency direction:** hypothesis-store → 011; guide-console → {hypothesis-store, 011}; no reverse; no cycle. `pnpm install` documented.
**5. Loop-readiness:** domain headless (tsc+test); app served + `window.__qa` + `LOOP_QA`; human-authority + never-delete + no-scalar-score enforced + tested; `pnpm install` (not frozen) documented.

## Execution Handoff
**Subagent-Driven (recommended)** or **Inline** — which?
