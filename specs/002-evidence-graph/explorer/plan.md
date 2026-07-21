# Implementation Plan: Provenance Explorer (EvidenceGraph UI expansion)

**Branch**: `002-evidence-graph` (UI expansion) | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-evidence-graph/explorer/spec.md`

## Summary

Add a beautiful, game-y, fully-animated **Provenance Explorer** on top of the completed
`packages/evidence-graph` domain (PRD §19; reviewer/verifier surfaces §9.2 / §19.1). Two new units, both
new-dirs-only:

- **`packages/evidence-explorer-view`** — a **pure, deterministic view-model package** that **reads**
  `@gt100k/evidence-graph` and composes a single `ExplorerView` driving every renderer: deterministic
  DAG layout, per-node/edge visual mapping (glyph + color + label for all 8 node + 6 edge types), a build
  timeline, a verification view (re-using the domain's `merkleRoot`, subject-digest check,
  `assertHumanAuthority`, and the stub `Verifier`), the accessible **Provenance Ledger**, and the golden
  constant registries `PALETTE`/`TYPOGRAPHY`/`MOTION`/`EASINGS` + `resolveMotion` + `plainViewEquals`.
  Pure (no I/O, no wall-clock, no `Math.random`), unit-tested with Vitest — the loop's testable core.
- **`apps/evidence-explorer`** — a **Next.js 14 App-Router app** rendering that view as an interactive
  provenance constellation (deterministic Canvas starfield + SVG/`framer-motion` graph + frosted DOM
  panels + the accessible Ledger): pan/zoom/expand with momentum, an animated build timeline, a
  satisfying Verify → *Verified ✓* seal, a tamper demo that visibly fails, and drill-down inspector
  panels where declared AI-assistance is shown as cited evidence — never an accusation. Verified by
  `next build` + a seeded smoke + the quickstart walkthrough.

**Guardrails (kept):** reduced-motion is a first-class **equal** mode (every animation has a
reduced-motion equivalent via `resolveMotion`); WCAG 2.2 AA via the synchronized accessible DOM Ledger
(the SVG/Canvas are `aria-hidden`); no dark patterns (view types structurally exclude
leaderboard/rank/streak/countdown/urgency/…); humans issue grades (the app computes no grade — it
displays the domain's human-owned `Outcome`; a `model` actor renders only as cited `Assistance`/`Review`,
never an accusation). Red + a brief shake are reserved for the byte-level tamper demo only.

**Loop-ready:** [spec.md](./spec.md) folds in a hard scope fence, ordered phasing (P0…P6),
machine-checkable success criteria (SC-E01…SC-E15) each mapped to a named test, and **pinned golden
values** (exact layout positions, motion tokens/easings, palette/typography, verification-step
derivation) that are the loop's acceptance targets. The gate is `pnpm typecheck` + `pnpm test` (view
package) with a seeded smoke green from iteration 1; app phases add `pnpm --filter
@gt100k/evidence-explorer build` + smoke + walkthrough.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js LTS. `tsconfig.base.json` inherited
(`noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `composite`).

**Primary Dependencies**: view package — `@gt100k/evidence-graph` (`workspace:*`) only (pure);
dev-deps `adapters/evidence-hash-node`, `adapters/evidence-verifier-stub`, `adapters/evidence-deferred`
(`workspace:*`) for verification/integration tests. App — Next.js `^14.2.15`, React `^18.3.1`,
`framer-motion@^11.11.0`. pnpm workspaces + Vitest + Biome + `tsc -b` (existing factory gate).

**Storage**: none — read-only over a committed synthetic fixture (in-memory).

**Testing**: Vitest (unit + contract) for the view package, matching the workspace `vitest.config.ts`
globs (`packages/**/test`); `next build` + a Playwright smoke + the quickstart walkthrough for the app.

**Target Platform**: view package = Node (pure); app = modern browsers (client-rendered constellation).

**Project Type**: TS monorepo — a `packages/` view library + an `apps/` Next.js app. Reads the completed
`packages/evidence-graph`.

**Performance Goals**: 60fps pan/zoom on the min device with a graceful degraded tier (starfield + glow
off); the view package is not performance-bound (small, deterministic).

