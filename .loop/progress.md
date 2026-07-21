# Loop progress (durable memory the agent maintains each turn)

## NEXT
- Begin P0. Read only the PRD section for the current phase.

## 2026-07-20 — P0 scaffold (T001/T001a)
- Added the `@gt100k/evidence-graph` package scaffold with module/package exports and a composite TypeScript configuration.
- Added the seeded SC-011 smoke test. Confirmed RED on the missing entrypoint, then GREEN after the minimal scaffold.
- Gate evidence: package `tsc -b`, workspace `pnpm typecheck`, workspace `pnpm test` (15/15), and package Biome check all pass.
- Phase status: P0 in progress; T001 and T001a complete. SC-011 is passing.
- Blockers: none.

## NEXT
- T002: define the EvidenceGraph domain types and PROV mapping in `packages/evidence-graph/src/model.ts` per `data-model.md`; acceptance is a strict, framework-agnostic type surface covering every type named by T002 without adding runtime or adapter dependencies.

## 2026-07-20 — P0 domain model (T002)
- Added the complete `EvidenceGraph` domain type surface in `model.ts`, including all node/edge/actor taxonomies, graph and packet records, typed in-toto attestation fields, and `VerificationResult`.
- Added exhaustive W3C PROV base/relation mappings and compile-time coverage so taxonomy omissions fail typechecking.
- Added four focused model acceptance tests. Confirmed RED on the missing model module, then GREEN after the minimal implementation.
- Gate evidence: package composite `tsc -b`, workspace `pnpm typecheck`, workspace `pnpm test` (19/19), and focused Biome check pass.
- Phase status: P0 in progress; T001, T001a, and T002 complete. SC-011 remains passing; T002 supplies the typed foundation for later SCs.
- Blockers: none.

## NEXT
- T003: define `Hasher`, `Verifier`, `EvidenceRepository`, `TransparencyLog`, and `ErasureService` plus the two deferred stub value types in `packages/evidence-graph/src/ports.ts`; acceptance is an exact sync/async port surface per `contracts/evidence-graph.md`, type-tested first, with no adapter or runtime dependencies.

## 2026-07-20 — P0 domain ports (T003)
- Added the `Hasher`, `Verifier`, and `EvidenceRepository` contracts with the spec's exact sync/async method signatures.
- Added the deferred `TransparencyLog` and `ErasureService` seams plus literal-tagged `InclusionProofStub` and `ErasureTombstoneStub` records. The comments mark both seams as pre-live, non-production capabilities.
- Added three port conformance tests. Confirmed RED with the package composite compiler on the missing module, then GREEN after the type-only implementation.
- Gate evidence: workspace `pnpm typecheck`, workspace `pnpm test` (22/22), and `pnpm lint` over `packages adapters apps` pass. A broader `biome check .` still reports pre-existing root-config line-ending diffs and `.claude/workflows/deep-research.js` diagnostics outside this feature's allowed paths.
- Phase status: P0 in progress; T001, T001a, T002, and T003 complete. SC-011 remains passing; T003 establishes the adapter-swap seams required by SC-006.
- Blockers: none within the feature scope.

## NEXT
- T004/T005: write the Node-crypto `Hasher` contract test first, confirm RED on the missing adapter, then add the minimal `adapters/evidence-hash-node` implementation; acceptance is the exact SHA-256 known answer, deterministic 64-character lowercase hex, explicit SHA-1/MD5 rejection, no domain crypto import, and a green workspace gate.

## 2026-07-20 — P0 Node-crypto hasher (T004/T005)
- Added the `@gt100k/evidence-hash-node` adapter package with the feature's sole `node:crypto` import and a synchronous, stateless `NodeCryptoHasher` using SHA-256.
- Added three contract tests for `Hasher` type conformance, the exact `sha256("abc")` known answer, lowercase 64-character hex, explicit SHA-1/MD5 non-matches, and determinism. Confirmed RED on the missing adapter entrypoint before implementation and GREEN afterward.
- Added an adapter-local composite reference so the contract test typechecks against the domain port without touching the root `tsconfig.json` before T032.
- Gate evidence: adapter composite `tsc -b`, workspace `pnpm typecheck`, workspace `pnpm test` (25/25), and `pnpm lint` over `packages adapters apps` pass.
- Phase status: P0 in progress; T001, T001a, and T002–T005 complete. SC-011 remains passing; the real injected hasher foundation for FR-007 and SC-006 now exists.
- Blockers: none.

## NEXT
- T006/T007: write the in-memory `EvidenceRepository` contract test first, confirm RED on the missing adapter, then implement `adapters/evidence-repo-memory`; acceptance is node, edge, and packet save/get round-trips with deep-copy isolation and a green workspace gate.
