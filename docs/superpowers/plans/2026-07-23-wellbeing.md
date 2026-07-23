# Wellbeing — Push/Back-off + Burnout Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task.

**Goal:** Build `016-wellbeing` per its spec — a headless domain package (`@gt100k/wellbeing`: a pure `assessWellbeing` engine implementing the research §6.2 decision table + a `deriveWellbeingSignals` deriver over the 014 profile / 013 store) + a **wellbeing/escalation panel** in `apps/guide-console` that renders the reads and **preserves the existing `window.__qa` / `LOOP_QA`**.

**Architecture:** Pure, deterministic engine (signals → a two-knob recommendation + escalation, never a child label / score / reward). A deriver reads existing discovery data. The guide-console gains a panel that shows the human the recommendation so the **system proposes and the human disposes**.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; the app is Next 14 (unchanged; additive panel).

## Global Constraints
- **SYNTHETIC ONLY.** Domain gate = `pnpm exec tsc -b` + `pnpm test`; app = `next build` + `LOOP_QA`.
- **`pnpm install` (not --frozen)** after each new `package.json`. Lockfile committed.
- `import type` for types; guard `T | undefined`. Everything pure/immutable. **No facial/affect detection; no gamification; no child-facing label or score anywhere.**
- **Parallel-safe with 015:** only new files under `passion/packages/wellbeing` + edits to `passion/apps/guide-console` + a root `tsconfig.json` append. 015 never touches guide-console. If 015 merges first, `gh pr update-branch` before merging.
- **Preserve `window.__qa`/LOOP_QA** in guide-console — extend, never break. Commit after each task.

---

### Task 0: Scaffold `@gt100k/wellbeing`
**Files:** `passion/packages/wellbeing/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [ ] Failing smoke test; `package.json` (`@gt100k/wellbeing`, deps `@gt100k/student-profile` + `@gt100k/hypothesis-store`, `test` script `vitest run --root ../.. packages/wellbeing/test`); `tsconfig.json` (extends base; references `../student-profile`, `../hypothesis-store`); `src/index.ts` → `export {};`; append root reference.
- [ ] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(wellbeing): scaffold @gt100k/wellbeing`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
- [ ] Define `WellbeingState`, `Trend`, `WellbeingSignals`, `WellbeingRead` (spec §3.2) + constants `PUSH_SUCCESS`, `ZONE_LOW/HIGH`, `SCAFFOLD_SUCCESS`, `GAP_DAYS`, `TREND_WINDOW_DAYS` (§3.6).
- [ ] Unit test pins the constants. **Commit** `feat(wellbeing): types + golden constants`.

---

### Task 2: `assessWellbeing` engine (P1) — CORE
**Files:** `src/assess.ts`, `test/assess.test.ts`; barrel.
**Interface:** `assessWellbeing(signals: WellbeingSignals): WellbeingRead`. Implement the **priority-ordered** §3.3 decision (BURNOUT_TIP → EARLY_BURNOUT → GAP → DANGER_WINDOW → OVER_CHALLENGED → UNDER_CHALLENGED → IN_ZONE), first match wins. Invalid/empty input → safe `IN_ZONE`/`HOLD`/`STEADY`, never a fabricated `PUSH`.
- [ ] **Failing golden table test:** one `WellbeingSignals` fixture per row → the exact `WellbeingRead` (state + challenge + pressure + backOff + rest + reduceEvaluativeSurfacing + escalateToHuman). Include the plain-language `rationale` + `guardrailNotes` (assert presence, not exact prose).
- [ ] Implement. **Commit** `feat(wellbeing): assessWellbeing decision engine (two knobs, priority-ordered)`.

---

### Task 3: Guardrail invariants (P2)
**Files:** `test/guardrails.test.ts`.
- [ ] Tests (spec §3.4 / SC-2..SC-6):
  - devaluation + exhaustion together → `BURNOUT_TIP` (not `EARLY_BURNOUT`);
  - high `successRate` but flat/declining return (no stretch) → **not** `PUSH`;
  - `missing` → no `PUSH`/nudge; escalate past threshold; no label;
  - `stakesEvent` → `AUTONOMY_UP` + `reduceEvaluativeSurfacing`, never `PUSH`;
  - every `rest`/`backOff` ⇒ `escalateToHuman: true`; assert the `WellbeingRead` type carries **no** reward/streak/score/child-facing field (type-level + shape check).
