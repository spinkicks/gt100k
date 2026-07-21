# Phase 0 Research: EvidenceGraph

> **One spec home.** **Part I** below records the domain decisions (unchanged). **Part II** (folded in from
> the former `explorer/research.md`) records the **Provenance Explorer** 3D-UI decisions. See
> [spec.md](./spec.md) Part I / Part II.

---

# PART I — Domain decisions (`packages/evidence-graph`)

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

## Decision: Deterministic Merkle root — RFC-6962 raw-byte scheme

- **Decision**: Compute the per-packet Merkle root with the **RFC-6962 (Certificate Transparency) raw-byte scheme**. Leaves are the per-node 32-byte SHA-256 content-hash digests (decode the hex ids to bytes), sorted ascending by digest bytes; `leaf = sha256(0x00 || digestBytes)` and `interior = sha256(0x01 || leftHashBytes || rightHashBytes)` where `0x00`/`0x01` are single prefix **bytes** and `||` is raw-byte concatenation. On an odd count, the lone right-most node is **promoted unchanged** to the next level (RFC-6962: `k` = largest power of two `< n`), **never duplicated**. Single-node packets are valid (root = leaf digest); empty packets are rejected. The exact golden roots are pinned in spec.md **Golden Values** and are the arbiter.
- **Rationale**: RFC-6962 is the industry-standard Merkle-tree construction used by Certificate Transparency, Google Trillian, and the sigstore/Rekor transparency logs targeted by the deferred §19.2 D1 anchoring. Adopting it (over the earlier homemade hex-string-concatenation scheme) makes our roots re-derivable and checkable by off-the-shelf tooling, so the deferred transparency-log integration and any external verifier need no bespoke re-implementation. Canonical byte ordering + the fixed RFC-6962 odd-count rule keep the root byte-deterministic (FR-011, SC-004); the `0x00`/`0x01` prefix bytes give second-preimage / leaf-as-interior domain separation (FR-021).
- **Alternatives considered**: The earlier homemade hex-string-concatenation scheme with duplicate-last odd handling — rejected (non-standard; not interoperable with CT/Trillian/Rekor verifiers). Insertion-order Merkle trees — rejected (non-deterministic across callers). No domain separation — rejected (second-preimage weakness).

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

---
---

# PART II — Provenance Explorer decisions (3D "Provenance Observatory")

No blocking unknowns remain. The decisions below apply the Apple fluid-motion, Emil design-engineering,
impeccable, animation-vocabulary, and ui-ux-pro-max guidance to a cinematic provenance/verification surface
(PRD §19; reviewer/verifier §9.2 / §19.1).

## Decision: A pure view-model package + a separate Next.js app; read the domain, never edit it

- **Decision**: Split into `packages/evidence-explorer-view` (pure, deterministic, Vitest-tested) and
  `apps/evidence-explorer` (Next.js). The view package **reads** `@gt100k/evidence-graph` (`workspace:*`);
  the completed domain stays unchanged. All rendering/animation live only in the app.
- **Rationale**: The workspace Vitest include is `packages/**/test` (+ `adapters/**/test`) — **not**
  `apps/**`. To unit-test the golden motion table, the deterministic 2D **and** 3D layout, the camera
  keyframes, the render-tier ladder, and reduced-motion parity under the loop gate **without editing the
  shared root `vitest.config.ts`** (parallel-safety), the testable logic must live in a `packages/*`
  package. Mirrors `packages/learning-loop` and feature 004's `packages/arena-world` + `apps/arena` split.
  The app is verified by `next build`.
- **Alternatives considered**: App-local view logic — rejected (untestable under the gate; entangles rules
  with React/three). Editing `packages/evidence-graph` to add view code — rejected (the domain is done; the
  UI must read, not edit).

## Decision: Renderer — react-three-fiber + drei + three.js (3D), deterministic layout; calm-2D equal fallback; NOT force-directed

- **Decision**: Render the constellation as a **3D scene** with **react-three-fiber (R3F) + drei +
  three.js**, luminous **procedural bodies** + directional **light-thread** edges, **bloom + depth-of-field**
  via **`@react-three/postprocessing`**, and a **deterministic seeded parallax starfield** (three.js
  `Points`); frosted `backdrop-filter` DOM panels (`motion@^12`) float in front. Layout is a **deterministic
  layered longest-path** layout in **2D** (§U8.1) **and** **3D** (§U8.2, an authored 12-slot `SHELL_SLOTS`
  ring — no `Math.sin`/`cos` in the golden path); the "cosmos" look (emissive materials, bloom, DOF,
  light-thread flow, orbital float, parallax) is a **styling + camera layer over the deterministic lattice**,
  not randomized geometry. A **calm-2D** renderer (SVG/Canvas2D) is a first-class **equal** fallback.
