# Specialization Planner (the ascent engine) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task.

**Goal:** Build `018-specialization-planner` per its spec — a headless domain package (`@gt100k/specialization-planner`: a pure `deriveStage` + `planSpecialization` engine implementing the research §6 four-stage blueprint, a `derivePlanInputs` deriver over the 014 profile / 013 store / 016 wellbeing read, and a `ProjectBriefGenerator` port with a deterministic stub) + a **real TFY adapter** (`@gt100k/planner-live`) + a **"Plan" panel** in `apps/guide-console` that renders the staged plan and **preserves the existing `window.__qa` / `LOOP_QA`**.

**Architecture:** Pure, deterministic engine (certified spike + readiness signals + a wellbeing read → a staged plan with the next authentic project + bounded DP + rest + PCDE focus, never a grade / score / reward / child-facing field). Stage advances on **readiness not age**; strain **holds** the stage. The project brief comes from a **port** (deterministic stub in CI / default; TFY real adapter opt-in). The guide-console gains a panel so the **system proposes a plan and the human disposes**.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; the adapter uses native `fetch` (TFY, opt-in); the app is Next 14 (unchanged; additive panel + one optional server route).

## Global Constraints
- **SYNTHETIC ONLY.** Domain gate = `pnpm exec tsc -b` + `pnpm test`; app = `next build` + `LOOP_QA`. **No network in the gate** (stub only); the live adapter is opt-in and **never imported by a test**.
- **`pnpm install` (not --frozen)** after each new `package.json`. Lockfile committed.
- `import type` for types; guard `T | undefined`. Everything pure/immutable. **No gamification (no reward/points/streak/rank), no grade, no child-facing label/score anywhere; the child always owns problem/method/pace; DP is bounded and rest is mandatory.**
- **Parallel-safe with 015:** only new files under `passion/packages/specialization-planner` + `passion/adapters/planner-live` + edits to `passion/apps/guide-console` + a root `tsconfig.json` append. 015 never touches guide-console. If 015 merges first, `gh pr update-branch` before merging.
- **Preserve `window.__qa`/LOOP_QA** in guide-console — extend, never break. Commit after each task.

---

### Task 0: Scaffold `@gt100k/specialization-planner`
**Files:** `passion/packages/specialization-planner/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [ ] Failing smoke test; `package.json` (`@gt100k/specialization-planner`; deps `@gt100k/student-profile`, `@gt100k/hypothesis-store`, `@gt100k/wellbeing`, `@gt100k/interest-inference`, `@gt100k/two-axis-tagging`; `test` script `vitest run --root ../.. packages/specialization-planner/test`); `tsconfig.json` (extends base; references all five dep packages); `src/index.ts` → `export {};`; append the root reference.
- [ ] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(planner): scaffold @gt100k/specialization-planner`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
- [ ] Define `Stage`, `MentorRole`, `AudienceLevel`, `ProjectCadence`, `Pcde`, `RestCadence`, `ProjectBrief`, `PlanInputs`, `SpecializationPlan`, `BriefContext` (spec §3.2/§3.4) + the golden constants `DP_S1..S4`, `INVESTMENT_LOAD`, `DEPTH_S2..S4`, `RETURN_S2..S4`, `REST_DAYS_PER_WEEK`, `REST_MONTHS_PER_YEAR`, `REST_INCREMENT_MONTHS`, `RETURN_WINDOW_DAYS` (§3.7). Reuse `DomainPath` from `@gt100k/interest-inference` and `WellbeingRead` from `@gt100k/wellbeing`.
- [ ] Unit test pins the constants (incl. `DP_S1 ≤ DP_S2 ≤ DP_S3 ≤ DP_S4 < INVESTMENT_LOAD`). **Commit** `feat(planner): types + golden constants`.

---

