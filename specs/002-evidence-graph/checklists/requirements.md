# Specification Quality Checklist: EvidenceGraph

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)

> **One spec home.** **Part I** below is the domain checklist. **Part II** (folded in from the former
> `explorer/checklists/requirements.md`) is the **Provenance Explorer** 3D-UI checklist. See
> [spec.md](../spec.md) Part I / Part II.

---

# PART I — Domain checklist (`packages/evidence-graph`)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Constitution Alignment (GT100K)

- [x] Human authority: every final grade/`Outcome` is human-owned; no model owns a grade (FR-008; Constitution I/IV)
- [x] No automated AI-authorship accusation is representable (FR-009; Constitution IX; PRD §4.7)
- [x] Model output is admissible only as a cited `Assistance`/`Review` node (FR-009; PRD §19)
- [x] Privacy/synthetic-only: no real PII/consent/admissions; consent scope is a stubbed field (FR-018; Constitution V)
- [x] No SHA-1/MD5; hashing behind a port (FR-007; PRD §19)

## Scope & Deferral Discipline (PRD §19.2)

- [x] Genuinely-hard parts deferred as **marked stubs / out-of-scope**, not silently omitted: transparency-log anchoring (D1), crypto-shred erasure (D2), comparative-judgment reliability (D3), conformal calibration (D4), attestation signing (D6)
- [x] Deferrals are pre-live gates that do not block the synthetic-beta slice (PRD §19.2/§32.4)
- [x] MVP is explicitly called out (Setup + Foundational + US1)

## Parallel-Safety (merge hygiene)

- [x] All feature code lives in new dirs (`packages/evidence-graph`, `adapters/evidence-*`)
- [x] No shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) requires editing (existing globs discover the new dirs)
- [x] The single shared-file touch (root `tsconfig.json` references) is isolated as the final task and flagged for human reconciliation

## Loop-Readiness (spec.md folds in the [loop-ready checklist](../../../../gt100k-factory/docs/loop-ready-prd.md))

- [x] **Scope fence**: explicit in-scope / out-of-scope (marked stubs) / non-goals (no interface).
- [x] **Phasing P0…P4**: ordered build path with per-phase SC coverage and navigable headers.
- [x] **Acceptance criteria = tests**: SC-001…SC-012, each mapped to a named test file + assertion.
- [x] **Golden values + tolerances**: exact SHA-256 node ids (idA `facecf25…`) and Merkle roots (3-leaf `dd67a4e9…`, packet `3c7f4d3c…`); tolerance = exact `===` (zero).
- [x] **Decisions already made**: SHA-256, RFC 8785 JCS canonicalization, RFC-6962 raw-byte Merkle scheme, port shapes.
- [x] **Defaults for the unspecified**: the catch-all rule recorded verbatim.
- [x] **Stack + commands pinned**: pnpm; `tsc -b` / `vitest` / `biome`; seeded smoke test (SC-011).
- [x] **Seed fixtures in-repo**; **env/secrets** note (none needed); **pre-marked decision defaults** with severity.

## Notes

- **PROV extension, not exporter**: this slice encodes the PROV `Entity`/`Activity`/`Agent` mapping (data-model.md) but does not ship a PROV/RO-Crate serializer — deferred (PRD §19, STD-03/STD-04).
- **in-toto shape, not signed**: the attestation is the typed in-toto Statement shape; cryptographic signing and the attestor key hierarchy are deferred (§19.2 D6). The stub verifier checks structure, subject digests, and Merkle re-derivation only.
- **Milestone membership is an input**: which nodes belong to a packet is a caller-supplied selection (external `MilestoneContract`, PRD §28); this feature owns assembly/attestation/verification, not the milestone workflow.
- **Canonical serialization (resolved)**: pinned to **RFC 8785 (JCS)** over the hashed field subset with optional-field omission; the exact golden canonical bytes are in spec.md **Golden Values**, so any conformant encoder reproduces the golden ids (FR-004/FR-020). Formerly an open question — now closed by the golden fixtures.

