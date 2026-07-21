# Contract: `@gt100k/evidence-explorer-view` (view-model interface)

This UI expansion exposes no HTTP/network API; its "contract" is the public interface of the pure
view-model package plus the app's rendering obligations. All view functions are **pure** over injected
state (an `EvidenceGraph` / `EvidencePacket` / `VerificationResult` from `@gt100k/evidence-graph` and an
injected `Hasher`) — no I/O, no wall-clock, no `Math.random`. See [../data-model.md](./../data-model.md)
for view types and [../../data-model.md](../../data-model.md) for the domain types this package **reads**.

The Explorer **reads** `@gt100k/evidence-graph`; it never modifies it and never re-implements
hashing/canonicalization/Merkle/attestation/human-authority (D4/D5, FR-E05).

## Public functions (view package)

```text
buildExplorerView(graph, packet, verifierResult, opts) -> ExplorerView
  opts: { reducedMotion: boolean; plain: boolean; density: "comfortable"|"compact"; hasher: Hasher }
  Pure. Composes ONE ExplorerView (nodes+edges+bounds+timeline+verification+ledger+tokens+presentation)
  from the domain graph/packet. Reduced-motion/plain change ONLY `presentation`; the underlying view
  state is recomputed from graph+packet, never from flags (parity by construction — plainViewEquals).
  (FR-E02, SC-E02.)

layoutExplorer(graph) -> Map<nodeId, { x, y, rank, orderInRank }>
  Pure, deterministic. Rank = longest provenance path (derived_from ∪ released_as ∪ validates);
  order-in-rank = graph insertion order; x = MARGIN_X + rank*COL_W; y = MARGIN_Y + order*ROW_H;
  disconnected components below at ISLAND_Y. Matches the golden positions (§8.1). (FR-E01/E03, SC-E01.)

resolveNodeGlyph(type) -> NodeGlyph            // §8.2 table (exact)
resolveNodeColorRole(type) -> node color key   // §8.2 table (exact)
  Pure. Every node type → a distinct glyph + color; NodeView always also carries a text label
  (color never the sole cue). (FR-E04, SC-E05/E06.)

buildTimelineView(graph, packet) -> TimelineView
  Pure, deterministic. Beats = milestone nodes ordered by (rank asc, insertion order), grouped into
  plan/assist/artifact/attempt/revision/claim/review/release/contribution/outcome; island excluded.
  (§8.3, SC-E07.)

buildVerificationView(packet, verifierResult, graph, hasher) -> VerificationView
  Pure. Derives ordered steps ["merkle-root","subject-digest","human-authority","transparency-log-stub"]
  by RE-USING the domain: merkleRoot(nodeHashes, hasher) === packet.merkleRoot; attestation subject
  digest === packet.subjectDigest; assertHumanAuthority(subgraph).ok; the deferred TransparencyLog stub
  (nonProduction:true, never blocks). sealState = verified iff all non-stub pass; mismatch iff any fail.
  Computes NO grade; re-implements NO crypto. (FR-E05/E06, SC-E08.)

applyTamper(fixture) -> { graph, packet, verifierResult }
  Pure. Returns a copy with ONE bound node's payload mutated (re-derive shows a Merkle mismatch).
  Drives the tamper demo. Red/shake belong ONLY to the byte-level node + root diff. (FR-E07, SC-E08.)

buildLedgerView(explorerView) -> LedgerView
  Pure. The accessible parity: role="tree" nodes with accessible names, ordered timeline list, a
  verification status list, and per-node described panels. (D5, FR-E11, SC-E10.)

resolveMotion(kind, { reducedMotion }) -> MotionSpec
  Pure. Returns { kind, mode, durationMs, easing } from MOTION/EASINGS; under reducedMotion → mode
  "reduced", easing "linear", durationMs from the reduced column (§8.5). Every motion-table row has a
  reduced equivalent. (FR-E10/E17, SC-E03/E04.)

plainViewEquals(a: ExplorerView, b: ExplorerView) -> boolean
  Pure. True iff a and b have identical underlying state (nodes/edges/bounds/timeline/verification/ledger)
  ignoring `presentation`. (SC-E02/E03.)

explorerFixture(hasher) -> { graph, packet, verifierResult }   // committed synthetic "speaker-v1" (§7)
```

