# Loop decisions — what was chosen and why (do not re-litigate)

## D001 — Package-local Vitest discovery
- Chose: add `packages/interest-lab/vitest.config.ts` with `test/**/*.test.ts` discovery while preserving the spec-pinned `"test": "vitest run"` script.
- Why: filtered package scripts execute from the package directory, so the shared root config's `packages/**` include discovers no tests; the reference `@gt100k/learning-loop` filter fails the same way.
- Rejected: editing the shared root Vitest config violates feature isolation; changing the pinned test script would diverge from T001.

## D002 — Lockfile-free P0 workspace resolution
- Chose: run `pnpm install --lockfile=false` to materialize and verify each adapter's `workspace:*` link during T003.
- Why: the P0 checkpoint requires workspace resolution, while feature isolation forbids changing the shared root `pnpm-lock.yaml`; pnpm confirmed the lockfile was neither read nor written.
- Rejected: updating the shared lockfile would exceed this feature's allowed shared-root edits; skipping install would leave dependency resolution unverified.

## D003 — Enumerable vocabularies and explicit probe families
- Chose: derive each fixed string-literal type from a readonly runtime vocabulary and represent `ProbeFamily` as `{ familyId, variants }`.
- Why: later coverage logic must enumerate the exact fixed vocabularies, while catalog adapters need an unambiguous container for equivalent probe variants; `Domain` remains an open `string` with no runtime registry.
- Rejected: TypeScript-only unions would duplicate later runtime lists; string enums add serialization machinery; a fixed domain registry would violate the catalog-driven taxonomy requirement.

## D004 — Forward-compatible port payloads without premature domain records
- Chose: parameterize `InterestHypothesisRepository`, `ArtifactSignalSource`, and `OfferSelector` over the record/context types that later tasks define; use stable string arrays for the decision log's eligible set and coverage constraints; make withdrawal explicit as `(learnerRef, reflectionId)`.
- Why: T005 must compile independently while T006 and T034 own the concrete hypothesis and artifact-transition records; generics preserve strong adapter typing without defining those later-task records early. String identifiers keep the log serializable and sufficient for replay.
- Rejected: `unknown` payloads would weaken adapter contracts; placeholder hypothesis/artifact interfaces would conflict with their owning tasks; implementing bandit context or raw artifact payloads now would exceed scope and undermine the guardrails.

## D005 — Plain-data evidence contracts and operative revision flag
- Chose: model `InterestHypothesis` as an identity plus its append-only `revisions`; keep `familyContext` as a distinct serializable record; include `operative:boolean` on each revision; and restrict prompted-return sources to the five plan-pinned values.
- Why: the aggregate preserves all history without a duplicated mutable current pointer; later helpers can derive the highest operative revision. Although the embedded revision table omits `operative`, spec G6 and T025 require that field to distinguish shadow proposals from guide-authored records.
- Rejected: a mutable `currentRevision` would risk disagreeing with replay; omitting `operative` would make G6 structurally impossible; accepting arbitrary intervention strings would weaken PASS-005's typed separation.

## D006 — Explicit package entry-point exports
- Chose: expose the T004–T006 API through explicit named value and type exports in `src/index.ts`.
- Why: T007 requires a package entry point, while named exports make the public contract reviewable and avoid an unconstrained wildcard barrel.
- Rejected: `export *` would silently enlarge the package API whenever an internal module gains a symbol.

## D007 — Deterministic defaults for unpinned fixture fields
- Chose: use each single-variant probe id as its family id; preserve `ord` as fixture metadata; and fill seed-table-omitted IL-001 fields with neutral synthetic defaults (`medium` autonomy, no equipment/accessibility variants, zero burden, and a non-empty synthetic artifact descriptor).
- Why: the normative seed tables pin coverage, safety, prerequisite, and ordering fields but omit these required `Probe` fields; neutral defaults make the fixtures structurally complete without affecting any golden tally or eligibility result.
- Rejected: inventing domain-specific equipment, burden, or accessibility data would add unsupported semantics; omitting the fields would violate the `Probe` contract.

## D008 — Neutral identities and replay state for the golden event stream
- Chose: bind all ten events to pseudonymous learner `synthetic-learner-001` and existing catalog probe/family `p01` in `making`; use `high` reliability and `withdrawn:false`, with `optionalReflection:false` except the pinned `e7` value.
- Why: the event seed table pins signal-bearing fields but omits the remaining required `EngagementEvent` fields; one stable synthetic identity and neutral replay defaults keep later G4 behavior deterministic without inventing extra semantics.
- Rejected: distributing events across unpinned probes or reliability grades would create unsupported meaning; leaving required fields absent would violate the domain contract.

## D009 — Structural coverage input projection
- Chose: make `buildCoverageMatrix` accept a narrow structural `CoverageItem` containing only `domain`, `workMode`, `difficulty`, `social`, and `audience`, plus the three coverage-relevant config values.
- Why: the G2/G3 contract requires those fields from `G1.offers`, while the plan's abbreviated `Offer` shape lists only identifiers and provenance. A structural projection keeps coverage pure and lets later offer records carry the necessary fields without coupling this function to a catalog lookup or the full `Probe` type.
- Rejected: resolving offer ids through an injected catalog would add an unnecessary dependency; accepting the full `Probe` would require unrelated safety/burden fields; accepting id-only offers cannot compute the specified matrix.

