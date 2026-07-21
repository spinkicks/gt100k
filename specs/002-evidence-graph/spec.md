# Feature Specification: EvidenceGraph

**Feature Branch**: `002-evidence-graph`

**Created**: 2026-07-20

**Status**: Draft (loop-ready)

**Input**: User description: "A code-first, framework-agnostic core for GT100K's EvidenceGraph (PRD §19): a content-addressed evidence DAG of typed provenance nodes and edges; per-milestone EvidencePacket assembly with a Merkle root and an in-toto-style attestation; deterministic verification behind a port; and the human-authority invariant that every final grade is human-owned and a model output is only a cited Assistance/Review node, never a grade or an authorship accusation. Synthetic-only; consent/legal machinery stubbed; the genuinely-hard parts (external transparency-log anchoring, crypto-shred erasure, comparative-judgment reliability, conformal calibration) are deferred to stubs per §19.2."

> **Loop-ready note (read first).** This spec is written to be built by an autonomous loop whose gate is
> `pnpm exec tsc -b` + `pnpm test`. It pre-answers the decisions (see **Decisions Already Made**), pins the
> stack and commands, gives **exact golden hashes** as deterministic acceptance targets, and states one
> catch-all rule for anything left unsaid (see **Defaults for the Unspecified**). Sections are ordered so the
> agent can read only the phase it is on. **No live child data — SYNTHETIC ONLY.**

---

## Scope Fence *(hard — the loop builds the whole spec; anything vague becomes scope creep)*

### In scope

- A **pure, framework-agnostic TypeScript domain package** `packages/evidence-graph` implementing:
  - the content-addressed DAG (8 node types, 6 edge types) with idempotent inserts, dangling-ref
    rejection, and cycle rejection;
  - deterministic canonical serialization for content hashing;
  - the **human-authority invariant** (`assertHumanAuthority`);
  - deterministic **Merkle root** over a milestone node set;
  - the **in-toto-style attestation** (typed Statement shape, unsigned);
  - **EvidencePacket assembly** (`assembleEvidencePacket`) + reviewer trace (`traceEvidence`).
- **Ports**: `Hasher` (SHA-256), `Verifier` (deterministic stub), `EvidenceRepository` (in-memory), plus
  **deferred stub ports** `TransparencyLog` (§19.2 D1) and `ErasureService` (§19.2 D2).
- **Adapters** (each its own package): `adapters/evidence-hash-node` (Node-crypto SHA-256 — the only crypto
  import), `adapters/evidence-repo-memory` (in-memory store), `adapters/evidence-verifier-stub` (deterministic
  verifier), `adapters/evidence-deferred` (the two §19.2 stubs).
- **Tests as first-class**: unit + contract tests mirroring every FR/SC, including a **golden-value** test
  file that asserts the exact hashes in this spec.
- **In-repo seed fixtures** + a headless `demo` script wiring the full flow for one synthetic milestone.

### Out of scope (deferred to marked stubs — build the seam, not the machine)

- External **transparency-log anchoring** (Trillian/Rekor) — `TransparencyLog` **stub only** (§19.2 D1).
- **Crypto-shred erasure** / per-subject key lifecycle — `ErasureService` **stub only** (§19.2 D2).
- **Cryptographic signing** of the attestation and the attestor key hierarchy (§19.2 D6) — the attestation
  is the typed shape only; the stub verifier checks structure + digests, **not** signatures.

### Non-goals (do NOT build, no interface, no stub)

- Comparative-judgment (ACJ) reliability (§19.2 D3) and conformal-triggered review calibration (§19.2 D4).
- A PROV/RO-Crate/WRROC serializer or exporter (the data-model records the PROV mapping only).
- C2PA / Durable Content Credentials export path (§19.2 D5).
- Any real consent, admissions, legal, safeguarding, or PII workflow (consent scope is a carried stub field).
- Any HTTP/network API, UI/frontend, database, cloud/infra, Go/Rust service, or persistence beyond in-memory.
- Editing any shared repo-root file **except** the single final `tsconfig.json` references task (see Phasing P4).

---

## Build Phasing *(ordered P0…P4 — the agent always has an obvious "next task")*

Each phase ends green under the gate (`tsc -b` + `vitest`). Detailed, numbered tasks live in
[tasks.md](./tasks.md); this is the ordered map and the SC coverage per phase.

### Phase P0 — Setup & Foundational *(blocking; must be green before any story)*

Scaffold `packages/evidence-graph` (+ the four adapter packages), domain **types** and **ports**, the
Node-crypto `Hasher`, the in-memory `EvidenceRepository`, and a **seeded smoke test** so the gate is green
from iteration 1. **Covers**: SC-011 (smoke), foundation for all others. Tasks T001–T007.

### Phase P1 — US1: content-addressed evidence DAG *(MVP)*

`canonicalize`, `addNode` (idempotent, id = hash of canonical content), `addEdge` (dangling + cycle
rejection). **Covers**: SC-001, SC-002, SC-007 (golden node id), SC-009 (canonicalization). Tasks T008–T014.

### Phase P2 — US2: human-authority invariant

`assertHumanAuthority` — grade→human; model→`Assistance`/`Review` only; reject authorship-accusation kind.
**Covers**: SC-003. Tasks T015–T017.

### Phase P3 — US3: verifiable EvidencePacket

