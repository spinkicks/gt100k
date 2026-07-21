# Loop decisions — what was chosen and why (do not re-litigate)

## 2026-07-20 — T002 closed taxonomies and attestation shape
- Decision: represent `NodeType`, `EdgeType`, and `ActorKind` as literal unions derived from readonly value lists, with exhaustive `NODE_TYPE_PROV_BASE` and `EDGE_TYPE_PROV_RELATION` records. Model the in-toto fields with `{ id }` builders and `{ uri, digest.sha256 }` materials.
- Why: literal unions accept the spec's fixture strings directly, the value lists support deterministic iteration, and `satisfies Record<...>` makes a missing taxonomy mapping a compile error. The attestation fields follow the standard typed shape and the spec's pinned `builder.id` default.
- Rejected: native TypeScript enums, which require enum-member syntax and emit extra runtime machinery; partial or string-indexed PROV maps, which would not prove full coverage; untyped attestation predicate objects, which would weaken the required type surface.
