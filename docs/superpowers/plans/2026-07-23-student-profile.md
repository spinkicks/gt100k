# Student Profile + Discovery Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task.

**Goal:** Build `014-student-profile` per its spec — a headless domain package (`@gt100k/student-profile`: the `StudentProfile` record, the pure `runCycle` orchestrator, `deriveGates`, and a `ProfileStore` port + in-memory adapter) + a headless adapter package (`@gt100k/profile-store-fs`: JSON-file-per-kid persistence) + a rewire of `@gt100k/guide-console` so it renders **genuinely-derived** reads over synthetic activity logs.

**Architecture:** The orchestrator is a **pure/sync** function that chains the three green engines — `deriveSignals` (012) → `runInference` (011) → `applyInterestRead` (013) — over a per-kid **append-only interaction log** (the longitudinal source of truth, because inference recomputes from the full log each call). Persistence sits behind an **async `ProfileStore` port** (in-memory adapter for the browser console; a JSON-file adapter for headless/demo). The console builds its roster by calling `runCycle` directly (sync) over bundled fixtures; the `window.__qa` / `LOOP_QA` surface is unchanged.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; the app is Next 14 / React 18 (unchanged from 013).

## Global Constraints
- **SYNTHETIC ONLY.** Domain/adapter gate = `pnpm exec tsc -b` + `pnpm test`; app = `next build` + `LOOP_QA`.
- **`pnpm install` (NOT `--frozen`) required** after each new `package.json` (packages import workspace deps by name). Lockfile committed.
- `import type` for types; guard `T | undefined`. **Reuse** the engine types (`Interaction`, `Artifact`, `DomainPrior`, `InterestRead`, `HypothesisStore`, `GateStatus`) — never redefine.
- Everything is an **immutable value**; `runCycle`/`deriveGates` return new values, never mutate inputs. Never delete/demote (inherited from 013).
- **No network anywhere.** The fs adapter's tests use `os.tmpdir()` + `fs.mkdtemp`.
- Commit after each task. Keep the console UI + `window.__qa` behaviour identical — only the data source changes.

---

### Task 0: Scaffold `@gt100k/student-profile`

**Files:** `passion/packages/student-profile/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.

- [ ] **Step 1: failing smoke test** `test/smoke.test.ts` → `import` from `../src/index.js`, assert a trivial export exists.
- [ ] **Step 2: package.json**
```json
{
  "name": "@gt100k/student-profile", "version": "0.1.0", "private": true, "type": "module",
  "main": "./src/index.ts", "types": "./src/index.ts", "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@gt100k/signal-pipeline": "workspace:*",
    "@gt100k/interest-inference": "workspace:*",
    "@gt100k/hypothesis-store": "workspace:*",
    "@gt100k/two-axis-tagging": "workspace:*"
  },
  "scripts": { "test": "vitest run --root ../.. packages/student-profile/test" }
}
```
- [ ] **Step 3: tsconfig.json** — extends base; `references` to `../signal-pipeline`, `../interest-inference`, `../hypothesis-store`, `../two-axis-tagging`; include `src`+`test`.
- [ ] **Step 4:** `src/index.ts` → `export * from "./model.js";` (create a stub `model.ts` with `export {};` for now, or start with `export {}` and populate in Task 1).
- [ ] **Step 5:** append `{ "path": "passion/packages/student-profile" }` to the root `tsconfig.json` references (keep existing).
- [ ] **Step 6: Install + gate** → `pnpm install` then `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Step 7: Commit** → `feat(profile): scaffold @gt100k/student-profile` (include pnpm-lock.yaml).

---

### Task 1: `StudentProfile` + `runCycle` (P0+P1)

**Files:** `src/model.ts`, `src/orchestrator.ts`, `test/orchestrator.test.ts`; barrel `src/index.ts`.

**Interfaces (`model.ts`):** re-export nothing; define
```ts
import type { Interaction, SurfacedRecord, PipelineConfig } from "@gt100k/signal-pipeline";
import type { DomainPrior } from "@gt100k/interest-inference";
import type { HypothesisStore } from "@gt100k/hypothesis-store";
import type { Artifact } from "@gt100k/two-axis-tagging";

export interface StudentProfile {
  readonly kidId: string;
  readonly displayName: string;
  readonly priors: readonly DomainPrior[];
  readonly interactions: readonly Interaction[];
  readonly perseveranceArtifacts: Readonly<Record<string, string>>;
  readonly store: HypothesisStore;
  readonly updatedAt: string;
}
export interface OrchestratorContext {
  readonly catalog: ReadonlyMap<string, Artifact>;
  readonly surfaced?: readonly SurfacedRecord[];
  readonly config?: Partial<PipelineConfig>;
}
export function emptyProfile(
  kidId: string, displayName: string,
  priors: readonly DomainPrior[] = [],
  perseveranceArtifacts: Readonly<Record<string, string>> = {},
): StudentProfile; // { …, interactions: [], store: emptyStore(), updatedAt: "1970-01-01T00:00:00.000Z" }
```

