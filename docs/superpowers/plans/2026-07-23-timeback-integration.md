# TimeBack Integration (real priors, never a gate) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking; commit after each task.

**Goal:** Build `020-timeback-integration` per its spec — a headless `@gt100k/timeback` package (a pure subject→cabin crosswalk + `toDomainPriors` mapper + a light `buildDailyHandoff` + a `withPriors` profile hook + a deterministic fake data source) and an opt-in `@gt100k/timeback-live` adapter (a real-API-shaped `TimeBackClient`, never in the gate), so a kid's school signals become real `DomainPrior[]` that **shift the discovery starting point but never gate an interest**.

**Architecture:** School data (`TimeBackSnapshot`: per-subject mastery + discretionary XP + offered) → a hand-authored, extensible, graceful crosswalk → 011's `DomainPrior[]` (cabin-keyed: `aptitudeTilt`, `discretionaryTilt`, `inEnvironment`). The 011 engine already excludes the prior from `evidenceMass` and only creates cells from events, so priors can never manufacture a candidate — proven by a standing test. A light one-way daily handoff encodes block independence + reward-neutrality. No real API yet: a deterministic fake source feeds everything; the live adapter is a documented, opt-in scaffold.

**Tech Stack:** TypeScript (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; the adapter uses native `fetch` (opt-in). Monorepo pnpm workspace.

## Global Constraints
- **SYNTHETIC ONLY.** Domain gate = `pnpm exec tsc -b` + `pnpm test`. **No network in the gate** (fake data source only); the live adapter is opt-in and **never imported by a test**.
- **`pnpm install` (not `--frozen`)** after each new `package.json`. Lockfile committed.
- `import type` for types; guard `T | undefined`. Everything pure/immutable.
- **Reuse 011 verbatim** — `DomainPrior`, `buildPrior`, `W_ENV/W_APT/W_XP`, `clamp01`, `runInference`; never redefine the inference math.
- **Prior only, never a gate** — never gate/grade/reward on a prior; the no-gate guarantee is a standing test.
- **No edits to `packages/student-profile`, `apps/guide-console`, or any 018/019 file** — the `withPriors` hook lives in `@gt100k/timeback`. Parallel-safe with the in-flight 018 + 019 (only the root `tsconfig.json` reference append overlaps). Branch from current `main`.
- Commit after each task.

---

### Task 0: Scaffold `@gt100k/timeback`
**Files:**
- Create: `passion/packages/timeback/package.json`, `passion/packages/timeback/tsconfig.json`, `passion/packages/timeback/src/index.ts`, `passion/packages/timeback/test/smoke.test.ts`
- Modify: root `tsconfig.json` (append `{ "path": "passion/packages/timeback" }` to `references`)

**Interfaces:**
- Produces: the `@gt100k/timeback` package (barrel `src/index.ts`), consumed by all later tasks + the adapter.

- [ ] `package.json`: name `@gt100k/timeback`, `"type": "module"`, deps `@gt100k/interest-inference`, `@gt100k/two-axis-tagging`, `@gt100k/student-profile` (all `workspace:*`); `"test": "vitest run --root ../.. packages/timeback/test"`; `"build": "tsc -b"`.
- [ ] `tsconfig.json`: extend the repo base; `composite: true`; `references` → `../interest-inference`, `../two-axis-tagging`, `../student-profile`.
- [ ] `src/index.ts` → `export {};`. `test/smoke.test.ts`: `import { expect, it } from "vitest"; it("builds", () => expect(true).toBe(true));`.
- [ ] Run: `pnpm install` then `pnpm exec tsc -b && pnpm test`. Expected: PASS.
- [ ] **Commit** `feat(timeback): scaffold @gt100k/timeback`.

---

### Task 1: Raw signal types (P0)
**Files:**
- Create: `passion/packages/timeback/src/model.ts`
- Test: `passion/packages/timeback/test/model.test.ts`
- Modify: `passion/packages/timeback/src/index.ts` (`export * from "./model.js";`)

**Interfaces:**
- Produces:
  - `type Subject = string`
  - `interface SubjectSignal { readonly subject: Subject; readonly mastery: number; readonly discretionaryXp: number; readonly offered: boolean; }`
  - `interface TimeBackSnapshot { readonly kidId: string; readonly asOf: string; readonly subjects: readonly SubjectSignal[]; }`

- [ ] Write `test/model.test.ts` that constructs a `TimeBackSnapshot` literal and asserts field access (compile-level shape check + one runtime assertion on `subjects.length`).
- [ ] Run: `pnpm test` → FAIL (module not found).
- [ ] Implement `src/model.ts` with the three types above; export from the barrel.
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Commit** `feat(timeback): raw TimeBack signal types`.

---

### Task 2: The subject→cabin crosswalk + `explainPriors` (P1)
**Files:**
- Create: `passion/packages/timeback/src/crosswalk.ts`
- Test: `passion/packages/timeback/test/crosswalk.test.ts`
- Modify: barrel (`export * from "./crosswalk.js";`)

**Interfaces:**
- Consumes: `Subject`, `TimeBackSnapshot` (Task 1); `CabinId`, `CABINS` from `@gt100k/two-axis-tagging`.
- Produces:
  - `interface CabinWeight { readonly cabin: CabinId; readonly weight: number; }`
  - `const SUBJECT_CABIN_CROSSWALK: Readonly<Record<Subject, readonly CabinWeight[]>>`
  - `function crosswalkFor(subject: Subject): readonly CabinWeight[]` — returns `[]` for an unknown subject (never throws).
  - `function explainPriors(snapshot: TimeBackSnapshot): ReadonlyMap<CabinId, readonly Subject[]>` — per cabin, the offered contributing subjects (provenance).

- [ ] Write `test/crosswalk.test.ts`:
  - `crosswalkFor("math")` contains `{ cabin: "math-puzzles", weight: 1 }`;
  - `crosswalkFor("underwater-basket-weaving")` returns `[]` (graceful, no throw);
  - every cabin in every crosswalk row is a valid `CabinId` (`CABINS.includes(...)`);
  - `explainPriors` for a snapshot with `math` offered lists `math` under `math-puzzles`, and omits cabins with no offered contributor.
- [ ] Run: `pnpm test` → FAIL.
- [ ] Implement `src/crosswalk.ts` with the table (spec §3.3):
  ```ts
  export const SUBJECT_CABIN_CROSSWALK = {
    math: [{ cabin: "math-puzzles", weight: 1 }, { cabin: "code-computers", weight: 0.5 }, { cabin: "games-strategy", weight: 0.5 }],
    science: [{ cabin: "science-nature", weight: 1 }, { cabin: "making-engineering", weight: 0.5 }],
    reading: [{ cabin: "influence-media", weight: 0.6 }],
    writing: [{ cabin: "influence-media", weight: 1 }],
    coding: [{ cabin: "code-computers", weight: 1 }, { cabin: "math-puzzles", weight: 0.3 }],
    music: [{ cabin: "music-sound", weight: 1 }],
    art: [{ cabin: "art-motion", weight: 1 }],
    "social-studies": [{ cabin: "influence-media", weight: 0.5 }],
  } as const satisfies Record<string, readonly { cabin: CabinId; weight: number }[]>;
  ```
  `crosswalkFor` reads the record with a `?? []` fallback; `explainPriors` iterates offered subjects → their crosswalk cabins, grouping subjects under each cabin.
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Commit** `feat(timeback): hand-authored subject→cabin crosswalk + explainPriors`.

---

### Task 3: `toDomainPriors` mapper (P2) — CORE
**Files:**
- Create: `passion/packages/timeback/src/map.ts`
- Test: `passion/packages/timeback/test/map.test.ts`
- Create: `passion/packages/timeback/src/__fixtures__/snapshots.ts` (the golden snapshot)
- Modify: barrel (`export * from "./map.js";`)

**Interfaces:**
- Consumes: `TimeBackSnapshot`, `SubjectSignal` (T1); `SUBJECT_CABIN_CROSSWALK`, `crosswalkFor` (T2); `DomainPrior`, `clamp01` from `@gt100k/interest-inference`; `CABINS`, `CabinId` from `@gt100k/two-axis-tagging`.
- Produces: `function toDomainPriors(snapshot: TimeBackSnapshot): readonly DomainPrior[]` — one `DomainPrior` per cabin with ≥1 offered contributing subject, sorted by `domain` (cabin id) asc; cabins with no contribution omitted. `DomainPrior.domain` is the cabin id string.

- [ ] Add to `src/__fixtures__/snapshots.ts` a `GOLDEN_SNAPSHOT: TimeBackSnapshot`:
  ```ts
  export const GOLDEN_SNAPSHOT: TimeBackSnapshot = {
    kidId: "kid-golden", asOf: "2026-04-01T00:00:00.000Z",
    subjects: [
      { subject: "math", mastery: 0.8, discretionaryXp: 60, offered: true },
      { subject: "science", mastery: 0.5, discretionaryXp: 20, offered: true },
      { subject: "writing", mastery: 0.9, discretionaryXp: 20, offered: true },
      { subject: "music", mastery: 0.4, discretionaryXp: 0, offered: false }, // not offered → contributes nothing
    ],
  };
  ```
- [ ] Write `test/map.test.ts` (golden — values hand-computed from spec §3.4; totalDiscretionaryXp = 100):
  - result has cabins `["code-computers","games-strategy","influence-media","making-engineering","math-puzzles","science-nature"]` (sorted; NO `music-sound` since music is `offered:false`);
  - `math-puzzles`: contributors math(w1,m0.8) → `aptitudeTilt = 0.8` (Σw·m/Σw = 0.8/1); `discretionaryTilt = clamp01(1·0.60) = 0.60`; `inEnvironment true`;
  - `code-computers`: math(w0.5) only offered → `aptitudeTilt = 0.8` (0.4/0.5); `discretionaryTilt = clamp01(0.5·0.60)=0.30`;
  - `games-strategy`: math(w0.5) → `aptitudeTilt 0.8`, `discretionaryTilt 0.30`;
  - `science-nature`: science(w1,m0.5) → `aptitudeTilt 0.5`, `discretionaryTilt clamp01(1·0.20)=0.20`;
  - `making-engineering`: science(w0.5) → `aptitudeTilt 0.5`, `discretionaryTilt 0.10`;
  - `influence-media`: writing(w1,m0.9) → `aptitudeTilt 0.9`, `discretionaryTilt 0.20`;
  - every tilt ∈ `[0,1]`.
  - Assert numeric fields with `toBeCloseTo(x, 5)`.
- [ ] Run: `pnpm test` → FAIL.
- [ ] Implement `src/map.ts`:
  - compute `totalXp = Σ subjects.discretionaryXp` (guard 0 → shares are 0);
  - for each `CabinId`, gather offered subjects whose crosswalk includes it with weight `w`;
  - if none → skip (omit);
  - `aptitudeTilt = clamp01(Σ w·mastery / Σ w)`; `discretionaryTilt = clamp01(Σ w·(xp/totalXp))`; `inEnvironment = true`;
  - push `{ domain: cabin, inEnvironment, aptitudeTilt, discretionaryTilt }`; sort by `domain`.
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Commit** `feat(timeback): toDomainPriors mapper (aptitude + discretionary, graceful)`.

---

### Task 4: No-gate proof (P3) — standing test
**Files:**
- Test: `passion/packages/timeback/test/no-gate.test.ts`

**Interfaces:**
- Consumes: `toDomainPriors` (T3), `GOLDEN_SNAPSHOT` (T3); `runInference`, `type CellEvent`, `serializeCellKey` from `@gt100k/interest-inference`.

- [ ] Write `test/no-gate.test.ts` (no new implementation — this proves the guarantee against the merged 011):
  - **(a) empty events + priors → empty read:** `const priors = toDomainPriors(GOLDEN_SNAPSHOT); const r = runInference([], priors, Date.parse("2026-04-01")); expect(r.cells).toHaveLength(0); expect(r.candidates).toHaveLength(0);`
  - **(b) evidenceMass is prior-independent:** build a small `events: CellEvent[]` (e.g. 3 `voluntary_return` on `["math-puzzles"], "investigate"` near `now`, `novelty:false`, `magnitude:1`); `const now = Date.parse("2026-04-01"); const withP = runInference(events, priors, now); const without = runInference(events, [], now);` for each `cellKey`, assert `withP.cells.find(...).evidenceMass` ≈ `without.cells.find(...).evidenceMass` (`toBeCloseTo(...,5)`) — the prior never adds evidence.
  - **(c) a priored domain with no events never appears:** assert no cell in `without`/`withP` exists for a cabin that only had a prior (e.g. `influence-media`) but no events.
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Commit** `test(timeback): standing no-gate proof (prior excluded from evidenceMass; no events → no cell)`.

---

### Task 5: Daily handoff + `withPriors` hook (P4)
**Files:**
- Create: `passion/packages/timeback/src/handoff.ts`, `passion/packages/timeback/src/profile.ts`
- Test: `passion/packages/timeback/test/handoff.test.ts`, `passion/packages/timeback/test/profile.test.ts`
- Modify: barrel (`export * from "./handoff.js"; export * from "./profile.js";`)

**Interfaces:**
- Consumes: `TimeBackSnapshot` (T1), `toDomainPriors` (T3), `DomainPrior` (011); `type StudentProfile`, `emptyProfile` from `@gt100k/student-profile`.
- Produces:
  - `interface DailyHandoff { readonly kidId: string; readonly date: string; readonly priors: readonly DomainPrior[]; readonly passionBlockRewardNeutral: true; readonly blocksIndependent: true; }`
  - `function buildDailyHandoff(snapshot: TimeBackSnapshot, date: string): DailyHandoff`
  - `function withPriors(profile: StudentProfile, priors: readonly DomainPrior[]): StudentProfile` — immutable; replaces `priors`; sets `updatedAt` to the caller's value (use the snapshot's `asOf` when wired).

