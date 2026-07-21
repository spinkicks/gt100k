# Tasks: Provenance Explorer (EvidenceGraph UI expansion)

**Input**: Design documents from `specs/002-evidence-graph/explorer/`
**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/provenance-explorer.md,
quickstart.md. The completed `packages/evidence-graph` domain (parent [../spec.md](../spec.md)) is
available and **unchanged** — this expansion reads it.
**Tests**: INCLUDED — tests are part of "done"; `contracts/provenance-explorer.md` defines the test
obligations. Write view-package tests first; ensure they fail before implementing.

**Loop gate**: `pnpm typecheck` (`tsc -b`) + `pnpm test` (Vitest, view package). App phases add
`pnpm --filter @gt100k/evidence-explorer build` + the §11 smoke + the quickstart walkthrough. Phases map
to **§9 Phasing** of [spec.md](./spec.md): **P0** setup/foundation (T001–T010), **P1** constellation MVP
(T011–T020), **P2** timeline (T021–T024), **P3** verify + tamper (T025–T031), **P4** inspector +
authority/cited-assist (T032–T037), **P5** HUD/legend/filters/trace/plain (T038–T043), **P6** polish/a11y/
perf + T-ROOT (T044–T049).

**Golden values (deterministic acceptance targets)**: exact layout positions (§8.1), the `resolveMotion`
table + `MOTION`/`EASINGS` (§8.5), `PALETTE`/`TYPOGRAPHY` (§8.6), `NODE_GLYPHS`/`EDGE_STYLES` (§8.7),
verification-step derivation (§8.4). Match the spec; the spec is the arbiter.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no incomplete-task dependency)
- **[Story]**: US1…US6 (setup/foundation/polish carry no story label)

## Path conventions

- View package: `packages/evidence-explorer-view/src/`, tests `packages/evidence-explorer-view/test/`
- App: `apps/evidence-explorer/`

## Parallel-safety note (read before starting)

All work lives in **new** directories (`packages/evidence-explorer-view`, `apps/evidence-explorer`). The
root workspace glob (`packages/*`, `apps/*`) and the Vitest include (`packages/**/test`) already discover
them, so **do NOT edit** `package.json`, `pnpm-workspace.yaml`, `vitest.config.ts`, or `biome.json` at the
repo root, and **do NOT modify** `packages/evidence-graph`, its adapters, `packages/learning-loop`, or
`apps/student-compass`. The **only** shared-file edit is the final task (T049, root `tsconfig.json`
references), kept as its own isolated change.

---

## Phase P0 — Setup & Foundation (new dirs only)

- [ ] T001 Scaffold `@gt100k/evidence-explorer-view`: `packages/evidence-explorer-view/package.json`
  (name, `type:module`, `exports`/`main`/`types` → `./src/index.ts`, `test:"vitest run"`, dep
  `@gt100k/evidence-graph:workspace:*`, dev-deps `@gt100k/evidence-hash-node`,
  `@gt100k/evidence-verifier-stub`, `@gt100k/evidence-deferred` `workspace:*`), `tsconfig.json` (extends
  `../../tsconfig.base.json`, `rootDir:"."`, include `src`/`test`), empty `src/index.ts`. No shared-root edit.
- [ ] T002 [P] Define view types in `src/model.ts` per [data-model.md](./data-model.md) (`ExplorerView`,
  `NodeView`, `EdgeView`, `ActorChip`, `TimelineView`/`TimelineBeat`, `VerificationView`/`VerifyStep`,
  `SealState`, `LedgerView`/`LedgerNode`, `MotionSpec`, `Presentation`, `NodeGlyph`, `EdgeStrokeStyle`).
  Import domain types from `@gt100k/evidence-graph` (never redefine).
- [ ] T003 [P] Golden art tokens in `src/art.ts`: `PALETTE` + `TYPOGRAPHY` (exact §8.6).
- [ ] T004 [P] Golden motion in `src/motion.ts`: `MOTION`, `EASINGS`, `SPRINGS`, `resolveMotion` (exact §8.5).
- [ ] T005 [P] Golden visual language in `src/visual.ts`: `NODE_GLYPHS`, `EDGE_STYLES`,
  `resolveNodeGlyph`, `resolveNodeColorRole` (exact §8.7/§8.2).
