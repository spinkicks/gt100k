# UI Quality Checklist: Cohort & Arena Viewer (guide/ops)

**Purpose**: Validate the UI expansion (P7–P11) before/while building the Cohort & Arena Viewer.
**Feature**: [spec.md](../spec.md) · **Contract**: [contracts/cohort-arena-view.md](../contracts/cohort-arena-view.md)

## Content Quality

- [x] UI requirements focus on user value (a guide/ops-facing surface that makes the compile *legible* and its guarantees *visible*), not implementation detail
- [x] The Viewer is scoped as a **guide/ops** observation surface (PRD §9.2), explicitly distinct from the child-facing Arena game world (feature 004)
- [x] Written so a non-technical reviewer can follow the user stories (US4 constellation, US5 standings, US6 RivalryMix) + acceptance scenarios

## Requirement Completeness

- [x] No `[NEEDS CLARIFICATION]` markers remain in the UI sections
- [x] UI requirements (FR-028…FR-046) are testable and unambiguous
- [x] UI success criteria (SC-009…SC-018) are measurable and each maps to a concrete test file or `next build`+smoke+walkthrough
- [x] UI edge cases identified (empty/single-cohort, unassigned rendering, reduced-motion parity, accessible parity, color-independence, standings floor, RivalryMix low-quality, safeguarding during viewing, WebGL context loss, no-network build)
- [x] UI scope bounded (a pure view package + a Next.js app; no live media/network/child-facing controls)

## Constitution Alignment (GT100K) — UI

- [x] **No fixed-ability caste ranks / no bottom-rank** (G6): `StandingsView` structurally cannot carry `rank`/`position`/`percentile`/`outOf`; opt-in (default off), near-peer, anonymized, gain-based, sprint-reset (FR-035; SC-012/SC-017)
- [x] **No emotion/honesty/personality/motivation label** in RivalryMix: `ArenaRoomView` structurally cannot carry such a field; low-quality → suppression veil, never a false label (FR-037; SC-013)
- [x] **Safeguarding bypass is visible + inert to optimization**: a `CohortHealthEvent` renders a firm-not-alarm banner, pauses conflicting moves (POL-007), routes to the safeguarding lane, and never mutates a standing/rating/objective (FR-038; SC-016)
- [x] **No dark patterns** (§14.12): no loss/decay/streak, FOMO, gacha/loot, purchase/currency, or engagement-timer; an unassigned learner is a calm state, not a punishment (FR-043; SC-017)
- [x] **Reduced motion is a first-class equal mode** and **WCAG 2.2 AA** via the accessible Cohort Ledger (canvas `aria-hidden`, keyboard/switch/screen-reader, color-independent, ≥4.5:1 contrast) (FR-039/FR-040/FR-045; SC-014/SC-015/SC-018)
- [x] **Human authority unchanged**: the Viewer observes; it issues no consequential decision (FR-046; Constitution I). The bounded-automation envelope stays in the domain (FR-017)
- [x] **Privacy/synthetic-only**: pseudonymous refs, no PII/media/network; app fetches nothing; peers anonymized (FR-042; Constitution V)

## No process language (deliberate)

- [x] The UI docs contain **no** "human review before merge / PR-only build loop" process language; guardrails are expressed as product/rights invariants and testable criteria, not workflow gates

## Loop-Readiness (UI)

- [x] **Scope fence** — UI in-scope items 9–11 + UI non-goals ([spec.md § Scope Fence](../spec.md#scope-fence))
- [x] **Phasing (P7…P11)** — ordered, gated, mapped to SCs + fixtures ([spec.md § Phasing](../spec.md#phasing-p0p11))
- [x] **Acceptance criteria = tests** — SC-009…SC-018 each mapped to a Vitest file or `next build`+smoke+walkthrough
- [x] **Golden values + tolerances** — Fixtures V1–V4: exact constellation/arena-ring positions, exact motion table, standings `gainToBandTop`, rivalry suppression ([spec.md § UI Golden Values](../spec.md#ui-golden-values--constants))
- [x] **Decisions already made** — D-UI-1…D-UI-7 (rendering split, pure view package, one-view-drives-all, accessible Ledger, structural guardrails, art direction, verification) ([spec.md § UI Decisions](../spec.md#ui-decisions-already-made))
- [x] **Defaults for the unspecified** — the same repo-wide rule applies; UI DPs pre-mark real judgments (DP-UI-1…DP-UI-7)
- [x] **Stack + commands pinned** — `@gt100k/cohort-arena-view` (Vitest) + `@gt100k/cohort-arena` (Next `^14.2.15`, React `^18.3.1`, Pixi.js `^8.19.0`, motion `^12.42.0`); `pnpm --filter … build` + seeded app smoke ([spec.md § UI stack & commands](../spec.md#ui-stack--commands-p7p11))
- [x] **Seed assets in-repo** — inline SVG + procedural fallback under `apps/cohort-arena/public/seed/`; no external fetch
- [x] **Navigable structure** — per-phase headers + cross-links so the loop reads one section per turn
- [x] **Pre-marked decision points** — DP-UI-1…DP-UI-7 with defaults + severity
- [x] **Env/secrets handled** — `apps/cohort-arena/.env.local.example` with `NEXT_PUBLIC_*` placeholders; `next build` never fails on missing env

## Parallel-Safety (merge hygiene) — UI

- [x] All UI code lives in **new** dirs (`packages/cohort-arena-view`, `apps/cohort-arena`)
- [x] No shared root file needs editing — existing `packages/*`/`apps/*` globs, `packages/**/test` Vitest include, and `biome check packages adapters apps` already discover the new dirs
- [x] The single shared-file touch (root `tsconfig.json` references incl. `packages/cohort-arena-view`) is isolated as the **final** task **T136** and flagged for human reconciliation (DP-UI-7)
- [x] The domain package `packages/cohort-compiler`, its adapters, and `apps/student-compass` are **not** modified

## Notes

- **One view drives all**: the Pixi canvas, the DOM/Framer-Motion HUD, and the accessible Cohort Ledger all render from one `CohortArenaView`; reduced-motion/plain/age-band change only presentation (`plainViewEquals`) — parity by construction.
- **Guardrails are structural**: the view types cannot represent a caste/bottom-rank or an emotion/trait label; a `guardrails.test.ts` scan enforces no `Math.random` and no forbidden fields/constructs.
- **App verified by `next build`**: frame-rate/60fps is an acceptance target validated by the build + walkthrough, not a unit test (the pure view carries no rendering).
