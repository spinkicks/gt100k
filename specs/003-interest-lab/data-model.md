# Phase 1 Data Model: Interest Lab UI (`@gt100k/interest-lab-view`)

**Feature**: `003-interest-lab` · **Part II** (UI) · **Date**: 2026-07-20

All shapes are **render-ready view models** computed by pure functions in `packages/interest-lab-view` — **no I/O, no wall-clock, no `Math.random`**. They are derived from the **Part-I domain outputs** (`Lab`, `CoverageMatrix`, `SignalSummary`, `InterestHypothesis`/`HypothesisRevision`, `evaluateCandidateGate`) — the view layer **never re-computes a learning rule**. Golden values live in [spec.md](./spec.md) **§U8**; this file defines the shapes. **Structural guardrails (D-U4):** no view type carries a `score`/`confidence`/`passionScore`/`verdict`/`label`/`rank`/`percentile`/`outOf`/`price` field.

Types reuse the Part-I `WorkMode`, `Provenance`, `HypothesisState`, `SignalFamily`, `CoverageMatrix`, `SignalSummary`, `HypothesisRevision` from `@gt100k/interest-lab`.

## Constant registries (exported, exact — spec §U8)

- **`PALETTE`** — `Record<string,string>` of the 19 tokens (spec §U8.2). Hex strings only.
- **`TYPOGRAPHY`** — `{ fontDisplay, fontReading, fontBody, scale: Record<Role,{rem,lh,ls,weight?}>, numeric }` (spec §U8.3).
- **`MOTION`** — `Record<MotionName,number>` durations in ms (spec §U8.4).
- **`EASINGS`** — `Record<EasingName,string>` cubic-béziers + `pickSpring:{type,bounce,duration}` (spec §U8.4).
- **`HUE_RAMP`** — `readonly string[]` of 12 curated accent hexes (spec §U8.5).
- **`WORK_MODE_GLYPHS`** — `Record<WorkMode,string>` of 9 glyph ids (spec §U8.6, no emoji).

## AgeBand (enum)

