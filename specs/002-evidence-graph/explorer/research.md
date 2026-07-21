# Research: Provenance Explorer (decisions)

No blocking unknowns remain. The decisions below record the choices the plan rests on, applying the
Apple fluid-motion, Emil design-engineering, impeccable, and ui-ux-pro-max guidance to a
provenance/verification surface (PRD §19; reviewer/verifier §9.2 / §19.1).

## Decision: A pure view-model package + a separate Next.js app; read the domain, never edit it

- **Decision**: Split into `packages/evidence-explorer-view` (pure, deterministic, Vitest-tested) and
  `apps/evidence-explorer` (Next.js). The view package **reads** `@gt100k/evidence-graph`
  (`workspace:*`); the completed domain stays unchanged. All rendering/animation live only in the app.
- **Rationale**: The workspace Vitest include is `packages/**/test` (+ `adapters/**/test`) — **not**
  `apps/**`. To unit-test the golden motion table, deterministic layout, and reduced-motion parity under
  the loop gate **without editing the shared root `vitest.config.ts`** (parallel-safety), the testable
  logic must live in a `packages/*` package. Mirrors `packages/learning-loop` and feature 004's
  `packages/arena-world` + `apps/arena` split. The app is verified by `next build`.
- **Alternatives considered**: App-local view logic — rejected (untestable under the gate; entangles
  rules with React). Editing `packages/evidence-graph` to add view code — rejected (the domain is done;
  the UI must read, not edit).

## Decision: Renderer — SVG + framer-motion, deterministic Canvas starfield, frosted DOM; NOT WebGL/Pixi, NOT force-directed

- **Decision**: Render the constellation as **SVG driven by `framer-motion`**, with a **deterministic,
  seeded Canvas starfield** behind and **frosted `backdrop-filter` DOM panels** in front. Layout is a
  **deterministic layered longest-path DAG layout** (§8.1); the organic "constellation" look is a
  styling layer (glow, light-thread edges, gentle float, parallax), not randomized geometry.
- **Rationale**: The provenance graph is *tens* of nodes, not thousands. At that scale SVG wins on all
  the axes that matter here: **crisp** at any zoom (vector), **GPU-friendly** (`transform`/`opacity`),
  first-class **spring physics + gestures + layout animations + `useReducedMotion`** (framer-motion),
  **SVG-filter glow/bloom** for the star look, and **far better accessibility** than an opaque canvas.
  A **deterministic** layout (not force-directed) is required for replayability and unit-testing
  (SC-E01) — a force simulation is non-deterministic and hard to golden-test. Apple's fluid-motion
  principles (interruptible, velocity-aware, momentum projection) map directly onto framer-motion
  springs + a decel-projected pan; Emil's frequency rule (rare→delight, frequent→instant) shapes the
  motion table; impeccable's "motion is part of the build" + "reduced motion is not optional" are baked
  into `resolveMotion`.
- **Alternatives considered**: **Pixi/WebGL** — rejected as the default (overkill at tens of nodes,
  heavier dep, WebGL-context and accessibility overhead); acceptable as a **non-breaking future layer for
  very large graphs only with a documented reason** (`.loop/decisions.md`). **GSAP** — acceptable
  animation alternative only with a documented reason; framer-motion is the default for its React
  ergonomics + `useReducedMotion`. **D3-force layout** — rejected (non-deterministic; not golden-testable).

## Decision: Art direction — "Provenance Observatory" (deep-night star-chart), deliberately anti-slop

- **Decision**: A **deep space-navy void** where evidence nodes glow as **stars**, lineage is drawn as
  **threads of light**, and verification is the sky **locking into a Verified seal**. Register:
  *forensic-calm reviewer instrument*. Palette + typography pinned in §8.6 (deep void, cool ink,
  verify-green, human-owned gold, neutral model-slate, 8 distinct node hues, a hash mono).
- **Rationale (impeccable scene-sentence + anti-slop):** the scene sentence — *a reviewer, late evening,
  calm dark room, tracing a glowing constellation of a child's work to its cryptographic root, feeling
  trust and quiet awe, not suspicion* — forces a dark planetarium star-chart. This is a deliberate
  **second-order anti-slop** choice: not the 2026 cream/sand SaaS default, not fintech navy-and-gold, and
  deliberately different from feature 004's warm golden-hour children's RPG (Independence Isles). Warmth
  is carried by the star-glyph accents + verify-gold, against a cool precise night. Color is **never** the
  sole cue: every node/edge carries a glyph/stroke + text label (WCAG 2.2 AA). Fonts use a **system
  fallback stack** (no external fetch); self-hosted subset `woff2` is a non-breaking upgrade.
