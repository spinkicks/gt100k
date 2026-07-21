# Feature Specification: Provenance Explorer (EvidenceGraph game-experience layer)

**Feature Branch**: `002-evidence-graph` (UI expansion — the **Provenance Explorer**)

**Created**: 2026-07-20

**Status**: Loop-ready (UI expansion of the completed `002-evidence-graph` domain)

**Input**: "Add a BEAUTIFUL, game-y, impressive, fully-animated UI — a **Provenance Explorer** — on
top of the existing pure `packages/evidence-graph` domain (PRD §19; reviewer/verifier surfaces §9.2 /
§19.1). A new Next.js App-Router app `apps/evidence-explorer` that **reads** `packages/evidence-graph`:
an interactive, animated evidence-DAG constellation you pan/zoom/expand; a build timeline of a
student's artifact; a satisfying verification UX (Merkle-root + attestation + human-authority checks
passing into a *Verified ✓* seal) plus a tamper demo that visibly fails; drill-down panels where
declared AI-assistance is shown as **cited evidence, never an accusation**. Full art direction + a
motion table with durations/easings as testable golden constants. Reduced-motion is a first-class
**equal** mode; WCAG 2.2 AA; no dark patterns; humans issue grades (a model output renders only as
cited evidence). The pure domain stays the unit-tested core; the app is build-verified via `next
build`. Synthetic-only."

---

## §0 · How to read this spec (for the build loop)

This is the **single loop source-of-truth** for the Provenance Explorer UI expansion. It is large on
purpose; read **only the section for the current phase** each turn (JIT), then the referenced golden
values.