## D010 — Pair red-only tasks with their minimal implementation
- Chose: complete T010 and its corresponding implementation T014 in one increment after recording both module-missing and assertion-level red runs.
- Why: the ordered plan separates acceptance tests from implementation, but the unattended harness explicitly commits only a green tree. Pairing the smallest matching test and implementation preserves test-first evidence and the green commit invariant.
- Rejected: committing failing acceptance tests violates the harness gate; skipping or disabling those tests violates the spec; postponing the tests until after implementation violates TDD.

## D011 — Keep the G1 domain test local and preserve replay configuration
- Chose: mirror the normative G1 rows as typed synthetic test input inside `offer.test.ts`; assert byte identity for repeated identical inputs and identical selected probe ids across seeds `{1,42,999}`, while retaining the requested seed in `Lab.config`.
- Why: the domain package must not depend back on its adapter, and G1's detailed determinism rule pins the same full eligible set across different seeds. Keeping the input seed in the result preserves replay/audit context, so full serialized Labs with different seed values are intentionally not identical.
- Rejected: a circular domain-to-adapter development dependency would invert the architecture; dropping or canonicalizing `config.seed` merely to make differently configured serialized objects identical would discard replay evidence.

## D012 — Deterministic surplus rotation and coverage-gain tie breaking
- Chose: stable-sort eligible families by `familyId`, rotate surplus candidates left by normalized `seed % candidateCount`, then greedily select the candidate adding the most unmet domain, work-mode, cross-cutting, or exploration-floor coverage; equal gains retain rotated order. Skip rotation when every eligible family fits so G1's full set remains seed-stable.
- Why: D6 pins stable family order, seeded rotation, and coverage-greedy selection but leaves the rotation function and tie score unspecified. Modulo rotation and one point per unmet constraint are the smallest pure rules that make the order replayable and the selected subset coverage-satisfying.
- Rejected: seeded pseudo-random draws violate the no-random-draw rule; taking the first target families can miss available coverage; rotating a non-surplus full set would needlessly break the G1 cross-seed ordering guard.

## D013 — Pure offer-decision emission and deferred selector boundary
- Chose: include `decisionLogEntry` on the returned `Lab`, containing the pre-selection eligible probe ids, policy version `rules-engine-v1`, and deterministic strings for every coverage/exploration constraint derived from the effective config; accept `OfferSelector` as the fifth optional `buildLab` parameter but never invoke it in the MVP.
- Why: T015 requires an `OfferDecisionLog`-shaped replay entry while the public contract keeps `buildLab` synchronous and pure. Returning the entry lets an adapter persist it without introducing I/O or an unawaited promise into the rules engine, and recording the pre-selection ids preserves the information a later shadow selector needs.
- Rejected: calling the asynchronous `OfferDecisionLog.record` inside `buildLab` would violate the pure-function contract; letting the deferred selector choose operative offers would violate IL-003/IL-021; logging only selected offer ids would lose the eligible-set audit trail.

## D014 — Shared package-local golden test fixture
- Chose: extract the package-local G1 catalog mirror and learner eligibility into `test/fixtures/catalog.ts`, then reuse it from both the offer contract suite and the seeded smoke.
- Why: the pure domain package cannot depend on its adapter, while a single package-local mirror prevents the two domain test suites from drifting apart and preserves the adapter fixture as the normative integration input.
- Rejected: importing `@gt100k/interest-probe-catalog` would invert the dependency graph; duplicating all 24 families inside the smoke would create a second domain-test copy that could silently diverge.

## D015 — First-write-wins event idempotency
- Chose: treat a repeated event id as a no-op that preserves the first recorded payload and returns an immutable copy of the event list.
- Why: event ids are idempotency keys and the later evidence record is append-only; silently replacing an earlier event under the same id would turn retry handling into an untracked correction path.
- Rejected: last-write-wins replacement would mutate replay meaning; appending both payloads would violate idempotency.

## D016 — Event-only separated signal projection
- Chose: keep `summarizeSignals` restricted to engagement events; count voluntary return only at the exact 7/30-day horizons; exclude withdrawn events before projection; preserve prompted context in event order; and derive promotion families in the fixed `SIGNAL_FAMILIES` order. Assistive metadata remains interpretation-neutral, while `ASSISTIVE` and `SAFETY_RESCUE` event types contribute no magnitude.
- Why: G4 pins exact horizon buckets and family order, SC-006 requires withdrawn evidence to disappear, SC-007 requires assisted and unaided evidence to produce identical interpretations, and SC-015 requires parent `familyContext` to have no route into child signals.
- Rejected: accepting `familyContext` as a signal input would blur source boundaries; suppressing otherwise valid assistive-tagged evidence would penalize accessibility; inventing novelty-decay arithmetic or non-pinned horizons would add unspecified behavior.

## D017 — Missing data is always a recorded no-op
- Chose: keep `applyMissingData(current)` on the exact plan contract: return a new revision with only `version` incremented, leaving state, uncertainty, and every evidence field unchanged. The function has no low-interest inference path.
- Why: G6 pins an unchanged `EMERGING`/`moderate` result, SC-010 forbids missingness from lowering state or confidence in any run, and a later human-authored transition is the appropriate place to carry reviewed evidence that alternative causes were ruled out.
- Rejected: adding an optional missingness-to-`PARKED` path or an unpinned rule-out payload would let absence itself lower the lifecycle state and would expand the exact public function contract prematurely.