- **Alternatives considered**: light "audit dashboard" — rejected (generic, and worse for a glowing
  constellation); a warm palette — rejected (collides with 004 and undersells the forensic-instrument
  register).

## Decision: Verification derived by re-using the domain; the app computes no crypto and no grade

- **Decision**: `buildVerificationView` derives its ordered steps (`merkle-root` → `subject-digest` →
  `human-authority` → `transparency-log-stub`) and `sealState` by **re-using** `@gt100k/evidence-graph`:
  re-derive `merkleRoot` over the packet's node hashes; check the attestation subject digest; run
  `assertHumanAuthority(subgraph)`; and surface the deferred `TransparencyLog` stub as a clearly-labeled
  `nonProduction` step. The tamper demo mutates one bound node's payload and re-derives; the domain
  reports the mismatch.
- **Rationale**: The domain is the arbiter of integrity (PRD §19; parent Golden Values). Re-implementing
  SHA-256/JCS/Merkle in the UI would create a second, driftable source of truth — exactly the trap the
  content-addressed design avoids. The Explorer's job is to **present** the domain's verification, and to
  make it a satisfying, legible, tamper-evident experience — never to recompute it. The app **never
  computes a grade** (Constitution I/IV/IX; humans issue grades); it displays the domain's human-owned
  `Outcome` with its named owner.
- **Alternatives considered**: a UI-local verifier — rejected (drift, double source of truth). Hiding the
  stubbed transparency-log step — rejected (the pre-live gate must be visible, honest, and clearly
  non-production, matching the domain).

## Decision: Accessibility — a synchronized parallel accessible DOM ("Provenance Ledger")

- **Decision**: Render a **semantic HTML/ARIA parallel** built from the same `ExplorerView` — the DAG as
  a `role="tree"`, the timeline as an ordered list, verification as a status list with an
  `aria-live="polite"` seal region, each inspector as a described region — with the SVG/Canvas
  `aria-hidden`. One shared view-model drives both (parity by construction).
- **Rationale**: An animated SVG/Canvas graph is hard for assistive tech to convey faithfully; a
  synchronized DOM twin (the approach proven in feature 004's Arena Ledger) guarantees keyboard/switch/
  screen-reader users reach every state, with no drift, and makes Ledger completeness unit-testable
  (SC-E10). Reduced motion stays a first-class **equal** mode (every animation has a reduced equivalent
  via `resolveMotion`), never a degraded fallback.
- **Alternatives considered**: ARIA directly on SVG nodes — rejected (brittle, inconsistent AT support
  for complex interactive graphs). A separate `/accessible` route — rejected (splits the surface, drifts).

## Decision: No dark patterns; declared AI-assistance is cited, never an accusation

- **Decision**: The view types **structurally** exclude leaderboard/caste-rank/bottom-rank/streak/
  countdown/urgency/price fields; `ActorChip` has no `accusation` field and marks a `model` actor as
  cited/neutral; alarm-red + a brief shake are reserved **only** for the byte-level cryptographic tamper
  demo (integrity of bytes), never for a person, learner, `Outcome`, or `Assistance`.
- **Rationale**: Constitution VIII/IX + PRD §4.7/§19 — no manufactured pressure, no automated
  AI-authorship accusation; declared AI collaboration is admissible only as cited supporting evidence.
  Making the exclusions **structural** (a `guardrails.test.ts` scanning the types + source) turns the
  guardrail into a machine-checkable acceptance criterion (SC-E11).
- **Alternatives considered**: enforcing tone only in copy — rejected (bypassable; the guardrail must be
  structural and testable).

## Decision: Deterministic, no-fetch fixture; seeded starfield

- **Decision**: Ship a committed synthetic "speaker-v1" milestone (§7) built via the domain API, plus a
  deterministic seeded Canvas starfield (seed from `NEXT_PUBLIC_EXPLORER_SEED`, no `Math.random`). No
  external fetch anywhere; layout goldens are hash-independent (rank-based).
- **Rationale**: Determinism keeps the golden layout/timeline/verification unit-testable and the app
  reproducible offline (no network, no secrets), matching the factory's no-fetch/no-secrets posture.
- **Alternatives considered**: `Math.random` starfield — rejected (non-deterministic; violates the pure
  view + reproducible-render posture). External graph data — rejected (no-fetch constraint).
