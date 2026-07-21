# Data Model: Provenance Explorer (view-model)

All types below live in `@gt100k/evidence-explorer-view` (`packages/evidence-explorer-view/src/model.ts`)
and are **derived, read-only view models** over `@gt100k/evidence-graph`. They carry no I/O, no
wall-clock, and no randomness. The domain types (`EvidenceNode`, `EvidenceEdge`, `EvidenceGraph`,
`EvidencePacket`, `Attestation`, `ActorRef`, `VerificationResult`) are **imported** from
`@gt100k/evidence-graph` and never redefined here. See [../data-model.md](../data-model.md) for those.

**Structural guardrail (enforced by `test/guardrails.test.ts`, SC-E11).** None of the view types below
may declare any of these fields:
`price | currency | rank | leaderboard | percentile | outOf | streak | countdown | urgency | dropRate |
rarity | accusation`. Red / `"mismatch"` is representable **only** on `VerificationView.sealState`.

---

## NodeGlyph (enum of glyph ids)

`diamond | play | blueprint | quote | spark | scale | hex | seal` — drawn as committed inline SVG
shapes (never emoji). Mapping fixed by `resolveNodeGlyph(type)` (§8.2):

| NodeType | glyph | colorRole token |
|---|---|---|
| `Artifact` | `diamond` | `artifact` (`#E9C46A`) |
| `Attempt` | `play` | `attempt` (`#4CC9F0`) |
| `Transformation` | `blueprint` | `transformation` (`#5E7CE2`) |
| `Claim` | `quote` | `claim` (`#B892FF`) |
| `Assistance` | `spark` | `assistance` (`#3DDC97`) |
| `Review` | `scale` | `review` (`#FFB03A`) |
| `Contribution` | `hex` | `contribution` (`#F072C0`) |
| `Outcome` | `seal` | `outcome` (`#FF7A8A`) |

## ActorTone (enum)

`human | model | tool | system` — the presentation tone of an actor. A `model` actor is rendered
**cited/neutral** (`--model`), never as an accusation.

## ActorChip

Derived from the domain `ActorRef`.

| Field | Type | Notes |
|---|---|---|
| `kind` | ActorKind | from `ActorRef.kind` |
| `ref` | string | pseudonymous ref (no PII) |
| `displayName` | string? | optional synthetic |
| `tone` | ActorTone | presentation tone; `model` → neutral/cited |
| `citedLabel` | string? | e.g. "Declared AI assistance — cited" for a `model` actor; **never** an accusation. |

> **No `accusation` field.** A `model` actor can only ever be `cited`. (FR-E08/E09, SC-E09.)

## Vec2 / NodePosition

`{ x: number; y: number }` — deterministic layout coordinate (§8.1). `NodePosition` also carries
`{ rank: number; orderInRank: number }`.

## NodeView

Derived from an `EvidenceNode` + layout + packet membership. **No** competitive/urgency fields.

| Field | Type | Notes |
|---|---|---|
| `id` | string | the domain content-hash id (mono, copyable in UI) |
| `key` | string | stable fixture/debug label (e.g. `"outcome-grade"`) |
| `type` | NodeType | one of the 8 |
| `glyph` | NodeGlyph | `resolveNodeGlyph(type)` |
| `colorRole` | keyof PALETTE (node) | `resolveNodeColorRole(type)` |
| `label` | string | human-readable label (color-independent state carrier) |
| `actor` | ActorChip | derived actor |
| `tool` | ToolRef? | optional tool/version (from the node) |
| `inputs` | string[] | input node ids (link targets) |
| `timestamp` | string | ISO timestamp |
| `consentScope` | { scope: string; purpose?: string } | labeled "synthetic" in UI |
| `payload` | object | type-specific payload (read-only display) |
| `position` | NodePosition | `{ x, y, rank, orderInRank }` (deterministic §8.1) |
| `isInMilestone` | boolean | node ∈ packet `nodeIds` (island = false) |
| `isHumanOwned` | boolean | grade `Outcome` with a `human` `authored_by` (FR-E08) |
| `isCitedAssistance` | boolean | `Assistance`/`Review` authored by a `model` actor (FR-E09) |

## EdgeStrokeStyle (enum) / EdgeCap (enum)

`solid | dotted | dashed | dashed-fine` / `plain | check | slash | arrow`. Fixed by `EDGE_STYLES` (§8.7).

## EdgeView

Derived from an `EvidenceEdge`.

| Field | Type | Notes |
|---|---|---|
| `type` | EdgeType | one of the 6 |
| `from` | string | source node id |
| `to` | string | target node id / actor ref |
| `label` | string | e.g. "derived from" (color/stroke never the sole cue) |
| `strokeStyle` | EdgeStrokeStyle | from `EDGE_STYLES` |
| `cap` | EdgeCap | from `EDGE_STYLES` |
| `path` | { x1;y1;x2;y2; c1x;c1y;c2x;c2y } | a deterministic cubic path between node positions |
| `isLineage` | boolean | true for provenance edges (`derived_from`/`released_as`/`validates`) |

## TimelineGroup (enum)

`plan | assist | artifact | attempt | revision | claim | review | release | contribution | outcome`.

## TimelineBeat

| Field | Type | Notes |
|---|---|---|
| `order` | number | 0-based, deterministic (§8.3) |
| `nodeId` | string | the node this beat represents |
| `group` | TimelineGroup | phase grouping |
| `label` | string | beat label |
| `glyph` | NodeGlyph | the node's glyph |
| `timestamp` | string | ISO timestamp |