`merkleRoot`, `buildAttestation`, `assembleEvidencePacket` + `traceEvidence`, and the stub `Verifier`.
**Covers**: SC-004, SC-008 (golden Merkle roots), SC-010 (second-preimage separation), SC-012 (trace).
Tasks T018–T026.

### Phase P4 — Deferred stubs (§19.2), polish, and the single shared-file touch

The `TransparencyLog`/`ErasureService` stubs, README, `demo` script, full quickstart run, and — **last** —
adding composite project references to the root `tsconfig.json`. **Covers**: SC-005 (full flow), SC-006
(adapter swap + stubs marked non-production). Tasks T027–T032.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Record work as a content-addressed evidence DAG (Priority: P1)

A learner's work produces a trail of provenance: an artifact is created, an attempt runs against a declared plan, a claim is made, help is received, a review happens. The system records each of these as a **typed node** (`Artifact`, `Attempt`, `Transformation`, `Claim`, `Assistance`, `Review`, `Contribution`, `Outcome`) carrying a content hash, the actor, the tool/version involved, its inputs, a timestamp, and a consent scope, and links them with **typed edges** (`derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, `released_as`). Each node is addressed by the hash of its own content, so identical content yields the same id and any change to content changes the id. The graph must stay acyclic (evidence derives from prior evidence, never from itself).

**Why this priority**: The content-addressed DAG is the atomic substrate of the whole feature — the packet, the Merkle root, the attestation, and the human-authority invariant all read this graph. It is the smallest thing that is independently demonstrable ("provenance is captured and tamper-evident at the node level") and everything else builds on it.

**Independent Test**: Add each node type and edge type for a synthetic learner, confirm every node's id equals the content hash of its canonical content, confirm re-adding identical content is a no-op (same id), confirm mutating any field changes the id, and confirm an edge that would introduce a cycle is rejected.

**Acceptance Scenarios**:

1. **Given** an empty graph, **When** an `Artifact` node is added with an actor, tool/version, inputs, timestamp, and consent scope, **Then** the node's id equals the content hash of its canonicalized content and the node is retrievable by that id.
2. **Given** an `Artifact` already in the graph, **When** a second node with byte-identical content is added, **Then** it resolves to the same id and the graph is unchanged (content-addressing is idempotent).
3. **Given** an `Attempt` node, **When** a single field (e.g. timestamp) differs, **Then** it produces a different id.
4. **Given** two nodes A and B with an edge `A derived_from B`, **When** an edge `B derived_from A` is added, **Then** the graph rejects it as a cycle.
5. **Given** an edge referencing a node id not present in the graph, **When** it is added, **Then** the graph rejects it as a dangling reference.
6. **Given** the fixed **golden Artifact fixture** (below), **When** its id is computed, **Then** the id equals the golden value `facecf25…568a9039` byte-for-byte (deterministic acceptance target).

### User Story 2 - Enforce human authority and the no-accusation rule (Priority: P2)

The graph must encode GT100K's non-negotiable authority rule (Constitution I/IV; PRD §19): every final grade or non-deterministic judgment (`Outcome`) is owned by a **named human**, and a **model** actor's output may appear only as a cited `Assistance` or `Review` node — never as a grade, judgment, or an AI-authorship accusation. The system provides a validation pass that accepts a compliant graph/packet and rejects any graph that records a model-authored grade or any node that encodes an automated authorship accusation.

**Why this priority**: This is the constitutional heart of EvidenceGraph and cheap to encode once the node model exists (US1). Building it early means every later artifact (packets, attestations) is validated against it by construction rather than retrofitted.

**Independent Test**: Construct a graph where an `Outcome` grade is attributed (`authored_by`) to a human actor → passes; flip the same `Outcome` to a model actor → rejected; add a node that encodes an authorship accusation → rejected; confirm a model-authored `Assistance`/`Review` node is accepted.

**Acceptance Scenarios**:

1. **Given** an `Outcome` node representing a final grade with an `authored_by` edge to a `human` actor, **When** the human-authority check runs, **Then** it passes.
2. **Given** an `Outcome` node representing a final grade attributed to a `model` (or with no human owner), **When** the check runs, **Then** it fails with a specific, machine-readable violation.
3. **Given** an `Assistance` or `Review` node authored by a `model` actor, **When** the check runs, **Then** it passes (model output is admissible only as cited supporting evidence).
4. **Given** any node or edge that encodes an AI-authorship accusation (a prohibited claim kind), **When** the check runs, **Then** it fails; the system never records an automated authorship accusation.
5. **Given** a `Contribution` or `Assistance` node, **When** it is recorded, **Then** it discloses assistance/lineage without asserting authorship of the learner's work.

### User Story 3 - Assemble a verifiable EvidencePacket per milestone (Priority: P3)

At a milestone, the system assembles an `EvidencePacket` from the milestone's nodes: it computes a **Merkle root** over the node hashes (deterministically ordered), records artifact and source hashes, failed branches, an assistance ledger, a contribution map, review anchors, and outcomes, and emits an **in-toto-style attestation** as a typed record binding the packet's subject (artifact digest) to the Merkle root. A `Verifier` port with a **deterministic stub adapter** re-derives the Merkle root and checks the attestation's subject digests, returning a pass/fail result. External transparency-log anchoring and the real WASI verifier are deferred (§19.2 D1) and represented by stubs.

