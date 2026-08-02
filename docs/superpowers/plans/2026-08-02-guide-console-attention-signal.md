# Guide Console — Attention Signal (PR 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the guide console a single per-child attention verdict (`Needs you / Ready / Steady`) that drives a scannable roster and a per-child action line, and stop the stat tiles printing extreme percentages on tiny samples.

**Architecture:** A pure app-layer module `app/attention.ts` folds three already-composed inputs (wellbeing escalation, engagement fading, gate-ready) into one verdict, priority-ordered safety→opportunity→quiet. A pure `app/engagement.ts` computes the voluntary-returns trend with a minimum-count guard; `overview.ts`'s generic `trendFrom` reuses that guard. `useConsole.ts` adapts the domain view-models into the narrow inputs and exposes an `Attention` per child; `ChildSwitcher` and a new action line render it.

**Tech Stack:** TypeScript, React 18, Next 14, vitest (node env, `test/**/*.test.ts`), biome.

## Global Constraints

- Package manager: **pnpm**. Gates before PR: `pnpm lint`, `pnpm typecheck`, `pnpm test` (run from repo root or the app).
- Copy rule (from `app/vocab.ts`): **no em dashes in any console copy.** Use periods or hyphens.
- Lane rules (AGENTS.md): prefer NEW files; no barrel `index.ts`; no runtime import across `@gt100k/evidence-*`; Conventional Commits; PR `< ~400 lines`.
- Do NOT modify the `@gt100k/wellbeing` engine. The console surfaces what it returns.
- Reuse `STATE_LABEL` exported from `app/wellbeing-strip.tsx` for wellbeing headlines (single source of words).

---

### Task 1: Engagement trend helper (`app/engagement.ts`)

**Files:**
- Create: `passion/apps/guide-console/app/engagement.ts`
- Test: `passion/apps/guide-console/test/engagement.test.ts`

**Interfaces:**
- Produces:
  - `MIN_TREND_EVENTS = 5` (exported const; shared threshold).
  - `interface VoluntaryTrend { prev: number; curr: number; windowDays: number; pct: number | null; fading: boolean; }`
  - `computeVoluntaryTrend(interactions: readonly { prompted?: boolean; timestamp: string }[]): VoluntaryTrend` — pure core.
  - `voluntaryReturns(kidId: string): VoluntaryTrend` — thin wrapper reading `profileFor(kidId)?.interactions`.

- [ ] **Step 1: Write the failing test**

```ts
// test/engagement.test.ts
import { describe, expect, it } from "vitest";
import { computeVoluntaryTrend } from "../app/engagement.js";

const at = (day: number, prompted = false) => ({
  prompted,
  timestamp: new Date(2026, 0, day).toISOString(),
});

describe("computeVoluntaryTrend", () => {
  it("reports fading when voluntary returns drop across a real window", () => {
    // First half (days 1-15): 6 voluntary. Second half (days 16-30): 1 voluntary.
    const log = [
      ...Array.from({ length: 6 }, (_, i) => at(2 + i)),
      at(28),
    ];
    const t = computeVoluntaryTrend(log);
    expect(t.fading).toBe(true);
    expect(t.pct).not.toBeNull();
    expect(t.pct!).toBeLessThan(0);
  });

  it("omits the trend and never fades on a tiny sample (guard)", () => {
    // prev=2, curr=0 -> the -100% bug. Guard: prev+curr < MIN_TREND_EVENTS.
    const log = [at(2), at(3), at(20, false)]; // 2 in first half, then 1 -> total 3 < 5
    const t = computeVoluntaryTrend([at(2), at(3)]); // prev=2, curr=0, total 2
    expect(t.fading).toBe(false);
    expect(t.pct).toBeNull();
    void log;
  });

  it("does not fade on an empty log", () => {
    const t = computeVoluntaryTrend([]);
    expect(t.fading).toBe(false);
    expect(t.pct).toBeNull();
    expect(t.windowDays).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd passion/apps/guide-console && pnpm exec vitest run test/engagement.test.ts`
Expected: FAIL — `computeVoluntaryTrend` not found.

- [ ] **Step 3: Write the implementation**

