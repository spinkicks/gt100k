# Family → Guide-Console Consolidation — Implementation Plan

> Built live in-session (guide-console UI). Steps are checkboxed; commit at the end once approved.

**Goal:** Fold the F3 family coaching read into the guide console as a read-only **Family tab**, and remove the standalone `apps/family` app. Reuse the `@gt100k/family` engine unchanged. Design per `specs/021-family-console-consolidation/spec.md`.

**Architecture:** A `family.ts` view-model derives the selected child's `FamilyRead` (roster + 016 wellbeing reads + synthetic guide observations → `assessFamily`), exactly as the retired `apps/family/app/family-data.ts` did. The console gains a 4th tab whose content is a read-only coaching panel in the dark-console style. The standalone app is deleted.

## Global Constraints
- Dark-console styling only; reuse existing tokens + card/`wbitem`/`.plangrid`/chip patterns. No light theme, no new component vocabulary.
- Read-only: no approve/preview state; `window.__qa`/`primaryAction` unchanged.
- Guardrails from 019 carry over: no child/family-facing label, no score, no reward, no affect detection.
- Gate: `pnpm exec tsc -b` + `pnpm --filter @gt100k/guide-console test` + `next build` + `LOOP_QA`; verify with screenshots.

---

### Task 1: `family.ts` view-model + dep
**Files:** `passion/apps/guide-console/app/family.ts` (new); `passion/apps/guide-console/package.json` (+ `@gt100k/family`, `transpilePackages`); root `tsconfig.json` (guide-console already referenced).
- [ ] Add dep `@gt100k/family` + add it to `transpilePackages`; `pnpm install`.
- [ ] `family.ts`: reuse `profileFor`/roster + `wellbeingForKid` (016). Implement:
  - `familyForKid(kidId): FamilyRead | undefined` — `deriveFamilySignals(profile, store, wbReads, PILOT_NOW, PILOT_CATALOG)` → spread the synthetic `GUIDE_OBSERVATIONS` (port the map: `kid-synthetic-002` conditionalRegardObserved, `kid-synthetic-003` lowFamilyEngagement) → `assessFamily(...)`.
  - `observationsForKid(kidId): readonly string[]` (port `OBSERVATION_LABELS`).
  - `familyOfferCount(read): number` = `read.asks.length + read.sharedActivities.length`.
- [ ] Pure/deterministic; no network.

### Task 2: Family tab + read-only panel
**Files:** `passion/apps/guide-console/app/family-panel.tsx` (new); `app/useConsole.ts` (+ `family` read); `app/console.tsx` (+ 4th tab + render).
- [ ] `useConsole`: add `family = useMemo(() => familyForKid(kid), [kid])` + `familyObservations`.
- [ ] `console.tsx`: add `{ id: "family", label: "Family", count: familyOfferCount(ctrl.family) }` to `tabs` (after plan); render `{view === "family" ? <FamilyPanel read={ctrl.family} observations={ctrl.familyObservations} /> : null}`; add `"family"` to the `View` union.
- [ ] `family-panel.tsx` (read-only, dark styling): lead line ("The system proposes coaching, you decide."); a "Needs your review" note when `escalateToHuman` (antecedents + reason) else quiet risk; posture as a `.plangrid` (Autonomy support / Structure / Warmth: Non-contingent / Decouple worth); guide observations (read-only, "synthetic" chip); coaching offers (asks + shared activities as labeled lines); rationale. Reuse `wbitem`/`wbpanel` classes; no approve button.
- [ ] Style any new bits in `globals.css` reusing existing patterns.

### Task 3: Remove standalone `apps/family`
**Files:** delete `passion/apps/family/**`; `pnpm-workspace.yaml`; root `tsconfig.json`; any LOOP_QA/CI config.
- [ ] Delete the app dir; remove its workspace membership + root `tsconfig.json` reference + any `@gt100k/family-app` LOOP_QA config.
- [ ] `pnpm install`; confirm `pnpm exec tsc -b` clean + `pnpm test` green (no dangling refs).

### Task 4: Verify + docs
- [ ] `tsc -b` clean; `pnpm --filter @gt100k/guide-console test` green (`state.test.ts` unbroken); `next build` clean; `LOOP_QA` pass. Screenshot the Family tab (Ari baseline, Bex elevated) for dark-console parity.
- [ ] `passionApps.md`: F3 surface now in the console (Family tab); standalone `apps/family` retired.
- [ ] Commit the guide-console cockpit (polish + galaxy + family tab) + app removal (when the user says commit).

## Snags (pre-solved)
- Reuse `wellbeingForKid` for the 016 reads so the family derivation matches the retired app exactly (Bex → elevated/escalate).
- Keep the tab default = Hypotheses so `primaryAction` stays on a visible card (LOOP_QA).
- Removing the app: make sure no other package imports `@gt100k/family-app` (nothing should); the engine `@gt100k/family` stays.