- **Rationale**: The brief is a *cinematic knowledge cosmos* you orbit and fly through — a "lean-forward"
  register SVG cannot reach. WebGL gives the luminous bodies, volumetric bloom, depth-of-field, and a free
  orbit camera that make the DAG feel like a real observatory. For *tens* of nodes the cost is trivial;
  WebGL here buys the *register*, not node count. **Determinism is preserved** by the authored `SHELL_SLOTS`
  layout (no force simulation, no transcendental math in the golden path), so every 2D/3D position is
  replayable and golden-testable (SC-E01/E16). Apple's fluid-motion principles (interruptible,
  velocity-aware, momentum) map onto R3F's frame-loop damped springs + a decel-projected orbit; Emil's
  frequency rule (rare→cinematic, frequent→instant) shapes the motion table; impeccable's "motion is part of
  the build", ease-out-expo (no bounce) on cinematic reveals, and "reduced motion is not optional" are baked
  into `resolveMotion`.
- **Alternatives considered**: **SVG-only 2D** (the prior explorer default) — rejected as the *primary*
  (cannot deliver the cinematic 3D register the brief demands) but **kept as the calm-2D equal fallback**.
  **A force-directed / physics 3D layout** — rejected (non-deterministic; not golden-testable). **A fetched
  `.glb`/HDRI asset pipeline** — rejected (violates no-fetch; procedural geometry + a seeded starfield keep
  it offline and deterministic). **`@react-spring/three`** — acceptable 3D helper only with a documented
  reason; the default 3D motion uses the golden `SPRINGS`/`EASINGS` in R3F's frame loop.

## Decision: DOM motion standardized on `motion@^12`; three.js only where fit-for-purpose

- **Decision**: All **DOM** motion (HUD, inspector, panels, the calm-2D layer, seal/ticker/diff) uses
  **`motion@^12`** (`import … from "motion/react"`). The **3D** scene uses the three.js/R3F frame loop
  (damped lerps toward the golden `SPRINGS`/`EASINGS` targets) + drei helpers (`<Float>`,
  `<CameraControls>`/`<OrbitControls>`) + `@react-three/postprocessing` for bloom/DOF — the fit-for-purpose
  engine for WebGL.
- **Rationale**: One DOM motion standard (`motion@^12`, the successor to framer-motion) keeps the DOM layer
  coherent, gives springs/gestures/layout-animations + `useReducedMotion`, and matches the "standardize on
  `motion@^12`" directive. three.js is the only sensible engine for the 3D bodies/camera/postprocessing; it
  is scoped to the canvas.
- **Alternatives considered**: **framer-motion@^11** (the prior default) — superseded by `motion@^12`
  (`motion/react`). **GSAP for DOM** — acceptable only with a documented reason. **Animating 3D via DOM
  motion** — rejected (wrong engine for WebGL).

## Decision: Render-tier ladder + 60fps budget with graceful degradation

- **Decision**: `resolveRenderTier(caps)` picks one of **Cinematic 3D → Standard 3D → Calm 2D** from
  `{ prefersReducedMotion, savePower, webglAvailable, gpuTier, override }` (§U8.10). `prefers-reduced-motion`
  / no-WebGL / low-power / `gpuTier 0` → Calm 2D; `gpuTier 1` → Standard 3D (bloom/DOF off); else Cinematic.
  An adaptive runtime monitor auto-degrades one tier when the measured median FPS < `DEGRADE_BELOW` for
  `DEGRADE_SAMPLES` frames and recovers after `RECOVER_MS` stable above `RECOVER_ABOVE` (drei
  `<PerformanceMonitor>`/`<AdaptiveDpr>`). State is preserved across tier changes (one `ExplorerView`, D2).
- **Rationale**: A cinematic WebGL scene must still honor a **60fps budget on the min managed device** and
  degrade gracefully rather than jank. Making the tier ladder a pure, golden-tested function
  (`resolveRenderTier` + pinned thresholds) turns "graceful degradation" into a machine-checkable acceptance
  criterion (SC-E18/E21/E22) and makes reduced-motion (Calm 2D) an *equal* mode, not a lesser fallback.
- **Alternatives considered**: A single fixed 3D tier — rejected (janks on weak GPUs; excludes reduced-motion
  users). A binary 3D-or-2D switch — rejected (loses the useful "3D without heavy postprocessing" middle
  tier for mid GPUs).

