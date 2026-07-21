# Quickstart: Interest Lab UI (validation guide)

**Feature**: `003-interest-lab` · **Part II** (UI, **3D pass**) — the child **Curiosity Quest World** (a react-three-fiber 3D world of floating interest islands, with a 2D card-constellation equal/fallback tier) + the guide **Hypothesis Console** on top of the done Part-I pure domain.

How to prove the UI slice works end-to-end once implemented. Implementation lives in [tasks.md](./tasks.md) (P8…P15) / the code itself — this is a run/validation guide only. **Synthetic learners only**; no consent/admissions/legal workflow is needed to run any of this. **No external fetch** (procedural 3D geometry + in-app textures + system fonts).

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
- `resolveMotion` matches the golden motion table (DOM **and** 3D kinds) with a reduced-motion equivalent for every kind;
- `resolveIslandLayout`/`resolveQuestPlacement`/`resolveCamera3D` match the golden 3D positions/framing (§U8.13/§U8.14, ±0.001), catalog-order-derived and deterministic; `buildSceneView` markers mirror the `ProbePickerView` cards by `probeId` (§U8.18);
- `resolveRenderTier`/`resolveQualityTier` match the §U8.16 tier table (full / lite / board-2d) and are presentation-only;
- `buildEvidenceConstellationView` matches §U8.17 (six family stars, voluntary brightest, `domEquivalent:true`, no scalar score);
- `buildInterestLabView` + `plainViewEquals` prove one view drives every surface, tier, and mode (identical underlying state across full-3D / 3D-lite / 2D / plain / reduced / age-band).

## Typecheck & lint

```bash
pnpm typecheck    # tsc -b  (passes for @gt100k/interest-lab-view AFTER the final root-tsconfig reference task
                  #          lands — see tasks.md P15 / U-ROOT; flagged for human reconcile)
pnpm lint         # biome check packages adapters apps  (already covers packages/interest-lab-view & apps/interest-lab)
```

## View it (the two surfaces, UI-US1–US5)

```bash
pnpm --filter @gt100k/interest-lab dev     # apps/interest-lab — the 3D child world + guide console
# then build to validate the acceptance target:
pnpm --filter @gt100k/interest-lab build   # next build
```

**Stack notes**: React `^18.3.1` + Next `^14.2.15` App Router + **`motion ^12`** (`motion/react`, DOM motion) + **`three ^0.169.0` / `@react-three/fiber ^8.17.10` / `@react-three/drei ^9.114.0`** (the 3D world; React-18 line). The r3f `<Canvas>` mounts **client-only** (`next/dynamic`, `ssr:false`) and is `aria-hidden`. The app reads `@gt100k/interest-lab` (domain) + `@gt100k/interest-lab-view` (view) and feeds the Part-I fixtures — **no external fetch** (procedural 3D geometry + in-app textures; fonts are system fallback stacks). No `.env` is required; `apps/interest-lab/.env.local.example` documents the non-secret `NEXT_PUBLIC_*` defaults (incl. `NEXT_PUBLIC_RENDER_TIER=auto`).

**Expected walkthrough** (driven by the synthetic domain fixtures):

1. **Child Curiosity Quest World** (spec §U5.2): on a WebGL-capable device the domain Lab renders as a **dusk archipelago of floating islands** — one per domain, tinted by its **domain hue** — each carrying its offers as **glowing quest-markers**. Islands idle-float; motes drift; the camera performs an establishing **drift-in**. Focusing an island (keyboard arrows / pointer) brings its markers forward, each showing (in DOM) its **work-mode glyph**, difficulty/social/audience cues (icon + text, **color-independent**), a **why it appears** + provenance, and an always-present **help / "a different way"** affordance. There are always **≥2** eligible offers, and **no** island is locked/levelled/ranked.
2. **Explore & pick**: arrow keys / Tab move focus island→island and marker→marker via the DOM **quest ledger** (visible focus); the 3D camera mirrors focus. Pressing a marker gives instant press feedback; selecting it plays a satisfying **hop** into the "my quests" beacon (interruptible). Everything is operable by **keyboard** — the canvas is decorative (`aria-hidden`).
3. `prefers-reduced-motion` / plain mode / no-WebGL: the surface renders the **2D card-constellation board** (`board-2d` tier) — entrances instant/short crossfades, the pick becomes a ≤150ms crossfade, no `scale(0)`, ambient off; **every quest/state is fully conveyed** and identical to the 3D tier (`plainViewEquals`).
4. **"Come back later" delight**: a **voluntary** return (@7/@30) warms the island/marker with a `spark` **bloom** + spark-motes + a gentle camera ease + concrete copy ("You came back to this one") — the only reserved delight, never a fixed label, never guilt/FOMO/countdown/time-gated unlock. In reduced-motion/2D it is a **static warm halo + text**. A **prompted** return recedes (`prompted` tone) with its intervention context on inspect and **no** celebration.
5. **Guide console — coverage matrix** (spec §U5.4): domains (rows) × 9 work-modes (columns); each cell shows its coverage status; **gaps are visible** calm slate cells; a **coverage rail** shows each dimension met / named-gap — the exact Part-I `CoverageMatrix`, with **no** scalar score anywhere. Cells fill with a `motion@^12` stagger (instant under reduced motion).
6. **Competing explanations side-by-side**: the strongest **supporting** evidence beside the strongest **disconfirming** evidence, equal weight, never averaged; uncertainty as an evidence **grade** (thin/moderate/strong) or interval — never a scalar passion score, never "you are an X".
7. **Voluntary-vs-prompted return timeline**: voluntary returns @7/@30 bright and distinct; prompted returns recessed with their context; **assistive/safety events as neutral care-markers that never lower a signal**. The line draws in; markers pop on their day (static under reduced motion).
8. **Lifecycle state visual + authoring**: EXPLORING → EMERGING → CANDIDATE_SPINE → ACTIVE with CONTESTED / PARKED / REOPENED branches; the current state highlighted; the **CANDIDATE_SPINE gate checklist** (from `evaluateCandidateGate`) shows met families and names any missing prerequisite. A rule/model **proposal** renders as a dashed **suggestion** (`operative:false`, "a guide authors the record"); the **guide authors** the operative revision. A version-history rail scrubs revisions (append-only, never overwritten). Optionally, the **evidence constellation** shows the same supporting/disconfirming/family state in 3D depth (`aria-hidden`, DOM-equivalent = steps 6+7, degrades off under reduced-motion / no-WebGL).
9. **Age band**: switching the synthetic learner's band re-renders the child surface (`resolveChildStaging`): 6-8 concrete/story-framed, **no raw numbers**, larger targets, comparison off, celebration capped at medium, ≤3 visible quests, **auto-tour** camera (no free-orbit); 12-14 the full archipelago + filters + focus+orbit + the child's own exploration map (never a score/verdict). The underlying view state is identical across bands.
10. **Tiers & degradation**: on a weak device (or under simulated load) the world steps to **`quest-world-3d-lite`** (fewer motes, no shadows, capped DPR) via `resolveQualityTier` + drei `<PerformanceMonitor>`; on no-WebGL / lost GPU context / `Save-Data` / `deviceMemory<4` it falls to `board-2d`. No quest or state is ever lost; a tier change never blocks a pick.