**`orchestrator.ts`:** `runCycle(profile, newInteractions, ctx, now)` implementing spec §3.2 steps 1–6, using `deriveSignals` (012), `runInference` (011), `applyInterestRead` + `emptyStore` (013). Step 5 `attachArtifacts(store, kidId, refs)`: for each `[cellKey, ref]`, if `store.byId["${kidId}::${cellKey}"]` exists, return a new store with `{ ...hyp, perseveranceArtifactRef: ref }` (immutably). Reuse 013's id convention `${kidId}::${cellKey}`.

- [ ] **Step 1: Failing tests**
```ts
// test/orchestrator.test.ts
import { describe, it, expect } from "vitest";
import { emptyProfile, runCycle } from "../src/index.js";
import { getForKid } from "@gt100k/hypothesis-store";
// build a tiny catalog + a couple interactions inline (one novel + voluntary non-novel returns)

describe("runCycle", () => {
  it("appends to the log and derives hypotheses from the full log", () => { /* store has the expected cell(s) */ });
  it("is idempotent on state: runCycle(p, [], ctx, now).store deep-equals p.store", () => {
    // run once with interactions, then again with [] → stores deep-equal
  });
  it("preserves a human transition across a no-op cycle", () => {
    // promote a hypothesis in p.store, then runCycle(p, [], ctx, now) keeps it CANDIDATE/ACTIVE
  });
});
```
- [ ] **Step 2:** implement `emptyProfile`, `runCycle`, `attachArtifacts`. `runCycle` deep-equality note: `applyInterestRead` is designed to be re-applied; verify the idempotency test passes (if 013 bumps `version`/`updatedAt` on identical reads, treat that as a **defect to surface**, not to paper over — escalate; the spec's SC-2 requires state stability).
- [ ] **Step 3:** `src/index.ts` → `export * from "./model.js"; export * from "./orchestrator.js";`
- [ ] **Step 4: gate** `pnpm exec tsc -b && pnpm test` → PASS. **Commit** `feat(profile): StudentProfile + runCycle (full replay, idempotent)`.

---

### Task 2: `deriveGates` + `currentRead` (P2)

**Files:** `src/gates.ts` (+ `currentRead` here or in orchestrator), `test/gates.test.ts`; barrel.

**Interfaces:**
```ts
export function currentRead(profile: StudentProfile, ctx: OrchestratorContext, now: string): InterestRead;
export function deriveGates(
  profile: StudentProfile, ctx: OrchestratorContext, now: string,
): ReadonlyMap<string /*hypId*/, GateStatus>;
```
`deriveGates`: run `deriveSignals` over `profile.interactions`; for each hypothesis of `profile.kidId` in `profile.store`, collect the timestamps of `cellEvents` with `kind === "voluntary_return" && novelty === false` whose `serializeCellKey(domainPath, mode)` matches the hyp's `cellKey`, sort ascending, then `evaluateGate(hyp, timeline, Date.parse(now))`. (Note: `deriveGates` needs `ctx` for the catalog — update the signature vs the spec's `deriveGates(profile, now)`; record this as a `minor` decision in `.loop/decisions.md`.)

- [ ] **Step 1: Failing golden temporal test** — build a profile whose log has voluntary non-novel returns at day 0 / +20 / +60 for one cell + a `perseveranceArtifacts` entry; assert `deriveGates` → that hyp's `GateStatus.passed === true`; then drop the day-60 return (→ `durable:false`), drop the artifact (→ `hasArtifact:false`), and collapse the gap (→ `gapSurvived:false`), asserting each flag flips alone.
- [ ] **Step 2:** implement `currentRead` + `deriveGates`. Reuse `serializeCellKey` (011) for matching.
- [ ] **Step 3: gate + commit** → `feat(profile): deriveGates from the interaction log + currentRead`.

---

### Task 3: `ProfileStore` port + in-memory adapter (P3)

**Files:** `src/store-port.ts`, `test/memory-store.test.ts`; barrel.

**Interfaces:**
```ts
export interface ProfileStore {
  load(kidId: string): Promise<StudentProfile | null>;
  save(profile: StudentProfile): Promise<void>;
  list(): Promise<readonly string[]>;
}
export function createMemoryProfileStore(seed?: readonly StudentProfile[]): ProfileStore;
```
Memory adapter: Map-backed; `save`/`load` **deep-clone** (`structuredClone`) so callers can't mutate stored state.

