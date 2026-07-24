# Feature Specification: Family → Guide-Console Consolidation

**Feature Branch**: `feat/guide-console-cockpit`
**Created**: 2026-07-23
**Status**: Draft (grilled + approved design)

**Input**: Fold the merged **F3 Family Co-Engagement (019)** guide surface into the **guide console** as a fourth tab, so the human lane (F1 guide + F2 wellbeing + F3 family) lives in **one operator cockpit** per child, and retire the standalone `apps/family` app. Design settled via a `/grilling` + brainstorming session (decisions §3). The `@gt100k/family` engine is unchanged; only the *surface* moves.

---

## 1. Why & where it sits
Today a guide watches one child across three surfaces in the console (Hypotheses, Wellbeing, Plan) **plus** a separate, light-themed `apps/family` app for family coaching. That split fragments the guide's attention and drifts visually. This consolidation makes Family a fourth tab in the dark console cockpit — one child, four lenses, one place — and removes the duplicate app. It reuses the pure `@gt100k/family` engine (`assessFamily` + `deriveFamilySignals`) exactly as `apps/family` did; nothing about the model changes.

## 2. Scope Fence *(hard)*

### In scope
- **Guide console** (`apps/guide-console`): a new **"Family" tab** (4th, after Plan) rendering the selected child's `FamilyRead` as a **read-only** coaching panel; a `family.ts` view-model that derives the read (roster + 016 wellbeing reads + synthetic guide observations → `assessFamily`); the `@gt100k/family` dep + `transpilePackages`; the unified tab-count pill showing **total coaching offers** (asks + shared activities); tab wiring + reset-on-child-switch.
- **Remove** the standalone `apps/family` app: delete the app directory, its workspace membership, its root `tsconfig.json` reference, and any LOOP_QA config referencing it.
- Update `passionApps.md` (F3 surface now in the console; standalone app retired).

### Out of scope
- **The `@gt100k/family` engine** (019) — reused verbatim; not modified.
- **The approve → family-preview mechanic** — dropped from the console (the Family tab is read-only, like Wellbeing/Plan). A genuinely *family-facing* (parent-facing) surface is a separate future feature, not this.
- **New family signals / affect detection / gamification** — none; all guardrails from 019 stand.
- **`window.__qa` primaryAction change** — unchanged (still promotes the top gate-passed candidate); the Family tab adds no primary action.

## 3. Design decisions *(from the grill — do not re-open)*
- **[D1]** Family is a **4th console tab** (Hypotheses / Wellbeing / Plan / Family), per selected child.
- **[D2]** **Read-only** coaching panel — no approve/preview state; consistent with the Wellbeing/Plan tabs.
- **[D3]** The Family tab's unified count pill = **total coaching offers** (`asks.length + sharedActivities.length`).
- **[D4]** **Remove** the standalone `apps/family`; keep the `@gt100k/family` engine.
- **[D5]** Synthetic **guide observations** (Bex → conditional regard; Cyrus → low family engagement) are ported so the tab demonstrates the elevated/`needs your review` state; rendered read-only + clearly labeled "synthetic".
- **[D6]** Dark-console styling only — reuse the existing card/`wbitem`/chip patterns + tokens; **no light theme**, no new component vocabulary.
- **[D7]** Restore an at-a-glance escalation signal: keep the uniform count pill on every tab, **and** add a small **review dot** on any tab (Wellbeing / Plan / Family) whose selected-child read has an escalation (`escalateToHuman`). The dot is a marker, not a competing number.
- **[D8]** Harden the Galaxy backdrop: wrap the WebGL setup in a `try/catch` so a missing/failed GL context degrades to no-backdrop instead of crashing the page (protects `next build` + `LOOP_QA` in headless/CI).
- **[D9]** Ship as **one "guide-console cockpit" PR** (polish + Galaxy + Family tab + `apps/family` removal), pushed as `spinkicks`.

## 4. Content of the Family tab (read-only)
Per the selected child's `FamilyRead`:
1. A lead line: *"The system proposes coaching, you decide."* (matching the Wellbeing/Plan `wbpanel__sub` pattern).
2. **Pressure watch / escalation** — when `escalateToHuman`, a "Needs your review" note with the fired antecedents + `escalationReason`; else the risk shown quietly.
3. **Warm-demanding posture** — Autonomy support (`up`/`steady`), Structure (`up`/`steady`), Warmth (Non-contingent), Decouple worth-from-outcome (yes/no), as a compact label→value grid (reuse `.plangrid`).
4. **Guide observations** — the synthetic notes as read-only labels (via the 019 `OBSERVATION_LABELS`), tagged "synthetic".
5. **Coaching offers** — door-opening **asks** + **shared-activity** ideas, each a labeled line (no approve button).
6. **Rationale** — the plain-language `rationale`; humanize any raw tokens if present.
All guide-facing; no child/family-facing label, no score, no reward (019 guardrails carry over).

## 5. Data flow
`family.ts` (new, in the console) mirrors the retired `apps/family/app/family-data.ts`:
- reuse the console's existing derived roster (`profileFor` / `buildPilotRoster`) + `wellbeingForKid` (016 reads);
- `deriveFamilySignals(profile, store, wellbeingReads, PILOT_NOW, PILOT_CATALOG)` → layer the synthetic `GUIDE_OBSERVATIONS` → `assessFamily(...)` → `FamilyRead`;
- expose `familyForKid(kidId): FamilyRead | undefined` + `familyOfferCount(read): number` for the controller/tab pill.
Pure + deterministic + offline (no network, pinned `PILOT_NOW`). `useConsole` gains `family` (the selected child's read); the tab count uses the offer count.

## 6. Success Criteria *(each maps to a test / check)*
- **SC-1** the console renders a **Family** tab (4th); selecting it shows the selected child's coaching read — app render test.
- **SC-2** the read is **derived through the real engine** (`assessFamily`/`deriveFamilySignals`) over the pilot roster + 016 reads + synthetic observations — pure view-model test (Bex → `elevated` + `escalateToHuman`, Ari → `none`/baseline).
- **SC-3** the Family tab pill = `asks.length + sharedActivities.length` for the selected child — test.
- **SC-4** read-only: no approve control, no approval state; no child/family-facing label or score field rendered — test/shape check.
- **SC-5** `window.__qa` unchanged: `ready`/`error`/`state()`/`primaryAction()` still promote the top candidate; existing `state.test.ts` stays green — test.
- **SC-6** the standalone `apps/family` is gone: no `passion/apps/family` dir, no workspace/tsconfig reference, `pnpm exec tsc -b` clean, `pnpm test` green.
- **SC-7** gate: `pnpm exec tsc -b` + `pnpm test` + `pnpm --filter @gt100k/guide-console build` + `LOOP_QA` pass; dark-console visual parity verified by screenshot.

## 7. Removal checklist (apps/family)
- delete `passion/apps/family/**`;
- remove its entry from `pnpm-workspace.yaml` (if enumerated) / ensure the glob no longer resolves it;
- remove its `{ "path": "passion/apps/family" }` reference from the root `tsconfig.json`;
- remove any `LOOP_QA`/CI config pointing at `@gt100k/family-app`;
- `pnpm install` to update the lockfile; confirm `tsc -b` + `pnpm test` clean.

## 8. Stack + Commands
- `apps/guide-console` gains dep `@gt100k/family` (`transpilePackages`). Build live (this session) + screenshots; gate `pnpm exec tsc -b` + `pnpm --filter @gt100k/guide-console test` + `next build` + `LOOP_QA`. TS strict; dark theme; no network.
