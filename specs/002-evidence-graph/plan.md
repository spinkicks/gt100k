# Implementation Plan: EvidenceGraph

**Branch**: `002-evidence-graph` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-evidence-graph/spec.md`

> **One spec home.** This plan covers **both** the pure domain (**Part I** below) **and** the Provenance
> Explorer 3D-UI expansion (**Part II**, folded in from the former `explorer/` subfolder). The domain plan
> is unchanged; the Explorer plan (renderer = react-three-fiber + drei + three.js, DOM motion =
> `motion@^12`, a render-tier ladder with a calm-2D fallback) is **Part II**. See [spec.md](./spec.md)
> Part I / Part II.

## Summary

Build the code-first core of GT100K's EvidenceGraph (PRD §19) as a **pure, framework-agnostic TypeScript domain package** (`packages/evidence-graph`): a content-addressed evidence DAG of eight PROV-extended node types and six edge types; a deterministic Merkle root and an in-toto-style attestation for a per-milestone `EvidencePacket`; and the non-negotiable human-authority invariant (humans own every grade; a model output is only a cited `Assistance`/`Review`, never a grade or an authorship accusation). All I/O sits behind ports — `Hasher` (SHA-256, Node-crypto adapter), `Verifier` (deterministic stub adapter), `EvidenceRepository` (in-memory adapter) — so the domain stays deterministic and 100% unit-testable. The genuinely-hard parts (external transparency-log anchoring, crypto-shred erasure, comparative-judgment reliability, conformal calibration) are **stubs / out of scope** per §19.2. Synthetic-only; consent/legal machinery is a stubbed field.

**Loop-ready**: [spec.md](./spec.md) folds in a hard scope fence, ordered phasing (P0…P4), machine-checkable success criteria (SC-001…SC-012) each mapped to a named test, and **pinned golden values** (exact SHA-256 node ids and Merkle roots) that are the loop's deterministic acceptance targets. The build gate is `pnpm exec tsc -b` + `pnpm test`; a seeded smoke test keeps the gate green from iteration 1. The canonicalization and Merkle schemes are pinned exactly (see spec **Decisions Already Made**): node id = `sha256_hex(utf8(JCS(content)))`; Merkle via the **RFC-6962 raw-byte scheme** over the per-node 32-byte SHA-256 digests with `leaf=sha256(0x00 || digestBytes)`, `interior=sha256(0x01 || leftHashBytes || rightHashBytes)`, leaves sorted ascending by digest bytes, odd level promotes the lone right-most node unchanged (never duplicated) — the certificate-transparency standard, for interoperability with the deferred §19.2 D1 transparency log.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS (per PRD §26.1). `tsconfig.base.json` with `noUncheckedIndexedAccess` + `verbatimModuleSyntax` (inherited).

**Primary Dependencies**: None in the domain package (pure TS). Node's built-in `crypto` only inside the `adapters/evidence-hash-node` adapter. pnpm workspaces + Vitest + Biome + `tsc -b` (existing factory gate).

**Storage**: In-memory `EvidenceRepository` for the synthetic slice, behind a port so a real store slots in later without touching domain logic.

**Testing**: Vitest (unit + contract), matching the workspace `vitest.config.ts` include globs (`packages/**/test`, `adapters/**/test`).

**Target Platform**: Local/dev (Node). No cloud/infra in this slice.

**Project Type**: TS monorepo library (`packages/` domain + `adapters/` I/O). No app/frontend in this slice.

**Performance Goals**: Not performance-bound; graph/Merkle ops are deterministic and small at slice scale. Correctness and determinism over throughput.

**Constraints**: Pure domain logic — no I/O, no wall-clock reads, no direct crypto import in the core; hashing and verification injected via ports. Deterministic and replay-safe (idempotent content-addressing FR-005; deterministic Merkle root FR-011). SHA-1/MD5 forbidden (PRD §19).

**Scale/Scope**: One synthetic milestone's evidence graph and packet; eight node types, six edge types; synthetic data only.

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after Phase 1.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass (enforced) | The human-authority invariant (FR-008/US2) is encoded in the domain: every grade/judgment `Outcome` is human-owned; no model owns a grade. |
| III. Evidence-class authority ladder | ✅ Pass | No learned model runs here; a `model` actor's output is admissible only as cited `Assistance`/`Review` (FR-009). |
| IV. Evidence before authority; proof of process | ✅ Pass (core purpose) | The feature *is* the proof-of-process substrate; it records how work was built and MUST NOT make an automated AI-authorship accusation (FR-009). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only; actor refs pseudonymous; consent scope is a stubbed field; no real PII/admissions/sensitive data. Erasure shape noted, real crypto-shred deferred (§19.2 D2). |
| IX. Prohibited product behavior | ✅ Pass | No automated AI-authorship accusation is representable (FR-009); no automated consequential decision (grades are human-owned). |
| ENG (governed flow, tests-define-done, no secrets) | ✅ Pass | Branch→PR→CI; Vitest/Biome/tsc gate; no secrets/machine paths; synthetic-only; SHA-1/MD5 forbidden. |

**Result: PASS** — no violations, no Complexity Tracking needed. The one deliberate deferral (transparency-log anchoring, crypto-shred, ACJ reliability, conformal calibration) is explicitly a **pre-live gate** (§19.2), not a synthetic-beta requirement, and is represented by clearly-marked stubs / out-of-scope notes rather than silent omission.

## Project Structure

### Documentation (this feature)

```text
specs/002-evidence-graph/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (domain API + ports)
│   └── evidence-graph.md
├── checklists/
│   └── requirements.md  # spec quality checklist
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
packages/
└── evidence-graph/              # PURE domain — the heart of this feature
    ├── src/
    │   ├── model.ts             # NodeType/EdgeType enums, EvidenceNode/Edge, ActorRef, ToolRef, ConsentScope, PROV map
    │   ├── canonicalize.ts      # deterministic canonical serialization (for hashing)
    │   ├── graph.ts             # addNode/addEdge, content-addressing, cycle + dangling rejection
    │   ├── invariants.ts        # assertHumanAuthority (human-grade / no-accusation)
    │   ├── merkle.ts            # deterministic Merkle root (domain-separated, odd-count rule)
    │   ├── attestation.ts       # in-toto Statement shape (unsigned in this slice)
    │   ├── packet.ts            # assembleEvidencePacket + traceEvidence
    │   ├── ports.ts             # Hasher, Verifier, EvidenceRepository (+ stub TransparencyLog, ErasureService)
    │   └── index.ts
    ├── test/                    # Vitest unit + contract tests (mirror FR/SC + contracts/)
    │   ├── smoke.test.ts        # seeded smoke (SC-011) — green from iteration 1
    │   ├── golden.test.ts       # asserts the exact golden node ids + Merkle roots (SC-007/SC-008)
    │   └── fixtures/            # in-repo synthetic seed fixtures (goldenArtifact, syntheticMilestone, …)
    ├── package.json
    ├── tsconfig.json            # extends ../../tsconfig.base.json
    └── README.md