- [ ] Fix the engine if any invariant fails (these are non-negotiable). **Commit** `test(wellbeing): guardrail invariants`.

---

### Task 4: `deriveWellbeingSignals` (P3)
**Files:** `src/derive.ts`, `test/derive.test.ts`; barrel.
**Interface:** `deriveWellbeingSignals(profile: StudentProfile, cellKey: string, now: string): WellbeingSignals`. From the 014 interaction log + 013 store (spec §3.5): `returnTrend`/`depthTrend` (recent-vs-older voluntary/depth cell-events over `TREND_WINDOW_DAYS`), `stretchSeeking` (`chosen_challenge` depth events), `devaluation` (compliance-without-depth: prompted-return/skip after prior voluntary depth + declining voluntary return), `missing` (per-spike quiet period ≥ `GAP_DAYS`). Leave `successRate`/`exhaustion`/`obsessiveTip`/`stakesEvent` `undefined` unless supplied.
- [ ] **Failing golden test (SC-7):** a synthetic profile whose log shows early voluntary depth then declining voluntary return + prompted-only/compliance → `devaluation:true`, `returnTrend:"declining"`; feeding it to `assessWellbeing` → `BURNOUT_TIP`. Reuse `@gt100k/student-profile` `emptyProfile`/`runCycle` (or a small hand-built log) to build the fixture.
- [ ] Implement. **Commit** `feat(wellbeing): deriveWellbeingSignals from the 014 profile + 013 store`.

---

### Task 5: Guide-console wellbeing panel (P4) + preserve window.__qa
**Files:** `passion/apps/guide-console/app/*` (a new `wellbeing` panel component + wiring in `console.tsx`/`useConsole.ts`), `package.json` (+ `@gt100k/wellbeing` dep + `transpilePackages`), `app/qa.ts` (extend, don't break).
- [ ] Add the dep + `transpilePackages`. `pnpm install`.
- [ ] Compute, for the selected kid, a `WellbeingRead` per hypothesis: `deriveWellbeingSignals(profile, cellKey, PILOT_NOW)` → `assessWellbeing(...)`. (Source the profile from the existing `buildPilotRoster` roster in `console-data.ts`.)
- [ ] Render a **functional-but-plain** panel: per spike, show the state, the two recommended moves (e.g. "Challenge: Hold · Pressure: Autonomy↑"), and any **"Needs your review"** escalation (rest/back-off/gap/devaluation) with a plain rationale. Guide-facing; grayscale-safe; reuse the console's tokens. No child-facing text.
- [ ] **Preserve `window.__qa`:** keep `state()` (may add `escalations: number`) + `primaryAction()` (still promotes the top gate-passed candidate). The existing `test/state.test.ts` must keep passing (update only additively).
- [ ] gate: `pnpm exec tsc -b` + `pnpm test`; then **stop any dev server on the port first**, `pnpm --filter @gt100k/guide-console build`, run `LOOP_QA` (`next start` + harness): `window.__qa.ready === true`, `primaryAction()` still promotes (state + DOM change), and the wellbeing panel renders. **Commit** `feat(console): wellbeing/escalation panel (system proposes, human disposes)`.

---

### Final verification (SC-9) + PR
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green; `pnpm --filter @gt100k/guide-console build` clean; `LOOP_QA` pass.
- [ ] `passionApps.md`: note F2 engine done (guide surface functional; polish pending); F1 no longer only-guide.
- [ ] Open PR (gh, pushed as `spinkicks`); if 015 already merged, `gh pr update-branch` first; squash-merge after CI + branch up to date.

## Notes on likely snags (pre-solved)
- **Priority order is the whole engine:** get the §3.3 order right (devaluation/BURNOUT_TIP first). A high-success-but-declining-return kid must **not** read as PUSH (SC-3) — check the PUSH guard requires rising return + rising depth + stretch-seeking.
- **Never auto-act:** the engine only recommends; `rest`/`backOff` always escalate; nothing is ever applied to the child, and `missing` never yields a nudge (SC-4/SC-6). These are tested invariants, not nice-to-haves.
- **Don't break LOOP_QA:** the guide-console panel is additive; keep `SEED_KID`/`window.__qa`/`primaryAction` intact so the existing usability gate stays green.
- **Parallel with 015:** if the concierge branch merges first, update this branch against `main` (only the root `tsconfig.json` reference append should conflict, trivially).
- **`.next` corruption:** never run `next build` while `next dev` serves guide-console; stop the dev server (port-scoped) first.