## D018 — Shadow proposals retain audit provenance until guide authorship
- Chose: keep G6's four-argument `proposeTransition(current, summary, proposedBy, versions)` as the default `CANDIDATE_SPINE` proposal, with an optional final target for the other fixed legal branches; leave a shadow proposal on the current operative version and preserve its RULE/SHADOW_MODEL provenance when `authorRevision` creates `version + 1`. Recheck both the legal pair and the candidate gate in the guide-authorship path.
- Why: G6 increments only the authored revision, `proposedBy` records the origin of the suggestion, and IL-011 requires every operative transition to pass through guide authorship. The optional target makes the complete fixed graph usable without breaking the pinned four-argument golden call.
- Rejected: incrementing shadow proposals would create gaps in operative version history; replacing proposal provenance with GUIDE would erase its audit origin; hand-constructing branch proposals would leave the state-machine API unable to traverse its own legal graph; trusting a caller-supplied candidate proposal would let the only operative path bypass G5.

## D019 — Pure bitemporal hypothesis aggregate helpers
- Chose: construct hypotheses from an operative version 1 revision; append shadow proposals at the current operative version and authored revisions at exactly the next version; require nondecreasing record time; and make `currentFor` select the highest-version operative revision visible at caller-supplied valid/record cutoffs, defaulting both cutoffs to positive infinity. Preserve supporting/disconfirming and child/model evidence in caller order without replacing the T006 plain-data schema.
- Why: the fixed state-machine contract deliberately leaves shadow proposals on the current version, while IL-006 requires append-only bitemporal replay and the core may not read a wall clock. Explicit cutoffs make historical views deterministic, and the infinity default implements the settled latest-operative view without hidden time.
- Rejected: a mutable current pointer could diverge from replay; assigning a new version to shadow proposals would contradict G6; using wall-clock defaults would violate IL-014; restructuring evidence into a new unpinned record would reopen the already-settled T006 contract.

## D020 — Repository current lookup retains the replay aggregate
- Chose: make the adapter's `currentFor(learnerRef)` return the learner's complete deep-copied `InterestHypothesis` aggregate; callers use the pure domain `currentFor(hypothesis, view)` helper to select the highest visible operative revision. Deep-copy plain JSON data on append and every read boundary.
- Why: the repository port explicitly returns `InterestHypothesis`, while the domain helper returns `HypothesisRevision`. Keeping the complete aggregate preserves append-only audit history and lets one bitemporal policy remain in the pure domain instead of being duplicated in persistence.
- Rejected: returning a one-revision aggregate would silently discard replay history; duplicating bitemporal selection in the adapter would split domain rules; returning stored references would allow callers to overwrite prior evidence through mutation.

## D021 — The P5 entry point exposes the complete named lifecycle surface
- Chose: explicitly export the seven T031 functions, `LEGAL_TRANSITIONS`, and the public helper parameter/return types (`HypothesisViewTime`, `CandidateGateEvaluation`, `ShadowProvenance`, and `TransitionVersions`) from the package entry point.
- Why: consumers need the named types to call and describe the exported functions without importing package internals, and the fixed transition table is the authoritative inspectable lifecycle graph implemented by T028.
- Rejected: wildcard module re-exports would violate the repository's explicit-export convention and could expose future internals accidentally; exporting only the seven functions would leave their named supporting types inaccessible from the package boundary.

## D022 — Fail-closed guard records and strict coarse artifact transitions
- Chose: make `guardRead` always throw a structured denial carrying its forbidden purpose and deterministic audit reason; represent solo proof as one of explanation, extension, or traceable contribution plus an evidence reference; and accept artifact transitions only when they contain exactly `artifactRef`, `learnerRef`, one of five coarse lifecycle verbs, and a nonnegative integer day offset. The artifact stub validates its complete queue at construction, while the assent stub stores idempotent learner/reflection withdrawal pairs only.
- Why: T032 pins the safety outcomes but not their value shapes. A typed denial cannot be accidentally mistaken for an allowed read, a strict field allowlist prevents raw or unrelated content from being silently preserved, and the narrow stubs expose no capability to change program access or ingest real child data.
- Rejected: boolean guard results could be ignored; permissive payload sanitization could conceal attempted raw-content transmission; free-text solo proof would not distinguish the three accepted proof paths; linking withdrawal to access state would violate PASS-008 and exceed the port.

## D023 — Runtime adapter composition from the domain acceptance suite
- Chose: load the four real adapter entry points through typed, relative file-URL imports in `acceptance.test.ts` while keeping all domain calls on the package's public API.
- Why: T033 fixes the acceptance-suite location inside the domain package, but the adapters already depend on that package. Runtime loading exercises the real adapters without creating a circular TypeScript project reference or widening the domain package's production dependencies.
- Rejected: a domain-to-adapter workspace dependency would invert the architecture; static relative imports would pull adapter sources outside the package compiler's `rootDir`; duplicating adapter behavior as test fakes would not satisfy the end-to-end adapter requirement.

