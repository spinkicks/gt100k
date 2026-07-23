# Feature Specification: Student Profile + Discovery Orchestrator

**Feature Branch**: `014-student-profile`
**Created**: 2026-07-23
**Status**: Draft (loop-ready)

**Input**: G1 in `docs/prd/passionApps.md` (Student Profile / Longitudinal Record) plus the **orchestration** that wires the four discovery engines end-to-end. Today each engine is a separate green package and the guide console reads a **hand-built** `InterestRead`. This feature adds a durable **per-kid Student Profile** (identity + priors + an append-only interaction log + the kid's hypothesis store) and a pure **orchestrator** that runs the real chain — `@gt100k/signal-pipeline` (012) → `@gt100k/interest-inference` (011) → `@gt100k/hypothesis-store` (013) — and rewires `@gt100k/guide-console` to render **genuinely-derived** reads. Grounding: `passionApps.md` §0 "Key wiring gap", `passion/CONTEXT.md`, and the 011/012/013 specs.

> **Loop-ready note.** Three parts: (A) a headless **domain package** `@gt100k/student-profile` on the `pnpm exec tsc -b` + `pnpm test` gate; (B) a headless **adapter package** `@gt100k/profile-store-fs` (JSON-file-per-kid persistence, tested against a temp dir — filesystem only, **no network**); (C) a **rewire of the served `apps/guide-console`** that keeps the existing UI and the **`window.__qa` / `LOOP_QA`** usability gate working, now fed by the orchestrator over synthetic fixtures. Imports workspace packages by name → **`pnpm install` (not `--frozen-lockfile`)** required. **SYNTHETIC ONLY** (synthetic children + activity logs; no real child data).

---

## 1. Why & where it sits
011/012/013 are complete but unconnected; the console fakes its input. This feature is the **seam** that turns raw child activity into what the guide sees: it owns the child's **longitudinal record** (the append-only interaction log is the source of truth, since inference recomputes from the full event history each call) and runs the deterministic chain that produces the durable hypotheses + gate status. It is the last missing piece before a real (synthetic-pilot) discovery loop can run end-to-end.

---

## 2. Scope Fence *(hard)*

### In scope
- **Domain package** `@gt100k/student-profile` (`passion/packages/student-profile`):
  - the **`StudentProfile`** record (§3.1) and `emptyProfile(...)`;
  - the **orchestrator** `runCycle(profile, newInteractions, ctx, now)` — append to the log, then `deriveSignals` → `runInference` → `applyInterestRead` onto the **existing** store, then attach synthetic perseverance artifacts; **full replay, idempotent** (§3.2);
  - `deriveGates(profile, now)` — compute each hypothesis's graduation gate from the **voluntary-return timeline in the log** (replaces the console's hand-built gates) (§3.3);
  - `currentRead(profile, ctx, now)` — recompute the `InterestRead` for any consumer;
  - a **`ProfileStore` port** (`load` / `save` / `list`, async) + an **in-memory adapter** `createMemoryProfileStore()` (§3.4).
- **Adapter package** `@gt100k/profile-store-fs` (`passion/adapters/profile-store-fs`): `createFsProfileStore(dir)` — one `${kidId}.json` per child; round-trips a `StudentProfile` losslessly; tested against `os.tmpdir()`.
- **Console rewire** (`apps/guide-console`): replace the hand-built `console-data.ts` seed with a **pilot roster** built by running `runCycle` over synthetic per-kid **interaction logs** + a shared synthetic **catalog** + synthetic **priors**; `useConsole` renders `profile.store` + `deriveGates(...)`. Same 4 kids, same UI, `window.__qa` preserved.
- Synthetic fixtures (shared catalog, per-kid logs, priors, artifact refs) + tests mirroring every FR/SC (domain golden + adapter round-trip + app smoke) + a headless persistence round-trip.

### Out of scope
- **Belief/signal/lifecycle math** (011/012/013) — consumed, not rebuilt.
- **Real TimeBack** (G2) — `priors` is a synthetic field with a stable shape; real derivation is later.
- **Real persistence / consent / erasure** (G3) — the fs adapter is a local-dev/demo convenience, not the production store.
- **The game-side Interaction emitter** (C1 UI, teammate) — we author synthetic logs.
- **Real perseverance artifacts** (010 defense / D2 projects) — a synthetic `perseveranceArtifacts` map stands in.
- **Specialization pipeline** (D-series).

---

## 3. Domain model *(decisions already made — do not re-open)*