- [ ] Write `test/handoff.test.ts`:
  - `buildDailyHandoff(GOLDEN_SNAPSHOT, "2026-04-01").priors` deep-equals `toDomainPriors(GOLDEN_SNAPSHOT)` (one-way flow);
  - `passionBlockRewardNeutral === true` and `blocksIndependent === true`;
  - shape guard: `Object.keys(handoff)` contains **no** key matching `/reward|point|streak|grade|score/i` beyond the literal `passionBlockRewardNeutral` flag (assert the set of keys equals the documented set).
- [ ] Write `test/profile.test.ts`:
  - `const p = emptyProfile("k","K"); const p2 = withPriors(p, toDomainPriors(GOLDEN_SNAPSHOT));` → `p2.priors.length > 0`, `p.priors.length === 0` (original unchanged), `p2 !== p`.
- [ ] Run: `pnpm test` → FAIL.
- [ ] Implement `src/handoff.ts` and `src/profile.ts` per the interfaces (pure/immutable; `withPriors` spreads the profile and replaces `priors`).
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Commit** `feat(timeback): light two-block daily handoff + immutable withPriors hook`.

---

### Task 6: Deterministic fake data source (P5)
**Files:**
- Create: `passion/packages/timeback/src/fake.ts`
- Test: `passion/packages/timeback/test/fake.test.ts`
- Modify: barrel (`export * from "./fake.js";`)

