# Quickstart: EvidenceGraph (validation guide)

> **One spec home.** **Part I** below validates the pure domain. **Part II** (folded in from the former
> `explorer/quickstart.md`) validates the **Provenance Explorer** 3D UI. See [spec.md](./spec.md) Part I /
> Part II.

---

# PART I — Domain validation (`packages/evidence-graph`)

How to prove the slice works end-to-end once implemented. Implementation code lives in tasks.md / the code itself — this is a run/validation guide only. Synthetic-only; no consent/legal workflow is required.

## Prerequisites

- Node.js LTS + pnpm installed.
- Repo bootstrapped: `pnpm install` at the repo root (pnpm workspace).

## Run the tests (primary validation)

```bash
pnpm test                                       # Vitest across the workspace
pnpm --filter @gt100k/evidence-graph test       # domain unit + contract tests only
```

**Expected**: all contract-test obligations in [contracts/evidence-graph.md](./contracts/evidence-graph.md) pass — content-addressing + idempotency, cycle/dangling rejection, the human-authority invariant (human-owned grade passes; model-owned grade and authorship accusation rejected), deterministic Merkle root, packet assembly, and stub verification (pass untampered / fail tampered).

## Build & lint gate

```bash
pnpm exec tsc -b            # strict typecheck (noUncheckedIndexedAccess, verbatimModuleSyntax)
pnpm exec biome check .     # lint/format
```

**Expected**: `tsc -b` clean and `biome check` clean.

## Walk the end-to-end flow (synthetic milestone)

The demo/tests assemble a synthetic milestone graph and exercise the full path:

1. **Build the DAG (US1)**: add `Artifact`, `Transformation` (plan), `Attempt` (run), `Assistance`, `Review`, `Contribution`, `Outcome` nodes; link them with `derived_from`, `authored_by`, `used_tool`, `validates`, `released_as`. Each node's id equals the SHA-256 of its canonical content; re-adding identical content is a no-op; a cyclic edge is rejected.
2. **Enforce the invariant (US2)**: the `Outcome` grade is `authored_by` a **human** actor → `assertHumanAuthority` passes. Flip it to a `model` actor → it fails. Add an authorship-accusation node → it fails.
3. **Assemble + attest + verify (US3)**: assemble the `EvidencePacket` (deterministic Merkle root, in-toto attestation binding the artifact digest) and run the stub `Verifier` → **pass**. Alter one node's content and re-verify → **fail** (tamper-evident).
4. **Deferred stubs (§19.2)**: invoking `TransparencyLog.anchor` / `ErasureService.shred` returns deterministic placeholder results, clearly marked non-production (pre-live gates D1/D2).

## Golden-value quick check (deterministic acceptance targets)

The `golden.test.ts` file asserts the exact values pinned in [spec.md](./spec.md) **Golden Values** (compared
with `===`, zero tolerance). Reproduce them independently to sanity-check an implementation:

```bash
node -e 'const c=require("crypto");
const sha=b=>c.createHash("sha256").update(b).digest();                 // raw-byte SHA-256
const leaf=d=>sha(Buffer.concat([Buffer.from([0x00]),d]));             // RFC-6962 leaf
const int=(l,r)=>sha(Buffer.concat([Buffer.from([0x01]),l,r]));        // RFC-6962 interior
const a=sha(Buffer.from("a")),b=sha(Buffer.from("b")),cc=sha(Buffer.from("c"));
// 3-leaf golden: sorted [c,b,a]; RFC-6962 (n=3,k=2) promotes the lone leaf(a) unchanged
console.log(int(int(leaf(cc),leaf(b)),leaf(a)).toString("hex"));       // dd67a4e9…45ca647b
'
```

Expected: `dd67a4e94fcb4fff954bcb093257364a5b5d0832bda9ffb7a5b6340e45ca647b` (matches SC-008).

## Success criteria mapping

- SC-001 deterministic content-addressing + idempotency → `graph`/`canonicalize` tests (step 1).
- SC-002 acyclic DAG (cycle/self/dangling rejected) → `graph-edges` tests (step 1).
- SC-003 human-grade / no-accusation invariant → `invariants` tests (step 2).
- SC-004 deterministic Merkle root + tamper-evident verify → `merkle`/`packet`/verifier tests (step 3).
- SC-005 full flow with no consent/legal/admissions workflow → `e2e` test + demo need none.
- SC-006 adapter swap without domain change; stubs invocable + marked non-production → adapter/`stubs` tests (step 4).
- SC-007/SC-008 golden node id + golden Merkle roots → `golden.test.ts`.
- SC-009 canonicalization (key-order invariance) → `canonicalize.test.ts`.
- SC-010 second-preimage / leaf≠interior domain separation → `merkle.test.ts`.
- SC-011 seeded smoke test green from iteration 1 → `smoke.test.ts`.
- SC-012 `traceEvidence` returns supporting-only nodes (excludes unrelated island) → `packet.test.ts`.

