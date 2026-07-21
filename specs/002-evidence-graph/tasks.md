# Tasks: EvidenceGraph

> **One spec home.** **Part I** below is the domain task list (T001–T032, unchanged). **Part II** (folded in
> from the former `explorer/tasks.md`) is the **Provenance Explorer** 3D-UI task list (U0–U7, tasks
> UE001–UE050). See [spec.md](./spec.md) Part I / Part II.

---

# PART I — Domain tasks (`packages/evidence-graph`)

**Input**: Design documents from `specs/002-evidence-graph/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/evidence-graph.md, quickstart.md
**Tests**: INCLUDED — the constitution makes tests part of "done" and `contracts/evidence-graph.md` defines explicit test obligations. Write tests first; ensure they fail before implementing.

**Loop gate**: `pnpm exec tsc -b` + `pnpm test` (Biome clean is part of done). Phases map to the **Build Phasing** section of [spec.md](./spec.md): **P0** = Setup+Foundational (T001–T007), **P1** = US1 (T008–T014), **P2** = US2 (T015–T017), **P3** = US3 (T018–T026), **P4** = deferred stubs + polish + the single shared-file touch (T027–T032).

**Golden values (deterministic acceptance targets)**: the exact SHA-256 node ids and Merkle roots (RFC-6962 raw-byte scheme) are pinned in spec.md **Golden Values** (G1 idA `facecf25…`, G2 3-leaf root `dd67a4e9…`, G3 packet root `3c7f4d3c…`). `golden.test.ts` asserts them with `===` (zero tolerance). Do **not** change the code to new values — match the spec.

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

- [ ] T001 Scaffold the `@gt100k/evidence-graph` package: `packages/evidence-graph/package.json` (name `@gt100k/evidence-graph`, `type: module`, `main`/`types`/`exports` → `./src/index.ts`, `test: vitest run`), `packages/evidence-graph/tsconfig.json` (extends `../../tsconfig.base.json`, `rootDir: "."`, `outDir: "dist"`, include `src`/`test`), and an empty `packages/evidence-graph/src/index.ts`. Do not touch any shared root file.
- [ ] T001a Add the **seeded smoke test** `packages/evidence-graph/test/smoke.test.ts` (imports `../src/index.js`, asserts it is defined) so the gate (`tsc -b` + `vitest`) is green from iteration 1 (SC-011).

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: no user-story work begins until this phase is complete.

- [ ] T002 [P] Define domain types + PROV mapping in `packages/evidence-graph/src/model.ts` (`NodeType`, `EdgeType`, `ActorKind`, `ActorRef`, `ToolRef`, `ConsentScope`, `EvidenceNode`, `EvidenceEdge`, `EvidenceGraph`, `EvidencePacket`, `Attestation`, `VerificationResult`) per `data-model.md`
- [ ] T003 [P] Define ports in `packages/evidence-graph/src/ports.ts` (`Hasher` [sync], `Verifier` [async], `EvidenceRepository`, plus **deferred stub ports** `TransparencyLog`, `ErasureService` with `InclusionProofStub`/`ErasureTombstoneStub`) per `contracts/evidence-graph.md`
- [ ] T004 [P] Contract test for the Node-crypto `Hasher` (SHA-256 known-answer + determinism; asserts SHA-1/MD5 are NOT used) in `adapters/evidence-hash-node/test/hash.test.ts` *(write first, ensure it fails)*
- [ ] T005 Implement the Node-crypto `Hasher` adapter in `adapters/evidence-hash-node/` (`package.json`, `tsconfig.json`, `src/index.ts` — the only `node:crypto` import in the feature) (depends on T003)
- [ ] T006 [P] Contract test for the in-memory `EvidenceRepository` (save/get node, edge, packet round-trip; deep-copy isolation) in `adapters/evidence-repo-memory/test/repo.test.ts` *(write first, ensure it fails)*
- [ ] T007 Implement the in-memory `EvidenceRepository` adapter in `adapters/evidence-repo-memory/` (`package.json`, `tsconfig.json`, `src/index.ts`) (depends on T002, T003)
- [ ] T007a [P] Add in-repo synthetic seed fixtures in `packages/evidence-graph/test/fixtures/` (`goldenArtifact` [G1], `goldenAttempt` [G3], `goldenLeaves` [G2 ha/hb/hc], `syntheticMilestone` [coherent graph + one unrelated island node]) per spec **Seed Fixtures**. Pure TS objects, pseudonymous actors, no PII.

**Checkpoint**: domain types, ports, a real hasher, persistence, and seed fixtures exist — stories can begin.

---

## Phase 3: User Story 1 — Record work as a content-addressed evidence DAG (Priority: P1) 🎯 MVP

**Goal**: typed nodes/edges recorded as an acyclic, content-addressed DAG (id = hash of canonical content), idempotent by content.

**Independent Test**: add each node/edge type for a synthetic learner → every id equals the hash of its canonical content; re-adding identical content is a no-op; a field change changes the id; a cyclic or dangling edge is rejected.

### Tests (write first, ensure they fail)

- [ ] T008 [P] [US1] Contract test for canonical serialization (key-order/formatting invariance ⇒ identical bytes; key-shuffled `goldenArtifact` canonicalizes to the exact golden canonical string) in `packages/evidence-graph/test/canonicalize.test.ts` (FR-004, SC-009)
- [ ] T009 [P] [US1] Contract test for `addNode` content-addressing + idempotency (id == hash of canonical content; identical content ⇒ same id, no graph change; any field change ⇒ new id; a **fake in-test Hasher** works with the domain unchanged, SC-006) in `packages/evidence-graph/test/graph.test.ts` (FR-001/004/005)
- [ ] T010 [P] [US1] Contract test for `addEdge` validation (dangling endpoint rejected; **self-edge** rejected; cycle rejected; DAG stays acyclic under a fuzz of inserts; all 6 edge types accepted) in `packages/evidence-graph/test/graph-edges.test.ts` (FR-006, SC-002)
- [ ] T010a [P] [US1] **Golden** test: `addNode(goldenArtifact)` id === `facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039` (exact) in `packages/evidence-graph/test/golden.test.ts` (FR-020, SC-007)

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

- [ ] T018 [P] [US3] Contract test for `merkleRoot` (determinism across runs; single-node = leaf digest; **RFC-6962 odd-count rule** — lone right-most node promoted unchanged, not duplicated; **second-preimage domain separation** `leaf(x) !== interior(x,x)`; permutation-independence) in `packages/evidence-graph/test/merkle.test.ts` (FR-011/FR-021, SC-004/SC-010)
- [ ] T018a [P] [US3] **Golden** Merkle test in `packages/evidence-graph/test/golden.test.ts`: `merkleRoot([ha])` === `a23bd5b0…`, `merkleRoot([ha,hb])` === `73a57aee…`, `merkleRoot([ha,hb,hc])` === `dd67a4e9…`, and a shuffled input yields the identical 3-leaf root (FR-020, SC-008). ha/hb/hc = `sha256("a"|"b"|"c")` from `goldenLeaves`.
- [ ] T019 [P] [US3] Contract test for `buildAttestation` (in-toto Statement shape binds `subject.digest.sha256` to `predicate.merkleRoot`; golden subject digest `fa6cc759…` for `sha256("gt100k-artifact-v1")`) in `packages/evidence-graph/test/attestation.test.ts` (FR-012)
- [ ] T020 [P] [US3] Contract test for `assembleEvidencePacket` + `traceEvidence` (deterministic packet for a fixed node set; **golden two-node packet root `3c7f4d3c…`**; empty set rejected; invariant-violating subgraph refused; trace of the `syntheticMilestone` `Outcome` returns supporting-only nodes and **excludes the unrelated island node**) in `packages/evidence-graph/test/packet.test.ts` (FR-010/FR-014/FR-019, SC-008/SC-012)
- [ ] T021 [P] [US3] Contract test for the stub `Verifier` (pass untampered packet; fail after any single node alteration → `MERKLE_MISMATCH`; fail on subject-digest mismatch → `SUBJECT_DIGEST_MISMATCH`) in `adapters/evidence-verifier-stub/test/verify.test.ts` (FR-013/FR-015, SC-004)

### Implementation

- [ ] T022 [US3] Implement `merkleRoot(hashes, hasher)` using the **RFC-6962 raw-byte scheme**: decode each hex content hash to its 32 digest bytes, sort ascending by bytes; `leaf=hash(0x00 || digestBytes)`, `interior=hash(0x01 || leftHashBytes || rightHashBytes)` (single prefix bytes, raw-byte concat); odd level promotes the lone right-most node **unchanged** (RFC-6962, never duplicated); single leaf → its leaf digest) in `packages/evidence-graph/src/merkle.ts` — MUST reproduce spec Golden Values (depends on T003)
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
- [ ] T029a [P] End-to-end test `adapters/evidence-repo-memory/test/e2e.test.ts`: build the `syntheticMilestone` graph → `assertHumanAuthority` → `assembleEvidencePacket` → stub `verify` = pass, with **only synthetic inputs and no consent/legal/admissions workflow present** (FR-018, SC-005)
- [ ] T030 [P] Add an end-to-end `demo` script in `adapters/evidence-repo-memory/src/demo.ts` (+ `"demo": "tsx src/demo.ts"` in that package's `package.json`) wiring hasher + repo + graph + invariant + packet + stub verifier for a synthetic milestone (mirrors `quickstart.md`; runnable via `pnpm --filter @gt100k/evidence-repo-memory demo`)
- [ ] T031 Run the `quickstart.md` validation end-to-end: `pnpm exec tsc -b` clean, `pnpm exec biome check .` clean, `pnpm --filter @gt100k/evidence-graph test` and workspace Vitest green
- [ ] T032 **[FINAL — the single shared-file touch]** Add composite project references for `packages/evidence-graph` and each `adapters/evidence-*` package to the root `tsconfig.json` `references` array. ⚠️ This is the **only** shared-file edit in the feature; keep it isolated in its own commit so a human reconciles it at merge (parallel-safety flag).

---

## Dependencies & Execution Order

- **Setup (T001)** → **Foundational (T002–T007, blocks all stories)** → **US1 (T008–T014)** → **US2 (T015–T017)** → **US3 (T018–T026)** → **Deferred & Polish (T027–T032)**.
- US2 depends on US1 (`assertHumanAuthority` reads the graph/nodes from US1).
- US3 depends on US1 (graph) and US2 (assembly runs the invariant) and the foundational `Hasher`.
- T032 (root `tsconfig.json`) runs **last**; it is the sole shared-file change.

## Parallel Opportunities

- Foundational: T002/T003 in parallel; T004 (hasher test) and T006 (repo test) in parallel; T007a (fixtures) alongside; then T005/T007.
- US1: T008/T009/T010/T010a (tests) in parallel before the implementation tasks.
- US3: T018/T018a/T019/T020/T021 (tests) in parallel before the implementation tasks.
- Polish: T027, T029, T029a, T030 in parallel.

## Implementation Strategy

- **MVP = Setup + Foundational + US1** (the content-addressed evidence DAG, tested) → validate → then US2 (the human-authority invariant, the constitutional core) → then US3 (packet + Merkle + attestation + stub verifier). Deferred §19.2 items ship as **marked stubs only**.
- Commit per task or logical group; test-gated; one PR per increment (governed flow). Synthetic-only; no consent/admissions/legal machinery (stubbed field). Do not edit shared root files except the final flagged task.

## Summary

- **Total tasks**: 38 (T001–T032 plus T001a, T007a, T010a, T018a, T029a inserted for smoke, fixtures, and golden/e2e coverage)
- **Setup/Foundational (P0)**: T001, T001a, T002–T007, T007a · **US1 (P1)**: T008–T014 + T010a · **US2 (P2)**: T015–T017 · **US3 (P3)**: T018–T026 + T018a · **Deferred & Polish (P4)**: T027–T032 + T029a
- **MVP scope**: P0 + US1 (content-addressed evidence DAG, golden node id).
- **Golden-value coverage**: T010a (node id), T018a (Merkle roots), T019/T020 (subject digest, packet root) — all exact (`===`, zero tolerance).
- **Shared-file touches**: exactly one — T032 (root `tsconfig.json` references), flagged for human merge reconciliation.

---
---

# PART II — Provenance Explorer tasks (3D "Provenance Observatory")

**Input**: [spec.md](./spec.md) Part II (§U0–§U15), [plan.md](./plan.md) Part II,
[data-model.md](./data-model.md) Part II, [contracts/provenance-explorer.md](./contracts/provenance-explorer.md),
[research.md](./research.md) Part II, [quickstart.md](./quickstart.md) Part II.
**Prerequisites**: the completed Part I domain (`packages/evidence-graph` + adapters) is available and
**unchanged** — this expansion reads it.
**Tests**: INCLUDED — write view-package tests first; ensure they fail before implementing.

**Loop gate**: `pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest, view package). App phases add
`pnpm --filter @gt100k/evidence-explorer build` + the §U11 smoke + the quickstart walkthrough. Phases map to
**§U9 Phasing**: **U0** setup/foundation (UE001–UE012), **U1** 3D constellation MVP (UE013–UE024), **U2**
time-scrub (UE025–UE028), **U3** verify+tamper (UE029–UE035), **U4** inspector+authority (UE036–UE041),
**U5** HUD/legend/filters/trace/plain/tier (UE042–UE046), **U6** polish/a11y/perf (UE047–UE049), **U7**
T-ROOT (UE050).