- [ ] T006 [P] Golden camera in `src/camera.ts`: `CAMERA`, `PARALLAX` (exact §8.8).
- [ ] T007 [P] Committed synthetic fixture in `src/fixtures/explorer.fixture.ts`: `explorerFixture(hasher)`
  builds the "speaker-v1" milestone (§7.1 nodes+edges, declaration order fixed) via the
  `@gt100k/evidence-graph` API, assembles the packet, and returns `{graph,packet,verifierResult}`; plus
  `applyTamper(fixture)`. Pseudonymous actors, no PII.
- [ ] T008 Add the **seeded smoke test** `test/smoke.test.ts` (imports the package, builds the fixture
  `ExplorerView` with the real node hasher, asserts 13 nodes / 12 in-milestone / golden bounds §8.1 /
  non-empty timeline) so the gate is green from iteration 1 (SC-E15).
- [ ] T009 Scaffold `@gt100k/evidence-explorer` app: `apps/evidence-explorer/package.json` (next/react/
  react-dom + `framer-motion@^11.11.0` + dep `@gt100k/evidence-explorer-view`, `@gt100k/evidence-graph`,
  `@gt100k/evidence-hash-node`, `@gt100k/evidence-verifier-stub`, `@gt100k/evidence-deferred`
  `workspace:*`), `next.config.mjs` (`transpilePackages` the view + graph packages), `tsconfig.json`
  (match `apps/student-compass`), `app/layout.tsx`, `app/page.tsx` placeholder, `app/globals.css` (§8.6
  tokens + `@media (prefers-reduced-motion)` + `@media (prefers-reduced-transparency)` + `:focus-visible`
  rings), `next-env.d.ts`, `.env.local.example` (§11), `.gitignore`.
- [ ] T010 Verify P0 gate: `pnpm typecheck` + `pnpm test` green; `pnpm --filter @gt100k/evidence-explorer
  build` compiles the placeholder page.

**Checkpoint**: packages/app skeletons compile; golden constants + fixture exist; smoke green.

---

## Phase P1 — Constellation graph (US1) 🎯 MVP

### Tests first (ensure they fail)

- [ ] T011 [P] [US1] `test/layout.test.ts`: `layoutExplorer(fixture)` deterministic + golden positions
  (§8.1) incl. island slot; x depends only on rank (SC-E01).
- [ ] T012 [P] [US1] `test/art.test.ts` + `test/visual.test.ts`: `PALETTE`/`TYPOGRAPHY` exact;
  `NODE_GLYPHS`/`EDGE_STYLES` exact; every node/edge type → distinct glyph/color/stroke + label
  (SC-E05).
- [ ] T013 [P] [US1] `test/mapping.test.ts`: all 8 node + 6 edge types covered with accessible labels;
  island `isInMilestone=false` (SC-E06).
- [ ] T014 [P] [US1] `test/view.test.ts`: `buildExplorerView` composes one view; `plainViewEquals(full,
  plain)` and `(full, reduced)` hold (SC-E02/E03).
- [ ] T015 [P] [US1] `test/motion-tokens.test.ts`: `resolveMotion` golden table incl. reduced mode
  (SC-E04).

### Implementation

- [ ] T016 [US1] `src/layout.ts`: `layoutExplorer` (rank by longest provenance path; order by insertion;
  §8.1 formula + island slot) → matches golden (depends T002/T007).
- [ ] T017 [US1] `src/ledger.ts`: `buildLedgerView` (tree accessible names) (depends T002/T016).
- [ ] T018 [US1] `src/view.ts`: `buildExplorerView` (nodes+edges+bounds+presentation+ledger) +
  `plainViewEquals` (depends T003–T007, T016, T017).
