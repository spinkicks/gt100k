# D3 + D4 — Access & Audience Broker Implementation Plan

> **Complete.** `@gt100k/access-broker` ships the catalog port and seed, `brokerAccess` with its
> gates, the transfer lifecycle with the guardian-consent hard blocker, `deriveBrokerInputs` and the
> guardrail invariants, with `access-broker-live` behind it and the Access tab in the guide console.
> `docs/prd/passionApps.md` records D3/D4 as merged.

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox steps; commit after each task. The headless package + adapter (Tasks 0–6) are **loop-ready** (`tsc -b` + `test`). The **Access tab (Task 7)** extends the existing guide-console cockpit (reuse its dark theme + tab/panel patterns) and is gated by `next build` + `LOOP_QA`.

> **Amended (2026-07-27):** the deferred E1 coupling (~107, the `transferred`→EvidenceGraph node) must be built as
> an adapter outside the `evidence-*` namespace, not a dependency of `@gt100k/access-broker`: per
> `docs/decisions/evidencegraph-v1-design.md` §13a the EvidenceGraph is a separate product and `@gt100k/boundaries`
> fails CI on any value import of `evidence-*` from outside it. The integration point stands; its direction is now
> fixed.

**Goal:** Build `023-access-broker` per its spec — one combined `@gt100k/access-broker` engine that brokers the D1 plan's **named** mentor role + audience level against a **full layered synthetic catalog**, ranks candidates with every guardrail gate applied, and tracks a **human-gated access-transfer lifecycle** (`matched → proposed → approved → introduced → active → transferred`). Plus an opt-in `@gt100k/access-broker-live` catalog scaffold (fake data) and a new **"Access" tab** in `apps/guide-console`. The system proposes; the **guide disposes**. "Access transferred" is the deliverable.

**Architecture:** Pure, deterministic engine. `brokerAccess(inputs, {catalog}, now)` reads the `SpecializationPlan` (`018`) current-stage named need + the `016` wellbeing read + `014` age/readiness, queries the `OpportunityCatalog` port, ranks + gates candidates, and returns ranked mentor/audience matches + reconciled `Brokerage`s (never advanced past `proposed`). Pure lifecycle transitions (`proposeMatch`/`approve`/`advanceHandoff`/`declineMatch`) carry the **single guide gate** (guardian consent a required attribute, hard blocker). The stub catalog powers CI + `LOOP_QA`; the live adapter is opt-in fake data. The Access tab reuses the cockpit's existing plan derivation + tab pattern.

**Tech Stack:** TS strict (`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`), vitest; app = the existing Next 14 / React 18 guide-console (dark theme).

## Global Constraints
- **SYNTHETIC only.** No real mentor/competition/publishing integrations; the catalog is a deterministic seed; the live adapter returns fake data. **No network** in the gate.
- **Guide-facing only.** No broker output ever reaches the child; no auto-labels (PRD §8.3).
- **System proposes, guide disposes** — the engine never emits a state past `proposed`; `approve`+ are explicit human calls. **Consent is a hard blocker** (`approve` without `guardianConsent === true` throws `CONSENT_REQUIRED`). **Family owns no gate** (amplifier, never judge).
- **No gamification** — no score/rank/streak/points/badge field on any type (tested invariant).
- `import type` for types; guard `T | undefined`; pure/immutable engine. **`pnpm install`** (not `--frozen`) after each new `package.json`. Branch from current `main`.
- Reuse `018` types (`Stage`, `MentorRole`, `AudienceLevel`, `AgeBand`, `SpecializationPlan`), `016` `WellbeingRead`, `009` `WorkMode` — do not redefine them.

---

### Task 0: Scaffold `@gt100k/access-broker`
**Files:** `passion/packages/access-broker/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`; root `tsconfig.json`.
- [x] Failing smoke test; `package.json` (`@gt100k/access-broker`; deps `@gt100k/specialization-planner`, `@gt100k/wellbeing`, `@gt100k/two-axis-tagging`; `test` = `vitest run --root ../.. packages/access-broker/test`); `tsconfig.json` (extends base; references those three); `src/index.ts` → `export {};`; append root reference.
- [x] `pnpm install` → `pnpm exec tsc -b && pnpm test` PASS. **Commit** `feat(access-broker): scaffold @gt100k/access-broker`.