**Golden values (deterministic acceptance targets)**: exact 2D layout (§U8.1) + 3D layout (§U8.2, ±1e-6),
`resolveMotion` table + `MOTION`/`EASINGS`/`SPRINGS` (§U8.5), `PALETTE`/`TYPOGRAPHY` (§U8.11),
`NODE_BODIES`/`NODE_GLYPHS`/`EDGE_THREADS` (§U8.12), `CAMERA` (§U8.9), `TIERS`/`resolveRenderTier` (§U8.10),
verification-step + `verifyWaveOrder` derivation (§U8.8). Match the spec; the spec is the arbiter.

## Format / conventions

- **[P]**: parallelizable (different files, no incomplete-task dependency). **[Story]**: UX1…UX6.
- View package: `packages/evidence-explorer-view/src/`, tests `packages/evidence-explorer-view/test/`.
- App: `apps/evidence-explorer/`.

## Parallel-safety note (read before starting)

All work lives in **new** directories (`packages/evidence-explorer-view`, `apps/evidence-explorer`). The root
workspace glob + Vitest include already discover them, so **do NOT edit** `package.json`,
`pnpm-workspace.yaml`, `vitest.config.ts`, or `biome.json`, and **do NOT modify** `packages/evidence-graph`,
its adapters, `packages/learning-loop`, or `apps/student-compass`. The **only** shared-file edit is the final
task (UE050, root `tsconfig.json` references), kept as its own isolated change.

