# Specification Quality Checklist: Provenance Explorer (EvidenceGraph UI expansion)

**Purpose**: Validate spec completeness/quality + loop-readiness before building.
**Created**: 2026-07-20
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Focused on user value (an interactive, trustworthy provenance surface — PRD §19 / §9.2 reviewer/verifier)
- [x] All mandatory sections completed (scope, scenarios, requirements, SCs, golden values, phasing)
- [x] Reads the completed `002-evidence-graph` domain; does not modify it
- [x] No development-process / merge-gate / PR-loop language (product guardrails only)

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements (FR-E01…FR-E18) are testable and unambiguous
- [x] Success criteria (SC-E01…SC-E15) are measurable, each mapped to a named test
- [x] All acceptance scenarios defined (US1…US6)
- [x] Edge cases identified (determinism, reduced-motion/accessible parity, color-independence, tamper
      framing, no-accusation, human-owned grade, island, empty graph, no-fetch)
- [x] Scope clearly bounded (in / out / non-goals)
- [x] Dependencies + assumptions identified (§14)

## Feature Readiness

- [x] Every FR has clear acceptance criteria + SC coverage
- [x] User scenarios cover the primary flows (constellation, timeline, verify+tamper, drill-down, HUD/
      trace/plain, a11y)
- [x] Golden values cover the computed parts (layout, motion tokens/easings, palette/typography,
      verification derivation)

## Constitution Alignment (GT100K)

- [x] Human authority: the app computes **no** grade; it displays the domain's human-owned `Outcome`
      with its named owner (FR-E08; Constitution I/IV)
- [x] No automated AI-authorship accusation is representable; a `model` output renders only as cited
      `Assistance`/`Review` (FR-E08/E09; Constitution IX; PRD §4.7/§19)
- [x] Privacy/synthetic-only: no real PII/consent/admissions; read-only over a committed synthetic
      fixture (FR-E15; Constitution V)
- [x] Accessibility: WCAG 2.2 AA via the accessible Ledger; reduced-motion first-class **equal** mode;
      color-independent cues; ≥4.5:1 contrast (FR-E10/E11; Constitution VI; PRD §9.3/§22)
- [x] No dark patterns: view types structurally exclude leaderboard/caste-rank/bottom-rank/streak/
      countdown/urgency (FR-E12; Constitution VIII)
- [x] Reads the domain unchanged; no crypto re-implementation (FR-E05; the domain is the arbiter)

## Art Direction & Motion (skills applied)

- [x] Full art direction with exact palette hex, typography, mood (§5.1 / §8.6) — a deliberate anti-slop
      "Provenance Observatory" register (impeccable), distinct from feature 004
- [x] Master **motion table** (§5.6): event → named effect → easing → duration token → reduced-motion
      equivalent, every row with a reduced equivalent
- [x] Motion durations/easings pinned as **testable golden constants** (`MOTION`/`EASINGS`/`resolveMotion`,
      §8.5, SC-E04)
- [x] Apple fluid-motion (interruptible, velocity-aware, momentum projection), Emil frequency rule +
      strong ease-out + never `scale(0)`, and reduced-motion equivalence baked into `resolveMotion`
- [x] Color is never the sole cue (glyph + stroke + text for every node/edge type; §8.7, FR-E04)

## Scope & Isolation

- [x] All feature code in new dirs (`packages/evidence-explorer-view`, `apps/evidence-explorer`)
- [x] `packages/evidence-graph`, its adapters, `packages/learning-loop`, `apps/student-compass` untouched
- [x] No shared root file (`package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, `biome.json`)
      edited (existing globs discover the new dirs)
- [x] The single shared-file touch (root `tsconfig.json` references) is the final, isolated task (T049)

## Loop-Readiness (folds in the [loop-ready checklist](../../../../gt100k-factory/docs/loop-ready-prd.md))

- [x] **Scope fence**: explicit in-scope / out-of-scope / non-goals (§1)
- [x] **Phasing P0…P6**: ordered build path incl. a UI phase set with per-phase gates + navigable headers
- [x] **Acceptance = tests**: SC-E01…SC-E15, each mapped to a named test file
- [x] **Golden values + tolerances**: exact layout, motion tokens/easings, palette/typography,
      verification derivation; tolerance = exact (zero) for view values; UX targets stated
- [x] **Decisions already made** (§2 D1–D8): architecture, one-view parity, renderer, reads-the-domain,
      accessible Ledger, art direction, view types, stack
- [x] **Defaults for the unspecified**: the catch-all rule recorded verbatim (§3)
- [x] **Stack + commands pinned** (§11): pnpm; `tsc -b` / Vitest / Biome / `next build`; framer-motion;
      seeded smoke (SC-E15)
- [x] **Seed fixture in-repo** (§7, committed synthetic "speaker-v1"); **env/secrets** handled (§11,
      `.env.local.example`); **pre-marked decision points** with severity (§13)

## Notes

- **Reads, never re-implements**: verification is derived by re-using the domain's `merkleRoot`,
  subject-digest check, `assertHumanAuthority`, and the stub `Verifier`; the app computes no crypto and
  no grade (D4/FR-E05/E06).
- **Second package justified**: `evidence-explorer-view` is the only way to unit-test the golden motion
  table + deterministic layout + reduced-motion parity under the existing workspace Vitest glob without
  editing the shared root config.
- **Deferred §19.2 machinery is displayed, not built**: the transparency-log inclusion step is surfaced
  as the domain's clearly-labeled `nonProduction` stub and never blocks the seal.