**Interfaces:**
- Consumes: `TimeBackSnapshot`, `SubjectSignal` (T1).
- Produces:
  - `function syntheticSnapshot(kidId: string, asOf: string, overrides?: Partial<Record<Subject, Partial<SubjectSignal>>>): TimeBackSnapshot` — deterministic default subjects (math/reading/writing/science/coding/music/art all `offered:true` with fixed mastery + XP), overridable per subject.
  - `const PILOT_TIMEBACK: Readonly<Record<string, TimeBackSnapshot>>` — snapshots for the pilot kids `kid-synthetic-001..004` (distinct, deterministic profiles).

- [ ] Write `test/fake.test.ts`:
  - `syntheticSnapshot("k","2026-04-01T00:00:00.000Z")` returns the same value on repeat calls (deep-equal; determinism);
  - `PILOT_TIMEBACK["kid-synthetic-001"]` exists, `asOf` is a valid ISO date, and `toDomainPriors(...)` on it returns a non-empty, in-range `DomainPrior[]` (golden: assert its cabin set + one tilt with `toBeCloseTo`).
- [ ] Run: `pnpm test` → FAIL.
- [ ] Implement `src/fake.ts` (deterministic literals; `syntheticSnapshot` merges overrides over the defaults).
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS.
- [ ] **Commit** `feat(timeback): deterministic fake data source + pilot snapshots`.

