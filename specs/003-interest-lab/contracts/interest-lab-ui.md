# Contract: `@gt100k/interest-lab-view` (Interest Lab UI view layer)

**Feature**: `003-interest-lab` · **Part II** (UI) · builds on the done Part-I domain `@gt100k/interest-lab`.

This slice exposes no HTTP/network API; its "contract" is the public interface of the pure view package. **All functions are pure** over injected domain outputs — no I/O, no wall-clock, **no `Math.random`** (banned in the package). Types reuse the Part-I domain types. Golden values in [spec.md](../spec.md) **§U8**; shapes in [data-model.md](../data-model.md).

## Types

See [data-model.md](../data-model.md) for `AgeBand`, `ChildStaging`, `MotionToken`, `ProbeCardView`, `ProbePickerView`, `CellView`, `DimensionRailItem`, `CoverageMatrixView`, `ExplanationCard`, `ExplanationsView`, `MarkerView`, `ReturnTimelineView`, `GateChecklist`, `LifecycleStateView`, `RevisionHistoryView`, `InterestLabView`, and the constant registries `PALETTE`/`TYPOGRAPHY`/`MOTION`/`EASINGS`/`HUE_RAMP`/`WORK_MODE_GLYPHS`.

## Public functions

```text
resolveMotion(kind, { reducedMotion }) -> MotionToken
  Behavior:  looks up MOTION/EASINGS for `kind` (spec §U8.4); reducedMotion === true ->
             mode "reduced", easing "linear", durationMs from the reduced column.
  Guarantee: pure; every kind has a reduced-motion equivalent; the only spring is `pick`;
             no reveal uses scale(0). MOTION/EASINGS are exact constant maps.

resolveDomainHue(catalogDomainsInOrder, domainId) -> string (hex)
  Behavior:  HUE_RAMP[ catalogDomainsInOrder.indexOf(domainId) % 12 ] (spec §U8.5).
  Precondition:  domainId ∈ catalogDomainsInOrder (throws otherwise).
  Guarantee: catalog-order-derived (no hardcoded domain→hue taxonomy); decorative only, never a state cue.

resolveChildStaging(band) -> ChildStaging
  Behavior:  band -> presentation tokens (spec §U8.7); 6-8 showRawNumbers=false, comparisonDefault="off".
  Guarantee: underlying ProbePickerView state is unchanged across bands; only presentation varies.

buildProbePickerView(lab, { history, band, flags }) -> ProbePickerView
  Behavior:  one ProbeCardView per lab.offers (offer order); each carries provenance + whyCopy +
             domainHue (resolveDomainHue) + workModeGlyph (WORK_MODE_GLYPHS) + difficulty/social/audience +
             an always-present helpAffordance; returnState from history (voluntary @7/@30 -> "voluntary-return"
             + welcomeBack motion + spark tone; prompted -> "prompted-return" + prompted tone, no delight);
             visibleQuests = first staging.maxVisibleQuests.
  Guarantee: preserves the domain Lab's >=2 eligible offers per choice point (PASS-003); NO price/score/rank/
             percentile/verdict field; whyCopy/label never a fixed label ("you are ...").
  Golden:    buildProbePickerView(G1 Lab, {history:[], band:"9-11"}) == spec §U8.8.

buildCoverageMatrixView(coverage, offers) -> CoverageMatrixView
  Behavior:  rows = domains (catalog order, hue per §U8.5); cols = 9 work modes (glyphs §U8.6);
             cells row-major with a visible status (voluntary/prompted/offered/empty); rail = the exact
             Part-I CoverageMatrix per dimension; complete + gaps from CoverageMatrix.
  Guarantee: gaps are VISIBLE fields; NO `score`/`confidence` key at any depth (IL-005).
  Golden:    complete == spec §U8.9 (from G2); gappy == spec §U8.9 (from G3, exact gap strings).

buildExplanationsView(revision) -> ExplanationsView
  Behavior:  supporting = strongest supporting; disconfirming = strongest disconfirming (present whenever
             supporting is); uncertainty = grade|interval from the revision.
  Guarantee: side-by-side invariant holds; NO passionScore/score/verdict/label; no card text matches
             /you are (a|an|the) /i (spec §U8.12).

buildReturnTimelineView(events) -> ReturnTimelineView
  Behavior:  one MarkerView per event, day-ascending; voluntary @7/@30 distinct (tide/spark);
             prompted recessed with interventionContext; assistive/safety -> support markers.
  Guarantee: prompted contributes 0 to voluntary; every `support` marker has lowersSignal:false (PASS-006).
  Golden:    buildReturnTimelineView(EVENTS_GOLDEN_V1) == spec §U8.10.

buildLifecycleStateView(currentState, gate, proposal?) -> LifecycleStateView
  Behavior:  states main+branch with tones; current highlighted; legalTransitions = Part-I fixed set;
             gate = evaluateCandidateGate output as a checklist; proposal (if any) -> operative:false suggestion.
  Guarantee: no field/path sets proposal.operative true — the guide authors the operative revision (IL-011).
  Golden:    gate checklist == spec §U8.11 (G5: competence-only -> missing ["no delayed-discretionary signal"];
             G4 summary -> eligible).

buildRevisionHistoryView(hypothesis) -> RevisionHistoryView
  Behavior:  versions in monotonic order (append-only, never overwritten); currentVersion = highest operative (IL-006).

buildInterestLabView(inputs) -> InterestLabView
  Behavior:  composes probePicker + guide{coverage,explanations,timeline,lifecycle,revisionHistory} + flags +
             a derived presentation block into ONE view that drives both surfaces and every mode.
  Guarantee: reduced-motion/plain/age-band differ ONLY in flags + presentation; underlying state computed once.
```