---

## Phase U0 — Setup & Foundation (new dirs only)

- [ ] UE001 Scaffold `@gt100k/evidence-explorer-view`: `package.json` (`type:module`, exports → `./src/index.ts`,
  `test:"vitest run"`, dep `@gt100k/evidence-graph:workspace:*`, dev-deps `@gt100k/evidence-hash-node`/
  `@gt100k/evidence-verifier-stub`/`@gt100k/evidence-deferred` `workspace:*`), `tsconfig.json` (extends
  `../../tsconfig.base.json`), empty `src/index.ts`. No shared-root edit.
- [ ] UE002 [P] Define view types in `src/model.ts` per [data-model.md](./data-model.md) Part II (`ExplorerView`,
  `NodeView` (incl. `pos2d`/`pos3d`/`depthRank`/`birthOrder`), `EdgeView`, `ActorChip`, `GrowthTimelineView`/
  `TimelineBeat`, `VerificationView`/`VerifyStep`/`SealState`, `CameraKeyframe`, `RenderTier`/`RenderCaps`,
  `LedgerView`/`LedgerNode`, `MotionSpec`, `Presentation`, `NodeBody`, `NodeGlyph`, `EdgeThreadStyle`).
  Import domain types from `@gt100k/evidence-graph` (never redefine).