### Task 2: `deriveStage` (P1)
**Files:** `src/stage.ts`, `test/stage.test.ts`; barrel.
**Interface:** `deriveStage(inputs: PlanInputs): Stage`. Highest-qualifying stage wins (S4→S3→S2→S1) using the §3.3 thresholds; **takes no age** (`monthsInPursuit` is indicative only, never a gate).
- [ ] **Failing golden test:** one `PlanInputs` per stage → its `Stage`; plus SC-2 (identical readiness + different `monthsInPursuit` → same stage; high-months/low-readiness → still `S1`).
- [ ] Implement. **Commit** `feat(planner): deriveStage (readiness not age)`.

---

### Task 3: `ProjectBriefGenerator` port + `stubBriefGenerator` (P2)
**Files:** `src/generator.ts`, `src/stub-generator.ts`, `test/generator.test.ts`; barrel.
**Interface:** `ProjectBriefGenerator { generate(ctx: BriefContext): Promise<ProjectBrief> }`; `stubBriefGenerator` builds a deterministic, valid Type III `ProjectBrief` from `domainPath` (humanized leaf) × `mode` × `stage` × `audience` × `craftFloorHint` — a driving question with no right answer, an authentic method, a non-empty `craftScaffold`, a process-based `successLooksLike`, `childOwnsChoice: true`, `source: "stub"`. No network. Ignores `resources`.
- [ ] **Failing unit test:** stub returns a schema-valid brief for each stage/audience; identical `ctx` → identical brief; `craftScaffold` non-empty; `childOwnsChoice === true`.
- [ ] Implement. **Commit** `feat(planner): ProjectBriefGenerator port + deterministic stub`.

---

### Task 4: `planSpecialization` engine (P3) — CORE
**Files:** `src/plan.ts`, `test/plan.test.ts`; barrel.
**Interface:** `planSpecialization(inputs: PlanInputs, deps: { generator: ProjectBriefGenerator }, now: string): Promise<SpecializationPlan>`. Compute the stage (`deriveStage`, then apply the strain hold from §3.5), map the stage → `mentorRole`/`audience`/`cadence`/`dpDose`/`pcdeFocus`/`restCadence`/`terminalNote` from the §3.1 table + §3.7 constants, fold in the `wellbeing` replan (`deload`/`restWindow`/`autonomyUp`/`holdStage`), set `escalateToHuman` (rest/deload OR a proposed stage advance), and generate `nextProject` via `deps.generator` (on throw → `stubBriefGenerator` fallback). Plain-language `rationale` + `guardrailNotes`.
- [ ] **Failing golden table test (SC-1):** one `PlanInputs` fixture per stage → the exact plan head (stage + mentorRole + audience + cadence + dpDose + pcdeFocus + restCadence). Assert `rationale`/`guardrailNotes`/`terminalNote` presence (not exact prose beyond the stable stub brief strings).
- [ ] Implement. **Commit** `feat(planner): planSpecialization staged blueprint + wellbeing replan`.

---

### Task 5: Guardrail invariants (P4)
**Files:** `test/guardrails.test.ts`.
- [ ] Tests (spec §3.5 / SC-3..SC-10):
  - **DP monotone + capped:** `dpDose` non-decreasing S1→S4 and every value `< INVESTMENT_LOAD`;
  - **craft floor:** `audience !== "SELF"` ⇒ `nextProject.craftScaffold` non-empty; `childOwnsChoice === true` in every plan;
  - **rest mandatory:** `restCadence.daysOffPerWeek ≥ 1` and `monthsOffPerYear ≥ 1` in every plan;
  - **no gamification / no child-facing field:** shape + type-level check that `SpecializationPlan` and `ProjectBrief` carry **no** reward/points/streak/rank/score/grade field;
  - **strain holds stage (SC-7):** an S3-ready input with `wellbeing.rest` (or `backOff`) → `replan.holdStage/deload/autonomyUp` all true, `escalateToHuman: true`, stage does **not** advance;
  - **system proposes (SC-8):** any `replan.restWindow`/`deload` or a proposed advance ⇒ `escalateToHuman: true`;
  - **plurality (SC-9):** two cells for one kid → independent plans;
  - **determinism + fail-safe (SC-10):** identical inputs → identical plan; a throwing generator → stub-fallback `nextProject` (never empty/invalid).