---
---

# PART II — Provenance Explorer checklist (3D "Provenance Observatory")

**Feature**: [spec.md](../spec.md) Part II (§U0–§U15)

## Content Quality

- [x] Focused on user value (a cinematic, trustworthy provenance surface — PRD §19 / §9.2 reviewer/verifier)
- [x] All mandatory sections completed (scope, scenarios, requirements, SCs, golden values, phasing, art
      direction, motion table)
- [x] Reads the completed Part I domain; does not modify it
- [x] No development-process / merge-gate / PR-loop language (product guardrails only, §U15)

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements (FR-E01…FR-E20) are testable and unambiguous
- [x] Success criteria (SC-E01…SC-E22) are measurable, each mapped to a named test
- [x] All acceptance scenarios defined (UX1…UX6)
- [x] Edge cases identified (determinism, reduced-motion/accessible parity, color-independence, no-WebGL/
      context-loss fallback, tamper framing, no-accusation, human-owned grade, island, empty graph, no-fetch)
- [x] Scope clearly bounded (in / out / non-goals, §U1)
- [x] Dependencies + assumptions identified (§U14)

## Feature Readiness

- [x] Every FR has clear acceptance criteria + SC coverage
- [x] User scenarios cover the primary flows (3D constellation, time-scrub, verify+tamper, drill-down,
      HUD/trace/plain/tier, a11y/perf)
- [x] Golden values cover the computed parts (2D **and** 3D layout, motion tokens/easings/springs, camera
      keyframes, tier ladder, palette/typography, node-body/edge-thread mapping, verification derivation)

## Constitution Alignment (GT100K)

- [x] Human authority: the app computes **no** grade; it displays the domain's human-owned `Outcome`
      seal-sun with its named owner (FR-E08; Constitution I/IV)
- [x] No automated AI-authorship accusation is representable; a `model` output renders only as a cited
      `Assistance`/`Review` comet marked "Declared" (FR-E08/E09; Constitution IX; PRD §4.7/§19)
- [x] Privacy/synthetic-only: no real PII/consent/admissions; read-only over a committed synthetic fixture
      (FR-E16; Constitution V)
- [x] Accessibility: WCAG 2.2 AA via the accessible Ledger; reduced-motion first-class **equal** mode (calm
      2D); color-independent cues; ≥4.5:1 contrast (FR-E10/E11; Constitution VI; PRD §9.3/§22)
- [x] No dark patterns: view types structurally exclude leaderboard/caste-rank/bottom-rank/streak/countdown/
      urgency (FR-E12; Constitution VIII)
- [x] Reads the domain unchanged; no crypto re-implementation (FR-E05; the domain is the arbiter)

## Art Direction & Motion (skills applied)

- [x] Full art direction with exact palette hex, typography, mood, 3D node bodies + edge threads, bloom/DOF
      atmosphere (§U5.1 / §U8.11/§U8.12/§U8.13) — a deliberate anti-slop "Provenance Observatory" register
      (impeccable), distinct from feature 004 and the 2026 SaaS-cream default
- [x] Master **motion table** (§U5.6): event → named effect → engine → easing/spring → duration token →
      reduced-motion / calm-2D equivalent, **every** row (incl. all 3D events) with a reduced equivalent
- [x] Motion durations/easings/springs + **camera keyframes** pinned as **testable golden constants**
      (`MOTION`/`EASINGS`/`SPRINGS`/`CAMERA`/`resolveMotion`, §U8.5/§U8.9, SC-E04/E17)
- [x] Apple fluid-motion (interruptible, velocity-aware orbit/fly, momentum), Emil frequency rule + strong
      ease-out (ease-out-expo, no bounce) + never `scale(0)`, animation-vocabulary named effects, and
      reduced-motion equivalence baked into `resolveMotion`