**Why this priority**: The packet is the milestone deliverable that binds claims to an exact release, but it composes US1 (the graph) and US2 (the invariant) and is the largest chunk, so it ranks last while still completing the end-to-end story.

**Independent Test**: Assemble a packet from a set of milestone nodes, confirm the Merkle root is deterministic and recomputable, confirm the attestation subject digest matches the released artifact, run the stub verifier to get a pass, then tamper with one node's content and confirm the verifier fails.

**Acceptance Scenarios**:

1. **Given** a set of milestone nodes, **When** a packet is assembled twice from the same nodes, **Then** both packets produce byte-identical Merkle roots (deterministic ordering).
2. **Given** an assembled packet, **When** the stub verifier runs, **Then** it re-derives the Merkle root, confirms the attestation subject digest, and returns pass.
3. **Given** an assembled packet, **When** any node's content is altered after assembly, **Then** re-verification fails (tamper-evident relative to the committed root).
4. **Given** a milestone whose graph violates the human-authority invariant (US2), **When** packet assembly runs, **Then** assembly refuses to produce a packet.
5. **Given** the deferred transparency-log and erasure capabilities, **When** their stub ports are invoked, **Then** they return deterministic placeholder results and are clearly marked not-production (pre-live gate, §19.2 D1/D2).
6. **Given** the fixed **golden leaf set** `{sha256("a"), sha256("b"), sha256("c")}`, **When** the Merkle root is computed, **Then** it equals the golden value `dd67a4e9…45ca647b`, and computing over any permutation of the same set yields the identical root (canonical ordering).

### Edge Cases