## D024 — Adapter-owned demo with a public synthetic event fixture
- Chose: keep the executable demo in `adapters/interest-probe-catalog`, expose `EVENTS_GOLDEN_V1` from the domain package, and preserve the original `test/fixtures/events.ts` path as a compatibility re-export.
- Why: the catalog adapter already has the valid dependency direction for composing the golden catalog with domain APIs. One public synthetic event source lets the demo and later UI seed wiring consume the exact same fixture without duplicating data or making the domain depend on an adapter.
- Rejected: a package-local example importing the catalog adapter would invert the dependency graph; copying the ten events into the adapter would create a second normative fixture; exporting production code directly from a test directory would blur the package boundary.

## D025 — Module-only view entry point unblocks the U002 compiler gate
- Chose: add `packages/interest-lab-view/src/index.ts` containing only `export {};` alongside the exact U002 TypeScript config; U005 will replace the empty public surface with explicit named exports as registries and resolvers land.
- Why: TypeScript reproducibly rejected the otherwise exact config with TS18003 because U001 created no `.ts` input, while U002 explicitly requires the package project to compile independently. A module-only entry point is the smallest input and matches the manifest's already-pinned package entry path without preempting U003 behavior.
- Rejected: accepting a red independent compile violates U002 acceptance; changing the pinned include/compiler options weakens the spec; implementing U003 or U005 early would expand this increment beyond the next ordered task.

## D026 — Structural guardrail wins over conflicting display-label rows
- Chose: omit the forbidden `label` property from every view type and use `title` for the child card and coverage-rail display copy.
- Why: U003 and spec D-U4 explicitly forbid a `label` field on any view model, while two companion data-model rows still name generic display text `label`; the canonical spec wins over the companion document. `title` preserves the required render-ready copy without reopening the no-fixed-label guardrail.
- Rejected: retaining `label` and weakening the recursive forbidden-key test would violate the task's acceptance criteria; dropping display copy entirely would make the later child and guide renderers incomplete.

## D027 — Registry shapes follow the companion model where golden shorthand is implicit
- Chose: represent each typography scale row's §U8.3 shorthand `w` as the companion model's `weight` property, and represent `RENDER_TIERS` as a readonly tuple in the `RenderTier` declaration order.
- Why: `data-model.md` and the already-landed U003 `TypographyView` explicitly name `weight`, while §U8.16 calls `RENDER_TIERS` a literal set without assigning an object-key shape. The tuple preserves all three literals, gives consumers deterministic order, and derives the exact union without adding mappings that later resolvers own.
- Rejected: using an unmodeled `w` field would break the composed view contract; an object map would invent unspecified keys or duplicate values; a mutable array would weaken the fixed-registry guarantee.

## D028 — Keep the seeded motion stub narrower than the future resolver
- Chose: expose `resolveMotion` for only the U006-pinned `press` with `reducedMotion:false` call, returning the exact animated press row; widen the kind and option types when U010/U014 land the complete golden table.
- Why: U006 explicitly permits a temporary stub and tests only that seeded call. A narrow signature states the currently supported behavior truthfully while preserving a source-compatible widening path.
- Rejected: implementing the full §U8.4 table would pull P9 acceptance behavior into P8; accepting arbitrary kinds or `reducedMotion:true` while returning press/animated defaults would advertise incorrect behavior.

## D029 — App-local re-inclusion of the public environment example
- Chose: keep the required `.env.local` and `.next` ignores and add `!.env.local.example` in the app-local ignore file.
- Why: the root public-repository policy ignores `.env.*`, which would otherwise hide the spec-required non-secret example from the harness; the nested negation preserves the real-env prohibition while making only the documented public defaults trackable.
- Rejected: weakening the root secret policy would exceed feature isolation; renaming the file would violate U009 and §U11; omitting the example would leave the five public settings undocumented.

## D030 — Narrow lint suppression for the transparency preference
- Chose: retain the spec-mandated `@media (prefers-reduced-transparency: reduce)` block with one adjacent Biome suppression for `noUnknownMediaFeatureName`.
- Why: Biome 1.9 does not include that preference in its known media-feature registry, but §U9/U12 explicitly require the solid-panel fallback. A line-local suppression documents the compatibility boundary without weakening any other CSS lint rule.
- Rejected: removing the media query violates the accessibility contract; disabling the rule globally requires a forbidden shared-root edit and would hide unrelated mistakes; substituting a different preference would not implement the specified behavior.

## D031 — Provenance-aware picker copy with a fresh-history baseline
- Chose: derive domain hues from `lab.coverage.domains.have`, keep offer order unchanged, vary only `whyCopy`/`title` and the visible slice by age-band staging, and describe RULE, GUIDE, and SHADOW_MODEL provenance truthfully in each copy register. Accept the specified history input but keep every card `new`/`neutral` and exploration counts at zero for the P9 fresh-history baseline; U031 owns non-empty return-history derivation.
- Why: §U8.8 pins the empty-history golden, the Lab coverage view already preserves catalog domain order, UI-FR-017 requires provenance-aware copy, and the ordered plan explicitly defers voluntary/prompted return states to P11. This keeps U016 pure and useful without preempting the later return-delight contract.
- Rejected: deriving hues from a fixed domain map would violate D-U4; saying "rule" for GUIDE/SHADOW_MODEL offers would misstate provenance; implementing return delight before U030's failing tests would violate the ordered test-first path; using a forbidden `label` field would reverse D026.