## Decision: Verification derived by re-using the domain; the app computes no crypto and no grade

- **Decision**: `buildVerificationView` derives its ordered steps (`merkle-root` → `subject-digest` →
  `human-authority` → `transparency-log-stub`), its `sealState`, and a deterministic `verifyWaveOrder`
  (source→outcome edge order for the light-wave) by **re-using** `@gt100k/evidence-graph`: re-derive
  `merkleRoot`; check the attestation subject digest; run `assertHumanAuthority(subgraph)`; surface the
  deferred `TransparencyLog` stub as a clearly-labeled `nonProduction` step. The tamper demo mutates one
  bound node's payload and re-derives; the domain reports the mismatch.
- **Rationale**: The domain is the arbiter of integrity (PRD §19; Part I Golden Values). Re-implementing
  SHA-256/JCS/Merkle in the UI would create a second, driftable source of truth. The Explorer's job is to
  **present** the domain's verification as a satisfying, legible, tamper-evident cinematic experience — never
  to recompute it. The app **never computes a grade**; it displays the domain's human-owned `Outcome`.
- **Alternatives considered**: a UI-local verifier — rejected (drift, double source of truth). Hiding the
  stubbed transparency-log step — rejected (the pre-live gate must be visible, honest, non-production).

## Decision: Accessibility — a synchronized parallel accessible DOM ("Provenance Ledger")

- **Decision**: Render a **semantic HTML/ARIA parallel** built from the same `ExplorerView` — the DAG as a
  `role="tree"`, the time-scrub as an ordered list with a scrub position, verification as a status list with
  an `aria-live="polite"` seal region, each inspector as a described region — with every canvas/decorative
  layer `aria-hidden`. One shared view-model drives the 3D scene, the calm-2D rendering, and the Ledger
  (parity by construction).
- **Rationale**: A WebGL/Canvas scene is opaque to assistive tech; a synchronized DOM twin (proven in
  feature 004's Arena Ledger) guarantees keyboard/switch/screen-reader users reach every state with no
  drift, and makes Ledger completeness unit-testable (SC-E10). Reduced motion stays a first-class **equal**
  mode (the calm-2D tier), never a degraded fallback.
- **Alternatives considered**: ARIA directly on canvas / a11y-in-WebGL — rejected (no faithful AT support).
  A separate `/accessible` route — rejected (splits the surface, drifts).

## Decision: No dark patterns; declared AI-assistance is cited (a comet marked "Declared"), never an accusation

- **Decision**: The view types **structurally** exclude leaderboard/competitive-rank/bottom-rank/streak/
  countdown/urgency/price fields (the neutral provenance index is `depthRank`); `ActorChip` has no
  `accusation` field and marks a `model` actor as cited/neutral; alarm-red + the **fracture** + the diverging
  root are reserved **only** for the byte-level cryptographic tamper demo (integrity of bytes), never for a
  person, learner, `Outcome`, or `Assistance`. A `model` `Assistance` renders as a comet with a calm,
  persistent **"Declared"** tag.
- **Rationale**: Constitution VIII/IX + PRD §4.7/§19 — no manufactured pressure, no automated AI-authorship
  accusation; declared AI collaboration is admissible only as cited supporting evidence. Making the
  exclusions **structural** (a `guardrails.test.ts` scanning the types + source) turns the guardrail into a
  machine-checkable acceptance criterion (SC-E11).
- **Alternatives considered**: enforcing tone only in copy — rejected (bypassable; the guardrail must be
  structural and testable).

## Decision: Deterministic, no-fetch fixture; procedural bodies; seeded starfield

- **Decision**: Ship a committed synthetic "speaker-v1" milestone (§U7) built via the domain API; render all
  bodies as **procedural three.js geometry + materials** (no fetched `.glb`/HDRI/textures) and the starfield
  as a **deterministic seeded** `Points` draw (seed from `NEXT_PUBLIC_EXPLORER_SEED`, no `Math.random`). No
  external fetch anywhere; layout goldens are hash-independent (rank-based).
- **Rationale**: Determinism keeps the golden layout/timeline/verification unit-testable and the app
  reproducible offline (no network, no secrets), matching the factory's no-fetch/no-secrets posture.
- **Alternatives considered**: fetched 3D assets / HDRI environments — rejected (no-fetch constraint;
  non-deterministic first paint). `Math.random` starfield — rejected (non-deterministic; violates the pure
  view + reproducible-render posture).