adapters/
├── evidence-hash-node/          # Node-crypto SHA-256 Hasher adapter (the only crypto import)
├── evidence-repo-memory/        # in-memory EvidenceRepository (synthetic)
└── evidence-verifier-stub/      # deterministic stub Verifier (real WASI verifier deferred, §19.2)
```

**Structure Decision**: A TS monorepo library (per PRD §26.1) with all EvidenceGraph rules quarantined in a **pure, side-effect-free `packages/evidence-graph`** domain package, mirroring `packages/learning-loop`. All I/O (hashing, verification, persistence) is injected via ports so the core is deterministic and fully unit-testable, and real crypto/verifier/store integrations replace the stubs later without changing domain code. Go/Rust services (PRD §26.2/§26.3) and a PROV serializer are **not** needed for this slice and are deferred.

**Parallel-safety**: all new code lives in `packages/evidence-graph` and `adapters/evidence-*`. The root workspace glob (`packages/*`, `adapters/*`) and the Vitest include (`packages/**/test`, `adapters/**/test`) already discover them, so **no** shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) is edited. The **only** shared-file touch is adding composite project references to the root `tsconfig.json`; that is the **final task** and is flagged as the single point a human reconciles at merge.

## Deferred scope (§19.2 pre-live gates — tracked, not built here)

| Item | §19.2 | Treatment in this slice |
|---|---|---|
| External transparency-log anchoring | D1 | `TransparencyLog` **stub port** (deterministic placeholder inclusion proof), marked non-production. |
| Verifiable-deletion / crypto-shred erasure | D2 | `ErasureService` **stub port** + tombstone shape; asserts only that retained packets stay verifiable. |
| Comparative-judgment reliability | D3 | **Out of scope**; no interface. Noted here + in the Release Threshold Registry (§33.1). |
| Conformal-triggered review calibration | D4 | **Out of scope**; no interface. |
| Cryptographic attestation signing | D6 | Attestation is the typed **in-toto shape only**; signing/key hierarchy deferred; stub verifier checks structure/digests, not signatures. |

## Complexity Tracking

None — Constitution Check passed with no violations.

---
---

# PART II — Implementation Plan: Provenance Explorer (3D "Provenance Observatory")

**Reads**: Part I (`packages/evidence-graph`), unchanged. **Spec**: [spec.md](./spec.md) Part II (§U0–§U15).

## Summary

Add a cinematic, navigable **3D "Provenance Observatory"** on top of the completed `packages/evidence-graph`
domain (PRD §19; reviewer/verifier surfaces §9.2 / §19.1). Two new units, both new-dirs-only:

- **`packages/evidence-explorer-view`** — a **pure, deterministic view-model package** that **reads**
  `@gt100k/evidence-graph` and composes a single `ExplorerView` driving every render tier: a deterministic
  **2D layout** (calm/reduced tier) **and** a deterministic **3D layout** (authored `SHELL_SLOTS` ring — no
  `Math.sin`/`cos` in the golden path), per-node/edge visual mapping (3D **body** + 2D glyph + color + label
  for all 8 node + 6 edge types), a build/time-scrub growth timeline, a verification view (re-using the
  domain's `merkleRoot`, subject-digest check, `assertHumanAuthority`, and the stub `Verifier`) + a
  deterministic `verifyWaveOrder`, camera keyframes, a **render-tier ladder** (`resolveRenderTier`), the
  accessible **Provenance Ledger**, and the golden constant registries `PALETTE`/`TYPOGRAPHY`/`MOTION`/
  `EASINGS`/`SPRINGS`/`CAMERA`/`TIERS`/`NODE_BODIES`/`EDGE_THREADS` + `resolveMotion` + `resolveRenderTier`
  + `plainViewEquals`. Pure (no I/O, no wall-clock, no `Math.random`), unit-tested with Vitest — the loop's
  testable core.
- **`apps/evidence-explorer`** — a **Next.js 14 App-Router app** rendering that view as a navigable 3D cosmos
  (**react-three-fiber + drei + three.js** scene with **bloom + depth-of-field** via
  `@react-three/postprocessing`, a deterministic seeded parallax starfield, orbit/fly-through camera, a
  time-scrub that grows the galaxy, a cinematic Verify → *Verified ✓* light-wave seal, a tamper demo that
  fractures a body — bytes only, and **frosted DOM** inspector/HUD panels animated with **`motion@^12`**),
  plus a **calm-2D** renderer (the reduced-motion / weak-GPU equal fallback) and the accessible Ledger.
  Verified by `next build` + a seeded smoke + the quickstart walkthrough.

**Guardrails (kept):** reduced-motion is a first-class **equal** mode (the calm-2D tier; every animation has
a reduced-motion equivalent via `resolveMotion`); WCAG 2.2 AA via the synchronized accessible DOM Ledger
(every canvas/decorative layer is `aria-hidden`); a **60fps budget** on the min device with graceful
auto-degradation (Cinematic 3D → Standard 3D → Calm 2D, incl. a no-WebGL fallback); no dark patterns (view
types structurally exclude leaderboard/rank/streak/countdown/urgency/…); humans issue grades (the app
computes no grade — it displays the domain's human-owned `Outcome`; a `model` actor renders only as a cited
`Assistance`/`Review` comet marked "Declared", never an accusation). Red + fracture are reserved for the
byte-level tamper demo only.

**Loop-ready:** [spec.md](./spec.md) Part II folds in a hard scope fence, ordered phasing (U0…U7),
machine-checkable success criteria (SC-E01…SC-E22) each mapped to a named test, and **pinned golden values**
(exact 2D **and** 3D layout positions, motion tokens/easings/springs, camera keyframes, tier ladder,
palette/typography, node-body/edge-thread mapping, verification-step derivation). The gate is `pnpm
typecheck` + `pnpm test` (view package) with a seeded smoke green from iteration 1; app phases add `pnpm
--filter @gt100k/evidence-explorer build` + smoke + walkthrough.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS. `tsconfig.base.json` inherited
(`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`).

**Primary Dependencies**: view package — `@gt100k/evidence-graph` (`workspace:*`) only (pure); dev-deps
`adapters/evidence-hash-node`, `adapters/evidence-verifier-stub`, `adapters/evidence-deferred`
(`workspace:*`) for verification/integration tests. App — Next.js `^14.2.15`, React `^18.3.1`,
**`motion@^12.0.0`** (`motion/react`, DOM), **`three@^0.169.0`** + **`@react-three/fiber@^8.17.10`** +
**`@react-three/drei@^9.114.0`** + **`@react-three/postprocessing@^2.16.3`** (+ `postprocessing@^6.36.4`,
3D). pnpm workspaces + Vitest + Biome + `tsc -b` (existing factory gate).

**Storage**: none — read-only over a committed synthetic fixture (in-memory).

**Testing**: Vitest (unit + contract) for the view package, matching the workspace `vitest.config.ts` globs
(`packages/**/test`); `next build` + a Playwright smoke + the quickstart walkthrough for the app.

**Target Platform**: view package = Node (pure); app = modern browsers with WebGL (client-rendered 3D
canvas), gracefully degrading to a 2D Canvas/SVG tier where WebGL is unavailable or the GPU/power budget is
tight.

**Performance Goals**: 60fps orbit/fly on the min device with a graceful tier ladder (Cinematic 3D →
Standard 3D → Calm 2D); the view package is not performance-bound (small, deterministic).

**Constraints**: pure view logic — no I/O, no wall-clock, no `Math.random`, **no `Math.sin`/`Math.cos` in
the golden layout path** (authored `SHELL_SLOTS`), no crypto re-implementation (reads the domain);
reduced-motion first-class equal (calm 2D); WCAG 2.2 AA; no external fetch (procedural 3D bodies + seeded
starfield); no secrets; no dark patterns; the app computes no grade / no accusation.

**Scale/Scope**: one synthetic milestone (13 nodes / 12 in-milestone + 1 island); tens of nodes, not
thousands (WebGL is for the *cinematic register*, not node count).

## Constitution Check

*GATE: must pass before Phase U0. Re-checked after design.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass | The app computes no grade; it displays the domain's human-owned `Outcome` seal-sun with its named owner (FR-E08). |
| IV. Evidence before authority; proof of process | ✅ Pass (core purpose) | The Explorer *is* the proof-of-process surface; declared AI-assistance is a cited comet marked "Declared", and the view model has no AI-authorship-accusation field/affordance (FR-E08/E09). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only, read-only; pseudonymous refs; consent scope displayed as a stubbed field; no PII/persistence/network. |
| VI. Accessibility & non-discrimination | ✅ Pass | WCAG 2.2 AA via the accessible Ledger; reduced-motion first-class equal (calm 2D); color-independent cues (body-shape/glyph + text); ≥4.5:1 contrast (FR-E10/E11). |
| VIII. Bounded motivational pressure | ✅ Pass | No dark patterns: view types structurally exclude leaderboard/caste-rank/bottom-rank/streak/countdown/urgency (FR-E12). |
| IX. Prohibited product behavior | ✅ Pass | No automated AI-authorship accusation is representable; a `model` output renders only as cited `Assistance`/`Review` (FR-E08/E09). |
| ENG (tests-define-done, no secrets, contracts/isolation) | ✅ Pass | View package unit-tested (Vitest) + app `next build`; no secrets/machine paths; new-dirs-only; reads the domain unchanged. |

**Result: PASS** — no violations. The one deliberate deferral (the domain's §19.2 transparency-log /
erasure / signing machinery) is **displayed** as the domain's clearly-labeled pre-live-gate stub, never
re-built here.

> **Note (process language intentionally omitted).** These planning artifacts describe **product**
> guardrails only (human-owned grades, cited assistance, WCAG, reduced-motion, the 60fps budget, no dark
> patterns). They do **not** encode any development-process / merge-gate / PR-loop language.

## Project Structure (this expansion — new dirs only)

```text
packages/
└── evidence-explorer-view/          # PURE view-model — the testable heart of the UI expansion
    ├── src/
    │   ├── model.ts                  # view types (ExplorerView, NodeView, EdgeView, CameraKeyframe, RenderTier, ...)
    │   ├── art.ts                    # PALETTE, TYPOGRAPHY (golden §U8.11)
    │   ├── motion.ts                 # MOTION, EASINGS, SPRINGS, resolveMotion (golden §U8.5)
    │   ├── visual.ts                 # NODE_BODIES, NODE_GLYPHS, EDGE_THREADS + resolvers (§U8.12/§U8.3)
    │   ├── camera.ts                 # CAMERA, PARALLAX (§U8.9)
    │   ├── tiers.ts                  # TIERS, resolveRenderTier + degrade/recover thresholds (§U8.10)
    │   ├── layout2d.ts               # layoutExplorer2D (deterministic layered §U8.1)
    │   ├── layout3d.ts               # layoutExplorer3D + SHELL_SLOTS (deterministic ring §U8.2)
    │   ├── timeline.ts               # buildGrowthTimeline (§U8.7)
    │   ├── verify.ts                 # buildVerificationView + verifyWaveOrder + applyTamper (reads domain, §U8.8)
    │   ├── ledger.ts                 # buildLedgerView (accessible parity)
    │   ├── view.ts                   # buildExplorerView + plainViewEquals
    │   ├── fixtures/explorer.fixture.ts
    │   └── index.ts
    ├── test/                         # Vitest (mirror FR/SC + contracts)
    │   ├── smoke.test.ts  layout2d.test.ts  layout3d.test.ts  view.test.ts
    │   ├── motion.test.ts  motion-tokens.test.ts  art.test.ts  visual.test.ts
    │   ├── mapping.test.ts  timeline.test.ts  camera.test.ts  tiers.test.ts
    │   ├── verify-view.test.ts  authority-view.test.ts  ledger.test.ts
    │   ├── guardrails.test.ts  integration.test.ts
    ├── package.json  tsconfig.json  README.md
