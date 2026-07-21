# Contract: `@gt100k/evidence-graph` domain interface

This slice exposes no external HTTP/network API; its "contract" is the public interface of the pure domain package plus the ports implemented by adapters. All domain functions are pure over injected state and injected ports (no I/O, no wall-clock reads, no direct crypto). See [data-model.md](../data-model.md) for `EvidenceNode`, `EvidenceEdge`, `EvidenceGraph`, `EvidencePacket`, `Attestation`, `ActorRef`, `VerificationResult`.

## Public functions (domain)

```text
addNode(graph, content, hasher) -> { graph, id }
  Precondition:  content well-formed (valid NodeType, actor, timestamp, consentScope).
  Behavior:      id = hasher.hash(canonicalize(content)); if id already present → return graph unchanged (idempotent).
                 else insert node keyed by id.
  Postcondition: node retrievable by id; id == hash of canonical content (FR-001/FR-004/FR-005).

addEdge(graph, edge) -> graph
  Precondition:  edge.from and edge.to resolve to existing nodes/actors (no dangling).
  Behavior:      reject if adding the edge would introduce a cycle; else append.
  Postcondition: graph remains an acyclic DAG (FR-006).

assertHumanAuthority(graph) -> VerificationResult
  Pure read: ok=false with reasons if any Outcome grade/judgment is not authored_by a human actor,
             if any model actor authors a node other than Assistance/Review,
             or if any node/edge encodes an authorship-accusation claim kind (FR-008/FR-009).

assembleEvidencePacket(graph, { milestoneRef, subjectDigest, nodeIds }, hasher) -> EvidencePacket
  Precondition:  nodeIds non-empty and all present in graph; assertHumanAuthority(subgraph) ok (FR-014).
  Behavior:      compute merkleRoot over nodeIds' content hashes (canonical order, domain-separated,
                 defined odd-count rule); derive ledgers (assistance/contribution/review/outcomes/failedBranches);
                 build the in-toto attestation binding subjectDigest to merkleRoot.
  Postcondition: packet deterministic for a fixed node set (FR-010/FR-011); refuses on empty set or invariant violation.

merkleRoot(hashes, hasher) -> string
  Pure: RFC-6962 (Certificate Transparency) raw-byte scheme. Decode each lowercase-hex content hash to its
        32 raw digest bytes; sort ascending by digest bytes (== ascending hex). Then:
        leaf(d)      = hasher.hash(0x00 || d)               // 0x00 is a single prefix BYTE; d = 32 digest bytes
        interior(l,r)= hasher.hash(0x01 || l || r)          // 0x01 prefix byte; l,r = 32-byte hashes; || = raw-byte concat
        odd level promotes the lone right-most node UNCHANGED (RFC-6962: k = largest power of two < n),
        never duplicated; single hash → its leaf digest.
        Deterministic (FR-011); domain-separated (FR-021). Golden roots are pinned in spec.md Golden Values
        (e.g. merkleRoot([sha256("a"),sha256("b"),sha256("c")]) === dd67a4e9…45ca647b).

buildAttestation({ subjectDigest, merkleRoot, milestoneRef, builder, materials }) -> Attestation
  Pure: returns the in-toto Statement shape (FR-012). Unsigned in this slice (signing deferred, §19.2 D6).

traceEvidence(graph, nodeId) -> string[]
  Pure read: returns the ids reachable from nodeId along provenance edges (reviewer-traceability shape, FR-019).
```

## Ports (implemented by adapters, injected)

```text
interface Hasher {                            // adapters/evidence-hash-node (Node crypto SHA-256)
  hash(input: Uint8Array): string             // hex sha256; SYNCHRONOUS + pure; SHA-1/MD5 forbidden (FR-007)
}

interface Verifier {                          // adapters/evidence-verifier-stub (deterministic)
  verify(packet: EvidencePacket, hasher: Hasher): Promise<VerificationResult>
                                              // re-derive merkleRoot, check attestation subject digest (FR-013/FR-015)
}

interface EvidenceRepository {                // adapters/evidence-repo-memory (in-memory, synthetic)
  saveNode(node): Promise<void>
  getNode(id): Promise<EvidenceNode | null>
  saveEdge(edge): Promise<void>
  savePacket(packet): Promise<void>
  getPacket(milestoneRef): Promise<EvidencePacket | null>
}
```

## Deferred / stub ports (§19.2 — pre-live gates, non-production, clearly marked)

```text
interface TransparencyLog {                   // D1 — external anchoring deferred
  anchor(merkleRoot: string): Promise<InclusionProofStub>       // deterministic placeholder
  verifyInclusion(root: string, proof: InclusionProofStub): Promise<boolean>
}

interface ErasureService {                    // D2 — crypto-shred erasure deferred
  shred(subjectKeyRef: string): Promise<ErasureTombstoneStub>   // marks tombstone; payload unrecoverable (stub)
}
// D3 (comparative-judgment reliability) and D4 (conformal calibration): OUT OF SCOPE — no interface in this slice.
```

## Contract test obligations (map to FR/SC)

- `addNode`: id == hash of canonical content (FR-001/FR-004, SC-001); byte-identical content ⇒ same id, no change (FR-005, SC-001); any field change ⇒ different id (FR-004).
- `addEdge`: dangling endpoint rejected; cycle rejected; DAG stays acyclic (FR-006, SC-002).
- `assertHumanAuthority`: human-owned grade passes; model-owned grade fails; model `Assistance`/`Review` passes; authorship-accusation node fails (FR-008/FR-009, SC-003).
- `merkleRoot`: deterministic across runs; single-node and odd-count well-defined; domain separation (leaf≠interior) (FR-011, SC-004).
- `assembleEvidencePacket`: deterministic packet for a fixed node set; empty set rejected; invariant-violating subgraph refused (FR-010/FR-014).
- `Verifier` (stub): pass for untampered packet; fail after any single node alteration (FR-013/FR-015, SC-004).
- Adapter swap: domain unchanged across `Hasher`/`Verifier`/`EvidenceRepository` implementations (SC-006); stub `TransparencyLog`/`ErasureService` invocable and marked non-production (FR-017).
- `traceEvidence`: returns supporting nodes for a `Claim`/`Outcome` without unrelated nodes (FR-019, SC-005-shape).