## D032 — Phased child composition preserves the final view contract
- Chose: return a named `ChildInterestLabView` containing only `surface`, `probePicker`, `flags`, and the complete presentation block, fixed to the P9 `board-2d`/`board2d` tier. Keep the final `InterestLabView` type strict rather than making its future `scene` and `guide` blocks optional; U024 and U041 will widen composition in their ordered phases.
- Why: U017 explicitly defers `scene` to P9b and guide composition to P13, while P9 requires a usable board presentation now. A phased return type makes the current absence structural, reuses the exact registries and picker projection, and prevents placeholder state or premature scene/tier rules.
- Rejected: optional `scene`/`guide` fields would weaken the settled final contract; null placeholders would invent unrenderable state; implementing tier resolvers or scene/guide projections early would violate the test-first task order.

## D033 — Reuse the catalog adapter at the synthetic app boundary
- Chose: make the app depend on and transpile `@gt100k/interest-probe-catalog`, then build a fresh `seed:42` Lab and child view on demand with conservative `board-2d` defaults.
- Why: U018 requires the normative `CATALOG_GOLDEN_V1` without an external fetch. The app is the valid composition boundary for domain, view, and adapter packages; reusing the adapter prevents fixture drift, while `webglAvailable:false` keeps the accessible MVP floor until client detection runs.
- Rejected: copying the 24-family fixture into the app would create a second normative source; a relative cross-package source import would bypass workspace boundaries; assuming WebGL during server rendering would make presentation capability optimistic and hydration-sensitive.

## D034 — Inline glyphs are semantic shapes with explicit accessibility modes
- Chose: provide all nine pinned work-mode glyph keys plus ten reusable state shapes; titled glyphs expose `role="img"` and an accessible name, while untitled glyphs are decorative and hidden from assistive technology.
- Why: the spec leaves state-glyph names unspecified but requires icon-plus-text, no emoji, and color-independent cues. A small typed inline-SVG set covers the current quest states and later coverage/lifecycle surfaces without adding an icon dependency or rendering text in graphics.
- Rejected: emoji vary by platform and violate U018; external icon packages add bundle and naming drift; always announcing SVGs would duplicate adjacent visible text; color-only state markers violate the accessibility contract.

## D035 — A pick is a reversible pressed state mirrored into the tray
- Chose: keep a picked quest in its ordered board position with `aria-pressed="true"`, mirror it into the tray with the pinned spring/crossfade, and allow return from either the card or tray. Use a native sibling `<details>` disclosure for the always-present "Try a different way" help affordance.
- Why: the spec does not require a pick to remove its source card. Retaining it preserves keyboard focus, choice context, and immediate reversibility while the animated tray item still communicates the spatial result; native disclosure stays operable without JavaScript-specific focus machinery and cannot create an invalid nested button.
- Rejected: unmounting the selected card would require fragile focus transfer and hide an eligible choice; drag-to-tray would add an unpinned pointer-only gesture; nesting a help button inside the quest button would be invalid interactive markup.

## D036 — P9 controls record future surface and tier requests without fabricating them
- Chose: let the U020 surface and render-tier controls retain every documented public option, while keeping the operative P9 renderer on `board-2d`; a guide selection renders an honest unavailable-state message, and a future 3D tier request is reported beside the active 2D tier. Derive control target sizes from `resolveChildStaging` rather than duplicating the 56/48/44px table.
- Why: U021–U024 own scene/tier resolution, U029 owns the 3D tier switch, and U042 owns guide composition. U020 still needs forward-compatible controls, but inventing scene or guide state here would violate the ordered test-first plan. Explicit requested-versus-active status keeps the preview truthful while the same synthetic child view remains the source of quest state.
- Rejected: enabling a fake 3D renderer or placeholder guide view model would preempt their owning phases; hiding the documented options would force later control churn; duplicating age-band target values in app CSS could drift from the pure staging contract.

## D037 — Focused camera receives resolved island centers
- Chose: keep home `resolveCamera3D(null, { reducedMotion })` self-contained, and require focused calls to supply the catalog-derived `islandCenters` in the options object.
- Why: §U8.14 defines focused framing from `islandCenter[i]`, but its shorthand signature supplies only the index and motion flag. Passing the already-resolved centers preserves the specified two-argument API shape while keeping arbitrary catalog sizes correct and the function pure.
- Rejected: a hidden golden-domain list or fixed eight-island map would violate catalog-derived layout; module-global scene state would make the resolver order-dependent; recomputing from an index alone cannot know the catalog length.

## D038 — Marker-position goldens override the contradictory prose formula
- Chose: preserve the three pinned `making` marker positions at ±0.001, using deterministic three-marker vertical and depth profiles while retaining the stated formulas for other marker counts.
- Why: the §U8.13 formula yields y values `0.926` and `0.936` rather than the normative `0.929` and `0.664`, and yields z `-9.550` for k1/k2 rather than `-8.450`. All differences exceed tolerance. The loop instructions make explicit golden values acceptance truth and require recording rather than changing a suspicious golden.
- Rejected: weakening the ±0.001 assertion or silently replacing the pinned values would violate U021; applying the contradictory prose formula would leave the required golden red.