- [ ] UE003 [P] Golden art tokens in `src/art.ts`: `PALETTE` + `TYPOGRAPHY` (exact §U8.11).
- [ ] UE004 [P] Golden motion in `src/motion.ts`: `MOTION`, `EASINGS`, `SPRINGS`, `resolveMotion` (exact §U8.5,
  incl. all 3D events + reduced column).
- [ ] UE005 [P] Golden visual language in `src/visual.ts`: `NODE_BODIES`, `NODE_GLYPHS`, `EDGE_THREADS`,
  `resolveNodeBody`/`resolveNodeGlyph`/`resolveNodeColorRole` (exact §U8.12/§U8.3).
- [ ] UE006 [P] Golden camera in `src/camera.ts`: `CAMERA` (keyframes + clamps + lookAhead) + `PARALLAX`
  (exact §U8.9).
- [ ] UE007 [P] Golden tier ladder in `src/tiers.ts`: `TIERS` (capabilities + degrade/recover thresholds) +
  `resolveRenderTier` (exact §U8.10).
- [ ] UE008 [P] Committed synthetic fixture in `src/fixtures/explorer.fixture.ts`: `explorerFixture(hasher)`
  builds the "speaker-v1" milestone (§U7.1 nodes+edges, declaration order fixed) via the
  `@gt100k/evidence-graph` API, assembles the packet, returns `{graph,packet,verifierResult}`; plus
  `applyTamper(fixture)`. Pseudonymous actors, no PII.
