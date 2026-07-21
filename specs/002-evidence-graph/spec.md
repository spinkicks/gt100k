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

> **UI expansion (read if building the interface).** This feature now has **one spec home**. The
> **Provenance Explorer** — a cinematic, navigable **3D "Provenance Observatory"**
> (`apps/evidence-explorer` + the pure view package `packages/evidence-explorer-view`) that *reads*
> this domain and renders the evidence DAG as a living 3D constellation you orbit and fly through — is
> specified **in this same file** as **Part II (§U0–§U15)**, with its companions folded into the shared
> [plan.md](./plan.md), [tasks.md](./tasks.md), [data-model.md](./data-model.md),
> [contracts/provenance-explorer.md](./contracts/provenance-explorer.md), [quickstart.md](./quickstart.md),
> [research.md](./research.md), and [checklists/requirements.md](./checklists/requirements.md). The UI
> expansion **does not modify this domain**; **Part I** below remains the completed, unit-tested core, and
> **where Part I and Part II disagree on a domain rule, Part I wins**.

---

# PART I — Domain core (`packages/evidence-graph`)

> Part I is the pure, framework-agnostic, unit-tested evidence-DAG domain. It is **done and unchanged** by
> the UI expansion; the Explorer (Part II) only *reads* it. Build phases here are **P0–P4**; the Explorer's
> phases are **U0–U7** (Part II). Domain success criteria are **SC-001…SC-012**; Explorer criteria are
> **SC-E01…SC-E22**.

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

---
---

# PART II — Provenance Explorer: the 3D "Provenance Observatory"

**Sub-feature**: Provenance Explorer (a cinematic 3D UI expansion that *reads* the Part I domain)

**Status**: Draft (loop-ready) · **Created**: 2026-07-20 · **Reads**: Part I (`packages/evidence-graph`),
unchanged.

**Input**: "Build the evidence graph as a navigable **3D 'Provenance Observatory'** (react-three-fiber +
drei + three.js). The DAG becomes a living 3D constellation you orbit/fly through: the 8 node types are
distinct luminous bodies (artifacts as *worlds*, attempts as *moons*, AI-assists as *comets clearly marked
'declared'*, reviews/humans as *warm-gold stars*); the 6 edge types are *light-threads* with directional
flow; a **time-scrub** grows the galaxy as the build history unfolds; a cinematic **Verify** sequence sends
a wave of light propagating edge-by-edge and resolving into a golden *Verified ✓* seal with the Merkle root
ticking in; a **tamper demo** visibly fractures a node and shows the root diverging (bytes only, never a
person); depth-of-field, bloom, and a parallax starfield make it feel like a real knowledge cosmos. Keep
reduced-motion a first-class **equal** mode (a calm 2D rendering) and a fully accessible DOM **Provenance
Ledger** (WCAG 2.2 AA; the canvas is `aria-hidden`); hold a **60fps budget** on the min managed device with
graceful degradation to a 2D/reduced tier on weak GPUs / low power; no dark patterns; humans issue grades —
model output is only cited evidence, never a grade or accusation. Synthetic-only; DOM motion standardized on
`motion@^12`."

---

## §U0 · How to read Part II (for the build loop)

Part II is the **single loop source-of-truth** for the Provenance Explorer. It is large on purpose; each
turn, read **only the section for the current phase** (JIT), then the referenced golden values.