---

### Task 7: Opt-in live adapter `@gt100k/timeback-live` (P6)
**Files:**
- Create: `passion/adapters/timeback-live/package.json`, `.../tsconfig.json`, `.../src/index.ts`, `.../src/parse.ts`, `.../src/__fixtures__/payloads.ts`, `.../test/parse.test.ts`, `.../scripts/timeback-live.ts`
- Modify: root `tsconfig.json` (append `{ "path": "passion/adapters/timeback-live" }`)

**Interfaces:**
- Consumes: `TimeBackSnapshot`, `SubjectSignal` from `@gt100k/timeback`.
- Produces:
  - `function parseSnapshot(kidId: string, body: unknown): TimeBackSnapshot` — validates a documented **assumed** API payload → `TimeBackSnapshot`; on any malformed field returns a safe empty snapshot `{ kidId, asOf: <now/epoch>, subjects: [] }` (never throws to the caller).
  - `class TimeBackClient { constructor(cfg); fetchSnapshot(kidId: string): Promise<TimeBackSnapshot>; }` — native `fetch` to `${baseURL}/students/${kidId}/signals`, `Authorization: Bearer`; on transport/HTTP error → the safe empty snapshot via `parseSnapshot`.
  - `function timeBackConfigFromEnv(env?): { baseURL: string; apiKey: string }` — reads `TIMEBACK_BASE_URL` + `TIMEBACK_API_KEY`; **never called at import time or in a test**.

