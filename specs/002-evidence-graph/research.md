# Phase 0 Research: EvidenceGraph

No blocking unknowns remain. The decisions below record the choices the plan rests on and why the genuinely-hard parts are deferred to stubs (PRD §19.2).

## Decision: Pure TypeScript domain package, I/O behind ports

- **Decision**: Implement the EvidenceGraph core as a pure, framework-agnostic `packages/evidence-graph` (strict TS, no I/O, no direct crypto), mirroring `packages/learning-loop`. All I/O sits behind ports (`Hasher`, `Verifier`, `EvidenceRepository`, plus stub `TransparencyLog`/`ErasureService`) with in-memory/stub adapters under `adapters/evidence-*`.
- **Rationale**: The DAG, Merkle, attestation, and invariant logic are deterministic computations; keeping them pure makes them fully unit-testable and replay-safe, and matches the PRD "deterministic services" invariant and the factory's existing Vitest/Biome/tsc gate.
- **Alternatives considered**: A Go/Rust service (PRD §26.2/§26.3) — deferred; unnecessary weight for a synthetic slice with no latency/scale needs. Embedding logic in an app — rejected; entangles rules with a framework and hurts testability.

## Decision: Content addressing via a canonical serialization + `Hasher` port

- **Decision**: Each node id = `Hasher.hash(canonicalize(content))` where `content` excludes the id itself; canonicalization is a stable-key canonical encoding (JCS/RFC 8785-style). `Hasher` is a synchronous port (SHA-256); a Node-crypto adapter implements it.
- **Rationale**: Canonicalization guarantees logically-equal content hashes identically (FR-004) and makes idempotent insert (FR-005) trivial. Keeping SHA-256 behind a port keeps the domain pure (FR-007), keeps the algorithm swappable (BLAKE3 later), and forbids SHA-1/MD5 by construction (PRD §19).
- **Alternatives considered**: Hashing raw `JSON.stringify` — rejected (key-order and formatting instability). Importing `node:crypto` in the domain — rejected (breaks purity/testability; couples domain to a runtime).

## Decision: PROV-based node/edge taxonomy (extension, not bespoke)

- **Decision**: Model the eight node types and six edge types as a domain extension of W3C PROV (`Entity`/`Activity`/`Agent`), recording the mapping in `data-model.md`. Do **not** ship a PROV serializer in this slice.
- **Rationale**: PRD §19 / STD-03 require inheriting PROV interoperability rather than inventing an ontology; encoding the mapping now keeps a future PROV/ProvONE exporter cheap without adding scope here.
- **Alternatives considered**: A bespoke ontology — rejected by PRD. Shipping a full PROV-O RDF exporter now — deferred (scope).

## Decision: Deterministic Merkle root with domain separation

- **Decision**: Compute the per-packet Merkle root over the node content hashes sorted lexicographically; hash leaves with a `0x00` prefix and interior nodes with a `0x01` prefix; on an odd count, promote/duplicate the last node at that level. Single-node packets are valid; empty packets are rejected.
- **Rationale**: Canonical ordering + a defined odd-count rule make the root byte-deterministic (FR-011, SC-004); domain separation prevents second-preimage/leaf-as-interior attacks (spec edge case). This follows the SLSA/in-toto pattern of a hash-over-materials root.
- **Alternatives considered**: Insertion-order Merkle trees — rejected (non-deterministic across callers). No domain separation — rejected (second-preimage weakness).

## Decision: in-toto Statement shape as a typed record; signing deferred

- **Decision**: Emit the attestation as an in-toto **Statement** shape (`_type`, `predicateType`, `subject[].digest.sha256`, `predicate{builder, materials, merkleRoot, milestone}`) as a typed record. Do **not** sign it in this slice; the stub `Verifier` checks structure, subject digests, and Merkle re-derivation only.
- **Rationale**: PRD §19/STD-05 specify an in-toto + transparency-log backbone, but signing keys and the attestor hierarchy are a pre-live hardening item (§19.2 D6). The typed shape gives the build loop something concrete and verifiable now; real signing/WASI verification slot in behind the same port later.
- **Alternatives considered**: Full Sigstore/cosign signing now — deferred (D6, out of synthetic-beta scope). Skipping the attestation entirely — rejected (PRD §28 `EvidencePacket` requires it).

## Decision: Encode the human-authority invariant as a pure validation pass

- **Decision**: `assertHumanAuthority(graph)` rejects any `Outcome`/grade attributed to a non-human actor and any node/edge that encodes an AI-authorship accusation; a `model` actor may author only `Assistance`/`Review` nodes. Packet assembly runs this pass and refuses to emit a packet on violation.
- **Rationale**: Constitution I/IV/IX and PRD §19 make this non-negotiable; encoding it as a pure predicate over the graph makes it exhaustively testable and enforced by construction at assembly time (FR-008/FR-009/FR-014).
- **Alternatives considered**: Enforcing only at the app/UI layer — rejected (bypassable; the invariant must live in the domain). A model-graded fallback — prohibited by the constitution.

## Decision: Defer the genuinely-hard parts to marked stubs (§19.2)

- **Decision**: Ship stub interfaces for external transparency-log anchoring (`TransparencyLog`, D1) and crypto-shred erasure (`ErasureService`, D2) with deterministic placeholder behavior, clearly labeled non-production/pre-live-gate. Comparative-judgment reliability (D3) and conformal calibration (D4) are out of scope for this slice (no interface).
- **Rationale**: PRD §19.2/§32.4 place these behind the pre-live gate; the synthetic beta carries no live child data, so real implementations must not block this slice but must not be silently omitted either — the stubs mark the seams and keep the Release Threshold Registry row (§33.1) honest.
- **Alternatives considered**: Implementing them now — rejected (out of scope, genuinely hard, no live-data driver). Omitting them entirely — rejected (loses the explicit deferral seam the PRD requires).
