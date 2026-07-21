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