- [ ] T019 [US1] Export the P1 API from `src/index.ts`.
- [ ] T020 [US1] App: `ObservatoryStage.tsx` (owns the shared `ExplorerView`, pan/zoom/focus with
  momentum + rubber-band, reduced-motion), `Constellation.tsx` (SVG nodes/edges + glow + reveal via
  `resolveMotion`, `glyphs.tsx` inline SVG glyphs), `Starfield.tsx` (deterministic seeded Canvas,
  aria-hidden, off under reduced motion), `Ledger.tsx` (accessible `role="tree"`), wired in
  `app/page.tsx` (client). SVG/Canvas `aria-hidden`.

**Gate**: P0 gate + `next build` + smoke (zero console errors) + walkthrough steps 1, 5. MVP demonstrable.

---

## Phase P2 — Build timeline (US2)

- [ ] T021 [P] [US2] `test/timeline.test.ts`: `buildTimelineView` deterministic grouped order (§8.3);
  island excluded (SC-E07).
- [ ] T022 [US2] `src/timeline.ts`: `buildTimelineView`; fold into `buildExplorerView` (depends T018).
- [ ] T023 [US2] App: `Timeline.tsx` (staggered reveal via `resolveMotion("timelineReveal")`; reduced =
  all-at-once; beat→node focus link); Ledger ordered-list parity.
- [ ] T024 [US2] Verify walkthrough step 2.

---

## Phase P3 — Verification UX + tamper demo (US3)

- [ ] T025 [P] [US3] `test/verify-view.test.ts`: `buildVerificationView` steps derived from the domain
  (`merkleRoot`/subject-digest/`assertHumanAuthority`/stub); untampered → `verified`; `applyTamper` →
  `mismatch` with both roots; stub step `nonProduction`; no grade computed (SC-E08). Uses the real node
  hasher + stub verifier + deferred stub adapters.
- [ ] T026 [P] [US3] `test/authority-view.test.ts`: grade `Outcome` human-owned with owner; `model` actor
  cited/neutral; no accusation field (SC-E09).
- [ ] T027 [US3] `src/verify.ts`: `buildVerificationView` + `applyTamper` (reads the domain; §8.4);
  `ActorChip` tone + `isHumanOwned`/`isCitedAssistance` derivation; fold into `buildExplorerView`
  (depends T018).
- [ ] T028 [US3] App: `VerifyPanel.tsx` — stepped checks (`verifyStep`), Verified ✓ seal (ring
  Line-draw + Bloom + root Number-ticker via `seal`/`count`), `aria-live` announce.
- [ ] T029 [US3] App: tamper demo in `VerifyPanel`/`Constellation` — byte-node Shake/glitch + lineage
  desaturate + root Text-morph diff + MISMATCH seal (`tamper`); reduced = static MISMATCH chip + diff.
- [ ] T030 [US3] Ensure red + shake appear **only** on the byte-level node + root diff (never on a
  person/Outcome/Assistance); reduced-motion equivalents for both sequences.
- [ ] T031 [US3] Verify walkthrough step 3.

---

## Phase P4 — Drill-down inspector + human-authority + cited AI-assist (US4)

- [ ] T032 [P] [US4] `test/ledger.test.ts`: Ledger panel descriptions complete per node (id/actor/tool/
  inputs/timestamp/consent/payload); grade `Outcome` marked human-owned; model `Assistance` marked cited
  (SC-E10).
- [ ] T033 [US4] Extend `src/ledger.ts` panels + `NodeView` panel fields (depends T017/T027).
- [ ] T034 [US4] App: `Inspector.tsx` — frosted, origin-aware (scale from node), id (mono, copy),
  actor kind chip, tool/version, inputs (focus links), timestamp, consent scope, payload; Materialize
  open; reduced = fade.
- [ ] T035 [US4] App: human-owned seal on a grade `Outcome`; neutral "Declared AI assistance — cited"
  ribbon on a model `Assistance`/`Review`; **no** accusation affordance anywhere.
- [ ] T036 [US4] Ledger inspector parity (described regions).
- [ ] T037 [US4] Verify walkthrough step 4.

---

## Phase P5 — HUD, legend, filters, trace, plain mode (US5)

- [ ] T038 [P] [US5] `test/integration.test.ts`: build the view with the real node hasher + stub verifier;
  domain unchanged; adapter swap needs no view change; `traceEvidence` drives trace (SC-E14).
