# Quickstart: Provenance Explorer (validation guide)

How to prove the UI expansion works once implemented. Implementation lives in tasks.md / the code — this
is a run/validation guide only. Synthetic-only, read-only; the Explorer **reads** `@gt100k/evidence-graph`
and never edits it.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).
- The completed `packages/evidence-graph` domain + its adapters are present and unchanged.

## Run the view-package tests (primary validation)

```bash
pnpm test                                            # Vitest across the workspace
pnpm --filter @gt100k/evidence-explorer-view test    # view-package tests only
```

**Expected**: all contract obligations in [contracts/provenance-explorer.md](./contracts/provenance-explorer.md)
pass — deterministic layout (golden §8.1), one composed `ExplorerView` with reduced-motion/plain parity
(`plainViewEquals`), the golden motion table (`resolveMotion` incl. reduced mode), palette/typography +
node/edge visual language, deterministic timeline, verification derived from the domain (untampered →
verified; tampered → mismatch), human-owned grade + cited (never accused) AI-assistance, accessible
Ledger completeness, and the structural no-dark-patterns guardrail.

## Build & lint gate

```bash
pnpm typecheck                                        # tsc -b (strict; green after T-ROOT adds the ref)
pnpm lint                                             # biome check packages adapters apps
```

**Expected**: `tsc -b` clean and `biome check` clean.

## Build & run the app

```bash
pnpm --filter @gt100k/evidence-explorer build         # next build — app acceptance/perf gate
pnpm --filter @gt100k/evidence-explorer dev           # run it locally
```

**Expected**: `next build` clean; the app boots with **zero console errors** and **no network requests**.

## Walk the end-to-end experience (synthetic "speaker-v1" milestone)

1. **Explore the constellation (US1)**: the evidence DAG renders as glowing star-nodes (8 types, each a
   distinct glyph + color + label) connected by light-thread edges (6 types, each a distinct stroke +
   label). Pan (drag with momentum), zoom (origin-aware), and expand a node to reveal its lineage. Layout
   is deterministic; the unrelated island node is clearly outside the milestone.
2. **Watch the build timeline (US2)**: the timeline strip reveals ordered beats (plan → source → attempt
   → revision → assist → claim → review → contribution → release → outcome) with a tasteful stagger;
   selecting a beat focuses its constellation node.
3. **Verify, then tamper (US3)**: press **Verify** — the checks tick through (Merkle root recomputed →
   attestation subject digest → human authority → *(pre-live gate, stub)* transparency-log) and the
   constellation locks into a **Verified ✓** seal (ring of light + bloom + the Merkle root ticking up in
   mono). Then run the **Tamper demo** — one bound node's bytes are altered and re-verification visibly
   **fails**: the byte-level node glitches, the lineage to the root desaturates, the root morphs old→new
   with a highlighted diff, and a **MISMATCH** seal appears. Red + the shake appear **only** on the bytes,
   never on a person.
4. **Drill down (US4)**: select any node to open its frosted inspector (id/actor/tool/inputs/timestamp/
   consent/payload). A grade `Outcome` shows its **named human owner** with a human-owned seal; a
   `model`-authored `Assistance`/`Review` reads as **"Declared AI assistance — cited"** (neutral, calm) —
   never an accusation.
5. **HUD, legend, filters, trace, plain mode (US5)**: the legend lists all 8 node + 6 edge types
   (glyph + color + label); filter by type; "trace from Outcome" highlights the provenance path (the
   domain's `traceEvidence`, island excluded); toggle plain mode / reduced motion — the underlying state
   is unchanged.
6. **Accessibility & reduced motion (US6)**: toggle reduced motion — every animation degrades to an
   instant/opacity equivalent, nothing is lost. Navigate by keyboard only — the **Provenance Ledger**
   (`role="tree"` + lists + `aria-live` seal) reaches every node, beat, and verification step; focus is
   visible; the SVG/Canvas are `aria-hidden`; a grayscale check still distinguishes every type/state.

## Golden-value quick check (deterministic acceptance targets)

The view-package golden tests assert the exact values pinned in [spec.md](./spec.md) §8. Spot-checks:

- **Layout (§8.1)**: `plan → (120,120)`, `src-artifact → (360,120)`, `attempt-2 → (840,120)`,
  `outcome-grade → (1320,280)`, `island-note → (120,760)`; world bounds `{1440, 880}`. x = 120 + rank·240.
- **Motion (§8.5)**: `resolveMotion("seal",{reducedMotion:false}).durationMs === 640`;
  `resolveMotion("seal",{reducedMotion:true})` → `{ mode:"reduced", durationMs:150, easing:"linear" }`;
  `resolveMotion("press",{reducedMotion:true}).durationMs === 120` (kept).
- **Verification (§8.4)**: untampered fixture → `sealState:"verified"`, all non-stub steps `pass`, the
  transparency-log step `nonProduction:true`; `applyTamper(fixture)` → `sealState:"mismatch"` with
  `merkle-root` `fail` and `committed !== recomputed`.

## Success criteria mapping

- SC-E01 deterministic golden layout → `layout.test.ts` (step 1).
- SC-E02/E03 one composed view + reduced-motion/plain parity → `view.test.ts` + `motion.test.ts` (steps 1, 6).
- SC-E04 golden motion table → `motion-tokens.test.ts`.
- SC-E05/E06 palette/type/visual + all node/edge types + island → `art.test.ts`/`visual.test.ts`/`mapping.test.ts` (steps 1, 5).
- SC-E07 deterministic timeline → `timeline.test.ts` (step 2).
- SC-E08 verification derived from the domain; tamper fails → `verify-view.test.ts` (step 3).
- SC-E09 human-owned grade + cited (never accused) AI-assist → `authority-view.test.ts` (step 4).
- SC-E10 accessible Ledger completeness → `ledger.test.ts` (step 6).
- SC-E11 structural no-dark-patterns guardrail → `guardrails.test.ts`.
- SC-E12 `next build` + zero console errors + reduced-motion + seal announce → app smoke.
- SC-E13 WCAG 2.2 AA keyboard/SR/contrast/color-independent → a11y walkthrough (step 6).
- SC-E14 reads the domain unchanged; adapter swap needs no view change → `integration.test.ts`.
- SC-E15 seeded smoke green from iteration 1 → `smoke.test.ts`.
