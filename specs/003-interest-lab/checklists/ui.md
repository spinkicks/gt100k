# Specification Quality Checklist: Interest Lab UI (Part II)

**Purpose**: Validate the UI expansion (child probe-picker + guide hypothesis console) before build
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md) **Part II** · **Companions**: [plan.md](../plan.md), [tasks.md](../tasks.md), [research.md](../research.md), [data-model.md](../data-model.md), [contracts/interest-lab-ui.md](../contracts/interest-lab-ui.md), [quickstart.md](../quickstart.md)

## Content Quality

- [x] Requirements/success criteria are implementation-agnostic in spec (framework/library confined to plan.md/research.md)
- [x] Focused on child value + guide value + rights guarantees (honest evidence, no verdict/label)
- [x] Written so a non-technical reviewer can follow the two surfaces and their acceptance
- [x] All mandatory sections completed (User Scenarios §U4, Requirements §U7, Success Criteria §U10)

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain (open judgments captured in §U13 decision points)
- [x] Requirements (UI-FR-001…020) are testable and unambiguous
- [x] Success criteria (SC-UI-01…15) are measurable and each maps to a concrete test (§U10)
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined (per user story UI-US1…US5)
- [x] Edge cases identified (fresh learner, all-prompted, coverage gap, missing/withdrawn, assistive/safety, shadow proposal, help affordance, reduced-motion+transparency+contrast)
- [x] Scope is clearly bounded (renders the done Part-I domain; no learned model, no Specialization adoption, no standings)
- [x] Dependencies and assumptions identified (§U14 — builds on Part I; synthetic-only)

## Feature Readiness

- [x] Every UI-FR has clear acceptance criteria
- [x] User scenarios cover the primary flows (pick → return delight → coverage → explanations/timeline/lifecycle → a11y/parity)
- [x] MVP identified (P8 + P9 = the child Curiosity Quest Board)
- [x] No implementation details leak into the spec's normative sections

## Loop-Readiness (per `gt100k-factory/docs/loop-ready-prd.md`)

- [x] **Scope fence** — explicit in/out/non-goals (§U1)
- [x] **Phasing P8…P13** — ordered build path incl. the UI phases, each → task block + gate (§U9, tasks.md P8…P13)
- [x] **Acceptance = tests** — SC-UI-01…15 each mapped to a concrete test (§U10)
- [x] **Golden values + tolerances** — palette/type (§U8.2/§U8.3), motion tokens (§U8.4), domain-hue ramp (§U8.5), work-mode glyphs (§U8.6), child staging (§U8.7), probe-picker (§U8.8), coverage view (§U8.9), timeline (§U8.10), lifecycle/gate (§U8.11), explanations (§U8.12), one-view parity (§U8.13); tolerance ±0 (exact)
- [x] **Decisions already made** — rendering (React+framer-motion, no game engine), view-package architecture, art direction, catalog-order hue, structural guardrails (§U2)
- [x] **Defaults for the unspecified** — verbatim rule (§U3)
- [x] **Stack + commands pinned** — pnpm; `typecheck`/`test`/`build`; seeded smoke green from iteration 1 (§U11)
- [x] **Seed fixtures in-repo** — reuses Part-I `CATALOG_GOLDEN_V1`/`CATALOG_GAPPY_V1`/`EVENTS_GOLDEN_V1`; no external fetch
- [x] **Navigable structure** — per-phase §U headers for JIT reading (§U0, §U9)
- [x] **Pre-marked decision points w/ severity** — DP-U1…U8 (§U13)
- [x] **Env/secrets handled** — `apps/interest-lab/.env.local.example` placeholders; `.env.local` git-ignored; build never fails on missing env (§U11)

## Design craft (apple-design · emil-design-eng · ui-ux-pro-max · impeccable)

- [x] **Art direction**: exact palette hex + typography tokens + mood board; "Curiosity Atelier" identity (§U5.1, §U8.2/§U8.3)
- [x] **Anti-slop** (impeccable): scene-sentence chosen; **not** cream/sand body; **not** feature-004 golden-hour; no gradient-text / glassmorphism-by-default / hero-metric / eyebrow scaffolding; committed color strategy
- [x] **Master motion table** (event → named effect → easing → duration token → reduced-motion equivalent) as testable golden constants (§U6, §U8.4)
- [x] **Motion decisions** (Emil): frequency-appropriate (rare→delight, occasional→standard, frequent→instant); strong custom ease-out entrances; one reserved spring (pick); never `scale(0)`; never `ease-in` on entrances; excluded effects listed (§U5.5)
- [x] **Fluid interaction** (Apple): press feedback on pointer-down, interruptible pick spring, origin-aware drawers, translucent materials with reduced-transparency fallback (§U5.2/§U5.4)
- [x] **Typography** (Apple): contrast-axis three-role system, size-specific tracking, tabular numbers, system-font fallback (no external fetch) (§U8.3)
- [x] **Two surfaces** distinct in mood yet one system (child board vs guide console) (§U5.2/§U5.3)