---

### Task 1: Types + constants (P0)
**Files:** `src/model.ts`, `test/model.test.ts`; barrel.
**Produces:** `OpportunityKind`, `MentorSourceLayer`, `AudienceChannel`, `VettingStatus`, `HandoffState`, `Opportunity`, `Brokerage` (spec §4.1). Re-export the reused `Stage`/`MentorRole`/`AudienceLevel`/`AgeBand` from the planner and `WorkMode` from tagging.
- [x] Define types exactly per §4.1 (**no score/rank/streak/points/badge field**). Constants `MENTOR_SOURCE_LAYERS`, `AUDIENCE_CHANNELS`, `HANDOFF_STATES` for iteration/validation.
- [x] Unit test pins the constant sets (exact members) + a type-level "no gamification field" assertion. **Commit** `feat(access-broker): Opportunity + Brokerage model`.

---

### Task 2: `OpportunityCatalog` port + `stubCatalog` seed (P1)
**Files:** `src/catalog.ts` (port + `stubCatalog`), `src/__fixtures__/catalog.ts` (the seed), `test/catalog.test.ts`; barrel.
**Interface:** `interface OpportunityCatalog { search(q: { domainPath: string; mode: WorkMode; kind: OpportunityKind; stage: Stage }): readonly Opportunity[] }` — pure, synchronous.
- [x] Build the **full layered synthetic catalog** (spec §4.5): for ~2–3 pilot cells (music/audio, chess, code), a spread of **mentor** opportunities across every `MentorSourceLayer` (AI/FAMILY/NEAR_PEER/THIN_EXPERT/MASTER, each `fillsRole` the matching `MentorRole`) + **audience** opportunities across every `AudienceChannel` (COMPETITION w/ deadline, PUBLISHING, COMMUNITY, MARKETPLACE, each `level` a matching `AudienceLevel`), with a spread of `minStage`, `ageTier`, `vetting` (incl. one `pending` + one `rejected` that must be filtered), `reputation`, `availability`. Include an S4-only `MASTER` entry (for the stage-gate test).
- [x] `stubCatalog.search` filters by `domainPath`/`mode`/`kind` (stage filtering happens in the engine). Test: returns the seed subset for a cell; `[]` for an unknown cell; deterministic order. **Commit** `feat(access-broker): OpportunityCatalog port + layered stub catalog`.

---

### Task 3: `brokerAccess` ranking + gates (P2) — CORE
**Files:** `src/broker.ts`, `test/broker.test.ts`, `src/__fixtures__/plans.ts` (one `SpecializationPlan` per stage) + `src/__fixtures__/wellbeing.ts`; barrel.
**Interface:** `brokerAccess(inputs: BrokerInputs, deps: { catalog: OpportunityCatalog }, now: string): BrokerPlan` (shapes per spec §4.2).
- [x] Read the plan's current-stage named need (`mentorRole`, `audience`, `stage`, `domainPath`, `craftScaffold`); query the catalog for `kind:"mentor"` and `kind:"audience"`; **rank** by the deterministic score (`domainFit + modeFit + roleOrLevelMatch + reputation + availabilitySoon`, tie-break by `id`); apply **all hard gates** (spec §4.3): vetting (only `vetted`), age-tier, stage (`minStage ≤ plan.stage`), craft floor (audience `!== "SELF"` needs non-empty `craftScaffold` → else `blocked`), and **wellbeing back-off** (`rest || backOff` → `held:true`, no new proposals, existing non-terminal brokerages noted `"held: protecting rest"`, nothing auto-advanced). Never emit a state past `proposed`.
- [x] **Failing golden table** (SC-1/3/4/5/6/8): per-stage plan → exact ranked `mentorMatches`/`audienceMatches` (order, `fit`, `blocked`), `held`, `escalateToHuman`; the S1-vs-S4-MASTER stage-gate; the craft-floor block; the wellbeing-hold; the vetting/age filters; identical inputs → identical `BrokerPlan`.
- [x] Implement. **Commit** `feat(access-broker): brokerAccess ranking + guardrail gates (stage/craft-floor/wellbeing/vetting)`.