- **Canonicalization**: two logically-equal node contents that differ only in key ordering or insignificant formatting MUST canonicalize to the same bytes and thus the same id.
- **Duplicate insert**: re-adding byte-identical content is a no-op returning the existing id; the node count and edge list are unchanged (idempotency).
- **Dangling reference**: an edge (or a node `inputs[]` entry) pointing at an id not in the graph is rejected at insert time.
- **Cycle**: any edge whose addition would make the directed graph cyclic is rejected at insert time; the graph is never allowed to enter a cyclic state.
- **Self-edge**: an edge whose `from` equals `to` is a trivial cycle and is rejected.
- **Odd node counts in the Merkle tree**: the tree follows the **RFC-6962** rule — when a level has an odd number of nodes, the lone right-most node is **promoted unchanged** to the next level (it is **NOT** duplicated). The root is well-defined for any node count, including a single-node packet (root = that node's leaf digest).
- **Empty packet**: assembling a packet from zero nodes is rejected (a milestone must bind at least one node).
- **Second-preimage separation**: leaf and interior Merkle hashing use RFC-6962 domain separation over **raw bytes** (leaf prefix byte `0x00`, interior prefix byte `0x01`) so a leaf digest can never be reinterpreted as an interior digest for the same input.
- **Tamper detection**: altering any bound node's content after assembly changes its content hash, so the re-derived Merkle root no longer matches the committed root and verification fails.
- **Consent scope (stubbed)**: nodes carry a consent-scope field, but no real consent/legal workflow is evaluated in this slice; synthetic values only.
- **Erasure vs. integrity (deferred)**: the crypto-shred workflow is a stub; the slice only asserts the *shape* that a future shred must preserve (hashes/roots stay verifiable), not the real key lifecycle (§19.2 D2).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST represent an evidence graph as a **content-addressed DAG** of typed nodes and typed edges, where each node's id is the content hash of its canonicalized content.
- **FR-002**: The system MUST support the node types `Artifact`, `Attempt`, `Transformation`, `Claim`, `Assistance`, `Review`, `Contribution`, and `Outcome`, and the edge types `derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, and `released_as` (PRD §19).
- **FR-003**: Each node MUST record a content hash (its id), an actor, an optional tool/version, its inputs, a timestamp, and a consent scope, modeled as a domain extension of W3C PROV (`Entity`/`Activity`/`Agent`) rather than a bespoke ontology (PRD §19, STD-03).
- **FR-004**: Content addressing MUST be **deterministic and canonical**: logically-equal content MUST produce the same id, and any change to content MUST produce a different id. The canonical serialization is **RFC 8785 JCS** over the hashed field subset (see Decisions Already Made).
- **FR-005**: Adding a node whose content id already exists MUST be idempotent (a no-op returning the existing id; node count and edges unchanged).
- **FR-006**: The graph MUST reject an edge that references a missing node (dangling reference), MUST reject a self-edge, and MUST reject any edge that would introduce a cycle (the DAG stays acyclic).
- **FR-007**: All hashing MUST occur behind a `Hasher` **port** (SHA-256), keeping the domain package pure (no I/O, no direct crypto import); a Node-crypto adapter provides the real implementation. SHA-1 and MD5 are forbidden (PRD §19).
- **FR-008**: The system MUST enforce the **human-authority invariant**: every `Outcome` representing a final grade or non-deterministic judgment MUST be attributed (`authored_by`) to a **named human** actor; no `model` actor may own a grade or judgment (Constitution I/IV; PRD §19).
- **FR-009**: A `model` actor's output MUST be admissible only as an `Assistance` or `Review` node (cited supporting evidence); the system MUST NOT record any node or edge that constitutes an automated **AI-authorship accusation** (Constitution IX; PRD §4.7/§19).
- **FR-010**: The system MUST assemble an `EvidencePacket` for a milestone containing artifact/source hashes, a **Merkle root** over its node hashes, failed branches, an assistance ledger, a contribution map, review anchors, and outcomes (PRD §19, §28 `EvidencePacket`).
- **FR-011**: The Merkle root MUST be computed **deterministically** using the **RFC-6962 raw-byte scheme**: leaves are the per-node 32-byte SHA-256 content-hash digests (raw bytes), ordered by ascending byte value of the digest (equivalently, ascending lexicographic over the lowercase-hex ids); `leaf = SHA-256(0x00 || digestBytes)` and `interior = SHA-256(0x01 || leftHashBytes || rightHashBytes)`; and the RFC-6962 odd-count rule (promote the lone right-most node **unchanged** up a level, never duplicate it) — so the same node set always yields the same root regardless of input order.
- **FR-012**: The system MUST emit an **in-toto-style attestation** as a typed record that binds the packet subject (released artifact digest) to the Merkle root and predicate metadata (builder, materials, milestone) (PRD §19, STD-05).
- **FR-013**: Verification MUST occur behind a `Verifier` **port**; a **deterministic stub adapter** MUST re-derive the Merkle root and check the attestation subject digest, returning a pass/fail result (real WASI verifier deferred, §19.2).
- **FR-014**: Packet assembly MUST refuse to produce a packet when the milestone graph violates the human-authority invariant (FR-008/FR-009), and MUST reject an empty node set.
- **FR-015**: Verification MUST be **tamper-evident** relative to the committed Merkle root: altering any node's content after assembly MUST cause re-verification to fail.
- **FR-016**: All I/O MUST sit behind ports with in-memory/stub adapters: an `EvidenceRepository` (node/edge/packet persistence) with an in-memory adapter, plus the `Hasher` and `Verifier` ports above. The domain package stays framework-agnostic and side-effect-free.
- **FR-017**: The following genuinely-hard capabilities MUST be represented as **stub interfaces only** and clearly marked as pre-live gates, not production: external transparency-log anchoring (`TransparencyLog`, §19.2 D1) and crypto-shred erasure (`ErasureService`, §19.2 D2). Comparative-judgment reliability (§19.2 D3), conformal calibration (§19.2 D4), durable public-export provenance (§19.2 D5), and attestation signing (§19.2 D6) are explicitly out of scope for this slice (no interface required; signing noted on the attestation shape).
- **FR-018**: The feature MUST be exercisable end-to-end with **synthetic data only**; no real consent, legal, admissions, or PII workflow is implemented (consent scope is a stubbed field), and none is required to run the slice.
- **FR-019**: The system MUST expose enough of the packet/attestation/graph that a reviewer can trace a public `Claim`/`Outcome` back to its supporting private nodes via edges, without the domain exposing unrelated nodes (reviewer-traceability shape; PRD §19.1).
- **FR-020**: The domain MUST reproduce the **golden values** pinned in this spec (node ids and Merkle roots) **byte-for-byte**; a golden-value test file asserts each. These are the loop's deterministic acceptance targets (any deviation is a build failure, not a judgment call).
- **FR-021**: Leaf and interior Merkle hashing MUST be **domain-separated** via the RFC-6962 prefix bytes (`0x00` for leaves, `0x01` for interior nodes) such that, for any input `x`, `leaf(x) ≠ interior(x, x')` for all `x'` (no second-preimage collision between tree levels).

### Key Entities *(include if feature involves data)*

- **EvidenceNode**: A content-addressed provenance record of one of eight types, carrying id (= content hash), actor, optional tool/version, inputs, timestamp, consent scope, and a type-specific payload. Maps to a PROV `Entity`/`Activity`/`Agent`.
- **EvidenceEdge**: A typed, directed relation (`derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, `released_as`) between two node ids; maps to a PROV relation.
- **ActorRef**: The actor of a node with an explicit `kind` (`human` | `model` | `tool` | `system`) and a pseudonymous reference; the `kind` drives the human-authority invariant.
- **ToolRef**: A tool/toolchain reference with name and version (used by `used_tool` and node provenance).
- **ConsentScope**: A stubbed PROV-style scope field on each node (synthetic-only in this slice; no real consent evaluation).
- **EvidenceGraph**: The acyclic collection of nodes and edges with content-addressed lookup and cycle/dangling-edge rejection.
- **EvidencePacket**: A per-milestone bundle: subject artifact digest, node set, Merkle root, assistance ledger, contribution map, review anchors, failed branches, outcomes, and the attestation.
- **Attestation**: An in-toto-style typed record (`_type`, `predicateType`, `subject` with digests, `predicate` with builder/materials/merkleRoot/milestone).
- **VerificationResult**: The pass/fail value object returned by the `Verifier` port and by `assertHumanAuthority`, with machine-readable reasons.

## Success Criteria *(mandatory — machine-checkable; each maps to a concrete test)*

### Measurable Outcomes

Every SC below is asserted by a named test file. "Done" = the gate (`tsc -b` + `vitest`) is green with all
these tests present and passing. Tolerance for all hash/root comparisons is **exact byte-for-byte equality
(zero tolerance)** — SHA-256 output is exact.

| SC | Statement | FR(s) | Test file → assertion |
|---|---|---|---|
| **SC-001** | For any node, id == hash of canonicalized content; re-adding byte-identical content yields the same id with **no** graph change, in **100%** of cases. | FR-001/004/005 | `packages/evidence-graph/test/graph.test.ts` → id equals `hasher.hash(canonicalize(content))`; second add is a no-op (same id, same node count). |
| **SC-002** | Every attempt to add a cyclic, self, or dangling edge is rejected; the graph is acyclic in **100%** of runs. | FR-006 | `packages/evidence-graph/test/graph-edges.test.ts` → dangling/self/cycle each throw or return a rejection; acyclic invariant holds after a fuzz of inserts. |
| **SC-003** | A human-owned grade passes; any model-owned grade and any authorship-accusation node is rejected — **0** model-owned grades and **0** authorship accusations recordable. | FR-008/009 | `packages/evidence-graph/test/invariants.test.ts` → human grade `ok:true`; model grade `ok:false` with reason; model `Assistance`/`Review` `ok:true`; accusation kind `ok:false`. |
| **SC-004** | Merkle root for a fixed node set is identical across repeated assembly runs; the stub verifier returns pass for an untampered packet and fail for a packet with any single altered node, in **100%** of cases. | FR-011/013/015 | `packages/evidence-graph/test/merkle.test.ts` + `adapters/evidence-verifier-stub/test/verify.test.ts` → root stable across N runs; verify pass then fail after mutation. |
| **SC-005** | The full flow (build graph → enforce invariant → assemble packet → attest → verify) runs end-to-end for a synthetic milestone with **no** consent/legal/admissions workflow present. | FR-018 | `adapters/evidence-repo-memory/test/e2e.test.ts` (+ `demo`) → the pipeline runs and verifies with only synthetic inputs. |
| **SC-006** | Swapping the `Hasher`, `Verifier`, or `EvidenceRepository` adapter requires **no** change to the domain package; the deferred `TransparencyLog`/`ErasureService` stubs are invocable and clearly marked non-production. | FR-016/017 | `adapters/evidence-deferred/test/stubs.test.ts` → stubs return `stub:true` placeholders; domain functions accept any port implementation (fake hasher test in `graph.test.ts`). |
| **SC-007** | The golden Artifact fixture's id equals `facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039` exactly. | FR-004/020 | `packages/evidence-graph/test/golden.test.ts` → `addNode(GOLDEN_ARTIFACT)` id === golden idA. |
| **SC-008** | The golden Merkle roots (1-leaf, 2-leaf, 3-leaf, and permutation-independence) equal the exact values in **Golden Values**. | FR-011/020 | `packages/evidence-graph/test/golden.test.ts` → `merkleRoot([ha])`, `[ha,hb]`, `[ha,hb,hc]`, and a shuffled input all match the pinned roots. |
| **SC-009** | Two node contents differing only in key order canonicalize to identical bytes and the same id. | FR-004 | `packages/evidence-graph/test/canonicalize.test.ts` → key-shuffled object canonicalizes to the exact golden canonical string; ids equal. |
| **SC-010** | Leaf and interior digests are domain-separated: for the golden leaves, `leaf(x) ≠ interior(x,x)`. | FR-021 | `packages/evidence-graph/test/merkle.test.ts` → asserts `leaf(ha) !== interior(ha,ha)` and prefix bytes differ. |
| **SC-011** | A **seeded smoke test** passes from iteration 1, proving the workspace builds and Vitest discovers the new packages. | (gate) | `packages/evidence-graph/test/smoke.test.ts` → `expect(true).toBe(true)` plus an import of the package entrypoint. |
| **SC-012** | `traceEvidence(graph, outcomeId)` returns exactly the supporting nodes reachable along provenance edges and **no** unrelated node. | FR-019 | `packages/evidence-graph/test/packet.test.ts` → trace of the golden milestone returns the expected id set; an unrelated island node is absent. |

## Golden Values *(deterministic acceptance targets — exact, zero tolerance)*

These are the loop's ground truth. They were computed from the **pinned scheme** (see Decisions Already
Made): node id = `sha256_hex(utf8(JCS(content)))`; Merkle via the **RFC-6962 raw-byte scheme** over the
per-node 32-byte SHA-256 digests (decode the hex ids to bytes), leaves ordered by ascending digest bytes:
`leaf = sha256(0x00 || digestBytes)` and `interior = sha256(0x01 || leftHashBytes || rightHashBytes)`, where
`||` is **raw-byte concatenation** and `0x00`/`0x01` are single prefix **bytes** (not ASCII characters). On an
odd count at any level the lone right-most node is **promoted unchanged** (RFC-6962; never duplicated). All hex
is lowercase. Reproduce these before trusting an implementation.

