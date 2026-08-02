# Guide Console PR 2 — vocabulary + cleanups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the guide console read in plain words and stop repeating itself — rename the jargon a guide meets (tab, stages, one tile), retire the glossary, dedupe the specialization list, surface the carer content, and bump the tiniest caps to legible.

**Architecture:** All changes live in `passion/apps/guide-console`. §4 is copy: one shared vocab map (`vocab.ts`) drives every stage label, so renaming there propagates to the pills, rail, filters and Overview table at once; the technical term rides along on the existing `title=`/`aria-label` (no consumer changes). §5 is a JSX move (fold a duplicated table into a `<details>`), one tab label, and a CSS size floor. No engine, package, or logic changes.

**Tech Stack:** Next.js 14 / React 18, TypeScript, vitest, biome, pnpm workspaces. CSS is hand-authored `globals.css` over `@gt100k/design-tokens`.

## Global Constraints

- Scope is `passion/apps/guide-console/**` only (spec §Scope). Touch no other package.
- **Do not touch `@gt100k/wellbeing`** or any engine; this PR is presentational.
- No new package, no barrel `index.ts`, no cross-`evidence-*` runtime import (`import type` OK).
- **No em dashes** in guide-facing copy. Preserve the Unicode minus `−` already in trend labels; do not regress to ASCII `-`.
- Preserve the review's working list: NEXT TEST sentences, POINTS TO IT / POINTS AWAY, PROMOTE gated on 3/3, "A check on our read", Family coaching content, Coverage's `X of Y areas we can observe` denominator.
- §5c contrast is **basic legibility, not accessibility-parity** (parity deprioritized 2026-07-28). Never record parity as satisfied.
- Conventional Commits. PR `< ~400 lines`, draft, opened as `f15cubing` (the operator), base = `dev/prd/guide-console-attention` (stacked on PR 1). Never push to `main`.
- Run `pnpm lint` / `pnpm typecheck` / `pnpm test` from `passion/apps/guide-console` before shipping.

---

### Task 1: Plain stage labels, technical term on hover (§4 · `vocab.ts`)

**Files:**
- Modify: `passion/apps/guide-console/app/vocab.ts:98-113` (the `STATES` map)

**Interfaces:**
- Consumes: nothing new.
- Produces: `stateTerm(key).label` now returns the plain phrase; `stateTerm(key).desc` now begins with the technical term. Every consumer (`StatePill`, `SpecRail`, `SpecScope`, `FilterNav`, Overview `r.stage`) already renders `.label` visibly and `.desc` on `title=`/`aria-label`, so both surfaces update with no consumer edit.

Only the four progression states in the spec's working set change. `EXPLORING`, `CONTESTED`, `REOPENED` are already ordinary English and stay as-is (scope discipline).

- [ ] **Step 1: Rename the four labels and prepend the old term to each desc**

In `STATES`, replace the `EMERGING`, `CANDIDATE`, `ACTIVE`, `PARKED` entries with:

```ts
  EMERGING: {
    label: "Taking hold",
    desc: "Emerging: a real pattern is forming. Worth watching and giving more chances to.",
  },
  CANDIDATE: {
    label: "Worth a real look",
    desc: "Candidate: strong, durable signal. Ready to consider specializing.",
  },
  ACTIVE: {
    label: "Committed",
    desc: "Active: an owned specialization the child is actively building.",
  },
  PARKED: {
    label: "Set aside",
    desc: "Parked: set aside for now. Fully reversible; can be reopened anytime.",
  },
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter @gt100k/guide-console exec tsc -b` (or `pnpm typecheck` at repo root)
Expected: PASS.

- [ ] **Step 3: Run the plain-language guard + overview tests**

Run: `pnpm --filter @gt100k/guide-console test`
Expected: PASS. The plain-language guard checks engine strings, not these labels; no test asserts the old words.

- [ ] **Step 4: Commit**

```bash
git add passion/apps/guide-console/app/vocab.ts
git commit -m "feat(guide-console): plain stage labels, technical term on hover"
```

---

### Task 2: Hypotheses → Interests (§4 · `console.tsx`, `components.tsx`)

**Files:**
- Modify: `passion/apps/guide-console/app/console.tsx:129` (tab label)
- Modify: `passion/apps/guide-console/app/components.tsx:319` (FilterNav "ALL" label)
- Modify: `passion/apps/guide-console/app/components.tsx:534` (EmptyState copy)

Internal identifiers (`type View = "hypotheses"`, `HypothesisCard`, `hypothesisId`) are not guide-facing and stay unchanged.

- [ ] **Step 1: Rename the tab**

`console.tsx`, in the `tabs` array, the `hypotheses` entry:

```tsx
    {
      id: "hypotheses",
      label: "Interests",
      noun: "specializations",
      count: ctrl.vm.cards.length,
    },
```

- [ ] **Step 2: Rename the "All" filter and the empty-state copy**

`components.tsx` FilterNav:

```tsx
    { key: "ALL" as const, label: "All interests", count: ctrl.vm.cards.length },
```

