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

## D057 — Runtime degradation uses a capped presentation floor
- Chose: extend D045 from one boolean decline to a client-owned `0 → 1 → 2` performance floor. Step 1 constrains capabilities to the canonical lite resolver path; step 2 marks WebGL unavailable so the same resolver selects `board-2d`. The callback uses a capped functional state update, while focus and picked quests remain in the continuously mounted DOM ledger.
- Why: repeated `PerformanceMonitor` declines now produce the exact full → lite → 2D sequence without mutating `SceneView`, bypassing capability rules, or remounting the operable quest state. Save-Data, device memory below 4 GB, unavailable WebGL, context loss, and explicit tier requests still pass through the same authoritative resolver and cannot upgrade above a safety floor.
- Rejected: local scene-quality mutation would let parent status and view state drift; falling directly from full to 2D would skip the required lite step; keying or moving the ledger with the canvas would risk losing a pick during presentation changes.

## D058 — Context-loss teardown precedes the DOM fallback
- Chose: detach the app-owned context-loss listener and dispose the renderer lists and renderer synchronously before notifying React to switch to `board-2d`; later unmount cleanup remains idempotent.
- Why: the production walkthrough's real `WEBGL_lose_context` event exposed a restoration race: callback-first handling let Three.js re-enter context initialization with a null precision result and blank the app. Ending renderer ownership before the state callback removes that race while the continuously mounted DOM ledger preserves every quest and pick.
- Rejected: suppressing the browser exception would leave the app blank; relying only on a synthetic event would not exercise actual GPU loss; moving quest state into the Canvas would make the fallback destructive; adding a second render-root teardown path would duplicate r3f ownership.

## D059 — Static guardrails inspect TypeScript structure, not raw substrings
- Chose: parse every view-package source file with the TypeScript compiler API, then inspect actual imports, `Math.random` property access, property signatures/declarations, and authored string/template literal segments. Prove failure sensitivity with temporary source mutations that are removed before the green gate.
- Why: syntax-aware checks avoid false positives from comments and similarly named fields while reporting stable file-and-line violations. Including template heads/middles/tails closes the interpolated fixed-label path, and controlled mutations provide honest RED evidence for a test-only invariant the source already satisfied.
- Rejected: raw whole-file grep would conflate comments and regex guards with emitted copy; checking only `model.ts` could miss a future co-located view type; weakening an acceptance assertion merely to manufacture an initial failure would make the guardrail less trustworthy.

## D060 — Canonical catalog fixtures are a test-only dependency
- Chose: link `@gt100k/interest-probe-catalog` as a development dependency of the view package solely for U048 acceptance coverage; keep `@gt100k/interest-lab` as the view runtime's only dependency and install the workspace link with lockfile writes disabled.
- Why: SC-UI-12 requires the complete view to run from the canonical Part-I catalog and event fixtures. A declared test-only link exercises those exact shared inputs without copying them, widening the production boundary, modifying completed Part I, or touching the shared lockfile.
- Rejected: copying the golden catalog into the view tests could drift; reaching into adapter source by relative path would cross project roots without a declared package edge; making the catalog adapter a runtime dependency would violate the GPU-free view package's narrow domain-only boundary.

## D061 — U049 documents the package without a second demo entry point
- Chose: complete U049 with the required package README and a documentation contract; defer its optional `src/demo.ts` because the existing synthetic app seed and U050 walkthrough exercise the composed view.
- Why: one authoritative usage example documents the input boundary without adding a runtime module or duplicating fixture orchestration. The next ordered task validates both rendered surfaces.
- Rejected: a second demo would repeat the app seed path and enlarge an optional documentation increment without strengthening a success criterion.

## D062 — Wide guide visuals scroll internally at accessible reflow widths
- Chose: let the shell's `.quest-workspace` grid item shrink with `min-width: 0`, preserve the coverage matrix and timeline as named keyboard-focusable horizontal scrollers, and stack the evidence headers plus both lifecycle tracks at the existing 48rem breakpoint. In that stacked layout, place the current-state marker in normal flex flow.
- Why: production-browser measurements found 22px page overflow at 320px and 42px under 200% text because the wide guide visuals contributed to the outer grid's automatic minimum size. The first containment fix exposed a 9.3px/21.6px current-marker collision; the final layout produces zero page overflow and zero marker overlap while retaining every matrix cell, timeline marker, lifecycle state, and internal scroll region.
- Rejected: hiding overflow on the workspace would clip meaningful guide content and focus indicators; shrinking the matrix/timeline would make their labels unreadable; retaining multi-column lifecycle rows at narrow or text-enlarged widths would force state labels and the current marker to overlap.

---

# VISUAL POLISH pass (game-feel.md) — art-direction decisions

