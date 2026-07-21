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