## TimelineView

`{ beats: TimelineBeat[] }` — deterministic ordered beats (§8.3); island excluded.

## VerifyStatus (enum)

`pass | fail | stub`.

## SealState (enum)

`unverified | verified | mismatch` — the **only** carrier of `"mismatch"`/`--tamper`.

## VerifyStep

Derived read-only from the domain (§8.4).

| Field | Type | Notes |
|---|---|---|
| `id` | string | one of `"merkle-root" \| "subject-digest" \| "human-authority" \| "transparency-log-stub"` |
| `label` | string | human-readable |
| `status` | VerifyStatus | derived from the domain (re-derive/verify); never re-implemented |
| `detail` | object | e.g. `{ committed, recomputed }` for merkle; domain `reasons[]` for authority |
| `evidenceRef` | string? | optional link to the node/attestation |
| `nonProduction` | boolean? | `true` for the transparency-log stub (pre-live gate); never blocks the seal |

## VerificationView

| Field | Type | Notes |
|---|---|---|
| `steps` | VerifyStep[] | ordered (§8.4) |
| `sealState` | SealState | `verified` iff all non-stub steps pass; `mismatch` iff any fail |
| `merkleRoot` | string | the packet's committed root (mono) |
| `recomputedRoot` | string | re-derived via the domain `merkleRoot` |
| `subjectDigest` | string | the attestation subject digest |

> `buildVerificationView` **reuses** `@gt100k/evidence-graph` (`merkleRoot`, subject-digest check,
> `assertHumanAuthority`) and the stub `Verifier`; it computes **no** grade and re-implements **no**
> crypto (D4, FR-E05/E06, SC-E08).

## LedgerNode / LedgerView (accessible parity)

Built from the same `ExplorerView` (D5). Drives the DOM `role="tree"` + lists + live region.

| Field | Type | Notes |
|---|---|---|
| `tree` | LedgerNode[] | each `{ nodeId, accessibleName, state, childrenIds }` for `role="tree"` |
| `timelineList` | { order; label; nodeId }[] | ordered list parity of the timeline |
| `verificationList` | { id; label; status; nonProduction? }[] | status list parity |
| `panels` | Record<nodeId, string> | described-region text per node (id/actor/tool/inputs/...) |

`LedgerNode.accessibleName` = `"<type> — <label>, <state>, <actor>[, human-owned | cited AI assistance]"`.

## MotionMode (enum) / MotionSpec

`animated | reduced`.

| Field | Type | Notes |
|---|---|---|
| `kind` | string | a motion-table key (§8.5) |
| `mode` | MotionMode | `reduced` under `prefers-reduced-motion`/plain |
| `durationMs` | number | from `MOTION` (or reduced column) |
| `easing` | string | from `EASINGS` (`linear` when reduced) |

## Presentation

| Field | Type | Notes |
|---|---|---|
| `reducedMotion` | boolean | resolved from system/on/off |
| `plain` | boolean | plain-mode flag (state-identical; `plainViewEquals`) |
| `density` | "comfortable" \| "compact" | spacing preset (presentation only) |

## ExplorerView (the composed view — drives every renderer)

| Field | Type | Notes |
|---|---|---|
| `meta` | { milestoneRef; subjectDigest; nodeCount; inMilestoneCount } | summary |
| `nodes` | NodeView[] | all nodes (incl. island) |
| `edges` | EdgeView[] | all edges |
| `bounds` | { x; y; width; height } | world bounds (§8.1) |
| `timeline` | TimelineView | build timeline |
| `verification` | VerificationView | derived from the domain |
| `ledger` | LedgerView | accessible parity |
| `tokens` | { palette: PALETTE; typography: TYPOGRAPHY } | golden tokens |
| `presentation` | Presentation | reducedMotion / plain / density (presentation-only) |

**Parity invariant** (`plainViewEquals(a, b)`, SC-E02/E03): two `ExplorerView`s that differ only in
`presentation` (reducedMotion/plain/density) have **identical** `nodes`/`edges`/`bounds`/`timeline`/
`verification`/`ledger` state (the underlying view is recomputed only from graph+packet, never from
presentation flags).

## Golden registries (constants)

- **`PALETTE`** — exact hex tokens (§8.6): void/panel/panel2/line/ink/inkMuted/focus/verify/tamper/human/
  model + the 8 node hues.
- **`TYPOGRAPHY`** — exact font stacks + scale (§8.6).
- **`MOTION`** — exact durations (§8.5).
- **`EASINGS`** — exact cubic-béziers + `SPRINGS` (§8.5).
- **`NODE_GLYPHS`** / **`EDGE_STYLES`** — exact node glyphs + edge stroke styles/caps/labels (§8.7).
- **`CAMERA`** / **`PARALLAX`** — exact camera + parallax config (§8.8).

## Fixture

`explorerFixture(hasher: Hasher)` → `{ graph: EvidenceGraph; packet: EvidencePacket; verifierResult:
VerificationResult }` — the committed synthetic "speaker-v1" milestone (§7), built via the
`@gt100k/evidence-graph` public API. `applyTamper(fixture)` returns a copy with one bound node's payload
mutated (drives the tamper demo). Both are pure given an injected `Hasher` (tests inject the real
`adapters/evidence-hash-node` hasher; layout goldens are hash-independent).