---

### Task 4: Lifecycle transitions + consent hard-blocker + guardrails (P3)
**Files:** `src/lifecycle.ts`, `test/lifecycle.test.ts`, `test/guardrails.test.ts`; barrel.
**Interfaces:** `proposeMatch(match, cell, now) → Brokerage`; `approve(b, { guardianConsent, guideId }, now) → Brokerage`; `advanceHandoff(b, next: HandoffState, now) → Brokerage`; `declineMatch(b, now) → Brokerage`. All pure (return new snapshots).
- [x] **Failing tests (SC-2/7):** `proposeMatch` → `proposed`; `approve` **throws `CONSENT_REQUIRED` without `guardianConsent === true`**, succeeds with it → `approved` (records `approvedBy`, `guardianConsent`); `advanceHandoff` enforces order `approved → introduced → active → transferred` (rejects skips/reversals); `declineMatch` → `declined`; a `FAMILY` opportunity still gates on the guide (no family-owned path).
- [x] **Guardrail shape test:** no key matching `/score|rank|streak|points|xp|badge|leaderboard|win|lose/i` on `Opportunity`/`Brokerage`/`BrokerPlan`; no child-facing field; deterministic/offline.
- [x] Implement. **Commit** `feat(access-broker): access-transfer lifecycle + consent hard-blocker + guardrails`.

---

### Task 5: `deriveBrokerInputs` over 018/016/014 (P4)
**Files:** `src/derive.ts`, `test/derive.test.ts`; barrel.
**Interface:** `deriveBrokerInputs(plan: SpecializationPlan, wellbeing: WellbeingRead, ageBand: AgeBand, existing?: readonly Brokerage[]): BrokerInputs`.
- [x] Assemble `BrokerInputs` from the merged features (the plan already computed by `018`, the `016` read, the `014` age/readiness); default `existing` to `[]`. Test with a synthetic S3 plan + ok/rest wellbeing → the expected inputs bundle. **Commit** `feat(access-broker): deriveBrokerInputs over planner/wellbeing/profile`.

---

### Task 6: Live adapter `@gt100k/access-broker-live` (P4)
**Files:** `passion/adapters/access-broker-live/{package.json,tsconfig.json,src/index.ts,test/live.test.ts}`; root `tsconfig.json`.
**Interface:** `liveCatalog(): OpportunityCatalog` — an opt-in adapter shaped for a real mentor/competition/publishing API, returning **deterministic fake `Opportunity` data** now (mirrors `@gt100k/planner-live` / TimeBack `020`). A future `ACCESS_LIVE=1` server route can call it.
- [x] `package.json` (dep `@gt100k/access-broker`; scoped test script); `tsconfig.json` references it; append root reference. `pnpm install`.
- [x] **Hermetic test** (no network): `liveCatalog().search(...)` returns valid `Opportunity` shapes; opt-in; **never imported by a domain test**. **Commit** `feat(access-broker-live): opt-in catalog adapter (deterministic fake data)`.

---