## Accessibility & performance acceptance

- With `prefers-reduced-motion` (or no WebGL / plain mode) set, verify the surface uses the **`board-2d`** tier and no state/coverage-gap/explanation/timeline/lifecycle/quest is unreachable — entrances instant/crossfade, the pick becomes a crossfade, the timeline a static drawn line, ambient off (UI-FR-010/012/021, SC-UI-08/10/16). With `prefers-reduced-transparency`, panels become solid.
- **DOM-native accessibility, `aria-hidden` canvas**: keyboard-only + screen-reader pass over **both** surfaces via the DOM — the child world's **quest ledger** (ordered labeled card-buttons: title + work-mode + why + return-state; drives focus/pick), the coverage matrix (table/grid with row/column headers + per-cell status text), the timeline (labeled dated markers), the lifecycle (labeled states + the gate checklist as text). The 3D `<Canvas>` is `aria-hidden="true"` and the evidence constellation is decorative with a DOM-equivalent. Visible `--focus` rings, color-independent cues (icon + text), ≥4.5:1 contrast (WCAG 2.2 AA, UI-FR-013, SC-UI-18).
- **No dark patterns / no floating scores**: confirm there is no countdown/urgency timer, streak-break threat, scarcity/FOMO, engagement-timed notification, or **time/mastery-gated island unlock/level-up**, and **no number/score/rank floats in the 3D world**; the help affordance is always present and never framed as failure (UI-FR-014/016/020b, SC-UI-17).
- **Client build + 60fps**: `next build` succeeds; the r3f `<Canvas>` mounts client-only with **zero console/WebGL errors** and destroys on unmount; the world holds ~60fps on a mid device and steps down gracefully under load; audio (cue captions) muted by default (SC-UI-16).

## Success criteria mapping

- SC-UI-01 probe-picker view → `probe-picker.test.ts` + walkthrough step 1.
- SC-UI-02 age-band staging → `staging.test.ts` + walkthrough step 9.
- SC-UI-03 voluntary-return delight → `return-delight.test.ts` + walkthrough step 4.
- SC-UI-04 coverage matrix (gaps visible, no score) → `coverage-view.test.ts` + walkthrough step 5.
- SC-UI-05 explanations side-by-side → `explanations.test.ts` + walkthrough step 6.
- SC-UI-06 return timeline (voluntary vs prompted; support never lowers) → `timeline.test.ts` + walkthrough step 7.
- SC-UI-07 lifecycle + gate + shadow-proposal → `lifecycle-view.test.ts` + walkthrough step 8.
- SC-UI-08 motion tokens + reduced-motion equivalents (DOM + 3D) → `motion.test.ts` + walkthrough step 3.
- SC-UI-09 palette/type/domain-hue → `art.test.ts`.
- SC-UI-10 one-view parity across tiers → `view.test.ts` (`plainViewEquals`) + walkthrough steps 3/10.
- SC-UI-11 structural guardrails (no Math.random / no `three` import / no forbidden field incl. `SceneView` / no fixed-label) → `guardrails.test.ts`.
- SC-UI-12 synthetic-only → `synthetic.test.ts`.
- SC-UI-13 scene view model (island layout / quest placement / camera / marker-card parity) → `scene.test.ts` + walkthrough steps 1–2.
- SC-UI-14 render/quality tiers → `tiers.test.ts` + walkthrough step 10.
- SC-UI-15 evidence constellation → `constellation.test.ts` + walkthrough step 8.
- SC-UI-16 (app) next build + `aria-hidden` client-only canvas + 60fps/degradation + reduced-motion default → app smoke + performance walkthrough.
- SC-UI-17 (app) no dark patterns + no floating score + help non-penalizing → walkthrough + copy review.
- SC-UI-18 (app) WCAG 2.2 AA (keyboard/screen-reader via DOM, `aria-hidden` canvas, contrast/focus) → a11y walkthrough.
