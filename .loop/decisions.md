# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T002 closed taxonomies and attestation shape
- Decision: represent `NodeType`, `EdgeType`, and `ActorKind` as literal unions derived from readonly value lists, with exhaustive `NODE_TYPE_PROV_BASE` and `EDGE_TYPE_PROV_RELATION` records. Model the in-toto fields with `{ id }` builders and `{ uri, digest.sha256 }` materials.
- Why: literal unions accept the spec's fixture strings directly, the value lists support deterministic iteration, and `satisfies Record<...>` makes a missing taxonomy mapping a compile error. The attestation fields follow the standard typed shape and the spec's pinned `builder.id` default.
- Rejected: native TypeScript enums, which require enum-member syntax and emit extra runtime machinery; partial or string-indexed PROV maps, which would not prove full coverage; untyped attestation predicate objects, which would weaken the required type surface.

## 2026-07-20 — T004/T005 hasher adapter surface
- Decision: expose a stateless `NodeCryptoHasher` class whose public shape is compile-time checked against the domain `Hasher` port from the contract test. Keep the production adapter structurally compatible instead of importing the domain's internal `ports.ts` path before the package barrel is exported.
- Why: a class follows the repo's injected-adapter convention, while structural conformance keeps the adapter declaration portable and avoids leaking a repo-relative internal path into emitted public types. The adapter-local project reference lets the contract test typecheck against the domain project without a shared-root edit.
- Rejected: a singleton or factory in addition to the class, which adds an unrequired API; a production import from the unexported internal port module, which would couple emitted declarations to source layout.

## 2026-07-20 — T006/T007 edge round-trip observability
- Decision: keep the domain `EvidenceRepository` port exactly as specified and add `getEdges()` only to the concrete `InMemoryEvidenceRepository` adapter as a copy-isolated inspection seam.
- Why: T006 requires an edge save/get round-trip, but the settled port exposes `saveEdge` without an edge reader. The adapter-local method makes the acceptance behavior observable without changing the domain contract or exposing mutable storage.
- Rejected: adding `getEdge`/`getEdges` to the domain port, which would contradict its exact settled shape; casting through private adapter state in the test, which would couple the contract test to implementation details.

## 2026-07-20 — T007a hash-independent synthetic seed
- Decision: represent `syntheticMilestone` as declarative node content plus stable fixture keys, with edges referencing those keys or pseudonymous actor/tool refs. Callers resolve node keys to content hashes after `addNode` exists. Use the unrelated `Claim` island to cover the eighth node type without joining the milestone.
- Why: P0 intentionally precedes canonicalization and `addNode`, so a pure fixture cannot derive content-addressed ids yet. Stable keys keep the seed deterministic and reusable by later graph, packet, demo, and explorer builders without embedding ids that violate the hash invariant.
- Rejected: a prebuilt `EvidenceGraph` with fake ids, which would contradict content addressing; a runtime fixture builder that imports crypto or performs I/O, which would violate the pure-fixture requirement; moving test seeds into the domain source API, which would broaden production scope.

## 2026-07-20 — T008/T011 dependency-free canonical encoder
- Decision: implement canonicalization as a small recursive stable-key normalizer followed by native minified JSON serialization, returning the canonical string for later explicit UTF-8 hashing. Treat undefined object fields as absent optional fields.
- Why: the spec explicitly permits a stable-key encoder that reproduces the golden bytes, and the pinned fixture subset uses strings, arrays, and objects. Keeping the encoder local preserves the pure domain package and avoids adding a dependency for this settled subset.
- Rejected: importing a general canonical-JSON package, which adds supply-chain and bundle surface without improving the pinned acceptance behavior; returning bytes directly, which would conflate serialization with the T012 hashing boundary.

## 2026-07-20 — T009/T012 immutable node insertion
- Decision: make `addNode` an immutable graph transformation: a new id produces a new nodes record while sharing the unchanged edges array, and an existing id returns the exact original graph object as the no-op result.
- Why: the domain contract requires pure functions and an unchanged graph for idempotent content. Structural sharing makes both guarantees observable without copying unrelated graph state.
- Rejected: mutating `graph.nodes` in place, which would violate the pure-domain contract; cloning the entire graph for either insertion or a duplicate, which would obscure the specified no-op and add unnecessary work.