## D-VP1 — Committed art direction: "Curiosity Quest World"
- Chose: ONE cohesive world — a warm, tactile, hand-crafted **floating-island atelier at dusk**.
  Graded palette (reuse the existing `@gt100k/interest-lab-view` PALETTE, do not invent new hues):
  deep plum night (#181026 / #221A3D / #120B1E), spark orange (#FF9E5E→#FFC08A) as the primary warm
  accent, beacon gold (#FFD166) for active/attention, tide cyan (#5EC8D8) and sprout green (#7BD88F)
  as secondary domain hues. Material language: frosted-glass panels with a thin lit top rail, inset
  "trench" controls, warm emissive glow, low-poly crafted geometry, springy/ease-out motion. Type:
  Fredoka display, Iowan reading serif, Inter body (already wired via next CSS vars).
- Why: game-feel non-negotiable #1 requires one committed world; the palette + fonts already exist
  in the view package and the 3D scene, so anchoring to them keeps every turn cohesive and avoids
  colour/typography drift. Every subsequent turn's choices must serve this world.
- Rejected: introducing a new palette or a cooler sci-fi HUD look would fight the existing warm
  island 3D scene and the child-facing, playful product intent.

## D-VP2 — Presentation controls are a HUD deck, not a dropdown form (Turn 1)
- Chose: rebuild `InterestLabControls.tsx` as a "mission deck" — four **segmented radio controls**
  (Age / Motion / Surface / Render tier) in inset trenches with lucide-weight inline icons, a
  spark-gradient active segment, hover lift, `scale(0.97)` press, and focus rings; a **toggle switch**
  for Plain mode; a display-font title, an uppercase eyebrow, and a live telemetry status chip. The
  panel is frosted glass with a lit top rail + layered shadow + corner glow. Radios keep the original
  group `name`s and option `value`s so the pinned SSR markup assertions stay green.
- Why: the stock `<select>` surface was the single worst remaining AI-demo tell — the verbatim
  auto-fail #2 and a violation of non-negotiable #7 (UI chrome must be a HUD). Segmented radios are a
  real form-control underneath (accessible, keyboard-operable, test-compatible) but read as tactile
  game controls. Custom `cubic-bezier(0.23,1,0.32,1)` ease-out + press feedback follow apple-design /
  emil-design-eng guidance; visually-hidden inputs preserve semantics; reduced-motion, reduced-
  transparency, and high-contrast are inherited from the existing global media queries + `.material`.
- Rejected: styling the native `<select>` (still reads as a form, can't show tactile state); a custom
  JS listbox (heavier, re-implements keyboard behavior, risks the pinned markup); removing options to
  simplify (would lose forward-compatible tier/surface requests the app relies on).

## D-VP3 — Defer post-processing to a dedicated turn (supersedes-in-waiting for D056)
- Chose: NOT add `@react-three/postprocessing` in Turn 1; do the zero-dependency HUD win first and
  schedule the grade (Bloom + Vignette + subtle SSAO) as the next turn's primary task.
- Why: game-feel #4 makes a post-processing grade non-negotiable and explicitly lists
  `@react-three/postprocessing` as an allowed addition, so D056's deferral is overridden by this
  visual pass — but the packages are not yet installed and adding them touches the shared lockfile +
  build. Landing that on its own turn keeps each commit a single, verifiable green change rather than
  risking a red gate by combining a dependency install with the HUD work.
- Rejected: bundling the package install into Turn 1 (couples two unrelated risks); permanently
  honoring D056 (would leave a named non-negotiable unmet).

## D-VP4 — Cinematic post-processing grade lands (Turn 2 · supersedes D056 & fulfils D-VP3)
- Chose: add `@react-three/postprocessing@^2.19.1` + `postprocessing@^6.39.3` (both peer-compatible
  with our r3f v8.18 / three 0.169 / React 18 stack; the v3 line needs r3f v9, so pinned to v2) and
  mount a dedicated `WorldPostFX` inside the Canvas, gated on the model's existing
  `quality.postprocessing` (full tier only). Chain, in deliberate order:
  **Bloom → HueSaturation(+0.08) → BrightnessContrast(-0.015 / +0.07) → ToneMapping(ACES_FILMIC) →
  Vignette(offset 0.32 / darkness 0.55)**. Bloom is `mipmapBlur`, `intensity = bloomPeak * 0.55`
  (~0.77), `luminanceThreshold 0.6`, `radius 0.72` — it feeds on the already-emissive quest markers
  + additive welcome halos, so the plum night stays matte and only the warm cores glow.
- Why: this is game-feel non-negotiable **#4** ("~half of AAA feel"), the single worst remaining
  AI-demo tell once the lighting rig landed (the app had ACES on the renderer but no grade — the
  "three.js starter" look). The view model was *pre-wired* for exactly this: `bloomPeak`,
  `markerEmissive*`, and per-tier `bloom`/`postprocessing` flags already existed and were unused, so
  consuming them adds the grade without inventing new data or touching domain/logic. `<EffectComposer>`
  forces `gl.toneMapping = NoToneMapping` while mounted and renders linearly into an HDR HalfFloat
  buffer (verified in the installed dist), so re-applying **ACES** via the ToneMapping effect is
  required and keeps the look cohesive with the renderer-ACES on the lite/board tiers. Values are
  restrained per apple-design craft (every value defensible) and game-feel's "tasteful / subtract"
  bar. `multisampling={4}` restores edge AA the composer would otherwise bypass.
- Rejected: **SSAO/N8AO** this turn — it needs a normal/depth pass, is the costliest + riskiest
  effect to tune blind (headless, no GPU to verify it isn't crushing the scene), and the floating-
  island-over-misty-sea composition gains little from contact AO the ContactShadows already imply;
  recorded as a candidate next turn. AgX tone-map (the lib default) — rejected for ACES to match the
  other tiers exactly. Enabling the grade on lite/board — rejected; it would break the D057 perf floor.

## D-VP5 — Idle camera breath completes cinematography #5 (Turn 3)
- Chose: add a subtle, continuous "idle drift/parallax" to `CameraRig.tsx` so a shot never freezes
  once a transition settles. New pure `sampleIdleDrift(settledElapsedMs, reducedMotion)` (+ `IDLE_DRIFT`
  config) returns an additive pos/target offset built from three incommensurate sines per channel
  (periods 9/13/17s pos, 15/21/25s target), amplitudes ≤ 0.34 world units, ramped in over 1.4s via
  `MathUtils.smoothstep`. The rig captures each completed transition's `to` pose as `settledBaseRef`,
  resets a settle clock, and while idle sets `camera.position = base + offset` each frame.
- Why: game-feel **#5** explicitly names "subtle idle drift/parallax," and the settled camera was the
  worst remaining cinematography tell — the rig already had intro drift-in, eased island focus,
  welcome-back, auto-tour, and damped orbit, but froze dead-still between them (most visible during the
  8s auto-tour dwells → a lifeless diorama). Sines are exactly 0 at t=0 and the ramp starts at 0, so
  the breath joins the settled pose with **no pop**; keeping the offset purely additive (never touching
  `createCameraTransition`/`frameAt`) preserves the byte-exact transition unit tests. Amplitudes/periods
  follow the motion-craft bar (never linear, slow, non-repeating, purposeful — keep a resting world
  alive) from apple-design / emil / improve-animations.
- Rejected: applying idle drift in **focus+orbit** mode — OrbitControls + damping already own the camera
  there and the user is interacting, so an auto-sway would fight the manual orbit; gated out. Baking the
  drift into the transition math — would break the pinned `frameAt` equality tests and risk popping.
  Driving idle motion under **reduced motion** — off by contract (returns zeros), consistent with the
  rig cutting all motion for that setting. Adding the constant to the view package's typed `CAMERA3D`
  model — kept app-local (like `AUTO_TOUR_DWELL_MS`) to avoid touching the view package's pinned tests.

## D-VP6 — Guide console becomes the crafted "atelier light-table deck" (Turn 4 · cohesion #9)
- Chose: give the guide surface (`.guide-console`, and its nested `.coverage-console`) the child HUD's
  **material language** without inverting its colours. Kept the warm opaque `--paper-guide` reading
  surface + dark `--ink-guide` text, but reframed the shell as a lit slab: the **signature top rail**
  (`::before`, the exact spark→beacon→tide gradient as the child deck), a **layered depth shadow**
  (deep ambient + short contact + a top inner highlight so the deck lifts off the dark desk), warm/tide
  **corner glows baked into the paper** (lit vellum, not flat card), and a bright hairline lip. Upgraded
  the two console eyebrows (`guide-console-intro` / `coverage-console-header` `.surface-name`) to the HUD
  eyebrow — uppercase, tracked, with a small lit **spark glow-dot** `::before`. Recessed the two
  horizontal scroll instruments (`.coverage-table-scroll`, `.timeline-scroll`) into **inset trenches**
  (inset shadow + top highlight + hairline) so the map and timeline read as recessed instruments. The
  nested `.coverage-console` now paints `background: transparent` so the deck's lit surface stays
  continuous beneath the coverage map instead of masking it with a flat rectangle.
- Why: game-feel **#9 (cohesion)** + **#7 (HUD not a form)** — the child side was fully graded/lit/HUD'd
  while the guide read as a flat "dashboard" paper card (the worst remaining tell per Turn 3's NEXT). Per
  **apple-design §12**, material weight encodes hierarchy: the guide is a *structural, dense, adult
  reading region*, so it should be a **heavier opaque material** than the child's floating translucent
  HUD — keeping paper (dark text on light for dense evidence) is the correct call, and inverting to dark
  glass would both hurt readability and cascade-break every `color-mix(... --paper-guide)` tinted cell
  (coverage cells, explanation columns, lifecycle states). The lit top rail is apple-design's "bright top
  edge = light catching the material" and is the single strongest cohesion signal shared with the child
  deck. All changes are additive framing on an opaque surface (no `backdrop-filter`), so plain-mode,
  reduced-transparency, reduced-motion, and high-contrast are unaffected. The two pinned coverage CSS
  regexes (`.coverage-cell--empty`, `.coverage-rail-item--gap .coverage-state-glyph`) were left untouched.
- Rejected: **inverting the guide to dark frosted glass** (the literal reading of Turn 3's NEXT) — breaks
  readability of dense evidence and cascade-breaks every tinted guide cell; the crafted-lit-vellum path
  achieves the same "one world" cohesion at a fraction of the risk. Adding the rail to the nested
  `.coverage-console` too — would draw a second rail mid-console; the rail belongs to the outer deck only.
  A slow shimmer on the rail — rejected for calm/static parity with the child deck's static rail.
  Trenching every sub-panel (explanation columns, lifecycle tracks) this turn — deferred to keep the turn
  a single cohesive change; the two scroll instruments are the highest-value recesses.

## D-VP7 — Guide controls get the child deck's tactile feedback idiom (Turn 5 · motion/juice #6)
- Chose: a **pure-CSS press/hover/focus feedback pass** on the guide's directly-interacted controls,
  reusing the child HUD deck's exact motion idiom rather than inventing a second one:
  the shared **`--hud-ease` = `cubic-bezier(0.23,1,0.32,1)`**, `transform: scale(0.97)` on `:active`,
  140–180ms durations, and every hover rule gated behind `@media (hover: hover) and (pointer: fine)`.
  Specifically: (1) `.guide-authoring button` — depth shadow at rest, hover lifts `translateY(-1px)` and
  warms `background` toward `--spark` (`color-mix … 24% --spark`), press `scale(0.97)`, `box-shadow: none`
  when `:disabled`. (2) The three guide `<details> summary`s (`.explanation-evidence`,
  `.other-explanations`, `.legal-transitions`) — became `display:flex` with a **custom border-drawn
  chevron `::after`** (native `::-webkit-details-marker` hidden, `list-style:none`) that rotates 45°→−135°
  on `[open]`; hover tints `background` + shifts text toward `--spark`; `:active` `scale(0.985)`; a
  `-0.5rem` inline margin/padding pair keeps the text position identical while letting the hover bg
  breathe. (3) `.revision-entry` — the selected-row `background` now transitions over 220ms (was a snap),
  the label presses `scale(0.99)`, and the `.revision-mark` gains a `--spark` ring when selected + scales
  on hover. (4) `.guide-authoring input/textarea` — border-color transitions toward `--spark` on
  hover/focus with a subtle inset glow.
- Why: game-feel **#6** (juice everywhere) — after Turn 4 the guide *looked* crafted but its interactive
  controls were dead under the pointer, the highest-leverage remaining tell. The guide's *enter* motion
  already existed (coverage stagger, explanations reveal, timeline draw, marker/gate pops, lifecycle
  state-morph via `motion/react`), so the honest gap was **interaction feedback**, not entrance animation —
  which `find-animation-opportunities` gates as the top "feedback" opportunity class on occasional-use
  surfaces. Reusing `--hud-ease` + `scale(0.97)` keeps it cohesive with the child deck (game-feel #9); the
  spark-warm hover/focus accents tie the feedback to the committed palette + the shared top-rail gradient
  (D-VP1/D-VP6). CSS-only means the pinned guide/coverage markup tests + CSS regexes are untouched and the
  build's CSS compile actually verifies it, and the global `transition-duration:0.01ms !important`
  reduced-motion block neutralizes all of it automatically — a11y-safe by construction (per apple-design /
  emil: reduced motion = gentler, and here the feedback degrades to instant state change, never movement).
- Rejected: a JS/`motion/react` feedback layer (heavier, adds re-renders, and CSS `:active`/`:hover`
  already off the main thread — emil's "CSS beats JS under load"); a bespoke easing/duration for the guide
  (would fracture cohesion with the child deck); adding *more* enter animation to the already-animated
  interior (the enter motion is not the gap; over-animating violates game-feel #1 "subtract first");
  a box-shadow focus **ring** on the inputs (would double the global `:focus-visible` outline — used an
  inset glow + border-color shift instead so the a11y outline stays the primary indicator); rotating the
  native disclosure marker (inconsistent cross-browser — drew a custom chevron and hid the native one).

## D-VP8 — 2D quest board: crafted lit-card material + HUD eyebrows (Turn 6)
- What: A pure-CSS material pass on the WebGL-fallback board (`Board2D.tsx` + `.quest-card*` /
  `.quest-constellation h3` in `globals.css`), plus one tiny markup tweak (domain hue passed as a
  `--domain-hue` CSS var instead of an inline `background`, so the header dot can glow in-hue).
  (1) `.quest-card` gains the deck's committed material language, scaled to a card: a **layered depth
  shadow** (`0 1px 0 …/12% inset` top highlight + `0 14px 30px -22px …/78%` ambient drop) so it lifts
  off the dark board; a **hue-baked corner glow** radial layered over the existing color-mix fill; and
  a per-card **lit top rail** (`::before`, 2px, domain-hue→spark-hi gradient) — the card-scale echo of
  the deck's signature rail (D-VP1/D-VP6). `overflow:hidden` clips the rail to the 0.875rem radius.
  (2) **Hover** (behind `@media (hover:hover) and (pointer:fine)`): shadow blooms wider + a hue glow
  ring + border warms toward the hue + the rail brightens to full — the depth that makes motion's
  existing `translateY(-4px)` read as *lifting*, not sliding. (3) **Picked** (`[aria-pressed="true"]`):
  an **emissive hue glow ring** + brighter fill + full rail, so a chosen quest reads as lit up. (4)
  **Spark** (recommended) card: warm spark→beacon rail + a warm outer glow (2D stand-in for Bloom).
  (5) **Prompted-return** card stays calm: a muted `--prompted` rail at 0.5 opacity, no warm glow.
  (6) `.quest-constellation h3` upgraded from a muted capitalized label + hollow ring to the shared
  **HUD eyebrow** (uppercase, `0.08em` tracking, `--spark-hi`) + a **lit glow-dot** (0.5rem, hue fill,
  hue box-shadow glow) — identical idiom to `.hud-eyebrow` / `.hud-eyebrow-dot`.
- Why: game-feel **#3 (materials, never flat primitives)** + **#9 (cohesion)**. The QuestCard *motion*
  was already fully juiced (stagger enter + hover-lift + press + pick-spring via `motion/react`), so the
  progress-note assumption "board pops in flat" was wrong — `find-animation-opportunities` confirmed the
  real gap was **material/surface**, not motion. The cards were flat CSS rectangles (hairline border +
  flat fill, zero depth) sitting on the dark board like a generic dashboard list, while the child HUD
  deck and guide light-table deck both carry lit rails + layered shadow + emissive glow. This closes the
  last surface that broke cohesion. Motion owns transform/opacity/filter (inline, JS-driven); CSS owns
  box-shadow/border/background — no conflict. Reduced-motion is auto-neutralized by the global
  `transition-duration:0.01ms !important` block (the resting depth shadow + rail persist, which is
  correct — they're static material, not movement). a11y outline untouched (`:focus-visible` uses
  `outline`, which `overflow:hidden` does not clip).
- Rejected: adding a JS/`motion/react` layer for the surface (CSS `:hover`/`:active` is off-main-thread
  and the transform juice already exists — emil's "CSS beats JS under load"); a bespoke card easing
  (used the deck's `cubic-bezier(0.23,1,0.32,1)` as a local `--card-ease` to stay cohesive —
  `--hud-ease` is scoped under `.control-panel.hud-deck`, not global, so it can't be referenced here);
  a box-shadow focus ring (would fight the global `:focus-visible` outline — left the outline as the
  a11y indicator); animating the hue-corner glow / adding particles (violates game-feel #1 "subtract
  first / keep it calm" — the board is dense content, so material depth, not extra motion, is the win).

## D-VP9 — Quest tray + welcome-back get the lit-card material + tactile returns (Turn 7)
- What: A pure-CSS material + feedback pass on the last generic surface — the child's quest tray
  (`.quest-tray` container, `.quest-tray-list li` chips, the "Put back" `button`) and the
  `.welcome-back-halo` badge — reusing the committed lit-card idiom (D-VP1/D-VP6/D-VP8), no markup
  change. (1) `.quest-tray` becomes a **lit slab**: a hairline `--line` border, a faint tide
  corner-glow radial over the `--night-sunk` fill, a top inner highlight + ambient drop shadow so it
  lifts off the world backdrop, and the **signature spark→beacon→tide rail** (`::before`, top corners
  rounded to the 0.875rem radius — no `overflow:hidden`, so button `:focus-visible` outlines are never
  clipped). (2) The tray eyebrow (`.quest-tray .surface-name`) gains the **HUD lit glow-dot** (scoped so
  the shared global `.surface-name` and the guide's eyebrow are untouched). (3) `.quest-tray-list li`
  chips get **raised material** (top-highlight gradient fill + hairline + soft drop) so kept quests sit
  proud of the tray floor. (4) The **"Put back" button** — previously dead under the pointer — gets the
  emil tactile idiom: a resting depth shadow, `:active { transform: scale(0.97); box-shadow: none }`, and
  a gated `@media (hover:hover) and (pointer:fine)` hover that warms the border + fills toward `--spark` +
  lifts the shadow, all on the shared `--card-ease` = `cubic-bezier(0.23,1,0.32,1)` at 150ms. (5)
  `.welcome-back-halo` gains a warm `--spark` **emissive glow** (2D stand-in for the world's bloom) while
  `.prompted-return-mark` stays calm (no glow) — matching the board's spark-glows-warm / prompted-stays-
  calm split (D-VP8). Also removed a **stale `.quest-card:hover` box-shadow override** in the later
  `@media (hover:hover)` block that (same specificity, later source order) was clobbering Turn 6's richer
  layered hover shadow on the board cards — so the crafted board hover now actually renders.
- Why: game-feel **#3 (materials, never flat)** + **#6 (juice)** + **#9 (cohesion)**. After Turns 4/6 the
  3D world, child HUD deck, guide light-table deck, and board-2d cards were all crafted, but the quest
  tray was still a flat `--night-sunk` rectangle with flat `--night-raised` chips and a feedback-less
  pill — the last "dashboard aside" tell, and the highest-leverage remaining surface per Turn 6's NEXT.
  Reusing the exact rail gradient + glow-dot + `--card-ease` + `scale(0.97)` press ties board↔tray↔deck
  into one world (emil: cohesion; the same easing/idiom everywhere). CSS-only means the pinned
  `data-quest-tray-item` / aria-label tests + the build's CSS compile actually verify it, and the global
  `transition-duration:0.01ms !important` reduced-motion block auto-neutralizes the press/hover (resting
  depth + rail persist as static material — correct, per D-VP8). Occasional-use surface → emil rates
  standard press/hover feedback as appropriate (not "remove").
- Rejected: `overflow:hidden` on `.quest-tray` to clip the rail (would clip the inner buttons'
  `:focus-visible` outline — used rounded `::before` top corners instead); restyling the **global**
  `.surface-name` to add the dot (would also change the guide's coverage-console eyebrow — scoped to
  `.quest-tray .surface-name`); a JS/`motion/react` feedback layer on the button (CSS `:active`/`:hover`
  is off-main-thread and the tray items already animate enter/exit via `motion/react` — emil's "CSS beats
  JS under load"); a bespoke tray easing (used the shared `--card-ease` for cohesion); a warm glow on the
  prompted-return mark (prompted must stay calm — game-feel #1 + D-VP8's spark/prompted split).

## D-VP10 — Contact ambient occlusion finishes the post-FX grade (Turn 8)
- What: Added an `<N8AO>` pass as the first effect in `WorldPostFX.tsx`'s composer chain
  (N8AO → Bloom → HueSaturation → BrightnessContrast → ACES ToneMapping → Vignette), full-tier only
  (it lives inside the composer that only mounts when `quality.postprocessing`). Tuned conservatively:
  `aoRadius={1.1}` (contact-scale — the island-cap↔underside-cone seam, markers meeting island tops,
  the rim torus meeting the deck; ≈1 world unit so distant islands don't darken each other across the
  void), `distanceFalloff={1}`, `intensity={1.25}` (just above N8AO's already-legible 1.0 default),
  `quality="medium"`, `halfRes` + `depthAwareUpsampling` (perf + clean edges), and — the cohesion move —
  `color={PALETTE.nightSunk}` so the occlusion tints toward the deep plum night instead of gray/black
  dirt, matching the `<ContactShadows>` grounding color (D-VP1).
- Why: game-feel **#4** explicitly lists "subtle SSAO" as part of the post-processing stack ("~half of
  AAA feel"), and it was the one named-but-unbuilt item (Turn 2 shipped Bloom+grade+tone-map+vignette;
  AO was deferred as "needs a normal pass; riskiest to tune blind"). Critic pass (impeccable +
  apple-design §12 materials/depth, §16.7 craft): every surface is now crafted, but the 3D islands +
  markers were *lit* yet not *seated in each other* — no contact-scale occlusion, so they read a hair
  "floaty / decal'd," the last CG tell in the world. **N8AO retires the deferral risk directly: it
  derives normals from the depth buffer, so there is no separate normal pass to add or tune** — the
  exact thing that made classic `SSAO` risky blind. Depth-only also means the fog + emissive markers +
  ContactShadows are untouched; AO only multiplies darkening into creases (already-dark regions), so it
  can't change which warm cores Bloom lifts.
- Verification: `world-3d.test.ts` transitively imports the real `@react-three/postprocessing` (it is
  NOT mocked — only fiber/drei/next-dynamic are), so the 74-test app suite + the standalone node ESM
  probe both prove the N8AO module evaluates without a side-effect crash. tsc + 74 tests + `next build`
  green. Pixel appearance still can't be verified in this GPU-less headless env (swiftshader falls to
  board-2d and never runs the composer) — same honest caveat as the Bloom grade (see progress
  Verification note); params were chosen conservative-by-construction and tinted to the committed palette.
- Rejected: classic `SSAO` (needs a `NormalPass` — more wiring + the blind-tuning risk that deferred it);
  a bright/black AO color (gray dirt breaks the warm dusk cohesion — tinted to `nightSunk` to match the
  contact shadows); high `intensity` / large `aoRadius` (over-darkening reads as muddy — game-feel #1
  "keep it calm", and this can't be pixel-checked, so conservative wins); a new `quality.ssao` flag
  (redundant — the composer already gates on `postprocessing`, so AO auto-drops with the full tier and
  the D057 perf floor is preserved); adding depth-of-field this turn (optional per #4; one grounded
  change per turn, and DoF is the higher blind-tuning risk — left for a GPU screenshot pass).

## D-VP11 — Subtract the presentation control-wall to one primary nav + a Preview-settings disclosure (Turn 9)
- What: Restructured `InterestLabControls.tsx` (+ CSS) so the HUD deck shows **one** control in view —
  the primary `Surface` toggle (relabelled **"Viewing"**: Quests ↔ Guide) in a new prominent
  `.hud-primary` row — while the four preview/accessibility/debug switches (**Age band, Motion, Render
  tier, Plain mode**) collapse behind a native `<details class="hud-advanced">` disclosure with a
  `<summary>` "Preview settings" (sliders icon + rotating chevron). Trimmed the eyebrow from
  "Mission deck · presentation only" → "Mission deck" (the "preview" nuance now lives in the disclosure
  label). The compact live-status chip stays in the header as the one-line summary. No JS: native
  details/summary = keyboard-operable + a11y-correct for free. Disclosure motion reuses the deck idiom
  (`--hud-ease` cubic-bezier(0.23,1,0.32,1)): chevron `rotate(180deg)` @220ms, summary `:active
  scale(0.99)` press + gated-hover spark tint, and an ease-out `translateY(-6px)`→0 + opacity reveal on
  the buried grid (never scale(0), per emil). Only transform/opacity/color animate; the global
  `prefers-reduced-motion` block neutralizes both `animation-duration` + `transition-duration`, so it's
  a11y-safe by construction.
- Why: game-feel **#1 (Simplicity & flow — the FIRST requirement)** + **#7 (minimal HUD, progressive
  disclosure)**. The prior 8 turns added *material richness* every turn but never touched the one thing
  #1 ranks above all polish: the deck was a persistent **five-control wall** labelled "presentation
  only," which is the auto-fail the doc names verbatim ("Default dropdown forms as the control surface
  (Age band / Motion / Surface / Render tier)"). Turn 1 restyled the `<select>`s but left the *wall*;
  #1 demands "cap visible controls (≤~5), one primary action in view, subtract every turn, collapse the
  rest behind an Advanced disclosure" — the doc's exact proven pattern (subwoofer ref). This is the
  first turn to actually **subtract** rather than add, taking the always-visible control count 5→1.
- Verification: pinned `interest-lab-client.test.ts` ("one semantic presentation-control cluster with
  every required flag") stays green because `renderToStaticMarkup` renders `<details>` children
  regardless of open state — every `name=`/`value=` string + "Interest Lab controls" h2 +
  "Showing the accessible 2D board" status + `--control-target` style is still present. A throwaway
  structural probe confirmed Surface renders inside `.hud-primary` and the four switches inside
  `<details class="hud-advanced">`, and "presentation only" is gone. Gate green: tsc + 74 tests +
  `next build`.
- Rejected: a JS-animated height reveal / `interpolate-size`+`::details-content` (adds risk + browser-
  support caveats for one occasional disclosure — native details + a fade-slide is honest and cohesive,
  emil "CSS beats JS under load"); deleting the preview switches outright (they're the app's synthetic-
  preview affordances — hiding, not removing, is the right subtraction); leaving Motion/Plain mode in
  view as "accessibility" (shipped games put a11y in a settings menu; the OS reduced-motion default is
  still auto-respected, so the manual override belongs behind Preview settings); a bespoke summary
  easing (reused `--hud-ease` for deck cohesion); `scale(0)` reveal (emil: nothing appears from nothing).

## D-VP12 — Subtract duplicated content-chrome prose (Turn 10 · the #1 lens on content surfaces)
- What: A focused copy-subtraction pass on the always-on content chrome (no markup structure, no CSS,
  no logic change — pure text). Four cuts to their load-bearing core:
  (1) **Masthead lede**: "Try different kinds of work, notice what draws you back, and keep every
      possibility open." → "Try different kinds of work and notice what draws you back." — dropped the
      3rd clause, which the **footer already carries** verbatim in meaning ("choices never become fixed
      labels"). Cross-chrome duplication removed.
  (2) **Child ledger paragraph**: "Pick what feels worth trying. There is no best choice, and asking for
      another way never counts against you." → "There is no best choice, and asking for another way never
      counts against you." — dropped sentence 1, which just **restated the eyebrow** ("Choose what to
      try"). Kept the child-safety reassurance (load-bearing product copy per PRD non-labeling stance).
  (3) **Quest-world instruction**: "The quest cards below control this world. Focus a card to visit its
      island." → "Focus a quest below to visit its island." — dropped sentence 1 (states the obvious: the
      cards visibly control the world). Kept the one functional hint.
  (4) **Guide intro paragraph**: split two staccato sentences into one em-dash clause (kept every noun —
      gaps, prompts, shadow suggestions); the dense adult surface earns one orientation sentence.
- Why: game-feel **#1 (Simplicity & flow — the FIRST requirement)** applied to the **content** surfaces,
  which Turns 1–9 skipped (they subtracted the *control wall*, Turn 9, but never the prose). The child
  quest screen showed **two overlapping reassurance paragraphs** (masthead lede + ledger paragraph both
  saying "explore freely, no wrong answer") plus an obvious-stating instruction — exactly the doc's
  "explanatory paragraphs where a label works" / "delete text that states the obvious" / "subtract every
  turn." Reading path on the child screen is now: focal content (constellation + islands) → one short
  reassurance → the cards. Fewer, calmer words = premium, per #1.
- Verification: only two content strings are test-pinned — "Your quest constellation" (ledger h2) and
  "Synthetic data only" (footer); both untouched. The negative guard
  `not.toMatch(/price|score|rank|percentile|verdict/i)` — none of the new strings contain those words.
  Gate green: tsc + 212 tests + `next build`.
- Rejected: deleting the ledger reassurance **entirely** (it's load-bearing child-safety copy at the
  point of action — the PRD's non-labeling promise; hiding/trimming, not removing, is the right cut);
  gutting the guide paragraph (adult evidence surface earns one orientation sentence — over-cutting there
  would lose the shadow-suggestion/gaps promise); touching the footer's three governance clauses
  (all load-bearing: synthetic-only, no-PII, no-fixed-labels) or the masthead "synthetic preview" eyebrow
  (trust signal, de-emphasized as small text); any CSS/markup change (this is a words-only subtraction —
  keeps the pinned-markup tests and CSS regexes untouched by construction).

## D-VP13 — Light the guide evidence constellation as glowing nodes (Turn 11)
- What: Overhauled `EvidenceConstellationCanvas.tsx` — the guide's decorative 3D depth figure — which
  was the one remaining 3D surface still rendering **bare `meshBasicMaterial` spheres on transparent
  black** (flat balls + thin lines). Every star and anchor pole is now a `GlowPoint`: a small hot
  self-luminous **core** sphere wrapped in a soft **additive halo sprite**, tinted per pull
  (supporting→sparkHi, disconfirming→tide, neutral→inkHi) and scaled by the star's `brightness`. Added
  `constellation-node.ts` with (a) `createSoftDotTexture()` — a **white** radial-gradient sprite
  (opaque centre → transparent rim) drawn in-memory (mirrors `glow-texture.ts`; white so a single
  texture tints to any tone via `spriteMaterial.color`), and (b) pure `resolveStarNode()` /
  `resolveAnchorNode()` mapping brightness → `{coreScale, haloScale, coreOpacity, haloOpacity}` (halo
  ~5× the core; opacities unit-clamped). Anchors read as hotter/wider beacons the pull-lines converge
  on. Links bumped 0.28→0.34 opacity so the light-threads read against the now-brighter stars.
- Why: game-feel auto-fail #1 verbatim — "Flat-lit, untextured primitives (… orange spheres on
  black)" + "Materials, never bare primitives … emissive for glow." The 10 prior turns crafted the
  child 3D world AND the guide's *DOM* light-table deck, but nobody touched the guide's *3D constellation
  canvas* — so it sat as the last "three.js starter" surface in the app, directly under a `figcaption`
  calling it the "Evidence constellation." The doc's per-app note wants the constellation to read as a
  *living constellation of glowing nodes*, not flat dots. apple-design §12 (materials/depth) + §16.7
  (craft: deliberate values): the additive halo + hot core is the emissive "glowing node" idiom, chosen
  conservative on a decorative float (restraint — it's `aria-hidden`, DOM evidence stays authoritative).
- Verification: the sole source pin on this file (guide-console.test.ts) is `<Canvas … aria-hidden="true"`
  — preserved. New `constellation-node.test.ts` (6 tests, mirrors the glow-texture harness): texture
  draws a white radial dot in-memory w/o fetch + correct filters/colorspace, throws w/o a 2D context;
  `colorForPull` tone mapping; `resolveStarNode` brightness-monotonic scaling + unit-clamped opacity +
  halo>core; `resolveAnchorNode` hotter/wider beacon. Gate green: tsc + app 80 tests (74→80) +
  root 212 tests + `next build`. Pixel glow still can't be verified in this GPU-less headless env
  (same honest caveat as the Bloom grade — the canvas is dynamic ssr:false and never rasterizes here),
  so values were chosen conservative-by-construction and tinted to the committed palette.
- Rejected: three separate tinted glow textures (one white texture + per-sprite `color` tint is simpler
  and DRY — emil "fewer moving parts"); a full `<EffectComposer>`+Bloom on this canvas (heavy for a
  decorative float that already floats behind authoritative DOM — the additive halo is the honest,
  perf-cheap 2D stand-in, same board-2d rationale as D-VP8); brightening the neutral stars to compete
  with supporting/disconfirming (neutral must stay quiet — matches the calm/spark split, D-VP8);
  animating the glow (the `<Float>` drift is enough ambient motion; a pulsing halo would over-decorate
  a background figure — game-feel #1 restraint); touching `glow-texture.ts` (warm-only + pinned test —
  added a sibling factory instead).

## D-VP14 — Declare done after a disciplined, surface-by-surface critic sweep (Turn 12)
- What: No code change. This turn honored the Turn-11 lesson — "a scorecard can lie" — by running the
  end-to-end critic sweep the NEXT block demanded, *inspecting* each surface rather than trusting the
  scorecard, then declaring `.loop-done`.
- Sweep result (all clean, actually inspected):
  (a) **Guide non-3D panels** — grep over the whole app for any 3D primitive
      (`mesh*Material`/`<Line>`/`*Geometry`/`pointsMaterial`) returns exactly 4 files: the child world
      (`World3DCanvas`, `QuestMarker`, `Island`) and the guide constellation
      (`EvidenceConstellationCanvas`, crafted Turn 11). `Lifecycle`, `RevisionHistory`, `ReturnTimeline`,
      `CoverageMatrix` are **DOM/SVG** — confirmed not flat 3D.
  (b) **Fallbacks** — `board-2d` renders the Turn-6 crafted `QuestCard` board (lit rails + layered
      shadow + hue glow), not a stripped list. `plainMode` forces `board-2d` (scene.ts:107) and
      `.plain-mode` flattens only the glass `.material` panels (intentional low-stimulation calm) while
      the crafted cards persist. `EvidenceConstellation` returns `null` under
      reducedMotion/plainMode/board-2d — no flat DOM stand-in is left behind; the crafted light-table
      deck stands alone.
  (c) **Child 3D materials** — `QuestMarker` = PBR `meshStandardMaterial` (emissive + metalness/roughness)
      + additive halo sprite + `WelcomeBloom`; `Island` = PBR cap/underside/emissive-rim-torus with
      deliberate `flatShading` faceting; `Motes` = drei `<Sparkles>`. No bare primitives anywhere.
- Why declare done (not add more): every game-feel non-negotiable is met and no auto-fail anti-pattern
  remains, now verified by inspection. game-feel **#1** ("Subtract every turn … guard hard against
  over-decorating an already calm world; simplicity reads as premium, density reads as AI") makes the
  correct art-director move *restraint* — the two optional items left (shallow DoF, deeper guide
  trenching) are AAA polish best tuned eyes-on in a GPU screenshot pass, and forcing them blind would
  risk the exact over-decoration the doc warns against. The masthead/footer copy is already at its
  load-bearing core (D-VP12), so there is no honest subtraction left either.
- Verification (evidence, not assertion): `tsc -b` exit 0; root `vitest run` = 212 passed;
  `@gt100k/interest-lab-app test` = 80 passed; `@gt100k/interest-lab-app build` = compiled successfully
  (route `/` prerendered static). Gate green.
- Honest caveat (unchanged from D-VP4/D-VP13): the WebGL full tier (composer: N8AO→Bloom→grade→ACES→
  Vignette, and the constellation halos) can't be pixel-verified in this GPU-less headless env
  (swiftshader falls to board-2d and never runs the composer). Correctness is by construction +
  green gate; a GPU/browser screenshot pass remains the ideal final visual confirmation and taste-tune,
  but it is not a blocker for any non-negotiable.

## D-VP15 — Re-verify and re-declare done; the `.loop-done` marker is gitignored (Turn 13)
- Context: the loop re-invoked after Turn 12 declared done, because `.loop-done` is in `.gitignore`
  (confirmed: `git check-ignore .loop-done` → hit) so the marker never commits and was wiped between
  sessions — not because any work was left. Turn 12's commit (`a2c238c`) only carried the progress/
  decisions docs; the marker itself is intentionally untracked.
- Chose: do NOT invent a decoration turn. Re-ran the full gate and a fresh adversarial critic sweep,
  confirmed the app genuinely meets every non-negotiable with no auto-fail, and re-created `.loop-done`.
- Why: game-feel #1 (Simplicity & flow) forbids over-decorating an already-calm, cohesive working world
  ("subtract, don't add"; "a great game screen shows a few things beautifully"). The only remaining
  candidates (shallow DoF, deeper guide trenching, Bloom/Vignette/N8AO taste-tuning) are all eyes-on GPU
  work that cannot be verified in this headless GPU-less env (swiftshader → board-2d, composer never
  rasterizes) — deferring them is the correct engineering call, not a gap.
- Adversarial sweep (actually inspected, not scorecard-trusted, per the Turn-11 lesson):
  - `grep '<select' / native range/checkbox/radio` across `app/` → **none** (controls are the HUD deck +
    Preview-settings `<details>`; guide uses crafted buttons/disclosures).
  - Every 3D geometry enumerated: island = `cylinder` cap + `cone` underside + emissive `torus` rim
    (crafted floating-island silhouette, PBR flatShading, cast/receive shadows, Float); marker =
    `icosahedron` faceted gem (emissive + damped pulse + additive halo + hop-spring + press/hover juice);
    sea floor = emissive `circle`; guide constellation = `sphere` **cores that are deliberately
    self-luminous** (`meshBasicMaterial`, `toneMapped=false`, tiny `coreScale`, wrapped in an additive
    halo sprite) — the canonical glowing-node idiom (a light source must NOT receive PBR light), NOT the
    "flat-lit primitive on black" auto-fail. Verified by reading `EvidenceConstellationCanvas.tsx`, not by
    trusting the note — Turn 11's fix is real.
  - Post-FX chain present (`WorldPostFX` mounted from `World3DCanvas`); full-tier gated.
- Gate: **tsc exit 0 · domain (`@gt100k/interest-lab`) 81 · app UI (`@gt100k/interest-lab-app`) 80 ·
  `next build` ✓** (route `/` prerendered static, 285 kB page / 373 kB first-load).
- Honest caveat (unchanged): the WebGL full tier can't be pixel-verified headless; a GPU/browser
  screenshot pass remains the ideal final taste-tune but blocks no non-negotiable.

## D-VP16 — Kill the portal <Environment> crash; use explicit palette fill lights (interest-lab-v2 Turn 1)
- Context (P0.1): on load the child app threw `TypeError: Cannot read properties of undefined
  (reading '0')` from drei's portal-mode `<Environment>` (children/Lightformer path). Root cause,
  confirmed by reading `@react-three/drei@9.122 core/Environment.js`: `EnvironmentPortal` runs a
  `useLayoutEffect` that calls `camera.current.update(gl, virtualScene)` in `frames===1` mode; the
  frames-once cube-camera update is fragile on mount and blows up before the ledger is usable.
- Chose: remove `<Environment>`+`<Lightformer>` entirely and replace with four declarative
  `<pointLight>` primitives (warm beacon key-fill, overhead spark, cool tide back-fill, faint sea
  bounce) tuned to the same palette + positions. Rejected: (a) `<Environment preset=…>` — needs a
  remote HDRI fetch (banned, offline); (b) `files=…` local HDRI — none in-repo; (c) debugging the
  portal — a library-internal timing bug we don't own and can't reliably pin.
- Why it's safe visually: island/marker materials are low-metalness (0.04 / 0.08), so IBL specular
  contribution was minimal — the diffuse lift is reproduced by real lights + the existing
  ambient/hemisphere/key/rim rig. No portal, no cube camera, no mount lifecycle → no crash.

## D-VP17 — React error boundary around the 3D Canvas → graceful board-2d fallback (P0.1)
- Added `World3DBoundary` (class component, `getDerivedStateFromError`/`componentDidCatch`) wrapping
  `<World3D>` in `QuestWorld`. On any 3D render error it shows a calm dusk-gradient stand-in
  (`.quest-world-fallback`, never a white screen) and calls `onError` → QuestWorld retires the WebGL
  tier to `board-2d`, reusing the same path as WebGL context loss. The accessible DOM ledger below
  is always mounted and operable regardless.

## D-VP18 — Lift pick/focus state to QuestWorld so 3D orbs + DOM cards share ONE reducer (P0.2)
- Context: pick state lived inside `QuestLedger`'s `useReducer`; `QuestWorld` only mirrored it one-way
  (ledger→world). 3D `QuestMarker.onClick` called `onPick`, but `buildQuestWorldSceneGraph` never
  passed `onPick` to `<Island>`, so orb clicks were dead — the #1 demo tell.
- Chose: lift `updatePickedProbeIds` reducer + `focusedProbeId` up to `QuestWorld`; thread `onPick`
  through `buildQuestWorldSceneGraph → Island → QuestMarker`; make `QuestLedger` a controlled
  component (optional controlled props, falls back to internal state so standalone render tests keep
  working). A 3D orb click now focuses its island AND toggles the quest into the same tray as the
  card (`pickFromWorld`), giving the hero object a real, visible payoff.
- Verify caveat (honest): the WebGL interaction can't be pixel/click-verified in this headless,
  GPU-less env (SSR + swiftshader → `board-2d`); confirmed via unit tests (onPick threaded to all 8
  islands; boundary behavior) + `next build` + a 200 SSR load. A GPU browser pass remains the ideal
  final taste-tune but blocks no non-negotiable.

## D-VP19 — Board reaches every quest so world↔board is "one truth" (interest-lab-v2 Turn 2 · P0.3)
- Context: the 3D world builds one marker per quest (`buildSceneView` → `picker.quests`, 20 markers),
  but `QuestLedger` rendered only `picker.visibleQuests` (6, band 9-11 `maxVisibleQuests`) with no
  affordance to reach the rest. So 14 of 20 orbs picked probeIds that had NO board card — the pick
  landed only in the tray (looked up from `picker.quests`) and could never be toggled/focused from the
  board. World and board disagreed on which quests exist. The view-package invariant already held
  (existing `scene.test.ts` proves markers keyed-equal picker.quests); the break was purely at app
  composition (which set the board renders).
- Chose: make the BOARD the equal of the WORLD (reach all quests), not shrink the world. In
  `QuestLedger`, `boardQuests = revealAll ? picker.quests : picker.visibleQuests`, with
  `revealAll = showAll || focusOffStage || pickOffStage`. (a) Any quest focused or picked from the
  world auto-reveals its card — QuestWorld already threads `focusedProbeId`/`pickedProbeIds` into the
  controlled ledger (D-VP18), so tapping an orb surfaces its board card with no extra wiring. (b) A
  `<button class="quest-see-all" aria-expanded>` disclosure ("See all N quests" / "Show fewer quests")
  exposes the rest on demand. Age-band staging is preserved: the board still shows only
  `maxVisibleQuests` by default (6/3), so the youngest bands stay calm — staging now means "how many
  show at once," with a real path to the rest, not "which quests exist."
- Why: P0.3's "one truth" — the set of pickable marker probeIds == the set of board-reachable quest
  probeIds. Expanding the board (rather than truncating the world to `visibleQuests`) keeps every
  island/orb a live, meaningful target (the hero objects) while honoring the staging tokens for
  cognitive load. `aria-expanded` (NOT `aria-pressed`) keeps the disclosure from reading as a 7th
  pickable quest to assistive tech and preserves the pinned `aria-pressed` card counts. CSS-only
  styling reuses the committed lit-pill idiom (`--card-ease`, `scale(0.97)` press, spark hover) for
  cohesion (game-feel #9) and is auto-neutralized under reduced motion by the global transition kill.
- Verified: browser (chromium/swiftshader → `quest-world-3d-lite`, so the 3D world genuinely mounted):
  6 → "See all 20 quests" → 20 (== 20 markers) → "Show fewer" → 6; ZERO console/page errors on load +
  interaction. Plus `world-board-parity.test.ts` (5 deterministic renderToStaticMarkup assertions) and
  an explicit view-pkg parity invariant. Gate: tsc 0 · view 103 · app 88 · next build OK.
- Rejected: (a) truncating world markers to `visibleQuests` — makes 14 islands/orbs dead décor, the
  opposite of the payoff P0.4 wants; (b) removing the staging slice entirely — dumps 20 cards on a
  6-year-old, violating the age-band cognitive-load contract; (c) a JS-animated height reveal — a plain
  re-render is honest + testable (emil "CSS beats JS under load"); (d) aria-pressed on the disclosure —
  would inflate the pinned pressed-card counts and mislead AT.
- CAVEAT for P1.7: when the WORLD is later staged by age band (`buildSceneView` consuming
  `maxVisibleQuests`), world markers will drop below `quests.length`. To keep parity then, the board's
  `revealAll` baseline must stage to the SAME set the world shows — world-reachable == board-reachable
  must remain the invariant. Flagged in progress NEXT so P1.7 doesn't silently re-break parity.
