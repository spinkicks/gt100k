# Tasks: EvidenceGraph

**Input**: Design documents from `specs/002-evidence-graph/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/evidence-graph.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/evidence-graph.md` defines explicit test obligations. Write tests first; ensure they fail before implementing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1 / US2 / US3 (setup, foundational, polish carry no story label)

## Path conventions (from plan.md — TS monorepo)

- Domain: `packages/evidence-graph/src/`, tests `packages/evidence-graph/test/`
- Adapters: `adapters/evidence-hash-node/`, `adapters/evidence-repo-memory/`, `adapters/evidence-verifier-stub/`, `adapters/evidence-deferred/`

## Parallel-safety note (read before starting)

All work lives in **new** directories (`packages/evidence-graph`, `adapters/evidence-*`). The root workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so **do NOT edit** `package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, or `biome.json` at the repo root. The **only** shared-file edit is the final task (`T032`, root `tsconfig.json` references), flagged for a human to reconcile at merge.

---

## Phase 1: Setup (new dirs only)

- [ ] T001 Scaffold the `@gt100k/evidence-graph` package: `packages/evidence-graph/package.json` (name `@gt100k/evidence-graph`, `type: module`, `test: vitest run`), `packages/evidence-graph/tsconfig.json` (extends `../../tsconfig.base.json`), and an empty `packages/evidence-graph/src/index.ts`. Do not touch any shared root file.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T002 [P] Define domain types + PROV mapping in `packages/evidence-graph/src/model.ts` (`NodeType`, `EdgeType`, `ActorKind`, `ActorRef`, `ToolRef`, `ConsentScope`, `EvidenceNode`, `EvidenceEdge`, `EvidenceGraph`, `EvidencePacket`, `Attestation`, `VerificationResult`) per `data-model.md`
- [ ] T003 [P] Define ports in `packages/evidence-graph/src/ports.ts` (`Hasher` [sync], `Verifier` [async], `EvidenceRepository`, plus **deferred stub ports** `TransparencyLog`, `ErasureService` with `InclusionProofStub`/`ErasureTombstoneStub`) per `contracts/evidence-graph.md`
- [ ] T004 [P] Contract test for the Node-crypto `Hasher` (SHA-256 known-answer + determinism; asserts SHA-1/MD5 are NOT used) in `adapters/evidence-hash-node/test/hash.test.ts` *(write first, ensure it fails)*
- [ ] T005 Implement the Node-crypto `Hasher` adapter in `adapters/evidence-hash-node/` (`package.json`, `tsconfig.json`, `src/index.ts` — the only `node:crypto` import in the feature) (depends on T003)
- [ ] T006 [P] Contract test for the in-memory `EvidenceRepository` (save/get node, edge, packet round-trip; deep-copy isolation) in `adapters/evidence-repo-memory/test/repo.test.ts` *(write first, ensure it fails)*
- [ ] T007 Implement the in-memory `EvidenceRepository` adapter in `adapters/evidence-repo-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T002, T003)

**Checkpoint**: domain types, ports, a real hasher, and persistence exist — stories can begin.

---

## Phase 3: User Story 1 — Record work as a content-addressed evidence DAG (Priority: P1) 🎯 MVP

**Goal**: typed nodes/edges recorded as an acyclic, content-addressed DAG (id = hash of canonical content), idempotent by content.

**Independent Test**: add each node/edge type for a synthetic learner → every id equals the hash of its canonical content; re-adding identical content is a no-op; a field change changes the id; a cyclic or dangling edge is rejected.

### Tests (write first, ensure they fail)

- [ ] T008 [P] [US1] Contract test for canonical serialization (key-order/formatting invariance ⇒ identical bytes) in `packages/evidence-graph/test/canonicalize.test.ts` (per `contracts/evidence-graph.md`)
- [ ] T009 [P] [US1] Contract test for `addNode` content-addressing + idempotency (id == hash of canonical content; identical content ⇒ same id, no change; any field change ⇒ new id) in `packages/evidence-graph/test/graph.test.ts` (FR-001/004/005)
- [ ] T010 [P] [US1] Contract test for `addEdge` validation (dangling endpoint rejected; cycle rejected; DAG stays acyclic; all 6 edge types) in `packages/evidence-graph/test/graph-edges.test.ts` (FR-006, SC-002)

