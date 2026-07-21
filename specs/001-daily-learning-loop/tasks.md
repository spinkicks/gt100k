# Tasks: Daily Learning Loop

**Input**: Design documents from `specs/001-daily-learning-loop/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/learning-loop.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/learning-loop.md` defines explicit test obligations. Write tests first; ensure they fail before implementing.

**Progress (2026-07-20) — FEATURE COMPLETE.** All user stories done and verified green: **US1** (XP accrual), **US2** (hybrid gate + rollover), **US3** (Next.js day view). Setup (pnpm workspace, TS strict, Vitest, **Biome lint**), Foundational (domain types/ports/config + in-memory repo), the **TimeBack stub + `demo` script**, and the package **README** are all in. Verification: `tsc -b` clean · **14 Vitest tests pass** · `biome check` clean · `next build` succeeds · `pnpm demo` unlocks for both standard (120 XP) and GT (200 XP) cohorts. *Turborepo (part of T001) intentionally deferred — pnpm workspace scripts suffice at this scale; add later if build orchestration is needed.*

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 (setup, foundational, polish carry no story label)

## Path conventions (from plan.md — TS monorepo)

- Domain: `packages/learning-loop/src/`, tests `packages/learning-loop/test/`
- Adapters: `adapters/repo-memory/`, `adapters/timeback-stub/`
- App: `apps/student-compass/`

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Create pnpm workspace + Turborepo root at repo root (`package.json`, `pnpm-workspace.yaml`, `turbo.json`) covering `packages/*`, `adapters/*`, `apps/*`
- [ ] T002 [P] Add strict TypeScript base config `tsconfig.base.json` at repo root
- [ ] T003 [P] Configure Vitest at the workspace root (`vitest.config.ts`, `test` script)
- [ ] T004 [P] Configure lint/format (Biome or ESLint+Prettier) with a repo-root config

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T005 Scaffold the `@gt100k/learning-loop` package (`packages/learning-loop/package.json`, `tsconfig.json`, `src/index.ts`)
- [ ] T006 [P] Define domain types in `packages/learning-loop/src/model.ts` (`Section`, `LoopConfig`, `FocusedLearningRecord`, `DailyProgress`, `GateResult`) per `data-model.md`
- [ ] T007 [P] Define ports in `packages/learning-loop/src/ports.ts` (`DailyProgressRepository`, `Clock`, `FocusedTimeSource`) per `contracts/learning-loop.md`
- [ ] T008 [P] Implement config presets + validation in `packages/learning-loop/src/config.ts` (standard: 120 total, 30/section, floor=goal; GT: raised goal/floors)
- [ ] T009 Implement the in-memory repository in `adapters/repo-memory/` implementing `DailyProgressRepository` (load/save/history)

**Checkpoint**: domain types, ports, config, and persistence exist — stories can begin.

---

## Phase 3: User Story 1 — Earn XP for focused learning in a section (Priority: P1) 🎯 MVP

**Goal**: focused learning time accrues XP (1 min = 1 XP) per section, idempotently.

**Independent Test**: feed N focused minutes in one section for a synthetic learner → section XP increases by exactly N; re-feeding the same record does not double-count.

### Tests (write first, ensure they fail)

- [ ] T010 [P] [US1] Contract test for `applyFocusedTime` (XP accrual = minutes; idempotent by record id) in `packages/learning-loop/test/xp.test.ts` (per `contracts/learning-loop.md`)

### Implementation

- [ ] T011 [US1] Implement `newDay(learnerRef, day, config)` in `packages/learning-loop/src/day.ts`
- [ ] T012 [US1] Implement `applyFocusedTime(progress, record)` (1 min = 1 XP, focused-only, idempotent by id) in `packages/learning-loop/src/xp.ts` (depends on T006, T011)
- [ ] T013 [P] [US1] Implement the TimeBack stub `FocusedTimeSource` (synthetic record generator) in `adapters/timeback-stub/`