- [ ] UE009 Add the **seeded smoke test** `test/smoke.test.ts` (builds the fixture `ExplorerView` with the
  real node hasher; asserts 13 nodes / 12 in-milestone / golden 2D bounds §U8.1 + golden 3D center §U8.2 /
  non-empty growth timeline) so the gate is green from iteration 1 (SC-E15).
- [ ] UE010 Scaffold `@gt100k/evidence-explorer` app: `package.json` (next `^14.2.15` / react `^18.3.1` /
  react-dom + **`motion@^12.0.0`** + **`three@^0.169.0`** + **`@react-three/fiber@^8.17.10`** +
  **`@react-three/drei@^9.114.0`** + **`@react-three/postprocessing@^2.16.3`** + `postprocessing@^6.36.4` +
  deps `@gt100k/evidence-explorer-view`/`@gt100k/evidence-graph`/the three adapters `workspace:*`),
  `next.config.mjs` (`transpilePackages` the view + graph packages), `tsconfig.json` (match
  `apps/student-compass`), `app/layout.tsx`, `app/page.tsx` placeholder, `app/globals.css` (§U8.11 tokens +
  `@media (prefers-reduced-motion)`/`(prefers-reduced-transparency)` + `:focus-visible` rings),
  `next-env.d.ts`, `.env.local.example` (§U11), `.gitignore`.
- [ ] UE011 Skeleton `layoutExplorer2D`/`layoutExplorer3D` + `SHELL_SLOTS` in `src/layout2d.ts`/`src/layout3d.ts`
  and `plainViewEquals`/`buildExplorerView` stub in `src/view.ts`; export the U0 surface from `src/index.ts`.