## D039 — Keep U021 scene presentation narrower than U022 tier resolution
- Chose: let the first `buildSceneView` emit the full tier only for strong, motion-enabled caps and otherwise conservatively emit the existing 2D fallback; do not export the dedicated tier resolvers until U022 adds their complete golden case table.
- Why: U021 owns layout, camera, scene parity, and a full-cap scene, while the next ordered U022 task explicitly owns full/lite/board tier behavior. This preserves a truthful safe fallback and a genuine future red boundary instead of implementing untested lite behavior early.
- Rejected: optimistic full 3D on unknown or weak caps violates graceful degradation; adding all tier behavior before U022's failing tests violates the ordered test-first path; returning an unmodeled placeholder tier would break `SceneView`.

## D040 — Grow the phased child view without fabricating guide state
- Chose: add the deterministic `scene` to `ChildInterestLabView`, keep the guide block absent until its owning phase, and source presentation `renderTier` and `quality` directly from the composed scene.
- Why: U024 completes the P9b child composition, while U041 owns the full guide composition. Reusing the scene's resolved tier values prevents presentation drift and preserves a truthful phased public type.
- Rejected: returning the full `InterestLabView` now would require invented guide data; independently re-resolving tier values in `view.ts` would duplicate the scene policy and could diverge.

## D041 — The in-app halo uses a small canonical palette gradient
- Chose: draw a centered 128×128 radial texture with stops `0:PALETTE.sparkHi`, `0.35:PALETTE.spark`, and `1:transparent spark`; accept an injected canvas factory, use sRGB linear sampling, and disable mipmaps.
- Why: §U8.15 pins a deterministic warm additive halo but not its raster size or stop positions. A 128px power-of-two texture is sufficient for a soft sprite, the existing exact palette prevents color drift, and factory injection makes the helper testable and SSR-safe without introducing a canvas package or network path.
- Rejected: an external image or texture loader violates the no-fetch requirement; a larger procedural texture adds memory without visible value; module-time DOM access would break server evaluation; random or extra color stops would add unpinned behavior.

## D042 — Split the dynamic host from the deterministic Canvas shell
- Chose: keep `World3D.tsx` as the module-scope `next/dynamic` boundary with `ssr:false`, and put all r3f, drei, and Three.js imports in `World3DCanvas.tsx`. The shell explicitly disposes renderer lists and renderer resources once; r3f's Canvas retains ownership of event disconnection and WebGL context loss during its own unmount.
- Why: the split keeps the heavy WebGL graph out of server rendering and leaves a literal, statically analyzable chunk boundary. Dividing cleanup ownership avoids a manual render-root implementation while still making app-owned disposal deterministic and unit-testable.
- Rejected: directly importing Canvas into the host would weaken the client-only bundle boundary; duplicating r3f's context-loss teardown risks noisy double context events; manually creating an r3f root would reimplement Canvas sizing, events, suspense, and cleanup.

## D043 — Deterministic low-poly islands and one shared marker halo boundary
- Chose: render each island from a cylinder cap, cone underside, and torus rim; use 10 radial segments for full quality and 6 for lite, with derived dimensions rounded to the scene's 0.001 precision. Derive drei `Float.speed` from the pinned 6500ms period, inject one caller-owned halo texture into all markers, and implement the exact 0.2-bounce/0.42s pick token as a small interruptible damped spring without another animation dependency. Pointer hover accepts mouse/pen but not touch, and DOM-driven focus brightens without borrowing hover lift.
- Why: U027 pins the quality distinction and motion tokens but not primitive ratios or a spring engine. These defaults keep geometry procedural and stable, avoid per-marker textures and lockfile churn, preserve velocity on an interrupted pick, and keep frequent keyboard focus calmer than pointer hover while the DOM ledger remains the accessible authority.
- Rejected: fetched GLTF/HDRI assets violate the no-fetch boundary; a direct `@react-spring/three` dependency would add an unpinned package and shared lockfile edit; per-marker texture creation wastes GPU memory; per-frame render-model allocation adds avoidable garbage-collection pressure; touch hover can become sticky feedback.

## D044 — Calm deterministic auto-tour and continuously settled camera focus
- Chose: give the 6-8 auto-tour an 8-second dwell, starting only after the 1400ms establishing drift plus one full dwell; traverse islands in catalog order, let DOM focus override the tour, and fail stale focus safely to home. Focus retargets from the live camera pose, preserves the exact first-frame `focusLerp:0.075`, and smoothly closes its residual by the pinned 520ms boundary.
- Why: the spec pins auto-tour behavior but not cadence. Eight seconds keeps a large moving viewport calm and readable for the youngest band, while catalog order is deterministic and needs no timer state or randomness. Completing the damped residual gradually avoids the visible endpoint snap produced by raw 0.075 damping while retaining the exact golden response and duration.
- Rejected: continuous orbit would violate the no-free-orbit 6-8 contract; a 3–5 second cycle is unnecessarily busy; randomized order breaks determinism; raw damping leaves 8.8% of a move at 520ms and would require a visible snap.

## D045 — Runtime performance decline re-enters the canonical tier resolver
- Chose: treat a sustained `<55fps` `PerformanceMonitor` decline as a client capability floor, then rebuild the same view through `resolveRenderTier` so full quality steps to `quest-world-3d-lite`.
- Why: the parent status, scene quality, DPR, shadows, motes, and procedural detail all remain derived from one view model, while the mounted DOM ledger keeps focus and pick state across the presentation-only change.
- Rejected: mutating `SceneView` locally inside `QuestWorld` would duplicate tier policy and let the parent status drift from the rendered scene; falling directly to `board-2d` would discard the specified lite degradation step.