`components.tsx` EmptyState:

```tsx
        : "No interests in this view."}
```

- [ ] **Step 3: Typecheck + test**

Run: `pnpm --filter @gt100k/guide-console exec tsc -b && pnpm --filter @gt100k/guide-console test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add passion/apps/guide-console/app/console.tsx passion/apps/guide-console/app/components.tsx
git commit -m "feat(guide-console): rename Hypotheses tab to Interests"
```

---

### Task 3: Depth signals → Going deeper (§4 · `overview.ts`, `overview-panel.tsx`)

**Files:**
- Modify: `passion/apps/guide-console/app/overview.ts:423,429`
- Modify: `passion/apps/guide-console/app/overview-panel.tsx:364`

The citation id `depth-signals` (a stable key in `TILE_CLAIMS`/`citations.test.ts`) is NOT a display label and must stay unchanged.

- [ ] **Step 1: Rename the tile label and its trend noun**

`overview.ts`, in the depth tile:

```ts
      label: "Going deeper",
```
and the trend call on the next line:
```ts
      trend: trendFrom(depthPrev, depthCurr, windowDays, "Going deeper"),
```

- [ ] **Step 2: Rename the screen-reader series sentence**

`overview-panel.tsx`, `EngagementCard`:

```tsx
            {seriesSentence("Going deeper by week", s.labels, s.b)}
```

- [ ] **Step 3: Typecheck + test**

Run: `pnpm --filter @gt100k/guide-console exec tsc -b && pnpm --filter @gt100k/guide-console test`
Expected: PASS. `citations.test.ts` keys on the id `depth-signals`, not the label.

- [ ] **Step 4: Commit**

```bash
git add passion/apps/guide-console/app/overview.ts passion/apps/guide-console/app/overview-panel.tsx
git commit -m "feat(guide-console): rename Depth signals tile to Going deeper"
```

---

### Task 4: Retire the glossary (§4 · `console.tsx`, `components.tsx`, `globals.css`)

The plain labels + hover tips make the Key redundant. It is not referenced by any test or the QA gate.

**Files:**
- Modify: `passion/apps/guide-console/app/console.tsx:14,305` (import + render)
- Modify: `passion/apps/guide-console/app/components.tsx:12-24,540-570` (imports + `Legend`)
- Modify: `passion/apps/guide-console/app/globals.css` (the `/* ── The Key (Legend) ── */` block starting line 1701)

- [ ] **Step 1: Remove the `<Legend />` render and its import in `console.tsx`**

Delete the `<Legend />` line (currently `console.tsx:305`). In the components import (line 14), drop `Legend`:

```tsx
import { ChildSwitcher, EmptyState, SpecCard, SpecRail, SpecScope } from "./components.js";
```

- [ ] **Step 2: Delete the `Legend` component and its now-unused imports in `components.tsx`**

Delete the entire `export function Legend(...) { ... }` block (currently lines 540-570). Then in the `vocab.js` import block (lines 12-24), remove the three symbols only `Legend` used — `ACTIONS`, `SIGNALS`, `STATES` — leaving `actionTerm`, `attributionTerm`, `domainLabel`, `modeLabel`, `modeTerm`, `signal`, `specPath`, `stateTerm`.

- [ ] **Step 3: Delete the Legend CSS block in `globals.css`**

Remove from the `/* ── The Key (Legend) ──` header through the last `.legend*` rule, up to (not including) the next section-header comment. Verify the boundary first:

```bash
awk 'NR>=1701 && /^\/\* ─/{print NR": "$0}' passion/apps/guide-console/app/globals.css | head
```
Delete only the Legend rules between the first such header and the next.

- [ ] **Step 4: Lint + typecheck (catches any missed unused import)**

Run: `pnpm --filter @gt100k/guide-console exec biome check app/ && pnpm --filter @gt100k/guide-console exec tsc -b`
Expected: PASS, no "unused import" / "unused variable" errors.

- [ ] **Step 5: Test**

Run: `pnpm --filter @gt100k/guide-console test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/guide-console/app/console.tsx passion/apps/guide-console/app/components.tsx passion/apps/guide-console/app/globals.css
git commit -m "feat(guide-console): retire the glossary now that terms self-explain"
```

---

### Task 5: Dedupe the specialization list (§5 · `overview-panel.tsx`)

The Interests tab renders every specialization as bars (canonical, from PR 1), plus the Overview "Specializations" table — a third full re-render alongside the `SpecRail`. Fold the table into a collapsed `<details>` so it is on-demand reference, not a third always-on list. The bars stay canonical; `SpecRail` (navigation) is untouched.

**Files:**
- Modify: `passion/apps/guide-console/app/overview-panel.tsx:155-245` (the Specializations `<section>` and its lead comment)

- [ ] **Step 1: Wrap the Specializations `<section>` in a collapsed `<details>` and rewrite the lead comment**

Replace the comment block at lines 155-159 and wrap the existing `<section className="card"> ... Specializations table ... </section>` so it reads:

```tsx
      {/* The specialization list already shows twice on this tab as the canonical read: the bars
          above (each spike, click to open) and the rail beside them (navigation that scopes the
          other tabs). This table is the same set a third time, so it folds away as on-demand
          reference — the tabular detail (stage, confidence, visits, status) for a guide who wants
          it, out of the way of the guide who does not. Reuses the .ovcharts disclosure styling. */}
      <details className="ovcharts">
        <summary className="ovcharts__summary">Show the specializations table</summary>
        <section className="card">
          {/* ...existing Specializations header + table, unchanged... */}
        </section>
      </details>
```

Keep the table's `<section>`, header, `Blank`, and the `<table className="ov-tbl">` exactly as they are, including the `onReview` Open buttons.

- [ ] **Step 2: Typecheck + test**

Run: `pnpm --filter @gt100k/guide-console exec tsc -b && pnpm --filter @gt100k/guide-console test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add passion/apps/guide-console/app/overview-panel.tsx
git commit -m "feat(guide-console): fold the duplicate specializations table into a disclosure"
```

---

### Task 6: Family → Family & coaching (§5 · `console.tsx`)

**Files:**
- Modify: `passion/apps/guide-console/app/console.tsx:142`

`access-panel.tsx:41` (`FAMILY: "Family"`) is an audience-segment label, a different concept — do NOT change it.

- [ ] **Step 1: Rename the tab**

`console.tsx`, the `family` tab entry:

```tsx
      label: "Family & coaching",
```

- [ ] **Step 2: Typecheck + test**

Run: `pnpm --filter @gt100k/guide-console exec tsc -b && pnpm --filter @gt100k/guide-console test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add passion/apps/guide-console/app/console.tsx
git commit -m "feat(guide-console): relabel Family tab to Family & coaching"
```

---

### Task 7: Contrast / legibility caps floor (§5 · `globals.css`)

Basic legibility only. The palette's text tokens already clear AA (contrast policy at `globals.css:34-40`; `--bad` is dark red `#c41c1c` and `--bad-bg` a background behind it). The concrete residual is the tiniest uppercase micro-caps. Raise them to the console's 0.68rem caps floor.

**Files:**
- Modify: `passion/apps/guide-console/app/globals.css` — `.railitem__flag` (0.62rem), `.probe2__k`, `.wbstrip__k`, `.wbstrip__reviewk`, `.why-pop__srck` (0.66rem)

- [ ] **Step 1: Bump each sub-0.68rem uppercase cap to 0.68rem**

For each of the five selectors above, change its `font-size` to `0.68rem`. Confirm the set first:

```bash
grep -nE "\.railitem__flag|\.probe2__k|\.wbstrip__k|\.wbstrip__reviewk|\.why-pop__srck" passion/apps/guide-console/app/globals.css
```

- [ ] **Step 2: Lint (biome formats CSS) + typecheck**

Run: `pnpm --filter @gt100k/guide-console exec biome check app/ && pnpm --filter @gt100k/guide-console exec tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add passion/apps/guide-console/app/globals.css
git commit -m "style(guide-console): raise tiny caps to a legible 0.68rem floor"
```

---

### Task 8: Verify and ship

- [ ] **Step 1: Full local gates**

Run from `passion/apps/guide-console`:
```bash
pnpm exec biome check app/ && pnpm exec tsc -b && pnpm test
```
Expected: all PASS.

- [ ] **Step 2: Visual smoke** (a stale `next dev` from another checkout may hold the usual port; start a fresh server on an unused port, `rm -rf .next` if it flaps). Confirm: tab reads "Interests", pills read "Taking hold"/"Committed"/etc. with the technical term on hover, no Key at the bottom, the specializations table is behind a disclosure, the Family tab reads "Family & coaching".

- [ ] **Step 3: Push and open the stacked draft PR**

```bash
git push -u origin dev/prd/guide-console-vocab
gh pr create --draft --base dev/prd/guide-console-attention \
  --title "feat(guide-console): plain vocabulary + cleanups (PR 2)" \
  --body "<summary; Closes the §4/§5 items of the action-first design spec; stacked on #264>"
```

## Self-Review

**Spec coverage:** §4 tab rename (Task 2), stage labels + hover (Task 1), Depth signals→Going deeper (Task 3), retire glossary (Task 4). §5 dedupe (Task 5), Family relabel (Task 6), contrast (Task 7). All covered.

**Placeholder scan:** PR body summary is the only free-text; all code steps carry concrete before/after. OK.

**Type consistency:** No new types. `stateTerm`/`signal`/`actionTerm` signatures unchanged; only `STATES` values change. `Legend` removal drops exactly the `ACTIONS`/`SIGNALS`/`STATES` imports it alone used. OK.

**Preserved-list check:** No task touches NEXT TEST, POINTS TO/AWAY, the 3/3 gate, "A check on our read", Family content, or the Coverage denominator. The Unicode `−` in trend labels is untouched (Task 3 changes only the noun string). OK.
