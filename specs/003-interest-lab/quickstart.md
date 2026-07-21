# Quickstart: Interest Lab UI (validation guide)

**Feature**: `003-interest-lab` · **Part II** (UI) — the child probe-picker + guide hypothesis console on top of the done Part-I pure domain.

How to prove the UI slice works end-to-end once implemented. Implementation lives in [tasks.md](./tasks.md) (P8…P13) / the code itself — this is a run/validation guide only. **Synthetic learners only**; no consent/admissions/legal workflow is needed to run any of this.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root.
- **Part I present and green** (`@gt100k/interest-lab` + `adapters/interest-*` + the fixtures `CATALOG_GOLDEN_V1`/`CATALOG_GAPPY_V1`/`EVENTS_GOLDEN_V1`) — the UI builds on it.

## Run the tests (primary validation)

```bash
pnpm test                                        # Vitest across the workspace (auto-discovers packages/interest-lab-view/test)
pnpm --filter @gt100k/interest-lab-view test     # view-package unit + contract + golden tests only
```

**Expected**: all contract obligations in [contracts/interest-lab-ui.md](./contracts/interest-lab-ui.md) pass —
- `buildProbePickerView` renders the domain Lab as quest cards with provenance + why + domain hue + work-mode glyph + an always-present help affordance, preserving ≥2 eligible per choice point (spec §U8.8);
- voluntary return (@7/@30) yields the "come back later" delight state with **label-free** copy; prompted recedes with no delight;
- `resolveChildStaging` stages the child surface by age band (6-8 hides raw numbers, comparison off) with identical underlying state;
- `buildCoverageMatrixView` shows gaps visibly and carries **no** scalar score (G2 complete / G3 gappy);
- `buildExplanationsView` pairs disconfirming beside supporting with a grade/interval, **no** scalar passion score;
- `buildReturnTimelineView` distinguishes voluntary from prompted and marks assistive/safety with `lowersSignal:false`;
- `buildLifecycleStateView` renders the gate checklist (`evaluateCandidateGate`) and shows shadow proposals as `operative:false` suggestions;
- `resolveMotion` matches the golden motion table with a reduced-motion equivalent for every kind;
- `buildInterestLabView` + `plainViewEquals` prove one view drives every mode.

## Typecheck & lint

```bash
pnpm typecheck    # tsc -b  (passes for @gt100k/interest-lab-view AFTER the final root-tsconfig reference task
                  #          lands — see tasks.md P13; flagged for human reconcile)
pnpm lint         # biome check packages adapters apps  (already covers packages/interest-lab-view & apps/interest-lab)
```

## View it (the two surfaces, UI-US1–US5)

```bash
pnpm --filter @gt100k/interest-lab-app dev     # apps/interest-lab — the child board + guide console (DOM/SVG + framer-motion)
# then build to validate the acceptance target:
pnpm --filter @gt100k/interest-lab-app build   # next build
```

**Stack notes**: React `^18.3.1` + Next `^14.2.15` App Router + **`framer-motion ^11`** (Motion), DOM/SVG only (no Canvas/Phaser — spec §U2 D-U1). The app reads `@gt100k/interest-lab` (domain) + `@gt100k/interest-lab-view` (view) and feeds the Part-I fixtures — **no external fetch**. Fonts are system fallback stacks by default. No `.env` is required; `apps/interest-lab/.env.local.example` documents the non-secret `NEXT_PUBLIC_*` defaults.

**Expected walkthrough** (driven by the synthetic domain fixtures):