- Build path is **§U9 Phasing (U0…U7)** — always work the lowest unfinished phase.
- The view-package gate is **`pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest)**; the app phases add
  **`pnpm --filter @gt100k/evidence-explorer build`** (`next build`) + the **§U11 seeded smoke** + the
  **[quickstart](./quickstart.md) walkthrough**.
- Machine-checkable acceptance lives in **§U10 Success Criteria** (each mapped to a named test) and the
  **§U8 golden values** (exact layout — 2D **and** 3D — motion tokens/easings + camera keyframes, palette,
  tier ladder, node-body/edge-thread mapping, verification derivation).
- Settled choices are in **§U2 Decisions already made** — do not re-open them.
- Anything unspecified: follow **§U3 Defaults for the unspecified** (log it, continue).
- The completed **Part I domain** is **done and unchanged**. Part II **reads** it; it never edits it.

---

## §U1 · Scope fence (in / out / non-goals)

### In scope

1. A **new, pure, deterministic view-model package `@gt100k/evidence-explorer-view`**
   (`packages/evidence-explorer-view`) that **reads** `@gt100k/evidence-graph` and composes a single
   **`ExplorerView`** driving *every* render tier: a deterministic **2D layout** (`layoutExplorer2D`,
   §U8.1) **and** a deterministic **3D layout** (`layoutExplorer3D`, §U8.2); per-node/edge **view mapping**
   for all 8 node types (glyph **and** 3D **body** + color-role + accessible label) and 6 edge types
   (stroke/thread style + label); a **build-timeline / time-scrub growth order** (§U8.7); a **verification
   view** (re-using the domain's `merkleRoot`, `assertHumanAuthority`, and the stub `Verifier` — never
   re-implementing crypto); the accessible **Provenance Ledger** view; **camera keyframes** (§U8.9); a
   **render-tier ladder** (`resolveRenderTier`, §U8.10); and the golden constant registries `PALETTE` /
   `TYPOGRAPHY` / `MOTION` / `EASINGS` / `SPRINGS` / `CAMERA` / `TIERS` / `NODE_BODIES` / `EDGE_THREADS`
   with `resolveMotion(kind,{reducedMotion})`, `resolveRenderTier(caps)`, and `plainViewEquals(...)`. Pure
   (no I/O, no wall-clock, **no `Math.random`**, **no `Math.sin`/`Math.cos` in the golden path** — the 3D
   ring uses an authored unit-slot table so positions are byte-reproducible), framework-agnostic,
   unit-tested (Vitest).
2. A **new Next.js App-Router app `@gt100k/evidence-explorer`** (`apps/evidence-explorer`) rendering the
   `ExplorerView` as a cinematic, navigable **3D Provenance Observatory**: the DAG as luminous 3D bodies
   and directional light-thread edges (**react-three-fiber + drei + three.js**, with **bloom + depth-of-field**
   via `@react-three/postprocessing`), a **deterministic parallax starfield**, orbit/fly-through camera with
   momentum, a **time-scrub** that grows the galaxy, a cinematic **Verify → Verified ✓ seal** light-wave
   sequence, a **tamper demo** that fractures a node (bytes only), and **frosted DOM** inspector/HUD panels
   (motion via **`motion@^12`**, `motion/react`). Verified by `next build` + smoke + the walkthrough.
3. A **first-class, equal reduced-motion mode** rendered as a **calm 2D** constellation (SVG/Canvas2D, the
   same deterministic state, motion stripped) **and** a **synchronized, semantic accessible DOM
   ("Provenance Ledger")** conveying the identical state to keyboard / switch / screen-reader users (WCAG
   2.2 AA). The 3D canvas and the 2D decorative layers are `aria-hidden`; the Ledger is the source of truth.
4. A **60fps performance budget** on the min managed device with **graceful auto-degradation**: a tier
   ladder (Cinematic 3D → Standard 3D → Calm 2D) that drops on weak GPUs / low-power / absent-WebGL / when
   the measured frame budget slips, without losing any state (`resolveRenderTier`, §U8.10).
5. A **committed synthetic fixture** in-repo — the coherent "**speaker-v1**" milestone graph +
   `EvidencePacket` + verifier result (§U7), built through the `@gt100k/evidence-graph` public API — so the
   app renders with **no external fetch**.
6. Full **art direction** (§U5) and a **master motion table** (§U5.6) whose durations/easings/springs +
   **camera keyframes** are pinned as **testable golden constants** (§U8).

### Out of scope (explicit)

- Any change to `packages/evidence-graph`, its adapters (`adapters/evidence-*`), `packages/learning-loop`,
  `apps/student-compass`, or shared root config **except** the single final root-`tsconfig.json` references
  task (T-ROOT, §U9 U7).
- Re-implementing hashing, canonicalization, Merkle, attestation, or the human-authority invariant in the
  UI. The app **reads** these from the domain (the domain is the arbiter).
- The domain's own deferred/§19.2 machinery (external transparency-log anchoring, crypto-shred erasure, ACJ
  reliability, conformal calibration, signing). The Explorer **displays** the domain's existing stub result
  as a clearly-labeled "pre-live gate (stub)" step; it builds no new stub machinery.
- Real reviewer/admissions/portfolio workflows, real learner data, authentication, persistence, or any
  network API. In-memory, synthetic, read-only.
- A **force-directed / physics** graph layout, or any non-deterministic geometry (see §U2 D3; determinism is
  required for golden tests — the 3D "cosmos" look is a *styling + camera* layer over a deterministic
  lattice).
- A model/asset pipeline that fetches external `.glb`/HDRI/textures: all bodies are **procedural three.js
  geometry + materials**; the starfield is **seeded points**; no external fetch, ever.
- Audio beyond an optional muted-by-default, captioned cue (no audio asset pipeline this slice).

### Non-goals (will not build, by principle)

- **No** automated AI-authorship accusation anywhere; a `model` actor's output renders **only** as a cited
  `Assistance`/`Review` — a comet **clearly labeled "Declared"**, calm and neutral — never as a grade, a
  verdict, or an accusation (Constitution I/IV/IX; PRD §4.7/§19). The Explorer computes **no** grade; it
  *displays* the domain's human-owned `Outcome` with its named human owner.
- **No** dark patterns: no leaderboard, no fixed-ability caste rank, no bottom-rank surface, no streak /
  decay / countdown / manufactured-scarcity / FOMO / engagement-timed pop-in. The view types
  **structurally** expose no such field.
- **No** motion-only affordance and **no** WebGL-only state: reduced-motion (calm 2D) and the Ledger are
  **equal** modes; every state is reachable without the 3D canvas.
- **No** alarm-red, shake, fracture, or "glitch" on a person, a learner, an `Outcome`, or an `Assistance`
  body. Red (`--tamper`), the fracture, and the diverging root are reserved **only** for the byte-level
  cryptographic **tamper demo** (integrity of bytes, never a judgement of a person).

---

## §U2 · Decisions already made (do not re-open)

### D1 — Architecture: a pure view package + a separate Next.js app (mirror features 001/004; Part I domain)

The Explorer is split into a **pure view-model package** (`packages/evidence-explorer-view`) and a
**Next.js app** (`apps/evidence-explorer`). The package holds every deterministic rule (2D **and** 3D
layout, view mapping, timeline/scrub order, verification-step derivation, camera keyframes, tier ladder,
motion tokens, parity) as unit-testable pure functions; the app is the only place React / DOM / R3F /
three.js / postprocessing / Canvas / animation live. This keeps every guardrail deterministically testable
under `pnpm test`, keeps the build parallel-safe (new dirs only), and keeps the completed
`packages/evidence-graph` **unchanged** — the view package **depends on it** (`workspace:*`) and reads it.

**Why a package, not app-local logic:** the workspace Vitest include is `packages/**/test` +
`adapters/**/test` (not `apps/**`), so the only way to unit-test the golden motion table, deterministic 2D
**and** 3D layout, camera keyframes, tier ladder, and reduced-motion parity under the loop gate — without
editing the shared root `vitest.config.ts` — is to put them in a `packages/*` package. The app is verified
by `next build`.

### D2 — One state → many renderings (parity across render tiers by construction)

The view package composes a single **`ExplorerView`** (`buildExplorerView(...)`). The **Cinematic 3D**
renderer, the **Standard 3D** renderer, the **Calm 2D** (reduced-motion) rendering, and the accessible DOM
**Provenance Ledger** all render from that **same** `ExplorerView`. Switching tiers or enabling
reduced-motion does **not** recompute state — it renders the identical view differently. This makes
reduced-motion an *equal* mode and `plainViewEquals` a pure, testable guarantee (SC-E03).

### D3 — Rendering: **react-three-fiber + drei + three.js (3D primary), deterministic layout; calm 2D fallback is an equal mode**

The primary renderer is a **3D scene** built with **react-three-fiber (R3F) + drei + three.js**, with
**bloom + depth-of-field** via **`@react-three/postprocessing`** and a **deterministic seeded parallax
starfield** (three.js `Points`), and **frosted DOM panels** (`motion@^12`) in front. Chosen because the
brief is a *cinematic knowledge cosmos* you orbit and fly through — a register SVG cannot reach — and, for a
provenance DAG of *tens* of nodes, WebGL delivers the luminous bodies, volumetric glow, DOF, and free
orbit-camera that make it "lean-forward" impressive. **Layout is deterministic in both 2D and 3D** (§U8.1/
§U8.2) — the 3D positions come from a fixed rank × authored-unit-slot **lattice**, never a force
simulation — so every position is replayable and unit-testable; the "cosmos" *look* (emissive materials,
bloom, DOF, light-thread flow, gentle orbital float, parallax starfield) is a **styling + camera layer over
the deterministic lattice**, never randomized geometry.

The **Calm 2D** renderer (deterministic layered SVG/Canvas2D, §U8.1) is a **first-class equal mode**: it is
both the **reduced-motion** rendering **and** the **graceful-degradation fallback** (weak GPU / low power /
no WebGL). It conveys the identical state with motion stripped. **`@react-spring/three`** is an acceptable
fit-for-purpose 3D animation helper only with a documented reason; the default 3D motion is driven by the
view package's golden `SPRINGS`/`EASINGS` applied in R3F's frame loop (damped lerps) + drei helpers
(`<Float>`, `<CameraControls>`/`<OrbitControls>`, `<Stars>` optional). **GSAP** is an acceptable DOM
alternative only with a documented reason; **DOM motion is standardized on `motion@^12`** (`motion/react`).

### D4 — The Explorer READS the domain; it never re-computes integrity

The verification view (§U5.7) is derived by **re-using the domain**: `merkleRoot` (re-derive over the
packet's node hashes), the attestation subject-digest check, `assertHumanAuthority(subgraph)`, and the stub
`Verifier` adapter. The Explorer **never** re-implements SHA-256/JCS/Merkle, and it **never** computes a
grade. The tamper demo mutates one bound node's payload, re-derives via the domain, and shows the domain's
mismatch. The domain's golden values (Part I **Golden Values**) remain the arbiter.

### D5 — Accessibility for the canvas: **synchronized parallel accessible DOM ("Provenance Ledger") — SETTLED**

Because the 3D canvas (and the decorative 2D layers) are opaque to assistive tech, the app renders a
**synchronized, semantic HTML/ARIA parallel structure** built from the same `ExplorerView`: the DAG as a
keyboard-navigable `role="tree"` (each node a `treeitem` whose accessible name = *type + label + state +
actor*, e.g. "Outcome — Final grade, human-owned by guide-synthetic-001"), the timeline/time-scrub as an
ordered list with a scrub position, verification as a status list with an `aria-live="polite"` region for
the seal/mismatch, and each drill-down panel as a described region. **One shared view-model drives the 3D
scene, the calm 2D rendering, and the Ledger** (D2), so they never drift. Full keyboard/switch operation,
visible focus rings, color-independent state (glyph/body-shape + text, never color alone), ≥4.5:1 contrast.
The 3D `<canvas>` and the 2D decorative layers are `aria-hidden="true"`; the Ledger is the source of truth
for AT. **Settled — the loop does not re-open it.**

### D6 — Art direction: **"Provenance Observatory"** — a deep-space knowledge cosmos (deliberately NOT SaaS-cream, NOT 004's golden-hour warmth)

The Explorer's visual identity (§U5.1, golden §U8.11) is a **calm, forensic-precise observatory / orrery**:
a deep space-navy void where each piece of evidence is a **luminous body** (world / moon / comet / star /
crystal / beacon / seal-sun), provenance lineage is drawn as **threads of light** from source → derived,
and verification is the cosmos **locking into a Verified seal**. Register: *forensic-calm reviewer
instrument* — a trust instrument, never an interrogation. This is a deliberate **second-order anti-slop**
choice (impeccable): not the 2026 cream/sand SaaS default, not fintech navy-and-gold, and deliberately
different from feature 004's warm golden-hour children's RPG (Independence Isles). Warmth is carried by the
gold review/outcome bodies + the verify-gold seal against a cool precise night. Fonts are served by a
**system fallback stack** by default (no external fetch); self-hosted subset `woff2` under `public/fonts/`
is an optional, non-breaking upgrade.

### D7 — Data model, view types, motion vocabulary

- **View types** are fixed in [data-model.md](./data-model.md). Guardrails are **structural**:
  `NodeView`/`EdgeView`/`VerifyStep`/`TimelineBeat`/`ActorChip` expose **no**
  `rank`(competitive)/`leaderboard`/`streak`/`countdown`/`urgency`/`price` field (the layout **rank** is a
  neutral `depthRank` provenance index, never a competitive standing); `ActorChip` has no `accusation`
  field and marks a `model` actor as cited/neutral; `sealState:"mismatch"` (the only place red appears)
  lives on `VerificationView`, never on a person/node.
- **Motion vocabulary** (Apple fluid-motion + Emil design-engineering + impeccable + animation-vocabulary)
  is fixed in **§U5.6** and **§U8.5**: strong ease-out enter curves (`expoOut` for cinematic reveals), `pop`
  reveals with overshoot ≤ 1.05 (never `scale(0)`), press feedback `scale 0.97` on pointer-down, spring/
  damped orbit + camera with momentum, DOF rack-focus on focus change, celebration reserved for the rare
  verify moment, and a first-class reduced-motion (calm 2D) equivalent for **every** row.

### D8 — Stack pinned; tests define done

pnpm workspace (`pnpm@9.15.9`). View-package gate = `tsc -b` + Vitest, **test-first**. App verified by
`next build` + smoke + walkthrough. **DOM animation lib `motion@^12`** (`motion/react`); 3D via
**`@react-three/fiber@^8` + `@react-three/drei@^9` + `three@^0.169` + `@react-three/postprocessing@^2`**
(React 18 / Next 14, matching `apps/student-compass`). Full stack/commands in §U11.

---

## §U3 · Defaults for the unspecified

> **For anything Part II doesn't specify, choose the simplest correct option, record it in
> `.loop/decisions.md`, and continue.**

Escalate (append one line to `.loop/requests.jsonl`, then proceed on your recommendation) **only** for a
genuine product/design choice with hard-to-reverse consequences you cannot defensibly default — e.g. a
golden value you believe is wrong. Never escalate naming, formatting, or anything this doc answers; the
canvas-accessibility approach (D5), the renderer choice (D3), and the DOM motion lib (`motion@^12`, D8) are
**settled** and MUST NOT be re-opened. Overnight, only `severity: critical` reaches the operator; the rest
are recorded to `.loop/deferred-decisions.jsonl`.

---

## §U4 · User Scenarios & Testing *(mandatory)*

Stories are prioritized, independently testable slices. **UX1 alone is a viable MVP**: a navigable 3D
provenance constellation for the synthetic milestone, with a calm-2D reduced-motion equivalent and the
Ledger.

### User Story UX1 — Orbit & fly through the 3D evidence constellation (U1) 🎯 MVP

A reviewer (or a learner viewing their own work) opens the Explorer and the synthetic milestone's evidence
graph **ignites as a 3D cosmos**: each node a distinct **luminous body** by type (Artifact = *world*,
Attempt = *moon*, Transformation = *blueprint construct*, Claim = *beacon*, Assistance = *comet marked
"Declared"*, Review = *warm-gold star*, Contribution = *crystal*, Outcome = *seal-sun*), each edge a
**thread of light** from source → derived with directional flow. They **orbit** (drag with momentum),
**dolly/zoom**, and **fly to / focus** a body to reveal its immediate lineage (a depth-of-field rack-focus
settles on it). Layout is **deterministic** (3D lattice §U8.2 + 2D §U8.1). `prefers-reduced-motion` (or a
weak GPU / no WebGL) renders the identical state as a **calm 2D** constellation, and the accessible Ledger
conveys the same structure/states.

**Why this priority**: the navigable constellation is the core surface; the time-scrub, verification, and
panels all hang off "the graph is rendered from one deterministic `ExplorerView`, in any tier."

**Independent Test**: `buildExplorerView` from the fixture; confirm deterministic 2D **and** 3D layout
(replayable positions), all 8 node types → a distinct **body** + glyph + color-role + accessible label and
6 edge types → a distinct thread style + label, `resolveRenderTier` picks the right tier per caps, and the
calm-2D view + Ledger tree convey the same nodes/edges/states (`plainViewEquals`).

**Acceptance Scenarios**:

1. **Given** the fixture graph, **When** `buildExplorerView` runs twice, **Then** both the 2D and 3D layout
   positions are identical (deterministic; no randomness; no `Math.sin`/`cos` in the golden path).
2. **Given** each of the 8 node types, **When** viewed in 3D, **Then** each renders as its distinct **body**
   + emissive color-role **and** carries a text label — state is never conveyed by color alone; and in calm
   2D each renders with its distinct glyph + color + label.
3. **Given** an orbit / dolly / fly-to interaction, **When** performed, **Then** the camera tracks the
   pointer, settles with momentum, and never locks out input (interruptible; re-targets from the live
   camera).
4. **Given** `prefers-reduced-motion` (or `webglAvailable:false`, `savePower:true`, or `gpuTier:0`),
   **When** the view renders, **Then** `resolveRenderTier` returns `calm2d`, every node/edge/state is
   fully conveyed without motion, and the Ledger `role="tree"` exposes the same to keyboard/screen-reader.
5. **Given** an unrelated island node (not in the milestone trace), **When** the view builds, **Then** it
   is placed in the disconnected island slot (2D `ISLAND_Y`, 3D `ISLAND` offset), marked
   `isInMilestone=false`, and excluded from the milestone trace highlight.

### User Story UX2 — Time-scrub: watch the galaxy grow with the build history (U2)

The learner's artifact has a story unfolding in time: a declared plan, cited assistance, source files, a
failed first attempt, a revision, human reviews, a contribution, a release, and a human-owned outcome. A
**time-scrub** control grows the cosmos as the build history unfolds — as the scrubber advances, each body
**ignites** in build order and its light-threads **draw in** once both endpoints exist. Selecting a beat
flies the camera to its body.

**Independent Test**: `buildGrowthTimeline(graph, packet)` yields a deterministic ordered `beats[]` (build
order = timestamp, then depthRank, then insertion) each with a `birthOrder`; the order is stable across
runs; the Ledger renders the same as an ordered list with a scrub position; the island is excluded.

**Acceptance Scenarios**:

1. **Given** the fixture milestone, **When** the growth timeline builds, **Then** beats are ordered
   deterministically (timestamp → depthRank → insertion) and grouped into plan/assist/artifact/attempt/
   revision/claim/review/release/contribution/outcome, each carrying a `birthOrder`.
2. **Given** a scrub position `t`, **When** applied, **Then** exactly the bodies with `birthOrder ≤ t` are
   present and only edges whose both endpoints are present are drawn (deterministic; state, not motion).
3. **Given** reduced motion (calm 2D), **When** scrubbing, **Then** the reveal is instant per step (no fly/
   ignite animation) and the Ledger list reflects the scrub position; nothing is lost.

### User Story UX3 — A cinematic Verify sequence, and a tamper demo that fractures bytes (U3)

The reviewer presses **Verify**. A **wave of light propagates edge-by-edge** across the constellation from
sources toward the outcome while a checklist ticks — *Merkle root recomputed* → *attestation subject
digest* → *human authority (every grade human-owned; no model grade; no accusation)* → *(pre-live gate,
stub) transparency-log inclusion* — then the cosmos **locks into a golden Verified ✓ seal** (a ring of
light forges shut around the milestone, a one-shot bloom, the Merkle root **ticks in** in mono digits).
Then they run the **tamper demo**: one bound node's bytes are altered; re-verification visibly **fails** —
the altered body **fractures** (bytes only), the lineage to the root desaturates, the root **diverges**
old → new with a highlighted diff, and a **MISMATCH** seal appears in `--tamper`.

**Independent Test**: `buildVerificationView(packet, verifierResult, graph, hasher)` produces an ordered
`steps[]` whose pass/fail is derived from the **domain**; an untampered packet → `sealState:"verified"`; a
packet with one altered node (`applyTamper`) → `sealState:"mismatch"` with the failing step and both roots.
The app computes **no** grade. The verify light-wave order is deterministic (`verifyWaveOrder`, §U8.8).

**Acceptance Scenarios**:

1. **Given** the untampered fixture packet, **When** verification derives, **Then** every non-stub step is
   `pass`, `sealState="verified"`, and the stub transparency-log step is present but clearly
   `nonProduction:true` (never blocks the seal).
2. **Given** the packet with one node's payload altered, **When** verification derives, **Then** the Merkle
   step is `fail` with the recomputed-vs-committed roots, and `sealState="mismatch"`.
3. **Given** the human-authority step, **When** derived, **Then** it re-uses the domain's
   `assertHumanAuthority` and passes only when every grade `Outcome` is human-owned and no accusation node
   exists.
4. **Given** reduced motion (calm 2D), **When** verifying, **Then** the seal/mismatch is conveyed
   statically (a badge + `aria-live` announce), with no light-wave/bloom/fracture required to understand it.
5. **Given** the tamper demo, **When** run, **Then** red + the fracture + the diverging root appear **only**
   on the byte-level body and the root diff — never on a person, learner, `Outcome`, or `Assistance`.

### User Story UX4 — Drill-down panels; declared AI-assistance as cited evidence (U4)

Selecting any body opens a frosted **inspector panel** (origin-aware, scaling from the body's screen
position) showing its content-address (full hash, mono, copyable), actor (with a neutral kind chip),
tool/version, input lineage, timestamp, consent scope, and type-specific payload. An **Assistance** comet is
presented as **"Declared AI assistance — cited as supporting evidence"** (calm, neutral, positive) with its
attestation reference — **never** as an accusation. An **Outcome** seal-sun shows its **named human owner**
with a "human-owned" seal.

**Independent Test**: the `NodeView`/`ActorChip`/panel view-model marks a `model` actor as cited/neutral
(no accusation affordance), marks a grade `Outcome` as `isHumanOwned` with its owner ref, and exposes the
same in the Ledger panel description.

**Acceptance Scenarios**:

1. **Given** an `Assistance` node authored by a `model` actor, **When** its panel renders, **Then** it reads
   as cited supporting evidence (neutral tone, `--model` chip, the comet's "Declared" tag), with no
   accusation language or affordance anywhere in the view model.
2. **Given** a grade `Outcome` authored_by a human, **When** its panel renders, **Then** it shows the named
   human owner and a human-owned seal.
3. **Given** any node panel, **When** opened, **Then** it exposes id/actor/tool/inputs/timestamp/consent/
   payload; the Ledger conveys the same to AT; the panel scales in from the body origin (origin-aware), with
   an instant/fade reduced-motion equivalent.

### User Story UX5 — HUD, legend, filters, trace, plain mode, tier control (U5)

A frosted **HUD** floats over the void: a **legend** (all 8 node bodies + 6 edge threads with body-icon +
color + label), **filters** (show/hide by node type), a **"trace from Outcome"** control that highlights the
provenance path to a selected node (re-using the domain's `traceEvidence`), a **search/focus**, a **plain
mode** toggle (low-spectacle, state-identical), an **audio caption** toggle (muted by default), a
**reduced-motion** override (system/on/off), and a **render-tier** control (auto / cinematic / standard-3D /
calm-2D). Toggling any of these never changes the underlying state.

**Independent Test**: `traceEvidence(graph, outcomeId)` (domain) drives the trace highlight and returns
supporting-only nodes (excludes the island); `plainViewEquals(full, plain)` holds; `resolveRenderTier` with
an explicit `override` returns that tier; toggles change only presentation flags.

**Acceptance Scenarios**:

1. **Given** the legend, **When** shown, **Then** all 8 node bodies + 6 edge threads appear with a
   body-icon + color + text label (color never the sole cue).
2. **Given** "trace from Outcome", **When** activated, **Then** the highlighted path equals the domain's
   `traceEvidence` result (supporting-only; island excluded) and the Ledger marks the same subset.
3. **Given** plain mode / filters / reduced-motion / tier toggles, **When** used, **Then** the underlying
   `ExplorerView` state is unchanged (`plainViewEquals`), only presentation differs.

### User Story UX6 — Accessibility, reduced-motion parity & the 60fps performance budget (U6)

Every animation has a reduced-motion (calm 2D) equivalent; the Provenance Ledger conveys every state to
keyboard / switch / screen-reader users; contrast is ≥4.5:1 with color-independent cues; the 3D scene holds
**60fps** on the min managed device and **auto-degrades** (Cinematic 3D → Standard 3D → Calm 2D) when the
budget slips, on a weak GPU, on low power, or with no WebGL — without losing any state; nothing is
motion-only or canvas-only.

**Independent Test**: golden `resolveMotion` table incl. the reduced column for **every** row (incl. the 3D
events); golden `resolveRenderTier` truth table + the degrade/recover thresholds (§U8.10); `plainViewEquals`;
Ledger view-model completeness (every node/edge/step present with an accessible name); `next build` + a11y
walkthrough + the frame-budget acceptance.

**Acceptance Scenarios**:

1. **Given** every entry in the master motion table (§U5.6), **When**
   `resolveMotion(kind,{reducedMotion:true})` is called, **Then** each returns a reduced equivalent
   (instant or ≤150ms opacity), never a bare "no feedback."
2. **Given** the Ledger, **When** navigated by keyboard only, **Then** every node, timeline beat, and
   verification step is reachable and announced; focus is visible; the 3D canvas + 2D decorative layers are
   `aria-hidden`.
3. **Given** the constellation under orbit/fly on the min device, **When** stressed, **Then** it targets
   60fps and, when the budget slips (median < `DEGRADE_BELOW` for `DEGRADE_SAMPLES` frames), auto-degrades
   one tier (bloom/DOF off → calm 2D) without losing any state, recovering when stable above
   `RECOVER_ABOVE` for `RECOVER_MS`.

### Edge Cases

- **Determinism**: identical graph → identical 2D + 3D layout, growth timeline, verify-wave order,
  verification view (no `Math.random`, no wall-clock, no `Math.sin`/`cos` in the golden path).
- **Reduced-motion parity**: with `prefers-reduced-motion` (calm 2D), no node/edge/step/beat is unreachable
  or unconveyed (FR-E11).
- **Accessible parity**: keyboard-only + screen-reader users reach every state via the Ledger (FR-E12).
- **Color-independence**: every state/type is also carried by body-shape/glyph + text (FR-E05); passes with
  a grayscale filter.
- **No WebGL / context loss**: if WebGL is unavailable or the context is lost, the app falls back to the
  calm 2D tier with no lost state and no console error (FR-E14/E20).
- **Tamper framing**: red + fracture + diverging root appear only on the byte-level body + root diff — never
  on a person/learner/Outcome/Assistance (FR-E09).
- **No-accusation invariant**: a `model` actor renders only as a cited `Assistance`/`Review` comet marked
  "Declared"; the view model has no accusation field/affordance (FR-E08).
- **Human-owned grade**: the app never computes a grade; it displays the domain's human-owned `Outcome`
  seal-sun with its named owner (FR-E08).
- **Island node**: an unrelated component renders in the island slot, outside-milestone, and is excluded
  from trace (FR-E06).
- **Empty/degenerate graph**: a single-node graph lays out at the origin slot and verifies (single-leaf
  Merkle = leaf digest, from the domain); an empty packet is rejected by the domain (surfaced as a disabled
  Verify with an explanatory, non-alarming message).
- **No external fetch / no console errors**: the app builds and runs offline with zero console errors
  (SC-E12).

---

## §U5 · The design — "Provenance Observatory" (the design bible)

Everything a machine can check is pinned as an exact **golden constant** in **§U8**. Where §U5 describes and
§U8 pins, **§U8 wins for values**. Everything stays buildable in Next.js + R3F/three.js/drei/postprocessing +
`motion@^12` + Canvas2D and inside every guardrail (§U1, §U6).

**Design pillars (the five sentences everything answers to):**

1. **A knowledge cosmos of a single child's work.** Evidence is a night sky you *fly through*, not a table
   you scan. Each node is a luminous body; lineage is light traveling from source to derived. Calm,
   spacious, legible, awe-inspiring.
2. **Provenance is light; verification is the cosmos confirming.** The loudest, rarest moment is the
   *Verified ✓* seal — a wave of light propagating edge-by-edge, then a golden ring forging shut over a
   constellation that checks out. Progress you can *see* is trust you can *check* (PRD §19.1) — re-derived
   from the domain, never asserted.
3. **Calm by default, cinematic only at the verify moment.** Ambient motion is gentle and sparse (orbital
   float, slow starfield parallax); frequent actions (HUD toggles, hover) are instant or near-instant (Emil
   frequency rule); the fly-through and the verify light-wave are the reserved cinematic beats.
4. **Reduced motion and the Ledger are equal citizens.** Every visual has a calm 2D, non-vestibular
   equivalent and a semantic DOM twin (§U5.12, §U12). Nothing beautiful is motion-only; nothing stateful is
   canvas-only.
5. **Evidence, never accusation.** Declared AI-assistance is a comet **marked "Declared"**, cited and calm;
   humans own every grade (the gold seal-sun); red/fracture is reserved for byte-tamper, never a person.

### §U5.1 · Art direction & visual identity

**Scene sentence (impeccable).** *A reviewer, late in the evening, in a calm dark room, flies slowly through
a glowing constellation of a child's work — worlds, moons, comets and gold stars strung on threads of light —
and traces it back to its cryptographic root, feeling trust, clarity, and quiet awe, not suspicion.* → a
**deep-space observatory / orrery**, rendered in real 3D.

**Style register.** *Forensic-calm reviewer instrument, in a cinematic cosmos.* A deep space-navy **void**
with a radial vignette and a **deterministic parallax starfield**; evidence nodes are **luminous bodies**
with emissive materials + additive **bloom**; lineage edges are **threads of light** with a faint traveling
**directional flow**; **depth-of-field** keeps the focused body crisp and the field softly blurred; panels
are **frosted glass** floating over the void (`backdrop-filter`, Apple materials); hashes are **mono,
tabular**. Deliberately **not** the 2026 SaaS-cream default and **not** feature 004's warm golden-hour
storybook — warmth here is the gold review/outcome bodies + verify-gold seal against a cool precise night.

**Master palette (exact hex — golden §U8.11).** OKLCH-reasoned, contrast-verified against `--void`. Shared
with the calm-2D and DOM layers; in 3D these drive emissive material colors.

| Role | Token | Hex | Use |
|---|---|---|---|
| Void (scene bg) | `--void` | `#0A0E17` | the night sky; scene/canvas backdrop |
| Panel | `--panel` | `#121826` | frosted panel base |
| Panel raised | `--panel-2` | `#1A2233` | raised surfaces, inspector |
| Hairline | `--line` | `#2A3346` | 1px separators, edge-idle in 2D |
| Ink | `--ink` | `#EAF0FB` | primary text (≈16:1 on `--void`, AAA) |
| Ink muted | `--ink-muted` | `#9AA7C2` | secondary text (≈8:1 on `--void`, AA+) |
| Focus ring | `--focus` | `#7DD3FC` | 3px ring, 2px offset (high-contrast on dark) |
| Verify (seal) | `--verify` | `#34E5B0` | the Verified ✓ seal + passing checks + verify light-wave |
| Tamper (integrity only) | `--tamper` | `#FF5A6E` | **only** the byte-tamper fracture + root-mismatch |
| Human-owned | `--human` | `#FFD166` | the human-owned grade seal / owner marker / gold star warmth |
| Model (cited) | `--model` | `#8B9BC7` | neutral chip + comet tint for a `model` actor (cited, calm) |

**Node-type bodies & accents (§U8.12).** Each of the 8 node types has a **distinct 3D body** *and* a
**distinct hue** *and* a **distinct 2D glyph** *and* a **text label** — color is never the sole cue
(FR-E05). Bodies are **procedural three.js geometry** (no fetched assets).

| Node type | PROV | 3D body | 2D glyph | Token | Hex |
|---|---|---|---|---|---|
| Artifact | Entity | **world** (sphere + faint equatorial ring) | `diamond` ◆ | `--c-artifact` | `#E9C46A` |
| Attempt | Activity | **moon** (small sphere, satellite of its source artifact) | `play` ▷ | `--c-attempt` | `#4CC9F0` |
| Transformation | Activity | **blueprint construct** (wireframe icosahedron — the declared plan) | `blueprint` ⟐ | `--c-transformation` | `#5E7CE2` |
| Claim | Entity | **beacon** (thin luminous obelisk) | `quote` ❝ | `--c-claim` | `#B892FF` |
| Assistance | Activity | **comet** (icy body + tail) **marked "Declared"** | `spark` ✦ | `--c-assistance` | `#3DDC97` |
| Review | Activity | **warm-gold star** (human warmth) | `scale` ⚖ | `--c-review` | `#FFB03A` |
| Contribution | Activity | **crystal** (faceted octahedron) | `hex` ⬡ | `--c-contribution` | `#F072C0` |
| Outcome | Entity | **seal-sun** (radiant sphere + gold seal ring; human-owned grade) | `seal` ✓ | `--c-outcome` | `#FF7A8A` |

2D glyphs are **committed inline SVG** shapes (never emoji — ui-ux-pro-max); the Ledger uses the **text
label** (color-independent). **Edge threads** are conveyed by thread style + flow + a routed label (§U8.12):
`derived_from` solid + flow; `authored_by` dotted (to actor marker); `used_tool` dashed-fine (to tool);
`validates` solid + check-pulse; `contradicts` frayed/severed + slash-cap (desaturated); `released_as`
bright + arrow-flow — each also a text label in the Ledger.

**Typography (tokens §U8.11).** Contrast-axis pairing (geometric display + humanist body) + a **mono for
hashes**. No external fetch: system fallbacks by default; self-hosted subset `woff2` optional.
`--font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif`;
`--font-body: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
`--font-mono: 'JetBrains Mono', ui-monospace, "SFMono-Regular", "Cascadia Code", monospace`. Size-specific
tracking (Apple): display tight (`-0.02em`, floor ≥ -0.04em per impeccable), body `0`, small labels
`+0.01em`; leading inverse to size. Hashes/counters use **tabular numbers**. (Scale table §U8.11.)

**Lighting & atmosphere.** A deep radial vignette focuses the center; a low-key key light + cool rim light
per body; additive **bloom** on emissive bodies (threshold/intensity §U8.13); **depth-of-field** with a
focus distance that racks to the focused body (§U8.13); a **deterministic seeded parallax starfield**
(three.js `Points`, seed from `NEXT_PUBLIC_EXPLORER_SEED`, no `Math.random`) drifting very slowly behind the
graph. **All ambient motion (orbital float, starfield drift, bloom breathing) is OFF** under reduced motion
and the calm-2D tier; the starfield renders as a static field in Standard 3D and as a static SVG star-wash
in calm 2D.

**Mood board, in words.** *An orrery of one child's work rendered as a real cosmos; worlds, moons, comets and
gold stars strung on threads of light; a camera that flies slowly between them with cinematic depth-of-field;
a cryptographic seal that forges shut with a wave of light when the constellation verifies; a forensic
instrument that feels calm and trustworthy, never accusatory; the quiet awe of a planetarium; Bloomberg-
terminal precision meets a knowledge cosmos.*

### §U5.2 · The constellation — 3D + 2D layout, bodies & threads (layout §U8.1/§U8.2)

- **Deterministic layered layout, both dimensions.** Rank each node by its **longest provenance path**
  (`depthRank`: plan/sources deepest, outcome nearest). **2D** (calm tier, §U8.1): `x = MARGIN_X +
  depthRank·COL_W`, `y = MARGIN_Y + orderInRank·ROW_H`; island below at `ISLAND_Y`. **3D** (§U8.2):
  `x = depthRank·COL_W_3D`; within-rank nodes are placed on a **ring** in the Y–Z plane using an authored
  12-slot unit table (`SHELL_SLOTS`) so positions are byte-reproducible without `Math.sin`/`cos`
  (`slotStep = floor(12 / countInRank)`, `slotIndex = (orderInRank·slotStep) mod 12`,
  `y = SHELL_R·SHELL_SLOTS[slotIndex].uy`, `z = SHELL_R·SHELL_SLOTS[slotIndex].uz`); the island sits at a
  fixed `ISLAND` offset. This is **not** force-directed — the cosmos look is a styling + camera layer.
- **Bodies.** Each node = its §U8.12 procedural body in its type hue, with an emissive core, a soft additive
  glow (bloom), a **label billboard** (type + short name, always camera-facing), and — for a `model`
  `Assistance` — a persistent, calm **"Declared"** tag on the comet. `Attempt` moons orbit their source
  `Artifact` world at a fixed radius; `Outcome`/human-owned bodies wear a subtle gold seal ring so the
  verify moment reads. Never `scale(0)`; ignite is `Scale-in + Pop` (0.95→1.0, peak ≤1.05) + bloom bloom.
- **Threads.** A thin emissive tube/line from source → derived; a faint **directional flow** (moving
  emissive gradient / points) shows provenance direction, brightening on trace. Edge type is conveyed by
  thread style (§U8.12) + a Ledger label. Threads **draw in** on reveal (length/opacity), instant under
  reduced motion.
- **State reads as light + body-shape + text**, never color alone: in-milestone bodies are lit; the island
  is dimmed with an "outside this milestone" chip; a traced path brightens; contradicted threads fray with a
  slash-cap + a "contradicts" label.

### §U5.3 · Camera — orbit / dolly / fly-to / focus (config §U8.9)

- **Orbit**: pointer drag orbits the target (drei `<CameraControls>`/`<OrbitControls>` or an equivalent),
  with **momentum** on release (damped, `orbitDampLambda` §U8.5) and soft limits; never locks input;
  interruptible (re-target from the live camera).
- **Dolly / zoom**: wheel/pinch dollies toward the pointer-picked body (origin-aware), clamped `dollyMin …
  dollyMax` (§U8.9).
- **Fly-to / focus**: focusing a body (click, keyboard, a timeline beat) **springs** the camera to a
  keyframe framing it (`CAMERA.focus`, §U8.9) with a small **look-ahead** (Apple "hint in the direction"),
  and a **depth-of-field rack-focus** (`dofPulse`) settles on it; reveals its immediate lineage. Instant
  camera cut under reduced motion.
- **Establishing fly-in** on first load: start at `CAMERA.introStart` (a wide, high vantage), then spring/
  fly to `CAMERA.overview` over `flyIn 2400ms` (`expoOut`); reduced-motion = instant `overview` + 150ms
  fade.
- **Parallax**: the starfield sits far behind at `PARALLAX.starfield` depth-scale; foreground motes at
  `PARALLAX.foreground`. Under reduced motion / calm-2D the ambient layers are static (depth retained).

### §U5.4 · Time-scrub — grow the galaxy (design §U5.4; view §U8.7)

A **time-scrub** strip (horizontal; vertical on narrow) renders the milestone as ordered **beats** in build
order — *plan → assist → source → attempt → revision → claim → review → contribution → release → outcome* —
each beat a small card (body-icon + label + timestamp + `birthOrder`). Dragging the scrubber **grows the
cosmos**: bodies with `birthOrder ≤ t` are present and ignite in order (`scrubStep` per beat), threads draw
in once both endpoints exist. Selecting a beat **flies** the camera to its body. Reduced motion: instant
per-step reveal, no fly/ignite; the Ledger renders the same ordered list + scrub position. Beat order is
deterministic (§U8.7).

### §U5.5 · Scenes / regions of the app (React structure)

| Region | Role & UX |
|---|---|
| `ObservatoryStage` | The root: owns the shared `ExplorerView` + presentation (tier/reducedMotion/plain/scrub/selection). Mounts the active render tier + the HUD + the Ledger. |
| `Cosmos3D` | The R3F `<Canvas>` scene (bodies/threads/starfield/bloom/DOF/camera), client-only, `aria-hidden`. |
| `Constellation2D` | The calm-2D SVG/Canvas renderer (reduced-motion / fallback tier), `aria-hidden`. |
| `Starfield` | The deterministic seeded parallax starfield (three.js `Points` in 3D; static SVG wash in 2D). |
| `TimeScrub` | The build-history scrubber; drives galaxy growth + beat→body fly-to. |
| `Inspector` | The frosted drill-down panel (origin-aware, `motion@^12`) for a selected body. |
| `VerifyPanel` | The Verify control + stepped checks + Verified/MISMATCH seal + tamper demo. |
| `Hud` | Legend, filters, trace, search, plain-mode, reduced-motion, tier control, audio-caption. |
| `Ledger` | The accessible DOM twin (`role="tree"` + lists + live region) — the AT source of truth. |

**React owns the DOM + Ledger; the 3D/2D canvases are visual only.** State flows from the one `ExplorerView`
(D2); the active render tier is chosen by `resolveRenderTier` (§U8.10) and can auto-degrade at runtime.

### §U5.6 · Motion & juice — the master motion table (the heart)

Motion is designed, not decorated (Apple §17; Emil frequency rule; impeccable "motion is part of the
build"; animation-vocabulary for the named effects). Durations are **named tokens** (§U8.5 `MOTION`);
easings are **named** (§U8.5 `EASINGS`); springs/damps are **named** (`SPRINGS`); every row has a first-class
**reduced-motion / calm-2D** equivalent, all derived from `resolveMotion(kind,{reducedMotion})` so the
values are testable constants (SC-E04). **Engine** column: `motion@12` = DOM (`motion/react`); `R3F` = the
three.js frame loop (damped lerp toward the golden target, drei helpers); `Canvas2D`/`SVG` = calm-2D layer.
Interactive orbit/dolly/fly use **damped springs** (Apple: interruptible, velocity-aware); scripted reveals
use eased tokens.

| Event | Named effect (vocabulary) | Engine | Easing / spring | Duration (token) | FX | Reduced-motion / calm-2D equivalent |
|---|---|---|---|---|---|---|
| App establishing intro | Cinematic **fly-in** (introStart → overview) | R3F | `expoOut` | 2400 (`flyIn`) | starfield fade-in | instant `overview` + 150ms fade |
| Body ignite / reveal | **Scale-in + Pop** (0.95→1.0, ≤1.05) + **Bloom** bloom | R3F | `pop` | 520 (`bodyReveal`) | glow | instant show + static glow |
| Thread draw (lineage) | **Line-drawing** (length/opacity), source→derived | R3F | `enter` | 320 (`edgeDraw`) | — | instant full-opacity thread |
| Thread directional flow | ambient **flow** along the tube (emissive drift) | R3F | `linear` | 2200 (`glowLoop`) loop | low | **off** (static thread) |
| Orbit | drag-orbit + **momentum** (damped) | R3F | `orbit` spring (`orbitDampLambda`) | — (velocity) | — | orbit kept; no inertia glide |
| Dolly / zoom | **Continuity zoom** (origin-aware, damped) | R3F | `camera` spring | 300 (`zoom`) | — | instant dolly set |
| Fly-to / focus | camera **spring** to keyframe + **look-ahead** + **DOF rack-focus** | R3F | `camera` spring (`focusDampLambda`) | 700 (`dofPulse`) | DOF | instant camera cut, no DOF |
| Body hover | **Glow-Pulse** + lift | R3F | `enter` | 160 (`tooltip`) | glow | outline only, no pulse |
| Press feedback | **Press/Tap** scale 0.97 on pointer-*down* | motion@12 | `press` | 120 (`press`) | — | kept (non-vestibular) |
| Keyboard focus | Focus ring **materialize** + fly-to-view | motion@12 + R3F | `move` | 200 (`fast`) | — | instant ring + jump-to-view |
| Inspector open | **Origin-aware Scale-in** + **Blur-mask** + **Materialize** (backdrop blur+scale) | motion@12 | `enter` | 260 (`panel`) | frost | instant / 150ms opacity |
| Inspector close | reverse (same path), faster | motion@12 | `enter` | 200 (`fast`) | — | instant |
| Time-scrub step | body **ignite** + thread **draw** per beat as `t` advances | R3F | `pop`/`enter` | 180 (`scrubStep`)/beat | glow | instant reveal per step, no ignite |
| Verify — light-wave | **wave propagation** edge-by-edge (source→outcome) + per-step tick | R3F | `enter` | 1800 (`verifyWave`) | verify glow | instant all-pass list + `aria-live` |
| Verify — step check | **Stepped** sequential ticks → check **Pop** per row | motion@12 | `pop` | 420 (`verifyStep`)/step | tick spark | instant list + `aria-live` |
| Verify — **seal forge** | **Verified ✓ Seal**: ring **Line-draw** + Scale-in + one-shot **Bloom** | R3F + motion@12 | `pop` | 900 (`sealForge`) | bloom ring | static seal badge + `aria-live` announce |
| Verify — root ticker | **Number-ticker** of the Merkle root (mono, tabular) | motion@12 | `linear` | 1200 (`rootTick`) | — | instant full root |
| Tamper — fracture | byte-level body **Shatter/fracture** (bytes only) | R3F | `move` | 520 (`fracture`) | red pulse (integrity only) | static **MISMATCH** chip, no fracture |
| Tamper — root diverge | root **Text-morph** old→new + highlighted diff | motion@12 | `move` | 900 (`rootDiverge`) | — | static old/new diff text |
| Tamper — lineage desaturate | traced threads to root **desaturate** | R3F | `move` | 400 (`tamper`) | — | static desaturated state |
| Merkle tree build | bottom-up **Stagger** (leaf→interior→root) | R3F/SVG | `enter` | 400 (`timeline`) | — | instant full tree |
| Trace path | traveling **light-pulse** along traced threads | R3F | `linear` | 600 (`count`) | glow | static highlight of the traced subset |
| Tier crossfade (auto-degrade) | **Crossfade** between render tiers | motion@12 | `enter` | 400 (`tierCrossfade`) | blur | instant swap, state kept |
| HUD toggle (legend/filter/plain/rm/tier) | **Instant** (frequent action → no animation) | motion@12 | — | 0 (`instant`) | — | instant |
| Legend / drawer open | **Origin-aware Scale-in** + item **Stagger** 40ms | motion@12 | `enter` | 220 (`reveal`) | — | instant / fade |
| Ambient cosmos | body **orbital Float / Twinkle** + starfield **parallax drift** | R3F | `linear`/sine | 24000 (`parallaxDrift`) loop, 2200 (`glowLoop`) | low | **all off**; positions/depth kept |

**Deliberately excluded** (would violate §U1 / this design): `Shake`/`Wiggle`/**fracture** on any person /
learner / `Outcome` / `Assistance` (reads as accusation — only the byte-tamper body fractures); alarm-red
anywhere but the integrity tamper; any `scale(0)` entrance; `ease-in` on entrances; gacha/loot "reveal";
loss/decay/streak/countdown meters; engagement-timed pop-ins; autoplaying loud celebration; any looping
earworm audio; bounce/elastic on cinematic reveals (impeccable: ease-out-expo, no bounce).

### §U5.7 · The two orchestrated sequences (the loudest moments)

**A. Verify → "the cosmos confirms."** On **Verify**: (t=0) a **wave of light propagates edge-by-edge** from
the source bodies toward the outcome (`verifyWave`, order = `verifyWaveOrder` §U8.8) while the checks panel
**steps** through each row (`merkle-root` → `subject-digest` → `human-authority` → `(stub) transparency-log`),
each turning to a `pass` tick; once all non-stub steps pass, the cosmos **locks** — a ring of light
**forges** shut around the milestone (`sealForge`), a one-shot **Bloom** blooms from center, the Merkle root
**Number-tickers** in (`rootTick`) in mono, and an `aria-live` region announces "Verified — Merkle root
re-derived, attestation subject matched, every grade human-owned." Optional muted, captioned rising chime.
**Reduced motion / calm 2D:** a static **Verified ✓** seal + the announce; nothing must be motion to be
understood.

**B. Tamper demo → "integrity catches it."** On **Tamper**: one bound node's payload is mutated (in memory),
the domain re-derives, the Merkle step turns `fail`; the **byte-level body fractures** (`fracture`, bytes
only), the lineage to the root **desaturates**, the root **Text-morphs** old → new with a highlighted diff
(`rootDiverge`), and a **MISMATCH** seal appears in `--tamper`. `aria-live` announces "Tamper detected —
recomputed Merkle root does not match the committed root." **Reduced motion / calm 2D:** a static
**MISMATCH** chip + the old/new root diff text, no fracture/desaturate motion. Red + fracture appear
**only** here, **only** on bytes — never on a person.

Both derive from `buildVerificationView` (§U8.8) + `resolveMotion`, so pass/fail, the step set, the wave
order, and the reduced equivalent are deterministic and testable (SC-E08).

### §U5.8 · Drill-down inspector

The **Inspector** is a frosted, origin-aware `motion@^12` surface (scales from the selected body's screen
position; `transform-origin` at the body) presenting the `NodeView`: **header** (body-icon + node type +
short label; a "human-owned" seal for a grade `Outcome`; a neutral **"Declared AI assistance — cited"**
ribbon for a `model`-authored `Assistance`/`Review`); **content-address** (full id, mono, tabular, copy
button + "content-addressed" note); **actor** (a kind chip — `human` / `model` (`--model`, cited/neutral) /
`tool` / `system` — with the pseudonymous ref; **no** accusation language or affordance); **tool/version**,
**inputs** (each a link that flies to the input body), **timestamp**, **consent scope** (labeled
"synthetic"), and the **type-specific payload**. Everything mirrored in the Ledger panel description (§U5.12).
Materialize on open; instant/fade reduced.

### §U5.9 · HUD & controls

Frosted `backdrop-filter` panels floating over the void (Apple materials; content behind, not opaque bars):
a top milestone banner, a right inspector dock, a bottom time-scrub strip, and a control cluster — **Legend**,
**Filters** (by node type), **Trace from Outcome**, **Search/Focus**, **Verify**, **Tamper demo**, **Plain
mode**, **Reduced motion** (system/on/off), **Render tier** (auto / cinematic / standard-3D / calm-2D),
**Audio captions** (muted default). Press feedback on every control (scale 0.97); ≥44px targets;
reduced-transparency → solid panels; reduced-motion → instant.

### §U5.10 · Sound (muted by default, captioned — optional)

Audio is **muted by default** with a single toggle and **captions** in the Ledger; no cue loops or is
engagement-timed. Optional cues: verify-seal rising chime `[verified]`, step tick `[check]`, tamper neutral
tap `[mismatch]` (**neutral**, never an alarm). `resolveSoundCue(event)` is deterministic (a later,
non-breaking addition; this slice may ship caption ids only).

### §U5.11 · Assets & no-fetch

- **No external fetch, ever.** 3D bodies are **procedural three.js geometry + materials** (no `.glb`/HDRI/
  textures fetched); 2D glyphs are **committed inline SVG**; the starfield is a **deterministic seeded**
  draw (no `Math.random`); fonts use a **system fallback stack** by default with an optional self-hosted
  subset `woff2` under `public/fonts/` (non-breaking).
- The fixture data (§U7) is a **committed synthetic** graph built via the `@gt100k/evidence-graph` API; no
  data is fetched.

### §U5.12 · The accessible Provenance Ledger — visual + semantic (D5, §U12)

Built from the same `ExplorerView`: the DAG as a keyboard-navigable `role="tree"` (each node a `treeitem`
whose accessible name = *type + label + state + actor + human-owned/cited marker*), the time-scrub as an
ordered list with a scrub position, verification as a status list with an `aria-live="polite"` seal region,
and each inspector as a described region. Full keyboard/switch operation (Tab/Arrow/Enter/Escape), visible
`--focus` rings, color-independent cues (body-shape/glyph + text), ≥4.5:1 contrast. The 3D `<canvas>` and 2D
decorative layers are `aria-hidden="true"`. Because every renderer consumes the one view model, they never
drift (parity by construction, SC-E10).

### §U5.13 · Motion principles (the rules every value above obeys)

- **Frequency-appropriate** (Emil): rare (verify seal, fly-in) → cinematic; occasional (focus, panel) →
  standard eased; frequent (HUD toggles, hover) → instant / near-instant.
- **Enter/exit `enter`/`expoOut` (strong ease-out)**, on-screen moves `move`, reveals `pop` (overshoot
  ≤1.05, never `scale(0)`); **never `ease-in` on entrances**; no bounce/elastic on cinematic reveals.
- **Interruptible & velocity-aware** (Apple): orbit/dolly/fly re-target from the live camera; nothing locks
  input; momentum handed off on release.
- **GPU-friendly**: in DOM only `transform`/`opacity`/`filter` animate (no layout thrash); in 3D prefer
  material/emissive/position/quaternion + postprocessing; target **60fps** with an auto-degrading tier
  (bloom/DOF off → calm 2D) holding the budget.
- **Every** animation has a reduced-motion (calm 2D) equivalent (§U8.5) and a Ledger equivalent (§U12);
  reduced motion is *the same instrument, conveyed calmly.*

---

## §U6 · Requirements *(mandatory)*

### Functional Requirements

**Constellation, layout & view model**

- **FR-E01**: The app MUST render the evidence graph (§U7) as a navigable **3D constellation** — 8 node
  types as distinct luminous **bodies** (§U8.12), 6 edge types as labeled **light-thread** edges with
  directional flow — using a **deterministic 3D layout** (§U8.2), with orbit/dolly/fly-to and animated
  body/thread reveals (each with a reduced-motion / calm-2D equivalent).
- **FR-E02**: The view MUST derive from a single **`ExplorerView`** produced by `buildExplorerView` in
  `@gt100k/evidence-explorer-view`; the Cinematic 3D, Standard 3D, Calm 2D, and accessible Ledger renderers
  MUST all render from that same view (parity across tiers by construction).
- **FR-E03**: Layout (2D **and** 3D), growth-timeline order, verify-wave order, verification-step
  derivation, camera keyframes, and tier resolution MUST be **pure, deterministic** functions of the
  graph/packet/caps — no `Math.random`, no wall-clock in the view package, and **no `Math.sin`/`Math.cos`
  in the golden layout path** (the 3D ring uses the authored `SHELL_SLOTS` table); identical input →
  identical output (replayable).
- **FR-E04**: The view MUST map **every** node type to a distinct **3D body + 2D glyph + color-role +
  accessible label**, and **every** edge type to a distinct **thread style + label**; nothing conveys
  type/state by **color alone** (§U8.12, WCAG 2.2 AA).

**Reads the domain; verification & integrity**

- **FR-E05**: The app/view MUST **read** `@gt100k/evidence-graph` and MUST NOT modify it or re-implement
  hashing/canonicalization/Merkle/attestation/human-authority; verification MUST re-use the domain's
  `merkleRoot`, subject-digest check, `assertHumanAuthority`, and the stub `Verifier`.
- **FR-E06**: The verification view MUST derive an ordered `steps[]` (merkle, subject-digest,
  human-authority, and the clearly-labeled `nonProduction` transparency-log stub) and a `sealState`
  (`unverified` | `verified` | `mismatch`) from the domain; untampered → `verified`; one altered node →
  `mismatch` with both roots; and a deterministic `verifyWaveOrder` for the light-wave. The app computes
  **no** grade.
- **FR-E07**: The tamper demo MUST alter one bound node's bytes, re-derive via the domain, and visibly fail;
  the failure framing (red + a **fracture** + the diverging root) MUST appear **only** on the byte-level
  body and the root diff — never on a person, learner, `Outcome`, or `Assistance`.

**Human authority & no accusation (product guardrail — Constitution I/IV/IX)**

- **FR-E08**: A grade `Outcome` MUST render as **human-owned** (the gold seal-sun) with its named human
  owner; a `model` actor's output MUST render **only** as a cited `Assistance`/`Review` (a comet marked
  "Declared", neutral `--model` chip, calm tone); the view model MUST expose **no** accusation
  field/affordance and MUST NOT compute or assert a grade or an AI-authorship accusation.
- **FR-E09**: Declared AI-assistance MUST be presented as **cited supporting evidence** (positive, neutral),
  with its attestation reference where present — never as suspicion.

**Reduced motion, accessibility, performance & no dark patterns**

- **FR-E10**: Reduced motion MUST be a **first-class, equal** mode rendered as the **calm 2D** tier: every
  animated affordance MUST have a reduced-motion rendering conveying the same state; `prefers-reduced-motion`
  MUST be honored by default and overridable (system/on/off); **no** feature may require motion. All motion
  params MUST derive from the deterministic `resolveMotion` (§U8.5).
- **FR-E11**: All surfaces MUST meet **WCAG 2.2 AA** via the accessible DOM **Provenance Ledger** —
  keyboard/switch/screen-reader operable, focus-visible, color-independent, ≥4.5:1 contrast. The 3D
  `<canvas>` + 2D decorative layers MUST be `aria-hidden`; the Ledger conveys identical state.
- **FR-E12**: The view types MUST **structurally** exclude dark patterns: **no** `leaderboard`, competitive
  `rank`, bottom-rank, `streak`, `countdown`, `urgency`, `price`, or engagement-timed field; no loss-framed
  or manufactured-scarcity surface. (The layout provenance index is a neutral `depthRank`, never a standing.)
- **FR-E13**: The app MUST hold a **60fps performance budget** on the min managed device and **auto-degrade**
  through the tier ladder (Cinematic 3D → Standard 3D → Calm 2D) via `resolveRenderTier` (§U8.10) when the
  measured budget slips, on a weak GPU, on low power, or with **no WebGL / context loss** — **without losing
  any state**; the tier is also user-overridable.

**Build-on / isolation & stack**

- **FR-E14**: The feature MUST live in **new dirs only** (`packages/evidence-explorer-view`,
  `apps/evidence-explorer`) and MUST NOT modify `packages/evidence-graph`, its adapters,
  `packages/learning-loop`, `apps/student-compass`, or shared root config **except** the single final
  root-`tsconfig.json` references task.
- **FR-E15**: The app MUST render on **Next.js 14 App Router + React 18** with **`motion@^12`** (`motion/
  react`) for DOM motion and **`@react-three/fiber`@^8 + `@react-three/drei`@^9 + `three`@^0.169 +
  `@react-three/postprocessing`@^2** for the 3D scene, the interactive canvas loaded **client-side**,
  producing **zero console errors** in the smoke run and building cleanly with `next build`; **no external
  fetch**.
- **FR-E16**: All fixture data MUST be **committed synthetic**, built via the `@gt100k/evidence-graph`
  public API; the app MUST build and run with no network access and no secrets.

**Art direction, motion system & assets**

- **FR-E17**: The app MUST render with the **Provenance Observatory** identity — the palette (§U8.11),
  typography tokens (§U8.11), node-body/edge-thread visual language (§U8.12), bloom/DOF atmosphere (§U8.13)
  — using **no external fetch** (system-font fallback; procedural bodies; seeded starfield). Color is never
  the sole cue.
- **FR-E18**: All interaction motion MUST derive from the deterministic token registry
  (`MOTION`/`EASINGS`/`SPRINGS`/`CAMERA`, §U8.5/§U8.9) via `resolveMotion(kind,{reducedMotion})`; **every**
  entry in the master motion table (§U5.6) MUST have a reduced-motion equivalent, and the excluded effects
  (§U5.6) MUST NOT appear.
- **FR-E19**: The 3D layout ring, the starfield, and any procedural visual MUST be **deterministic/seeded**
  (no `Math.random`; no `Math.sin`/`cos` in the golden layout path — authored `SHELL_SLOTS`); 2D glyphs are
  committed inline SVG; the accessible Ledger MUST NOT depend on the canvas.
- **FR-E20**: The app MUST degrade gracefully with **no WebGL / on context loss** to the calm-2D tier with
  no lost state and no console error, and MUST set `aria-hidden` on every canvas/decorative layer.

### Key Entities

Full shapes in [data-model.md](./data-model.md). Summary: `ExplorerView` (the composed view driving every
tier), `NodeView` (id/type/glyph/**body**/colorRole/label/actorChip/tool/inputs/timestamp/consentScope/
payload/**pos2d**/**pos3d**/depthRank/orderInRank/birthOrder/isHumanOwned/isCitedAssistance/isInMilestone),
`EdgeView` (type/from/to/label/threadStyle/cap/**path2d**/**path3d**/isLineage/hasFlow), `ActorChip`
(kind/ref/tone/citedLabel — no accusation field), `GrowthTimelineView` + `TimelineBeat`
(order/nodeId/group/label/timestamp/birthOrder), `VerificationView` + `VerifyStep`
(id/label/status/detail/nonProduction) + `sealState` + `verifyWaveOrder`, `CameraKeyframe`
(position/target/fov/durationMs/easing), `RenderTier` (`cinematic`|`standard3d`|`calm2d`) +
`RenderCaps`, `LedgerView` (tree/timelineList/verificationList/panels), `MotionSpec`
(kind/mode/durationMs/easing), and the golden registries `PALETTE` / `TYPOGRAPHY` / `MOTION` / `EASINGS` /
`SPRINGS` / `CAMERA` / `TIERS` / `NODE_BODIES` / `EDGE_THREADS` / `SHELL_SLOTS` (+ `resolveMotion`,
`resolveRenderTier`, `plainViewEquals`). All read from `@gt100k/evidence-graph` types.