---
---

# PART II — Provenance Explorer validation (3D "Provenance Observatory")

How to prove the UI expansion works once implemented. Implementation lives in [tasks.md](./tasks.md) Part II
/ the code — this is a run/validation guide only. Synthetic-only, read-only; the Explorer **reads**
`@gt100k/evidence-graph` and never edits it.

## Prerequisites

- Node.js LTS + pnpm installed; `pnpm install` at the repo root.
- The completed `packages/evidence-graph` domain + its adapters are present and unchanged.
- A browser with WebGL for the cinematic tier; the calm-2D tier needs no WebGL.

## Run the view-package tests (primary validation)

```bash
pnpm test                                            # Vitest across the workspace
pnpm --filter @gt100k/evidence-explorer-view test    # view-package tests only
```

**Expected**: all contract obligations in [contracts/provenance-explorer.md](./contracts/provenance-explorer.md)
pass — deterministic 2D layout (golden §U8.1) + 3D layout (golden §U8.2, ±1e-6), one composed `ExplorerView`
with tier/reduced-motion/plain parity (`plainViewEquals`), the golden motion table (`resolveMotion` incl.
reduced mode + all 3D events), palette/typography + node-body/edge-thread visual language, camera keyframes,
the render-tier ladder, deterministic growth timeline, verification derived from the domain (untampered →
verified; tampered → mismatch) + `verifyWaveOrder`, human-owned grade + cited (never accused) AI-assistance,
accessible Ledger completeness, and the structural no-dark-patterns guardrail.

## Build & lint gate

```bash
pnpm typecheck                                        # tsc -b (green after UE050 adds the ref)
pnpm lint                                             # biome check packages adapters apps
```

## Build & run the app

```bash
pnpm --filter @gt100k/evidence-explorer build         # next build — app acceptance/perf gate
pnpm --filter @gt100k/evidence-explorer dev           # run it locally
```

**Expected**: `next build` clean; the app boots with **zero console errors** and **no network requests**.

## Walk the end-to-end experience (synthetic "speaker-v1" milestone)

1. **Orbit & fly the 3D constellation (UX1)**: the evidence DAG ignites as a cosmos — 8 node types as
   distinct luminous **bodies** (Artifact=world, Attempt=moon, Transformation=blueprint, Claim=beacon,
   Assistance=comet marked "Declared", Review=gold star, Contribution=crystal, Outcome=seal-sun), 6 edge
   types as **light-threads** with directional flow, under bloom + depth-of-field with a parallax starfield.
   Orbit (drag with momentum), dolly, and fly-to a body to reveal its lineage (DOF racks focus). Layout is
   deterministic; the unrelated island body is clearly outside the milestone.
2. **Time-scrub the galaxy (UX2)**: drag the scrubber — bodies ignite in build order and threads draw in as
   both endpoints appear; selecting a beat flies to its body.
3. **Verify, then tamper (UX3)**: press **Verify** — a wave of light propagates edge-by-edge while the checks
   tick (Merkle root recomputed → attestation subject digest → human authority → *(pre-live gate, stub)*
   transparency-log), then the cosmos locks into a **Verified ✓** seal (ring forges shut + bloom + the Merkle
   root ticking up in mono). Then run the **Tamper demo** — one bound node's bytes are altered and
   re-verification visibly **fails**: the byte-level body **fractures**, the lineage to the root desaturates,
   the root morphs old→new with a highlighted diff, and a **MISMATCH** seal appears. Red + fracture appear
   **only** on the bytes, never on a person.
4. **Drill down (UX4)**: select any body to open its frosted inspector (id/actor/tool/inputs/timestamp/
   consent/payload). A grade `Outcome` seal-sun shows its **named human owner** with a human-owned seal; a
   `model`-authored `Assistance`/`Review` reads as **"Declared AI assistance — cited"** (neutral, calm) —
   never an accusation.
