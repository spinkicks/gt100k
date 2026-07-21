# Feature Specification: EvidenceGraph

**Feature Branch**: `002-evidence-graph`

**Created**: 2026-07-20

**Status**: Draft

**Input**: User description: "A code-first, framework-agnostic core for GT100K's EvidenceGraph (PRD §19): a content-addressed evidence DAG of typed provenance nodes and edges; per-milestone EvidencePacket assembly with a Merkle root and an in-toto-style attestation; deterministic verification behind a port; and the human-authority invariant that every final grade is human-owned and a model output is only a cited Assistance/Review node, never a grade or an authorship accusation. Synthetic-only; consent/legal machinery stubbed; the genuinely-hard parts (external transparency-log anchoring, crypto-shred erasure, comparative-judgment reliability, conformal calibration) are deferred to stubs per §19.2."

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

### Edge Cases

- **Canonicalization**: two logically-equal node contents that differ only in key ordering or insignificant formatting MUST canonicalize to the same bytes and thus the same id.
- **Odd node counts in the Merkle tree**: the tree construction defines a deterministic rule for an odd number of leaves (e.g. promote/duplicate the last leaf) so the root is well-defined for any node count, including a single-node packet.
- **Empty packet**: assembling a packet from zero nodes is rejected (a milestone must bind at least one node).
- **Second-preimage separation**: leaf and interior Merkle hashing use domain separation so a leaf digest cannot be reinterpreted as an interior node.
- **Dangling / cyclic edges**: rejected at insert time (US1), never at verify time.
- **Consent scope (stubbed)**: nodes carry a consent-scope field, but no real consent/legal workflow is evaluated in this slice; synthetic values only.
- **Erasure vs. integrity (deferred)**: the crypto-shred workflow is a stub; the slice only asserts the *shape* that a future shred must preserve (hashes/roots stay verifiable), not the real key lifecycle (§19.2 D2).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST represent an evidence graph as a **content-addressed DAG** of typed nodes and typed edges, where each node's id is the content hash of its canonicalized content.
- **FR-002**: The system MUST support the node types `Artifact`, `Attempt`, `Transformation`, `Claim`, `Assistance`, `Review`, `Contribution`, and `Outcome`, and the edge types `derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, and `released_as` (PRD §19).
- **FR-003**: Each node MUST record a content hash (its id), an actor, an optional tool/version, its inputs, a timestamp, and a consent scope, modeled as a domain extension of W3C PROV (`Entity`/`Activity`/`Agent`) rather than a bespoke ontology (PRD §19, STD-03).
- **FR-004**: Content addressing MUST be **deterministic and canonical**: logically-equal content MUST produce the same id, and any change to content MUST produce a different id. A stable canonical serialization is used for hashing.
- **FR-005**: Adding a node whose content id already exists MUST be idempotent (a no-op returning the existing id).
- **FR-006**: The graph MUST reject an edge that references a missing node (dangling reference) and MUST reject any edge that would introduce a cycle (the DAG stays acyclic).
- **FR-007**: All hashing MUST occur behind a `Hasher` **port** (SHA-256), keeping the domain package pure (no I/O, no direct crypto import); a Node-crypto adapter provides the real implementation. SHA-1 and MD5 are forbidden (PRD §19).
- **FR-008**: The system MUST enforce the **human-authority invariant**: every `Outcome` representing a final grade or non-deterministic judgment MUST be attributed (`authored_by`) to a **named human** actor; no `model` actor may own a grade or judgment (Constitution I/IV; PRD §19).
- **FR-009**: A `model` actor's output MUST be admissible only as an `Assistance` or `Review` node (cited supporting evidence); the system MUST NOT record any node or edge that constitutes an automated **AI-authorship accusation** (Constitution IX; PRD §4.7/§19).
- **FR-010**: The system MUST assemble an `EvidencePacket` for a milestone containing artifact/source hashes, a **Merkle root** over its node hashes, failed branches, an assistance ledger, a contribution map, review anchors, and outcomes (PRD §19, §28 `EvidencePacket`).
- **FR-011**: The Merkle root MUST be computed **deterministically** (canonical node ordering, defined odd-count rule, domain-separated leaf/interior hashing) so the same node set always yields the same root.
- **FR-012**: The system MUST emit an **in-toto-style attestation** as a typed record that binds the packet subject (released artifact digest) to the Merkle root and predicate metadata (builder, materials, milestone) (PRD §19, STD-05).
- **FR-013**: Verification MUST occur behind a `Verifier` **port**; a **deterministic stub adapter** MUST re-derive the Merkle root and check the attestation subject digest, returning a pass/fail result (real WASI verifier deferred, §19.2).
- **FR-014**: Packet assembly MUST refuse to produce a packet when the milestone graph violates the human-authority invariant (FR-008/FR-009), and MUST reject an empty node set.
- **FR-015**: Verification MUST be **tamper-evident** relative to the committed Merkle root: altering any node's content after assembly MUST cause re-verification to fail.
- **FR-016**: All I/O MUST sit behind ports with in-memory/stub adapters: an `EvidenceRepository` (node/edge/packet persistence) with an in-memory adapter, plus the `Hasher` and `Verifier` ports above. The domain package stays framework-agnostic and side-effect-free.
- **FR-017**: The following genuinely-hard capabilities MUST be represented as **stub interfaces only** and clearly marked as pre-live gates, not production: external transparency-log anchoring (`TransparencyLog`, §19.2 D1) and crypto-shred erasure (`ErasureService`, §19.2 D2). Comparative-judgment reliability (§19.2 D3) and conformal calibration (§19.2 D4) are explicitly out of scope for this slice (no interface required).
- **FR-018**: The feature MUST be exercisable end-to-end with **synthetic data only**; no real consent, legal, admissions, or PII workflow is implemented (consent scope is a stubbed field), and none is required to run the slice.
- **FR-019**: The system MUST expose enough of the packet/attestation/graph that a reviewer can trace a public `Claim`/`Outcome` back to its supporting private nodes via edges, without the domain exposing unrelated nodes (reviewer-traceability shape; PRD §19.1).

### Key Entities *(include if feature involves data)*

- **EvidenceNode**: A content-addressed provenance record of one of eight types, carrying id (= content hash), actor, optional tool/version, inputs, timestamp, consent scope, and a type-specific payload. Maps to a PROV `Entity`/`Activity`/`Agent`.
- **EvidenceEdge**: A typed, directed relation (`derived_from`, `authored_by`, `used_tool`, `validates`, `contradicts`, `released_as`) between two node ids; maps to a PROV relation.
- **ActorRef**: The actor of a node with an explicit `kind` (`human` | `model` | `tool` | `system`) and a pseudonymous reference; the `kind` drives the human-authority invariant.
- **ToolRef**: A tool/toolchain reference with name and version (used by `used_tool` and node provenance).
- **ConsentScope**: A stubbed PROV-style scope field on each node (synthetic-only in this slice; no real consent evaluation).
- **EvidenceGraph**: The acyclic collection of nodes and edges with content-addressed lookup and cycle/dangling-edge rejection.
- **EvidencePacket**: A per-milestone bundle: subject artifact digest, node set, Merkle root, assistance ledger, contribution map, review anchors, failed branches, outcomes, and the attestation.
- **Attestation**: An in-toto-style typed record (`_type`, `predicateType`, `subject` with digests, `predicate` with builder/materials/merkleRoot/milestone).
- **VerificationResult**: The pass/fail value object returned by the `Verifier` port with machine-readable reasons.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any node, its id equals the content hash of its canonicalized content, and re-adding byte-identical content yields the same id with **no** graph change, in **100%** of cases (deterministic content-addressing).
- **SC-002**: Every attempt to add a cyclic or dangling edge is rejected; the graph is acyclic in **100%** of runs.
- **SC-003**: A graph attributing a final grade/`Outcome` to a human passes the human-authority check, and any model-owned grade or any authorship-accusation node is rejected — **0** model-owned grades and **0** authorship accusations can be recorded.
- **SC-004**: The Merkle root for a fixed node set is identical across repeated assembly runs (byte-for-byte determinism), and the stub verifier returns pass for an untampered packet and fail for a packet with any single altered node in **100%** of cases.
- **SC-005**: The full flow (build graph → enforce invariant → assemble packet → attest → verify) runs end-to-end for a synthetic milestone with **no** consent/legal/admissions workflow present.
- **SC-006**: Swapping the `Hasher`, `Verifier`, or `EvidenceRepository` adapter requires **no** change to the domain package (ports isolate all I/O); the deferred `TransparencyLog`/`ErasureService` stubs are invocable and clearly marked non-production.

## Assumptions

- **PROV as the base model** (PRD §19, STD-03): the node/edge taxonomy is a domain extension of W3C PROV, not a bespoke ontology, so external tools can consume the graph. This slice encodes the mapping but does not ship a PROV serializer/exporter (deferred).
- **Hash algorithm**: SHA-256 for both node content hashing and the Merkle tree (BLAKE3 is an allowed future alternative per PRD §19; SHA-1/MD5 forbidden). The `Hasher` port keeps the algorithm swappable.
- **Canonical serialization**: a deterministic, stable-key canonical encoding (JCS/RFC 8785-style sorted-key JSON over the hashed subset of fields) is used so logically-equal content hashes identically. The exact encoder is an implementation detail behind the hashing helper.
- **In-toto/SLSA shape, not full signing**: the attestation is a typed in-toto **Statement** shape bound to subject digests; cryptographic signing and the attestor key hierarchy are a pre-live hardening item (§19.2 D6) and are **not** implemented here — the stub verifier checks structure and digests, not signatures.
- **Deferred hard parts are stubs** (§19.2): external transparency-log anchoring (D1) and crypto-shred erasure (D2) are stub interfaces with deterministic placeholder behavior; comparative-judgment reliability (D3) and conformal calibration (D4) are out of scope for this slice. Their absence is a *pre-live* gate, not a slice blocker (synthetic beta carries no live child data, PRD §19.2/§32.4).
- **Synthetic-only, governance stubbed**: no real learners, consent, or legal machinery; consent scope is a carried field with synthetic values. Rights/authority limits still bind (Constitution I/IV/IX): humans own grades; models never grade or accuse.
- **Milestone contract is external**: the milestone → node-set membership decision (which nodes belong to a packet) is an input to this slice (a caller-supplied selection); this feature owns packet assembly/attestation/verification, not the `MilestoneContract` workflow (PRD §28).
- **Parallel-safety**: all code lives in new directories (`packages/evidence-graph`, `adapters/evidence-*`). The workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so no shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) needs editing. The only shared-file touch is adding project references to the root `tsconfig.json`, deferred to the final task for a human to reconcile at merge.