- [x] Color is never the sole cue (3D body-shape + 2D glyph + thread + text for every node/edge type; §U8.12,
      FR-E04)

## 3D Renderer, Performance & Fallback (the ambitious layer)

- [x] Renderer pinned: react-three-fiber + drei + three.js + `@react-three/postprocessing` (bloom/DOF);
      deterministic seeded parallax starfield; DOM motion `motion@^12` (§U2 D3/D8, §U11)
- [x] **Deterministic 3D layout** via authored `SHELL_SLOTS` (no `Math.sin`/`cos` in the golden path);
      golden 3D positions pinned (§U8.2, SC-E16)
- [x] **60fps budget** on the min device with a golden **render-tier ladder** (`resolveRenderTier`) auto-
      degrading Cinematic 3D → Standard 3D → Calm 2D, incl. no-WebGL/context-loss fallback (§U8.10, SC-E18/
      E21/E22)
- [x] Reduced-motion is rendered as the **calm 2D** equal tier (same state; motion stripped), not a lesser
      fallback (FR-E10, SC-E03)

## Scope & Isolation

- [x] All feature code in new dirs (`packages/evidence-explorer-view`, `apps/evidence-explorer`)
- [x] `packages/evidence-graph`, its adapters, `packages/learning-loop`, `apps/student-compass` untouched
- [x] No shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`) edited
- [x] The single shared-file touch (root `tsconfig.json` references) is the final, isolated task (UE050)

## Loop-Readiness (folds in the [loop-ready checklist](../../../../gt100k-factory/docs/loop-ready-prd.md))

- [x] **Scope fence**: explicit in-scope / out-of-scope / non-goals (§U1)
- [x] **Phasing U0…U7**: ordered build path incl. the 3D UI phases with per-phase gates + navigable headers
- [x] **Acceptance = tests**: SC-E01…SC-E22, each mapped to a named test file
- [x] **Golden values + tolerances**: exact 2D + 3D layout, motion tokens/easings/springs, camera keyframes,
      tier ladder, palette/typography, verification derivation; tolerance = exact (0) for ints/strings, ±1e-6
      for 3D positions
- [x] **Decisions already made** (§U2 D1–D8): architecture, one-view parity, 3D renderer + calm-2D fallback,
      reads-the-domain, accessible Ledger, art direction, view types, stack (`motion@^12` + R3F)
- [x] **Defaults for the unspecified**: the catch-all rule recorded verbatim (§U3)
- [x] **Stack + commands pinned** (§U11): pnpm; `tsc -b` / Vitest / Biome / `next build`; `motion@^12` +
      three/R3F/drei/postprocessing; seeded smoke (SC-E15)
- [x] **Seed fixture in-repo** (§U7, committed synthetic "speaker-v1"); **env/secrets** handled (§U11,
      `.env.local.example`); **pre-marked decision points** with severity (§U13)

## Notes

- **Reads, never re-implements**: verification (+ the verify light-wave order) is derived by re-using the
  domain's `merkleRoot`, subject-digest check, `assertHumanAuthority`, and the stub `Verifier`; the app
  computes no crypto and no grade (D4/FR-E05/E06).
- **Second package justified**: `evidence-explorer-view` is the only way to unit-test the golden motion
  table, the deterministic 2D **and** 3D layout, camera keyframes, and the tier ladder under the existing
  workspace Vitest glob without editing the shared root config.
- **3D without non-determinism**: the cinematic look is a styling + camera layer over a deterministic
  lattice; the golden layout path uses an authored `SHELL_SLOTS` unit table (no force sim, no `Math.sin`/
  `cos`), so positions are byte-reproducible (±1e-6).
- **Deferred §19.2 machinery is displayed, not built**: the transparency-log inclusion step is surfaced as
  the domain's clearly-labeled `nonProduction` stub and never blocks the seal.
