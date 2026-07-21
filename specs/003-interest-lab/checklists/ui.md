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
- [x] Success criteria (SC-UI-01…18) are measurable and each maps to a concrete test (§U10), incl. the 3D scene (SC-UI-13), render/quality tiers (SC-UI-14), evidence constellation (SC-UI-15), and 60fps/`aria-hidden`-canvas app checks (SC-UI-16/18)
- [x] Success criteria are technology-agnostic
- [x] All acceptance scenarios are defined (per user story UI-US1…US5)
- [x] Edge cases identified (fresh learner, all-prompted, coverage gap, missing/withdrawn, assistive/safety, shadow proposal, help affordance, reduced-motion+transparency+contrast)
- [x] Scope is clearly bounded (renders the done Part-I domain; no learned model, no Specialization adoption, no standings)
- [x] Dependencies and assumptions identified (§U14 — builds on Part I; synthetic-only)

## Feature Readiness

- [x] Every UI-FR has clear acceptance criteria
- [x] User scenarios cover the primary flows (pick → return delight → coverage → explanations/timeline/lifecycle → a11y/parity)
- [x] MVP identified (P8 + P9 + P9b + P10 = the child Curiosity **Quest World** — the 3D floating islands + its 2D reduced-motion/accessible equal)
- [x] No implementation details leak into the spec's normative sections

## Loop-Readiness (per `gt100k-factory/docs/loop-ready-prd.md`)

- [x] **Scope fence** — explicit in/out/non-goals incl. the 3D tiers + no-external-fetch (§U1)
- [x] **Phasing P8…P15** — ordered build path incl. the **3D-UI phases** (P10 world / P11 delight / P14 tiers), each → task block + gate (§U9, tasks.md P8…P15)
- [x] **Acceptance = tests** — SC-UI-01…18 each mapped to a concrete test (§U10)
- [x] **Golden values + tolerances** — palette/type (§U8.2/§U8.3), motion tokens incl. 3D kinds (§U8.4), domain-hue ramp (§U8.5), work-mode glyphs (§U8.6), child staging (§U8.7), probe-picker (§U8.8), coverage view (§U8.9), timeline (§U8.10), lifecycle/gate (§U8.11), explanations (§U8.12), **island layout/quest placement (§U8.13, ±0.001)**, **3D scene/camera/lighting (§U8.14)**, **render/quality tiers (§U8.16)**, **evidence constellation (§U8.17)**, scene↔board parity (§U8.18), one-view composition (§U8.19); tolerance ±0 (exact) except the 3D trig ±0.001
- [x] **Decisions already made** — rendering (**3D react-three-fiber + drei + three world + 2D-DOM equal/fallback tier**, one view model), **DOM motion `motion@^12`**, view-package architecture (pure + GPU-free), art direction, catalog-order hue **and island layout**, structural guardrails (§U2)
- [x] **Defaults for the unspecified** — verbatim rule (§U3)
- [x] **Stack + commands pinned** — pnpm; `motion@^12` + `three`/`@react-three/fiber@^8`/`@react-three/drei@^9` pinned; `typecheck`/`test`/`build`; seeded smoke green from iteration 1 (§U11)
- [x] **Seed fixtures in-repo** — reuses Part-I `CATALOG_GOLDEN_V1`/`CATALOG_GAPPY_V1`/`EVENTS_GOLDEN_V1`; **no external fetch** (procedural 3D geometry + in-app textures + system fonts)
- [x] **Navigable structure** — per-phase §U headers for JIT reading (§U0, §U9)
- [x] **Pre-marked decision points w/ severity** — DP-U1…U12 (§U13)
- [x] **Env/secrets handled** — `apps/interest-lab/.env.local.example` placeholders; `.env.local` git-ignored; build never fails on missing env (§U11)

## Design craft (apple-design · emil-design-eng · ui-ux-pro-max · impeccable)