- [ ] UE012 Verify U0 gate: `pnpm typecheck` + `pnpm test` green; `pnpm --filter @gt100k/evidence-explorer
  build` compiles the placeholder page.

**Checkpoint**: packages/app skeletons compile; golden constants + fixture exist; smoke green.

---

## Phase U1 — 3D constellation (UX1) 🎯 MVP

### Tests first (ensure they fail)

- [ ] UE013 [P] [UX1] `test/layout2d.test.ts`: `layoutExplorer2D` deterministic + golden §U8.1 incl. island;
  x depends only on depthRank (SC-E01).
- [ ] UE014 [P] [UX1] `test/layout3d.test.ts`: `layoutExplorer3D` deterministic + golden §U8.2 (±1e-6) via
  `SHELL_SLOTS`; no `Math.sin`/`cos`; island at `ISLAND` (SC-E16).
- [ ] UE015 [P] [UX1] `test/art.test.ts` + `test/visual.test.ts`: `PALETTE`/`TYPOGRAPHY` exact;
  `NODE_BODIES`/`NODE_GLYPHS`/`EDGE_THREADS` exact; all 8 node → distinct body/glyph/color, all 6 edge →
  distinct thread + label; comet `declaredTag` (SC-E05/E19).
- [ ] UE016 [P] [UX1] `test/mapping.test.ts`: all 8 node + 6 edge types covered with accessible labels; island
  `isInMilestone=false` (SC-E06).
- [ ] UE017 [P] [UX1] `test/tiers.test.ts`: `resolveRenderTier` golden truth table + degrade/recover thresholds
  (SC-E18).
- [ ] UE018 [P] [UX1] `test/camera.test.ts`: `CAMERA` keyframes exact; `focus(node)` derives from
  `node.pos3d + offset`; clamps present (SC-E17).
- [ ] UE019 [P] [UX1] `test/view.test.ts` + `test/motion-tokens.test.ts`: `buildExplorerView` composes one
  view; `plainViewEquals(full, plain)`/`(full, reduced)`/`(full, tier-swapped)` hold; `resolveMotion` golden
  table incl. reduced mode (SC-E02/E03/E04).

### Implementation

- [ ] UE020 [UX1] `src/layout2d.ts` + `src/layout3d.ts`: full deterministic layouts → match goldens.
- [ ] UE021 [UX1] `src/ledger.ts`: `buildLedgerView` (tree accessible names).
- [ ] UE022 [UX1] `src/view.ts`: `buildExplorerView` (nodes+edges+bounds2d/3d+camera+presentation+ledger) +
  `plainViewEquals`; export the U1 API from `src/index.ts`.
- [ ] UE023 [UX1] App: `ObservatoryStage.tsx` (owns the shared `ExplorerView` + presentation; picks the tier
  via `resolveRenderTier`; auto-degrade hook), `Cosmos3D.tsx` (R3F `<Canvas ssr:false>` — procedural
  `bodies.tsx` + light-thread edges + `EffectComposer` bloom/DOF + orbit/dolly/fly-to camera via drei),
  `Starfield.tsx` (seeded three.js `Points`, aria-hidden), `Constellation2D.tsx` (calm-2D SVG fallback +
  `glyphs.tsx`), `Ledger.tsx` (`role="tree"`), wired in `app/page.tsx` (client). Every canvas `aria-hidden`.
- [ ] UE024 [UX1] Verify U1 gate: `next build` + smoke (zero console errors) + walkthrough steps 1, 6. MVP
  demonstrable (incl. reduced-motion → calm 2D and no-WebGL fallback).

---

## Phase U2 — Time-scrub galaxy growth (UX2)

- [ ] UE025 [P] [UX2] `test/timeline.test.ts`: `buildGrowthTimeline` deterministic grouped order + `birthOrder`
  (§U8.7); scrub reveals the right subset; island excluded (SC-E07).