- Build path is **§9 Phasing (P0…P6)** — always work the lowest unfinished phase.
- Every phase gate is **`pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest, view package) green**; the
  app phases add **`pnpm --filter @gt100k/evidence-explorer build`** (`next build`) + the **§11 seeded
  smoke** and the **§quickstart acceptance walkthrough**.
- Machine-checkable acceptance lives in **§10 Success Criteria** (each mapped to a named test) and
  **§8 Golden values**.
- Choices already settled are in **§2 Decisions already made** — do not re-open them.
- Anything not specified: follow **§3 Defaults for the unspecified** (log it, continue).
- The companion docs — [plan.md](./plan.md), [tasks.md](./tasks.md), [data-model.md](./data-model.md),
  [contracts/provenance-explorer.md](./contracts/provenance-explorer.md), [research.md](./research.md),
  [quickstart.md](./quickstart.md), [checklists/requirements.md](./checklists/requirements.md) — are
  kept consistent with this file; **where they disagree, this file wins.**
- The **completed domain** (`packages/evidence-graph`, its adapters, and the parent
  [../spec.md](../spec.md)) is **done and unchanged**. This expansion **reads** it; it never edits it.

---

## §1 · Scope fence (in / out / non-goals)

### In scope

1. A **new, pure, deterministic view-model package `@gt100k/evidence-explorer-view`**
   (`packages/evidence-explorer-view`) that **reads** `@gt100k/evidence-graph` and composes a single
   **`ExplorerView`** that drives every renderer: deterministic DAG layout; per-node/edge **view
   mapping** (glyph + color-role + accessible label for all 8 node types and 6 edge types); a
   **build-timeline** view; a **verification** view (derived by re-using the domain's `merkleRoot`,
   `assertHumanAuthority`, and the stub `Verifier` — never re-implementing crypto); the accessible
   **Provenance Ledger** view; and the golden constant registries `PALETTE` / `TYPOGRAPHY` / `MOTION`
   / `EASINGS` with `resolveMotion(kind,{reducedMotion})` and `plainViewEquals(...)`. Pure (no I/O, no
   wall-clock, **no `Math.random`**), framework-agnostic, unit-tested (Vitest).
2. A **new Next.js App-Router app `@gt100k/evidence-explorer`** (`apps/evidence-explorer`) rendering the
   `ExplorerView` as an **interactive, animated provenance constellation**: a deterministic ambient
   starfield (Canvas, decorative), the evidence DAG as glowing star-nodes and light-thread lineage
   edges (SVG + Motion), pan/zoom with momentum, node expand/drill-down, an animated **build timeline**,
   a satisfying **verify → Verified ✓ seal** sequence, a **tamper demo** that visibly fails, and frosted
   drill-down inspector panels. Verified by `next build` + smoke + the acceptance walkthrough.
3. A **first-class, equal reduced-motion mode** (every animation has a reduced-motion equivalent) and a
   **synchronized, semantic accessible DOM parallel ("Provenance Ledger")** conveying the identical
   state to keyboard / switch / screen-reader users (WCAG 2.2 AA). The decorative Canvas/SVG is
   `aria-hidden`; the Ledger is the source of truth for assistive tech.
4. A **committed synthetic fixture** in-repo — a coherent milestone evidence graph + assembled
   `EvidencePacket` + verifier result (the "speaker-v1" milestone, §7) — built through the
   `@gt100k/evidence-graph` public API, so the app renders with **no external fetch**.
5. Full **art direction** (palette hex, typography, mood, node/edge visual language) and a **master
   motion table** (§5.6) whose durations/easings are pinned as **testable golden constants** (§8).

### Out of scope (explicit)

- Any change to `packages/evidence-graph`, its adapters (`adapters/evidence-*`), `packages/learning-loop`,
  `apps/student-compass`, or shared root config **except** the single final root-`tsconfig.json`
  references task (T-ROOT, §9 P6).
- Re-implementing hashing, canonicalization, Merkle, attestation, or the human-authority invariant in
  the UI. The app **reads** these from the domain (the domain is the arbiter).
- The domain's own deferred/§19.2 machinery (external transparency-log anchoring, crypto-shred erasure,
  ACJ reliability, conformal calibration, signing). The Explorer **displays** the domain's existing stub
  results as clearly-labeled "pre-live gate (stub)" rows; it builds no new stub machinery.
- Real reviewer/admissions/portfolio workflows, real learner data, authentication, persistence, or any
  network API. In-memory, synthetic, read-only.
- A 3D/WebGL engine, a physics engine, or a force-directed layout (see §2 D3; determinism is required).
- Audio beyond an optional muted-by-default, captioned cue (no audio asset pipeline this slice).

### Non-goals (will not build, by principle)

- **No** automated AI-authorship accusation anywhere; a `model` actor's output renders **only** as a
  cited `Assistance`/`Review` node (calm, neutral) — never as a grade, a verdict, or an accusation
  (Constitution I/IV/IX; PRD §4.7/§19). The Explorer computes **no** grade; it *displays* the domain's
  human-owned `Outcome` with its named human owner.
- **No** dark patterns: no leaderboard, no fixed-ability caste rank, no bottom-rank surface, no streak /
  decay / countdown / manufactured-scarcity / FOMO / engagement-timed pop-in. The view types
  **structurally** expose no such field.
- **No** motion-only affordance and **no** degraded accessibility fallback — reduced-motion and the
  Ledger are **equal** modes.
- **No** use of alarm-red or shake/wiggle on a person, a learner, an `Outcome`, or an `Assistance`
  node. Red + a brief shake are reserved **only** for the byte-level cryptographic **tamper demo**
  (integrity of bytes, never a judgement of a person).

---

## §2 · Decisions already made (do not re-open)

### D1 — Architecture: a new pure view package + a separate Next.js app (mirror feature 001/004)

The Explorer is split into a **pure view-model package** (`packages/evidence-explorer-view`) and a
**Next.js app** (`apps/evidence-explorer`). The package holds every deterministic rule (layout, view
mapping, timeline ordering, verification-step derivation, motion tokens, parity) as unit-testable pure
functions; the app is the only place React / DOM / SVG / Canvas / animation live. This keeps every
guardrail deterministically testable under `pnpm test`, keeps the build parallel-safe (new dirs only),
and keeps the completed `packages/evidence-graph` **unchanged** — the view package **depends on it**
(`workspace:*`) and reads it.

**Why a package, not app-local logic:** the workspace Vitest include is `packages/**/test` +
`adapters/**/test` (not `apps/**`), so the only way to unit-test the golden motion table, deterministic
layout, and reduced-motion parity under the loop gate — without editing the shared root
`vitest.config.ts` — is to put them in a `packages/*` package. The app is verified by `next build`.

### D2 — One state → many renderings (parity by construction)

The view package composes a single **`ExplorerView`** (`buildExplorerView(...)`). The animated SVG
constellation, the reduced-motion rendering, and the accessible DOM **Provenance Ledger** all render
from that **same** `ExplorerView`. Reduced-motion does not recompute state — it renders the identical
view with motion stripped. This makes reduced-motion an *equal* mode and `plainViewEquals` a pure,
testable guarantee (SC-E03).

### D3 — Rendering: **layered SVG + Motion, deterministic layout, organic styling** (Canvas starfield behind; Pixi optional, documented)

The primary renderer is **DOM/SVG driven by Motion (`framer-motion`)**, with a **deterministic
Canvas starfield** behind it and **frosted DOM panels** in front. Chosen because, for a provenance DAG
of *tens* of nodes (not thousands), crisp scalable SVG + Motion gives the best-looking result *and* the
best accessibility/animation story: vector-sharp at any zoom, GPU-friendly `transform`/`opacity`,
spring physics, gestures/drag, layout animations, SVG filter glow/bloom, and first-class
`useReducedMotion`. **Layout is deterministic** (a layered longest-path DAG layout, §8.1) — **not**
force-directed — so it is replayable and unit-testable; the "constellation" *look* (glow, light-thread
edges, gentle float, starfield parallax) is a **styling layer over the deterministic positions**, never
randomized geometry. A **Canvas/WebGL (Pixi) layer for very large graphs is an acceptable, non-breaking
future upgrade only with a documented reason** in `.loop/decisions.md`; do not add it on a whim. **GSAP**
is an acceptable animation alternative only with a documented reason. (See §13 DP-1/DP-2.)

### D4 — The Explorer READS the domain; it never re-computes integrity

The verification view (§5.7) is derived by **re-using the domain**: `merkleRoot` (re-derive over the
packet's node hashes), the attestation subject-digest check, `assertHumanAuthority(subgraph)`, and the
stub `Verifier` adapter. The Explorer **never** re-implements SHA-256/JCS/Merkle, and it **never**
computes a grade. The tamper demo mutates one bound node's payload, re-derives via the domain, and shows
the domain's mismatch. The domain's golden values (parent [../spec.md](../spec.md) Golden Values) remain
the arbiter.

### D5 — Accessibility for the canvas: **synchronized parallel accessible DOM ("Provenance Ledger") — SETTLED**

Because the SVG constellation + Canvas starfield are visual/opaque to assistive tech, the app renders a
**synchronized, semantic HTML/ARIA parallel structure** built from the same `ExplorerView`: the DAG as a
keyboard-navigable `role="tree"` (each node a `treeitem` whose accessible name = *type + label + state +
actor*, e.g. "Outcome — Final grade, human-owned by guide-synthetic-001"), the timeline as an ordered
list, verification as a status list with an `aria-live="polite"` region for the seal/mismatch, and each
drill-down panel as a described region. **One shared view-model drives both the SVG and the Ledger**
(D2), so they never drift. Full keyboard/switch operation, visible focus rings, color-independent state
(glyph + text, never color alone), ≥4.5:1 contrast. The SVG/Canvas is `aria-hidden="true"`; the Ledger
is the source of truth for AT. **Settled — the loop does not re-open it.** (See §13 DP-3, resolved.)

### D6 — Art direction: **"Provenance Observatory"** — deep-night star-chart (deliberately NOT SaaS-cream, NOT 004's golden-hour warmth)

The Explorer's visual identity (§5.1, golden §8.11) is a **calm, forensic-precise observatory
star-chart**: a deep space-navy void where each piece of evidence glows as a **star**, provenance
lineage is drawn as **threads of light** from source → derived, and verification is the sky **locking
into a Verified seal**. The register is *forensic-calm reviewer instrument* — a trust instrument, never
an interrogation. This is a **deliberate second-order anti-slop choice** (impeccable): not the 2026
cream/sand SaaS default, not fintech navy-and-gold, and deliberately different from feature 004's warm
golden-hour children's RPG (Independence Isles). Fonts are served by a **system fallback stack** by
default (no external fetch); self-hosted subset `woff2` under `public/fonts/` is an optional,
non-breaking upgrade. (See §13 DP-4.)

### D7 — Data model, view types, motion vocabulary

- **View types** are fixed in [data-model.md](./data-model.md). Guardrails are **structural**:
  `NodeView`/`EdgeView`/`VerifyStep`/`TimelineBeat` expose **no** `rank`(competitive)/`leaderboard`/
  `streak`/`countdown`/`urgency`/`price` field; `ActorChip` has no `accusation` field and marks a
  `model` actor as cited/neutral; `sealState:"mismatch"` (the only place red appears) lives on
  `VerificationView`, never on a person/node.
- **Motion vocabulary** (applied from the Apple fluid-motion + Emil design-engineering + impeccable
  guidance) is fixed in **§5.6** and **§8.10**: strong ease-out enter curves, `Back.Out` reveals with
  overshoot ≤ 1.05 (never `scale(0)`), press feedback `scale 0.97` on pointer-down, spring-based drag
  with momentum projection, camera/viewBox spring, celebration reserved for the rare verify moment, and
  a first-class reduced-motion equivalent for **every** entry.

### D8 — Stack pinned; tests define done

pnpm workspace (`pnpm@9.15.9`). View-package gate = `tsc -b` + Vitest, **test-first**. App verified by
`next build` + smoke + walkthrough. Animation lib **`framer-motion@^11`**. Full stack/commands in §11.

---

## §3 · Defaults for the unspecified

> **For anything this spec doesn't specify, choose the simplest correct option, record it in
> `.loop/decisions.md`, and continue.**

Escalate (append one line to `.loop/requests.jsonl`, then proceed on your recommendation) **only** for a
genuine product/design choice with hard-to-reverse consequences you cannot defensibly default — e.g. a
golden value you believe is wrong. Never escalate naming, formatting, or anything this doc answers; the
canvas-accessibility approach (D5) and the renderer choice (D3) are **settled** and MUST NOT be
re-opened. Overnight, only `severity: critical` reaches the operator; the rest are recorded to
`.loop/deferred-decisions.jsonl`.

---

## §4 · User Scenarios & Testing *(mandatory)*

Stories are prioritized, independently testable slices. **US1 alone is a viable MVP**: an interactive,
animated, mastery-of-provenance constellation for the synthetic milestone, with a reduced-motion + Ledger
equivalent.

### User Story 1 — Explore an animated evidence-DAG constellation (P1) 🎯 MVP

A reviewer (or a learner viewing their own work) opens the Explorer and sees a synthetic milestone's
evidence graph rendered as a **living constellation**: each node a glowing star coloured + glyphed by
its type (Artifact/Attempt/Transformation/Claim/Assistance/Review/Contribution/Outcome), each edge a
**thread of light** drawn from source → derived (derived_from/authored_by/used_tool/validates/
contradicts/released_as). They **pan** (drag with momentum), **zoom** (to a node/region), and **expand**
(focus a node to reveal its immediate lineage). Layout is **deterministic**. `prefers-reduced-motion`
and the accessible Ledger convey the identical structure and states.

**Why this priority**: the interactive constellation is the core surface; the timeline, verification, and
panels all hang off "the graph is rendered from one deterministic `ExplorerView`."

**Independent Test**: build `ExplorerView` from the fixture graph; confirm deterministic layout
(replayable positions), all 8 node types + 6 edge types map to a glyph + color-role + accessible label,
and the reduced-motion view and Ledger tree convey the same nodes/edges/states.

**Acceptance Scenarios**:

1. **Given** the fixture graph, **When** `buildExplorerView` runs twice, **Then** the layout positions
   are byte-identical (deterministic; no randomness).
2. **Given** each of the 8 node types, **When** viewed, **Then** each renders with a distinct glyph +
   color-role **and** a text label — state is never conveyed by color alone.
3. **Given** a pan/zoom/expand interaction, **When** performed, **Then** the constellation tracks the
   pointer 1:1, settles with momentum, and never locks out input (interruptible).
4. **Given** `prefers-reduced-motion` (or plain mode), **When** the constellation renders, **Then**
   every node, edge, and state is fully conveyed without motion, and the Ledger `role="tree"` exposes the
   same to keyboard/screen-reader.
5. **Given** an unrelated island node (not in the milestone trace), **When** the view builds, **Then** it
   is shown as clearly outside the milestone (`isInMilestone=false`) and excluded from the milestone
   trace highlight.

### User Story 2 — Watch a build timeline reveal (P2)

The learner's artifact has a story: a declared plan, source files, a first (failed) attempt, a revision,
cited assistance, human reviews, a contribution, a release, and a human-owned outcome. The Explorer
renders this as an animated **build timeline** — ordered beats that reveal with a tasteful stagger
(attempts → revisions → assists → reviews → outcome). Selecting a beat focuses its node in the
constellation.

**Independent Test**: `buildTimelineView(graph, packet)` yields a deterministic ordered `beats[]`
grouped by phase; the order is stable across runs; the Ledger renders the same as an ordered list.

**Acceptance Scenarios**:

1. **Given** the fixture milestone, **When** the timeline builds, **Then** beats are ordered
   deterministically by provenance depth then stable graph order, grouped into plan/artifact/attempt/
   revision/assist/claim/review/contribution/release/outcome.
2. **Given** reduced motion, **When** the timeline renders, **Then** all beats are shown at once (no
   slide/stagger), fully conveyed, and the Ledger list matches.
3. **Given** a beat is selected, **When** activated (click or keyboard), **Then** the corresponding
   constellation node is focused/centered.

### User Story 3 — A satisfying verification, and a tamper demo that fails (P3)

The reviewer presses **Verify**. A sequence of checks ticks through — *Merkle root recomputed* →
*attestation subject digest* → *human authority (every grade human-owned; no model grade; no
accusation)* → *(pre-live gate, stub) transparency-log inclusion* — each turning to a satisfying check,
then the constellation **locks into a Verified ✓ seal** (a ring of light draws shut, a one-shot bloom,
the Merkle root ticks up in mono digits). Then they run the **tamper demo**: one bound node's bytes are
altered; re-verification visibly **fails** — the altered node glitches, the lineage to the root
desaturates, and the root hash morphs old → new with a highlighted diff and a **MISMATCH** seal.

**Independent Test**: `buildVerificationView(packet, verifierResult, graph, hasher)` produces an ordered
`steps[]` whose pass/fail is derived from the **domain** (`merkleRoot` re-derive, subject-digest check,
`assertHumanAuthority`, stub verifier); an untampered packet yields `sealState:"verified"`; a packet
with one altered node yields `sealState:"mismatch"` with the failing step and both roots. The app
computes **no** grade.

**Acceptance Scenarios**:

1. **Given** the untampered fixture packet, **When** verification derives, **Then** every non-stub step
   is `pass`, `sealState="verified"`, and the stub transparency-log step is present but clearly
   `nonProduction:true` (never blocks the seal).
2. **Given** the packet with one node's payload altered, **When** verification derives, **Then** the
   Merkle step is `fail` with the recomputed-vs-committed roots, and `sealState="mismatch"`.
3. **Given** the human-authority step, **When** derived, **Then** it re-uses the domain's
   `assertHumanAuthority` and passes only when every grade `Outcome` is human-owned and no accusation
   node exists.
4. **Given** reduced motion, **When** verifying, **Then** the seal/mismatch is conveyed statically (a
   badge + `aria-live` announce), with no ring-draw/bloom/glitch required to understand the result.
5. **Given** the tamper demo, **When** run, **Then** red + the brief shake appear **only** on the
   byte-level node and the root diff — never on a person, learner, `Outcome`, or `Assistance`.

### User Story 4 — Drill-down panels; declared AI-assistance as cited evidence (P4)

Selecting any node opens a frosted **inspector panel** (origin-aware, scaling from the node) showing its
content-address (full hash, mono, copyable), actor (with a neutral kind chip), tool/version, input
lineage, timestamp, consent scope, and type-specific payload. An **Assistance** node is presented as
**"Declared AI assistance — cited as supporting evidence"** (calm, neutral, positive) with its
attestation reference — **never** as an accusation. An **Outcome** grade shows its **named human owner**
with a "human-owned" seal.

**Independent Test**: the `NodeView`/`ActorChip`/panel view-model marks a `model` actor as cited/neutral
(no accusation affordance), marks a grade `Outcome` as `isHumanOwned` with its owner ref, and exposes the
same in the Ledger panel description.

**Acceptance Scenarios**:

1. **Given** an `Assistance` node authored by a `model` actor, **When** its panel renders, **Then** it
   reads as cited supporting evidence (neutral tone, `--model` chip), with no accusation language or
   affordance anywhere in the view model.
2. **Given** a grade `Outcome` authored_by a human, **When** its panel renders, **Then** it shows the
   named human owner and a human-owned seal.
3. **Given** any node panel, **When** opened, **Then** it exposes id/actor/tool/inputs/timestamp/consent/
   payload, and the Ledger conveys the same to AT; the panel scales in from the node origin (origin-aware),
   with an instant/fade reduced-motion equivalent.

### User Story 5 — HUD, legend, filters, trace, plain mode (P5)

A frosted **HUD** floats over the void: a **legend** (all 8 node + 6 edge types with glyph + color +
label), **filters** (show/hide by node type), a **"trace from Outcome"** control that highlights the
provenance path to a selected node (re-using the domain's `traceEvidence`), a **search/focus**, a
**plain mode** toggle (low-spectacle, state-identical), an **audio caption** toggle (muted by default),
and a **reduced-motion** override (system/on/off). Turning on plain mode or filters never changes the
underlying state.

**Independent Test**: `traceEvidence(graph, outcomeId)` (domain) drives the trace highlight and returns
supporting-only nodes (excludes the island); `plainViewEquals(full, plain)` holds; toggles change only
presentation flags.

**Acceptance Scenarios**:

1. **Given** the legend, **When** shown, **Then** all 8 node + 6 edge types appear with glyph + color +
   text label (color never the sole cue).
2. **Given** "trace from Outcome", **When** activated, **Then** the highlighted path equals the domain's
   `traceEvidence` result (supporting-only; island excluded) and the Ledger marks the same subset.
3. **Given** plain mode / filters / reduced-motion toggles, **When** used, **Then** the underlying
   `ExplorerView` state is unchanged (`plainViewEquals`), only presentation differs.

### User Story 6 — Accessibility, reduced-motion parity & performance polish (P6)

Every animation has a reduced-motion equivalent; the Provenance Ledger conveys every state to keyboard /
switch / screen-reader users; contrast is ≥4.5:1 with color-independent cues; pan/zoom holds 60fps with a
graceful degraded tier; nothing is motion-only or canvas-only.

**Independent Test**: golden `resolveMotion` table incl. the reduced column; `plainViewEquals`; Ledger
view-model completeness (every node/edge/step present with an accessible name); `next build` + a11y
walkthrough.

**Acceptance Scenarios**:

1. **Given** every entry in the master motion table (§5.6), **When** `resolveMotion(kind,{reducedMotion:true})`
   is called, **Then** each returns a reduced equivalent (instant or ≤150ms opacity), never a bare "no
   feedback."
2. **Given** the Ledger, **When** navigated by keyboard only, **Then** every node, timeline beat, and
   verification step is reachable and announced; focus is visible; the canvas is `aria-hidden`.
3. **Given** the constellation under pan/zoom, **When** stressed, **Then** it targets 60fps and the
   degraded tier (starfield + glow off) holds the budget without losing any state.

### Edge Cases

- **Determinism**: identical graph → identical layout, timeline, verification view (no `Math.random`,
  no wall-clock in the view package).
- **Reduced-motion parity**: with `prefers-reduced-motion`, no node/edge/step/beat is unreachable or
  unconveyed (FR-E11).
- **Accessible parity**: keyboard-only + screen-reader users reach every state via the Ledger (FR-E12).
- **Color-independence**: every state/type is also carried by glyph + text (FR-E05); passes with a
  grayscale filter.
- **Tamper framing**: red + shake appear only on byte-level tamper of the constellation node + root
  diff — never on a person/learner/Outcome/Assistance (FR-E09).
- **No-accusation invariant**: a `model` actor renders only as cited `Assistance`/`Review`; the view
  model has no accusation field/affordance (FR-E08).
- **Human-owned grade**: the app never computes a grade; it displays the domain's human-owned `Outcome`
  with its named owner (FR-E08).
- **Island node**: an unrelated component renders as outside-milestone and is excluded from trace
  (FR-E06).
- **Empty/degenerate graph**: a single-node graph lays out at the origin slot and verifies (single-leaf
  Merkle = leaf digest, from the domain); an empty packet is rejected by the domain (surfaced as a
  disabled Verify with an explanatory, non-alarming message).
- **No external fetch / no console errors**: the app builds and runs offline with zero console errors
  (SC-E12).

---

## §5 · The design — "Provenance Observatory" (the full design doc)

This section is the **design bible**. Everything a machine can check is pinned as an exact **golden
constant** in **§8**. Where §5 describes and §8 pins, **§8 wins for values**. Everything stays buildable
in Next.js + SVG + `framer-motion` + Canvas and inside every guardrail (§1, §6).

**Design pillars (the five sentences everything answers to):**

1. **A star-chart of a single child's work.** Evidence is a night sky you read, not a table you scan.
   Each node is a star; lineage is light traveling from source to derived. Calm, spacious, legible.
2. **Provenance is light; verification is the sky confirming.** The loudest, rarest moment is the
   *Verified ✓* seal — a ring of light drawing shut over a constellation that checks out. Progress you
   can *see* is trust you can *check* (PRD §19.1) — re-derived from the domain, never asserted.
3. **Calm by default, loud only at the verify moment.** Ambient motion is gentle and sparse; frequent
   actions (HUD toggles, hover) are instant or near-instant (Emil frequency rule); the celebration is
   reserved for the rare verify.
4. **Reduced motion and the Ledger are equal citizens.** Every visual has a calm, non-vestibular
   equivalent and a semantic DOM twin (§5.12, §12). Nothing beautiful is motion-only; nothing stateful
   is canvas-only.
5. **Evidence, never accusation.** Declared AI-assistance is cited, calm, neutral; humans own every
   grade; red is reserved for byte-tamper, never a person (§1 non-goals, §6).

### 5.1 · Art direction & visual identity

**Scene sentence (impeccable).** *A reviewer, late in the evening, in a calm dark room, traces a glowing
constellation of a child's work back to its cryptographic root — and feels trust, clarity, and quiet
awe, not suspicion.* → a **dark observatory / planetarium star-chart**.

**Style register.** *Forensic-calm reviewer instrument.* A deep space-navy **void**; evidence nodes are
**stars** with a soft outer glow (SVG `feGaussianBlur` bloom) and a crisp inner glyph; lineage edges are
**threads of light** (thin gradient strokes, a faint traveling pulse on trace); panels are **frosted
glass** floating over the void (`backdrop-filter`, Apple materials); hashes are **mono, tabular**. This is
deliberately **not** the 2026 SaaS-cream default and **not** feature 004's warm golden-hour storybook —
warmth here is carried by the star-glyph accents and the verify-gold, against a cool precise night.

**Master palette (exact hex — golden §8.11).** OKLCH-reasoned, contrast-verified against `--void`.

| Role | Token | Hex | Use |
|---|---|---|---|
| Void (canvas bg) | `--void` | `#0A0E17` | the night sky; app/canvas backdrop |
| Panel | `--panel` | `#121826` | frosted panel base |
| Panel raised | `--panel-2` | `#1A2233` | raised surfaces, inspector |
| Hairline | `--line` | `#2A3346` | 1px separators, edge-idle |
| Ink | `--ink` | `#EAF0FB` | primary text (≈16:1 on `--void`, AAA) |
| Ink muted | `--ink-muted` | `#9AA7C2` | secondary text (≈8:1 on `--void`, AA+) |
| Focus ring | `--focus` | `#7DD3FC` | 3px ring, 2px offset (high-contrast on dark) |
| Verify (seal) | `--verify` | `#34E5B0` | the Verified ✓ seal + passing checks |
| Tamper (integrity only) | `--tamper` | `#FF5A6E` | **only** the byte-tamper demo + root-mismatch |
| Human-owned | `--human` | `#FFD166` | the human-owned grade seal / owner marker |
| Model (cited) | `--model` | `#8B9BC7` | neutral chip for a `model` actor (cited, calm) |

**Node-type accents (§8.12).** Each of the 8 node types has a **distinct hue** *and* a **distinct glyph**
*and* a **text label** — color is never the sole cue (FR-E05).

| Node type | PROV | Token | Hex | Glyph id |
|---|---|---|---|---|
| Artifact | Entity | `--c-artifact` | `#E9C46A` | `diamond` ◆ |
| Attempt | Activity | `--c-attempt` | `#4CC9F0` | `play` ▷ |
| Transformation | Activity | `--c-transformation` | `#5E7CE2` | `blueprint` ⟐ |
| Claim | Entity | `--c-claim` | `#B892FF` | `quote` ❝ |
| Assistance | Activity | `--c-assistance` | `#3DDC97` | `spark` ✦ |
| Review | Activity | `--c-review` | `#FFB03A` | `scale` ⚖ |
| Contribution | Activity | `--c-contribution` | `#F072C0` | `hex` ⬡ |
| Outcome | Entity | `--c-outcome` | `#FF7A8A` | `seal` ✓ |

Glyphs are drawn as **SVG shapes** (never emoji — ui-ux-pro-max), and the Ledger uses the **text label**
(color-independent). Edge types are conveyed by **stroke style + a routed label** (§8.12): `derived_from`
solid, `authored_by` dotted, `used_tool` dashed-fine, `validates` solid + check-cap, `contradicts`
dashed + slash-cap, `released_as` solid + arrow-cap — each also carries a text label in the Ledger.

**Typography (tokens §8.11).** Contrast-axis pairing (geometric display + humanist body) + a **mono for
hashes**. No external fetch: system fallbacks by default; self-hosted subset `woff2` optional.
`--font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif`;
`--font-body: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
`--font-mono: 'JetBrains Mono', ui-monospace, "SFMono-Regular", "Cascadia Code", monospace`. Size-specific
tracking (Apple): display tight (`-0.02em`), body `0`, small labels `+0.01em`; leading inverse to size.
Hashes and counters use **tabular numbers**.

| Role | Family | rem | line-height | tracking | weight |
|---|---|---|---|---|---|
| Display (seal / verify) | display | 2.5 | 1.05 | -0.02em | 700 |
| H1 (milestone name) | display | 1.75 | 1.10 | -0.01em | 600 |
| H2 (panel title) | display | 1.25 | 1.20 | 0 | 600 |
| Body (Ledger) | body | 1.0 | 1.5 | 0 | 400 |
| Label / caption | body | 0.8125 | 1.4 | +0.01em | 500 |
| Hash / mono | mono | 0.8125 | 1.5 | 0 | 500 (tabular) |

**Lighting & atmosphere.** A deep radial vignette focuses the center. A **deterministic** ambient
starfield (Canvas, seeded — no `Math.random`; seed from `NEXT_PUBLIC_EXPLORER_SEED`) drifts very slowly
in a parallax layer behind the graph. Node stars have a soft additive glow; the selected/traced lineage
gets a faint traveling light-pulse. **All ambient motion is OFF** under reduced motion and the degraded
tier; depth (parallax offset) is retained as static.

**Mood board, in words.** *A planetarium star-chart of one child's work; each piece of evidence a glowing
star; lineage drawn as threads of light from source to derived; a cryptographic seal that clicks shut
with a ring of light when the constellation verifies; a forensic instrument that feels calm and
trustworthy, never accusatory; the quiet awe of an observatory at night; Bloomberg-terminal precision
meets a night sky.*

### 5.2 · The constellation (graph) — layout & node/edge design (layout §8.1)

- **Deterministic layered layout** (§8.1): rank by **longest provenance path** (left → right: plan/
  sources on the left, outcome on the right), ordered within a rank by **graph insertion order**;
  `x = MARGIN_X + rank·COL_W`, `y = MARGIN_Y + orderInRank·ROW_H`. Disconnected/unrelated components
  (the island) lay out below the main DAG at `ISLAND_Y`. World bounds derive from content (§8.1). This
  is **not** force-directed (determinism, testability) — the organic constellation look comes from
  styling, not geometry.
- **Nodes are stars.** Each node = a soft-glow disc (`NODE_R = 28`) in its type hue + a crisp inner
  glyph + a label chip below (type + short name). `available`/interactive nodes carry a gentle idle
  **Float** (≤4px) and a hover **Glow-Pulse**; the selected node lifts and blooms. Never `scale(0)`;
  reveal is `Scale-in + Pop` (0.95→1.0, peak ≤1.05). Transfer-critical / `Outcome` nodes wear a subtle
  laurel/seal ring so the verify moment reads.
- **Edges are threads of light.** A thin gradient stroke from source → derived; on **trace** a light
  pulse travels the path. Edge type is conveyed by stroke style (§8.12) + a Ledger label. Edges
  **Line-draw** in on reveal (`stroke-dashoffset`), instant under reduced motion.
- **State reads as light + glyph + text**, never color alone: in-milestone nodes are lit; the island is
  dimmed with an "outside this milestone" chip; a traced path brightens; contradicted edges use the
  slash-cap + a "contradicts" label.

### 5.3 · Camera — pan / zoom / focus (config §8.14)

- **Pan**: 1:1 pointer drag on the SVG (`viewBox` translate), with **momentum projection** on release
  (Apple decel `0.998`, §8.14) and a spring settle; **rubber-band** resistance at world bounds. Never
  locks input; interruptible (re-target from the live `viewBox`).
- **Zoom**: wheel/pinch → spring the `viewBox` scale toward the pointer (origin-aware), clamped
  `zoomMin 0.5 … zoomMax 2.5`, base `1.0`. Keyboard `+`/`-` and focus-to-fit.
- **Focus / expand**: focusing a node (click, keyboard, or a timeline beat) springs the `viewBox` to
  center it with a small **look-ahead** (Apple "hint in the direction"), zoom to `focusZoom 1.4`, and
  reveals its immediate lineage. `300ms` `move`; instant under reduced motion.
- **Establishing intro** on first load: open zoomed-out showing the whole constellation, then spring to a
  comfortable framing over `constellationIntro 1200ms`; reduced-motion = instant framing + 150ms fade.
- **Parallax** (3 layers, back→front): starfield `0.15`, edges/nodes `1.0`, foreground motes `1.08`.
  Under reduced motion the ambient layers stop moving but keep their depth offset (static).

### 5.4 · Build timeline (design §5.4; view §8.7)

A horizontal (or vertical on narrow) **timeline** beneath/beside the constellation renders the milestone
as ordered **beats** grouped by phase — *plan → source artifact → attempt → revision → assist → claim →
review → contribution → release → outcome* — each beat a small card (glyph + label + timestamp).
On load (or on demand) beats **reveal with a 50ms stagger** slide-up + fade (Emil stagger); selecting a
beat **focuses** its constellation node (spatial link). Reduced motion: all beats shown at once, no
slide/stagger. The Ledger renders the same as an ordered list (§5.12). Beat order is deterministic
(§8.7) — provenance depth, then stable graph order.

### 5.5 · Scenes / regions of the app (React structure)

| Region | Role & UX |
|---|---|
| `ObservatoryStage` | The main stage: Canvas starfield (aria-hidden) + SVG constellation (aria-hidden) + the HUD + the Ledger. Owns pan/zoom/focus + the shared `ExplorerView`. |
| `Constellation` | The SVG graph (nodes/edges/glow/trace), Motion-driven, client-only. |
| `Starfield` | The deterministic Canvas ambient layer (decorative, seeded, off under reduced motion). |
| `Timeline` | The animated build-timeline strip; selecting a beat focuses a node. |
| `Inspector` | The frosted drill-down panel (origin-aware) for a selected node. |
| `VerifyPanel` | The Verify control + stepped checks + Verified/MISMATCH seal + tamper demo. |
| `Hud` | Legend, filters, trace, search, plain-mode, reduced-motion, audio-caption controls. |
| `Ledger` | The accessible DOM twin (`role="tree"` + lists + live region) — the AT source of truth. |

**React owns the DOM + Ledger; the SVG/Canvas are visual only.** State flows from the one `ExplorerView`
(D2). The Phaser-style event bus is unnecessary here (React state suffices), but the constellation and
Ledger are kept in lock-step by reading the same view model.

### 5.6 · Motion & juice — the master motion table (the heart)

Motion is designed, not decorated (Apple §17; Emil frequency rule; impeccable "motion is part of the
build"). Durations are **named tokens** (§8.10 `MOTION`); easings are **named** (§8.10 `EASINGS`); every
row has a first-class reduced-motion equivalent. All entries derive from `resolveMotion(kind,
{reducedMotion})` so the values are testable constants (SC-E04). Interactive drag/pan/zoom use **springs**
(Apple: interruptible, velocity-aware); scripted reveals use eased tokens.

| Event | Named effect (vocabulary) | Easing | Duration (token) | FX | Reduced-motion equivalent |
|---|---|---|---|---|---|
| App / constellation enter | Establishing **zoom-out → settle** + node **Stagger** Scale-in | enter | 1200 (`constellationIntro`) | starfield fade-in | instant framing + 150ms fade, no stagger |
| Node reveal / expand | **Scale-in + Pop** (0.95→1.0, peak ≤1.05) + glow **Bloom** | pop | 360 (`node`) | glow | instant show + static ring |
| Edge draw (lineage) | **Line-drawing** (dashoffset) source→derived | enter | 320 (`edgeDraw`) | — | instant full-opacity line |
| Pan | 1:1 drag + **momentum projection** + rubber-band | (spring) | — (velocity) | — | drag kept; no inertia glide |
| Zoom | **Continuity zoom** (origin-aware viewBox spring) | move | 300 (`zoom`) | — | instant viewBox set |
| Node drag | 1:1 pointer + **spring settle** (bounce 0.15) | (spring) | 360 (`node`) | — | 1:1 kept, instant settle, no overshoot |
| Node hover | **Glow-Pulse** ring + lift (−2px) | enter | 160 (`tooltip`) | glow | outline only, no pulse |
| Press feedback | **Press/Tap** scale 0.97 on pointer-*down* | press | 120 (`press`) | — | kept (non-vestibular) |
| Keyboard focus | Focus ring **materialize** + center-in-view | move | 200 (`fast`) | — | instant ring + jump-to-view |
| Inspector open | **Origin-aware Scale-in** (from node) + **Blur-mask** + **Materialize** (backdrop blur+scale) | enter | 260 (`panel`) | frost | instant / 150ms opacity |
| Inspector close | reverse (same path), faster | enter | 200 (`fast`) | — | instant |
| Timeline reveal | **Stagger** slide-up + fade (beats) | enter | 400 (`timeline`), 50ms step | — | all beats shown, no slide/stagger |
| Verify — step check | **Stepped** sequential ticks → check **Pop** per row | pop | 420 (`verifyStep`)/step | tick spark | instant all-pass list + `aria-live` |
| Verify — **seal** | **Verified ✓ Seal**: ring **Line-draw** + Scale-in + one-shot **Bloom** + root **Number-ticker** | pop | 640 (`seal`) | bloom ring | static seal badge + `aria-live` announce |
| Tamper — fail | node **Shake** (byte-level only) + lineage **desaturate** + root **Text-morph** (old→new, diff) + **MISMATCH** seal | move | 400 (`tamper`) | red pulse (integrity only) | static **MISMATCH** chip + diff text, no shake |
| Hash reveal | **Typewriter / Text-morph** of digest (mono, tabular) | linear | 600 (`count`) | — | instant full hash |
| Merkle tree build | bottom-up **Stagger** (leaf→interior→root) draw | enter | 400 (`timeline`) | — | instant full tree |
| Counter (node/leaf) | **Number-ticker** (tabular) | enter | 600 (`count`) | — | instant number |
| Trace path | traveling **light-pulse** along the traced edges | linear | 600 (`count`) | glow | static highlight of the traced subset |
| HUD toggle (legend/filter/plain/rm) | **Instant** (frequent action → no animation) | — | 0 (`instant`) | — | instant |
| Legend / drawer open | **Origin-aware Scale-in** + item **Stagger** 40ms | enter | 220 (`reveal`) | — | instant / fade |
| Ambient constellation | star **Float / Twinkle** + edge **shimmer** | linear/sine | 6000 (`ambient`) loop, 2200 (`glowLoop`) | low | **all off**; positions/depth kept |

**Deliberately excluded** (would violate §1 / this design): `Shake`/`Wiggle` on any person / learner /
`Outcome` / `Assistance` (reads as accusation — only the byte-tamper node shakes); alarm-red anywhere
but the integrity tamper; any `scale(0)` entrance; `ease-in` on entrances; gacha/loot "reveal";
loss/decay/streak/countdown meters; engagement-timed pop-ins; autoplaying loud celebration; any looping
earworm audio.

### 5.7 · Verification sequences (orchestration — the loudest moments)

The two orchestrated sequences (multi-property motion timed as one gesture) are reserved for the verify
mechanism, never for minutes:

**A. Verify → "the sky confirms."** On **Verify**: (t=0) the checks panel **Steppes** through each row
(`merkle` → `subject digest` → `human authority` → `(stub) transparency-log`), each turning to a `pass`
tick; (t≈420·n) once all non-stub steps pass, the constellation **locks** — a ring of light
**Line-draws** shut around the milestone, a one-shot **Bloom** blooms from center, the Merkle root
**Number-tickers** up in mono, and an `aria-live` region announces "Verified — Merkle root re-derived,
attestation subject matched, every grade human-owned." Sound: an optional muted, captioned rising chime.
**Reduced motion:** a static **Verified ✓** seal + the announce; nothing must be motion to be understood.

**B. Tamper demo → "integrity catches it."** On **Tamper**: one bound node's payload is mutated (in
memory), the domain re-derives, the Merkle step turns `fail`; the **byte-level node Shakes** briefly and
its glyph **glitches** (Text-morph), the lineage to the root **desaturates**, the root **Text-morphs**
old → new with a highlighted diff, and a **MISMATCH** seal appears in `--tamper`. `aria-live` announces
"Tamper detected — recomputed Merkle root does not match the committed root." **Reduced motion:** a
static **MISMATCH** chip + the old/new root diff text, no shake/glitch. Red + shake appear **only** here,
**only** on bytes — never on a person.

Both derive from `buildVerificationView` (§8.8) + `resolveMotion`, so pass/fail, the step set, and the
reduced equivalent are deterministic and testable (SC-E08).

### 5.8 · Drill-down inspector (design §5.8; view data-model)

The **Inspector** panel is a frosted, origin-aware surface (scales from the selected node's screen
position; `transform-origin` at the node) presenting the `NodeView`:

- **Header**: glyph + node type + short label; a "human-owned" seal for a grade `Outcome`; a neutral
  **"Declared AI assistance — cited"** ribbon for a `model`-authored `Assistance`/`Review`.
- **Content-address**: the full id (mono, tabular, copy button) + a "content-addressed" note.
- **Actor**: a kind chip — `human` / `model` (`--model`, cited/neutral) / `tool` / `system` — with the
  pseudonymous ref; **no** accusation language or affordance.
- **Tool/version**, **inputs** (each a link that focuses the input node), **timestamp**, **consent
  scope** (labeled "synthetic"), and the **type-specific payload**.
- Everything mirrored in the Ledger panel description (§5.12). Materialize on open; instant/fade reduced.

### 5.9 · HUD & controls (design §5.9)

Frosted, `backdrop-filter` panels floating over the void (Apple materials: chrome content scrolls under,
not opaque bars): a top milestone banner, a right inspector dock, a bottom timeline strip, and a control
cluster — **Legend**, **Filters** (by node type), **Trace from Outcome**, **Search/Focus**, **Verify**,
**Tamper demo**, **Plain mode**, **Reduced motion** (system/on/off), **Audio captions** (muted default).
Press feedback on every control (scale 0.97); ≥44px targets; reduced-transparency → solid panels.

### 5.10 · Sound (muted by default, captioned — optional)

Audio is **muted by default** with a single toggle and **captions** in the Ledger; no cue loops or is
engagement-timed. Optional cues: verify-seal rising chime `[verified]`, step tick `[check]`, tamper
neutral tap `[mismatch]` (**neutral**, never an alarm). `resolveSoundCue(event)` is deterministic (a
later, non-breaking addition; this slice may ship caption ids only).

### 5.11 · Assets & no-fetch

- **No external fetch, ever.** Glyphs are **committed inline SVG** shapes; the starfield is a
  **deterministic seeded** Canvas draw (no `Math.random`); fonts use a **system fallback stack** by
  default with optional self-hosted subset `woff2` under `public/fonts/` (non-breaking).
- The fixture data (§7) is a **committed synthetic** graph built via the `@gt100k/evidence-graph` API;
  no data is fetched.

### 5.12 · The accessible Provenance Ledger — visual + semantic (D5, §12)

Built from the same `ExplorerView`: the DAG as a keyboard-navigable `role="tree"` (each node a
`treeitem` whose accessible name = *type + label + state + actor + human-owned/cited marker*), the
timeline as an ordered list, verification as a status list with an `aria-live="polite"` seal region, and
each inspector as a described region. Full keyboard/switch operation (Tab/Arrow/Enter/Escape), visible
`--focus` rings, color-independent cues (glyph + text), ≥4.5:1 contrast. The SVG/Canvas is
`aria-hidden="true"`. Because both renderers consume the one view model, they never drift (parity by
construction, SC-E10).

### 5.13 · Motion principles (the rules every value above obeys)

- **Frequency-appropriate** (Emil): rare (verify seal) → delight; occasional (focus, panel) → standard
  eased; frequent (HUD toggles, hover) → instant / near-instant.
- **Enter/exit `enter` (strong ease-out)**, on-screen moves `move`, reveals `pop` (overshoot ≤1.05,
  never `scale(0)`); **never `ease-in` on entrances**.
- **Interruptible & velocity-aware** (Apple): pan/zoom/drag re-target from the live value; nothing locks
  input; momentum handed off on release.
- **Only `transform`/`opacity`/`filter`** animate; no layout thrash; target **60fps** with a degraded
  tier (starfield + glow off) holding the budget.
- **Every** animation has a reduced-motion equivalent (§8.10) and a Ledger equivalent (§12); reduced
  motion is *the same instrument, conveyed calmly.*

---

## §6 · Requirements *(mandatory)*

### Functional Requirements

**Constellation & view model**

- **FR-E01**: The app MUST render the evidence graph (§7) as an interactive constellation — 8 node types
  as glyph+color stars, 6 edge types as labeled light-thread edges — with a **deterministic layout**
  (§8.1), pan/zoom/expand, and animated node/edge reveals (each with a reduced-motion equivalent).
- **FR-E02**: The view MUST derive from a single **`ExplorerView`** produced by `buildExplorerView` in
  `@gt100k/evidence-explorer-view`; the SVG constellation, the reduced-motion rendering, and the
  accessible Ledger MUST all render from that same view (parity by construction).
- **FR-E03**: Layout, timeline order, and verification-step derivation MUST be **pure, deterministic**
  functions of the graph/packet — no `Math.random`, no wall-clock in the view package; identical input →
  identical output (replayable).
- **FR-E04**: The view MUST map **every** node type to a distinct **glyph + color-role + accessible
  label**, and **every** edge type to a distinct **stroke style + label**; nothing conveys type/state by
  **color alone** (§8.12, WCAG 2.2 AA).

**Reads the domain; verification & integrity**

- **FR-E05**: The app/view MUST **read** `@gt100k/evidence-graph` and MUST NOT modify it or
  re-implement hashing/canonicalization/Merkle/attestation/human-authority; verification MUST re-use the
  domain's `merkleRoot`, subject-digest check, `assertHumanAuthority`, and the stub `Verifier`.
- **FR-E06**: The verification view MUST derive an ordered `steps[]` (merkle, subject-digest,
  human-authority, and the clearly-labeled `nonProduction` transparency-log stub) and a `sealState`
  (`unverified` | `verified` | `mismatch`) from the domain; an untampered packet → `verified`; a packet
  with one altered node → `mismatch` with both roots. The app computes **no** grade.
- **FR-E07**: The tamper demo MUST alter one bound node's bytes, re-derive via the domain, and visibly
  fail; the failure framing (red + a brief shake) MUST appear **only** on the byte-level node and the
  root diff — never on a person, learner, `Outcome`, or `Assistance`.

**Human authority & no accusation (product guardrail — Constitution I/IV/IX)**

- **FR-E08**: A grade `Outcome` MUST render as **human-owned** with its named human owner; a `model`
  actor's output MUST render **only** as a cited `Assistance`/`Review` (neutral `--model` chip, calm
  tone); the view model MUST expose **no** accusation field/affordance and MUST NOT compute or assert a
  grade or an AI-authorship accusation.
- **FR-E09**: Declared AI-assistance MUST be presented as **cited supporting evidence** (positive,
  neutral), with its attestation reference where present — never as suspicion.

**Reduced motion, accessibility & no dark patterns**

- **FR-E10**: Reduced motion MUST be a **first-class, equal** mode: every animated affordance MUST have a
  reduced-motion rendering conveying the same state; `prefers-reduced-motion` MUST be honored by default
  and overridable (system/on/off); **no** feature may require motion. All motion params MUST derive from
  the deterministic `resolveMotion` (§8.10).
- **FR-E11**: All surfaces MUST meet **WCAG 2.2 AA** via the accessible DOM **Provenance Ledger** —
  keyboard/switch/screen-reader operable, focus-visible, color-independent, ≥4.5:1 contrast. The
  SVG/Canvas MUST be `aria-hidden`; the Ledger conveys identical state.
- **FR-E12**: The view types MUST **structurally** exclude dark patterns: **no** `leaderboard`, fixed
  caste `rank`, bottom-rank, `streak`, `countdown`, `urgency`, `price`, or engagement-timed field; no
  loss-framed or manufactured-scarcity surface.

**Build-on / isolation & stack**

- **FR-E13**: The feature MUST live in **new dirs only** (`packages/evidence-explorer-view`,
  `apps/evidence-explorer`) and MUST NOT modify `packages/evidence-graph`, its adapters,
  `packages/learning-loop`, `apps/student-compass`, or shared root config **except** the single final
  root-`tsconfig.json` references task.
- **FR-E14**: The app MUST render on **Next.js 14 App Router + React 18** with **`framer-motion`**, the
  interactive constellation loaded **client-side**, producing **zero console errors** in the smoke run
  and building cleanly with `next build`; **no external fetch**.
- **FR-E15**: All fixture data MUST be **committed synthetic**, built via the `@gt100k/evidence-graph`
  public API; the app MUST build and run with no network access and no secrets.

**Art direction, motion system & assets**

- **FR-E16**: The app MUST render with the **Provenance Observatory** identity — the palette (§8.11),
  typography tokens (§8.11), node/edge visual language (§8.12) — using **no external fetch** (system-font
  fallback by default). Color is never the sole cue.
- **FR-E17**: All interaction motion MUST derive from the deterministic token registry
  (`MOTION`/`EASINGS`, §8.10) via `resolveMotion(kind,{reducedMotion})`; **every** entry in the master
  motion table (§5.6) MUST have a reduced-motion equivalent, and the excluded effects (§5.6) MUST NOT
  appear.
- **FR-E18**: The starfield and any procedural visual MUST be **deterministic/seeded** (no
  `Math.random`); glyphs are committed inline SVG; the accessible Ledger MUST NOT depend on Canvas/SVG.

### Key Entities

Full shapes in [data-model.md](./data-model.md). Summary: `ExplorerView` (the composed view driving every
renderer), `NodeView` (id/type/glyph/colorRole/label/actorChip/tool/inputs/timestamp/consentScope/
payload/position/rank/isHumanOwned/isCitedAssistance/isInMilestone), `EdgeView` (type/from/to/label/
strokeStyle/path/isLineage), `ActorChip` (kind/ref/tone/citedLabel — no accusation field), `TimelineView`
+ `TimelineBeat` (order/nodeId/group/label/timestamp), `VerificationView` + `VerifyStep`
(id/label/status/detail/nonProduction) + `sealState`, `LedgerView` (tree/timelineList/verificationList/
panels), `MotionSpec` (kind/mode/durationMs/easing), and the golden registries `PALETTE` / `TYPOGRAPHY` /
`MOTION` / `EASINGS` (+ `resolveMotion`, `plainViewEquals`). All read from `@gt100k/evidence-graph` types.

---

## §7 · Golden fixtures (the canonical synthetic milestone)

The view package ships a committed synthetic fixture, `explorerFixture(hasher)`, that builds a coherent
milestone through the `@gt100k/evidence-graph` API and assembles an `EvidencePacket` + verifier result.
It is the "**speaker-v1**" milestone (echoing PRD §21's speaker-design story), synthetic + pseudonymous.

### 7.1 Fixture graph (13 nodes; declaration order fixed)

Declaration order is fixed (it drives within-rank layout order, §8.1). Types + edges:

| # | key | type | actor.kind | notes |
|---|---|---|---|---|
| 1 | `plan` | Transformation | human | declared plan (prospective) |
| 2 | `assist-research` | Assistance | model | cited research retrieval (tool/model) |
| 3 | `assist-tutor` | Assistance | model | cited answer-blind tutor hint |
| 4 | `src-artifact` | Artifact | human | source/design files |
| 5 | `attempt-1` | Attempt | system | first build run (a failed branch) |
| 6 | `attempt-2` | Attempt | system | revision run (success) |
| 7 | `claim-repro` | Claim | human | hermetic-reproduction claim |
| 8 | `review-technical` | Review | human | technical reviewer |
| 9 | `released-artifact` | Artifact | system | the released speaker design v1 |
| 10 | `contribution-self` | Contribution | human | the learner's own contribution |
| 11 | `review-craft` | Review | human | craft-mentor review |
| 12 | `outcome-grade` | Outcome | human | final grade — **human-owned** |
| 13 | `island-note` | Claim | human | **unrelated** island (no milestone edges) |

**Edges** (typed; `from → to`):
`src-artifact derived_from plan`, `src-artifact derived_from assist-research`,
`attempt-1 derived_from src-artifact`, `attempt-1 derived_from assist-tutor`,
`attempt-2 derived_from attempt-1`, `attempt-2 derived_from src-artifact`,
`claim-repro validates attempt-2`, `review-technical validates attempt-2`,
`attempt-2 released_as released-artifact`, `contribution-self derived_from attempt-2`,
`review-craft validates released-artifact`, `outcome-grade validates released-artifact`;
plus `authored_by` edges from each node to its actor ref (§data-model). `island-note` has **no**
milestone edges (proves trace/scope excludes it, mirrors parent SC-012).

**Packet**: milestone `"speaker-v1"`, subject = `released-artifact`'s digest; `nodeIds` = the 12
milestone nodes (island excluded). Human-authority: `outcome-grade` is `authored_by` a `human` →
`assertHumanAuthority` passes.

### 7.2 Provenance ranks (deterministic, structure-only — golden §8.1)

Layering "depends-on" = `derived_from` ∪ `released_as`(→artifact is later) ∪ `validates`(→reviewer is
later). Longest-path rank:

| rank | nodes (in declaration order) |
|---|---|
| 0 | `plan`, `assist-research`, `assist-tutor` |
| 1 | `src-artifact` |
| 2 | `attempt-1` |
| 3 | `attempt-2` |
| 4 | `claim-repro`, `review-technical`, `released-artifact`, `contribution-self` |
| 5 | `review-craft`, `outcome-grade` |
| (island) | `island-note` — disconnected, laid out below at `ISLAND_Y` |

---

## §8 · Golden values + tolerances

All view-package values below are **exact** (deterministic; tolerance = 0). UX/motion values are pinned
as **exact tokens** the domain derives as constants (tested), and are acceptance targets in the app
walkthrough.

### 8.1 Layout (exact) — `layoutExplorer(graph)`

Constants: `MARGIN_X = 120`, `MARGIN_Y = 120`, `COL_W = 240`, `ROW_H = 160`, `NODE_R = 28`,
`ISLAND_Y = 760`. For a node at rank `r` and within-rank order `i` (0-based, graph insertion order):
`x = MARGIN_X + r·COL_W`, `y = MARGIN_Y + i·ROW_H`. Disconnected components lay out below the DAG
starting at `ISLAND_Y` (first island node at `x = MARGIN_X`). World bounds derive from content:
`{ x:0, y:0, width: maxX + MARGIN_X, height: maxY + MARGIN_Y }`. **x depends only on rank** (hand-
derivable); y depends on rank + insertion order (§7.1 order).

Golden positions for the §7 fixture:

| node | rank | order | (x, y) |
|---|---|---|---|
| `plan` | 0 | 0 | (120, 120) |
| `assist-research` | 0 | 1 | (120, 280) |
| `assist-tutor` | 0 | 2 | (120, 440) |
| `src-artifact` | 1 | 0 | (360, 120) |
| `attempt-1` | 2 | 0 | (600, 120) |
| `attempt-2` | 3 | 0 | (840, 120) |
| `claim-repro` | 4 | 0 | (1080, 120) |
| `review-technical` | 4 | 1 | (1080, 280) |
| `released-artifact` | 4 | 2 | (1080, 440) |
| `contribution-self` | 4 | 3 | (1080, 600) |
| `review-craft` | 5 | 0 | (1320, 120) |
| `outcome-grade` | 5 | 1 | (1320, 280) |
| `island-note` | — | — | (120, 760) |

World bounds for the fixture: `{ x:0, y:0, width: 1440, height: 880 }` (maxX 1320 + 120; maxY 760 + 120).

### 8.2 Node-state / view mapping (exact)

`resolveNodeColorRole(type)` and `resolveNodeGlyph(type)` per the §5.1 table (exact): Artifact→
(`--c-artifact`,`diamond`); Attempt→(`--c-attempt`,`play`); Transformation→(`--c-transformation`,
`blueprint`); Claim→(`--c-claim`,`quote`); Assistance→(`--c-assistance`,`spark`); Review→(`--c-review`,
`scale`); Contribution→(`--c-contribution`,`hex`); Outcome→(`--c-outcome`,`seal`). Every `NodeView` also
carries a text `label` (never color-only). `isInMilestone` = node ∈ packet `nodeIds`; `isHumanOwned` =
grade `Outcome` with a `human` `authored_by`; `isCitedAssistance` = `Assistance`/`Review` with a `model`
actor.

### 8.3 Timeline order (exact) — `buildTimelineView(graph, packet)`

Beats are the milestone nodes ordered by **(rank asc, then graph insertion order)**, grouped:
`plan → assist → src-artifact → attempt-1 → attempt-2(revision) → claim → review-technical →
released-artifact → contribution → review-craft → outcome`. Group tags: `plan`, `assist`, `artifact`,
`attempt`, `revision`, `claim`, `review`, `release`, `contribution`, `outcome`. Deterministic + stable;
island excluded.

### 8.4 Verification view (exact) — `buildVerificationView(packet, verifierResult, graph, hasher)`

Ordered `steps[]` (exact ids + order): `["merkle-root","subject-digest","human-authority","transparency-log-stub"]`.
- `merkle-root`: `pass` iff `merkleRoot(nodeHashes, hasher) === packet.merkleRoot` (re-derived via the
  domain). Detail carries `{ committed, recomputed }`.
- `subject-digest`: `pass` iff `attestation.subject[0].digest.sha256 === packet.subjectDigest`.
- `human-authority`: `pass` iff `assertHumanAuthority(subgraph).ok`; detail carries the domain's reasons
  when failing.
- `transparency-log-stub`: `status:"stub"`, `nonProduction:true`, `label` "Transparency-log inclusion
  (pre-live gate, stub)" — from the domain's deferred `TransparencyLog` stub; **never** blocks the seal.
`sealState` = `"verified"` iff all non-stub steps `pass`; `"mismatch"` iff any non-stub step `fail`;
`"unverified"` before Verify. Tamper demo: mutating one node's payload flips `merkle-root` to `fail`,
`sealState` to `"mismatch"`, and the detail exposes committed≠recomputed. **The app computes no grade.**

### 8.5 Motion tokens + easings (exact) — `MOTION`, `EASINGS`, `resolveMotion`

`MOTION` (durations, ms — exact): `instant:0`, `press:120`, `micro:150`, `tooltip:160`, `fast:200`,
`reveal:220`, `panel:260`, `base:300`, `zoom:300`, `edgeDraw:320`, `node:360`, `timeline:400`,
`tamper:400`, `verifyStep:420`, `count:600`, `seal:640`, `constellationIntro:1200`, `glowLoop:2200`,
`ambient:6000`.

`EASINGS` (CSS cubic-bézier — exact): `enter:"cubic-bezier(0.23,1,0.32,1)"`;
`move:"cubic-bezier(0.65,0,0.35,1)"`; `pop:"cubic-bezier(0.34,1.56,0.64,1)"` (overshoot ≤1.05);
`press:"cubic-bezier(0.4,0,0.6,1)"`; `drawer:"cubic-bezier(0.32,0.72,0,1)"`; `linear:"linear"`.

`SPRINGS` (framer-motion — exact): `ui:{ type:"spring", bounce:0, duration:0.4 }` (critically damped
default); `flick:{ type:"spring", bounce:0.15, duration:0.45 }` (drag release); pan `decel:0.998`
(momentum projection); zoom uses `ui`.

`resolveMotion(kind,{reducedMotion})` → `{ kind, mode, durationMs, easing }`. Animated table (exact);
under `reducedMotion:true` → `mode:"reduced"`, `easing:"linear"`, `durationMs` from the reduced column:

| kind | animated dur | animated easing | reduced dur | reduced note |
|---|---|---|---|---|
| `constellationIntro` | 1200 | enter | 0 | instant framing |
| `nodeReveal` | 360 | pop | 0 | instant show |
| `edgeDraw` | 320 | enter | 0 | instant line |
| `zoom` | 300 | move | 0 | instant viewBox |
| `nodeHover` | 160 | enter | 0 | outline only |
| `press` | 120 | press | 120 | kept (non-vestibular) |
| `focusMove` | 200 | move | 0 | instant jump-to-view |
| `panelOpen` | 260 | enter | 150 | fade |
| `panelClose` | 200 | enter | 150 | fade |
| `timelineReveal` | 400 | enter | 0 | instant list |
| `verifyStep` | 420 | pop | 0 | instant + aria-live |
| `seal` | 640 | pop | 150 | static seal + announce |
| `tamper` | 400 | move | 0 | static MISMATCH |
| `hashReveal` | 600 | linear | 0 | instant hash |
| `merkleBuild` | 400 | enter | 0 | instant tree |
| `counter` | 600 | enter | 0 | instant number |
| `tracePulse` | 600 | linear | 0 | static highlight |
| `drawerOpen` | 220 | enter | 150 | fade |
| `ambient` | 6000 | linear | 0 | off (static) |
| `hudToggle` | 0 | linear | 0 | instant |

### 8.6 Palette + typography tokens (exact) — `PALETTE`, `TYPOGRAPHY`

`PALETTE` (exact hex): `void:#0A0E17`, `panel:#121826`, `panel2:#1A2233`, `line:#2A3346`, `ink:#EAF0FB`,
`inkMuted:#9AA7C2`, `focus:#7DD3FC`, `verify:#34E5B0`, `tamper:#FF5A6E`, `human:#FFD166`, `model:#8B9BC7`;
node types: `artifact:#E9C46A`, `attempt:#4CC9F0`, `transformation:#5E7CE2`, `claim:#B892FF`,
`assistance:#3DDC97`, `review:#FFB03A`, `contribution:#F072C0`, `outcome:#FF7A8A`. Contrast: `ink` on
`void` ≈ 16:1 (AAA); `inkMuted` on `void` ≈ 8:1 (AA+). Node accents are graphical (fills/glyph strokes,
≥3:1); text labels always in `ink`/`inkMuted`, hashes in `ink` mono. State color is always paired with a
glyph/shape + text (FR-E04).

`TYPOGRAPHY` (exact): `fontDisplay:'"Space Grotesk",ui-sans-serif,system-ui,sans-serif'`,
`fontBody:'"Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif'`,
`fontMono:'"JetBrains Mono",ui-monospace,"SFMono-Regular","Cascadia Code",monospace'`; scale
`display{rem:2.5,lh:1.05,ls:-0.02,w:700}`, `h1{1.75,1.10,-0.01,600}`, `h2{1.25,1.20,0,600}`,
`body{1.0,1.5,0,400}`, `label{0.8125,1.4,0.01,500}`, `mono{0.8125,1.5,0,500}`; `numeric:"tabular-nums"`.

### 8.7 Node & edge visual language (exact) — `NODE_GLYPHS`, `EDGE_STYLES`

`NODE_GLYPHS` (type→glyph id): per §8.2. `EDGE_STYLES` (type→{strokeStyle, cap, label}, exact):
`derived_from`→(`solid`,`plain`,"derived from"); `authored_by`→(`dotted`,`plain`,"authored by");
`used_tool`→(`dashed-fine`,`plain`,"used tool"); `validates`→(`solid`,`check`,"validates");
`contradicts`→(`dashed`,`slash`,"contradicts"); `released_as`→(`solid`,`arrow`,"released as"). Each edge
label is exposed in the Ledger (color/stroke never the sole cue).

### 8.8 Camera + parallax (exact) — `CAMERA`, `PARALLAX`

`CAMERA` (exact): `zoomBase:1.0`, `zoomMin:0.5`, `zoomMax:2.5`, `focusZoom:1.4`, `zoomIntroStart:0.6`,
`lookAheadPx:64`, `panDecel:0.998`, `rubberband:0.55`, `bounds:"derived from world bounds §8.1"`.
`PARALLAX` (exact, back→front): `starfield:0.15`, `world:1.0`, `foreground:1.08`. Under reduced motion /
degraded tier the ambient layers stop moving but keep their depth offset (static).

### 8.9 Guardrail structural checks (exact)

`NodeView`/`EdgeView`/`VerifyStep`/`TimelineBeat`/`ActorChip` MUST expose **none** of:
`price|currency|rank|leaderboard|percentile|outOf|streak|countdown|urgency|dropRate|rarity|accusation`.
`ActorChip.tone` for a `model` actor is `"model"` (cited/neutral); `VerificationView.sealState` is the
only carrier of `"mismatch"`/`--tamper`. The view package source contains **no** `Math.random`. (SC-E11.)

---

## §9 · Phasing (P0…P6) — the build path

Each phase is independently valuable and gated. Work the lowest unfinished phase. Detailed tasks in
[tasks.md](./tasks.md).

### P0 — Foundation & green-from-iteration-1

**Goal**: view package + app skeletons compile; the gate is green immediately.
**Deliverables**: `packages/evidence-explorer-view` (`package.json` dep `@gt100k/evidence-graph`
`workspace:*`, `tsconfig.json`, `src/index.ts`, `src/model.ts` view types, the golden registries
`PALETTE`/`TYPOGRAPHY` (`art.ts`), `MOTION`/`EASINGS`/`resolveMotion` (`motion.ts`), `NODE_GLYPHS`/
`EDGE_STYLES` (`visual.ts`), `CAMERA`/`PARALLAX` (`camera.ts`), the fixture `fixtures/explorer.fixture.ts`,
and `plainViewEquals`); `apps/evidence-explorer` skeleton (`package.json`, `next.config.mjs`
transpiling the two packages, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx` placeholder,
`app/globals.css` with the §8.6 tokens + reduced-motion/reduced-transparency + `:focus-visible`,
`.env.local.example`, `.gitignore`); a **seeded smoke test** (`test/smoke.test.ts`) that imports the
package and asserts the fixture view builds.
**Gate**: `pnpm typecheck` + `pnpm test` green.

### P1 — Constellation graph (US1) 🎯 MVP

**Goal**: the graph renders as an interactive animated constellation with the Observatory art direction;
deterministic layout; pan/zoom/expand; reduced-motion + Ledger convey identical states.
**View**: `layoutExplorer`, `resolveNodeGlyph`/`resolveNodeColorRole`, `buildExplorerView` (nodes +
edges + layout + presentation), `buildLedgerView` (tree). **App**: `ObservatoryStage` + `Constellation`
(SVG nodes/edges + glow + reveal), deterministic `Starfield` (Canvas, aria-hidden), pan/zoom/focus with
momentum, reduced-motion path, the accessible Ledger tree.
**Gate**: P0 gate + `next build` + smoke (zero console errors) + walkthrough steps 1, 5.

### P2 — Build timeline (US2)

**View**: `buildTimelineView`. **App**: `Timeline` strip with staggered reveals; beat→node focus link;
Ledger ordered list parity.
**Gate**: P1 gate + walkthrough step 2.

### P3 — Verification UX + tamper demo (US3)

**View**: `buildVerificationView` (re-using domain `merkleRoot`, subject-digest, `assertHumanAuthority`,
stub `Verifier`); `applyTamper(fixture)` (mutate one node, re-derive). **App**: `VerifyPanel` stepped
checks + Verified ✓ seal (ring-draw + bloom + root ticker) + tamper demo (byte node shake/glitch + root
diff + MISMATCH), `aria-live` announces; reduced-motion equivalents.
**Gate**: P2 gate + walkthrough step 3.

### P4 — Drill-down panels + human-authority + cited AI-assist (US4)

**View**: `ActorChip` tone + `isCitedAssistance` + `isHumanOwned` derivation; panel view-model. **App**:
`Inspector` (origin-aware, frosted) with id/actor/tool/inputs/timestamp/consent/payload; the "human-owned"
seal for a grade `Outcome`; the neutral "Declared AI assistance — cited" ribbon for a model
`Assistance`/`Review`; no accusation affordance; Ledger panel parity.
**Gate**: P3 gate + walkthrough step 4.

### P5 — HUD, legend, filters, trace, plain mode (US5)

**View**: trace via domain `traceEvidence`; `plainViewEquals`. **App**: `Hud` (legend of all 8 node + 6
edge types; filters by type; "trace from Outcome" highlight; search/focus; plain-mode toggle;
reduced-motion override; audio-caption toggle) — presentation-only; state unchanged.
**Gate**: P4 gate + walkthrough steps 5–6.

### P6 — Polish, accessibility & performance acceptance

**Goal**: WCAG 2.2 AA pass (keyboard/switch/screen-reader over the Ledger, color-independent cues,
contrast), reduced-motion parity, 60fps pan/zoom + graceful degradation, zero console errors; README +
demo; the final root-`tsconfig.json` references task (T-ROOT — the single shared-file touch, kept as its
own isolated change).
**Gate**: all SCs map green; full quickstart validation.

---

## §10 · Success Criteria *(mandatory)* — each mapped to a test

View-package SCs are Vitest tests in `packages/evidence-explorer-view/test/`; app SCs are verified via
`next build` + the smoke + the quickstart walkthrough (frame-rate is an acceptance target, not a unit
test). Tolerance for exact values is byte-for-byte (zero).

- **SC-E01** — `layoutExplorer(fixture)` is deterministic and matches the golden positions (§8.1),
  including the island slot; x depends only on rank. → `test/layout.test.ts`.
- **SC-E02** — `buildExplorerView` composes one view (nodes+edges+layout+timeline+verification+ledger+
  presentation) that drives every renderer; reduced-motion/plain does not recompute state. →
  `test/view.test.ts` (`plainViewEquals`, same underlying state).
- **SC-E03** — Reduced-motion parity: `plainViewEquals(full, reduced)` holds; every animated affordance
  has a reduced equivalent via `resolveMotion`. → `test/view.test.ts` + `test/motion.test.ts`.
- **SC-E04** — Every interaction-motion value derives from the deterministic token registry and each has
  a reduced-motion equivalent (§8.5 golden table incl. reduced mode). → `test/motion-tokens.test.ts`.
- **SC-E05** — Palette/typography tokens are exact (§8.6); every node type maps to a distinct
  glyph+color+label and every edge type to a distinct stroke-style+label (§8.7); state is never
  color-only. → `test/art.test.ts` + `test/visual.test.ts`.
- **SC-E06** — All 8 node types + 6 edge types are covered by the view mapping with an accessible label;
  the island node is `isInMilestone=false` and excluded from trace. → `test/mapping.test.ts`.
- **SC-E07** — `buildTimelineView` yields a deterministic ordered, grouped `beats[]` (§8.3); stable
  across runs; island excluded. → `test/timeline.test.ts`.
- **SC-E08** — `buildVerificationView` derives ordered steps + `sealState` from the **domain**
  (`merkleRoot`/subject-digest/`assertHumanAuthority`/stub `Verifier`); untampered → `verified`; one
  altered node → `mismatch` with both roots; **no** grade computed; the stub step is `nonProduction` and
  never blocks. → `test/verify-view.test.ts` (uses `adapters/evidence-hash-node` +
  `adapters/evidence-verifier-stub` + `adapters/evidence-deferred`).
- **SC-E09** — A grade `Outcome` renders human-owned with its named owner; a `model` actor renders only
  as cited `Assistance`/`Review` (neutral tone); the view model exposes **no** accusation field/affordance
  and computes no grade/accusation. → `test/authority-view.test.ts`.
- **SC-E10** — The accessible Ledger view-model is complete: every node (tree), timeline beat (list), and
  verification step (status) is present with an accessible name; parity with the constellation. →
  `test/ledger.test.ts`.
- **SC-E11** — Structural guardrails: view types expose none of
  `price|currency|rank|leaderboard|percentile|outOf|streak|countdown|urgency|dropRate|rarity|accusation`;
  no `Math.random` in package source; red/`mismatch` only on `VerificationView`. → `test/guardrails.test.ts`.
- **SC-E12** — The app builds (`next build`) and mounts with **zero console errors**; the SVG/Canvas are
  `aria-hidden`; the DOM Ledger is present and focusable; reduced-motion toggle works; Verify shows the
  seal and announces via `aria-live`. → `next build` + Playwright smoke (§11).
- **SC-E13** — WCAG 2.2 AA: keyboard/switch/screen-reader operable over the Ledger, focus visible,
  color-independent cues, ≥4.5:1 contrast. → quickstart a11y walkthrough + `test/ledger.test.ts`.
- **SC-E14** — The view/app read `@gt100k/evidence-graph` unchanged; swapping the `Hasher`/`Verifier`
  adapter needs no view change; the domain's golden values still hold. → `test/integration.test.ts`
  (build view with the real node hasher + stub verifier).
- **SC-E15** — A **seeded smoke test** passes from iteration 1 (the workspace builds and Vitest discovers
  the new package). → `test/smoke.test.ts`.

---

## §11 · Stack, commands, env & seeded smoke (pinned)

### Stack

- **Package manager**: pnpm `9.15.9` (workspace; lockfile auto-detected).
- **Language**: TypeScript `5.6.3`, strict (`tsconfig.base.json`: `strict`, `noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, `composite`), Node LTS.
- **View package**: pure TS, dep `@gt100k/evidence-graph` (`workspace:*`) only; **dev**-deps
  `adapters/evidence-hash-node`, `adapters/evidence-verifier-stub`, `adapters/evidence-deferred`
  (`workspace:*`) for verification/integration tests.
- **App**: Next.js `^14.2.15` App Router + React `^18.3.1` (match `apps/student-compass`),
  **`framer-motion@^11.11.0`**, `transpilePackages: ["@gt100k/evidence-explorer-view",
  "@gt100k/evidence-graph"]`, the interactive constellation loaded client-side. No external fetch.
- **Test**: Vitest (root `vitest.config.ts` already globs `packages/**/test` — no root edit).

### Commands

```bash
pnpm install                                        # bootstrap workspace
pnpm typecheck                                      # tsc -b (green after T-ROOT adds the references)
pnpm test                                           # Vitest across the workspace (view package)
pnpm --filter @gt100k/evidence-explorer-view test   # view-package tests only
pnpm lint                                            # biome check packages adapters apps
pnpm --filter @gt100k/evidence-explorer dev          # run the Provenance Explorer
pnpm --filter @gt100k/evidence-explorer build        # next build — app acceptance/perf gate
```

> Loop gate = `pnpm typecheck` + `pnpm test`. App phases additionally require
> `pnpm --filter @gt100k/evidence-explorer build` + the smoke + walkthrough. The root `build` script
> (student-compass) is **not** modified; the Explorer app is built via its filter.

### Env / secrets

The app needs **no secrets**. Commit `apps/evidence-explorer/.env.local.example` with non-secret public
placeholders and git-ignore `.env.local`; the app reads only `NEXT_PUBLIC_*` with safe defaults so
`build` never fails on missing env.

```dotenv
# apps/evidence-explorer/.env.local.example
NEXT_PUBLIC_EXPLORER_SEED=42
NEXT_PUBLIC_REDUCED_MOTION_DEFAULT=system   # system | on | off
NEXT_PUBLIC_EXPLORER_DENSITY=comfortable    # comfortable | compact
```

### Seeded smoke

- **View smoke** (`packages/evidence-explorer-view/test/smoke.test.ts`, part of P0): imports the package,
  builds the fixture `ExplorerView`, asserts 13 nodes (12 in-milestone + 1 island), the golden layout
  bounds, and a non-empty timeline — so `pnpm test` is green from the first increment.
- **App smoke** (P1+, in the review pipeline's Playwright pass): loads `/`, waits for the SVG
  constellation + the DOM Ledger to mount, asserts **zero console errors**; then toggles reduced-motion,
  runs Verify, and confirms the Verified seal + `aria-live` announce (SC-E12).

---

## §12 · Accessibility & reduced-motion equivalence (detail)

- **Reduced motion** (`prefers-reduced-motion: reduce`, honored by default; overridable): tweens →
  instant or ≤150ms opacity crossfade; ambient starfield/glow/particles off; camera cuts; the Verified
  seal → a static badge + `aria-live`; the tamper → a static MISMATCH chip + diff text (no shake/glitch).
  State/structure/verification remain fully conveyed (FR-E10, SC-E03).
- **Accessible Ledger** (parallel DOM from the same `ExplorerView`, D5/FR-E11, SC-E10): the DAG as a
  `role="tree"` (each node a `treeitem` whose name = *type + label + state + actor + human-owned/cited
  marker*); the timeline as an ordered list; verification as a status list with an `aria-live="polite"`
  seal region; each inspector as a described region. Full keyboard/switch operation, visible focus rings,
  color-independent cues (glyph + text), ≥4.5:1 contrast. SVG/Canvas `aria-hidden="true"`.
- **Plain mode**: a low-spectacle rendering (calm palette, no starfield/glow, minimal motion) that is
  state-identical to full (`plainViewEquals`, SC-E02/E03). Distinct from but compatible with reduced
  motion.
- **Color-independence**: every node/edge/state carries a glyph/shape + text; the UI passes a grayscale
  check (FR-E04).
- **No dark patterns**: the surface has no leaderboard/caste-rank/bottom-rank/streak/countdown/urgency;
  the view types exclude them structurally (FR-E12, SC-E11).

---

## §13 · Pre-marked decision points (defaults + severity)

The loop proceeds on the **default**; it escalates only per §3.

- **DP-1 — Primary renderer.** ✅ Settled: **SVG + `framer-motion`** with a deterministic Canvas
  starfield + frosted DOM panels (D3). Best-looking *and* most accessible for a tens-of-nodes provenance
  DAG. A Canvas/WebGL (Pixi) layer for very large graphs is a non-breaking future upgrade **only with a
  documented reason**. **Severity: low.**
- **DP-2 — Animation library.** ✅ Settled: **`framer-motion@^11`** (springs, gestures, layout
  animations, `useReducedMotion`). GSAP is acceptable only with a documented reason. **Severity: low.**
- **DP-3 — Canvas/SVG accessibility.** ✅ Settled: the synchronized parallel accessible DOM **Provenance
  Ledger** built from the same `ExplorerView`; SVG/Canvas `aria-hidden` (D5). The loop does not re-open
  it. **Severity: low.**
- **DP-4 — Art direction & fonts (no-fetch).** Default: the **Provenance Observatory** identity of
  §5.1/§8.6 — deep-night void, star-glyph node accents, verify-gold — with a **system-font fallback
  stack** (no external fetch). Self-hosted subset `woff2` under `public/fonts/` is a non-breaking upgrade.
  The rejection of the 2026 cream/sand SaaS default is intentional (impeccable). **Severity: low.**
- **DP-5 — Layout algorithm.** Default: **deterministic layered longest-path DAG layout** (§8.1), *not*
  force-directed (determinism/testability). The organic constellation look is a styling layer.
  **Severity: low.**
- **DP-6 — Verification derivation.** Default: derive verification steps by **re-using the domain**
  (`merkleRoot`/subject-digest/`assertHumanAuthority`/stub `Verifier`); the app computes no crypto and no
  grade (D4). **Severity: low.**
- **DP-7 — Sound assets.** Default this slice: **no audio asset pipeline** — `resolveSoundCue` returns
  deterministic caption ids only, muted by default; the tamper cue is **neutral**. A real committed,
  non-fetched sample set is a later non-breaking addition. **Severity: low.**

---

## §14 · Assumptions

- **Builds on the completed `002-evidence-graph` domain.** `@gt100k/evidence-graph` (+ its adapters) is
  available and **unchanged**; this expansion reuses its public API (`addNode`/`addEdge`/`merkleRoot`/
  `assembleEvidencePacket`/`assertHumanAuthority`/`traceEvidence`, the `Hasher`/`Verifier` ports, and the
  deferred `TransparencyLog`/`ErasureService` stubs) and reads it — it never edits it. The domain's golden
  values (parent [../spec.md](../spec.md)) remain the arbiter.
- **Synthetic-only, read-only.** No real learners/consent/admissions/legal; the fixture is committed
  synthetic + pseudonymous; the app renders read-only and needs no auth/persistence/network.
- **The app owns *presentation of* provenance, not the integrity/grade logic.** The domain owns
  hashing/Merkle/attestation/human-authority; the app displays them. Humans own every grade — the app
  shows the domain's human-owned `Outcome`; it never computes a grade or an accusation.
- **Performance budget is an acceptance target.** 60fps pan/zoom (min device) is validated by
  `next build` + the acceptance walkthrough, not a view-package unit test (the pure view carries no
  rendering).
- **New dirs only.** All code lives in `packages/evidence-explorer-view` + `apps/evidence-explorer`;
  shared root files and other apps/packages are untouched except the single final root-`tsconfig.json`
  references task (T-ROOT).