- [ ] T039 [P] [US5] `test/guardrails.test.ts`: view types expose none of price/currency/rank/leaderboard/
  percentile/outOf/streak/countdown/urgency/dropRate/rarity/accusation; no `Math.random` in `src`
  (SC-E11).
- [ ] T040 [US5] App: `Hud.tsx` — legend (all 8 node + 6 edge types, glyph+color+label), filters by node
  type, "trace from Outcome" (domain `traceEvidence` highlight; Ledger marks the subset), search/focus.
- [ ] T041 [US5] App: plain-mode toggle (state-identical, `plainViewEquals`), reduced-motion override
  (system/on/off), audio-caption toggle (muted default) — presentation-only.
- [ ] T042 [US5] Confirm toggles/filters/trace change only presentation flags (state unchanged).
- [ ] T043 [US5] Verify walkthrough steps 5–6.

---

## Phase P6 — Polish, accessibility & performance acceptance

- [ ] T044 [P] a11y pass: keyboard/switch/screen-reader over the Ledger; visible focus; color-independent
  cues (grayscale check); ≥4.5:1 contrast; canvas `aria-hidden` (SC-E13).
- [ ] T045 [P] reduced-motion parity sweep: every motion-table row has a reduced equivalent; no
  motion-only affordance (SC-E03/E04).
- [ ] T046 [P] performance: 60fps pan/zoom on the min device; degraded tier (starfield + glow off) holds
  the budget; only `transform`/`opacity`/`filter` animate (SC-E12 acceptance).
- [ ] T047 [P] `packages/evidence-explorer-view/README.md` (public API + "reads the domain, computes no
  grade / no crypto" note) and an app README/demo note (run via the filter).
- [ ] T048 App smoke (Playwright, review pipeline): loads `/`, SVG + Ledger mount, zero console errors,
  reduced-motion toggle, Verify → seal + `aria-live` (SC-E12).
- [ ] T049 **[FINAL — the single shared-file touch]** Add a composite project reference for
  `packages/evidence-explorer-view` to the root `tsconfig.json` `references` array (the app is `noEmit`,
  like `apps/student-compass`, so it needs no reference). Keep this as its own isolated change.

---

## Dependencies & Execution Order

- **P0 (T001–T010)** → **P1 (T011–T020)** → **P2 (T021–T024)** → **P3 (T025–T031)** → **P4 (T032–T037)**
  → **P5 (T038–T043)** → **P6 (T044–T049)**.
- The app phases depend on the corresponding view-package function landing first.
- T049 (root `tsconfig.json`) runs **last**; it is the sole shared-file change.

## Parallel Opportunities

- P0: T002–T007 in parallel; then T008.
- P1: T011–T015 (tests) in parallel before T016–T020.
- P3: T025/T026 in parallel before T027–T031.
- P5: T038/T039 in parallel.
- P6: T044–T047 in parallel.

## Implementation Strategy

- **MVP = P0 + P1** (the deterministic view + the interactive animated constellation with reduced-motion
  + accessible Ledger) → validate → then timeline (P2), verification + tamper (P3), inspector +
  authority/cited-assist (P4), HUD/trace/plain (P5), polish/a11y/perf (P6).
- Test-first for every view-package function; the golden values are the arbiter (match the spec, don't
  change the spec to the code). Reads `@gt100k/evidence-graph` unchanged; computes no grade / no crypto.

## Summary

- **Total tasks**: 49 (T001–T049).
- **Setup/Foundation (P0)**: T001–T010 · **Constellation MVP (P1)**: T011–T020 · **Timeline (P2)**:
  T021–T024 · **Verify+Tamper (P3)**: T025–T031 · **Inspector+Authority (P4)**: T032–T037 · **HUD/Trace/
  Plain (P5)**: T038–T043 · **Polish/a11y/perf (P6)**: T044–T049.
- **Golden coverage**: T011 (layout), T012 (palette/type/visual), T015 (motion table), T025 (verification
  derivation) — all exact against §8.
- **Shared-file touches**: exactly one — T049 (root `tsconfig.json` references), isolated.