## Accessibility (WCAG 2.2 AA — DOM-native)

- [x] Reduced motion is a first-class **equal** mode with an equivalent for every animation (UI-FR-012, SC-UI-08/10)
- [x] Keyboard/switch/screen-reader operable on **both** surfaces; visible `--focus`; color-independent (icon+text); ≥4.5:1 contrast; no opaque canvas (UI-FR-013, SC-UI-15)
- [x] `prefers-reduced-transparency` → solid panels; `prefers-contrast: more` accounted for (§U12)
- [x] Accessibility/safety help never lowers a signal (`lowersSignal:false`); help affordance never framed as failure (UI-FR-008/015, SC-UI-06/14)

## Child-safety guardrails (child-facing surface — buildable, no process language)

- [x] Age-band staging on the child surface; 6-8 concrete / no raw numbers / comparison off (UI-FR-005, SC-UI-02)
- [x] No dark patterns: no countdown/scarcity/FOMO/streak/decay/engagement-timed nudge (UI-FR-014, SC-UI-14)
- [x] Never a fixed label / "you are an X"; interface says "current evidence suggests" / concrete quest copy (§14.5, UI-FR-007, SC-UI-05/11)
- [x] No scalar passion score / no coverage number hiding a gap anywhere (IL-005/006, UI-FR-006/007, SC-UI-04/05)
- [x] No probe/hypothesis view shaped for admissions/discipline/ranking/commercial; view types forbid `rank`/`score`/`price`/`verdict` structurally (PASS-010, UI-FR-016, SC-UI-11)
- [x] Guide authors the operative record; shadow rule/model proposals render as suggestions only (`operative:false`) (IL-011, UI-FR-009, SC-UI-07)
- [x] The reserved delight celebrates **voluntary** return; prompted return recedes and is never celebrated (PASS-004/005, UI-FR-004, SC-UI-03/06)
- [x] **No** "human review before merge / PR-only build loop" process language written into these docs (per the brief); the only human-flagged item is the build-config **U-ROOT** root-`tsconfig` reference

## Traceability (PRD + Constitution)

- [x] PASS-001 provenance surfaced on each quest (UI-FR-017); PASS-003 ≥2 eligible preserved (UI-FR-002); PASS-004/005 voluntary vs prompted rendered (UI-FR-004/008); PASS-006 help never lowers a signal (UI-FR-008/015); PASS-010 no forbidden-purpose fields (UI-FR-016)
- [x] §14.4.3 #3 coverage gaps shown, never behind a confidence score (UI-FR-006, SC-UI-04)
- [x] §14.5 InterestHypothesis rendered: competing explanations side-by-side, uncertainty as grade/interval, lifecycle states + CANDIDATE_SPINE gate, guide-authored operative record, "current evidence suggests" language (UI-FR-007/009)
- [x] §14.13 developmental staging of the reward/representation layer on the child surface (UI-FR-005, SC-UI-02)
- [x] §14.12 reward-experience & no-dark-patterns on the child surface (UI-FR-004/014)
- [x] §9.2 Student Compass + Guide Console product picture honored (child sees choices/why; guide sees evidence, observations separated from model inferences)
- [x] Constitution I (human authors record), V (privacy/no forbidden export), VI (a11y/non-discrimination), VII (voluntary-return over engagement), VIII/IX (no dark patterns / no ranking / no purchase) all mapped in plan.md Part II Constitution Check

## Parallel-Safety & Build-On

- [x] All new code lives only in `packages/interest-lab-view` + `apps/interest-lab`
- [x] Part I (`packages/interest-lab`, `adapters/interest-*`) and `apps/student-compass` are not modified beyond consuming Part I's public API
- [x] `pnpm-workspace.yaml`, `vitest.config.ts`, and the Biome `lint` script already discover the new dirs (verified against repo config); the app is **not** in the Vitest glob (verified by `next build`)
- [x] The only shared-root edit is the root `tsconfig.json` reference for `packages/interest-lab-view`, the **final, flagged** task **U-ROOT** for human reconcile

## Notes

- The view layer (`packages/interest-lab-view`) is a **pure** package: it renders the Part-I domain outputs into render-ready view models and is fully Vitest-covered (golden values, spec §U8). The app (`apps/interest-lab`) is verified via `next build` + the quickstart acceptance walkthrough (frame-rate/gesture-feel are acceptance targets, not unit tests).
- Guardrails are encoded **structurally** where possible (no `score`/`rank`/`price`/`verdict` fields; `lowersSignal:false` on support markers; `operative:false` on proposals; no `Math.random`; no fixed-label copy) so they are enforced deterministically rather than merely asserted.