```ts
// app/engagement.ts
// Pure voluntary-returns trend for the guide console. Splits the child's observed window into two
// equal halves and compares voluntary (unprompted) returns in the later half against the earlier
// one. A minimum-count guard suppresses the percentage on tiny samples, because "-100% vs a
// two-visit baseline" reads identically to a large-sample collapse and is not an honest fact.
import { profileFor } from "./console-data.js";

export const MIN_TREND_EVENTS = 5;
const MIN_TREND_WINDOW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface VoluntaryTrend {
  readonly prev: number;
  readonly curr: number;
  readonly windowDays: number;
  readonly pct: number | null;
  readonly fading: boolean;
}

const EMPTY: VoluntaryTrend = { prev: 0, curr: 0, windowDays: 0, pct: null, fading: false };

export function computeVoluntaryTrend(
  interactions: readonly { prompted?: boolean; timestamp: string }[],
): VoluntaryTrend {
  if (interactions.length === 0) return EMPTY;
  const log = [...interactions].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
  const first = Date.parse(log[0]!.timestamp);
  const last = Date.parse(log[log.length - 1]!.timestamp);
  const windowDays = (last - first) / DAY_MS;
  const midpoint = first + (last - first) / 2;
  let prev = 0;
  let curr = 0;
  for (const i of log) {
    if (i.prompted) continue;
    if (Date.parse(i.timestamp) < midpoint) prev += 1;
    else curr += 1;
  }
  const guarded = windowDays >= MIN_TREND_WINDOW_DAYS && prev + curr >= MIN_TREND_EVENTS;
  if (!guarded || prev <= 0) {
    return { prev, curr, windowDays, pct: null, fading: false };
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { prev, curr, windowDays, pct, fading: curr < prev };
}

export function voluntaryReturns(kidId: string): VoluntaryTrend {
  return computeVoluntaryTrend(profileFor(kidId)?.interactions ?? []);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/engagement.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/engagement.ts passion/apps/guide-console/test/engagement.test.ts
git commit -m "feat(guide-console): guarded voluntary-returns trend helper"
```

---

### Task 2: Reuse the guard in `overview.ts`

**Files:**
- Modify: `passion/apps/guide-console/app/overview.ts` (const at line ~25; `trendFrom` at line ~196)
- Test: `passion/apps/guide-console/test/overview.test.ts` (append)

**Interfaces:**
- Consumes: `MIN_TREND_EVENTS` from `./engagement.js`.

- [ ] **Step 1: Write the failing test** (append to `test/overview.test.ts`)

```ts
import { buildOverview } from "../app/overview.js";
// ...within the existing describe, or a new one:
it("omits a trend chip when the sample is below the minimum count", () => {
  // Any child whose voluntary/depth halves sum below MIN_TREND_EVENTS must not show a % chip.
  // Assert via the built tiles: no tile.trend has a label like a huge percentage on tiny n.
  // (Use a roster child known to be sparse; see console-data header: Cyrus is sparse.)
  // This is a guard regression: prev=2/curr=0 must yield trend === null, not "-100%".
});
```

Note: replace the placeholder body with a concrete assertion once the sparse child's id is read from `children()` in the test (see existing `overview.test.ts` for how it obtains a kid + cards). The assertion: for the sparse child, `tiles.find(t => t.key === "voluntary")!.trend` is `null` (or, if any tile has a trend, its `label` never equals `"−100%"`).

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/overview.test.ts`
Expected: FAIL — a `−100%` (or extreme) chip is present on the tiny sample.

- [ ] **Step 3: Implement — import the shared const and add the guard line**

In `overview.ts`:
1. Remove the local `const MIN_TREND_EVENTS = 5;` (line ~25) and import it:
   ```ts
   import { MIN_TREND_EVENTS } from "./engagement.js";
   ```
2. In `trendFrom`, add after the existing `if (previous <= 0) return null;`:
   ```ts
   if (previous + current < MIN_TREND_EVENTS) return null;
   ```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm exec vitest run test/overview.test.ts`