- [ ] Fix the engine if any invariant fails (these are non-negotiable). **Commit** `test(planner): guardrail invariants (DP cap, rest, autonomy, no gamification, strain-hold)`.

---

### Task 6: `derivePlanInputs` (P5)
**Files:** `src/derive.ts`, `test/derive.test.ts`; barrel.
**Interface:** `derivePlanInputs(profile: StudentProfile, store: HypothesisStore, cellKey: string, wellbeing: WellbeingRead, now: string, catalog: Catalog): PlanInputs`. From the 014 interaction log for the cell (spec §3.6): `monthsInPursuit` (earliest voluntary engagement → `now`), `voluntaryReturnsRecent` (voluntary returns within `RETURN_WINDOW_DAYS`), `depthAccumulation` (depth-weighted depth-family count), `stretchSeeking` (`chosen_challenge`), `producerIdentity` (shares/ships proxy; else `false`); `hypothesisState` from the 013 store; `wellbeing` passed through. A cell with no voluntary engagement is not planned.
- [ ] **Failing golden test (SC-11):** a synthetic profile whose log shows sustained voluntary return + depth accumulation + stretch-seeking → derived inputs that `planSpecialization` reads as `S3_AUTHORSHIP`; a strained variant (same readiness + `wellbeing.rest`) → held at its stage with `escalateToHuman`. Reuse `@gt100k/student-profile` fixtures / `runCycle` or a small hand-built log.
- [ ] Implement. **Commit** `feat(planner): derivePlanInputs from the 014 profile + 013 store + 016 read`.

---

