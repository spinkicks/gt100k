# Contract: `@gt100k/evidence-explorer-view` (view-model interface)

This is the contract for the **Provenance Explorer** UI expansion (spec [../spec.md](../spec.md) **Part II**,
§U0–§U15). It exposes no HTTP/network API; its "contract" is the public interface of the pure view-model
package plus the app's rendering obligations. All view functions are **pure** over injected state (an
`EvidenceGraph` / `EvidencePacket` / `VerificationResult` from `@gt100k/evidence-graph` and an injected
`Hasher`) — no I/O, no wall-clock, no `Math.random`, and **no `Math.sin`/`Math.cos` in the golden layout
path** (the 3D ring uses the authored `SHELL_SLOTS` table). See [../data-model.md](../data-model.md) Part II
for view types and Part I for the domain types this package **reads**.

The Explorer **reads** `@gt100k/evidence-graph`; it never modifies it and never re-implements
hashing/canonicalization/Merkle/attestation/human-authority (D4/D5, FR-E05).

## Public functions (view package)

```text
buildExplorerView(graph, packet, verifierResult, opts) -> ExplorerView
  opts: { reducedMotion:boolean; tier:RenderTier; plain:boolean;
          density:"comfortable"|"compact"; scrub?:number; selectedId?:string; hasher:Hasher }
  Pure. Composes ONE ExplorerView (nodes+edges+bounds2d+bounds3d+timeline+verification+camera+ledger+tokens
  +presentation) from the domain graph/packet. Switching tier / reduced-motion / plain / scrub / selection
  changes ONLY `presentation`; the underlying view state is recomputed from graph+packet, never from flags
  (parity by construction — plainViewEquals). (FR-E02, SC-E02.)

layoutExplorer2D(graph) -> Map<nodeId, { x, y, depthRank, orderInRank }>
  Pure, deterministic. depthRank = longest provenance path (derived_from ∪ released_as ∪ validates);
  orderInRank = graph insertion order; x = MARGIN_X + depthRank*COL_W; y = MARGIN_Y + orderInRank*ROW_H;
  disconnected components below at ISLAND_Y. Matches the golden 2D positions (§U8.1). (FR-E01/E03, SC-E01.)

layoutExplorer3D(graph) -> Map<nodeId, { x, y, z, depthRank, orderInRank, slotIndex }>
  Pure, deterministic. x = depthRank*COL_W_3D; slotStep = floor(12/countInRank);
  slotIndex = (orderInRank*slotStep) mod 12; y = SHELL_R*SHELL_SLOTS[slotIndex].uy;
  z = SHELL_R*SHELL_SLOTS[slotIndex].uz; island at ISLAND. NO Math.sin/cos (authored SHELL_SLOTS).
  Matches the golden 3D positions (§U8.2, ±1e-6). (FR-E01/E03/E19, SC-E16.)

resolveNodeBody(type)  -> NodeBody          // §U8.12 (exact): world|moon|blueprint|beacon|comet|gold-star|crystal|seal-sun
resolveNodeGlyph(type) -> NodeGlyph         // §U8.12 (exact): 2D committed-SVG glyph
resolveNodeColorRole(type) -> node color key // §U8.11 (exact)
  Pure. Every node type -> a distinct body + glyph + color; NodeView always also carries a text label
  (color never the sole cue). The Assistance comet carries declaredTag:true. (FR-E04, SC-E05/E06/E19.)

buildGrowthTimeline(graph, packet) -> GrowthTimelineView
  Pure, deterministic. Beats = milestone nodes ordered by (timestamp asc, depthRank asc, insertion order),
  grouped into plan/assist/artifact/attempt/revision/claim/review/release/contribution/outcome, each with a
  0-based birthOrder; island excluded. A scrub position reveals beats with birthOrder <= t. (§U8.7, SC-E07.)

buildVerificationView(packet, verifierResult, graph, hasher) -> VerificationView
  Pure. Derives ordered steps ["merkle-root","subject-digest","human-authority","transparency-log-stub"] by
  RE-USING the domain: merkleRoot(nodeHashes, hasher) === packet.merkleRoot; attestation subject digest ===
  packet.subjectDigest; assertHumanAuthority(subgraph).ok; the deferred TransparencyLog stub
  (nonProduction:true, never blocks). sealState = verified iff all non-stub pass; mismatch iff any fail.
  Also derives verifyWaveOrder (deterministic source->outcome edge order for the light-wave, §U8.8).
  Computes NO grade; re-implements NO crypto. (FR-E05/E06, SC-E08/E20.)

applyTamper(fixture) -> { graph, packet, verifierResult }
  Pure. Returns a copy with ONE bound node's payload mutated (re-derive shows a Merkle mismatch). Drives the
  tamper demo. Red/fracture belong ONLY to the byte-level body + root diff. (FR-E07, SC-E08.)

buildLedgerView(explorerView) -> LedgerView
  Pure. The accessible parity: role="tree" nodes with accessible names, an ordered time-scrub list (with
  birthOrder), a verification status list, and per-node described panels. (D5, FR-E11, SC-E10.)

resolveMotion(kind, { reducedMotion }) -> MotionSpec
  Pure. Returns { kind, mode, durationMs, easing } from MOTION/EASINGS; under reducedMotion -> mode
  "reduced", easing "linear", durationMs from the reduced column (§U8.5). EVERY motion-table row (incl. all
  3D events) has a reduced equivalent. (FR-E10/E18, SC-E03/E04.)

resolveRenderTier(caps) -> RenderTier
  Pure. caps: { prefersReducedMotion; savePower; webglAvailable; gpuTier:0|1|2|3; override? }.
  First matching rule wins: override(!=auto) -> override; reducedMotion||!webgl||savePower||gpuTier==0 ->
  "calm2d"; gpuTier==1 -> "standard3d"; else "cinematic". Matches the §U8.10 truth table. (FR-E13, SC-E18.)

plainViewEquals(a: ExplorerView, b: ExplorerView) -> boolean
  Pure. True iff a and b have identical underlying state (nodes/edges/bounds2d/bounds3d/timeline/
  verification/camera/ledger) ignoring `presentation`. (SC-E02/E03.)

explorerFixture(hasher) -> { graph, packet, verifierResult }   // committed synthetic "speaker-v1" (§U7)
```

