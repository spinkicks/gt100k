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

## 2026-07-20 — P0 in-memory evidence repository (T006/T007)
- Added the `@gt100k/evidence-repo-memory` adapter package with an asynchronous `InMemoryEvidenceRepository` implementing the exact domain persistence port.
- Added node and milestone-packet maps plus append-only edge storage, with `structuredClone` isolation on every save and read boundary. Added an adapter-local `getEdges()` inspection seam so T006 can observe edge round-trips without changing the settled domain port.
- Added three synthetic contract tests for port conformance and missing-record behavior, node/edge/packet round-trips, and mutation isolation through both saved inputs and loaded outputs. Confirmed RED on the missing adapter entrypoint, then GREEN after the minimal implementation.
- Gate evidence: adapter composite `tsc -b`, workspace `pnpm typecheck`, workspace `pnpm test` (28/28), and `pnpm lint` over 41 files all pass.
- Phase status: P0 in progress; T001, T001a, and T002–T007 complete. SC-011 remains passing; the swappable persistence foundation for FR-016/SC-006 now exists.
- Blockers: none.

## NEXT
- T007a: add the pure synthetic seed fixtures under `packages/evidence-graph/test/fixtures/` (`goldenArtifact`, `goldenAttempt`, `goldenLeaves`, and `syntheticMilestone` with a coherent graph plus one unrelated island node); acceptance is exact G1/G2/G3 source values, pseudonymous actors only, no PII, and a green workspace gate.

## 2026-07-20 — P0 synthetic seed fixtures (T007a)
- Added pure, in-repo `goldenArtifact`, `goldenAttempt`, and `goldenLeaves` fixtures with the exact G1/G2/G3 source values.
- Added the declarative `syntheticMilestone` seed covering all eight node types, the required provenance relation types, cited model assistance, a human-owned grade, and one edge-free unrelated island. Actor refs are pseudonymous and every consent scope is synthetic.
- Added three fixture acceptance tests. Confirmed RED on the missing seed module, then GREEN after the minimal fixture implementation.
- Gate evidence: workspace `pnpm typecheck`, workspace `pnpm test` (31/31), and `pnpm lint` over 43 files all pass.
- Phase status: P0 complete; T001, T001a, T002–T007, and T007a are complete. SC-011 remains passing, and the deterministic inputs for SC-007/SC-008/SC-012 are now committed.
- Blockers: none.

## NEXT
- T008/T011: write the canonical serialization contract test first, confirm RED on the missing `canonicalize`, then implement the minimal stable-key encoder in `packages/evidence-graph/src/canonicalize.ts`; acceptance is key-order/formatting invariance and the exact G1 canonical string, with a green workspace gate.

## 2026-07-20 — P1 canonical serialization (T008/T011)
- Added the pure `canonicalize` domain function with recursive UTF-16 key ordering, minified JSON output, and omission of undefined optional object fields.
- Added two canonicalization contract tests covering the exact G1 canonical string, nested key-order invariance, and insignificant source-formatting invariance. Confirmed RED on the missing canonicalization module, then GREEN after the minimal implementation.
- Gate evidence: workspace `pnpm typecheck`, workspace `pnpm test` (33/33), and `pnpm exec biome check packages adapters apps` over 45 files all pass.
- Phase status: P1 in progress; T008 and T011 are complete. SC-009 is passing, while T009/T010/T010a and T012–T014 remain.
- Blockers: none.

## NEXT
- T009/T012: write the `addNode` content-addressing and idempotency contract test first, confirm RED on the missing graph API, then implement the minimal `addNode` in `packages/evidence-graph/src/graph.ts`; acceptance is id = hash of UTF-8 canonical content, identical content returns the same id without graph change, any field change returns a new id, a fake injected `Hasher` works unchanged, and the workspace gate stays green.

## 2026-07-20 — P1 content-addressed node insertion (T009/T012)
- Added the pure `addNode` graph transformation, hashing UTF-8 canonical content through the injected `Hasher`, storing new nodes by digest, and preserving the original graph on idempotent re-adds.
- Added nine contract cases covering exact bytes delivered to a fake hasher, digest-keyed retrieval, input immutability, exact no-op identity, and id changes across every hashed top-level field. Confirmed RED on the missing graph module, then GREEN after the minimal implementation.
- Gate evidence: package composite `tsc -b`, workspace `pnpm typecheck`, workspace `pnpm test` (42/42), and `pnpm exec biome check packages adapters apps` over 47 files all pass.
- Phase status: P1 in progress; T008/T009 and T011/T012 are complete. SC-001 is passing, SC-006's fake-hasher seam is covered, and SC-009 remains passing. T010/T010a and T013/T014 remain.
- Blockers: none.

## NEXT
- T010/T013: write the `addEdge` validation contract test first, confirm RED on the missing API, then implement immutable edge insertion in `packages/evidence-graph/src/graph.ts`; acceptance is rejection of dangling, self, and cyclic edges, all six edge types accepted, fuzzed inserts remain acyclic, and the workspace gate stays green.

## 2026-07-20 — P1 validated edge insertion (T010/T013)
- Added the pure, immutable `addEdge` graph transformation with source/target resolution, stable `DANGLING_REF`/`CYCLE` errors, and path-based cycle prevention.
- Added 11 contract cases covering all six edge types, declared actor/tool targets, missing endpoints, self-edges, transitive cycles, input immutability, and 300 deterministic fuzzed insert attempts. Confirmed RED on the missing API, then GREEN after the minimal implementation.
- Gate evidence: package composite `tsc -b`, workspace `pnpm typecheck`, workspace `pnpm test` (53/53), and `pnpm exec biome check packages adapters apps` over 48 files all pass.
- Phase status: P1 in progress; T008–T013 are complete except the separately ordered T010a golden test. SC-001, SC-002, SC-006's fake-hasher seam, and SC-009 are passing; T010a/T014 remain before the P1 checkpoint.
- Blockers: none.

## NEXT
- T010a/T014: write the public-entrypoint golden Artifact test first, confirm RED while the package barrel is still empty, then export the model, canonicalize, and graph APIs from `packages/evidence-graph/src/index.ts`; acceptance is the exact `facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039` id through the public API and a green workspace gate.

## 2026-07-20 — P1 golden value and public API (T010a/T014)
- Added the public-entrypoint G1 golden test for the exact Artifact canonical bytes and `facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039` id.
- Exported the settled model, canonicalization, and graph API from `@gt100k/evidence-graph`. Confirmed RED while the entrypoint was empty, then GREEN after only the required exports.
- Gate evidence: focused golden test (2/2), workspace `pnpm typecheck`, workspace `pnpm test` (55/55), and `pnpm lint` over 49 files all pass.
- Phase status: P1 complete; SC-001, SC-002, SC-007, SC-009, and the content-addressed DAG MVP are passing. P2 is next.
- Blockers: none.

## NEXT
- T015/T016: write the `assertHumanAuthority` contract test first, confirm RED on the missing invariant, then implement the pure domain predicate; acceptance is human-owned grade pass, model-owned grade fail, model `Assistance`/`Review` pass, authorship-accusation rejection, machine-readable reasons, and a green workspace gate.