Expected: PASS. Existing overview tests still green.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/overview.ts passion/apps/guide-console/test/overview.test.ts
git commit -m "fix(guide-console): guard stat-tile trends against tiny-sample percentages"
```

---

### Task 3: The attention signal (`app/attention.ts`)

**Files:**
- Create: `passion/apps/guide-console/app/attention.ts`
- Test: `passion/apps/guide-console/test/attention.test.ts`

**Interfaces:**
- Consumes: `STATE_LABEL` from `./wellbeing-strip.js`; `specPath` from `./vocab.js`.
- Produces:
  - `type AttentionLevel = "NEEDS_YOU" | "READY" | "STEADY"`
  - `interface Attention { level: AttentionLevel; headline: string; reason: "WELLBEING" | "ENGAGEMENT_FADING" | "GATE_READY" | "STEADY"; specId: string | null; }`
  - `interface WellbeingSignal { id: string; state: string; escalateToHuman: boolean; domainPath: readonly string[]; }`
  - `interface CardSignal { id: string; gatePassed: boolean; domainPath: readonly string[]; }`
  - `interface AttentionInputs { wellbeing: readonly WellbeingSignal[]; cards: readonly CardSignal[]; fading: boolean; }`
  - `attentionFor(input: AttentionInputs): Attention`
  - `attentionRank(level: AttentionLevel): number` — 0 NEEDS_YOU, 1 READY, 2 STEADY (for stable roster sort).

- [ ] **Step 1: Write the failing test**

```ts
// test/attention.test.ts
import { describe, expect, it } from "vitest";
import { attentionFor, attentionRank, type AttentionInputs } from "../app/attention.js";

const base: AttentionInputs = { wellbeing: [], cards: [], fading: false };
const path = ["chess"];

