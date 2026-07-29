# EvidenceGraph Clean 2D — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the EvidenceGraph explorer into one clean, single-column 2D surface that leads with the story of the work, with the cryptographic rigor kept one click deeper.

**Architecture:** This is a **presentation + copy reshape** of `passion/apps/evidence-explorer` only. The `@gt100k/evidence-*` domain and the `@gt100k/evidence-explorer-view` package are **not** modified. We remove the app's 3D render path (delete `components/cosmos/`, drop three.js deps), collapse the two-column layout to a single column with the 2D graph as the hero, move the tools (search/filters/display/add/ledger) behind a collapsed **Explore** disclosure, and expose **Verify** from the header. Plain-language copy sits on top; the technical strings stay reachable verbatim.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Vitest (node env), Playwright (manual/e2e, not in the vitest gate). Package manager: **pnpm**.

## Global Constraints

- **Package manager:** pnpm. Run everything through `pnpm --filter @gt100k/evidence-explorer <script>`.
- **Test command (the gate):** `pnpm --filter @gt100k/evidence-explorer test` → `vitest run --config vitest.config.mts`, node environment, includes only `test/**/*.test.ts`. There is **no** `lint`/`typecheck` script in this package.
- **Build:** `pnpm --filter @gt100k/evidence-explorer build` → `next build` (part of the gate).
- **Dev server:** `pnpm --filter @gt100k/evidence-explorer dev` → `next dev -p 3030` (port is hardcoded to 3030).
- **Extraction invariant (§13a):** no new **value** import across the `@gt100k/evidence-*` boundary. The app's only outward deps stay `@gt100k/design-tokens` + `@gt100k/ui`. `import type` from `@gt100k/evidence-*` is fine.
- **Guardrails (unchanged):** no competition / urgency / accusation language in any copy. The human-authority fact stays truthful, stated plainly, never softened away.
- **No raw PII:** actors are opaque refs; do not add names/emails to any node or copy beyond the existing synthetic labels.
- **Commits:** Conventional Commits. PRs < ~400 lines. This plan is intended as **two PRs**: PR-A = Tasks 1–3 (`feat(evidence): retire 3D + single-column story-first layout`), PR-B = Tasks 4–5 (`feat(evidence): plain-language copy + verify panel`). Task 6 verification runs before each PR opens.
- **Do NOT modify** `@gt100k/evidence-explorer-view` (`passion/packages/evidence-explorer-view`). Its `tiers`/`layout3d`/`camera` exports stay; the app simply stops using the 3D ones.

---

## File Structure

**Deleted (app only):**
- `passion/apps/evidence-explorer/components/cosmos/` — all 6 files (`Bodies.tsx`, `Cosmos3D.tsx`, `palette.ts`, `starfield-rng.ts`, `Starfield.tsx`, `Threads.tsx`).
- `passion/apps/evidence-explorer/test/cosmos-rng.test.ts` — tests the deleted cosmos helpers.

**Created:**
- `passion/apps/evidence-explorer/components/copy.ts` — pure, framework-free plain-language vocabulary (headline/subtitle, node-type gloss, verify plain lines, "Demo data" label). Unit-tested.
- `passion/apps/evidence-explorer/components/ExplorePanel.tsx` — the collapsed `Explore` disclosure that wraps `Hud`, `AddPanel`, and `Ledger`.
- `passion/apps/evidence-explorer/test/copy.test.ts` — unit tests for `copy.ts`.
- `passion/apps/evidence-explorer/test/no-3d.test.ts` — guard: no cosmos dir, no three.js imports/deps remain.
- `passion/apps/evidence-explorer/test/structure.test.ts` — guard: single-column composition (Observatory delegates tools to ExplorePanel; Verify reachable from header).