apps/
└── evidence-explorer/               # Next.js 14 App Router — the only place React/DOM/R3F/three/Canvas live
    ├── app/
    │   ├── layout.tsx  page.tsx      # page.tsx mounts <ObservatoryStage/> (client; Cosmos3D via ssr:false)
    │   └── globals.css               # §U8.11 tokens + reduced-motion/reduced-transparency + focus rings
    ├── components/
    │   ├── ObservatoryStage.tsx  Cosmos3D.tsx  Constellation2D.tsx  Starfield.tsx  TimeScrub.tsx
    │   ├── Inspector.tsx  VerifyPanel.tsx  Hud.tsx  Ledger.tsx  bodies.tsx  glyphs.tsx
    ├── next.config.mjs               # transpilePackages the two workspace packages
    ├── package.json  tsconfig.json  next-env.d.ts  .env.local.example  .gitignore
```

**Structure Decision**: a pure `packages/evidence-explorer-view` (mirroring `packages/learning-loop` +
feature 004's `packages/arena-world`) quarantines every deterministic rule + golden constant (incl. the 2D
**and** 3D layout, camera keyframes, and tier ladder) so it is unit-testable under the loop gate;
`apps/evidence-explorer` (mirroring `apps/student-compass`) is the only place rendering/animation live. The
view package **reads** the completed `packages/evidence-graph` and never edits it.

**Parallel-safety**: all new code lives in `packages/evidence-explorer-view` + `apps/evidence-explorer`. The
root workspace glob (`packages/*`, `apps/*`) and the Vitest include (`packages/**/test`) already discover
them, so **no** shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`)
is edited. The **only** shared-file touch is adding a composite project reference for
`packages/evidence-explorer-view` to the root `tsconfig.json` — the **final, isolated task** (T-ROOT, §U9
U7). The root `build` script (student-compass) is not modified; the Explorer app is built via its filter.