## Guardrail predicates (helpers, also tested directly)

```text
plainViewEquals(a, b)     — two InterestLabViews carry identical underlying domain-derived state and
                            differ only in flags + presentation (parity by construction).
```

## Contract test obligations (map to UI-FR / SC-UI)

Tests are **written first and must fail** before implementation (constitution: tests define done). Golden values in spec §U8.

**Motion & art (cross-cutting)**
- `resolveMotion`: golden table (spec §U8.4); every kind has a reduced-motion equivalent (`mode:"reduced"`, `easing:"linear"`); the only spring is `pick`; no `scale(0)` reveal (UI-FR-010, SC-UI-08).
- `PALETTE`/`TYPOGRAPHY`: exact tokens (spec §U8.2/§U8.3) with the stated contrast guarantees (`inkHi`/`night` ≥12:1, `inkMuted`/`night` ≥4.5:1, `inkGuide`/`paperGuide` ≥12:1) (UI-FR-011, SC-UI-09).
- `resolveDomainHue`: golden for the 8 seed domains (spec §U8.5); catalog-order-derived; unknown domain throws (UI-FR-020, SC-UI-09).

**Child probe-picker (UI-US1/US2)**
- `resolveChildStaging`: exact band tokens (spec §U8.7); 6-8 `showRawNumbers:false` + `comparisonDefault:"off"`; state identical across bands (UI-FR-005, SC-UI-02).
- `buildProbePickerView`: §U8.8 structural golden — 20 cards, `provenance:"RULE"`, non-empty `whyCopy`, `domainHue`/`workModeGlyph` correct, `returnState:"new"` for a fresh learner, `helpAffordance:true`, `choicePointsMinEligible >= 2`; **no** price/score/rank/percentile/verdict/label field (UI-FR-002/017, SC-UI-01).
- Voluntary-return delight: a voluntary @7/@30 history yields `returnState:"voluntary-return"` + `welcomeBack` motion + `spark` tone with **label-free** copy; a prompted return yields `returnState:"prompted-return"` + `prompted` tone + no delight (UI-FR-004, SC-UI-03).
- No-dark-patterns / help: the view exposes a `helpAffordance:true` on every card and no countdown/scarcity/streak field anywhere (UI-FR-014/015, SC-UI-14 via view + walkthrough).

**Guide console (UI-US3/US4)**
- `buildCoverageMatrixView`: complete (G2) and gappy (G3) goldens (spec §U8.9); gaps visible; **no** `score`/`confidence` key (UI-FR-006, SC-UI-04).
- `buildExplanationsView`: `disconfirming` present whenever `supporting` is; uncertainty grade/interval; no scalar passion score/verdict; no fixed-label text (UI-FR-007, SC-UI-05).
- `buildReturnTimelineView`: §U8.10 golden — voluntary @7/@30 distinct; prompted recedes + carries context; `support` markers `lowersSignal:false` (UI-FR-008, SC-UI-06).
- `buildLifecycleStateView`: §U8.11 golden — gate checklist from `evaluateCandidateGate` (G5); proposal `operative:false`; legal transitions present; no path to operative (UI-FR-009, SC-UI-07).
- `buildRevisionHistoryView`: append-only, monotonic, `currentVersion` highest operative (IL-006).

**Composition & guardrails (cross-cutting)**
- `buildInterestLabView` + `plainViewEquals`: full/plain/reduced/age-band carry identical underlying state, differ only in `flags`+`presentation` (UI-FR-001/019, SC-UI-10).
- Static guardrails: no `Math.random` in `packages/interest-lab-view/src`; no `price|currency|score|confidence|passionScore|rank|percentile|verdict|outOf` field in any view type (grep); no copy generator emits `/you are (a|an|the) /i` (UI-FR-016, SC-UI-11).
- Synthetic-only: the whole view layer runs from the Part-I fixtures with no consent/admissions/legal input (UI-FR-018, SC-UI-12).

**Cross-cutting (app — not view unit tests)**
- `next build` succeeds; both surfaces mount; `prefers-reduced-motion` honored by default; DOM accessible surface present (UI-FR-012/013/018, SC-UI-13).
- WCAG 2.2 AA: keyboard/switch/screen-reader operable, visible `--focus`, color-independent, ≥4.5:1, `prefers-reduced-transparency` → solid — verified via the quickstart a11y walkthrough (UI-FR-013, SC-UI-15).