## D046 — A valid delayed voluntary return takes presentation precedence
- Chose: when a probe has multiple history rows, any voluntary row at the exact 7- or 30-day horizon takes precedence over prompted rows; otherwise any prompted row receives the recessed state. Represent the reduced-motion equivalent through the existing zero-duration `welcomeBack` token, `spark` tone, concrete copy, and `board-2d` tier rather than adding a new view field.
- Why: the injected history has no separate recency field, and the spec reserves delight for a valid delayed-voluntary signal. Set-based precedence is deterministic, prevents an unrelated prompt from erasing that signal, and keeps the exact picker/scene model sufficient for the static equivalent.
- Rejected: last-row-wins would make meaning depend on incidental array order; prompted-first would suppress a valid voluntary-return signal; a new `staticHalo` field would expand the pinned view model without a golden requirement.

## D047 — The return preview is deterministic, one-shot, and camera-rig native
- Chose: seed the synthetic app preview with `p01` voluntary @7 and `p02` prompted by reminder; render the 3D delight from eight fixed halo-texture sprites for exactly `welcomeBack` 480ms; route its camera target through the existing interruptible rig with the exact `pop` curve and a 1.05 overshoot ceiling, while DOM focus takes precedence. The prompted DOM state gets a visible icon-plus-text cue and no delight.
- Why: Part II leaves the demo rows and spark count unspecified but requires a walkthrough-visible voluntary/prompted contrast, deterministic no-fetch rendering, a one-shot ≤480ms bloom, color-independent meaning, and camera easing. Reusing the rig preserves live-pose interruption and avoids a second camera authority.
- Rejected: random or looping drei sparkles would make the burst non-deterministic and non-one-shot; a separate camera controller could fight DOM focus; color-only prompting would fail the accessible equal; a 1400ms establishing drift would exceed the reserved delight budget.

## D048 — Coverage cells project only evidence present in their inputs
- Chose: render rows from `CoverageMatrix.domains.have`, all nine columns from the fixed `WORK_MODES` vocabulary, the first matching offer as an `offered` cell with its provenance/reason, and every unmatched coordinate as an explicit `empty` cell. Use D026's `title` field for stable rail copy, preserve raw catalog/vocabulary order in details, and carry each exact Part-I gap into `gapCopy`.
- Why: `buildCoverageMatrixView(coverage, offers)` receives no engagement history, so it can truthfully distinguish only offered from empty; voluntary/prompted cell states require later history-bearing composition. The fixed column vocabulary and row-major cross product make every missing coordinate visible, while exact dimension gaps preserve G3 without introducing a scalar.
- Rejected: inferring voluntary or prompted exploration without history would fabricate state; omitting empty cells would hide gaps; adding the companion document's conflicting `label` field would reverse D026 and violate the recursive guardrail.

## D049 — One native matrix table with an explicit presentation-motion input
- Chose: render the coverage grid as one native `<table>` in a named keyboard-focusable scroll region, followed by a semantic dimension rail and an explicit aggregate gap list. Accept `reducedMotion` as a component input and derive cell/rail transitions from the pure `matrixCell`, `matrixStagger`, and `ticker` tokens.
- Why: native row/column headers give the strongest assistive-technology model without recreating grid keyboard behavior; one row-major render prevents responsive state drift; and an explicit motion input lets the future guide composition honor the app's system/override resolution deterministically, including zero-duration reduced motion.
- Rejected: an ARIA grid would require a complete composite-widget focus model; separate desktop/mobile renderers could diverge; reading only the OS preference inside the component would bypass the app's explicit motion override and complicate deterministic rendering tests.

## D050 — Explanation order is the deterministic side-by-side contract
- Chose: treat the first ordered `competingExplanations` entry as supporting, the second as disconfirming, and the remainder as `others`; copy the revision's unclassified evidence references onto recorded explanation cards. When a revision has only one explanation, synthesize an evidence-free `Next test` counterpart from `nextProbe` so the side-by-side invariant still holds. Use the revision grade as card strength, a neutral `moderate` strength for interval uncertainty, semantic `support`/`contested`/`prompted` tones, and fail closed on fixed-label claim text.
- Why: Part I intentionally supplies ordered strings and a shared evidence-reference list with no per-explanation polarity or strength metadata. This is the smallest pure, deterministic, lossless projection that preserves §U8.12, exposes the interval unchanged, avoids inventing a scalar, and never renders `you are an X` copy.
- Rejected: parsing optional evidence-id prefixes would make incidental naming conventions operative; deriving a grade from interval width would introduce an unpinned learning rule; returning a null disconfirming card for a single explanation would violate SC-UI-05; rejecting the whole single-explanation revision would prevent the console from showing a safe next test.