- [ ] UE026 [UX2] `src/timeline.ts`: `buildGrowthTimeline`; fold into `buildExplorerView`.
- [ ] UE027 [UX2] App: `TimeScrub.tsx` — dragging grows the cosmos (bodies ignite in `birthOrder` via
  `resolveMotion("scrubStep")`; threads draw when both endpoints exist); beat→body fly-to; reduced = instant
  per-step; Ledger ordered-list + scrub-position parity.
- [ ] UE028 [UX2] Verify walkthrough step 2.

---

## Phase U3 — Verify light-wave + tamper fracture (UX3)

- [ ] UE029 [P] [UX3] `test/verify-view.test.ts`: `buildVerificationView` steps + `verifyWaveOrder` derived
  from the domain (`merkleRoot`/subject-digest/`assertHumanAuthority`/stub); untampered → `verified`;
  `applyTamper` → `mismatch` with both roots; stub step `nonProduction`; no grade computed (SC-E08/E20). Uses
  the real node hasher + stub verifier + deferred stub adapters.
- [ ] UE030 [P] [UX3] `test/authority-view.test.ts`: grade `Outcome` human-owned with owner; `model` actor
  cited/neutral (comet "Declared"); no accusation field (SC-E09).
- [ ] UE031 [UX3] `src/verify.ts`: `buildVerificationView` + `verifyWaveOrder` + `applyTamper` (reads the
  domain; §U8.8); `ActorChip` tone + `isHumanOwned`/`isCitedAssistance` derivation; fold into
  `buildExplorerView`.
- [ ] UE032 [UX3] App: `VerifyPanel.tsx` — stepped checks (`verifyStep`) + verify light-wave (`verifyWave`,
  order = `verifyWaveOrder`) + Verified ✓ seal-forge (ring Line-draw + Bloom + root Number-ticker via
  `sealForge`/`rootTick`), `aria-live` announce.
- [ ] UE033 [UX3] App: tamper demo in `VerifyPanel`/`Cosmos3D` — byte-body **fracture** (`fracture`) + lineage
  desaturate + root Text-morph diff (`rootDiverge`) + MISMATCH seal (`--tamper`); reduced = static MISMATCH
  chip + diff.
- [ ] UE034 [UX3] Ensure red + fracture appear **only** on the byte-level body + root diff (never on a
  person/Outcome/Assistance); reduced-motion equivalents for both sequences.
- [ ] UE035 [UX3] Verify walkthrough step 3.

---

## Phase U4 — Drill-down inspector + human-authority + cited AI-assist (UX4)

- [ ] UE036 [P] [UX4] `test/ledger.test.ts`: Ledger panel descriptions complete per node (id/actor/tool/
  inputs/timestamp/consent/payload); grade `Outcome` human-owned; model `Assistance` cited (SC-E10).
- [ ] UE037 [UX4] Extend `src/ledger.ts` panels + `NodeView` panel fields.
- [ ] UE038 [UX4] App: `Inspector.tsx` (`motion@12`) — frosted, origin-aware (scale from the body's screen
  position), id (mono, copy), actor kind chip, tool/version, inputs (fly-to links), timestamp, consent scope,
  payload; Materialize open; reduced = fade.
- [ ] UE039 [UX4] App: human-owned seal on a grade `Outcome` seal-sun; neutral "Declared AI assistance —
  cited" ribbon on a model `Assistance`/`Review` comet; **no** accusation affordance anywhere.
- [ ] UE040 [UX4] Ledger inspector parity (described regions).
- [ ] UE041 [UX4] Verify walkthrough step 4.

---

## Phase U5 — HUD, legend, filters, trace, plain mode, tier control (UX5)

- [ ] UE042 [P] [UX5] `test/integration.test.ts`: build the view with the real node hasher + stub verifier;
  domain unchanged; adapter swap needs no view change; `traceEvidence` drives trace (SC-E14).
- [ ] UE043 [P] [UX5] `test/guardrails.test.ts`: view types expose none of price/currency/rank/leaderboard/
  percentile/outOf/streak/countdown/urgency/dropRate/rarity/accusation; no `Math.random` in `src`; no
  `Math.sin`/`Math.cos` in the golden layout path (SC-E11).