1. **Child Curiosity Quest Board** (spec §U5.2): the domain Lab renders as a dusk-lit spread of quest cards clustered by domain constellation — each with its **domain hue**, a **work-mode glyph** (build / investigate / compose / …), difficulty/social/audience cues (icon + text, **color-independent**), a **why it appears** + provenance, and an always-present **help / "a different way"** affordance. There are always **≥2** eligible offers.
2. **Pick a quest**: pressing a card gives instant press feedback (scale 0.97 on pointer-down); selecting it plays a satisfying **momentum spring** into the "my quests" tray (interruptible). Everything is operable by **keyboard** with visible focus.
3. `prefers-reduced-motion` (or plain mode): entrances become instant/short crossfades, the pick spring becomes a ≤150ms crossfade, no `scale(0)`, and every quest/state remains fully conveyed.
4. **"Come back later" delight**: a **voluntary** return (@7/@30) warms the quest with a `spark` bloom + concrete copy ("You came back to this one") — the only reserved delight, never a fixed label, never guilt/FOMO/countdown. A **prompted** return recedes (`prompted` tone) with its intervention context on inspect and **no** celebration.
5. **Guide console — coverage matrix** (spec §U5.3): domains (rows) × 9 work-modes (columns); each cell shows its coverage status; **gaps are visible** calm slate cells; a **coverage rail** shows each dimension met / named-gap — the exact Part-I `CoverageMatrix`, with **no** scalar score anywhere. Cells fill with a stagger (instant under reduced motion).
6. **Competing explanations side-by-side**: the strongest **supporting** evidence beside the strongest **disconfirming** evidence, equal weight, never averaged; uncertainty as an evidence **grade** (thin/moderate/strong) or interval — never a scalar passion score, never "you are an X".
7. **Voluntary-vs-prompted return timeline**: voluntary returns @7/@30 bright and distinct; prompted returns recessed with their context; **assistive/safety events as neutral care-markers that never lower a signal**. The line draws in; markers pop on their day (static under reduced motion).
8. **Lifecycle state visual + authoring**: EXPLORING → EMERGING → CANDIDATE_SPINE → ACTIVE with CONTESTED / PARKED / REOPENED branches; the current state highlighted; the **CANDIDATE_SPINE gate checklist** (from `evaluateCandidateGate`) shows met families and names any missing prerequisite. A rule/model **proposal** renders as a dashed **suggestion** (`operative:false`, "a guide authors the record"); the **guide authors** the operative revision. A version-history rail scrubs revisions (append-only, never overwritten).
9. **Age band**: switching the synthetic learner's band re-renders the child surface (`resolveChildStaging`): 6-8 concrete/story-framed, **no raw numbers**, larger targets, comparison off, celebration capped at medium, ≤3 visible quests; 12-14 the full board + filters + the child's own exploration map (never a score/verdict). The underlying view state is identical across bands.

## Accessibility & performance acceptance

- With `prefers-reduced-motion` set, verify no state/coverage-gap/explanation/timeline/lifecycle is unreachable — entrances become instant/crossfade, the pick spring becomes a crossfade, the timeline is a static drawn line, ambient glow off (UI-FR-010/012, SC-UI-08/10). With `prefers-reduced-transparency`, panels become solid.
- **DOM-native accessibility**: keyboard-only + screen-reader pass over **both** surfaces — the quest board (list/grid of labeled card buttons: title + work-mode + why + return-state), the coverage matrix (table/grid with row/column headers + per-cell status text), the timeline (labeled dated markers), the lifecycle (labeled states + the gate checklist as text). Visible `--focus` rings, color-independent cues (icon + text), ≥4.5:1 contrast (WCAG 2.2 AA, UI-FR-013, SC-UI-15). There is **no** opaque canvas.
- **No dark patterns**: confirm there is no countdown/urgency timer, no streak-break threat, no scarcity/FOMO, and no engagement-timed notification; the help affordance is always present and never framed as failure (UI-FR-014/015, SC-UI-14).
- **Client build**: `next build` succeeds; both surfaces mount with zero console errors; audio (if any cue captions) muted by default (SC-UI-13).

## Success criteria mapping

- SC-UI-01 probe-picker view → `probe-picker.test.ts` + walkthrough step 1.
- SC-UI-02 age-band staging → `staging.test.ts` + walkthrough step 9.
- SC-UI-03 voluntary-return delight → `return-delight.test.ts` + walkthrough step 4.
- SC-UI-04 coverage matrix (gaps visible, no score) → `coverage-view.test.ts` + walkthrough step 5.
- SC-UI-05 explanations side-by-side → `explanations.test.ts` + walkthrough step 6.
- SC-UI-06 return timeline (voluntary vs prompted; support never lowers) → `timeline.test.ts` + walkthrough step 7.
- SC-UI-07 lifecycle + gate + shadow-proposal → `lifecycle-view.test.ts` + walkthrough step 8.
- SC-UI-08 motion tokens + reduced-motion equivalents → `motion.test.ts` + walkthrough step 3.
- SC-UI-09 palette/type/domain-hue → `art.test.ts`.
- SC-UI-10 one-view parity → `view.test.ts` (`plainViewEquals`).
- SC-UI-11 structural guardrails (no Math.random / no forbidden field / no fixed-label) → `guardrails.test.ts`.
- SC-UI-12 synthetic-only → `synthetic.test.ts`.
- SC-UI-13 next build + surfaces mount + reduced-motion default → app smoke.
- SC-UI-14 no dark patterns + help non-penalizing → walkthrough + copy review.
- SC-UI-15 WCAG 2.2 AA (keyboard/screen-reader/contrast/focus) → a11y walkthrough.