## D051 — The explicit timeline golden and chronological contract are independent
- Chose: preserve §U8.10's explicit `tide` tone for both the day-7 and day-30 voluntary markers, distinguish them by their `horizon`, and sort every marker by day with input order as the same-day tie breaker. Use neutral tones for the unpinned revision/recovery markers and keep the color-independent legend to voluntary, prompted, and support semantics.
- Why: the canonical exact golden assigns `tide` to `e2`, even though companion shorthand says `tide/spark`; the same golden calls the output day-ascending even though its inline event list follows fixture order. Honoring the explicit field value while separately honoring the ordering contract preserves both pinned obligations without inventing signal magnitude or changing the golden.
- Rejected: assigning `spark` to `e2` would silently change an explicit golden value; preserving raw fixture order would put day 30 before days 7–25; deriving tones from event reliability or assistive flags would introduce an unpinned scoring rule.

## D052 — Lifecycle checklists require their family evidence
- Chose: pass `buildLifecycleStateView` an evidence-carrying gate input that combines the exact `CandidateGateEvaluation` with `familiesPresent`; project family rows and legal transitions from the domain package's fixed public vocabularies. Treat only RULE/SHADOW_MODEL non-operative revisions as proposals, derive history `authored` from `guideReview`, preserve append order, and reject decreasing version or record-time sequences.
- Why: `evaluateCandidateGate` deliberately returns only `eligible` and `missing`, which cannot reconstruct six truthful family-presence flags (an eligible gate may contain three or six families). Guide authorship also preserves the proposal's audit provenance, while append-only bitemporal history permits valid-time corrections but requires monotonic record time and operative versions.
- Rejected: inferring family flags from `eligible`/`missing` would fabricate evidence; widening the settled domain gate result would break exact G5 objects; deriving authorship from `proposedBy` would erase guide review semantics; sorting revisions in the view would hide malformed append order.

## D053 — Constellation pull fails closed without typed polarity
- Chose: derive star presence and brightness only from `revision.signalSummary.familiesPresent`, preserve the specified timeline-bearing API, and emit `pull:"neutral"` until the domain exposes a typed family-to-explanation polarity mapping. Never infer polarity from explanation prose or parent `familyContext`.
- Why: `HypothesisRevision` contains ordered explanation strings plus one shared, unclassified `evidenceRefs` list; D050 deliberately preserves that ambiguity instead of inventing evidence-id conventions. Neutral is reversible and honest, while the exact U039 geometry, brightness, anchors, DOM-equivalence, and no-scalar contract remain representable.
- Rejected: parsing free text or evidence-id prefixes would make incidental wording operative; overloading parent `familyContext` would visually promote a non-child source; adding an unpinned domain field during a view task would exceed the canonical data model and ordered build path.

## D054 — View parity compares an explicit domain-state projection
- Chose: require every `buildInterestLabView` domain input, select the current operative revision with `currentFor`, and fail closed when none exists. Compare quests, markers keyed by probe id, and every guide-state block structurally while excluding flags and presentation geometry/tier/motion. Compare marker `whyCopy` when age bands match; across age bands, treat the already-pinned age-specific copy as presentation while retaining every other marker field. Resolve timeline motion at composition time so reduced mode receives its zero-duration equal.
- Why: the composed view must never fabricate hypothesis, gate, or event state, and object-wide equality would incorrectly reject the specified age-copy, camera, tier, and motion differences. A key-order-independent structural comparison also avoids false inequality for logically identical uncertainty objects.
- Rejected: optional guide defaults would invent evidence; `JSON.stringify` equality is insertion-order-sensitive; stripping only top-level fields would still compare nested camera/tier/motion; always comparing `whyCopy` would contradict the existing requirement that copy changes across age bands.

## D055 — Guide authoring remains local, append-only, and domain-owned
- Chose: seed the synthetic console with an operative version-1 revision plus a same-version shadow proposal, route the guide form through local React state, and use the domain's `createHypothesis`, `appendRevision`, and `authorRevision` APIs to append an operative version 2 while removing only the active proposal affordance. Keep all prior operative and shadow history selectable. Place the fixed timeline markers into four deterministic index-modulo lanes, and load the decorative constellation through a client-only dynamic boundary only when motion, plain-mode, render-tier, and WebGL gates allow it.
- Why: this makes the U042 authoring affordance exercise the authoritative append-only lifecycle without persistence or live child data, prevents timeline labels at repeated days from overlapping, and keeps the DOM explanations and timeline authoritative when the optional canvas is unavailable.
- Rejected: mutating the proposal to operative would violate IL-011 and erase provenance; browser storage or a service call would exceed the synthetic-only app boundary; random or geometry-measured timeline placement would weaken deterministic rendering; mounting the constellation under reduced motion, plain mode, 2D, or no WebGL would violate its explicit degradation contract.

## D056 — Keep the quality-tier glow emissive-first
- Chose: complete U043 by locking the already-composed DPR, shadow, mote, and island-detail paths with integrated full/lite/board acceptance coverage; keep optional post-processing bloom disabled and retain the deterministic emissive material plus in-app halo implementation.
- Why: §U8.15 makes post-processing an optional non-breaking upgrade, while every required quality parameter already flows from the canonical `SceneView` into the Canvas and scene graph. Adding two packages solely to consume an optional flag would increase the client bundle and failure surface without strengthening the accessible or reduced-tier meaning.
- Rejected: adding `@react-three/postprocessing` and `postprocessing` without a demonstrated visual/performance need; duplicating tier policy inside the app; or creating a test-only quality abstraction after the direct composed-view wiring proved sufficient.