**Constraints**: pure view logic — no I/O, no wall-clock, no `Math.random`, no crypto re-implementation
(reads the domain); reduced-motion first-class equal; WCAG 2.2 AA; no external fetch; no secrets; no dark
patterns; the app computes no grade / no accusation.

**Scale/Scope**: one synthetic milestone (13 nodes / 12 in-milestone + 1 island); tens of nodes, not
thousands (justifies SVG over WebGL, §research).

## Constitution Check

*GATE: must pass before Phase 0. Re-checked after design.*

| Principle | Status | Note |
|---|---|---|
| I. Human authority over consequential decisions | ✅ Pass | The app computes no grade; it displays the domain's human-owned `Outcome` with its named owner (FR-E08). |
| IV. Evidence before authority; proof of process | ✅ Pass (core purpose) | The Explorer *is* the proof-of-process surface; declared AI-assistance is shown as cited evidence, and the view model has no AI-authorship-accusation field/affordance (FR-E08/E09). |
| V. Privacy follows purpose | ✅ Pass | Synthetic-only, read-only; pseudonymous refs; consent scope displayed as a stubbed field; no PII/persistence/network. |
| VI. Accessibility & non-discrimination | ✅ Pass | WCAG 2.2 AA via the accessible Ledger; reduced-motion first-class equal; color-independent cues; ≥4.5:1 contrast (FR-E10/E11). |
| VIII. Bounded motivational pressure | ✅ Pass | No dark patterns: view types structurally exclude leaderboard/caste-rank/bottom-rank/streak/countdown/urgency (FR-E12). |
| IX. Prohibited product behavior | ✅ Pass | No automated AI-authorship accusation is representable; a `model` output renders only as cited `Assistance`/`Review` (FR-E08/E09). |
| ENG (tests-define-done, no secrets, contracts/isolation) | ✅ Pass | View package unit-tested (Vitest) + app `next build`; no secrets/machine paths; new-dirs-only; reads the domain unchanged. |

**Result: PASS** — no violations. The one deliberate deferral (the domain's §19.2 transparency-log /
erasure / signing machinery) is **displayed** as the domain's clearly-labeled pre-live-gate stub, never
re-built here.

> **Note (process language intentionally omitted).** These planning artifacts describe **product**
> guardrails only (human-owned grades, cited assistance, WCAG, reduced-motion, no dark patterns). They do
> **not** encode any development-process/merge-gate/PR-loop language.

## Project Structure

### Documentation (this expansion)

```text
specs/002-evidence-graph/explorer/
├── spec.md              # the loop source-of-truth (§0–§14)
├── plan.md              # this file
├── research.md          # decisions (renderer, layout, verification, art direction)
├── data-model.md        # view-model types
├── contracts/
│   └── provenance-explorer.md   # view-package interface + app rendering obligations
├── checklists/
│   └── requirements.md  # spec quality + loop-readiness checklist
├── quickstart.md        # run/validation guide
└── tasks.md             # ordered P0…P6 tasks
```

### Source Code (repository root — new dirs only)