5. **HUD, legend, filters, trace, plain mode, tier (UX5)**: the legend lists all 8 bodies + 6 threads
   (body-icon + color + label); filter by type; "trace from Outcome" highlights the provenance path (domain
   `traceEvidence`, island excluded); toggle plain mode / reduced motion / render tier — the underlying state
   is unchanged.
6. **Accessibility, reduced motion & the 60fps budget (UX6)**: toggle reduced motion (or a weak GPU / no
   WebGL) — the app renders the **calm 2D** tier conveying the identical state, nothing lost. Navigate by
   keyboard only — the **Provenance Ledger** (`role="tree"` + lists + `aria-live` seal) reaches every body,
   beat, and verification step; focus is visible; every canvas/decorative layer is `aria-hidden`; a grayscale
   check still distinguishes every type/state. On the min device the 3D scene holds 60fps and auto-degrades
   (bloom/DOF off → calm 2D) when the budget slips, recovering when stable.

## Golden-value quick check (deterministic acceptance targets)

The view-package golden tests assert the exact values pinned in [spec.md](./spec.md) §U8. Spot-checks:

- **Layout 2D (§U8.1)**: `plan → (120,120)`, `src-artifact → (360,120)`, `outcome-grade → (1320,280)`,
  `island-note → (120,760)`; world bounds `{1440,880}`. x = 120 + depthRank·240.
- **Layout 3D (§U8.2)**: `plan → (0, 3.2, 0)`, `assist-research → (0, -1.6, 2.77128)`,
  `review-technical → (24, 0, 3.2)`, `outcome-grade → (30, -3.2, 0)`, `island-note → (0, -9, 0)`; center
  `[15,-1,0]`. x = depthRank·6.
- **Motion (§U8.5)**: `resolveMotion("sealForge",{reducedMotion:false}).durationMs === 900`;
  `resolveMotion("flyIn",{reducedMotion:true})` → `{ mode:"reduced", durationMs:0, easing:"linear" }`;
  `resolveMotion("press",{reducedMotion:true}).durationMs === 120` (kept).
- **Tiers (§U8.10)**: `resolveRenderTier({gpuTier:3,webglAvailable:true})==="cinematic"`;
  `resolveRenderTier({gpuTier:1,webglAvailable:true})==="standard3d"`;
  `resolveRenderTier({gpuTier:3,prefersReducedMotion:true})==="calm2d"`;
  `resolveRenderTier({gpuTier:3,webglAvailable:false})==="calm2d"`.
- **Verification (§U8.8)**: untampered fixture → `sealState:"verified"`, all non-stub steps `pass`, the
  transparency-log step `nonProduction:true`; `applyTamper(fixture)` → `sealState:"mismatch"` with
  `merkle-root` `fail` and `committed !== recomputed`.

## Success criteria mapping

- SC-E01/E16 deterministic 2D + 3D layout → `layout2d.test.ts` / `layout3d.test.ts` (step 1).
- SC-E02/E03 one composed view + tier/reduced-motion/plain parity → `view.test.ts` + `motion.test.ts` (steps 1, 6).
- SC-E04 golden motion table → `motion-tokens.test.ts`.
- SC-E05/E06/E19 palette/type/bodies/threads + all node/edge types + island → `art.test.ts`/`visual.test.ts`/`mapping.test.ts` (steps 1, 5).
- SC-E07 deterministic growth timeline → `timeline.test.ts` (step 2).
- SC-E08/E20 verification + wave derived from the domain; tamper fails → `verify-view.test.ts` (step 3).
- SC-E09 human-owned grade + cited (never accused) AI-assist → `authority-view.test.ts` (step 4).
- SC-E10 accessible Ledger completeness → `ledger.test.ts` (step 6).
- SC-E11 structural no-dark-patterns guardrail → `guardrails.test.ts`.
- SC-E12 `next build` + zero console errors + reduced-motion + seal announce → app smoke.
- SC-E13 WCAG 2.2 AA keyboard/SR/contrast/color-independent → a11y walkthrough (step 6).
- SC-E14 reads the domain unchanged; adapter swap needs no view change → `integration.test.ts`.
- SC-E15 seeded smoke green from iteration 1 → `smoke.test.ts`.
- SC-E17 camera keyframes → `camera.test.ts` (step 1).
- SC-E18 render-tier ladder → `tiers.test.ts`.
- SC-E21/E22 60fps budget + auto-degrade + no-WebGL fallback → perf/a11y walkthrough + Playwright smoke (step 6).