### 3.1 `StudentProfile`
```
StudentProfile {
  kidId: string;
  displayName: string;
  priors: readonly DomainPrior[];                 // 011 DomainPrior; synthetic now, TimeBack-fed later
  interactions: readonly Interaction[];           // 012 Interaction; APPEND-ONLY log = source of truth
  perseveranceArtifacts: Readonly<Record<string /*cellKey*/, string /*ref*/>>; // synthetic pilot stand-in
  store: HypothesisStore;                          // 013 durable lifecycle record for THIS kid
  updatedAt: string;                               // ISO-8601
}
OrchestratorContext { catalog: ReadonlyMap<string, Artifact>; surfaced?: readonly SurfacedRecord[]; config?: Partial<PipelineConfig>; }
Roster = ReadonlyMap<string /*kidId*/, StudentProfile>
```
`Interaction`, `SurfacedRecord`, `PipelineConfig` come from `@gt100k/signal-pipeline`; `Artifact` from `@gt100k/two-axis-tagging`; `DomainPrior`/`InterestRead` from `@gt100k/interest-inference`; `HypothesisStore`/`GateStatus` from `@gt100k/hypothesis-store`. **Reuse them — do not redefine.**

### 3.2 `runCycle` — full replay, idempotent
`runCycle(profile, newInteractions, ctx, now)`:
1. `interactions' = [...profile.interactions, ...newInteractions]` (append-only; preserve order).
2. `{ cellEvents } = deriveSignals({ interactions: interactions', surfaced: ctx.surfaced, catalog: ctx.catalog, config: ctx.config })`.
3. `read = runInference(cellEvents, profile.priors, Date.parse(now))`.
4. `store' = applyInterestRead(profile.store, profile.kidId, read, now)` — updates beliefs, auto-advances the cheap phases, **preserves human transitions**.
5. `store'' = attachArtifacts(store', profile.kidId, profile.perseveranceArtifacts)` — set `perseveranceArtifactRef` on matching hypotheses (synthetic pilot; never fabricated by 013 itself).
6. return `{ ...profile, interactions: interactions', store: store'', updatedAt: now }`.
- **Invariant (idempotency):** `runCycle(p, [], ctx, now).store` deep-equals `p.store` (beliefs recompute identically; artifacts re-attach identically; human transitions untouched). No-op on state when nothing new arrives.
- **Never** mutate inputs; return new values. **Never** demote on silence (inherited from 013).

### 3.3 `deriveGates` — gates from the log
`deriveGates(profile, now)` → `ReadonlyMap<hypId, GateStatus>`. For each hypothesis in `profile.store` for `kidId`:
- build its **return timeline** = timestamps of the log-derived `CellEvent`s with `kind === "voluntary_return"` and `novelty === false` for that `cellKey` (recompute via `currentRead`'s `deriveSignals`), sorted ascending;
- `evaluateGate(hyp, timeline, Date.parse(now))` (013) → `GateStatus`.
This makes the gap-survival + durability checks **fully data-driven**; the third check (`hasArtifact`) is satisfied by the synthetic `perseveranceArtifacts` attached in `runCycle` step 5.

### 3.4 `ProfileStore` port (async)
```
interface ProfileStore {
  load(kidId: string): Promise<StudentProfile | null>;
  save(profile: StudentProfile): Promise<void>;
  list(): Promise<readonly string[]>;   // kidIds
}
```
`createMemoryProfileStore()` = Map-backed (deep-cloned in/out so callers can't mutate stored state). The **orchestrator itself is pure/sync** — the port is only for persistence/roster loading (fs adapter + the browser's in-memory use). The browser console builds its roster by calling `runCycle` directly (sync); it does not need the port.

---

## 4. Phasing (P0…P6)
- **P0** — scaffold `@gt100k/student-profile`; `StudentProfile` type + `emptyProfile`; smoke test.
- **P1** — `runCycle` (append → derive → infer → applyInterestRead → attach artifacts) + the **idempotency** invariant. Golden.
- **P2** — `deriveGates` (timeline from the log → `evaluateGate`). Golden temporal test. *(Core.)*
- **P3** — `ProfileStore` port + `createMemoryProfileStore`; round-trip unit test.
- **P4** — adapter package `@gt100k/profile-store-fs` (`createFsProfileStore`) + temp-dir round-trip test + a headless persistence demo (save → reload → view-model).
- **P5** — pilot fixtures (shared catalog, 4 per-kid interaction logs, priors, artifact refs) + a **golden orchestration test**: Ari's log → `runCycle` → the expected derived store + a **passing** gate; a thin cell stays `EXPLORING`.
- **P6** — rewire `apps/guide-console` `console-data.ts` to build the roster via the orchestrator; keep the UI, `window.__qa`, and the 4 kids; app smoke test + `LOOP_QA`.

## 5. Success Criteria *(each maps to a test)*
- **SC-1** `runCycle` appends to the log and produces a store whose beliefs match `runInference` over `deriveSignals` of the full log — golden test.
- **SC-2** **Idempotency:** `runCycle(p, [], ctx, now).store` deep-equals `p.store`; a human transition applied to the store survives a subsequent no-op cycle — unit test.
- **SC-3** `deriveGates`: for a kid whose log has voluntary, non-novel returns at day 0 / day 20 (>14-day gap) / day 60 (>56-day term, 3rd occasion) **and** a synthetic artifact, the candidate cell's gate is `passed: true`; removing any one condition flips exactly its flag — golden temporal test.
- **SC-4** `createMemoryProfileStore` round-trips a profile; stored state is immutable to caller mutation — unit test.
- **SC-5** `createFsProfileStore(tmp)` writes one `${kidId}.json` per child and reloads a **deep-equal** profile; `list()` returns the kidIds — temp-dir round-trip test.
- **SC-6 (pilot golden)** Ari's synthetic log → `runCycle` yields `music-sound/audio-systems::build` in `EMERGING` with `lowerBound ≥ 0.6`, `confident: true`, and `deriveGates` → `passed: true`; `movement-body/dance::perform` stays `EXPLORING` — golden test. *(The derived analogue of today's hand-built seed.)*
- **SC-7 (app)** the rewired guide-console renders the 4 kids from the orchestrator; switching child works; the primary action promotes Ari's gate-passed candidate and both the DOM and `window.__qa.state()` change; `ready === true`, `error === null` — app smoke test + `LOOP_QA`.
- **SC-8** gate green: `pnpm exec tsc -b` + `pnpm test` (domain + adapter) and the app builds (`next build`) + `LOOP_QA` usability pass.