- [ ] UE044 [UX5] App: `Hud.tsx` — legend (all 8 bodies + 6 threads, body-icon+color+label), filters by node
  type, "trace from Outcome" (domain `traceEvidence` highlight; Ledger marks the subset), search/focus.
- [ ] UE045 [UX5] App: plain-mode toggle (state-identical, `plainViewEquals`), reduced-motion override
  (system/on/off), **render-tier control** (auto/cinematic/standard3d/calm2d), audio-caption toggle (muted
  default) — presentation-only.
- [ ] UE046 [UX5] Confirm toggles/filters/trace/tier change only presentation flags (state unchanged); verify
  walkthrough steps 5–6.

---

## Phase U6 — Polish, accessibility & the 60fps performance budget

- [ ] UE047 [P] a11y pass: keyboard/switch/screen-reader over the Ledger; visible focus; color-independent
  cues (grayscale check); ≥4.5:1 contrast; every canvas/decorative layer `aria-hidden` (SC-E13).
- [ ] UE048 [P] performance + reduced-motion sweep: 60fps orbit/fly on the min device; auto-degrade
  (cinematic→standard3d→calm2d) when the budget slips; no-WebGL/context-loss → calm 2D with no lost state;
  every motion-table row has a reduced equivalent; only `transform`/`opacity`/`filter` animate in DOM
  (SC-E03/E21/E22).
- [ ] UE049 [P] `packages/evidence-explorer-view/README.md` (public API + "reads the domain, computes no
  grade / no crypto, deterministic layout" note) + app README/demo note (run via the filter); app smoke
  (Playwright): loads `/`, 3D canvas + Ledger mount, zero console errors, reduced-motion toggle, Verify →
  seal + `aria-live`, WebGL-disabled → calm-2D fallback (SC-E12/E22).
- [ ] UE050 **[FINAL — the single shared-file touch]** Add a composite project reference for
  `packages/evidence-explorer-view` to the root `tsconfig.json` `references` array (the app is `noEmit`, like
  `apps/student-compass`, so it needs no reference). Keep this as its own isolated change.

---

## Dependencies & Execution Order (Part II)

- **U0 (UE001–UE012)** → **U1 (UE013–UE024)** → **U2 (UE025–UE028)** → **U3 (UE029–UE035)** → **U4
  (UE036–UE041)** → **U5 (UE042–UE046)** → **U6 (UE047–UE049)** → **U7 (UE050)**.
- App phases depend on the corresponding view-package function landing first.
- UE050 (root `tsconfig.json`) runs **last**; it is the sole shared-file change for the expansion.

## Parallel Opportunities (Part II)

- U0: UE002–UE008 in parallel; then UE009/UE011.
- U1: UE013–UE019 (tests) in parallel before UE020–UE023.
- U3: UE029/UE030 in parallel before UE031–UE034.
- U5: UE042/UE043 in parallel.
- U6: UE047–UE049 in parallel.

## Summary (Part II)

- **Total tasks**: 50 (UE001–UE050).
- **Setup/Foundation (U0)**: UE001–UE012 · **3D constellation MVP (U1)**: UE013–UE024 · **Time-scrub (U2)**:
  UE025–UE028 · **Verify+Tamper (U3)**: UE029–UE035 · **Inspector+Authority (U4)**: UE036–UE041 · **HUD/
  Trace/Plain/Tier (U5)**: UE042–UE046 · **Polish/a11y/perf (U6)**: UE047–UE049 · **T-ROOT (U7)**: UE050.
- **Golden coverage**: UE013 (2D layout), UE014 (3D layout), UE015 (palette/type/bodies/threads), UE017
  (tier ladder), UE018 (camera), UE019 (motion table), UE029 (verification + wave) — all exact against §U8.
- **Shared-file touches**: exactly one — UE050 (root `tsconfig.json` references), isolated.