## Constants (exported, golden)

```text
PALETTE        // exact hex tokens (§U8.11)
TYPOGRAPHY     // exact font stacks + scale (§U8.11)
MOTION         // exact durations ms (§U8.5)
EASINGS        // exact cubic-béziers (§U8.5)
SPRINGS        // exact motion@12 spring + R3F damp-lambda constants (§U8.5)
NODE_BODIES    // type -> 3D body id (§U8.12)
NODE_GLYPHS    // type -> 2D glyph id (§U8.12)
EDGE_THREADS   // type -> { threadStyle, cap, flow, label } (§U8.12)
SHELL_SLOTS    // authored 12-slot unit ring for the 3D layout (§U8.2)
CAMERA         // named keyframes + clamps + lookAhead (§U8.9)
PARALLAX       // layer depth factors (§U8.9)
TIERS          // tier capabilities + degrade/recover thresholds (§U8.10)
BLOOM / DOF / STARFIELD  // atmosphere tokens (§U8.13; app acceptance targets)
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
- Render ExplorerView on a tiered stage chosen by resolveRenderTier:
  * cinematic  : R3F <Canvas> (aria-hidden) — luminous procedural BODIES + directional light-thread EDGES,
                 BLOOM + DEPTH-OF-FIELD (@react-three/postprocessing), a deterministic seeded parallax
                 STARFIELD (three.js Points), orbit/dolly/fly-to camera. Frosted DOM HUD/panels via motion@12.
  * standard3d : same 3D scene with bloom/DOF OFF, static starfield, reduced particle counts.
  * calm2d     : deterministic 2D SVG/Canvas constellation (aria-hidden) — the reduced-motion / weak-GPU /
                 no-WebGL equal fallback; low/no motion; identical state.
  All tiers + the accessible Ledger render from the ONE ExplorerView (parity).
- Camera: orbit (drag + momentum), dolly (origin-aware, clamped), fly-to/focus (spring to a CAMERA keyframe
  + look-ahead + DOF rack-focus), establishing fly-in on load; all interruptible; never lock input. (§U5.3.)
- Time-scrub: dragging the scrubber grows the galaxy (bodies ignite in birthOrder; threads draw when both
  endpoints exist); beat -> body fly-to. Reduced: instant per-step reveal. (§U5.4.)
- Verify -> stepped checks + a light-wave (verifyWaveOrder) + Verified ✓ seal-forge (ring-draw + bloom +
  Merkle root Number-ticker); Tamper -> byte-body fracture + lineage desaturate + root diverge + MISMATCH;
  aria-live announces both. Red/fracture only on bytes. (§U5.7.)
- All DOM motion via motion@12 (motion/react) and resolveMotion; honor prefers-reduced-motion by default
  (override system/on/off); 60fps budget with auto-degrade (cinematic->standard3d->calm2d) + no-WebGL/
  context-loss fallback, state preserved. (§U8.10.)
- Every canvas/decorative layer is aria-hidden; the DOM Ledger is the AT source of truth; keyboard/switch/SR
  operable; visible focus; ≥4.5:1 contrast; color-independent (body-shape/glyph + text). (D5, §U12.)
- No external fetch (procedural bodies + seeded starfield + system fonts); zero console errors; no secrets.
  (FR-E15/E16/E20.)
```

