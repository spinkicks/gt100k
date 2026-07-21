# Phase 1 Data Model: EvidenceGraph

> **One spec home.** **Part I** below is the pure domain data model (unchanged). **Part II** (folded in from
> the former `explorer/data-model.md`) is the **Provenance Explorer view-model** — derived, read-only view
> types over these domain types, extended for the 3D "Provenance Observatory" (3D positions, camera
> keyframes, render tiers). See [spec.md](./spec.md) Part I / Part II.

---

# PART I — Domain data model (`packages/evidence-graph`)

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

---
---

# PART II — Provenance Explorer view-model (`packages/evidence-explorer-view`)

All types below live in `@gt100k/evidence-explorer-view` (`packages/evidence-explorer-view/src/model.ts`)
and are **derived, read-only view models** over `@gt100k/evidence-graph`. They carry no I/O, no wall-clock,
no randomness, and **no `Math.sin`/`Math.cos` in the golden layout path** (the 3D ring uses the authored
`SHELL_SLOTS` table). The Part I domain types (`EvidenceNode`, `EvidenceEdge`, `EvidenceGraph`,
`EvidencePacket`, `Attestation`, `ActorRef`, `VerificationResult`) are **imported** from
`@gt100k/evidence-graph` and never redefined here.

**Structural guardrail (enforced by `test/guardrails.test.ts`, SC-E11).** None of the view types below may
declare any of these fields:
`price | currency | rank | leaderboard | percentile | outOf | streak | countdown | urgency | dropRate |
rarity | accusation`. The neutral provenance index is named **`depthRank`** (allowed). Red / `"mismatch"` is
representable **only** on `VerificationView.sealState`.

## NodeBody (enum) / NodeGlyph (enum)

`NodeBody` = `world | moon | blueprint | beacon | comet | gold-star | crystal | seal-sun` — the 3D
procedural body (drawn as three.js geometry; never a fetched asset). `NodeGlyph` = `diamond | play |
blueprint | quote | spark | scale | hex | seal` — the 2D committed inline-SVG glyph (never emoji). Both fixed
per §U8.12:

| NodeType | body | glyph | colorRole token |
|---|---|---|---|
| `Artifact` | `world` | `diamond` | `artifact` (`#E9C46A`) |
| `Attempt` | `moon` | `play` | `attempt` (`#4CC9F0`) |
| `Transformation` | `blueprint` | `blueprint` | `transformation` (`#5E7CE2`) |
| `Claim` | `beacon` | `quote` | `claim` (`#B892FF`) |
| `Assistance` | `comet` (`declaredTag:true`) | `spark` | `assistance` (`#3DDC97`) |
| `Review` | `gold-star` | `scale` | `review` (`#FFB03A`) |
| `Contribution` | `crystal` | `hex` | `contribution` (`#F072C0`) |
| `Outcome` | `seal-sun` | `seal` | `outcome` (`#FF7A8A`) |

## ActorTone (enum) / ActorChip

`ActorTone` = `human | model | tool | system`. A `model` actor is rendered **cited/neutral** (`--model`),
never as an accusation.

| Field | Type | Notes |
|---|---|---|
| `kind` | ActorKind | from `ActorRef.kind` |
| `ref` | string | pseudonymous ref (no PII) |
| `displayName` | string? | optional synthetic |
| `tone` | ActorTone | presentation tone; `model` → neutral/cited |
| `citedLabel` | string? | e.g. "Declared AI assistance — cited" for a `model` actor; **never** an accusation. |

> **No `accusation` field.** A `model` actor can only ever be `cited`. (FR-E08/E09, SC-E09.)

## Vec2 / Vec3

`Vec2 = { x:number; y:number }` (2D layout §U8.1). `Vec3 = { x:number; y:number; z:number }` (3D layout
§U8.2).

## NodeView

Derived from an `EvidenceNode` + 2D/3D layout + packet membership + growth order. **No** competitive/urgency
fields.

| Field | Type | Notes |
|---|---|---|
| `id` | string | the domain content-hash id (mono, copyable in UI) |
| `key` | string | stable fixture/debug label (e.g. `"outcome-grade"`) |
| `type` | NodeType | one of the 8 |
| `body` | NodeBody | `resolveNodeBody(type)` — the 3D body |
| `glyph` | NodeGlyph | `resolveNodeGlyph(type)` — the 2D glyph |
| `colorRole` | keyof PALETTE (node) | `resolveNodeColorRole(type)` |
| `label` | string | human-readable label (color-independent state carrier) |
| `actor` | ActorChip | derived actor |
| `tool` | ToolRef? | optional tool/version (from the node) |
| `inputs` | string[] | input node ids (link targets) |
| `timestamp` | string | ISO timestamp |
| `consentScope` | { scope:string; purpose?:string } | labeled "synthetic" in UI |
| `payload` | object | type-specific payload (read-only display) |
| `pos2d` | Vec2 | deterministic 2D layout (§U8.1) |
| `pos3d` | Vec3 | deterministic 3D layout (§U8.2) |
| `depthRank` | number | longest-provenance-path index (neutral; **not** a competitive rank) |
| `orderInRank` | number | insertion order within the rank |
| `birthOrder` | number | build-order index for the time-scrub (§U8.7); island = -1 |
| `isInMilestone` | boolean | node ∈ packet `nodeIds` (island = false) |
| `isHumanOwned` | boolean | grade `Outcome` with a `human` `authored_by` (FR-E08) |
| `isCitedAssistance` | boolean | `Assistance`/`Review` authored by a `model` actor (FR-E09) |