## Constants (exported, golden)

```text
PALETTE       // exact hex tokens (§8.6)
TYPOGRAPHY    // exact font stacks + scale (§8.6)
MOTION        // exact durations ms (§8.5)
EASINGS       // exact cubic-béziers (§8.5); SPRINGS exact
NODE_GLYPHS   // type -> glyph id (§8.7/§8.2)
EDGE_STYLES   // type -> { strokeStyle, cap, label } (§8.7)
CAMERA        // zoom/pan/lookahead/decel/bounds (§8.8)
PARALLAX      // layer factors (§8.8)
```

## Domain surface the Explorer READS (from `@gt100k/evidence-graph`)

```text
addNode(graph, content, hasher) -> { graph, id }      // used only to BUILD the committed fixture
addEdge(graph, edge) -> graph                          // used only to BUILD the committed fixture
merkleRoot(hashes, hasher) -> string                   // re-derived in buildVerificationView
assembleEvidencePacket(graph, sel, hasher) -> Packet   // used to build the fixture packet
assertHumanAuthority(graph) -> VerificationResult      // the human-authority verify step
traceEvidence(graph, nodeId) -> string[]               // the "trace from Outcome" highlight
// ports: Hasher (adapters/evidence-hash-node), Verifier (adapters/evidence-verifier-stub),
//        TransparencyLog/ErasureService stubs (adapters/evidence-deferred) — read as-is, unchanged.
```

## App rendering obligations (verified by `next build` + smoke + walkthrough)

```text
- Render ExplorerView on a layered stage: Canvas starfield (aria-hidden, deterministic/seeded) +
  SVG constellation (aria-hidden, framer-motion) + frosted DOM HUD/panels + the accessible Ledger.
- Pan (1:1 + momentum projection + rubber-band), zoom (origin-aware spring, clamped), focus/expand
  (spring viewBox + look-ahead), all interruptible; never lock input. (§5.3, CAMERA §8.8.)
- All motion via resolveMotion; honor prefers-reduced-motion by default (override system/on/off).
- Verify → stepped checks + Verified ✓ seal (ring-draw + bloom + root ticker); Tamper → byte-node
  shake/glitch + root diff + MISMATCH; aria-live announces both. (§5.7.)
- The SVG/Canvas are aria-hidden; the DOM Ledger is the AT source of truth; keyboard/switch/SR
  operable; visible focus; ≥4.5:1 contrast; color-independent (glyph + text). (D5, §12.)
- No external fetch; zero console errors; no secrets. (FR-E14/E15.)
```

## Contract test obligations (map to FR/SC)

- `layoutExplorer`: deterministic; golden positions (§8.1); island slot; x depends only on rank.
  (FR-E01/E03, SC-E01.)
- `buildExplorerView` + `plainViewEquals`: one composed view; reduced/plain change only presentation.
  (FR-E02, SC-E02/E03.)
- `resolveNodeGlyph`/`resolveNodeColorRole` + `NODE_GLYPHS`/`EDGE_STYLES`: all 8 node + 6 edge types
  mapped to distinct glyph/color/stroke + label; never color-only. (FR-E04, SC-E05/E06.)
- `buildTimelineView`: deterministic grouped order; island excluded. (SC-E07.)
- `buildVerificationView` + `applyTamper`: steps derived from the domain; untampered → verified;
  tampered → mismatch with both roots; stub step nonProduction; no grade computed. (FR-E05/E06, SC-E08.)
- `ActorChip`/`NodeView`: `model` actor cited/neutral (no accusation field); grade `Outcome` human-owned
  with owner. (FR-E08/E09, SC-E09.)
- `buildLedgerView`: every node/beat/step present with accessible name. (FR-E11, SC-E10.)
- `resolveMotion`: exact golden table incl. reduced mode. (FR-E10/E17, SC-E04.)
- Guardrails: view types expose none of price/currency/rank/leaderboard/percentile/outOf/streak/
  countdown/urgency/dropRate/rarity/accusation; no `Math.random`. (FR-E12, SC-E11.)
- Integration: build the view with the real node `Hasher` + stub `Verifier`; domain unchanged; adapter
  swap needs no view change. (FR-E05/E13, SC-E14.)