`"6-8" | "9-11" | "12-14"` — the §14.13 bands (identical to Part I's Specialization bands).

## ChildStaging *(derived)* — `resolveChildStaging(band)`

Presentation-only tokens for the child surface (spec §U8.7). The underlying `ProbePickerView` state is identical across bands.

| Field | Type | Notes |
|---|---|---|
| `band` | AgeBand | |
| `showRawNumbers` | boolean | **6-8 false** |
| `comparisonDefault` | `"off" \| "opt-in"` | **6-8 "off"** |
| `labelStyle` | `"story" \| "growth" \| "full"` | copy register |
| `cardScale` | number | 1.25 / 1.1 / 1.0 |
| `touchTargetPx` | int | 56 / 48 / 44 |
| `celebrationCeiling` | `"low" \| "medium" \| "high"` | 6-8 medium |
| `maxVisibleQuests` | `int \| "all"` | 3 / 6 / "all" |
| `showProvenanceDetail` | boolean | 6-8 false (friendly one-liner only) |
| `showExplorationMap` | boolean | 6-8 false |

## MotionToken *(derived)* — `resolveMotion(kind, { reducedMotion })`

| Field | Type | Notes |
|---|---|---|
| `kind` | string | one of the §U8.4 kinds |
| `mode` | `"animated" \| "reduced"` | `reduced` under `prefers-reduced-motion` |
| `durationMs` | int ≥ 0 | animated or reduced column |
| `easing` | string | CSS cubic-bézier or `"linear"` (reduced) or the `pickSpring` name |

Every kind has a reduced-motion equivalent (spec §U8.4). `pick` maps to the one reserved spring; all reveals use `pop` (overshoot ≤1.05, never `scale(0)`).

## ProbeCardView

One quest card, derived from a Part-I `Offer` + the learner's engagement history + band.

| Field | Type | Notes |
|---|---|---|
| `probeId` | string | from the offer |
| `familyId` | string | from the offer |
| `domain` | string | catalog-driven |
| `domainHue` | string | `resolveDomainHue(catalogDomainsInOrder, domain)` (spec §U8.5); decorative only, never a state cue |
| `workMode` | WorkMode | |
| `workModeGlyph` | string | `WORK_MODE_GLYPHS[workMode]` (spec §U8.6) |
| `difficulty` | `"foundational" \| "stretch"` | shown icon+text |
| `social` | `"solo" \| "group"` | shown icon+text |
| `audience` | `"audience" \| "no_audience"` | shown icon+text |
| `provenance` | Provenance | `GUIDE \| RULE \| SHADOW_MODEL` (PASS-001) |
| `whyCopy` | string | band-appropriate reason ("a new kind to try" / "you liked building" / "your guide picked this"); **never a fixed label** |
| `returnState` | `"new" \| "explored" \| "voluntary-return" \| "prompted-return"` | drives the reserved delight |
| `tone` | `"neutral" \| "spark" \| "prompted"` | `spark` for voluntary return; `prompted` recedes |
| `motion` | MotionToken | `cardEnter` normally; `welcomeBack` when `voluntary-return` |
| `label` | string | band-appropriate title (6-8 story sentence, no number) |
| `helpAffordance` | `true` | always present; never a failure; never penalizes (PASS-006) |

**No** `price`/`score`/`rank`/`percentile`/`verdict`/`label:"you are…"` — structurally absent (guardrail).

## ProbePickerView *(derived)* — `buildProbePickerView(lab, { history, band, flags })`

| Field | Type | Notes |
|---|---|---|
| `band` | AgeBand | |
| `staging` | ChildStaging | resolved |
| `quests` | ProbeCardView[] | one per `lab.offers`, offer order |
| `visibleQuests` | ProbeCardView[] | first `staging.maxVisibleQuests` (or all) — presentation only |
| `choicePointsMinEligible` | int ≥ 2 | from the domain Lab (PASS-003) |
| `workModeGlyphs` | `Record<WorkMode,string>` | the fixed map (echoed for the renderer) |
| `exploration` | `{ domainsExplored: int; workModesExplored: int }` | growth-vs-past facts (9+); **never a score** |

`history`: a list of `{ probeId, returnKind: "voluntary" \| "prompted"; horizon?: 7 \| 30; interventionContext?: string }` derived from Part-I events (the app builds it from `EVENTS_GOLDEN_V1` / the domain event stream). Fresh learner → empty → all `returnState:"new"`.

## CellView / DimensionRailItem / CoverageMatrixView *(derived)*

`buildCoverageMatrixView(coverage, offers)` — renders the Part-I `CoverageMatrix` (spec §U8.9). **No** `score`/`confidence` key at any depth.

**CellView**

| Field | Type | Notes |
|---|---|---|
| `domain` | string | row |
| `workMode` | WorkMode | column |
| `status` | `"voluntary" \| "prompted" \| "offered" \| "empty"` | coverage state; `empty` = a visible gap cell |
| `probeId` | string? | for filled cells |
| `provenance` | Provenance? | for offered/explored |
| `whyCopy` | string? | on inspect |

**DimensionRailItem**

| Field | Type | Notes |
|---|---|---|
| `dimension` | `"probeCount" \| "domains" \| "workModes" \| "social" \| "difficulty" \| "audience"` | dimension order |
| `met` | boolean | from `CoverageMatrix` |
| `label` | string | e.g. "Domains 8/6" |
| `detail` | string | e.g. `have` list |
| `gapCopy` | string? | the exact Part-I gap string when `!met` (spec G3) |

**CoverageMatrixView**

| Field | Type | Notes |
|---|---|---|
| `rows` | `{ domain: string; hue: string }[]` | catalog order, hue per §U8.5 |
| `cols` | `{ workMode: WorkMode; glyph: string }[]` | fixed 9, glyph per §U8.6 |
| `cells` | CellView[] | row-major |
| `rail` | DimensionRailItem[] | dimension order |
| `complete` | boolean | from `CoverageMatrix` |
| `gaps` | string[] | exact aggregate gap list (spec G3), **visible** |

## ExplanationCard / ExplanationsView *(derived)*

`buildExplanationsView(revision)` — the strongest supporting beside the strongest disconfirming (spec §U8.12).

**ExplanationCard**

| Field | Type | Notes |
|---|---|---|
| `claim` | string | e.g. "may sustain interest in measuring physical audio systems" (never "is an X") |
| `evidenceRefs` | string[] | from the revision |
| `strength` | `"thin" \| "moderate" \| "strong"` | evidence grade |
| `tone` | string | palette token |

**ExplanationsView**

| Field | Type | Notes |
|---|---|---|
| `supporting` | ExplanationCard | strongest supporting |
| `disconfirming` | ExplanationCard \| null | strongest disconfirming — present whenever `supporting` is (side-by-side invariant) |
| `others` | ExplanationCard[] | remaining competing explanations |
| `uncertainty` | `{ kind:"grade"; grade } \| { kind:"interval"; lo; hi }` | **never** a scalar passion score |

**No** `passionScore`/`score`/`confidence`/`verdict`/`label` key. No card text matches `/you are (a|an|the) /i`.

## MarkerView / ReturnTimelineView *(derived)*

`buildReturnTimelineView(events)` — voluntary vs prompted vs support (spec §U8.10).

**MarkerView**

| Field | Type | Notes |
|---|---|---|
| `eventId` | string | |
| `dayOffset` | int | from the Part-I event |
| `kind` | `"voluntary" \| "prompted" \| "revision" \| "challenge" \| "recovery" \| "scope" \| "artifact" \| "support"` | |
| `horizon` | `7 \| 30`? | for voluntary |
| `tone` | `"tide" \| "spark" \| "prompted" \| "beacon" \| "sprout" \| "support" \| "neutral"` | palette token |
| `interventionContext` | string? | for prompted (e.g. `"reminder"`) |
| `provenanceRecedes` | boolean | `true` for prompted |
| `lowersSignal` | `false` | **always false for `support`** (assistive/safety never lower a signal — PASS-006) |

**ReturnTimelineView**

| Field | Type | Notes |
|---|---|---|
| `axisDays` | `{ min: 0; max: int }` | span |
| `markers` | MarkerView[] | day-ascending, then fixture `ord` |
| `legend` | `{ kind: string; tone: string; note: string }[]` | color-independent legend (icon+text) |
| `motion` | `{ line: MotionToken; marker: MotionToken }` | `timelineDraw` + `markerPop` |

## GateChecklist / LifecycleStateView *(derived)*

`buildLifecycleStateView(currentState, gate, proposal?)` — spec §U8.11.

**GateChecklist**

| Field | Type | Notes |
|---|---|---|
| `eligible` | boolean | from `evaluateCandidateGate` |
| `missing` | string[] | exact Part-I strings (spec G5) |
| `families` | `{ family: SignalFamily; present: boolean }[]` | the six gate families |

**LifecycleStateView**

| Field | Type | Notes |
|---|---|---|
| `states` | `{ id: HypothesisState; track: "main" \| "branch"; tone: string }[]` | main `[EXPLORING,EMERGING,CANDIDATE_SPINE,ACTIVE]`; branch `[CONTESTED,PARKED,REOPENED]` |
| `current` | HypothesisState | highlighted |
| `legalTransitions` | `{ from: HypothesisState; to: HypothesisState }[]` | the Part-I fixed set |
| `gate` | GateChecklist | the CANDIDATE_SPINE gate |
| `proposal` | `{ proposedBy: Provenance; toState: HypothesisState; operative: false; note: string } \| null` | shadow suggestion; `operative` is the literal `false` (IL-011) |
| `authoring` | `{ canAuthor: true; note: string }` | the guide authors the operative revision |

**No path** sets `proposal.operative` to `true` — only a guide-authored revision is operative.

## RevisionHistoryView *(derived)*

`buildRevisionHistoryView(hypothesis)` — append-only, bitemporal (IL-006).

| Field | Type | Notes |
|---|---|---|
| `versions` | `{ version: int; state: HypothesisState; operative: boolean; validFromDayOffset: int; recordedAtDayOffset: int; authored: boolean }[]` | monotonic, never overwritten |
| `currentVersion` | int | highest operative version |

## InterestLabView *(derived, composed — drives both surfaces)*

`buildInterestLabView(inputs)`. The child board, the guide console, and every reduced-motion/plain/age-band rendering render from **this** object (UI-FR-001/019, parity by construction).

| Field | Type | Notes |
|---|---|---|
| `surface` | `"child" \| "guide"` | which surface is active |
| `probePicker` | ProbePickerView | child surface |
| `guide` | `{ coverage: CoverageMatrixView; explanations: ExplanationsView; timeline: ReturnTimelineView; lifecycle: LifecycleStateView; revisionHistory: RevisionHistoryView }` | guide surface |
| `flags` | `{ reducedMotion: boolean; plainMode: boolean; ageBand: AgeBand; surface: "child" \| "guide" }` | render flags |
| `presentation` | `{ palette: typeof PALETTE; typography: typeof TYPOGRAPHY; motionOf: (kind) => MotionToken }` | render-only, derived from flags |

`buildInterestLabView` inputs: `{ lab, coverage, hypothesis, events, gate, proposal?, options }` where `options = { surface, ageBand, reducedMotion, plainMode, history? }`.

`plainViewEquals(a, b)` → boolean: the two views carry **identical** underlying domain-derived state (`probePicker` quests + `returnState`s, `guide.coverage`, `guide.explanations`, `guide.timeline` markers, `guide.lifecycle`+gate, `guide.revisionHistory`) and differ **only** in `flags` + the `presentation` derived from them (UI-FR-019, SC-UI-10). The comparison is over the state fields; `presentation` (motion mode etc.) is *expected* to vary with flags.