### Task 7: Adapter `@gt100k/planner-live` (P6)
**Files:** `passion/adapters/planner-live/{package.json,tsconfig.json,src/index.ts,src/tfy-generator.ts,test/parse.test.ts}`; root `tsconfig.json`; `scripts/planner-live.ts` (opt-in).
**Interface:** a `ProjectBriefGenerator` calling TFY (OpenAI-compatible `fetch`, `TFY_API_KEY`, default `gpt-5.4-mini`, `TFY_PLANNER_MODEL` override) that prompts for a Type III brief grounded in the `BriefContext` (+ optional `resources`), parses the JSON, **validates every field and coerces/falls back to `stubBriefGenerator` on any malformed result** (`source: "llm"` on success). Mirror `tagger-tfy`/`concierge-live` structure.
- [ ] `package.json` (dep `@gt100k/specialization-planner` + native `fetch`; `test` script scoped to the adapter's parse test); `tsconfig.json` (references `../../packages/specialization-planner`); append root reference. `pnpm install`.
- [ ] **Parse test (hermetic, no network):** feed a captured/synthetic TFY JSON payload → a schema-valid `ProjectBrief`; feed a malformed payload → the stub fallback. The adapter is **never imported by a domain test**.
- [ ] `scripts/planner-live.ts`: an opt-in `planner:live` that generates one real brief for a seeded spike (manual). **Commit** `feat(planner-live): TFY ProjectBriefGenerator (opt-in) + parse/coerce tests`.

---

### Task 8: Guide-console "Plan" panel (P7) + preserve window.__qa
**Files:** `passion/apps/guide-console/app/*` (a new `plan.ts` view-model + `plan-panel.tsx` + wiring in `console.tsx`/`useConsole.ts`), optional `app/api/plan-brief/route.ts`, `package.json` (+ `@gt100k/specialization-planner` dep + `transpilePackages`), `app/console-state.ts`/`app/qa.ts` (extend additively).
- [ ] Add the dep + `transpilePackages`. `pnpm install`.
- [ ] `plan.ts` (mirror `wellbeing.ts`): for the selected kid, for each **certified** spike (`ACTIVE`, plus `CANDIDATE`), `derivePlanInputs(profile, store, cellKey, wellbeingRead, PILOT_NOW, PILOT_CATALOG)` → `planSpecialization(inputs, { generator: stubBriefGenerator }, PILOT_NOW)` → a `PlanCardVM`. Reuse the 016 `wellbeingForKid` reads so the same `WellbeingRead` drives both panels. **Default = stub generator** (synchronous-deterministic; no network) so `LOOP_QA` stays offline.
- [ ] Render a **functional-but-plain** panel: per certified spike, show the stage ("what this stage is for"), mentor role, audience level, the next project (driving question, authentic method, craft scaffold, who it's for), the practice dose + rest cadence, the PCDE focus, and any **"Needs your review"** replan (rest/deload/stage-advance) with a plain rationale + the honest `terminalNote`. Guide-facing; grayscale-safe; reuse the console tokens + the `vocab.ts`/humanized `specPath`. No child-facing text; no reward/score/grade.
- [ ] Optional `PLANNER_LIVE=1` server route (`app/api/plan-brief`) that regenerates a brief via `@gt100k/planner-live`; a "Regenerate brief (AI)" affordance calls it. Default (no flag) → stub; never in the gate.
- [ ] **Preserve `window.__qa`:** keep `state()` (may add `plans: number`) + `primaryAction()` (still promotes the top gate-passed candidate). The existing `test/state.test.ts` must keep passing (update only additively).
- [ ] gate: `pnpm exec tsc -b` + `pnpm test`; then **stop any dev server on the port first**, `pnpm --filter @gt100k/guide-console build`, run `LOOP_QA` (`next start` + harness): `window.__qa.ready === true`, `primaryAction()` still promotes (state + DOM change), and the Plan panel renders. **Commit** `feat(console): specialization Plan panel (system proposes, human disposes)`.

---

### Final verification (SC-13) + PR
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green (domain + adapter parse); `pnpm --filter @gt100k/guide-console build` clean; `LOOP_QA` pass.
- [ ] `passionApps.md`: mark D1 engine done (guide surface functional; polish pending); note the mentor-relay logistics (D3) + real RAG grounding (015) + Evidence-Graph grading (E1) remain.
- [ ] Open PR (gh, pushed as `spinkicks`); if 015 already merged, `gh pr update-branch` first; squash-merge after CI + branch up to date.

## Notes on likely snags (pre-solved)
- **Readiness not age is structural:** `deriveStage` must not receive age; `monthsInPursuit` is display-only. A high-months/low-readiness kid must read `S1` (SC-2).
- **Strain outranks readiness:** even an S3/S4-ready kid is **held** when the wellbeing read says rest/back-off — protect the rage to master (SC-7). Fold the hold in *after* `deriveStage`, before finalizing the plan.
- **DP is a rising-but-capped fraction:** enforce `DP_S1 ≤ … ≤ DP_S4 < INVESTMENT_LOAD` in the constants *and* assert it (SC-3); never emit an investment-year load.
- **The brief is an offer, not an assignment:** `childOwnsChoice` is always true and the craft scaffold always accompanies any non-self audience (SC-4) — the autonomy paradox is the #1 failure mode in the research.
- **No gamification / no grade / no child-facing field** anywhere in the types or output (SC-6) — these are tested invariants, not nice-to-haves.
- **Generator is async + fail-safe:** `planSpecialization` is `async` (awaits the generator) and falls back to the stub on any throw (SC-10); the panel still renders deterministically because the app passes the **stub** by default.
- **Don't break LOOP_QA:** the Plan panel is additive; keep `window.__qa`/`primaryAction`/`SEED_KID` intact so the existing usability gate stays green; extend `state()` only additively.
- **Parallel with 015:** if the concierge branch merges first, update this branch against `main` (only the root `tsconfig.json` reference append should conflict, trivially).
- **`.next` corruption:** never run `next build` while `next dev` serves guide-console; stop the dev server (port-scoped) first.