```text
packages/
└── evidence-explorer-view/          # PURE view-model — the testable heart of the UI expansion
    ├── src/
    │   ├── model.ts                  # view types (ExplorerView, NodeView, EdgeView, ActorChip, ...)
    │   ├── art.ts                    # PALETTE, TYPOGRAPHY (golden §8.6)
    │   ├── motion.ts                 # MOTION, EASINGS, SPRINGS, resolveMotion (golden §8.5)
    │   ├── visual.ts                 # NODE_GLYPHS, EDGE_STYLES, resolveNodeGlyph/ColorRole (§8.7/§8.2)
    │   ├── camera.ts                 # CAMERA, PARALLAX (§8.8)
    │   ├── layout.ts                 # layoutExplorer (deterministic layered §8.1)
    │   ├── timeline.ts               # buildTimelineView (§8.3)
    │   ├── verify.ts                 # buildVerificationView + applyTamper (reads the domain, §8.4)
    │   ├── ledger.ts                 # buildLedgerView (accessible parity)
    │   ├── view.ts                   # buildExplorerView + plainViewEquals
    │   └── index.ts
    ├── test/                         # Vitest (mirror FR/SC + contracts)
    │   ├── smoke.test.ts             # seeded smoke (SC-E15) — green from iteration 1
    │   ├── layout.test.ts  view.test.ts  motion.test.ts  motion-tokens.test.ts
    │   ├── art.test.ts  visual.test.ts  mapping.test.ts  timeline.test.ts
    │   ├── verify-view.test.ts  authority-view.test.ts  ledger.test.ts
    │   ├── guardrails.test.ts  integration.test.ts
    │   └── fixtures/                 # (fixture lives in src/fixtures/explorer.fixture.ts)
    ├── package.json  tsconfig.json  README.md
apps/
└── evidence-explorer/               # Next.js 14 App Router — the only place React/DOM/SVG/Canvas live
    ├── app/
    │   ├── layout.tsx  page.tsx      # page.tsx mounts <ObservatoryStage/> (client)
    │   └── globals.css               # §8.6 tokens + reduced-motion/reduced-transparency + focus rings
    ├── components/
    │   ├── ObservatoryStage.tsx  Constellation.tsx  Starfield.tsx  Timeline.tsx
    │   ├── Inspector.tsx  VerifyPanel.tsx  Hud.tsx  Ledger.tsx  glyphs.tsx
    ├── next.config.mjs               # transpilePackages the two workspace packages
    ├── package.json  tsconfig.json  next-env.d.ts  .env.local.example  .gitignore
```

**Structure Decision**: a pure `packages/evidence-explorer-view` (mirroring `packages/learning-loop` +
`packages/arena-world` from feature 004) quarantines every deterministic rule + golden constant so it is
unit-testable under the loop gate; `apps/evidence-explorer` (mirroring `apps/student-compass`) is the
only place rendering/animation live. The view package **reads** the completed `packages/evidence-graph`
and never edits it. This keeps every guardrail deterministically testable and the build parallel-safe.

**Parallel-safety**: all new code lives in `packages/evidence-explorer-view` + `apps/evidence-explorer`.
The root workspace glob (`packages/*`, `apps/*`) and the Vitest include (`packages/**/test`) already
discover them, so **no** shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`,
`biome.json`) is edited. The **only** shared-file touch is adding composite project references for
`packages/evidence-explorer-view` to the root `tsconfig.json` — the **final, isolated task** (T-ROOT),
kept as its own change. The root `build` script (student-compass) is not modified; the Explorer app is
built via its filter.

## Reads the domain (unchanged)

| Domain API (`@gt100k/evidence-graph`) | Used for |
|---|---|
| `addNode` / `addEdge` / `assembleEvidencePacket` | building the committed synthetic fixture only |
| `merkleRoot` | re-derived in `buildVerificationView` (the merkle step) |
| `assertHumanAuthority` | the human-authority verify step |
| `traceEvidence` | the "trace from Outcome" highlight |
| `Hasher` (adapters/evidence-hash-node) | node ids + Merkle re-derivation (real crypto adapter) |
| `Verifier` (adapters/evidence-verifier-stub) | the pass/fail verifier result |
| `TransparencyLog`/`ErasureService` (adapters/evidence-deferred) | the clearly-labeled `nonProduction` stub step |

## Renderer decision (see research.md)

**SVG + `framer-motion`** primary, with a deterministic **Canvas starfield** behind and **frosted DOM**
panels in front; **deterministic layered layout** (not force-directed). Best-looking *and* most
accessible for a tens-of-nodes provenance DAG; crisp at any zoom; GPU-friendly transforms; spring
physics; `useReducedMotion`; SVG-filter glow/bloom. A Canvas/WebGL (Pixi) layer for very large graphs and
GSAP are acceptable non-breaking alternatives only with a documented reason (`.loop/decisions.md`).

## Complexity Tracking

None — Constitution Check passed with no violations. The second package (`evidence-explorer-view`) is
justified: it is the only way to unit-test the golden motion table + deterministic layout + reduced-motion
parity under the existing workspace Vitest glob without editing the shared root config.