- [x] **Art direction**: exact palette hex + typography tokens + 3D scene/lighting constants + mood board; "Curiosity Atelier at Dusk" floating-archipelago identity (§U5.1, §U8.2/§U8.3/§U8.14)
- [x] **Anti-slop** (impeccable): scene-sentence chosen; **not** cream/sand body (deep plum-indigo dusk sky); **not** feature-004 golden-hour; no gradient-text / glassmorphism-by-default / hero-metric / eyebrow scaffolding; committed color strategy; **no floating score/rank in the 3D world**
- [x] **Master motion table** (event → tier → named effect → easing → duration token → reduced-motion equivalent), DOM **and** 3D rows, as testable golden constants (§U6, §U8.4)
- [x] **Motion decisions** (Emil): frequency-appropriate (rare→delight, occasional→standard, frequent→instant); strong custom ease-out entrances; one reserved spring (pick/hop); gentle looped 3D idle/glow; never `scale(0)`; never `ease-in` on entrances; excluded effects listed incl. time/mastery-gated unlocks (§U5.6)
- [x] **Fluid interaction** (Apple): press feedback on pointer-down, interruptible pick hop/spring, damped camera focus from the live value, origin-aware drawers, translucent materials with reduced-transparency fallback (§U5.2/§U5.5)
- [x] **Typography** (Apple): contrast-axis three-role system, size-specific tracking, tabular numbers, system-font fallback (no external fetch), **all text in DOM (never in the canvas)** (§U8.3)
- [x] **DOM motion standardized on `motion@^12`** (`motion/react`); r3f/drei own only the 3D scene; no other animation engine (§U2 D-U2)
- [x] **3D approach + fallback**: floating-island world (r3f + drei + three) with a first-class 2D card-constellation equal/fallback tier; graceful degradation full→lite→2D (§U5.2, §U8.13/§U8.14/§U8.16)
- [x] **Two surfaces** distinct in mood yet one system (child 3D world vs guide console + optional evidence constellation) (§U5.2/§U5.4)

## Accessibility (WCAG 2.2 AA — DOM-native, `aria-hidden` canvas)

- [x] Reduced motion is a first-class **equal** mode (the `board-2d` tier) with an equivalent for every animation, DOM **and** 3D (UI-FR-012, SC-UI-08/10/16)
- [x] The 3D `<Canvas>` is **`aria-hidden="true"`**; the DOM **quest ledger** / console panels are the operable AT source of truth; keyboard/switch/screen-reader operable on **both** surfaces; visible `--focus`; color-independent (icon+text); ≥4.5:1 contrast; no state/affordance reachable only via the canvas (UI-FR-013, SC-UI-18)
- [x] 60fps target with **graceful degradation** (full→lite→2D) + no-WebGL/lost-context/`Save-Data`/`deviceMemory<4` fallback; a tier change never blocks a pick or loses a quest (UI-FR-021, SC-UI-16)
- [x] `prefers-reduced-transparency` → solid panels; `prefers-contrast: more` accounted for (§U12)
- [x] Accessibility/safety help never lowers a signal (`lowersSignal:false`); help affordance never framed as failure (UI-FR-008/015, SC-UI-06/17)

## Child-safety guardrails (child-facing surface — buildable, no process language)

- [x] Age-band staging on the child surface; 6-8 concrete / no raw numbers / comparison off / auto-tour camera (UI-FR-005, SC-UI-02)
- [x] No dark patterns: no countdown/scarcity/FOMO/streak/decay/engagement-timed nudge, **and no time/mastery-gated island unlock or level-up** (this is exploration, not the Arena); no number/score/rank floats in the 3D world (UI-FR-014/016/020b, SC-UI-17)
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

- The view layer (`packages/interest-lab-view`) is a **pure, GPU-free** package: it renders the Part-I domain outputs into render-ready view models **including the 3D scene numbers** (island layout, quest-marker placement, camera framing, render/quality tiers, evidence-constellation positions) and is fully Vitest-covered (golden values, spec §U8) **without a GPU** — it imports no `three`/`react`/`@react-three/*`. The app (`apps/interest-lab`) renders the 3D world with react-three-fiber + drei + three and all DOM motion with `motion@^12`; it is verified via `next build` + the quickstart acceptance walkthrough (frame-rate/gesture-feel are acceptance targets, not unit tests; the deterministic tier resolvers are unit-tested).
- **Rendering**: one view model → three tiers (`quest-world-3d` → `quest-world-3d-lite` → `board-2d`) → both surfaces; render tier is presentation, so `plainViewEquals` holds across it. The 3D `<Canvas>` is `aria-hidden` and mounts client-only; the DOM is the operable/accessible surface and the no-WebGL/reduced-motion fallback.
- Guardrails are encoded **structurally** where possible (no `score`/`rank`/`price`/`verdict` fields on any view type incl. `SceneView`/`ConstellationStar`; `lowersSignal:false` on support markers; `operative:false` on proposals; catalog-order island layout; no `Math.random`; no `three` import in the view package; no fixed-label copy; no floating score in the world) so they are enforced deterministically rather than merely asserted.
