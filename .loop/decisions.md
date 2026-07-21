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
