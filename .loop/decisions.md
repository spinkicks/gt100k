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