describe("attentionFor", () => {
  it("is STEADY with no cards, no escalation, no fading", () => {
    const a = attentionFor(base);
    expect(a.level).toBe("STEADY");
    expect(a.reason).toBe("STEADY");
    expect(a.specId).toBeNull();
  });

  it("flags NEEDS_YOU on a wellbeing escalation, naming the worst state", () => {
    const a = attentionFor({
      ...base,
      wellbeing: [
        { id: "w1", state: "OVER_CHALLENGED", escalateToHuman: true, domainPath: path },
        { id: "w2", state: "BURNOUT_TIP", escalateToHuman: true, domainPath: path },
      ],
    });
    expect(a.level).toBe("NEEDS_YOU");
    expect(a.reason).toBe("WELLBEING");
    expect(a.specId).toBe("w2"); // BURNOUT_TIP outranks OVER_CHALLENGED
    expect(a.headline).toBe("Close to burning out");
  });

  it("flags NEEDS_YOU when engagement is fading even if wellbeing is calm", () => {
    const a = attentionFor({ ...base, fading: true });
    expect(a.level).toBe("NEEDS_YOU");
    expect(a.reason).toBe("ENGAGEMENT_FADING");
    expect(a.headline).toBe("Interest is cooling. Returns are down.");
  });

  it("wellbeing escalation wins over both fading and gate-ready", () => {
    const a = attentionFor({
      wellbeing: [{ id: "w1", state: "GAP", escalateToHuman: true, domainPath: path }],
      cards: [{ id: "c1", gatePassed: true, domainPath: path }],
      fading: true,
    });
    expect(a.reason).toBe("WELLBEING");
  });

  it("is READY when a gate has passed and nothing needs attention", () => {
    const a = attentionFor({
      ...base,
      cards: [
        { id: "c1", gatePassed: false, domainPath: path },
        { id: "c2", gatePassed: true, domainPath: ["music-sound"] },
      ],
    });
    expect(a.level).toBe("READY");
    expect(a.reason).toBe("GATE_READY");
    expect(a.specId).toBe("c2");
    expect(a.headline).toBe("Ready to promote Music & Sound");
  });

  it("ranks needs-you before ready before steady", () => {
    expect(attentionRank("NEEDS_YOU")).toBeLessThan(attentionRank("READY"));
    expect(attentionRank("READY")).toBeLessThan(attentionRank("STEADY"));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run test/attention.test.ts`
Expected: FAIL — `attentionFor` not found.

- [ ] **Step 3: Write the implementation**

```ts
// app/attention.ts
// One attention verdict per child: what does this child need from me right now? Priority order
// mirrors the wellbeing engine's own ordering: safety first (a wellbeing escalation), then a fading
// interest (engagement is cooling even if affect is calm -- a calm read must not stand alone over a
// dying interest), then opportunity (a promote gate has passed), then quiet. Pure and deterministic.
import { specPath } from "./vocab.js";
import { STATE_LABEL } from "./wellbeing-strip.js";

export type AttentionLevel = "NEEDS_YOU" | "READY" | "STEADY";

export interface Attention {
  readonly level: AttentionLevel;
  readonly headline: string;
  readonly reason: "WELLBEING" | "ENGAGEMENT_FADING" | "GATE_READY" | "STEADY";
  readonly specId: string | null;
}

export interface WellbeingSignal {
  readonly id: string;
  readonly state: string;
  readonly escalateToHuman: boolean;
  readonly domainPath: readonly string[];
}

export interface CardSignal {
  readonly id: string;
  readonly gatePassed: boolean;
  readonly domainPath: readonly string[];
}

export interface AttentionInputs {
  readonly wellbeing: readonly WellbeingSignal[];
  readonly cards: readonly CardSignal[];
  readonly fading: boolean;
}

// Severity for choosing which escalating spike names the headline. Matches assess.ts priority.
const SEVERITY: Record<string, number> = {
  BURNOUT_TIP: 6,
  EARLY_BURNOUT: 5,
  GAP: 4,
  DANGER_WINDOW: 3,
  OVER_CHALLENGED: 2,
};

export function attentionRank(level: AttentionLevel): number {
  return level === "NEEDS_YOU" ? 0 : level === "READY" ? 1 : 2;
}

export function attentionFor(input: AttentionInputs): Attention {
  const escalating = input.wellbeing.filter((w) => w.escalateToHuman);
  if (escalating.length > 0) {
    const worst = [...escalating].sort(
      (a, b) => (SEVERITY[b.state] ?? 0) - (SEVERITY[a.state] ?? 0),
    )[0]!;
    return {
      level: "NEEDS_YOU",
      reason: "WELLBEING",
      specId: worst.id,
      headline: STATE_LABEL[worst.state] ?? worst.state,
    };
  }
  if (input.fading) {
    return {
      level: "NEEDS_YOU",
      reason: "ENGAGEMENT_FADING",
      specId: null,
      headline: "Interest is cooling. Returns are down.",
    };
  }
  const ready = input.cards.find((c) => c.gatePassed);
  if (ready) {
    return {
      level: "READY",
      reason: "GATE_READY",
      specId: ready.id,
      headline: `Ready to promote ${specPath(ready.domainPath)}`,
    };
  }
  return { level: "STEADY", reason: "STEADY", specId: null, headline: "Steady. Nothing needs you." };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run test/attention.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/attention.ts passion/apps/guide-console/test/attention.test.ts
git commit -m "feat(guide-console): unified per-child attention verdict"
```

---

### Task 4: Wire the verdict through `useConsole.ts`

**Files:**
- Modify: `passion/apps/guide-console/app/useConsole.ts` (`ChildSummary` lines 35-39; summaries lines 150-161; add `attention` to selected-child return)

**Interfaces:**
- Consumes: `attentionFor`, `type Attention` from `./attention.js`; `voluntaryReturns` from `./engagement.js`; `wellbeingForKid` (already imported).
- Produces: `ChildSummary` gains `attention: Attention`. Controller gains `attention: Attention` for the selected child.

- [ ] **Step 1: Add an adapter + extend summaries**

Add a module-local helper (top of file, after imports):
```ts
import { attentionFor, type Attention } from "./attention.js";
import { voluntaryReturns } from "./engagement.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";
import type { WellbeingCardVM } from "./wellbeing.js";

function attentionForKid(
  kidId: string,
  cards: readonly HypothesisCard[],
  wb: readonly WellbeingCardVM[],
): Attention {
  return attentionFor({
    wellbeing: wb.map((w) => ({
      id: w.id,
      state: w.read.state,
      escalateToHuman: w.read.escalateToHuman,
      domainPath: w.domainPath,
    })),
    cards: cards.map((c) => ({
      id: c.id,
      gatePassed: c.gate?.passed === true,
      domainPath: c.domainPath,
    })),
    fading: voluntaryReturns(kidId).fading,
  });
}
```

Extend `ChildSummary`:
```ts
export interface ChildSummary {
  readonly tracked: number;
  readonly gateReady: number;
  readonly topState: string | null;
  readonly attention: Attention;
}
```

In the `summaries` memo, compute wellbeing per child and set `attention`:
```ts
const summaries = useMemo(() => {
  const m = new Map<string, ChildSummary>();
  for (const child of children()) {
    const cvm = consoleViewModel(store, child.id, gates);
    const wb = wellbeingForKid(child.id);
    m.set(child.id, {
      tracked: cvm.cards.length,
      gateReady: cvm.cards.filter((c) => c.gate?.passed === true).length,
      topState: cvm.cards[0]?.state ?? null,
      attention: attentionForKid(child.id, cvm.cards, wb),
    });
  }
  return m;
}, [store, gates]);
```

Expose the selected child's attention (reuse the already-memoized `vm` + `wellbeing`):
```ts
const attention = useMemo(
  () => attentionForKid(kid, vm.cards, wellbeing),
  [kid, vm.cards, wellbeing],
);
```
Add `attention` to the returned object.

- [ ] **Step 2: Typecheck**

Run: `cd passion/apps/guide-console && pnpm exec tsc -b`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add passion/apps/guide-console/app/useConsole.ts
git commit -m "feat(guide-console): expose per-child attention from the controller"
```

---

### Task 5: Roster shows the verdict and sorts by it (`components.tsx`)

**Files:**
- Modify: `passion/apps/guide-console/app/components.tsx` (`ChildSwitcher` lines 352-403)
- Modify: `passion/apps/guide-console/app/console.css` (or the app's stylesheet — locate the `.kid__sub` rule and add level styles)

**Interfaces:**
- Consumes: `s.attention` (`Attention`) on each `ChildSummary`; `attentionRank` from `./attention.js`.

- [ ] **Step 1: Sort the list by attention, then render the verdict**

In `ChildSwitcher`, after building `list`, sort a copy by rank (stable; keep roster order within a level):
```ts
import { attentionRank } from "./attention.js";
// ...
const ranked = [...list].sort((a, b) => {
  const sa = ctrl.summaries.get(a.id)?.attention.level ?? "STEADY";
  const sb = ctrl.summaries.get(b.id)?.attention.level ?? "STEADY";
  return attentionRank(sa) - attentionRank(sb);
});
```
Map over `ranked` instead of `list`. Replace the `kid__sub` line:
```tsx
const a = s.attention;
// ...
<span className="kid__meta">
  <span className="kid__name">{c.name}</span>
  <span className={`kid__flag kid__flag--${a.level.toLowerCase()}`}>
    <span className="kid__dot" aria-hidden="true" />
    <span className="kid__flagword">
      {a.level === "NEEDS_YOU" ? "Needs you" : a.level === "READY" ? "Ready" : "Steady"}
    </span>
    <span className="kid__headline">{a.headline}</span>
  </span>
  <span className="kid__sub kid__sub--muted">{s.tracked} tracked</span>
</span>
```

- [ ] **Step 2: Add styles** (append to the app stylesheet; match existing token vars)

```css
.kid__flag { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.kid__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok, #4a6470); }
.kid__flag--needs_you .kid__dot { background: #c0492b; }
.kid__flag--ready .kid__dot { background: #2f7d55; }
.kid__flag--steady .kid__dot { background: #93a4ad; }
.kid__flagword { font-weight: 600; }
.kid__headline { color: #4a6470; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kid__sub--muted { color: #93a4ad; font-size: 11px; }
```
(Adjust colors to the app's existing two-level ink tokens if present.)

- [ ] **Step 3: Typecheck + run the app**

Run: `pnpm exec tsc -b && pnpm test`
Then visually confirm on the dev server (port 3025) the roster shows Needs you / Ready / Steady and sorts most-urgent first.

- [ ] **Step 4: Commit**

```bash
git add passion/apps/guide-console/app/components.tsx passion/apps/guide-console/app/*.css
git commit -m "feat(guide-console): triage roster by attention verdict"
```

---

### Task 6: Per-child action line (`console.tsx`)

**Files:**
- Create: `passion/apps/guide-console/app/action-line.tsx`
- Modify: `passion/apps/guide-console/app/console.tsx` (inside `<main className="main main--wb">`, before `<header className="ghead">`, line ~208)

**Interfaces:**
- Consumes: `ctrl.attention` (`Attention`); `ctrl.promotableId`, `ctrl.advanceTop`, `ctrl.setSelectedId` for the primary action.

- [ ] **Step 1: Create the action line component**

```tsx
// app/action-line.tsx
// The one line a guide reads first: what this child needs right now, and the single button that
// does it. Everything below is here only if they choose to investigate.
import type { JSX } from "react";
import type { ConsoleController } from "./useConsole.js";

export function ActionLine({ ctrl }: { ctrl: ConsoleController }): JSX.Element | null {
  const a = ctrl.attention;
  const word = a.level === "NEEDS_YOU" ? "Needs you" : a.level === "READY" ? "Ready" : "Steady";
  return (
    <section className={`actionline actionline--${a.level.toLowerCase()}`} aria-label="What to do next">
      <span className="actionline__dot" aria-hidden="true" />
      <span className="actionline__word">{word}</span>
      <span className="actionline__headline">{a.headline}</span>
      {a.reason === "GATE_READY" && ctrl.promotableId ? (
        <button type="button" className="actionline__do" onClick={ctrl.advanceTop}>
          Promote
        </button>
      ) : a.specId ? (
        <button
          type="button"
          className="actionline__do actionline__do--review"
          onClick={() => ctrl.setSelectedId(a.specId)}
        >
          Review
        </button>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 2: Mount it in `console.tsx`**

Add the import and render `<ActionLine ctrl={ctrl} />` as the first child of `<main className="main main--wb">`, above `<header className="ghead">`.

- [ ] **Step 3: Add styles** (app stylesheet)

```css
.actionline { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 10px; margin-bottom: 10px; background: #f3efe7; }
.actionline__dot { width: 10px; height: 10px; border-radius: 50%; }
.actionline--needs_you { background: #fbeee9; } .actionline--needs_you .actionline__dot { background: #c0492b; }
.actionline--ready .actionline__dot { background: #2f7d55; }
.actionline--steady .actionline__dot { background: #93a4ad; }
.actionline__word { font-weight: 700; color: #33505c; }
.actionline__headline { color: #4a6470; flex: 1; }
.actionline__do { border: 0; border-radius: 8px; padding: 6px 12px; font-weight: 600; cursor: pointer; background: #33505c; color: #fff; }
.actionline__do--review { background: #c0492b; }
```

- [ ] **Step 4: Typecheck + run**

Run: `pnpm exec tsc -b && pnpm test`
Visually confirm on port 3025: switching children updates the action line; Promote/Review fire.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/guide-console/app/action-line.tsx passion/apps/guide-console/app/console.tsx passion/apps/guide-console/app/*.css
git commit -m "feat(guide-console): action line — do-this-next above the tabs"
```

---

### Task 7: Gates + PR

- [ ] **Step 1: Full gates**

Run (repo root): `pnpm lint && pnpm typecheck && pnpm test`
Then app build parity: `cd passion/apps/guide-console && pnpm build` (CI builds every app under `passion/apps/`).

- [ ] **Step 2: Push branch and open a draft PR as spinkicks**

```bash
git push -u origin worktree-guide-console-work
gh pr create --draft --title "feat(guide-console): action-first attention signal (PR 1)" \
  --body "Implements §1-§3 of docs/superpowers/specs/2026-08-02-guide-console-action-first-design.md ..."
```
Never push to `main`. PR body references the spec and lists the honesty fix.

## Self-Review

- **Spec coverage:** §1 → Tasks 3-4; §2 → Tasks 1-2; §3 (roster) → Task 5; §3 (action line + honest strip) → Task 6. §4 vocabulary and §5 cleanups are deliberately deferred to PR 2; §6 roster to PR 3 (noted in spec §7). ✓
- **Placeholder scan:** Task 2 Step 1 intentionally defers the concrete assertion to test-write time because it needs the sparse child's generated id from `children()`; every other step carries real code. Acceptable — it names exactly what to assert and where to get the id.
- **Type consistency:** `Attention`, `AttentionInputs`, `WellbeingSignal`, `CardSignal`, `attentionFor`, `attentionRank`, `VoluntaryTrend`, `computeVoluntaryTrend`, `voluntaryReturns`, `MIN_TREND_EVENTS` used identically across tasks. `ChildSummary.attention` produced in Task 4, consumed in Task 5. `ctrl.attention` produced in Task 4, consumed in Task 6. ✓