## Contract test obligations (map to FR/SC)

- `layoutExplorer2D`: deterministic; golden 2D positions (§U8.1); island slot; x depends only on depthRank.
  (FR-E01/E03, SC-E01.)
- `layoutExplorer3D`: deterministic; golden 3D positions (§U8.2, ±1e-6) via SHELL_SLOTS; no Math.sin/cos;
  island at ISLAND. (FR-E01/E03/E19, SC-E16.)
- `buildExplorerView` + `plainViewEquals`: one composed view; tier/reduced/plain/scrub change only
  presentation. (FR-E02, SC-E02/E03.)
- `resolveNodeBody`/`resolveNodeGlyph`/`resolveNodeColorRole` + `NODE_BODIES`/`NODE_GLYPHS`/`EDGE_THREADS`:
  all 8 node types -> distinct body/glyph/color; all 6 edge types -> distinct thread/cap/flow + label; never
  color-only; comet declaredTag. (FR-E04, SC-E05/E06/E19.)
- `buildGrowthTimeline`: deterministic grouped order with birthOrder; scrub reveals the right subset; island
  excluded. (SC-E07.)
- `buildVerificationView` + `verifyWaveOrder` + `applyTamper`: steps + wave order derived from the domain;
  untampered -> verified; tampered -> mismatch with both roots; stub step nonProduction; no grade computed.
  (FR-E05/E06, SC-E08/E20.)
- `ActorChip`/`NodeView`: `model` actor cited/neutral (no accusation field); grade `Outcome` human-owned
  with owner. (FR-E08/E09, SC-E09.)
- `buildLedgerView`: every node/beat/step present with accessible name. (FR-E11, SC-E10.)
- `resolveMotion`: exact golden table incl. reduced mode for every row (incl. 3D events). (FR-E10/E18, SC-E04.)
- `CAMERA`: keyframes exact; `focus(node)` derives from `node.pos3d + offset`; clamps present. (SC-E17.)
- `resolveRenderTier` + `TIERS`: golden truth table; degrade/recover thresholds are the pinned constants.
  (FR-E13, SC-E18.)
- Guardrails: view types expose none of price/currency/rank/leaderboard/percentile/outOf/streak/countdown/
  urgency/dropRate/rarity/accusation; no `Math.random`; no `Math.sin`/`Math.cos` in the golden layout path.
  (FR-E12, SC-E11.)
- Integration: build the view with the real node `Hasher` + stub `Verifier`; domain unchanged; adapter swap
  needs no view change. (FR-E05/E14, SC-E14.)