## 6. Golden Values *(exact)*
Fixtures live in `src/__fixtures__/` (domain) and the app's `app/` (pilot). They provide: (a) a **shared catalog** of tagged `Artifact`s covering the roster's `(domain × mode)` cells; (b) **per-kid interaction logs** — Ari's must, through `deriveSignals` + `runInference`, reach `evidenceMass ≥ 3` and `confident` on the build cell (mirror 012's confident-build fixture: enough voluntary, non-novel returns near `now` + depth signals) with return timestamps at **day 0 / day 20 / day 60** so the gate passes; (c) synthetic `perseveranceArtifacts` (e.g. `{ "music-sound/audio-systems::build": "defense-record-042" }`). Assert the derived `lowerBound`, `state`, `confident`, and `GateStatus` (with a documented tolerance on `lowerBound`, exact on flags/state). Cyrus stays all-`EXPLORING` (no confident cells); Dulce shows a promoted `ACTIVE`/`CANDIDATE` (apply human transitions in the fixture builder after `runCycle`, as 013 allows).

## 7. Decisions Already Made
- **[D1]** One feature (record + orchestrator + console rewire), one domain package + one fs adapter package.
- **[D2]** Profile holds the **raw append-only interaction log** (longitudinal source of truth); CellEvents are re-derived each cycle.
- **[D3]** `runCycle` is **full replay + idempotent**; applies onto the existing store to preserve human transitions.
- **[D4]** Gates are **derived from the log** (gap + durable); the perseverance artifact is a **synthetic pilot** attachment until 010/D2.
- **[D5]** Priors are a **synthetic field** now (TimeBack/G2 later); never gate on priors.
- **[D6]** Persistence: pure in-memory behind a `ProfileStore` port **and** a real **JSON-file-per-kid** adapter; orchestrator stays pure/sync.
- **[D7]** The console keeps its current UI + `window.__qa`; only the data source changes; same 4 synthetic kids.
- **[D8]** SYNTHETIC ONLY; imports workspace packages by name → `pnpm install` (not frozen).

## 8. Defaults for the Unspecified
Choose the simplest correct option, record it in `.loop/decisions.md`, continue. Escalate `critical` only if a choice would invalidate an SC (especially SC-6/SC-7 — the derived read must keep Ari promotable so `LOOP_QA` stays green).

## 9. Loop notes
- **Domain + adapter packages:** headless, `LOOP_QA` N/A, gate = `tsc -b` + `test`. New files under `passion/packages/student-profile` + `passion/adapters/profile-store-fs` + appended root `tsconfig.json` references.
- **App:** `LOOP_QA=1` with `LOOP_QA_CMD="pnpm --filter @gt100k/guide-console start"` (after `next build`) + a `LOOP_QA_PORT`; the existing `window.__qa` contract (`ready`, `error`, `state()`, `primaryAction()`) is preserved — only its data source changes.
- **Requires `pnpm install`** (not `--frozen`) — new packages import `@gt100k/{signal-pipeline,interest-inference,hypothesis-store,two-axis-tagging}` by name; the console adds the new deps.
- Parallel-safe with unrelated lanes (disjoint files); depends on 011/012/013 being on `main` (they are).

## 10. Stack + Commands (pinned)
- Domain `passion/packages/student-profile` (`@gt100k/student-profile`), deps `@gt100k/{signal-pipeline,interest-inference,hypothesis-store,two-axis-tagging}`. Adapter `passion/adapters/profile-store-fs` (`@gt100k/profile-store-fs`), dep `@gt100k/student-profile` (+ Node `fs`/`path`/`os`). App consumes `@gt100k/student-profile`.
- Gate: `pnpm exec tsc -b` + `pnpm test`; app `next build` + `LOOP_QA` usability pass.
- TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`); vitest; no network anywhere (fs adapter tests use `os.tmpdir()` + `mkdtemp`).