---

## §U7 · Golden fixture (the canonical synthetic milestone)

The view package ships a committed synthetic fixture, `explorerFixture(hasher)`, that builds a coherent
milestone through the `@gt100k/evidence-graph` API and assembles an `EvidencePacket` + verifier result. It
is the "**speaker-v1**" milestone (echoing PRD §21's speaker-design story), synthetic + pseudonymous.

### 7.1 Fixture graph (13 nodes; declaration order fixed — drives within-rank layout order §U8.1/§U8.2)

| # | key | type | actor.kind | notes |
|---|---|---|---|---|
| 1 | `plan` | Transformation | human | declared plan (prospective) |
| 2 | `assist-research` | Assistance | model | cited research retrieval (tool/model) |
| 3 | `assist-tutor` | Assistance | model | cited answer-blind tutor hint |
| 4 | `src-artifact` | Artifact | human | source/design files |
| 5 | `attempt-1` | Attempt | system | first build run (a failed branch) |
| 6 | `attempt-2` | Attempt | system | revision run (success) |
| 7 | `claim-repro` | Claim | human | hermetic-reproduction claim |
| 8 | `review-technical` | Review | human | technical reviewer |
| 9 | `released-artifact` | Artifact | system | the released speaker design v1 |
| 10 | `contribution-self` | Contribution | human | the learner's own contribution |
| 11 | `review-craft` | Review | human | craft-mentor review |
| 12 | `outcome-grade` | Outcome | human | final grade — **human-owned** |
| 13 | `island-note` | Claim | human | **unrelated** island (no milestone edges) |

**Edges** (typed; `from → to`):
`src-artifact derived_from plan`, `src-artifact derived_from assist-research`,
`attempt-1 derived_from src-artifact`, `attempt-1 derived_from assist-tutor`,
`attempt-2 derived_from attempt-1`, `attempt-2 derived_from src-artifact`,
`claim-repro validates attempt-2`, `review-technical validates attempt-2`,
`attempt-2 released_as released-artifact`, `contribution-self derived_from attempt-2`,
`review-craft validates released-artifact`, `outcome-grade validates released-artifact`;
plus `authored_by` edges from each node to its actor ref. `island-note` has **no** milestone edges (proves
trace/scope excludes it, mirrors Part I SC-012).

**Packet**: milestone `"speaker-v1"`, subject = `released-artifact`'s digest; `nodeIds` = the 12 milestone
nodes (island excluded). Human-authority: `outcome-grade` is `authored_by` a `human` → `assertHumanAuthority`
passes.

### 7.2 Provenance ranks (deterministic, structure-only — golden §U8.1/§U8.2)

Layering "depends-on" = `derived_from` ∪ `released_as`(→artifact later) ∪ `validates`(→reviewer later).
Longest-path `depthRank`:

| depthRank | nodes (in declaration order) | count |
|---|---|---|
| 0 | `plan`, `assist-research`, `assist-tutor` | 3 |
| 1 | `src-artifact` | 1 |
| 2 | `attempt-1` | 1 |
| 3 | `attempt-2` | 1 |
| 4 | `claim-repro`, `review-technical`, `released-artifact`, `contribution-self` | 4 |
| 5 | `review-craft`, `outcome-grade` | 2 |
| (island) | `island-note` — disconnected | — |

---

## §U8 · Golden values + tolerances

All view-package values below are **exact** (deterministic; tolerance = 0 for integers/strings). The 3D
positions are the **product** `SHELL_R · SHELL_SLOTS[slot] (+center)` computed with IEEE-754
multiply/add (byte-reproducible); the tabulated decimals are for humans, tolerance **±1e-6**, and the test
recomputes via the same formula/table. UX/atmosphere values (bloom/DOF/fps) are pinned tokens and are
acceptance targets in the app walkthrough.

### §U8.1 Layout 2D (exact) — `layoutExplorer2D(graph)` (calm tier / reduced-motion / fallback)

Constants: `MARGIN_X=120`, `MARGIN_Y=120`, `COL_W=240`, `ROW_H=160`, `NODE_R=28`, `ISLAND_Y=760`. For a
node at `depthRank=r`, `orderInRank=i` (0-based, insertion order): `x = MARGIN_X + r·COL_W`,
`y = MARGIN_Y + i·ROW_H`. Disconnected components below the DAG from `ISLAND_Y` (first island node at
`x = MARGIN_X`). World bounds: `{ x:0, y:0, width: maxX + MARGIN_X, height: maxY + MARGIN_Y }`.

Golden 2D positions for the §U7 fixture:

| node | r | i | (x, y) |
|---|---|---|---|
| `plan` | 0 | 0 | (120, 120) |
| `assist-research` | 0 | 1 | (120, 280) |
| `assist-tutor` | 0 | 2 | (120, 440) |
| `src-artifact` | 1 | 0 | (360, 120) |
| `attempt-1` | 2 | 0 | (600, 120) |
| `attempt-2` | 3 | 0 | (840, 120) |
| `claim-repro` | 4 | 0 | (1080, 120) |
| `review-technical` | 4 | 1 | (1080, 280) |
| `released-artifact` | 4 | 2 | (1080, 440) |
| `contribution-self` | 4 | 3 | (1080, 600) |
| `review-craft` | 5 | 0 | (1320, 120) |
| `outcome-grade` | 5 | 1 | (1320, 280) |
| `island-note` | — | — | (120, 760) |

World bounds: `{ x:0, y:0, width: 1440, height: 880 }` (maxX 1320 + 120; maxY 760 + 120).

### §U8.2 Layout 3D (exact via authored slot table) — `layoutExplorer3D(graph)`

Constants: `COL_W_3D=6`, `SHELL_R=3.2`, `ISLAND=[0,-9,0]`. `SHELL_SLOTS` (12 authored unit slots at 30°,
`{uy,uz}` = `{cosθ,sinθ}`, exact literals):

| slot | θ | uy | uz |
|---|---|---|---|
| 0 | 0° | 1.000000 | 0.000000 |
| 1 | 30° | 0.866025 | 0.500000 |
| 2 | 60° | 0.500000 | 0.866025 |
| 3 | 90° | 0.000000 | 1.000000 |
| 4 | 120° | -0.500000 | 0.866025 |
| 5 | 150° | -0.866025 | 0.500000 |
| 6 | 180° | -1.000000 | 0.000000 |
| 7 | 210° | -0.866025 | -0.500000 |
| 8 | 240° | -0.500000 | -0.866025 |
| 9 | 270° | 0.000000 | -1.000000 |
| 10 | 300° | 0.500000 | -0.866025 |
| 11 | 330° | 0.866025 | -0.500000 |

Per node: `slotStep = floor(12 / countInRank)`, `slotIndex = (orderInRank·slotStep) mod 12`,
`x = depthRank·COL_W_3D`, `y = SHELL_R·SHELL_SLOTS[slotIndex].uy`, `z = SHELL_R·SHELL_SLOTS[slotIndex].uz`.
Island → `ISLAND`. World-bounds (AABB) derive from content: `x∈[0,30]`, `y∈[-9,3.2]`, `z∈[-3.2,3.2]`;
center `[15,-1,0]` (used by the camera keyframes §U8.9).

Golden 3D positions for the §U7 fixture (tolerance ±1e-6; test recomputes via the table):

| node | r | i | count | slotStep | slotIndex | (x, y, z) |
|---|---|---|---|---|---|---|
| `plan` | 0 | 0 | 3 | 4 | 0 | (0, 3.2, 0) |
| `assist-research` | 0 | 1 | 3 | 4 | 4 | (0, -1.6, 2.77128) |
| `assist-tutor` | 0 | 2 | 3 | 4 | 8 | (0, -1.6, -2.77128) |
| `src-artifact` | 1 | 0 | 1 | 12 | 0 | (6, 3.2, 0) |
| `attempt-1` | 2 | 0 | 1 | 12 | 0 | (12, 3.2, 0) |
| `attempt-2` | 3 | 0 | 1 | 12 | 0 | (18, 3.2, 0) |
| `claim-repro` | 4 | 0 | 4 | 3 | 0 | (24, 3.2, 0) |
| `review-technical` | 4 | 1 | 4 | 3 | 3 | (24, 0, 3.2) |
| `released-artifact` | 4 | 2 | 4 | 3 | 6 | (24, -3.2, 0) |
| `contribution-self` | 4 | 3 | 4 | 3 | 9 | (24, 0, -3.2) |
| `review-craft` | 5 | 0 | 2 | 6 | 0 | (30, 3.2, 0) |
| `outcome-grade` | 5 | 1 | 2 | 6 | 6 | (30, -3.2, 0) |
| `island-note` | — | — | — | — | — | (0, -9, 0) |

(`3.2 · 0.866025 = 2.77128`.)

### §U8.3 Node-state / view mapping (exact)

`resolveNodeGlyph(type)`, `resolveNodeColorRole(type)`, and `resolveNodeBody(type)` per the §U5.1 table
(exact). Every `NodeView` also carries a text `label` (never color-only). `isInMilestone` = node ∈ packet
`nodeIds`; `isHumanOwned` = grade `Outcome` with a `human` `authored_by`; `isCitedAssistance` =
`Assistance`/`Review` with a `model` actor.

### §U8.7 Growth-timeline / time-scrub order (exact) — `buildGrowthTimeline(graph, packet)`

Beats = milestone nodes ordered by **(timestamp asc, then depthRank asc, then graph insertion order)**,
grouped: `plan → assist → artifact → attempt → revision → claim → review → release → contribution →
outcome`. Each beat carries a 0-based `birthOrder` (its position in this order). Deterministic + stable;
island excluded. Scrub position `t` reveals bodies with `birthOrder ≤ t` and edges whose both endpoints are
revealed.

### §U8.8 Verification view + wave (exact) — `buildVerificationView(packet, verifierResult, graph, hasher)`

Ordered `steps[]` (exact ids + order): `["merkle-root","subject-digest","human-authority","transparency-log-stub"]`.
- `merkle-root`: `pass` iff `merkleRoot(nodeHashes, hasher) === packet.merkleRoot` (re-derived via the
  domain). Detail carries `{ committed, recomputed }`.
- `subject-digest`: `pass` iff `attestation.subject[0].digest.sha256 === packet.subjectDigest`.
- `human-authority`: `pass` iff `assertHumanAuthority(subgraph).ok`; detail carries the domain's reasons on
  failure.
- `transparency-log-stub`: `status:"stub"`, `nonProduction:true`, label "Transparency-log inclusion
  (pre-live gate, stub)" — from the domain's deferred `TransparencyLog` stub; **never** blocks the seal.
`sealState` = `"verified"` iff all non-stub steps `pass`; `"mismatch"` iff any non-stub step `fail`;
`"unverified"` before Verify. `verifyWaveOrder` = the deterministic edge order the light-wave animates =
edges sorted by `(min(depthRank(from),depthRank(to)) asc, from insertion, to insertion)` — a stable
source→outcome propagation. Tamper: mutating one node's payload flips `merkle-root` to `fail`, `sealState`
to `"mismatch"`, and the detail exposes committed≠recomputed. **The app computes no grade.**

### §U8.5 Motion tokens + easings + springs (exact) — `MOTION`, `EASINGS`, `SPRINGS`, `resolveMotion`

`MOTION` (durations, ms — exact): `instant:0`, `press:120`, `micro:150`, `tooltip:160`, `scrubStep:180`,
`fast:200`, `reveal:220`, `panel:260`, `base:300`, `zoom:300`, `edgeDraw:320`, `node:360`, `timeline:400`,
`tamper:400`, `tierCrossfade:400`, `verifyStep:420`, `bodyReveal:520`, `fracture:520`, `count:600`,
`dofPulse:700`, `sealForge:900`, `rootDiverge:900`, `rootTick:1200`, `verifyWave:1800`, `glowLoop:2200`,
`flyIn:2400`, `ambient:6000`, `parallaxDrift:24000`.

`EASINGS` (CSS cubic-bézier — exact): `enter:"cubic-bezier(0.23,1,0.32,1)"`;
`expoOut:"cubic-bezier(0.16,1,0.3,1)"` (cinematic ease-out-expo, no bounce);
`move:"cubic-bezier(0.65,0,0.35,1)"`; `pop:"cubic-bezier(0.34,1.56,0.64,1)"` (overshoot ≤1.05);
`press:"cubic-bezier(0.4,0,0.6,1)"`; `drawer:"cubic-bezier(0.32,0.72,0,1)"`; `linear:"linear"`.

`SPRINGS` (`motion@12` DOM / R3F damp — exact): DOM `ui:{ type:"spring", bounce:0, duration:0.4 }`
(critically damped default); `flick:{ type:"spring", bounce:0.15, duration:0.45 }` (drag release). R3F
camera/orbit **damp lambdas** (three `MathUtils.damp`): `cameraDampLambda:4.0`, `focusDampLambda:5.0`,
`orbitDampLambda:3.2`; pan/orbit momentum decel `0.998`.

`resolveMotion(kind,{reducedMotion})` → `{ kind, mode, durationMs, easing }`. Under `reducedMotion:true` →
`mode:"reduced"`, `easing:"linear"`, `durationMs` from the reduced column:

| kind | animated dur | animated easing | reduced dur | reduced note |
|---|---|---|---|---|
| `flyIn` | 2400 | expoOut | 0 | instant overview |
| `bodyReveal` | 520 | pop | 0 | instant show |
| `edgeDraw` | 320 | enter | 0 | instant thread |
| `threadFlow` | 2200 | linear | 0 | off (static) |
| `orbit` | 0 (velocity) | linear | 0 | orbit kept, no glide |
| `zoom` | 300 | move | 0 | instant dolly |
| `focus` | 700 | expoOut | 0 | instant cut, no DOF |
| `nodeHover` | 160 | enter | 0 | outline only |
| `press` | 120 | press | 120 | kept (non-vestibular) |
| `focusMove` | 200 | move | 0 | instant jump-to-view |
| `panelOpen` | 260 | enter | 150 | fade |
| `panelClose` | 200 | enter | 150 | fade |
| `scrubStep` | 180 | pop | 0 | instant reveal per step |
| `verifyWave` | 1800 | enter | 0 | instant + aria-live |
| `verifyStep` | 420 | pop | 0 | instant list + aria-live |
| `sealForge` | 900 | pop | 150 | static seal + announce |
| `rootTick` | 1200 | linear | 0 | instant root |
| `fracture` | 520 | move | 0 | static MISMATCH |
| `rootDiverge` | 900 | move | 0 | static diff text |
| `tamper` | 400 | move | 0 | static desaturated |
| `merkleBuild` | 400 | enter | 0 | instant tree |
| `tracePulse` | 600 | linear | 0 | static highlight |
| `tierCrossfade` | 400 | enter | 0 | instant swap |
| `drawerOpen` | 220 | enter | 150 | fade |
| `ambient` | 6000 | linear | 0 | off (static) |
| `parallaxDrift` | 24000 | linear | 0 | off (static) |
| `hudToggle` | 0 | linear | 0 | instant |

### §U8.9 Camera keyframes + parallax (exact) — `CAMERA`, `PARALLAX`

`CAMERA` (exact; `position`/`target` in world units, `fov` degrees). Center of the fixture cosmos =
`[15,-1,0]` (§U8.2).

| keyframe | position | target | fov | note |
|---|---|---|---|---|
| `introStart` | `[15, 26, 60]` | `[15, -1, 0]` | 30 | wide high establishing (fly-in start) |
| `overview` | `[15, 8, 40]` | `[15, -1, 0]` | 40 | settled default framing |
| `focus(node)` | `node + [8, 4, 12]` | `node.pos3d` | 34 | fly-to a body (+ DOF rack) |
| `verifySeal` | `[15, 2, 30]` | `[15, -1, 0]` | 36 | frame the whole locking constellation |
| `scrub` | `[15, 6, 44]` | `[15, -1, 0]` | 42 | slightly wider to watch growth |
| `island` | `[0, -6, 20]` | `[0, -9, 0]` | 40 | glance at the disconnected island |

Clamps: `dollyMin:12`, `dollyMax:80`, `fovMin:28`, `fovMax:52`, `lookAhead:2.0` (world units),
`orbitPolarMin:15°`, `orbitPolarMax:150°`. `PARALLAX` (depth-scale, back→front): `starfield:0.15`,
`world:1.0`, `foreground:1.08`. Under reduced motion / calm-2D the ambient layers are static (depth kept).

### §U8.10 Render-tier ladder (exact) — `TIERS`, `resolveRenderTier`

`RenderTier` = `"cinematic" | "standard3d" | "calm2d"`. `RenderCaps` =
`{ prefersReducedMotion:boolean; savePower:boolean; webglAvailable:boolean; gpuTier:0|1|2|3;
override?: "auto"|"cinematic"|"standard3d"|"calm2d" }`.

`resolveRenderTier(caps)` (first matching rule wins):
1. `override && override !== "auto"` → `override`.
2. `prefersReducedMotion || !webglAvailable || savePower || gpuTier === 0` → `"calm2d"`.
3. `gpuTier === 1` → `"standard3d"`.
4. otherwise (`gpuTier >= 2`) → `"cinematic"`.

Tier capabilities (`TIERS`): `cinematic` = bodies + threads + **bloom + DOF** + parallax starfield + full
motion; `standard3d` = bodies + threads + basic glow, **bloom/DOF OFF**, static starfield, reduced particle
counts; `calm2d` = deterministic 2D SVG/Canvas constellation, **no** WebGL, low/no motion (= reduced-motion
rendering). Adaptive **auto-degrade** thresholds (exact): `FPS_BUDGET:60`, `DEGRADE_BELOW:50`,
`DEGRADE_SAMPLES:90` (≈1.5s at 60fps), `RECOVER_ABOVE:58`, `RECOVER_MS:4000`. On sustained median FPS <
`DEGRADE_BELOW` for `DEGRADE_SAMPLES` frames → step down one tier (`cinematic`→`standard3d`→`calm2d`);
recover up one tier after median FPS ≥ `RECOVER_ABOVE` for `RECOVER_MS`. State is preserved across tier
changes (D2). Golden truth table:

| caps | tier |
|---|---|
| `{gpuTier:3, webglAvailable:true}` | `cinematic` |
| `{gpuTier:2, webglAvailable:true}` | `cinematic` |
| `{gpuTier:1, webglAvailable:true}` | `standard3d` |
| `{gpuTier:0}` | `calm2d` |
| `{gpuTier:3, prefersReducedMotion:true}` | `calm2d` |
| `{gpuTier:3, savePower:true}` | `calm2d` |
| `{gpuTier:3, webglAvailable:false}` | `calm2d` |
| `{gpuTier:1, override:"cinematic"}` | `cinematic` |
| `{gpuTier:3, override:"calm2d"}` | `calm2d` |

### §U8.11 Palette + typography tokens (exact) — `PALETTE`, `TYPOGRAPHY`

`PALETTE` (exact hex): `void:#0A0E17`, `panel:#121826`, `panel2:#1A2233`, `line:#2A3346`, `ink:#EAF0FB`,
`inkMuted:#9AA7C2`, `focus:#7DD3FC`, `verify:#34E5B0`, `tamper:#FF5A6E`, `human:#FFD166`, `model:#8B9BC7`;
node types: `artifact:#E9C46A`, `attempt:#4CC9F0`, `transformation:#5E7CE2`, `claim:#B892FF`,
`assistance:#3DDC97`, `review:#FFB03A`, `contribution:#F072C0`, `outcome:#FF7A8A`. Contrast: `ink` on `void`
≈16:1 (AAA); `inkMuted` on `void` ≈8:1 (AA+). Node accents are graphical (emissive fills/body materials/
glyph strokes, ≥3:1); text labels always in `ink`/`inkMuted`; hashes `ink` mono. State color always paired
with a body-shape/glyph + text (FR-E04).

`TYPOGRAPHY` (exact): `fontDisplay:'"Space Grotesk",ui-sans-serif,system-ui,sans-serif'`,
`fontBody:'"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'`,
`fontMono:'"JetBrains Mono",ui-monospace,"SFMono-Regular","Cascadia Code",monospace'`; scale
`display{rem:2.5,lh:1.05,ls:-0.02,w:700}`, `h1{1.75,1.10,-0.01,600}`, `h2{1.25,1.20,0,600}`,
`body{1.0,1.5,0,400}`, `label{0.8125,1.4,0.01,500}`, `mono{0.8125,1.5,0,500}`; `numeric:"tabular-nums"`.

### §U8.12 Node-body / edge-thread visual language (exact) — `NODE_BODIES`, `NODE_GLYPHS`, `EDGE_THREADS`

`NODE_BODIES` (type→body id): Artifact→`world`; Attempt→`moon`; Transformation→`blueprint`; Claim→`beacon`;
Assistance→`comet` (with persistent `declaredTag:true`); Review→`gold-star`; Contribution→`crystal`;
Outcome→`seal-sun`. `NODE_GLYPHS` (2D, type→glyph id): Artifact→`diamond`; Attempt→`play`;
Transformation→`blueprint`; Claim→`quote`; Assistance→`spark`; Review→`scale`; Contribution→`hex`;
Outcome→`seal`. `EDGE_THREADS` (type→{threadStyle, cap, flow, label}, exact):
`derived_from`→(`solid`,`plain`,`true`,"derived from"); `authored_by`→(`dotted`,`plain`,`false`,"authored
by"); `used_tool`→(`dashed-fine`,`plain`,`false`,"used tool"); `validates`→(`solid`,`check`,`true`,
"validates"); `contradicts`→(`frayed`,`slash`,`false`,"contradicts"); `released_as`→(`solid`,`arrow`,
`true`,"released as"). Each edge label is exposed in the Ledger (color/thread never the sole cue).

### §U8.13 Atmosphere (postprocessing) tokens (exact) — `BLOOM`, `DOF`, `STARFIELD`

`BLOOM` (exact, `cinematic` tier only): `intensity:1.15`, `luminanceThreshold:0.62`,
`luminanceSmoothing:0.9`, `mipmapBlur:true`. `DOF` (exact, `cinematic` only): `focusDistanceMode:"target"`,
`focalLength:0.02`, `bokehScale:2.4`, `rackDurationToken:"dofPulse"`. `STARFIELD` (exact, deterministic):
`count:1400`, `radius:220`, `seedEnv:"NEXT_PUBLIC_EXPLORER_SEED"` (default `42`), `driftToken:"parallaxDrift"`,
`depthScale:"PARALLAX.starfield"`; **off/static** under `standard3d`/`calm2d`/reduced-motion. These are
acceptance targets in the app walkthrough (not view-package unit values).

### §U8.14 Guardrail structural checks (exact)

`NodeView`/`EdgeView`/`VerifyStep`/`TimelineBeat`/`ActorChip` MUST expose **none** of:
`price|currency|rank|leaderboard|percentile|outOf|streak|countdown|urgency|dropRate|rarity|accusation`
(the neutral provenance index is named `depthRank`, allowed). `ActorChip.tone` for a `model` actor is
`"model"` (cited/neutral); `VerificationView.sealState` is the only carrier of `"mismatch"`/`--tamper`. The
view package source contains **no** `Math.random`, and the golden layout path contains **no** `Math.sin`/
`Math.cos`. (SC-E11.)

---

## §U9 · Phasing (U0…U7) — the build path

Each phase is independently valuable and gated. Work the lowest unfinished phase. Detailed tasks in
[tasks.md](./tasks.md).

### U0 — Foundation & green-from-iteration-1

**Goal**: view package + app skeletons compile; the gate is green immediately.
**Deliverables**: `packages/evidence-explorer-view` (`package.json` dep `@gt100k/evidence-graph`
`workspace:*`; dev-deps the three adapters; `tsconfig.json`; `src/index.ts`; `src/model.ts` view types; the
golden registries `PALETTE`/`TYPOGRAPHY` (`art.ts`), `MOTION`/`EASINGS`/`SPRINGS`/`resolveMotion`
(`motion.ts`), `NODE_BODIES`/`NODE_GLYPHS`/`EDGE_THREADS` + resolvers (`visual.ts`), `CAMERA`/`PARALLAX`
(`camera.ts`), `TIERS`/`resolveRenderTier` (`tiers.ts`), `SHELL_SLOTS` + `layoutExplorer2D`/`layoutExplorer3D`
skeletons; the fixture `fixtures/explorer.fixture.ts`; and `plainViewEquals`); `apps/evidence-explorer`
skeleton (`package.json` with next/react + `motion@^12` + R3F/drei/three/postprocessing; `next.config.mjs`
transpiling the two packages; `tsconfig.json`; `app/layout.tsx`; `app/page.tsx` placeholder;
`app/globals.css` with §U8.11 tokens + reduced-motion/reduced-transparency + `:focus-visible`;
`.env.local.example`; `.gitignore`); a **seeded smoke test** (`test/smoke.test.ts`) building the fixture view.
**Gate**: `pnpm typecheck` + `pnpm test` green.

### U1 — 3D constellation (UX1) 🎯 MVP

**Goal**: the graph renders as a navigable 3D constellation (Observatory art direction, bodies + threads +
bloom/DOF + starfield); deterministic 2D **and** 3D layout; orbit/dolly/fly-to; the calm-2D tier + Ledger
convey identical state; `resolveRenderTier` picks the tier.
**View**: `layoutExplorer2D`, `layoutExplorer3D`, `resolveNodeBody`/`resolveNodeGlyph`/`resolveNodeColorRole`,
`resolveRenderTier`, `buildExplorerView` (nodes+edges+2D/3D layout+presentation), `buildLedgerView` (tree).
**App**: `ObservatoryStage`, `Cosmos3D` (R3F bodies/threads/bloom/DOF/camera), `Starfield` (seeded,
aria-hidden), `Constellation2D` (calm-2D fallback), orbit/dolly/fly-to with momentum, reduced-motion path,
the accessible Ledger tree.
**Gate**: U0 gate + `next build` + smoke (zero console errors) + walkthrough steps 1, 6.

### U2 — Time-scrub galaxy growth (UX2)

**View**: `buildGrowthTimeline` (§U8.7). **App**: `TimeScrub` strip (galaxy grows as `t` advances; beat→body
fly-to); Ledger ordered list + scrub position parity.
**Gate**: U1 gate + walkthrough step 2.

### U3 — Verify light-wave + tamper fracture (UX3)

**View**: `buildVerificationView` + `verifyWaveOrder` (re-using domain `merkleRoot`, subject-digest,
`assertHumanAuthority`, stub `Verifier`); `applyTamper(fixture)`. **App**: `VerifyPanel` stepped checks +
verify light-wave + Verified ✓ seal-forge (ring-draw + bloom + root ticker) + tamper demo (byte-body
fracture + lineage desaturate + root diverge + MISMATCH), `aria-live` announces; reduced-motion equivalents.
**Gate**: U2 gate + walkthrough step 3.

### U4 — Drill-down inspector + human-authority + cited AI-assist (UX4)

**View**: `ActorChip` tone + `isCitedAssistance` + `isHumanOwned` derivation; panel view-model. **App**:
`Inspector` (origin-aware, frosted, `motion@^12`) with id/actor/tool/inputs/timestamp/consent/payload; the
"human-owned" seal for a grade `Outcome`; the neutral "Declared AI assistance — cited" ribbon for a model
`Assistance`/`Review`; no accusation affordance; Ledger panel parity.
**Gate**: U3 gate + walkthrough step 4.

### U5 — HUD, legend, filters, trace, plain mode, tier control (UX5)

**View**: trace via domain `traceEvidence`; `plainViewEquals`; `resolveRenderTier` override. **App**: `Hud`
(legend of 8 bodies + 6 threads; filters by type; "trace from Outcome"; search/focus; plain-mode toggle;
reduced-motion override; render-tier control; audio-caption toggle) — presentation-only; state unchanged.
**Gate**: U4 gate + walkthrough steps 5–6.

### U6 — Polish, accessibility & the 60fps performance budget

**Goal**: WCAG 2.2 AA pass (keyboard/switch/screen-reader over the Ledger, color-independent cues, contrast),
reduced-motion parity, **60fps** orbit/fly + graceful auto-degradation (Cinematic→Standard→Calm) + no-WebGL
fallback, zero console errors; README + demo.
**Gate**: all view SCs green; full quickstart validation + frame-budget acceptance.

### U7 — The single shared-file touch (T-ROOT)

Add a composite project reference for `packages/evidence-explorer-view` to the root `tsconfig.json`
`references` (the app is `noEmit`, like `apps/student-compass`, so it needs no reference). Kept as its own
isolated change.

---

## §U10 · Success Criteria *(mandatory)* — each mapped to a test

View-package SCs are Vitest tests in `packages/evidence-explorer-view/test/`; app SCs are verified via
`next build` + the smoke + the [quickstart](./quickstart.md) walkthrough (frame-rate is an acceptance
target, not a unit test). Tolerance for exact values is byte-for-byte (zero); 3D positions ±1e-6 (§U8).

- **SC-E01** — `layoutExplorer2D(fixture)` is deterministic and matches the golden 2D positions (§U8.1),
  incl. the island slot; x depends only on `depthRank`. → `test/layout2d.test.ts`.
- **SC-E02** — `buildExplorerView` composes one view (nodes+edges+2D/3D layout+timeline+verification+ledger
  +presentation) that drives every tier; switching tier / reduced-motion / plain does not recompute state. →
  `test/view.test.ts` (`plainViewEquals`).
- **SC-E03** — Reduced-motion parity: `plainViewEquals(full, reduced)` holds; every animated affordance has
  a reduced equivalent via `resolveMotion`. → `test/view.test.ts` + `test/motion.test.ts`.
- **SC-E04** — Every interaction-motion value derives from the token registry and each has a reduced-motion
  equivalent (§U8.5 golden table incl. reduced mode + all 3D events). → `test/motion-tokens.test.ts`.
- **SC-E05** — Palette/typography tokens exact (§U8.11); every node type → a distinct
  body+glyph+color+label and every edge type → a distinct thread-style+label (§U8.12); state never
  color-only. → `test/art.test.ts` + `test/visual.test.ts`.
- **SC-E06** — All 8 node types + 6 edge types covered by the view mapping with accessible labels; the
  island is `isInMilestone=false` and excluded from trace. → `test/mapping.test.ts`.
- **SC-E07** — `buildGrowthTimeline` yields a deterministic ordered, grouped `beats[]` with `birthOrder`
  (§U8.7); stable across runs; a scrub position reveals the right subset; island excluded. →
  `test/timeline.test.ts`.
- **SC-E08** — `buildVerificationView` derives ordered steps + `sealState` + `verifyWaveOrder` from the
  **domain**; untampered → `verified`; one altered node → `mismatch` with both roots; **no** grade computed;
  the stub step is `nonProduction` and never blocks. → `test/verify-view.test.ts` (uses
  `adapters/evidence-hash-node` + `adapters/evidence-verifier-stub` + `adapters/evidence-deferred`).
- **SC-E09** — A grade `Outcome` renders human-owned with its named owner; a `model` actor renders only as
  cited `Assistance`/`Review` (neutral tone, comet "Declared" tag); the view model exposes **no** accusation
  field/affordance and computes no grade/accusation. → `test/authority-view.test.ts`.
- **SC-E10** — The accessible Ledger view-model is complete: every node (tree), timeline beat (list), and
  verification step (status) is present with an accessible name; parity with the constellation. →
  `test/ledger.test.ts`.
- **SC-E11** — Structural guardrails: view types expose none of
  `price|currency|rank|leaderboard|percentile|outOf|streak|countdown|urgency|dropRate|rarity|accusation`;
  no `Math.random` in source; no `Math.sin`/`Math.cos` in the golden layout path; red/`mismatch` only on
  `VerificationView`. → `test/guardrails.test.ts`.
- **SC-E12** — The app builds (`next build`) and mounts with **zero console errors**; the 3D canvas + 2D
  decorative layers are `aria-hidden`; the DOM Ledger is present and focusable; reduced-motion toggle works;
  Verify shows the seal and announces via `aria-live`. → `next build` + Playwright smoke (§U11).
- **SC-E13** — WCAG 2.2 AA: keyboard/switch/screen-reader operable over the Ledger, focus visible,
  color-independent cues, ≥4.5:1 contrast. → quickstart a11y walkthrough + `test/ledger.test.ts`.
- **SC-E14** — The view/app read `@gt100k/evidence-graph` unchanged; swapping the `Hasher`/`Verifier`
  adapter needs no view change; the domain's golden values still hold. → `test/integration.test.ts`.
- **SC-E15** — A **seeded smoke test** passes from iteration 1 (the workspace builds and Vitest discovers
  the new package). → `test/smoke.test.ts`.
- **SC-E16** — `layoutExplorer3D(fixture)` is deterministic and matches the golden 3D positions (§U8.2) via
  the `SHELL_SLOTS` table (±1e-6); x depends only on `depthRank`; island at `ISLAND`. → `test/layout3d.test.ts`.
- **SC-E17** — `CAMERA` keyframes exact (§U8.9); `focus(node)` derives from `node.pos3d + offset`; clamps
  present. → `test/camera.test.ts`.
- **SC-E18** — `resolveRenderTier` matches the golden truth table (§U8.10) and the degrade/recover
  thresholds are the pinned constants. → `test/tiers.test.ts`.
- **SC-E19** — `resolveNodeBody` maps all 8 types to the golden bodies and `EDGE_THREADS` maps all 6 edge
  types (§U8.12); the `Assistance` comet carries `declaredTag:true`. → `test/visual.test.ts`.
- **SC-E20** — `verifyWaveOrder` is a deterministic source→outcome edge order (§U8.8); stable across runs.
  → `test/verify-view.test.ts`.
- **SC-E21** — App acceptance: on the min device the 3D scene targets **60fps** and auto-degrades one tier
  (bloom/DOF off → calm 2D) when the budget slips, recovering when stable; state preserved. → quickstart
  perf walkthrough + `test/tiers.test.ts` (thresholds).
- **SC-E22** — App acceptance: with **no WebGL / on context loss** the app falls back to the calm-2D tier
  with no lost state and no console error; every canvas/decorative layer is `aria-hidden`. → Playwright
  smoke (WebGL disabled) + `test/tiers.test.ts`.

---

## §U11 · Stack, commands, env & seeded smoke (pinned)

### Stack

- **Package manager**: pnpm `9.15.9` (workspace; lockfile auto-detected).
- **Language**: TypeScript `5.6.3`, strict (`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, `composite`), Node LTS.
- **View package**: pure TS, dep `@gt100k/evidence-graph` (`workspace:*`) only; **dev**-deps
  `adapters/evidence-hash-node`, `adapters/evidence-verifier-stub`, `adapters/evidence-deferred`
  (`workspace:*`) for verification/integration tests.
- **App**: Next.js `^14.2.15` App Router + React `^18.3.1` (match `apps/student-compass`); DOM motion
  **`motion@^12.0.0`** (`import { motion, AnimatePresence, useReducedMotion } from "motion/react"`); 3D via
  **`three@^0.169.0`**, **`@react-three/fiber@^8.17.10`**, **`@react-three/drei@^9.114.0`**,
  **`@react-three/postprocessing@^2.16.3`** (+ `postprocessing@^6.36.4`); `transpilePackages:
  ["@gt100k/evidence-explorer-view", "@gt100k/evidence-graph"]`; the interactive canvas loaded client-side
  (`next/dynamic`, `ssr:false`). No external fetch.
- **Test**: Vitest (root `vitest.config.ts` already globs `packages/**/test` — no root edit).

### Commands

```bash
pnpm install                                         # bootstrap workspace
pnpm typecheck                                       # tsc -b (green after T-ROOT adds the references)
pnpm test                                            # Vitest across the workspace (view package)
pnpm --filter @gt100k/evidence-explorer-view test    # view-package tests only
pnpm lint                                             # biome check packages adapters apps
pnpm --filter @gt100k/evidence-explorer dev          # run the Provenance Explorer
pnpm --filter @gt100k/evidence-explorer build        # next build — app acceptance/perf gate
```

> Loop gate = `pnpm typecheck` + `pnpm test`. App phases additionally require
> `pnpm --filter @gt100k/evidence-explorer build` + the smoke + walkthrough. The root `build` script
> (student-compass) is **not** modified; the Explorer app is built via its filter.

### Env / secrets

The app needs **no secrets**. Commit `apps/evidence-explorer/.env.local.example` with non-secret public
placeholders and git-ignore `.env.local`; the app reads only `NEXT_PUBLIC_*` with safe defaults so `build`
never fails on missing env.

```dotenv
# apps/evidence-explorer/.env.local.example
NEXT_PUBLIC_EXPLORER_SEED=42
NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=system   # system | on | off
NEXT_PUBLIC_RENDER_TIER_DEFAULT=auto        # auto | cinematic | standard3d | calm2d
NEXT_PUBLIC_EXPLORER_DENSITY=comfortable    # comfortable | compact
```

### Seeded smoke

- **View smoke** (`packages/evidence-explorer-view/test/smoke.test.ts`, part of U0): imports the package,
  builds the fixture `ExplorerView`, asserts 13 nodes (12 in-milestone + 1 island), the golden 2D bounds
  (§U8.1) + golden 3D center (§U8.2), and a non-empty growth timeline — so `pnpm test` is green from the
  first increment.
- **App smoke** (U1+, Playwright pass): loads `/`, waits for the 3D `<canvas>` + the DOM Ledger to mount,
  asserts **zero console errors**; then toggles reduced-motion (→ calm 2D), runs Verify, and confirms the
  Verified seal + `aria-live` announce (SC-E12); a WebGL-disabled run confirms the calm-2D fallback (SC-E22).

---

## §U12 · Accessibility & reduced-motion equivalence (detail)

- **Reduced motion** (`prefers-reduced-motion: reduce`, honored by default; overridable): renders the
  **calm 2D** tier — tweens → instant or ≤150ms opacity crossfade; ambient starfield/glow/parallax off;
  camera cuts; the Verified seal → a static badge + `aria-live`; the tamper → a static MISMATCH chip + diff
  text (no fracture/desaturate). State/structure/verification remain fully conveyed (FR-E10, SC-E03).
- **Accessible Ledger** (parallel DOM from the same `ExplorerView`, D5/FR-E11, SC-E10): the DAG as a
  `role="tree"`; the time-scrub as an ordered list with a scrub position; verification as a status list
  with an `aria-live="polite"` seal region; each inspector as a described region. Full keyboard/switch
  operation, visible focus rings, color-independent cues (body-shape/glyph + text), ≥4.5:1 contrast. Every
  canvas/decorative layer `aria-hidden="true"`.
- **Plain mode**: a low-spectacle rendering (calm palette, no starfield/glow, minimal motion) that is
  state-identical to full (`plainViewEquals`, SC-E02/E03). Distinct from but compatible with reduced motion.
- **Color-independence**: every node/edge/state carries a body-shape/glyph + text; the UI passes a
  grayscale check (FR-E04).
- **No dark patterns**: the surface has no leaderboard/caste-rank/bottom-rank/streak/countdown/urgency; the
  view types exclude them structurally (FR-E12, SC-E11).

---

## §U13 · Pre-marked decision points (defaults + severity)

The loop proceeds on the **default**; it escalates only per §U3.

- **DP-1 — Primary renderer.** ✅ Settled: **react-three-fiber + drei + three.js (3D)** with bloom + DOF
  (`@react-three/postprocessing`), a deterministic seeded starfield, and frosted DOM panels; the **calm 2D**
  tier is the reduced-motion / weak-GPU equal fallback (D3). **Severity: low.**
- **DP-2 — DOM animation library.** ✅ Settled: **`motion@^12`** (`motion/react`). GSAP is acceptable only
  with a documented reason. 3D motion uses the golden `SPRINGS`/`EASINGS` in R3F's frame loop; `@react-
  spring/three` is an acceptable helper with a documented reason. **Severity: low.**
- **DP-3 — Canvas accessibility.** ✅ Settled: the synchronized parallel accessible DOM **Provenance
  Ledger**; every canvas/decorative layer `aria-hidden` (D5). **Severity: low.**
- **DP-4 — Art direction & fonts (no-fetch).** Default: the **Provenance Observatory** identity of
  §U5.1/§U8.11 — deep-space void, luminous bodies, verify-gold — with a **system-font fallback stack** (no
  external fetch). Procedural bodies + seeded starfield; no fetched `.glb`/HDRI/textures. **Severity: low.**
- **DP-5 — Layout algorithm.** Default: **deterministic layered longest-path** layout, 2D (§U8.1) **and** 3D
  (§U8.2 authored `SHELL_SLOTS` ring), *not* force-directed (determinism/testability; no `Math.sin`/`cos` in
  the golden path). **Severity: low.**
- **DP-6 — Verification derivation.** Default: derive verification steps by **re-using the domain**
  (`merkleRoot`/subject-digest/`assertHumanAuthority`/stub `Verifier`); the app computes no crypto and no
  grade (D4). **Severity: low.**
- **DP-7 — Render-tier ladder & budget.** Default: `resolveRenderTier` (§U8.10) with the pinned
  degrade/recover thresholds; **60fps** target; auto-degrade Cinematic→Standard→Calm; no-WebGL → calm 2D.
  **Severity: low.**
- **DP-8 — Sound assets.** Default this slice: **no audio asset pipeline** — `resolveSoundCue` returns
  deterministic caption ids only, muted by default; the tamper cue is **neutral**. A real committed,
  non-fetched sample set is a later non-breaking addition. **Severity: low.**

---

## §U14 · Assumptions

- **Builds on the completed Part I domain.** `@gt100k/evidence-graph` (+ its adapters) is available and
  **unchanged**; this expansion reuses its public API (`addNode`/`addEdge`/`merkleRoot`/
  `assembleEvidencePacket`/`assertHumanAuthority`/`traceEvidence`, the `Hasher`/`Verifier` ports, and the
  deferred `TransparencyLog`/`ErasureService` stubs) and reads it — it never edits it. The domain's golden
  values (Part I **Golden Values**) remain the arbiter.
- **Synthetic-only, read-only.** No real learners/consent/admissions/legal; the fixture is committed
  synthetic + pseudonymous; the app renders read-only and needs no auth/persistence/network.
- **The app owns *presentation of* provenance, not the integrity/grade logic.** The domain owns
  hashing/Merkle/attestation/human-authority; the app displays them. Humans own every grade — the app shows
  the domain's human-owned `Outcome`; it never computes a grade or an accusation.
- **Performance budget is an acceptance target.** 60fps orbit/fly (min device) + auto-degradation is
  validated by `next build` + the acceptance walkthrough, not a view-package unit test (the pure view carries
  no rendering; the tier thresholds are unit-tested).
- **New dirs only.** All code lives in `packages/evidence-explorer-view` + `apps/evidence-explorer`; shared
  root files and other apps/packages are untouched except the single final root-`tsconfig.json` references
  task (T-ROOT).

---

## §U15 · Process language intentionally omitted

These planning artifacts describe **product** guardrails only (human-owned grades, cited assistance, WCAG,
reduced-motion, no dark patterns, the performance budget). They do **not** encode any development-process,
merge-gate, or PR-loop language; the loop gate is purely the pinned `typecheck` + `test` (+ `next build` for
app phases).