### Task 7: `apps/guide-console` — the Access tab (P5)
**Files:** `apps/guide-console/app/{access.ts,access-panel.tsx,console.tsx,useConsole.ts,globals.css}` (extend; mirror the Plan/Family tab wiring); `apps/guide-console/{package.json,next.config.mjs}` (+dep + transpile `@gt100k/access-broker`).
- [x] `app/access.ts`: a view-model deriving, per certified spike (`ACTIVE`, plus `CANDIDATE`), a `BrokerPlan` via `deriveBrokerInputs(plan, wellbeing, ageBand)` + `brokerAccess(..., { catalog: stubCatalog }, now)` — reusing the plan the Plan panel already computes + the wellbeing read the Wellbeing panel already has. Export `accessForKid`, `accessReviewCount` (proposals/held needing a human).
- [x] `app/access-panel.tsx`: per spike, render the plan's named mentor + audience need, the **ranked proposals** (title, source-layer/channel, fit reasons, "why now", any `blocked` reason), and each `Brokerage` with its lifecycle state + **guide actions**: Approve (with a **guardian-consent checkbox**, disabled until checked), Advance (introduced→active→transferred), Decline; a **"held: protecting rest"** state when wellbeing backs off. Dark-console styling; reuse `wbpanel`/`plangrid`/tab patterns.
- [x] `console.tsx`: add a **5th tab** "Access" with a review-count badge (like Plan/Family); render `AccessPanel` on select; reset view on child switch. `useConsole.ts`: add `access` + `accessReviews` to the returned object.
- [x] `window.__qa`: extend `state()` **additively** with `access: { proposals, brokerages, held }`; keep `ready`/`error`/the existing `primaryAction` (promote top candidate) unchanged.
- [x] a11y: keyboard nav + visible focus on the tab + actions; the consent checkbox is a real labeled control; `prefers-reduced-motion` respected.
- [x] gate: `pnpm exec tsc -b` + `pnpm --filter @gt100k/guide-console test` (if present); `next build`; **`LOOP_QA`**: `window.__qa.ready===true`, `error===null`, `state().access` present, the existing `primaryAction()` still promotes the top candidate; no external fetch. **Commit** `feat(guide-console): Access tab — mentor relay + audience broker per spike`.

---

### Task 8: Polish + verify
- [x] Live polish pass on the Access tab: guide microcopy (fit reasons, "why now", held/consent/decline states legible), consistent with the cockpit.
- [x] `pnpm exec tsc -b` clean; `pnpm test` green (package + adapter); `apps/guide-console` `next build` clean; `LOOP_QA` pass.
- [x] `passionApps.md` + `passion-roadmap.md`: mark **D3/D4 (023) access broker** done (engine + adapter + Access tab; synthetic; real integrations gated by G3/G4 + real APIs); note the E1 "access-transferred" node + D2 audience feed are deferred integration points.
- [x] Open PR (gh, pushed as `spinkicks`); `gh pr update-branch` if `main` moved; squash-merge after CI.

## Self-review (spec coverage)
- Every spec section maps to a task: types §4.1 → T1; catalog port + seed §4.4/§4.5 → T2; `brokerAccess` ranking + gates §4.2/§4.3 → T3; lifecycle + consent + guardrails §4.2/§3 → T4; `deriveBrokerInputs` → T5; live adapter §4.4 → T6; Access tab §2/§5 (`window.__qa`) → T7; verify/docs §6 → T8. SC-1…SC-11 each land on a task's tests.
- Type consistency: `Opportunity`/`Brokerage`/`BrokerPlan`/`OpportunityCatalog`/`brokerAccess` names identical across T1–T7. Reused `018`/`016`/`009` types never redefined.

## Snags (pre-solved)
- **System proposes, guide disposes:** the engine returns only `matched`/`proposed`/`held`; `approve`+ are separate human-invoked transitions — a test asserts `brokerAccess` never emits a later state.
- **Consent is a hard blocker, not a vibe:** `approve` throws without `guardianConsent === true`; the UI disables Approve until the consent checkbox is ticked.
- **Wellbeing back-off = hold, not push:** widening access raises stakes, so `rest|backOff` holds new proposals (never lowers difficulty first) — a dedicated test.
- **Craft floor:** audience above `SELF` requires the plan's `craftScaffold` — reuse `018`'s rule; block with a clear guide reason otherwise.
- **Stage gate:** `minStage` keeps MASTER/expert + FIELD audience off S1/S2 plans — the seed catalog includes an S4-only MASTER to prove it.
- **Family-not-judge:** `FAMILY` opportunities surface but always gate on the guide; no family-owned transition exists.
- **Determinism:** stub catalog is a static value; ranking ties break by `id`; no clock/random in the engine.
- **Additive `window.__qa`:** extend `state()` only; keep the existing `primaryAction` so the current `LOOP_QA` stays green.
- **E1/D2 coupling deferred:** the `transferred`→EvidenceGraph node + approved-audience→D2-project wiring are noted integration points, built once E1's API settles (stub-until-ready, like D2).
```