- [ ] **Step 1: Failing test** — save a profile, load it (deep-equal but not same reference); mutate the returned object → stored copy unchanged; `list()` returns the kidIds.
- [ ] **Step 2:** implement. **Commit** → `feat(profile): ProfileStore port + in-memory adapter`.

---

### Task 4: Adapter `@gt100k/profile-store-fs` (P4)

**Files:** `passion/adapters/profile-store-fs/{package.json,tsconfig.json,src/index.ts,test/fs-store.test.ts}`; root `tsconfig.json`; optional `scripts/demo.ts`.

- [ ] **Step 1: scaffold** package.json (`@gt100k/profile-store-fs`, dep `@gt100k/student-profile`), tsconfig (reference `../../packages/student-profile`), append root reference. `pnpm install`.
- [ ] **Step 2: Failing round-trip test**
```ts
// test/fs-store.test.ts — uses a temp dir, no network
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createFsProfileStore } from "../src/index.js";
// build a profile via student-profile's emptyProfile/runCycle, save, reload → deep-equal; list() → [kidId]
```
- [ ] **Step 3:** implement `createFsProfileStore(dir)`: `save` → `writeFile(join(dir, `${kidId}.json`), JSON.stringify(profile))` (ensure dir via `mkdir({recursive})`); `load` → read+`JSON.parse` (return `null` if missing); `list` → `readdir` → strip `.json`. `StudentProfile` is JSON-safe (store = `{ byId: Record<…> }`, interactions/priors are plain). Convert the `perseveranceArtifacts` object as-is.
- [ ] **Step 4 (headless demo):** `scripts/demo.ts` — build Ari's profile via `runCycle`, `save` to a temp dir, `load` it back, print `consoleViewModel(loaded.store, kidId, deriveGates(loaded, ctx, now))`. Runnable via `pnpm exec tsx passion/adapters/profile-store-fs/scripts/demo.ts` (no network). Keep it tiny; the round-trip **test** is the real gate.
- [ ] **Step 5: gate + commit** → `feat(profile): @gt100k/profile-store-fs JSON-per-kid adapter + demo`.

---

### Task 5: Pilot fixtures + golden orchestration test (P5)

**Files:** `passion/packages/student-profile/src/__fixtures__/pilot.ts`, `test/pilot.test.ts`; barrel-export the fixtures so the app can import them.

**Fixture contents:**
- `PILOT_CATALOG: Map<string, Artifact>` — tagged artifacts for the roster's cells: `music-sound/audio-systems` (afforded `build`), `movement-body/dance` (`perform`), `games-logic/chess` (`compete`), `computers/software` (`build`), `games-logic/go` (`compete`), `music-sound/production` (`build`), `sports-body/climbing` (`perform`), plus Cyrus's thin cells. Use `tagStatus: "approved"`, `origin`/`source` as the 009 stub defaults.
- `PILOT_PRIORS`: a small synthetic `DomainPrior[]` (e.g. `inEnvironment:true`, modest `aptitudeTilt`/`discretionaryTilt`) per kid.
- Per-kid `Interaction[]` logs. **Ari (the `window.__qa` kid) is the important one:** author his `audio-systems` log to (a) reach `confident` on `::build` — mirror **012's confident fixture** (a first *novel* engagement, then **~5 voluntary, non-novel returns clustered within ~14 days of NOW** at `depth: 1` + a couple `depthSignals`) so `evidenceMass ≥ 3`; **and** (b) include the **gate-spread** voluntary non-novel returns at ~day −90 / −70 / −30 from NOW so `deriveGates` sees returns across a >14-day gap and a >56-day term with ≥2 occasions. `perseveranceArtifacts: { "music-sound/audio-systems::build": "defense-record-042" }`. Ari also gets a thin `dance` cell (one prompted return + a skip) that stays `EXPLORING`.
- Cyrus: only prompted returns / skips → everything stays `EXPLORING`. Dulce: two confident cells; the fixture builder promotes `go` → `ACTIVE` and `production` → `CANDIDATE` via 013's `promote` (human actor) after `runCycle`, and parks `climbing`. Bex: a gate-passed `chess` (`EMERGING`, promotable) + an `EMERGING` `software` short of its gate.
- `buildPilotRoster(now): Roster` — `runCycle(emptyProfile(...), log, { catalog: PILOT_CATALOG }, now)` per kid, applying the human transitions noted above; a fixed `PILOT_NOW` constant.