**Modified:**
- `components/ObservatoryStage.tsx` — remove tier machinery + `Cosmos3D`; render `Constellation2D` only; receive `verifyVisual` as a prop instead of owning it; keep `Inspector`, `TimeScrub`, selection, scrub.
- `components/Observatory.tsx` — lift `verifyOpen` + `verifyVisual` state; header gets the plain title/subtitle + `Verify` button + "Demo data" pill; render the `VerifyBox` as a header-toggled panel; move the tools into `ExplorePanel`.
- `components/hud-state.tsx` — remove `tierOverride` / `setTierOverride` (the only tier machinery here).
- `components/VerifyBox.tsx` — reword the seal summary to the plain sentence; reword the tamper button; keep the technical steps verbatim in the expandable detail.
- `components/Inspector.tsx` and `components/Ledger.tsx` — show the plain node-type gloss alongside the type name (via `copy.ts`).
- `app/globals.css` — single-column `.obs-grid`; remove `.obs-stage-bar` / `.obs-stage-mode` / `.obs-tier-*` / `.cosmos-viewport*` rules; add `.explore-*` disclosure rules; plain header tweaks.
- `test/a11y.test.ts` — remove the one `it` that reads the deleted `Cosmos3D.tsx`.
- `e2e/smoke.spec.ts` — update the 3 tier/canvas-dependent specs for the 2D-only surface (not in the vitest gate, but kept correct).
- `package.json` — remove `three`, `@react-three/drei`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`, `@types/three`.

---

## Task 1: Retire the 3D render path

Make the app 2D-only: delete the cosmos subtree, drop the three.js deps, simplify `ObservatoryStage` to render `Constellation2D` directly, remove the tier state, and fix the two tests that referenced 3D. Deliverable: `pnpm --filter @gt100k/evidence-explorer test` and `build` are green with no 3D code present.

**Files:**
- Create: `passion/apps/evidence-explorer/test/no-3d.test.ts`
- Delete: `passion/apps/evidence-explorer/components/cosmos/` (6 files), `passion/apps/evidence-explorer/test/cosmos-rng.test.ts`
- Modify: `components/ObservatoryStage.tsx`, `components/hud-state.tsx`, `test/a11y.test.ts`, `package.json`

**Interfaces:**
- Produces: `ObservatoryStage` new prop shape (adds `verifyVisual: VerifyVisualState`, removes internal verify state — consumed by Task 2). `hud-state` `useHud()` loses `tierOverride`/`setTierOverride`.

- [ ] **Step 1: Write the guard test (failing).** Create `test/no-3d.test.ts`:

```ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const APP = join(__dirname, "..");
const THREE_TOKENS = ["@react-three/", "postprocessing", 'from "three"', "from 'three'"];