## EdgeThreadStyle (enum) / EdgeCap (enum) / EdgeView

`EdgeThreadStyle` = `solid | dotted | dashed | dashed-fine | frayed`. `EdgeCap` = `plain | check | slash |
arrow`. Fixed by `EDGE_THREADS` (§U8.12).

| Field | Type | Notes |
|---|---|---|
| `type` | EdgeType | one of the 6 |
| `from` | string | source node id |
| `to` | string | target node id / actor ref |
| `label` | string | e.g. "derived from" (color/thread never the sole cue) |
| `threadStyle` | EdgeThreadStyle | from `EDGE_THREADS` |
| `cap` | EdgeCap | from `EDGE_THREADS` |
| `hasFlow` | boolean | directional light-flow (true for lineage edges) |
| `path2d` | { x1;y1;x2;y2; c1x;c1y;c2x;c2y } | deterministic cubic path between 2D node positions |
| `path3d` | { from:Vec3; to:Vec3; mid:Vec3 } | deterministic quadratic control for the 3D tube |
| `isLineage` | boolean | true for provenance edges (`derived_from`/`released_as`/`validates`) |

## TimelineGroup (enum) / TimelineBeat / GrowthTimelineView

`TimelineGroup` = `plan | assist | artifact | attempt | revision | claim | review | release | contribution
| outcome`.

`TimelineBeat`:

| Field | Type | Notes |
|---|---|---|
| `order` | number | 0-based, deterministic (§U8.7) |
| `nodeId` | string | the node this beat represents |
| `group` | TimelineGroup | phase grouping |
| `label` | string | beat label |
| `body` | NodeBody | the node's body |
| `glyph` | NodeGlyph | the node's glyph |
| `timestamp` | string | ISO timestamp |
| `birthOrder` | number | build-order index used by the time-scrub |

`GrowthTimelineView` = `{ beats: TimelineBeat[] }` — deterministic ordered beats (§U8.7); island excluded.
A scrub position `t` reveals `beats` with `birthOrder ≤ t`.

## VerifyStatus (enum) / SealState (enum) / VerifyStep / VerificationView

`VerifyStatus` = `pass | fail | stub`. `SealState` = `unverified | verified | mismatch` — the **only**
carrier of `"mismatch"`/`--tamper`.

`VerifyStep` (derived read-only from the domain, §U8.8):

| Field | Type | Notes |
|---|---|---|
| `id` | string | `"merkle-root" \| "subject-digest" \| "human-authority" \| "transparency-log-stub"` |
| `label` | string | human-readable |
| `status` | VerifyStatus | derived from the domain; never re-implemented |
| `detail` | object | e.g. `{ committed, recomputed }` for merkle; domain `reasons[]` for authority |
| `evidenceRef` | string? | optional link to the node/attestation |
| `nonProduction` | boolean? | `true` for the transparency-log stub; never blocks the seal |

`VerificationView`:

| Field | Type | Notes |
|---|---|---|
| `steps` | VerifyStep[] | ordered (§U8.8) |
| `sealState` | SealState | `verified` iff all non-stub steps pass; `mismatch` iff any fail |
| `merkleRoot` | string | the packet's committed root (mono) |
| `recomputedRoot` | string | re-derived via the domain `merkleRoot` |
| `subjectDigest` | string | the attestation subject digest |
| `verifyWaveOrder` | string[] | deterministic edge order for the verify light-wave (§U8.8) |

> `buildVerificationView` **reuses** `@gt100k/evidence-graph` (`merkleRoot`, subject-digest check,
> `assertHumanAuthority`) and the stub `Verifier`; it computes **no** grade and re-implements **no** crypto
> (D4, FR-E05/E06, SC-E08/E20).

## CameraKeyframe / RenderTier / RenderCaps

`CameraKeyframe` = `{ id:string; position:Vec3; target:Vec3; fov:number; durationToken:keyof MOTION;
easing:keyof EASINGS }` (§U8.9; `focus(node)` derives `position` from `node.pos3d + offset`).