### G1 — Golden Artifact node id (canonicalization + content-addressing)

Canonical JCS bytes (exact string, no whitespace, keys sorted ascending, optional fields omitted):

```json
{"actor":{"kind":"human","ref":"learner-synthetic-001"},"consentScope":{"scope":"synthetic"},"inputs":[],"payload":{"title":"hello world"},"timestamp":"2026-01-01T00:00:00.000Z","tool":{"name":"gt100k-editor","version":"0.1.0"},"type":"Artifact"}
```

- **idA (node id)** = `sha256_hex(<the string above>)` =
  `facecf25460fedd81070a1194f25639af9561cd6190d829739f4af21568a9039`
- Property: any object with the same logical content but shuffled key order MUST canonicalize to the **same**
  string above and therefore the same idA (SC-009).

### G2 — Golden Merkle roots (well-known leaves, easy to reproduce by hand)

Leaves are the SHA-256 of the single ASCII letters `"a"`, `"b"`, `"c"` (standard, widely-tabulated values):

| Symbol | Value |
|---|---|
| `ha = sha256("a")` | `ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb` |
| `hb = sha256("b")` | `3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d` |
| `hc = sha256("c")` | `2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6` |

Leaf digests (`leaf(h) = sha256(0x00 || bytes(h))`, i.e. hash of the `0x00` byte followed by the 32 raw
digest bytes of `h`):