- [ ] `package.json`: name `@gt100k/timeback-live`, dep `@gt100k/timeback` (`workspace:*`); `"test": "vitest run --root ../.. adapters/timeback-live/test"`. `tsconfig.json` references `../../packages/timeback`. `pnpm install`.
- [ ] `src/__fixtures__/payloads.ts`: an `ASSUMED_PAYLOAD` (documented shape, e.g. `{ asOf, subjects: [{ subject, mastery, discretionaryXp, offered }] }`) and a `MALFORMED_PAYLOAD` (missing/typed-wrong fields).
- [ ] Write `test/parse.test.ts` (hermetic; imports only `../src/parse.js`, **never** `../src/index.js`):
  - `parseSnapshot("k", ASSUMED_PAYLOAD)` → a `TimeBackSnapshot` whose `subjects` map 1:1 and whose tilts (`toDomainPriors`) are in range;
  - `parseSnapshot("k", MALFORMED_PAYLOAD)` → `{ kidId:"k", subjects: [] }` (safe fallback, no throw);
  - `parseSnapshot("k", null)` → safe fallback.
- [ ] Run: `pnpm test` → FAIL.
- [ ] Implement `src/parse.ts` (defensive field validation → `SubjectSignal[]`; fallback on any failure) and `src/index.ts` (`TimeBackClient` + `timeBackConfigFromEnv`, mirroring `concierge-live`'s fetch/fail-safe shape). Add `scripts/timeback-live.ts` (opt-in: build a client from env, `fetchSnapshot`, print `toDomainPriors`). Document the assumed payload shape in a header comment.
- [ ] Run: `pnpm exec tsc -b && pnpm test` → PASS. (The `scripts/timeback-live.ts` is never run by the gate.)
- [ ] **Commit** `feat(timeback-live): opt-in TimeBackClient scaffold + hermetic parse/fallback tests`.

---

### Final verification (SC-9) + PR
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green (domain + adapter parse).
- [ ] `passionApps.md`: mark **G2** done (mapper + fake source + opt-in live scaffold; real API wiring deferred until credentials exist); update the 014 wiring note ("real priors (G2)") to "priors mapper shipped; flip on `timeback-live` when the API lands".
- [ ] Open PR (gh, pushed as `spinkicks`); `gh pr update-branch` if `main` moved (only the root `tsconfig.json` reference append should conflict with 018/019, trivially); squash-merge after CI + branch up to date.

## Notes on likely snags (pre-solved)
- **`DomainPrior.domain` is the cabin id** — `foldEvents` keys priors by `domainPath[0]`; emit one prior per cabin, `domain: cabinId`. Sub-topic priors would be ignored.
- **Priors only touch cells that have events** — `foldEvents` creates cells from events, then applies the domain's prior; a prior for a cabin with no events produces no cell (this is the no-gate guarantee, Task 4).
- **`evidenceMass` excludes the prior** — never assert "identical candidate/confident set with vs without priors" (a prior shifts `sd`/`lowerBound`); assert **evidenceMass equality** + **empty-events→empty-read** (Task 4).
- **`now` is epoch ms** in `runInference`/`foldEvents` (`Date.parse(...)`), not an ISO string.
- **Discretionary share** divides by the snapshot's total discretionary XP; guard total `0` → shares `0` (no divide-by-zero).
- **`offered:false` subjects contribute nothing** — filter them out before computing tilts and before `inEnvironment`.
- **Don't edit `student-profile`** — `withPriors` lives in `@gt100k/timeback`; `runCycle` already folds `profile.priors`, so nothing else needs wiring.
- **Adapter never in the gate** — parse tests import `../src/parse.js` only; `timeBackConfigFromEnv` is never called at import time.
- **Parallel with 018 + 019** — only the root `tsconfig.json` reference append overlaps; `gh pr update-branch` before merge.