`RenderTier` = `"cinematic" | "standard3d" | "calm2d"`. `RenderCaps` = `{ prefersReducedMotion:boolean;
savePower:boolean; webglAvailable:boolean; gpuTier:0|1|2|3; override?:"auto"|RenderTier }`.
`resolveRenderTier(caps)` → `RenderTier` per the §U8.10 truth table; `TIERS` also carries the
degrade/recover thresholds (`FPS_BUDGET`/`DEGRADE_BELOW`/`DEGRADE_SAMPLES`/`RECOVER_ABOVE`/`RECOVER_MS`).

## LedgerNode / LedgerView (accessible parity)

Built from the same `ExplorerView` (D5). Drives the DOM `role="tree"` + lists + live region.

| Field | Type | Notes |
|---|---|---|
| `tree` | LedgerNode[] | each `{ nodeId, accessibleName, state, childrenIds }` for `role="tree"` |
| `timelineList` | { order; label; nodeId; birthOrder }[] | ordered list parity of the time-scrub |
| `verificationList` | { id; label; status; nonProduction? }[] | status list parity |
| `panels` | Record<nodeId, string> | described-region text per node (id/actor/tool/inputs/...) |

`LedgerNode.accessibleName` = `"<type> — <label>, <state>, <actor>[, human-owned | cited AI assistance]"`.

## MotionMode (enum) / MotionSpec

`MotionMode` = `animated | reduced`. `MotionSpec` = `{ kind:string; mode:MotionMode; durationMs:number;
easing:string }` — from `MOTION`/`EASINGS`; under `reducedMotion` → `mode:"reduced"`, `easing:"linear"`,
`durationMs` from the reduced column (§U8.5).

## Presentation

| Field | Type | Notes |
|---|---|---|
| `reducedMotion` | boolean | resolved from system/on/off |
| `tier` | RenderTier | active render tier (from `resolveRenderTier` or override) |
| `plain` | boolean | plain-mode flag (state-identical; `plainViewEquals`) |
| `density` | "comfortable" \| "compact" | spacing preset (presentation only) |
| `scrub` | number | current time-scrub position (`birthOrder` threshold) |
| `selectedId` | string? | focused node id |

## ExplorerView (the composed view — drives every render tier)

| Field | Type | Notes |
|---|---|---|
| `meta` | { milestoneRef; subjectDigest; nodeCount; inMilestoneCount } | summary |
| `nodes` | NodeView[] | all nodes (incl. island) |
| `edges` | EdgeView[] | all edges |
| `bounds2d` | { x; y; width; height } | 2D world bounds (§U8.1) |
| `bounds3d` | { min:Vec3; max:Vec3; center:Vec3 } | 3D AABB + center (§U8.2) |
| `timeline` | GrowthTimelineView | build/time-scrub growth order |
| `verification` | VerificationView | derived from the domain |
| `camera` | CameraKeyframe[] | the named keyframes (§U8.9) |
| `ledger` | LedgerView | accessible parity |
| `tokens` | { palette: PALETTE; typography: TYPOGRAPHY } | golden tokens |
| `presentation` | Presentation | tier / reducedMotion / plain / density / scrub / selection |

**Parity invariant** (`plainViewEquals(a, b)`, SC-E02/E03): two `ExplorerView`s that differ only in
`presentation` (tier/reducedMotion/plain/density/scrub/selection) have **identical**
`nodes`/`edges`/`bounds2d`/`bounds3d`/`timeline`/`verification`/`camera`/`ledger` state (the underlying view
is recomputed only from graph+packet, never from presentation flags).

## Golden registries (constants)

- **`PALETTE`** / **`TYPOGRAPHY`** — exact tokens (§U8.11).
- **`MOTION`** / **`EASINGS`** / **`SPRINGS`** — exact durations + curves + spring/damp constants (§U8.5).
- **`NODE_BODIES`** / **`NODE_GLYPHS`** / **`EDGE_THREADS`** — exact 3D bodies + 2D glyphs + edge thread
  styles/caps/flow/labels (§U8.12).
- **`SHELL_SLOTS`** — the authored 12-slot unit-ring table for the 3D layout (§U8.2).
- **`CAMERA`** / **`PARALLAX`** — exact camera keyframes + parallax factors (§U8.9).
- **`TIERS`** — exact tier capabilities + degrade/recover thresholds (§U8.10).
- **`BLOOM`** / **`DOF`** / **`STARFIELD`** — atmosphere tokens (§U8.13; app acceptance targets).

## Fixture

`explorerFixture(hasher: Hasher)` → `{ graph: EvidenceGraph; packet: EvidencePacket; verifierResult:
VerificationResult }` — the committed synthetic "speaker-v1" milestone (§U7), built via the
`@gt100k/evidence-graph` public API. `applyTamper(fixture)` returns a copy with one bound node's payload
mutated (drives the tamper demo). Both are pure given an injected `Hasher` (tests inject the real
`adapters/evidence-hash-node` hasher; layout goldens are hash-independent).