- [ ] **Step 1: Failing golden test** `test/pilot.test.ts`:
```ts
import { buildPilotRoster, PILOT_NOW } from "../src/index.js";
import { getForKid } from "@gt100k/hypothesis-store";
// Ari: music-sound/audio-systems::build is EMERGING, confident, lowerBound >= 0.6; gate passed:true
// Ari: movement-body/dance::perform is EXPLORING
// Cyrus: all EXPLORING; Dulce: has an ACTIVE + a CANDIDATE + a PARKED
```
- [ ] **Step 2:** author the fixtures; **tune Ari's return cluster until the golden test passes** (the test is the oracle — evidenceMass ≥ 3 ⇒ confident; timeline ⇒ gate). Assert `lowerBound` with a small tolerance (`>= 0.6`), flags/states exact.
- [ ] **Step 3: gate + commit** → `feat(profile): synthetic pilot roster + golden orchestration test`.

---

### Task 6: Rewire the guide console (P6)

**Files:** `passion/apps/guide-console/app/console-data.ts` (rewrite internals), `app/useConsole.ts` (only if its imports change), `package.json` (+ `@gt100k/student-profile` dep + `transpilePackages`), `app/seed.ts`/`console-state.ts` (keep `window.__qa` helpers).

**Rewrite `console-data.ts`:** replace the hand-built `buildRosterStore` / `buildRosterGates` / hand-authored `CHILDREN` with the orchestrator:
```ts
import { buildPilotRoster, deriveGates, PILOT_NOW, type OrchestratorContext } from "@gt100k/student-profile";
import { PILOT_CATALOG } from "@gt100k/student-profile"; // via barrel
// CHILDREN = [...roster.values()].map(p => ({ id: p.kidId, name: p.displayName }))
// per-kid store = roster.get(kidId).store ; gates = deriveGates(roster.get(kidId), { catalog: PILOT_CATALOG }, PILOT_NOW)
```
Keep the exports `useConsole` already relies on (`CHILDREN`, a way to get a kid's store + gates, `childInitials`). Keep `SEED_KID = "kid-synthetic-001"` = Ari so `window.__qa` + `console-state.ts` (`buildQaState`, `topPromotableId`, `applyGuidePrimaryAction`) are unchanged. **The existing 013 app test (`test/state.test.ts`) may assert the old hand-built seed — update it to assert the derived roster (Ari promotable) rather than deleting coverage.**

- [ ] **Step 1:** add dep + `transpilePackages` for `@gt100k/student-profile` (+ its transitive workspace deps) in `next.config.mjs` (mirror how 013 transpiles `@gt100k/*`). `pnpm install`.
- [ ] **Step 2:** rewrite `console-data.ts` to source the roster from `buildPilotRoster`; ensure `useConsole` still gets `{ children, store-per-kid, gates-per-kid }`. Do **not** touch the UI components.
- [ ] **Step 3:** update `test/state.test.ts` → the derived Ari has `music-sound/audio-systems::build` EMERGING + gate passed; `topPromotableId` returns it; `applyGuidePrimaryAction` promotes it (state changes). Keep the pure-surface coverage.
- [ ] **Step 4: gates** `pnpm exec tsc -b && pnpm test`; then **stop any dev server on the port first**, `pnpm --filter @gt100k/guide-console build`, and run `LOOP_QA` (`next start` + the harness) → the console loads, `window.__qa.ready === true`, and `primaryAction()` moves Ari `EMERGING → CANDIDATE` in both `state()` and the DOM.
- [ ] **Step 5: Commit** → `feat(console): feed the guide console from the student-profile orchestrator (real derived reads)`.

---

### Final verification (SC-8)
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green (domain + adapter + app pure tests).
- [ ] `pnpm --filter @gt100k/guide-console build` clean; `LOOP_QA` usability pass.
- [ ] `passionApps.md`: flip **G1** to ✅ (student-profile + orchestrator) and note the console now reads derived data; leave the doc update as the last commit or a follow-up PR.
- [ ] Open PR (gh, pushed as `spinkicks`); squash-merge after CI + branch-up-to-date.

## Notes on likely snags (pre-solved)
- **Idempotency (SC-2):** `applyInterestRead` must produce a stable store when re-applied with the same read. If it bumps `version`/`updatedAt` on an unchanged belief, that breaks SC-2 — surface it and fix in 013 (or scope `deep-equal` to the belief+state+history-length), don't silently loosen the test.
- **Ari confidence vs gate spread:** recency decay (14-day half-life) means the day −90/−70/−30 gate returns barely feed inference; the **recent cluster** is what makes `::build` confident. Author both (this is exactly what 012's fixture already does for confidence).
- **Catalog in `deriveGates`:** it needs the catalog to re-derive the timeline; pass `ctx` (spec §3.3 note) — don't try to read timelines off the store (the store doesn't keep them).
- **App `.next` corruption:** never run `next build` while `next dev` is serving the same app; stop the dev server (port-scoped) first.