## Reads the domain (unchanged)

| Domain API (`@gt100k/evidence-graph`) | Used for |
|---|---|
| `addNode` / `addEdge` / `assembleEvidencePacket` | building the committed synthetic fixture only |
| `merkleRoot` | re-derived in `buildVerificationView` (the merkle step + verify light-wave) |
| `assertHumanAuthority` | the human-authority verify step |
| `traceEvidence` | the "trace from Outcome" highlight |
| `Hasher` (adapters/evidence-hash-node) | node ids + Merkle re-derivation (real crypto adapter) |
| `Verifier` (adapters/evidence-verifier-stub) | the pass/fail verifier result |
| `TransparencyLog`/`ErasureService` (adapters/evidence-deferred) | the clearly-labeled `nonProduction` stub step |

## Renderer decision (see [research.md](./research.md))

**react-three-fiber + drei + three.js (3D)** primary, with **bloom + depth-of-field**
(`@react-three/postprocessing`), a deterministic **seeded parallax starfield**, and **frosted DOM** panels
(`motion@^12`) in front; **deterministic layered layout** in 2D **and** 3D (not force-directed). Chosen for
the cinematic *knowledge-cosmos* register the brief demands. The **calm-2D** renderer (SVG/Canvas2D) is a
first-class **equal** fallback (reduced-motion / weak GPU / no WebGL). `@react-spring/three` (3D) and GSAP
(DOM) are acceptable non-breaking alternatives only with a documented reason (`.loop/decisions.md`); DOM
motion is standardized on `motion@^12`.

## Complexity Tracking

None — Constitution Check passed with no violations. The second package (`evidence-explorer-view`) is
justified: it is the only way to unit-test the golden motion table, the deterministic 2D **and** 3D layout,
camera keyframes, the tier ladder, and reduced-motion parity under the existing workspace Vitest glob
without editing the shared root config. The 3D renderer is justified by the cinematic register (not node
count); determinism is preserved by the authored `SHELL_SLOTS` layout (no force sim, no `Math.sin`/`cos` in
the golden path).