| Symbol | Value |
|---|---|
| `leaf(ha)` | `a23bd5b06da9048238a65b3f1d9d0b9e15fae3dde262688e6489aa4c763d1820` |
| `leaf(hb)` | `a0d9f0a50b35b9f7d7edc57fb64f4771ddef0fefeaca4e6f949a1514db5b136d` |
| `leaf(hc)` | `6a3fc11b79f836bda340e75c8906e961b8adf4d6a08a2b992e3f38cd6ff38ebf` |

Roots (inputs are sorted ascending **inside** `merkleRoot`, so input order does not matter):

| Case | Sorted order used | Root |
|---|---|---|
| **1 leaf** `[ha]` | `[ha]` → root = `leaf(ha)` | `a23bd5b06da9048238a65b3f1d9d0b9e15fae3dde262688e6489aa4c763d1820` |
| **2 leaves** `[ha,hb]` | `[hb, ha]` (3e… < ca…) | `73a57aee9ae28c072b7e0ed9b56a57a69cc6fb048a723d7f052177084d1250ee` |
| **3 leaves** `[ha,hb,hc]` | `[hc, hb, ha]` (2e… < 3e… < ca…) | `dd67a4e94fcb4fff954bcb093257364a5b5d0832bda9ffb7a5b6340e45ca647b` |
| **3 leaves, shuffled** `[hc,hb,ha]` | same sorted `[hc, hb, ha]` | `dd67a4e94fcb4fff954bcb093257364a5b5d0832bda9ffb7a5b6340e45ca647b` (identical → SC-008) |

Worked 3-leaf derivation (RFC-6962: `k` = largest power of two `< n`; for `n=3`, `k=2`, so the left subtree
covers the first two leaves and the lone third leaf is **promoted unchanged**, not duplicated):

- `L = interior(leaf(hc), leaf(hb))` = `291208811668f898eaaa99780c66db0f4cfd2e5b36f6c03fdca445fdec208cf0`
- `R = leaf(ha)` (promoted unchanged — **not** `interior(leaf(ha), leaf(ha))`) = `a23bd5b06da9048238a65b3f1d9d0b9e15fae3dde262688e6489aa4c763d1820`
- `root = interior(L, R)` = `dd67a4e94fcb4fff954bcb093257364a5b5d0832bda9ffb7a5b6340e45ca647b`

### G3 — Golden two-node packet (end-to-end sanity)

- Second node canonical JCS bytes (an `Attempt`):

```json
{"actor":{"kind":"system","ref":"runner-synthetic-001"},"consentScope":{"scope":"synthetic"},"inputs":[],"payload":{"success":"true"},"timestamp":"2026-01-01T00:05:00.000Z","tool":{"name":"gt100k-runner","version":"0.1.0"},"type":"Attempt"}
```

- **idB** = `41168c66e8c868b8cf6e8eed82b49c17e32572143cbfdfe526e0f8a166a23f34`
- **Packet Merkle root** over `{idA, idB}` (sorted `[idB, idA]`, since `4116…` < `face…`; RFC-6962 raw-byte
  scheme = `interior(leaf(bytes(idB)), leaf(bytes(idA)))`) =
  `3c7f4d3c2a824ad9df7bbf211d8ebd3f1e2086ce2f5b0aea27f8bc994dea441c`
- **Golden subject digest** (attestation subject; `sha256("gt100k-artifact-v1")`) =
  `fa6cc759cb3564394df561e6d4d2e9fe9ad76568ee10e37d22a83539bc3f6958`

**Tolerance policy**: all of the above are compared with `===` (exact). There is no numeric tolerance —
SHA-256 is exact; a mismatch means the canonicalization or Merkle implementation diverged from the pinned
scheme and MUST be fixed to match these values (the values are the spec, not the code).

## Decisions Already Made *(do not re-open — highest-leverage anti-question section)*

