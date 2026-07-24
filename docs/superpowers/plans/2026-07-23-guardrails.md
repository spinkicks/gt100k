# Guardrails — Program Metrics + Compliance Checks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task.

**Goal:** Build `017-guardrails` per its spec — a headless domain package (`@gt100k/guardrails`: `programMetrics` + `checkCompliance` over the merged discovery-spine artifacts) + a CLI report + a standing "honesty" regression test on the real pilot roster.

**Architecture:** Pure, deterministic functions over the 014 `Roster` (per-kid 013 stores). Metrics are aggregate/never-kid-facing; each locked pipeline rule is an executable check that flags violations. No app, no network.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest.

## Global Constraints
- **SYNTHETIC / aggregate only.** Gate = `pnpm exec tsc -b` + `pnpm test`.
- **`pnpm install` (not --frozen)** after the new `package.json`. Lockfile committed.
- `import type` for types; guard `T | undefined`. Everything pure/immutable. Reuse `Lifecycle` (013) + `Roster`/fixtures (014); never redefine.
- **Parallel-safe with 015 + 016:** only new files under `passion/packages/guardrails` + a root `tsconfig.json` append; depends solely on merged 011/013/014. If 015/016 merged first, `gh pr update-branch` before merge. Commit after each task.

---

### Task 0: Scaffold `@gt100k/guardrails`
**Files:** `passion/packages/guardrails/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [ ] Failing smoke test; `package.json` (`@gt100k/guardrails`, deps `@gt100k/hypothesis-store` + `@gt100k/interest-inference` + `@gt100k/student-profile`, `test` script `vitest run --root ../.. packages/guardrails/test`); `tsconfig.json` (extends base; references those three); `src/index.ts` → `export {};`; append root reference.
- [ ] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(guardrails): scaffold @gt100k/guardrails`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
- [ ] Define `ProgramMetrics`, `CheckResult`, `Violation`, `ComplianceReport` (spec §3.1) + constants `COVERAGE_MIN_DOMAINS`, `GAMIFICATION_KEYS`, `SCALAR_KEYS` (§3.4).
- [ ] Unit test pins constants. **Commit** `feat(guardrails): types + golden constants`.

---

### Task 2: `programMetrics` (P1)
**Files:** `src/metrics.ts`, `test/metrics.test.ts`; barrel.
**Interface:** `programMetrics(roster: Roster): ProgramMetrics`. funnel = count by `Lifecycle` across all kids' hypotheses (`getForKid` per kid); coverage = distinct `domainPath[0]` per kid → `avgDomainsPerKid` + `pctKidsCoveragePass` (≥ `COVERAGE_MIN_DOMAINS`); calibration = `confidentRate` (confident/total) + `notSureYetRate` ((EXPLORING & !confident)/total); reopenRate = hypotheses whose `history` has a `REOPENED` transition / total. Guard div-by-zero (empty roster → zeros).
- [ ] **Failing golden test:** `programMetrics(buildPilotRoster(PILOT_NOW))` → the exact funnel counts, `avgDomainsPerKid`, `confidentRate`, `reopenRate` (read them off the real pilot roster and pin them).
- [ ] Implement. **Commit** `feat(guardrails): program metrics (funnel, coverage, calibration, reopen)`.

---

### Task 3: `checkCompliance` GC1–GC6 (P2) — CORE
**Files:** `src/checks.ts`, `test/checks.test.ts`; barrel.
**Interface:** `checkCompliance(roster: Roster): ComplianceReport`. Implement GC1–GC6 (spec §3.2). Deep-scan each hypothesis object (+ its `evidence` + `history`) for banned keys (`SCALAR_KEYS`, `GAMIFICATION_KEYS`) via a generic recursive key-scan; GC2/GC3 scan `evidence.supporting`; GC4 checks every `CANDIDATE`/`ACTIVE` has a human transition into that state in `history` (actor role ∉ {MODEL,SYSTEM}); GC5 scans `history` for `from:"EMERGING" to:"EXPLORING"`. Each returns a `CheckResult` + pushes `Violation`s; `ok = checks.every(c => c.ok)`.
- [ ] **Failing tests:** clean pilot roster → `ok:true` (SC-2); one **injected-violation** roster per check (auto-promoted CANDIDATE w/o human history → GC4; an object with `score`/`label` → GC1; `prompted_return` in supporting → GC2; `EMERGING→EXPLORING` history → GC5; a `streak` field → GC6) → exactly that check fails, others pass (SC-3..SC-7). Build the bad rosters by mutating a cloned pilot store.
- [ ] Implement. **Commit** `feat(guardrails): compliance checks GC1–GC6`.

---

### Task 4: CLI report + standing honesty test (P3+P4)
**Files:** `scripts/report.ts`, `test/honesty.test.ts`; barrel.
- [ ] `scripts/report.ts` — `const roster = buildPilotRoster(PILOT_NOW); print programMetrics(roster) + checkCompliance(roster)` in a readable format. Runnable via `pnpm exec tsx passion/packages/guardrails/scripts/report.ts` (no network).
- [ ] `test/honesty.test.ts` — **standing regression guard:** `checkCompliance(buildPilotRoster(PILOT_NOW)).ok === true` with no violations. (If a future change leaks a scalar/auto-promotes/etc., this test fails.)
- [ ] gate `pnpm exec tsc -b && pnpm test`. **Commit** `feat(guardrails): CLI report + standing honesty regression test`.

---

### Final verification (SC-9) + PR
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green; the CLI prints a report headless.
- [ ] `passionApps.md`: note G6 first slice done (spine metrics + compliance; concierge/wellbeing checks + dashboard later).
- [ ] Open PR (gh, pushed as `spinkicks`); if 015/016 merged first, `gh pr update-branch`; squash-merge after CI + branch up to date.

## Notes on likely snags (pre-solved)
- **Pin metrics off the real roster:** read the actual funnel/rates from `buildPilotRoster` and hard-code them in the golden test — don't guess. If 014's fixtures change, this test updates with them (intended).
- **Recursive key-scan must not false-positive:** GC1/GC6 scan object *keys*, not string values (an evidence string that contains the word "score" is fine; a *field named* `score` is not).
- **GC4 reads history, not just state:** a `CANDIDATE`/`ACTIVE` is only OK if a human transition put it there — a fabricated state with system/empty history must fail.
- **Parallel with 015/016:** disjoint except the root `tsconfig.json` append; update-branch before merge if needed.