**Checkpoint**: XP accrual works and is unit-tested independently.

---

## Phase 4: User Story 2 — Meet the hybrid gate and unlock project time (Priority: P2)

**Goal**: project time unlocks when daily total XP is met AND every section clears its configured floor; day rolls over cleanly.

**Independent Test**: accrue XP to the daily total but leave one section below its floor → still locked; clear all floors → unlocks; roll to next day → counters reset, prior day retained.

### Tests (write first, ensure they fail)

- [ ] T014 [P] [US2] Contract test for `evaluateGate` (hybrid total+floor; imbalance edge; `beyondFloorBySection`) in `packages/learning-loop/test/gate.test.ts`
- [ ] T015 [P] [US2] Contract test for `rollToDay` (reset + history preserved) in `packages/learning-loop/test/day.test.ts`

### Implementation

- [ ] T016 [US2] Implement `evaluateGate(progress)` (hybrid gate + `remaining*` + `beyondFloorBySection`) in `packages/learning-loop/src/gate.ts`
- [ ] T017 [US2] Recompute `projectUnlocked`/`unlockedAt` inside `applyFocusedTime` using the gate in `packages/learning-loop/src/xp.ts` (depends on T016)
- [ ] T018 [US2] Implement `rollToDay(progress, nextDay, config)` (finalize history + fresh next day) in `packages/learning-loop/src/day.ts`

**Checkpoint**: full loop (earn → hybrid gate → unlock → roll over) works headless and is tested.

---

## Phase 5: User Story 3 — See whole-day progress across the four sections (Priority: P3)

**Goal**: a day view shows per-section XP/goal, total vs. daily goal, beyond-floor engagement, and lock/unlock state.

**Independent Test**: render the day view for a synthetic learner in fresh / partial / goal-met states and confirm each region displays correctly.

### Implementation

- [ ] T019 [P] [US3] Scaffold the Next.js App Router app `apps/student-compass/`
- [ ] T020 [US3] Implement the day-view page in `apps/student-compass/app/` rendering per-section XP/goal, total, `beyondFloorBySection`, and lock/unlock state from `@gt100k/learning-loop` via the in-memory repo (depends on T016)
- [ ] T021 [US3] Wire the TimeBack stub feed to drive the view live in `apps/student-compass/` (depends on T013, T017)

**Checkpoint**: the loop is visible end-to-end for a synthetic learner.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T022 [P] Add `packages/learning-loop/README.md` (public API + ports usage)
- [ ] T023 [P] Add a `demo` script (`adapters/timeback-stub`) matching `quickstart.md`
- [ ] T024 Run the `quickstart.md` validation end-to-end (standard + GT config)
- [ ] T025 Confirm workspace CI green (typecheck + Vitest) before final PR

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational (P2, blocks all stories)** → **US1 (P1)** → **US2 (P2, depends on US1's xp/day)** → **US3 (P3, depends on gate/xp)** → **Polish**.
- US2 depends on US1 (gate recompute wires into `applyFocusedTime`); US3 depends on the gate (US2) for the display. So for this slice the natural order is sequential P1→P2→P3 (single developer).

## Parallel Opportunities

- Setup: T002/T003/T004 in parallel.
- Foundational: T006/T007/T008 in parallel (distinct files) before T009.
- US1: T010 (test) and T013 (stub) in parallel with T011/T012 logic.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (XP accrual, tested) → validate → then US2 (the gate, the defining rhythm) → then US3 (make it visible).
- Commit per task or logical group; test-gated; one PR per increment (governed flow). Synthetic-only; no consent/admissions/legal machinery (stubbed).

## Summary

- **Total tasks**: 25 (T001–T025)
- **US1**: 4 (T010–T013) · **US2**: 5 (T014–T018) · **US3**: 3 (T019–T021) · Setup 4 · Foundational 5 · Polish 4
- **MVP scope**: Setup + Foundational + US1.