### Implementation

- [ ] T011 [US1] Implement `canonicalize(content)` (stable-key canonical encoding over the hashed field subset) in `packages/evidence-graph/src/canonicalize.ts` (depends on T002)
- [ ] T012 [US1] Implement `addNode(graph, content, hasher)` (content-address via injected `Hasher`; idempotent by id) in `packages/evidence-graph/src/graph.ts` (depends on T002, T011, T003)
- [ ] T013 [US1] Implement `addEdge(graph, edge)` with dangling + cycle rejection (acyclic DAG) in `packages/evidence-graph/src/graph.ts` (depends on T012)
- [ ] T014 [US1] Export `model`, `canonicalize`, and `graph` APIs from `packages/evidence-graph/src/index.ts`

**Checkpoint**: the content-addressed DAG works and is unit-tested independently — MVP demonstrable.

---

## Phase 4: User Story 2 — Enforce human authority and the no-accusation rule (Priority: P2)

**Goal**: every grade/judgment `Outcome` is human-owned; a `model` actor authors only `Assistance`/`Review`; no node/edge can encode an AI-authorship accusation.

**Independent Test**: human-owned grade passes; flip to a model actor → fails; model `Assistance`/`Review` passes; an authorship-accusation node → fails.

### Tests (write first, ensure they fail)

- [ ] T015 [P] [US2] Contract test for `assertHumanAuthority` (human grade passes; model-owned grade fails; model `Assistance`/`Review` passes; authorship-accusation rejected; machine-readable reasons) in `packages/evidence-graph/test/invariants.test.ts` (FR-008/FR-009, SC-003)

### Implementation

- [ ] T016 [US2] Implement `assertHumanAuthority(graph)` returning `VerificationResult` (grade→human actor; model→Assistance/Review only; reject authorship-accusation claim kind) in `packages/evidence-graph/src/invariants.ts` (depends on T002, T012)
- [ ] T017 [US2] Export `invariants` from `packages/evidence-graph/src/index.ts`

**Checkpoint**: the constitutional human-authority invariant is enforced by a pure, exhaustively-tested predicate.

---

## Phase 5: User Story 3 — Assemble a verifiable EvidencePacket per milestone (Priority: P3)

**Goal**: assemble a per-milestone `EvidencePacket` with a deterministic Merkle root and an in-toto-style attestation; verify via a deterministic stub `Verifier`; refuse on invariant violation or empty set.

**Independent Test**: assemble a packet from a milestone node set → deterministic Merkle root + attestation binding the artifact digest → stub verifier passes; alter one node → verifier fails; empty set / invariant-violating subgraph → assembly refuses.

### Tests (write first, ensure they fail)

- [ ] T018 [P] [US3] Contract test for `merkleRoot` (determinism across runs; single-node; odd-count rule; leaf/interior domain separation) in `packages/evidence-graph/test/merkle.test.ts` (FR-011, SC-004)
- [ ] T019 [P] [US3] Contract test for `buildAttestation` (in-toto Statement shape binds `subject.digest.sha256` to `predicate.merkleRoot`) in `packages/evidence-graph/test/attestation.test.ts` (FR-012)
- [ ] T020 [P] [US3] Contract test for `assembleEvidencePacket` + `traceEvidence` (deterministic packet for a fixed node set; empty set rejected; invariant-violating subgraph refused; trace returns supporting-only nodes) in `packages/evidence-graph/test/packet.test.ts` (FR-010/FR-014/FR-019)
- [ ] T021 [P] [US3] Contract test for the stub `Verifier` (pass untampered packet; fail after any single node alteration) in `adapters/evidence-verifier-stub/test/verify.test.ts` (FR-013/FR-015, SC-004)

### Implementation