## 2026-07-20 — T010/T013 external provenance endpoints
- Decision: require every edge source to be a graph node; resolve a target as either a graph node, an `authored_by` actor ref declared by a node, or a `used_tool` tool name declared by a node. Only node-to-node edges participate in cycle traversal.
- Why: the settled data model makes `from` a node id while permitting `to` to be a node id or actor ref, and the synthetic seed also uses declared tool refs. Actor/tool records are terminal provenance references rather than graph vertices, so they cannot close a directed node cycle.
- Rejected: treating all non-node targets as dangling, which would reject the committed seed; accepting arbitrary external refs for every edge type, which would weaken dangling validation; adding actor/tool refs to the node adjacency map, which would invent vertices absent from `EvidenceGraph`.

## 2026-07-20 — T010a layer-isolated golden hasher
- Decision: make the domain golden test use a test-local `Hasher` that accepts only the exact pinned G1 canonical bytes and returns the pinned G1 digest. Keep real SHA-256 validation in the Node-crypto adapter contract test.
- Why: this proves the public domain path supplies the exact canonical byte sequence and preserves the injected-hasher boundary, while avoiding a reverse dependency from the domain package to its adapter. Together with the adapter's SHA-256 known-answer test, the two layer-local contracts cover the complete path without breaking project-reference direction.
- Rejected: importing `node:crypto` into the domain package test, which would violate the adapter-only crypto boundary; depending on the adapter from the domain project, which would reverse the architecture and create a project-reference cycle; an unconditional constant fake, which would not detect incorrect canonical bytes.

## 2026-07-20 — T015/T016 explicit authority evidence and accusation marker
- Decision: treat a grade/judgment `Outcome` as human-owned only when an `authored_by` edge targets a non-empty actor ref declared unambiguously as `human`. Treat either a node's model actor or an `authored_by` edge to a declared model ref as model authorship. Recognize the prohibited accusation only through the exact `authorshipAccusation` claim-kind sentinel in a payload or edge label, and return deduplicated stable reason codes.
- Why: explicit attribution matches the settled graph contract, unambiguous actor resolution prevents a mixed-kind ref from laundering authority, and an exact sentinel enforces the schema without making semantic accusations from free text. The chosen codes are `HUMAN_OWNER_REQUIRED`, `MODEL_OWNED_GRADE`, `MODEL_AUTHORED_PROHIBITED_TYPE`, and `AUTHORSHIP_ACCUSATION`.
- Rejected: accepting the embedded actor field alone as grade ownership, which would ignore the required attribution edge; scanning arbitrary text for accusation-like language, which would itself create a false-accusation risk; accepting refs declared as both human and model, which would make authority ambiguous.

## 2026-07-20 — T018/T022 fail-closed Merkle inputs
- Decision: reject an empty leaf set with `EMPTY_MERKLE_INPUT` and reject values outside the specified 64-character lowercase SHA-256 form with `INVALID_SHA256_DIGEST`.
- Why: this feature defines Merkle leaves as decoded 32-byte SHA-256 content digests, while packet assembly explicitly refuses empty node sets. Failing closed prevents an unpinned empty root or malformed digest from entering a packet.
- Rejected: silently accepting short, uppercase, or non-hex values, which would not represent the specified raw digest bytes; adopting RFC-6962's separate empty-tree hash, which is not a packet value pinned by this spec.

## 2026-07-20 — T018a layer-isolated Merkle golden hasher
- Decision: drive the G2 golden test with a test-local, fail-closed hasher that maps only the exact prefixed raw-byte inputs to the pinned leaf, interior, and root digests. Keep `merkleRoot` internal until its ordered T026 public export.
- Why: this asserts every pinned G2 root and makes incorrect ordering, prefixes, concatenation, or odd-node promotion fail without introducing a domain-to-Node-adapter dependency or another `node:crypto` import.
- Rejected: importing `NodeCryptoHasher` into the domain project, which would reverse the project-reference direction; importing `node:crypto` directly in the domain test, which would violate the adapter-only crypto boundary; exporting Merkle early, which would preempt T026; an unconditional constant hasher, which would not validate the bytes supplied by the Merkle algorithm.