- **Language/stack**: strict TypeScript, ESM (`"type":"module"`), Node.js LTS. `tsconfig.base.json` is
  inherited (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`). Package manager is
  **pnpm** (`pnpm@9.15.9`, per root `package.json`).
- **Hash algorithm**: **SHA-256**, lowercase hex output, behind the `Hasher` port. SHA-1/MD5 forbidden
  (PRD §19). BLAKE3 is an allowed *future* alternative but is **not** used here.
- **`Hasher` shape**: `hash(input: Uint8Array): string` — **synchronous, pure**, returns lowercase hex. The
  domain never imports `node:crypto`; only `adapters/evidence-hash-node` does.
- **Canonical serialization**: **RFC 8785 (JCS)** — UTF-8, object keys sorted ascending by UTF-16 code unit,
  minified (no insignificant whitespace). The hashed content is **all node fields except `id`**; **absent
  optional fields are omitted** (never serialized as `null`). Fixtures use only strings/arrays/objects (no
  numbers/booleans/null) so the canonical form is unambiguous and matches the golden bytes above.
- **Node id**: `id = hasher.hash(utf8Bytes(JCS(contentWithoutId)))`.
- **Merkle scheme**: **RFC-6962 (Certificate Transparency) raw-byte scheme** — operates on **raw bytes**, not
  hex strings. Leaves are the per-node 32-byte SHA-256 content-hash digests (decode the hex node-ids to bytes),
  sorted ascending by digest bytes. `leaf = sha256(0x00 || digestBytes)` and
  `interior = sha256(0x01 || leftHashBytes || rightHashBytes)`, where `||` is raw-byte concatenation and
  `0x00`/`0x01` are single prefix **bytes**. Single leaf → its leaf digest is the root; on an odd count at any
  level the lone right-most node is **promoted unchanged** (RFC-6962 rule: `k` = largest power of two `< n`),
  **never duplicated**. *Interop rationale*: RFC-6962 is the industry-standard Merkle construction used by
  Certificate Transparency, Trillian, and the sigstore/Rekor transparency logs that §19.2 D1 will anchor to;
  adopting it now (instead of the earlier homemade hex-string-concatenation scheme) means the deferred
  transparency-log integration and any external verifier can re-derive and check our roots with off-the-shelf
  tooling, with no bespoke re-implementation. The node-id computation is unchanged (RFC-8785/JCS → SHA-256).
- **Attestation**: in-toto **Statement** shape (`_type`, `predicateType`, `subject[].digest.sha256`,
  `predicate{builder, materials[], merkleRoot, milestoneRef}`) as a typed record. **Unsigned** in this slice
  (signing deferred, §19.2 D6). The stub verifier checks structure + subject digest + Merkle re-derivation
  only — never signatures.
- **`Verifier` shape**: `verify(packet, hasher): Promise<VerificationResult>` (async port; deterministic stub
  adapter).
- **`EvidenceRepository` shape**: `saveNode`, `getNode`, `saveEdge`, `savePacket`, `getPacket` — all async;
  in-memory adapter uses deep-copy isolation so callers can't mutate stored state.
- **Deferred stub ports**: `TransparencyLog.anchor(root)→InclusionProofStub` /
  `verifyInclusion(root, proof)→boolean`; `ErasureService.shred(subjectKeyRef)→ErasureTombstoneStub`. Both
  return deterministic placeholders tagged `stub: true`, clearly marked non-production (§19.2 D1/D2).
- **PROV mapping only**: the node/edge taxonomy is a documented PROV extension; **no** PROV/RO-Crate serializer
  ships in this slice.
- **Human-authority invariant** lives in the **domain** (`assertHumanAuthority`), not at any app/UI layer, and
  is run by `assembleEvidencePacket` before emitting a packet.
- **Parallel-safety**: all code lives in new dirs; the only shared-root edit (`tsconfig.json` references) is
  the final task (P4).

## Defaults for the Unspecified *(the one catch-all rule — verbatim)*

> For anything this PRD doesn't specify, choose the simplest correct option, record it in
> `.loop/decisions.md`, and continue.

## Stack + Commands *(pinned — the gate)*

- **Package manager**: pnpm (`pnpm@9.15.9`). The harness auto-detects `pnpm-lock.yaml`. Run `pnpm install`
  at the repo root once.
- **Gate commands** (all run from the repo root; these define "done"):

```bash
pnpm exec tsc -b            # typecheck (composite build across referenced projects)
pnpm test                   # vitest run across the workspace (include: packages/**/test, adapters/**/test)
pnpm exec biome check .     # lint/format (must be clean)
```

- **Scoped test** (fast inner loop): `pnpm --filter @gt100k/evidence-graph test`
- **Demo** (headless end-to-end): `pnpm --filter @gt100k/evidence-repo-memory demo` (added in P4)
- **Loop gate = `pnpm exec tsc -b` + `pnpm test`** (Biome is part of the definition-of-done but the two
  primary gate commands are typecheck + test).

### Seeded smoke test *(green from iteration 1)*

`packages/evidence-graph/test/smoke.test.ts` MUST exist from P0 and assert the package imports and the
toolchain runs, so the gate is green before any feature code lands:

```ts
import { describe, it, expect } from "vitest";
import * as eg from "../src/index.js";

describe("evidence-graph smoke", () => {
  it("imports the package entrypoint", () => {
    expect(eg).toBeDefined();
  });
});
```

## Seed Fixtures *(in-repo — no external fetch)*

All fixtures are synthetic and committed under `packages/evidence-graph/test/fixtures/`:

- **`goldenArtifact`** — the G1 Artifact node content (produces idA). Used by `golden.test.ts` and
  `canonicalize.test.ts` (with a key-shuffled twin).
- **`goldenAttempt`** — the G3 Attempt node content (produces idB).
- **`goldenLeaves`** — `{ ha, hb, hc }` from G2 for the Merkle golden tests.
- **`syntheticMilestone`** — a small coherent graph: `Artifact` → `Transformation` (plan) → `Attempt` (run)
  → `Assistance` (model, cited) → `Review` (human) → `Contribution` → `Outcome` (grade, human-owned),
  wired with `derived_from`/`authored_by`/`used_tool`/`validates`/`released_as`, plus one **unrelated island
  node** to prove `traceEvidence` excludes it (SC-012). This fixture drives the `demo` and the e2e test.

Fixtures are plain TypeScript objects (no I/O). Actor refs are pseudonymous (`learner-synthetic-001`,
`runner-synthetic-001`, `reviewer-synthetic-001`, `assistant-model-synthetic`); no real PII.

## Env / Secrets *(build never fails on missing env)*

This slice needs **no** environment variables, secrets, tokens, or network access — the domain is pure and
the adapters are in-memory/stub. No `.env` is required. Per the constitution (`ENG`), **no secrets, tokens,
or machine paths** are committed. If a future adapter needs config, add a git-ignored `.env.local` with
placeholder values so `build`/`test` still pass with none present.

## Pre-marked Decision Defaults *(preferred answer inline; severity noted)*

Where a genuine judgment is unavoidable, the default is stated so the loop proceeds without asking. Severity
`critical` is reserved for SC-invalidating or irreversible choices.

- **Canonical encoder** — *default*: RFC 8785 JCS (or a stable-key encoder that reproduces the golden bytes).
  *severity: normal* — any encoder that matches the golden canonical strings is acceptable; the golden values
  are the arbiter.
- **Merkle input granularity** — *default*: RFC-6962 raw-byte scheme over the **32-byte content-hash digests**
  (decode the hex ids to bytes), not over the hex strings. *severity: critical* — changing this invalidates
  every golden root; do not deviate.
- **Odd-count rule** — *default*: RFC-6962 — **promote the lone right-most node unchanged** to the next level
  (`k` = largest power of two `< n`); do **not** duplicate it. *severity: critical* — the alternative
  (duplicate-last, `interior(last,last)`) yields different roots; the golden 3-leaf value assumes RFC-6962
  promote-unchanged.
- **`inputs[]` vs. explicit edges** — *default*: a node's `inputs[]` ids are validated for existence like an
  edge endpoint (no dangling), and provenance `derived_from` edges are added explicitly. *severity: normal*.
- **Attestation `predicateType` / `builder` string values** — *default*: fixed synthetic constants (e.g.
  `predicateType: "https://gt100k.dev/attestations/evidence/v1"`, `builder.id: "gt100k-evidence-graph"`).
  *severity: low* — synthetic; record the exact chosen strings in `.loop/decisions.md`.
- **`VerificationResult.reasons` vocabulary** — *default*: short stable machine-readable codes (e.g.
  `MODEL_OWNED_GRADE`, `AUTHORSHIP_ACCUSATION`, `MERKLE_MISMATCH`, `SUBJECT_DIGEST_MISMATCH`, `EMPTY_PACKET`,
  `DANGLING_REF`, `CYCLE`). *severity: normal* — tests assert presence of the relevant code.
- **Error signaling (throw vs. result object)** — *default*: graph mutation guards (`addEdge` dangling/cycle)
  **throw**; validation passes (`assertHumanAuthority`, `verify`) **return** a `VerificationResult`. *severity:
  normal*.

## Assumptions

- **PROV as the base model** (PRD §19, STD-03): the node/edge taxonomy is a domain extension of W3C PROV, not a bespoke ontology, so external tools can consume the graph. This slice encodes the mapping but does not ship a PROV serializer/exporter (deferred).
- **Hash algorithm**: SHA-256 for both node content hashing and the Merkle tree (BLAKE3 is an allowed future alternative per PRD §19; SHA-1/MD5 forbidden). The `Hasher` port keeps the algorithm swappable.
- **Canonical serialization**: RFC 8785 (JCS) sorted-key JSON over the hashed subset of fields; the exact golden bytes are pinned above so any conformant encoder reproduces the golden ids.
- **In-toto/SLSA shape, not full signing**: the attestation is a typed in-toto **Statement** shape bound to subject digests; cryptographic signing and the attestor key hierarchy are a pre-live hardening item (§19.2 D6) and are **not** implemented here — the stub verifier checks structure and digests, not signatures.
- **Deferred hard parts are stubs** (§19.2): external transparency-log anchoring (D1) and crypto-shred erasure (D2) are stub interfaces with deterministic placeholder behavior; comparative-judgment reliability (D3), conformal calibration (D4), durable export (D5), and signing (D6) are out of scope for this slice. Their absence is a *pre-live* gate, not a slice blocker (synthetic beta carries no live child data, PRD §19.2/§32.4).
- **Synthetic-only, governance stubbed**: no real learners, consent, or legal machinery; consent scope is a carried field with synthetic values. Rights/authority limits still bind (Constitution I/IV/IX): humans own grades; models never grade or accuse.
- **Milestone contract is external**: the milestone → node-set membership decision (which nodes belong to a packet) is an input to this slice (a caller-supplied selection); this feature owns packet assembly/attestation/verification, not the `MilestoneContract` workflow (PRD §28).
- **Parallel-safety**: all code lives in new directories (`packages/evidence-graph`, `adapters/evidence-*`). The workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so no shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) needs editing. The only shared-file touch is adding project references to the root `tsconfig.json`, deferred to the final task for a human to reconcile at merge.
