# Phase 1 Data Model: EvidenceGraph

All identifiers are pseudonymous; no real PII (Constitution V; synthetic-only). The taxonomy is a domain extension of W3C PROV (`Entity`/`Activity`/`Agent`), not a bespoke ontology (PRD §19, STD-03).

## NodeType (enum)

`Artifact | Attempt | Transformation | Claim | Assistance | Review | Contribution | Outcome`

| NodeType | PROV base | Meaning |
|---|---|---|
| `Artifact` | Entity | A produced work object (retrospective output). |
| `Attempt` | Activity | What actually ran — retrospective provenance (inputs, outputs, tools, timing, success). |
| `Transformation` | Activity | The declared plan — prospective provenance (WRROC prospective/retrospective split, PRD §19). |
| `Claim` | Entity | An asserted statement about work (e.g. a hermetic-reproduction claim). |
| `Assistance` | Activity | A cited help/AI-assistance event bound to an artifact (never authorship). |
| `Review` | Activity | A human/tool review event. |
| `Contribution` | Activity (Association) | A per-member contribution record (team credit; PRD §28 `ContributionAttestation`). |
| `Outcome` | Entity | A result/grade/judgment tied to an exact release (human-owned when a grade). |

## EdgeType (enum)

`derived_from | authored_by | used_tool | validates | contradicts | released_as`

| EdgeType | PROV relation (approx.) | Direction (from → to) |
|---|---|---|
| `derived_from` | wasDerivedFrom | derived node → source node |
| `authored_by` | wasAttributedTo / wasAssociatedWith | node → actor node/actor ref |
| `used_tool` | used | node → tool |
| `validates` | wasInfluencedBy (+) | reviewing/claim node → validated node |
| `contradicts` | wasInfluencedBy (−) | node → contradicted node |
| `released_as` | wasDerivedFrom / specializationOf | internal node → released artifact |

## ActorKind (enum)

`human | model | tool | system` — drives the human-authority invariant (only `human` may own a grade `Outcome`).

## ActorRef

| Field | Type | Notes |
|---|---|---|
| `kind` | ActorKind | `human` \| `model` \| `tool` \| `system` |
| `ref` | string | pseudonymous actor id (no PII) |
| `displayName` | string? | optional, synthetic |

## ToolRef

| Field | Type | Notes |
|---|---|---|
| `name` | string | tool/toolchain/container name |
| `version` | string | exact version (binds provenance) |

## ConsentScope (stubbed)

| Field | Type | Notes |
|---|---|---|
| `scope` | string | PROV-style scope tag; synthetic-only in this slice |
| `purpose` | string? | optional stubbed purpose; no real consent evaluated (FR-018) |

## EvidenceNode

The content-addressed provenance record (FR-001–FR-005). The `id` is derived, never author-supplied.

| Field | Type | Notes |
|---|---|---|
| `id` | string | = `Hasher.hash(canonicalize(content))`; content-address, excludes itself |
| `type` | NodeType | one of the eight |
| `actor` | ActorRef | who/what produced the node |
| `tool` | ToolRef? | optional tool/version |
| `inputs` | string[] | ids of input nodes (provenance inputs; also validated as edges) |
| `timestamp` | string | ISO timestamp |
| `consentScope` | ConsentScope | stubbed scope field |
| `payload` | object | type-specific data (see below); part of the hashed content |

**Hashed content** = all fields **except** `id` (canonicalized). Two nodes with byte-identical canonical content share an id (FR-005). Any field change changes the id (FR-004, SC-001).

### Type-specific payload notes

- `Assistance.payload` MUST disclose the assisting actor/tool and the affected artifact ref; it MUST NOT assert authorship (FR-009).
- `Outcome.payload` MAY carry `{ kind: "grade" | "judgment" | "result", value, rubricRef? }`. When `kind ∈ {grade, judgment}` the node MUST be `authored_by` a `human` actor (FR-008).
- No payload may carry a prohibited `authorshipAccusation` claim kind (FR-009); the invariant pass rejects it wherever it appears.

## EvidenceEdge

| Field | Type | Notes |
|---|---|---|
| `type` | EdgeType | one of the six |
| `from` | string | source node id (MUST exist) |
| `to` | string | target node id / actor ref (MUST exist for node-to-node edges) |
| `label` | string? | optional, synthetic |

**Validation**: both endpoints resolve (no dangling, FR-006); adding an edge that would create a cycle is rejected (FR-006, SC-002).

## EvidenceGraph

| Field | Type | Notes |
|---|---|---|
| `nodes` | map<id, EvidenceNode> | content-addressed lookup |
| `edges` | EvidenceEdge[] | typed relations |

### State transitions

```text
EMPTY
  -- addNode(content)  --> node content-addressed; idempotent by id (FR-005)
  -- addEdge(edge)     --> validated (endpoints exist, no cycle) then appended (FR-006)
  -- assertHumanAuthority(graph) --> PASS | VIOLATIONS[]   (FR-008/FR-009)
```

- The graph is append-only within a build; content-addressing makes re-adds no-ops.
- Cyclic/dangling edges are rejected at insert time, never surfaced at verify time.

## EvidencePacket

Per-milestone bundle (FR-010; PRD §28 `EvidencePacket`).

| Field | Type | Notes |
|---|---|---|
| `milestoneRef` | string | caller-supplied milestone selection key |
| `subjectDigest` | string | released artifact content digest (the packet subject) |
| `nodeIds` | string[] | milestone node set (non-empty; FR-014) |
| `merkleRoot` | string | deterministic root over `nodeIds`' hashes (FR-011) |
| `artifactHashes` | string[] | artifact/source hashes |
| `failedBranches` | string[] | ids of failed-attempt branches |
| `assistanceLedger` | string[] | `Assistance` node ids |
| `contributionMap` | Record<actorRef, string[]> | contributor → contribution node ids |
| `reviewAnchors` | string[] | `Review` node ids |
| `outcomes` | string[] | `Outcome` node ids |
| `attestation` | Attestation | in-toto Statement shape (below) |

**Derived / invariants**: `merkleRoot` is recomputable from `nodeIds` (SC-004); assembly refuses on human-authority violation or empty node set (FR-014).

## Attestation (in-toto Statement shape)

| Field | Type | Notes |
|---|---|---|
| `_type` | string | e.g. `"https://in-toto.io/Statement/v1"` |
| `predicateType` | string | GT100K evidence/assistance predicate uri (synthetic) |
| `subject` | `{ name: string; digest: { sha256: string } }[]` | binds the released artifact digest |
| `predicate` | object | `{ builder, materials[], merkleRoot, milestoneRef }` |

Signing is deferred (§19.2 D6); this slice ships the typed shape only (see research.md).

## VerificationResult (value object, not persisted)

| Field | Type | Notes |
|---|---|---|
| `ok` | bool | overall pass/fail |
| `reasons` | string[] | machine-readable failure reasons (empty when `ok`) |

## Deferred / stub types (§19.2 — pre-live gates, non-production)

- **`InclusionProofStub`** (from `TransparencyLog`, D1): `{ root: string; logIndex: number; proof: string[]; stub: true }` — deterministic placeholder; real Trillian/Rekor anchoring deferred.
- **`ErasureTombstoneStub`** (from `ErasureService`, D2): `{ subjectKeyRef: string; shredded: true; stub: true }` — deterministic placeholder asserting the *shape* that a future crypto-shred must preserve (retained packets stay hash/root-verifiable); real key lifecycle deferred.
- Comparative-judgment reliability (D3) and conformal calibration (D4): **out of scope**, no type in this slice.