- [ ] T022 [US3] Implement `merkleRoot(hashes, hasher)` (canonical sort; domain-separated leaf `0x00`/interior `0x01`; odd-count promotion) in `packages/evidence-graph/src/merkle.ts` (depends on T003)
- [ ] T023 [US3] Implement `buildAttestation(...)` (in-toto Statement shape; unsigned in this slice, §19.2 D6) in `packages/evidence-graph/src/attestation.ts` (depends on T002)
- [ ] T024 [US3] Implement `assembleEvidencePacket(...)` + `traceEvidence(...)` (Merkle root + ledgers + attestation; runs `assertHumanAuthority`, rejects empty set) in `packages/evidence-graph/src/packet.ts` (depends on T012, T016, T022, T023)
- [ ] T025 [US3] Implement the deterministic stub `Verifier` (re-derive Merkle root, check attestation subject digest) in `adapters/evidence-verifier-stub/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T022, T024)
- [ ] T026 [US3] Export `merkle`, `attestation`, and `packet` APIs from `packages/evidence-graph/src/index.ts`

**Checkpoint**: the full flow (build DAG → enforce invariant → assemble packet → attest → verify) runs headless and is tested end-to-end.

---

## Phase 6: Deferred stubs (§19.2) & Polish

- [ ] T027 [P] Contract test for the deferred stub adapters (`TransparencyLog.anchor`/`verifyInclusion` and `ErasureService.shred` return deterministic placeholders marked `stub: true`; retained-packet-stays-verifiable shape) in `adapters/evidence-deferred/test/stubs.test.ts` *(write first, ensure it fails)*
- [ ] T028 Implement the deferred stub adapters (`TransparencyLog`, `ErasureService`) in `adapters/evidence-deferred/` (`package.json`, `tsconfig.json`, `src/index.ts`), clearly marked **non-production / pre-live gate (§19.2 D1/D2)** (depends on T003)
- [ ] T029 [P] Add `packages/evidence-graph/README.md` (public API + ports usage + explicit "deferred / not production" section for D1–D4/D6)
- [ ] T030 [P] Add an end-to-end `demo` script in `adapters/evidence-repo-memory/src/demo.ts` wiring hasher + repo + graph + invariant + packet + stub verifier for a synthetic milestone (mirrors `quickstart.md`)
- [ ] T031 Run the `quickstart.md` validation end-to-end: `pnpm exec tsc -b` clean, `pnpm exec biome check .` clean, `pnpm --filter @gt100k/evidence-graph test` and workspace Vitest green
- [ ] T032 **[FINAL — the single shared-file touch]** Add composite project references for `packages/evidence-graph` and each `adapters/evidence-*` package to the root `tsconfig.json` `references` array. ⚠️ This is the **only** shared-file edit in the feature; keep it isolated in its own commit so a human reconciles it at merge (parallel-safety flag).

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T007, blocks all stories)** → **US1 (T008–T014)** → **US2 (T015–T017)** → **US3 (T018–T026)** → **Deferred & Polish (T027–T032)**.
- US2 depends on US1 (`assertHumanAuthority` reads the graph/nodes from US1).
- US3 depends on US1 (graph) and US2 (assembly runs the invariant) and the foundational `Hasher`.
- T032 (root `tsconfig.json`) runs **last**; it is the sole shared-file change.

## Parallel Opportunities

- Foundational: T002/T003 in parallel; T004 (hasher test) and T006 (repo test) in parallel; then T005/T007.
- US1: T008/T009/T010 (tests) in parallel before the implementation tasks.
- US3: T018/T019/T020/T021 (tests) in parallel before the implementation tasks.
- Polish: T027, T029, T030 in parallel.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (the content-addressed evidence DAG, tested) → validate → then US2 (the human-authority invariant, the constitutional core) → then US3 (packet + Merkle + attestation + stub verifier). Deferred §19.2 items ship as **marked stubs only**.
- Commit per task or logical group; test-gated; one PR per increment (governed flow). Synthetic-only; no consent/admissions/legal machinery (stubbed field). Do not edit shared root files except the final flagged task.

## Summary

- **Total tasks**: 32 (T001–T032)
- **US1**: 7 (T008–T014) · **US2**: 3 (T015–T017) · **US3**: 9 (T018–T026) · Setup 1 · Foundational 6 · Deferred & Polish 6
- **MVP scope**: Setup + Foundational + US1 (content-addressed evidence DAG).
- **Shared-file touches**: exactly one — T032 (root `tsconfig.json` references), flagged for human merge reconciliation.
