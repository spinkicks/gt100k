# Family Co-Engagement System (the environment amplifier) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task.

**Goal:** Build `019-family-coengagement` per its spec — a headless domain package (`@gt100k/family`: a pure `assessFamily` engine implementing the research §02 Category-C decision + a `deriveFamilySignals` deriver over the 014 profile / 013 store / 016 wellbeing reads) + a **new `apps/family`** surface (a guide coaching console + a family-facing preview) that renders the reads over the synthetic pilot roster and implements **`window.__qa` / `LOOP_QA`**.

**Architecture:** Pure, deterministic engine (per-child signals → a warm-demanding coaching posture + door-opening asks + shared-activity ideas + a family-driven-pressure watch, never a child/family label, score, or reward). Counter-cyclical: as stakes rise, autonomy support goes **up**. A deriver reads existing discovery + wellbeing data. The `apps/family` surface shows the guide the recommendation so the **system proposes and the human disposes** — a family-facing item appears only after the guide approves it.

**Tech Stack:** TS (strict, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; the app is Next 14 (new app; mirror `guide-console`).

## Global Constraints
- **SYNTHETIC ONLY.** Domain gate = `pnpm exec tsc -b` + `pnpm test`; app = `next build` + `LOOP_QA`.
- **`pnpm install` (not --frozen)** after each new `package.json`. Lockfile committed.
- `import type` for types; guard `T | undefined`. Everything pure/immutable. **No facial/affect detection; no gamification; non-contingent warmth always; no automated parent message; no child/family-facing label or score anywhere.**
- **Parallel-safe with 018:** only new files under `passion/packages/family` + `passion/apps/family` + a root `tsconfig.json` append. **Never touch `apps/guide-console`** (018's lane). Branch from current `main`.
- Commit after each task.

---

### Task 0: Scaffold `@gt100k/family`
**Files:** `passion/packages/family/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [ ] Failing smoke test; `package.json` (`@gt100k/family`, deps `@gt100k/student-profile`, `@gt100k/hypothesis-store`, `@gt100k/wellbeing`, `@gt100k/interest-inference`, `@gt100k/two-axis-tagging`; `test` script `vitest run --root ../.. packages/family/test`); `tsconfig.json` (extends base; references all five dep packages); `src/index.ts` → `export {};`; append root reference.
- [ ] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(family): scaffold @gt100k/family`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
- [ ] Define `PressureRisk`, `Knob`, `FamilySignals`, `CoachingPosture`, `FamilyRead` (spec §3.2) + constants `OVER_IDENTIFICATION_MIN_SHARE`, `MAX_ASKS`, `MAX_SHARED_ACTIVITIES` (§3.6).
- [ ] Unit test pins the constants. **Commit** `feat(family): types + golden constants`.

---

### Task 2: `assessFamily` engine (P1) — CORE
**Files:** `src/assess.ts`, `test/assess.test.ts`; barrel.
**Interface:** `assessFamily(signals: FamilySignals): FamilyRead`. Implement the **priority-ordered** §3.3 decision (Elevated pressure → Rising stakes → Strain → Low engagement → Baseline), first match wins. Invalid/empty input → safe baseline posture, `risk:"none"`, no fabricated "push harder". Always `posture.warmth === "non_contingent"`. Cap `asks`/`sharedActivities` at their constants.
- [ ] **Failing golden table test:** one `FamilySignals` fixture per posture → the exact `FamilyRead` (posture + `pressureWatch.risk` + `pressureWatch.antecedents` + `escalateToHuman`). Assert `rationale`/`guardrailNotes` presence (not exact prose); assert `asks`/`sharedActivities` caps.
- [ ] Implement. **Commit** `feat(family): assessFamily coaching engine (warm-demanding, counter-cyclical)`.

---

### Task 3: Guardrail invariants (P2)
**Files:** `test/guardrails.test.ts`.
- [ ] Tests (spec §3.4 / SC-2..SC-6):
  - counter-cyclical: any `anyStakesEvent` (or elevated pressure) ⇒ `autonomySupport:"up"` + `decoupleWorthFromOutcome:true`; the read never contains a "raise pressure / push harder" recommendation;
  - non-contingent warmth: `posture.warmth==="non_contingent"` in every read;
  - no gamification: the `FamilyRead`/`CoachingPosture` types carry **no** reward/streak/points/score field (type-level + shape check);
  - elevated pressure ⇒ `risk:"elevated"` + `escalateToHuman:true` + `antecedents` naming what fired;
  - over-identification ⇒ read protects plurality/reversibility, never narrows to one identity;
  - strain (`anyBackOffOrRest||anyDevaluation`) ⇒ `escalateToHuman:true`; no family-facing/child-facing label field exists.
- [ ] Fix the engine if any invariant fails (non-negotiable). **Commit** `test(family): guardrail invariants (counter-cyclical, non-contingent warmth, no gamification)`.

---

### Task 4: `deriveFamilySignals` (P3)
**Files:** `src/derive.ts`, `test/derive.test.ts`; barrel.
**Interface:** `deriveFamilySignals(profile: StudentProfile, store: HypothesisStore, wellbeingReads: readonly WellbeingRead[], now: string, catalog: Catalog): FamilySignals`. From the 013 store: `activeSpikes` (ACTIVE+CANDIDATE count), `overIdentification` (one spike ≥ `OVER_IDENTIFICATION_MIN_SHARE` share). From the 016 reads: `anyStakesEvent` (any `DANGER_WINDOW`/stakes), `anyDevaluation` (any `BURNOUT_TIP`/devaluation), `anyBackOffOrRest` (any `backOff||rest`), `pressuredSpecialization` (a stakes read on a declining-return spike). Leave `lowFamilyEngagement` + the three parental observations `undefined` unless supplied. Pure; no affect inference.
- [ ] **Failing golden test (SC-7):** a synthetic child (reuse `@gt100k/student-profile` + `@gt100k/wellbeing` fixtures) whose 016 reads include a stakes event + a devaluation on a dominant spike → derived signals (`anyStakesEvent`, `anyDevaluation`, `overIdentification`) → `assessFamily` returns `risk:"elevated"`, `escalateToHuman:true`.
- [ ] Implement. **Commit** `feat(family): deriveFamilySignals from the 014 profile + 013 store + 016 reads`.

---

### Task 5: `apps/family` surface (P4) + window.__qa
**Files:** `passion/apps/family/{package.json,tsconfig.json,next.config.*,vitest.config.mts,app/*,test/*}`; root `tsconfig.json`.
- [ ] Scaffold the Next 14 app mirroring `guide-console` (self-hosted fonts optional; `transpilePackages` the workspace deps; deps `@gt100k/family` + `@gt100k/student-profile` + `@gt100k/wellbeing` + `@gt100k/hypothesis-store` + `@gt100k/interest-inference`). `pnpm install`.
- [ ] Build the read per child: reuse `buildPilotRoster(PILOT_NOW)` (014) for the roster + `wellbeingForKid`-style reads (016) per spike, then `deriveFamilySignals(profile, store, reads, PILOT_NOW, PILOT_CATALOG)` → `assessFamily(...)`. Deterministic + offline.
- [ ] Render a **functional-but-plain** two-view surface: (1) a **guide coaching console** per child — the posture (autonomy support / structure / non-contingent warmth / decouple-worth), the door-opening asks, the shared-activity ideas, and any **"Needs your review"** family-driven-pressure escalation (with the named antecedents + a plain rationale); (2) a **family-facing preview** that shows only items the guide has **approved** (the primary action approves the top coaching card). Grayscale-safe; WCAG 2.2 AA; reduced-motion. No child/family-facing label; no reward/score.
- [ ] **`window.__qa`:** `ready`/`error`/`state()` (selected kid + risk + escalation count + approved count) / `primaryAction()` (approve the top coaching card → observable in `state()` + DOM). Pure state helpers in a `*-state.ts` + a headless CI test (mirror guide-console's `test/state.test.ts`).
- [ ] gate: `pnpm exec tsc -b` + `pnpm test`; then **stop any dev server on the port first**, `pnpm --filter @gt100k/family build`, run `LOOP_QA` (`next start` + harness): `window.__qa.ready===true`, `primaryAction()` approves (state + DOM change), the coaching console + family preview render. **Commit** `feat(family): apps/family guide coaching console + family preview (system proposes, human disposes)`.

---

### Final verification (SC-9) + PR
- [ ] `pnpm exec tsc -b` clean; `pnpm test` all green; `pnpm --filter @gt100k/family build` clean; `LOOP_QA` pass.
- [ ] `passionApps.md`: mark F3 engine done (surface functional; polish pending); the human lane (F1 guide + F2 wellbeing + F3 family) is now complete in engine form.
- [ ] Open PR (gh, pushed as `spinkicks`); `gh pr update-branch` if `main` moved; squash-merge after CI + branch up to date.

## Notes on likely snags (pre-solved)
- **Priority order is the whole engine:** get §3.3 right (elevated pressure first, then rising stakes, then strain). A child with a stakes event must read counter-cyclically (autonomy up), never "push harder" (SC-2).
- **Counter-cyclical is the point:** the dangerous moment (rising stakes) is exactly when the engine dials autonomy support *up* and reduces evaluative surfacing — the opposite of the adult reflex.
- **Never auto-act on the family:** the engine only recommends to the guide; a family-facing item appears only after approval; nothing is ever sent to a parent, and no child-facing label exists (SC-6/SC-8).
- **Non-contingent warmth + no gamification** are tested invariants, not nice-to-haves (SC-4) — never coach the family to give contingent praise/rewards.
- **No affect detection:** the unobservable parental signals (over-valuation, conditional regard, control) are optional guide-supplied inputs, never inferred from behavior or faces.
- **Don't import 018:** F3 reads 013/014/016 only; it never depends on the specialization planner (in flight). Never touch `apps/guide-console`.
- **`.next` corruption:** never run `next build` while `next dev` serves the app; stop the dev server (port-scoped) first.
- **Parallel with 018:** the only shared file is the root `tsconfig.json` (a reference append); if 018 merges first, `gh pr update-branch` (trivial merge).