/** Every .ts/.tsx under a dir, recursively. */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(p));
    else if (/\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe("no 3D render path", () => {
  it("has no components/cosmos directory", () => {
    expect(existsSync(join(APP, "components/cosmos"))).toBe(false);
  });

  it("no component or app source imports three.js / react-three / postprocessing", () => {
    const offenders: string[] = [];
    for (const dir of ["components", "app"]) {
      for (const file of sourceFiles(join(APP, dir))) {
        const src = readFileSync(file, "utf8");
        if (THREE_TOKENS.some((t) => src.includes(t))) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("package.json declares no three.js dependencies", () => {
    const pkg = JSON.parse(readFileSync(join(APP, "package.json"), "utf8"));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const banned = [
      "three",
      "@types/three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/postprocessing",
      "postprocessing",
    ];
    expect(banned.filter((d) => d in deps)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- no-3d`
Expected: FAIL (cosmos dir exists, imports present, deps present).

- [ ] **Step 3: Delete the cosmos subtree and its test.**

```bash
cd passion/apps/evidence-explorer
rm -rf components/cosmos
rm test/cosmos-rng.test.ts
```

- [ ] **Step 4: Remove the three.js deps from `package.json`.**

Delete these six lines from `passion/apps/evidence-explorer/package.json` (five from `dependencies`, one from `devDependencies`):

```json
"@react-three/drei": "^9.114.0",
"@react-three/fiber": "^8.17.10",
"@react-three/postprocessing": "^2.16.3",
"postprocessing": "^6.36.4",
"three": "^0.169.0",
"@types/three": "^0.169.0"
```

Then refresh the lockfile: `pnpm install` (run from repo root or with `--filter`).

- [ ] **Step 5: Simplify `ObservatoryStage.tsx` to 2D-only.**

In `components/ObservatoryStage.tsx`:
- Remove the `Cosmos3D` dynamic import (line ~46) and the `TIER_LABEL`, `detectWebGL`, `lowerTier`, `stepDown`, `CanvasBoundary` helpers.
- Remove imports no longer used: `RenderCaps`, `RenderTier`, `TIER_LADDER`, `resolveRenderTier`, `dynamic`, `Component`, `ErrorInfo`, `ReactNode`.
- Remove state: `mounted`, `device`, `degradedTo`, `webglFailed`, and their effects; remove `tierOverride`/`setTierOverride` from the `useHud()` destructure; remove `activeTier`/`is3D`.
- Remove the `VerifyBox` render and its `verifyVisual` local state + `setVerifyVisual`. **Add `verifyVisual` to the component's props** (Task 2 will pass it down); use it where `verify={verifyVisual}` is read.
- Remove the entire `.obs-stage-bar` block (the `Rendering: …` readout + the 3D/2D `role="radiogroup"` toggle).
- The `<div className="obs-viewport">` renders `<Constellation2D … verify={verifyVisual} />` directly (drop the `is3D ?` branch and the `.cosmos-viewport` wrapper). Keep the `Inspector` `<AnimatePresence>` block and the `TimeScrub` render.

Resulting props:

```ts
export function ObservatoryStage({
  view,
  verification,
  ledger,
  verifyVisual,
}: {
  view: ExplorerView;
  verification: SyntheticVerification;
  ledger: LedgerView;
  verifyVisual: VerifyVisualState;
}): JSX.Element
```

Keep `verification`/`ledger` in the signature (still used by `panelById(ledger, …)` and `waveOrder = verification.verified.verifyWaveOrder`).

- [ ] **Step 6: Remove tier state from `hud-state.tsx`.**

In `components/hud-state.tsx`: delete the `tierOverride` `useState`, the `tierOverride`/`setTierOverride` fields from the context value and the `HudContextValue` type, and the `type TierOverride` import from `@gt100k/evidence-explorer-view`. Leave everything else (types, trace, plain, reduced-motion, audio) untouched.

- [ ] **Step 7: Fix `test/a11y.test.ts`.**

Delete the single `it("the 3D <Canvas> is aria-hidden", …)` block (the one that `readFileSync`s `components/cosmos/Cosmos3D.tsx`). Leave the calm-2D `<svg>` aria-hidden test and all others intact.

- [ ] **Step 8: Run the full gate.**

Run: `pnpm --filter @gt100k/evidence-explorer test`
Expected: PASS (including `no-3d.test.ts`). `test/presentation.test.ts` and `test/synthetic-view.test.ts` still pass — they exercise the **view package**, which we did not change.

Run: `pnpm --filter @gt100k/evidence-explorer build`
Expected: succeeds; bundle no longer includes three.js.

- [ ] **Step 9: Commit.**

```bash
git add -A
git commit -m "feat(evidence): retire the 3D render path (2D-only explorer)"
```

---

## Task 2: Lift verify to the header

Move verification from a panel at the bottom of the stage to a **Verify button in the header** that toggles a Verify panel. The byte-fracture visual (`verifyVisual`) is lifted to `Observatory` so both the panel (which sets it) and `Constellation2D` (which reads it) share one source.

**Files:**
- Modify: `components/Observatory.tsx`, `components/ObservatoryStage.tsx` (consume the new prop from Task 1)

**Interfaces:**
- Consumes: `ObservatoryStage` prop `verifyVisual` (Task 1). `VerifyBox` props `{ verification, audioCaptions?, onVisualChange? }` (unchanged). `VerifyVisualState`, `IDLE_VISUAL` from `./verify-machine.js`.
- Produces: header `Verify` button behavior consumed by Task 4's copy pass.

- [ ] **Step 1: Write the structure guard test (failing).** Create `test/structure.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = join(__dirname, "..", "components");
const read = (f: string) => readFileSync(join(COMPONENTS, f), "utf8");

describe("single-column story-first composition", () => {
  it("Observatory owns the verify open/visual state and renders VerifyBox", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/verifyOpen/);
    expect(src).toMatch(/verifyVisual/);
    expect(src).toMatch(/VerifyBox/);
  });

  it("Observatory exposes a Verify control in the header", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/obs-verify-btn/);
  });

  it("the render stage no longer renders VerifyBox", () => {
    expect(read("ObservatoryStage.tsx")).not.toMatch(/VerifyBox/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- structure`
Expected: FAIL (`verifyOpen`/`obs-verify-btn` absent; stage may still reference VerifyBox until Task 1 landed — after Task 1 the third assertion passes but the first two fail).

- [ ] **Step 3: Lift state into `Observatory.tsx`.**

Add to the component body (alongside `graph`/`view`/`verification`):

```tsx
import { VerifyBox } from "./VerifyBox.js";
import { IDLE_VISUAL, type VerifyVisualState } from "./verify-machine.js";
// ...
const [verifyOpen, setVerifyOpen] = useState(false);
const [verifyVisual, setVerifyVisual] = useState<VerifyVisualState>(IDLE_VISUAL);
```

- [ ] **Step 4: Add the header Verify button.**

In the `.obs-readout` cluster (keep the stat chips), add a control the header can toggle. Replace the `Synthetic` markup wiring as needed and add:

```tsx
<button
  type="button"
  className="obs-verify-btn"
  aria-expanded={verifyOpen}
  aria-controls="verify-panel"
  onClick={() => setVerifyOpen((o) => !o)}
>
  {verification.verified.verified ? "Verify ✓" : "Verify"}
</button>
```

(Use the actual boolean the seal reads — confirm the field name in `SyntheticVerification`/`VerifyBox`; if the summary derives from `verification.tampered` vs `verification.verified`, reflect the verified state. When unsure, render the static label `"Verify"`.)

- [ ] **Step 5: Render the Verify panel, gated by `verifyOpen`.**

Inside the grid, above the graph column (so it reads as "the proof, one click deeper"), render:

```tsx
{verifyOpen ? (
  <div id="verify-panel" className="verify-panel">
    <VerifyBox
      verification={verification}
      onVisualChange={setVerifyVisual}
    />
  </div>
) : null}
```

- [ ] **Step 6: Pass `verifyVisual` down to the stage.**

Change the `<ObservatoryStage … />` call to pass `verifyVisual={verifyVisual}` (matching the Task 1 prop). Remove any `audioCaptions` wiring that only existed for the stage-owned VerifyBox (audio captions remain a HUD/plain concern, untouched).

- [ ] **Step 7: Run the guards + gate.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- structure`
Expected: PASS.
Run: `pnpm --filter @gt100k/evidence-explorer test` — Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add -A
git commit -m "feat(evidence): open Verify from the header, share byte-fracture state"
```

---

## Task 3: Single-column layout + Explore disclosure

Collapse the two-column grid to a single column (graph as hero) and move `Hud` + `AddPanel` + `Ledger` behind a collapsed **Explore** disclosure.

**Files:**
- Create: `components/ExplorePanel.tsx`
- Modify: `components/Observatory.tsx`, `app/globals.css`
- Extend: `test/structure.test.ts`

**Interfaces:**
- Consumes: `Hud` (`{ view }`), `AddPanel` (`{ graph, nodes, onApply }`), `Ledger` (`{ ledger }`) — all unchanged.
- Produces: `ExplorePanel` component consumed by `Observatory`.

- [ ] **Step 1: Extend the structure guard (failing).** Append to `test/structure.test.ts`:

```ts
describe("Explore disclosure", () => {
  it("Observatory delegates the tools to ExplorePanel, not directly", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/ExplorePanel/);
    // The tools now live inside ExplorePanel, not the Observatory shell.
    expect(src).not.toMatch(/<Hud\b/);
    expect(src).not.toMatch(/<Ledger\b/);
    expect(src).not.toMatch(/<AddPanel\b/);
  });

  it("ExplorePanel is collapsed by default", () => {
    const src = read("ExplorePanel.tsx");
    expect(src).toMatch(/useState\(false\)/);
    expect(src).toMatch(/aria-expanded/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- structure`
Expected: FAIL (`ExplorePanel` does not exist; `<Hud>`/`<Ledger>`/`<AddPanel>` still in Observatory).

- [ ] **Step 3: Create `components/ExplorePanel.tsx`.**

```tsx
"use client";
import type { ExplorerView, LedgerView } from "@gt100k/evidence-explorer-view";
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { type JSX, useState } from "react";
import { AddPanel, type AppliedBundle } from "./AddPanel.js";
import { Hud } from "./Hud.js";
import { Ledger } from "./Ledger.js";

/**
 * The advanced-tools disclosure — collapsed by default so the default surface stays calm.
 * Holds the search/filter/display HUD, the manual Add panel, and the accessible Ledger (the
 * `role="tree"` source of truth). Presentation-only; owns no graph state.
 */
export function ExplorePanel({
  view,
  ledger,
  graph,
  onApply,
}: {
  view: ExplorerView;
  ledger: LedgerView;
  graph: EvidenceGraph;
  onApply: (next: AppliedBundle) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <section className={`explore${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="explore-toggle"
        aria-expanded={open}
        aria-controls="explore-body"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="explore-chevron" aria-hidden="true" />
        Explore
        <span className="explore-sub">search · filter · add · full record</span>
      </button>
      {open ? (
        <div id="explore-body" className="explore-body">
          <Hud view={view} />
          <AddPanel graph={graph} nodes={view.nodes} onApply={onApply} />
          <Ledger ledger={ledger} />
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Rewire `Observatory.tsx` to a single column.**

- Remove the direct imports of `Hud`, `Ledger`, `AddPanel` (icons `NodesIcon`/`ThreadsIcon`/`UnlinkedIcon` stay for the header stats). Import `ExplorePanel`.
- Replace the `.obs-grid` two-column block with a single column: the Verify panel (Task 2), then `.panel.stage` with `<ObservatoryStage … />`, then `<ExplorePanel … onApply={…} />` at the bottom. Keep the `onApply` handler that lifts the bundle (`setGraph`/`setView`/`setVerification`).
- Keep `SelectionProvider` + `HudProvider` wrapping (both still used by the stage and the HUD inside ExplorePanel).

- [ ] **Step 5: Rework the CSS.** In `app/globals.css`:

- Change `.obs-grid` to a single column:

```css
.obs-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: stretch;
}
```

  Remove the `@media (max-width: 960px) .obs-grid` override (no longer needed).
- **Delete** these now-dead rules: `.obs-stage-bar`, `.obs-stage-mode`, `.obs-stage-mode strong`, `.obs-tier-control`, `.obs-tier-btn`, `.obs-tier-btn:hover`, `.obs-tier-btn.is-active`, `.cosmos-viewport`, `.cosmos-viewport canvas`. Also drop `.obs-tier-btn` from the shared typography rule near line 1943.
- **Keep** `.obs-stage`, `.constellation`, `.obs-viewport`, `.obs-stat*`, `.obs-synthetic`, `.sr-only`, `.stage`.
- Add the Explore + Verify + Verify-button rules (compositor-only transitions — no animated layout props, to keep `motion-budget.test.ts` green):

```css
.explore { border-top: 1px solid var(--line); }
.explore-toggle {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 16px 4px; border: 0; background: transparent;
  font-family: var(--font-display); font-size: 1.05rem; color: var(--ink);
  cursor: pointer;
}
.explore-chevron {
  width: 8px; height: 8px; border-right: 2px solid var(--ink-muted);
  border-bottom: 2px solid var(--ink-muted); transform: rotate(-45deg);
  transition: transform 160ms ease;
}
.explore.is-open .explore-chevron { transform: rotate(45deg); }
.explore-sub { font-family: var(--font-sans); font-size: var(--text-label); color: var(--ink-muted); }
.explore-body { display: flex; flex-direction: column; gap: 24px; padding-top: 8px; }

.obs-verify-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 15px; border: 1px solid color-mix(in oklab, var(--verify) 32%, var(--line));
  border-radius: var(--radius-md); background: var(--verify-bg);
  font-family: var(--font-mono); font-size: var(--text-label); font-weight: 600;
  color: var(--verify); cursor: pointer;
  transition: background-color 160ms ease, color 160ms ease;
}
.verify-panel { /* the proof, one click deeper */ }
```

- [ ] **Step 6: Run the guards + gate.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- structure`
Expected: PASS.
Run: `pnpm --filter @gt100k/evidence-explorer test` — Expected: PASS (motion-budget + a11y still green: keyframes remain, no layout props animate, reduced-motion reset intact).

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(evidence): single-column layout with a collapsed Explore disclosure"
```

---

## Task 4: Plain-language copy module + header

Introduce a pure copy module and apply it to the header (plain title/subtitle, "Demo data" pill, plain stat labels) and the node-type gloss in the Inspector/Ledger.

**Files:**
- Create: `components/copy.ts`, `test/copy.test.ts`
- Modify: `components/Observatory.tsx`, `components/Inspector.tsx`, `components/Ledger.tsx`

**Interfaces:**
- Produces: `copy.ts` exports consumed by header + Inspector + Ledger:
  - `HEADLINE: string`, `SUBTITLE: string`, `DEMO_BADGE: string`
  - `nodeGloss(type: NodeType): string`
  - `verifyLine(verified: boolean): string`

- [ ] **Step 1: Write the unit test (failing).** Create `test/copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEMO_BADGE, HEADLINE, SUBTITLE, nodeGloss, verifyLine } from "../components/copy.js";

describe("plain-language copy", () => {
  it("headline and subtitle lead with the story, no jargon", () => {
    expect(HEADLINE).toMatch(/built/i);
    expect(SUBTITLE.toLowerCase()).not.toMatch(/merkle|provenance|observatory|milestone/);
  });

  it("demo badge is plain", () => {
    expect(DEMO_BADGE).toBe("Demo data");
  });

  it("every node type has a plain gloss", () => {
    for (const t of [
      "Artifact", "Attempt", "Transformation", "Claim",
      "Assistance", "Contribution", "Review", "Outcome",
    ] as const) {
      expect(nodeGloss(t).length).toBeGreaterThan(0);
      expect(nodeGloss(t).toLowerCase()).not.toBe(t.toLowerCase());
    }
    expect(nodeGloss("Attempt")).toBe("a run or test");
    expect(nodeGloss("Assistance")).toBe("help used");
  });

  it("verify line is plain in both states, no crypto terms", () => {
    expect(verifyLine(true)).toMatch(/hasn't changed|has not changed|nothing.*changed/i);
    expect(verifyLine(false)).toMatch(/changed/i);
    expect((verifyLine(true) + verifyLine(false)).toLowerCase()).not.toMatch(/merkle|digest|hash/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- copy`
Expected: FAIL ("Cannot find module '../components/copy.js'").

- [ ] **Step 3: Create `components/copy.ts`.**

```ts
/**
 * Plain-language vocabulary (Phase 1). Pure + framework-free so it is unit-testable without a DOM.
 * The surface reads plainly by default; the precise technical strings still live verbatim behind the
 * Verify "how we checked" detail and the Inspector fields — this module never hides a fact, it only
 * chooses the plain word for it.
 */
import type { NodeType } from "@gt100k/evidence-graph";

/** Story-first framing for the header. Swap freely — kept general (works for any project). */
export const HEADLINE = "How this project was built";
export const SUBTITLE = "A record of every step of the work — that can't be faked.";
export const DEMO_BADGE = "Demo data";

const GLOSS: Record<NodeType, string> = {
  Artifact: "a file or draft",
  Attempt: "a run or test",
  Transformation: "a plan step",
  Claim: "a reflection",
  Assistance: "help used",
  Contribution: "a credit or source",
  Review: "a mentor note",
  Outcome: "a result",
};

/** The plain gloss for a node type (shown alongside the type name, never replacing it). */
export function nodeGloss(type: NodeType): string {
  return GLOSS[type] ?? "";
}

/** The plain top-line verify result. Technical checks stay verbatim in the Verify detail. */
export function verifyLine(verified: boolean): string {
  return verified
    ? "Verified — nothing here has changed since it was recorded."
    : "Changed — this record no longer matches what was originally recorded.";
}
```

Confirm `NodeType`'s exact member spelling in `@gt100k/evidence-graph`'s `src/model.ts`; if a member differs, fix the `GLOSS` key and the test's list to match (the record must be exhaustive over `NodeType`).

- [ ] **Step 4: Run the test — verify it passes.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- copy`
Expected: PASS.

- [ ] **Step 5: Apply to the header.**

In `components/Observatory.tsx`: replace the `.obs-eyebrow` "Provenance Observatory" + `<h1>Milestone <ref></h1>` with:

```tsx
<div className="obs-title">
  <h1>{HEADLINE}</h1>
  <p className="obs-subtitle">{SUBTITLE}</p>
</div>
```

Replace the `Synthetic` pill text with `{DEMO_BADGE}` (keep the `.obs-synthetic` class + dot). Change the stat labels from `NODES`/`UNLINKED`/`THREADS` to `steps`/`links`: render **"12 steps"** and **"11 links"**, and only render the unlinked chip when `view.nodes.length - milestoneCount > 0`. Import `{ HEADLINE, SUBTITLE, DEMO_BADGE } from "./copy.js"`.

Add CSS in `globals.css`: `.obs-subtitle { font-family: var(--font-sans); color: var(--ink-muted); margin: 6px 0 0; max-width: 46ch; }` and keep/repoint the removed `.obs-eyebrow` rule (delete it if now unused).

- [ ] **Step 6: Apply the gloss in Inspector + Ledger.**

In `components/Inspector.tsx` and `components/Ledger.tsx`, wherever the node **type** is shown as a heading/label, render the type name plus the gloss, e.g. `{type} · {nodeGloss(type)}`. Import `{ nodeGloss } from "./copy.js"`. Keep the type name (evaluators rely on it); the gloss is the plain add-on. **Do not** add any new `<svg>` without `aria-hidden="true"` (a11y test #3 pins Inspector/HUD svgs).

- [ ] **Step 7: Run the gate.**

Run: `pnpm --filter @gt100k/evidence-explorer test` — Expected: PASS.
Run: `pnpm --filter @gt100k/evidence-explorer build` — Expected: succeeds.

- [ ] **Step 8: Commit.**

```bash
git add -A
git commit -m "feat(evidence): plain-language header, stats, and node-type glosses"
```

---

## Task 5: Plain Verify summary + tamper wording

Reword the Verify panel so the top line is the plain sentence and the tamper control reads plainly, while the technical steps stay verbatim in the expandable detail.

**Files:**
- Modify: `components/VerifyBox.tsx`
- Extend: `test/copy.test.ts` is already covering `verifyLine`; add a source guard in `test/structure.test.ts`.

**Interfaces:**
- Consumes: `verifyLine(verified)` from `copy.ts` (Task 4).

- [ ] **Step 1: Add a guard (failing).** Append to `test/structure.test.ts`:

```ts
describe("Verify reads plainly on top, verbatim underneath", () => {
  it("VerifyBox uses the plain verifyLine copy", () => {
    expect(read("VerifyBox.tsx")).toMatch(/verifyLine/);
  });
  it("VerifyBox keeps the verbatim technical steps in the detail", () => {
    // the step list is the auditor's verbatim view — it must remain.
    expect(read("VerifyBox.tsx")).toMatch(/verifybox-steps/);
  });
  it("the tamper control reads plainly (not 'tamper')", () => {
    const src = read("VerifyBox.tsx");
    expect(src).toMatch(/Try changing the record|Undo the change|Change one/i);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- structure`
Expected: FAIL (`verifyLine` not imported; tamper button still says "Show tamper").

- [ ] **Step 3: Reword the summary line.**

In `components/VerifyBox.tsx`: import `{ verifyLine } from "./copy.js"`. In the `.verifybox-summary` button, keep the seal mark (`✓`/`✕`) and the short root, but set the human-readable line to `verifyLine(<verified boolean>)` (use the same boolean the seal state derives from). Keep the `.verifybox-diff` old→new root display in the tampered state — that concrete before/after is part of the "how it was really built / can't be faked" story.

- [ ] **Step 4: Reword the tamper button + note.**

Change the `.verifybox-tamper` button text from `"Show tamper"`/`"Hide tamper"` to **`"Try changing the record"`** / **`"Undo the change"`** (keep `aria-pressed={tamperOn}`). Reword the adjacent `.verifybox-note` to a plain sentence, e.g. *"Change one saved item and the check fails — that's how you know the record is real."* Keep the technical step list (`verifybox-steps`) exactly as-is (verbatim, in the expanded detail).

- [ ] **Step 5: Run the guards + gate.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- structure` — Expected: PASS.
Run: `pnpm --filter @gt100k/evidence-explorer test` — Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add -A
git commit -m "feat(evidence): plain Verify summary + tamper wording, verbatim detail kept"
```

---

## Task 6: Visual verification (manual gate, before each PR)

The vitest gate is node-env text/unit tests; the "clean & nice" claim needs a real browser. Verify the surface with Playwright screenshots and eyeball each state.

**Files:** none committed (screenshots are scratch under `$CLAUDE_JOB_DIR/tmp`).

- [ ] **Step 1: Start the dev server.**

Run: `pnpm --filter @gt100k/evidence-explorer dev` (serves on :3030). Wait for "Ready".

- [ ] **Step 2: Screenshot the three key states.** With Python Playwright (available in this env), capture: (a) the default surface (graph hero + Play button + timeline, Explore collapsed, Verify closed), (b) Explore expanded, (c) Verify open with the tamper toggle on (seal shows the before/after roots). Save PNGs to `$CLAUDE_JOB_DIR/tmp`.

```python
from playwright.sync_api import sync_playwright
import os
out = os.environ["CLAUDE_JOB_DIR"] + "/tmp"
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto("http://localhost:3030", wait_until="networkidle"); pg.wait_for_timeout(1200)
    pg.screenshot(path=f"{out}/p1-default.png", full_page=True)
    pg.get_by_role("button", name="Explore").click(); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{out}/p1-explore.png", full_page=True)
    pg.get_by_role("button", name="Explore").click()
    pg.get_by_role("button", name=lambda n: n and "Verify" in n).first.click(); pg.wait_for_timeout(400)
    pg.get_by_role("button", name="Try changing the record").click(); pg.wait_for_timeout(600)
    pg.screenshot(path=f"{out}/p1-verify-tamper.png", full_page=True)
    b.close()
```

- [ ] **Step 3: Eyeball each screenshot against the design.** Checklist: default view is calm (no dark canvas, no tier bar, tools hidden); the 2D graph is the hero with legible labels; the header reads "How this project was built" + subtitle + "Demo data" + a "Verify" button; Explore reveals search/filter/add/ledger; Verify shows the plain line, and the tamper toggle visibly breaks the seal (✕ + before/after roots). Note any layout breakage and fix before opening the PR.

- [ ] **Step 4: Update the Playwright e2e specs.** In `e2e/smoke.spec.ts`, update the three tier/canvas specs: the load spec asserts the 2D `svg.constellation` mounts and there is **no** `canvas`; delete the "reduced-motion forces calm-2D tier" and "no-WebGL → calm-2D fallback" specs (the tier machinery they test is gone); keep the Verify seal spec (retarget its assertions to the plain line + header button). These are not in the vitest gate but must stay coherent.

- [ ] **Step 5: Commit any e2e/fixups.**

```bash
git add -A
git commit -m "test(evidence): update e2e smoke for the 2D-only surface"
```

---

## Self-Review (against the spec)

**Spec coverage:**
- §3 vocabulary → Task 4 (header/stats/gloss) + Task 5 (verify line/tamper). ✔
- §4 layout (single column, graph hero, Play button, header Verify, Explore disclosure) → Tasks 2 + 3. Note: the timeline scrubber ("Play the story" control) already exists (`TimeScrub`) and stays in the stage; Story Mode (auto-advance) is Phase 2. ✔
- §5 retire 3D (delete cosmos, drop deps, keep view package) → Task 1. ✔
- §7 invariants (domain untouched, no new boundary import, DOM Ledger stays the a11y source of truth inside Explore) → held across all tasks; `no-3d`/`structure` guards enforce. ✔
- §8 tests (update motion-budget/a11y, delete cosmos-rng, add verify/explore/story tests, keep smoke) → Tasks 1, 3, 5, 6. Story-mode tests are Phase 2. ✔

**Placeholder scan:** No TBD/TODO. Every code step has real code or a precise edit. Two explicit "confirm the exact identifier" notes (the `verified` boolean field on `SyntheticVerification`; the `NodeType` member spelling) are verification instructions, not placeholders — the implementer confirms one name against a named source file.

**Type consistency:** `verifyVisual: VerifyVisualState` is produced by Task 1's `ObservatoryStage` prop and consumed by Task 2's `Observatory` wiring. `AppliedBundle` (from `AddPanel`) flows Observatory → ExplorePanel → AddPanel unchanged. `nodeGloss(type: NodeType)`/`verifyLine(verified: boolean)` signatures match their call sites in Tasks 4–5. `useHud()` loses `tierOverride`/`setTierOverride` in Task 1 and nothing downstream reads them (Hud/Ledger don't; only the deleted stage code did).

**Scope:** Phase 1 only. Story Mode (spec §6) is deferred to its own plan.
