# EvidenceGraph Story Mode (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided, auto-advancing "Story Mode" to the Evidence Explorer that plays the project's history forward like `git log` — a commit list beside the 2D graph, one plain caption per step, and a closing nudge to Verify.

**Architecture:** Presentation-only. A pure module (`story.ts`) holds the caption table, a real `shortHash`, and the playback step-math; a thin hook (`useStoryPlayback`) drives the *existing* reveal counter (`revealedCount`) on a timer; a `CommitLog` renders the git-log-style DAG list; a `StoryTransport` renders the caption + controls + end-nudge. The old `TimeScrub` scrubber is retired and folded into this surface. Nothing mutates the graph, view, or verification.

**Tech Stack:** Next.js 14.2 / React 18 / TypeScript (NodeNext, `.js` import extensions), pnpm, vitest (node env — text/pure tests, no DOM render), Playwright (manual e2e gate). Package: `@gt100k/evidence-explorer` at `passion/apps/evidence-explorer`.

## Global Constraints

Every task's requirements implicitly include these. Copy exact values verbatim.

- **Presentation-only, no domain mutation.** Story Mode only *reads* `ExplorerView` and calls `setRevealedCount` / `select` / `onOpenVerify`. It NEVER mutates `graph`, `view`, or `verification`, and adds NO new domain data. Captions live in the app layer.
- **Boundary.** The app (`@gt100k/evidence-explorer`) is inside the `@gt100k/evidence-*` namespace and may import values from `@gt100k/evidence-explorer-view` (it already imports `ExplorerView`). Story Mode code must NOT import from `@gt100k/evidence-graph` (the domain) — presentation reads the *view*, never the graph. (`import type` from the view package is also fine.)
- **Reduced motion.** No auto-advance under reduced motion — step-only (Prev/Next work; the Play button is hidden). Detected via `useHud().reducedMotion` (`components/hud-state.tsx`). The hook must also stop mid-play if reduced motion turns on.
- **Motion budget** (pinned by `test/motion-budget.test.ts`): any CSS you add may transition/animate ONLY `transform` / `opacity` / `filter` (plus non-layout props like `background-color` / `color`). NEVER transition a layout prop: width, height, top, left, right, bottom, inset, margin, padding, gap, flex, flex-basis, font-size, line-height, letter-spacing, border-width. Any new `@keyframes` animates only transform/opacity/filter. The global `@media (prefers-reduced-motion: reduce)` reset already zeroes durations — do not remove it.
- **Accessibility** (pinned by `test/a11y.test.ts`): the constellation `<svg>` stays `aria-hidden="true"` with NO accessible name; the DOM Ledger stays the accessible source of truth. New text (captions, commit rows) must be REAL DOM text, never a canvas-only cue. The caption line is an `aria-live="polite"` region.
- **Content-address is real.** Node ids are sha256 hex digests (`/^[0-9a-f]{64}$/`). `shortHash(id)` = the first 7 chars — a genuine git-style short hash, not theater. A guard test asserts the demo ids are 64-hex.
- **The DAG is not linear.** The commit list is chronological but must not imply one rope. A step whose node draws on more than one earlier step gets a merge cue; the graph edges remain the authoritative structure.
- **Captions keyed by beat position** (`birthOrder` 0–11), authored to the committed **speaker-v1** fixture. A guard test binds captions to the real beats so a fixture change fails loudly.
- **Tests are node-env, no DOM.** Use the `read()` text-helper for component/CSS source assertions and import pure modules directly (with `.js` extensions). Get a real view via `buildSyntheticExplorerView()` from `../components/synthetic-view.js`. Never render React in a test.
- **Gate** (must be green to complete any task): `pnpm --filter @gt100k/evidence-explorer test` AND `pnpm --filter @gt100k/evidence-explorer build`.
- **Commits:** Conventional Commits. Branch is `dev/evidence/story-mode-phase2` (already checked out).

### The 12 beats (real fixture: `@gt100k/evidence-tiny-game`, in declaration order)

The demo journey is a student building **a one-button endless runner**, from `buildTinyGameGraph` (used by `buildSyntheticExplorerView`). `view.growthTimeline.beats[i]` has `{ nodeId, birthOrder: i, group }` where `group === node.type` (verified: `timeline.ts:36`); beats are sorted by timestamp, which is monotonic in declaration order, so `birthOrder` matches the table below. Node `label` = the payload title.

| birthOrder | node type (`group`) | label | authored caption |
|---|---|---|---|
| 0 | Transformation | Plan: build a one-button endless runner | First, a plan: build a one-button endless runner. |
| 1 | Assistance | Tutor: how does a game loop work? | Asked a tutor how a game loop works — and noted that the help was used. |
| 2 | Artifact | game.js v1: canvas + game loop | First real code: a canvas and a game loop. |
| 3 | Attempt | Run v1: player falls through floor | First run — the player falls through the floor. It didn't pass yet, and that's recorded too. |
| 4 | Assistance | Tutor: how to add ground collision? | Asked the tutor how to add ground collision — help cited again. |
| 5 | Artifact | game.js v2: ground collision + jump | A new version: ground collision and a jump. |
| 6 | Attempt | Run v2: jump + collision pass | Next run passes — the jump and the collision work. |
| 7 | Contribution | Used a CC0 sprite sheet (cited) | Used a free CC0 sprite sheet — and credited where it came from. |
| 8 | Claim | Reflection: I understand the game loop and collision now | A reflection: "I understand the game loop and collision now." |
| 9 | Artifact | released: playable build | The playable build is released. |
| 10 | Review | Mentor review: solid; suggests a score counter | A mentor reviews the craft and suggests a score counter. |
| 11 | Outcome | Shipped playable build | And the final grade — decided by a person, not a machine. |

**Merges (the DAG is not a line):** the two source Artifacts each combine a prior step *and* cited tutor help — `game.js v1` (beat 2) is built from the plan + the game-loop tutor answer; `game.js v2` (beat 5) from v1 + the collision tutor answer. These are the only two merge nodes. Merge-ness is computed from `view.edges` (see `isMerge` below), NOT from `NodeView.inputs` — in this fixture every `node.inputs` is `[]`; the DAG lives entirely in the edges (`derived_from` / `validates` / `released_as`, plus `authored_by` which has `isNodeEdge === false`).

---

## File Structure

New files (all under `passion/apps/evidence-explorer/`):

- `components/story.ts` — pure: caption table, `shortHash`, `frontierNodeId`, `storyCaption`, `isMerge`, playback step-math, cadence + nudge strings. (Task 1)
- `components/use-story-playback.ts` — thin React hook wrapping the step-math on a timer; reduced-motion aware. (Task 3)
- `components/CommitLog.tsx` — the git-log-style DAG list beside the graph. (Task 2)
- `components/StoryTransport.tsx` — caption (aria-live) + controls (Play/Pause, Prev, Next, scrub slider) + end nudge to Verify. (Task 4)
- `test/story.test.ts` — pure unit + guard tests for `story.ts`. (Task 1)

Modified:

- `components/ObservatoryStage.tsx` — render `CommitLog` + `StoryTransport`, own the playback hook, highlight the frontier node via `focusNodeId`, accept `onOpenVerify`; retire `TimeScrub`. (Task 5)
- `components/Observatory.tsx` — pass `onOpenVerify={() => setVerifyOpen(true)}` to the stage. (Task 5)
- `test/structure.test.ts` — add wiring guards. (Tasks 2–5)
- `app/globals.css` — two-pane hero + commit-log + transport styles. (Task 6)
- `e2e/smoke.spec.ts` — add a Story Mode spec. (Task 7)

Deleted:

- `components/TimeScrub.tsx` — retired; its play/timer/beat-chips are superseded by Story Mode. (`components/scrub.ts` pure reveal logic is KEPT and reused.) (Task 5)

---

## Task 1: `story.ts` — pure captions, short-hash, and playback math

**Files:**
- Create: `passion/apps/evidence-explorer/components/story.ts`
- Test: `passion/apps/evidence-explorer/test/story.test.ts`

**Interfaces:**
- Consumes: `ExplorerView`, `NodeView` (types) from `@gt100k/evidence-explorer-view`; `buildSyntheticExplorerView()` from `../components/synthetic-view.js` (test only).
- Produces (later tasks rely on these exact names/signatures):
  - `STORY_STEP_MS: number`, `STORY_LEAD_IN: string`, `STORY_END_NUDGE: string`, `STORY_VERIFY_CTA: string`
  - `STORY_CAPTIONS: Record<number, string>` (keys 0–11)
  - `frontierNodeId(view: ExplorerView, revealedCount: number): string | null`
  - `storyCaption(view: ExplorerView, revealedCount: number): string`
  - `shortHash(id: string): string`
  - `isMerge(node: NodeView): boolean`
  - `clampCount(count: number, max: number): number`, `nextCount(count: number, max: number): number`, `prevCount(count: number): number`, `isAtEnd(count: number, max: number): boolean`, `isAtStart(count: number): boolean`, `canAutoAdvance(reducedMotion: boolean): boolean`

- [ ] **Step 1: Write the failing test.** Create `test/story.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";
import {
  STORY_CAPTIONS,
  STORY_LEAD_IN,
  STORY_STEP_MS,
  canAutoAdvance,
  clampCount,
  frontierNodeId,
  isAtEnd,
  isAtStart,
  isMerge,
  nextCount,
  prevCount,
  shortHash,
  storyCaption,
} from "../components/story.js";

const view = buildSyntheticExplorerView();
const count = view.growthTimeline.count; // 12

describe("story captions", () => {
  it("has a non-empty caption for every one of the 12 beats", () => {
    for (let i = 0; i < count; i++) {
      expect(typeof STORY_CAPTIONS[i]).toBe("string");
      expect(STORY_CAPTIONS[i].length).toBeGreaterThan(0);
    }
  });
  it("shows the lead-in before the story starts", () => {
    expect(storyCaption(view, 0)).toBe(STORY_LEAD_IN);
  });
  it("shows the authored caption at each beat position", () => {
    expect(storyCaption(view, 1)).toBe(STORY_CAPTIONS[0]);
    expect(storyCaption(view, count)).toBe(STORY_CAPTIONS[count - 1]);
  });
  it("the failing first run (beat index 3) reads as a failure kept on the record", () => {
    expect(storyCaption(view, 4)).toMatch(/didn't pass|recorded|falls through/i);
  });
});

describe("captions bind to the real beats (fails loudly if the fixture reorders)", () => {
  it("every beat position has a caption", () => {
    view.growthTimeline.beats.forEach((beat) => {
      expect(STORY_CAPTIONS[beat.birthOrder]).toBeDefined();
    });
  });
  it("beat 3 and beat 6 are Attempts (the failing then passing run), beat 11 is the Outcome", () => {
    expect(view.growthTimeline.beats[3].group).toBe("Attempt");
    expect(view.growthTimeline.beats[6].group).toBe("Attempt");
    expect(view.growthTimeline.beats[11].group).toBe("Outcome");
  });
});

describe("shortHash is a real content-address prefix", () => {
  it("every beat node id is a 64-char sha256 hex", () => {
    view.growthTimeline.beats.forEach((beat) => {
      expect(beat.nodeId).toMatch(/^[0-9a-f]{64}$/);
    });
  });
  it("returns the first 7 chars", () => {
    const id = view.growthTimeline.beats[0].nodeId;
    expect(shortHash(id)).toBe(id.slice(0, 7));
    expect(shortHash(id)).toHaveLength(7);
  });
});

describe("frontier + merge (the DAG is not linear)", () => {
  it("frontier is null at 0 and the last beat at full reveal", () => {
    expect(frontierNodeId(view, 0)).toBeNull();
    expect(frontierNodeId(view, count)).toBe(view.growthTimeline.beats[count - 1].nodeId);
  });
  it("the two source Artifacts are merges (built from a prior step + cited tutor help)", () => {
    const merges = view.nodes.filter((n) => isMerge(view, n.id));
    expect(merges.length).toBe(2);
    merges.forEach((n) => expect(n.type).toBe("Artifact"));
  });
  it("a single-parent step is not a merge", () => {
    // The plan (beat 0) has no dependency edges; it is the root, never a merge.
    expect(isMerge(view, view.growthTimeline.beats[0].nodeId)).toBe(false);
  });
});

describe("playback math", () => {
  it("advances and clamps at both ends", () => {
    expect(nextCount(0, count)).toBe(1);
    expect(nextCount(count, count)).toBe(count);
    expect(prevCount(1)).toBe(0);
    expect(prevCount(0)).toBe(0);
    expect(clampCount(99, count)).toBe(count);
  });
  it("reports the ends", () => {
    expect(isAtStart(0)).toBe(true);
    expect(isAtStart(1)).toBe(false);
    expect(isAtEnd(count, count)).toBe(true);
    expect(isAtEnd(0, count)).toBe(false);
  });
  it("suppresses auto-advance under reduced motion", () => {
    expect(canAutoAdvance(false)).toBe(true);
    expect(canAutoAdvance(true)).toBe(false);
  });
  it("uses a readable cadence (> 1s)", () => {
    expect(STORY_STEP_MS).toBeGreaterThan(1000);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- story`
Expected: FAIL — `../components/story.js` does not exist.

Merge-ness is edge-derived (verified against the fixture): `NodeView.inputs` is `[]` for every node in this fixture — the DAG lives in `view.edges` (`EdgeView { type, from, to, isNodeEdge }`, `model.ts:113`). A node's dependency parents = edges where `from === node.id`, `isNodeEdge === true`, and `type !== "released_as"` (that one points forward to the release; `authored_by` is already excluded because its `to` is an actor ref, so `isNodeEdge === false`). Two nodes have >1 such parent — the two source Artifacts. Implement `isMerge`/`parentCount` exactly as below; do not use `node.inputs`.

- [ ] **Step 3: Write `components/story.ts`:**

```ts
// Presentation-only Story Mode data + pure helpers. Reads an ExplorerView; never mutates it and
// never touches the domain graph. Pure so the whole module is unit-testable in the node env.
import type { ExplorerView } from "@gt100k/evidence-explorer-view";

/** Auto-advance cadence: one beat every ~2.6s — slow enough to read a caption.
 *  A JS interval delay, NOT a CSS-animation motion token. */
export const STORY_STEP_MS = 2600;

/** Shown before the story starts (revealedCount === 0). */
export const STORY_LEAD_IN = "Press play to watch how this was built — one real step at a time.";

/** Shown at full reveal; pairs with the Verify call-to-action. */
export const STORY_END_NUDGE = "…and here's the proof it's all real →";
export const STORY_VERIFY_CTA = "Verify";

/**
 * One plain caption per beat, keyed by 0-based beat position (`birthOrder`), authored to the
 * committed tiny-runner-v1 fixture (a student building a one-button endless runner). Honest to each
 * step: cited tutor help, a failed run kept on the record, a credited free asset, a human-owned
 * grade. If a beat has no authored caption, callers fall back to the node's own label.
 */
export const STORY_CAPTIONS: Record<number, string> = {
  0: "First, a plan: build a one-button endless runner.",
  1: "Asked a tutor how a game loop works — and noted that the help was used.",
  2: "First real code: a canvas and a game loop.",
  3: "First run — the player falls through the floor. It didn't pass yet, and that's recorded too.",
  4: "Asked the tutor how to add ground collision — help cited again.",
  5: "A new version: ground collision and a jump.",
  6: "Next run passes — the jump and the collision work.",
  7: "Used a free CC0 sprite sheet — and credited where it came from.",
  8: 'A reflection: "I understand the game loop and collision now."',
  9: "The playable build is released.",
  10: "A mentor reviews the craft and suggests a score counter.",
  11: "And the final grade — decided by a person, not a machine.",
};

/** The frontier beat = the newest revealed one (1-based position === revealedCount). */
export function frontierNodeId(view: ExplorerView, revealedCount: number): string | null {
  if (revealedCount <= 0) return null;
  const beat = view.growthTimeline.beats[revealedCount - 1];
  return beat ? beat.nodeId : null;
}

/** The caption at a reveal position: lead-in at 0, authored caption otherwise, node label as fallback. */
export function storyCaption(view: ExplorerView, revealedCount: number): string {
  if (revealedCount <= 0) return STORY_LEAD_IN;
  const beat = view.growthTimeline.beats[revealedCount - 1];
  if (!beat) return STORY_LEAD_IN;
  const authored = STORY_CAPTIONS[beat.birthOrder];
  if (authored) return authored;
  const node = view.nodes.find((n) => n.id === beat.nodeId);
  return node ? node.label : "";
}

/** First 7 chars of a node's sha256 content-address — a real, git-style short hash. */
export function shortHash(id: string): string {
  const hex = id.includes(":") ? id.slice(id.lastIndexOf(":") + 1) : id;
  return hex.slice(0, 7);
}

/**
 * Dependency parents of a node = the earlier steps it was built from / validates. Read from the
 * view's edges, NOT `node.inputs` (which is `[]` in this fixture): an edge `from === nodeId` with
 * `isNodeEdge === true` is a node→node link; `released_as` points forward to the release, so it is
 * excluded (`authored_by` is already excluded — its target is an actor ref, so `isNodeEdge` is false).
 */
export function parentCount(view: ExplorerView, nodeId: string): number {
  return view.edges.filter((e) => e.from === nodeId && e.isNodeEdge && e.type !== "released_as").length;
}

/** A step is a "merge" when it draws on more than one earlier step (DAG, not a line). */
export function isMerge(view: ExplorerView, nodeId: string): boolean {
  return parentCount(view, nodeId) > 1;
}

// ── pure playback math (the hook is a thin React wrapper over these) ──
export function clampCount(count: number, max: number): number {
  return Math.max(0, Math.min(count, max));
}
export function nextCount(count: number, max: number): number {
  return clampCount(count + 1, max);
}
export function prevCount(count: number): number {
  return Math.max(0, count - 1);
}
export function isAtEnd(count: number, max: number): boolean {
  return count >= max;
}
export function isAtStart(count: number): boolean {
  return count <= 0;
}
/** Auto-advance is suppressed under reduced motion (step-only). */
export function canAutoAdvance(reducedMotion: boolean): boolean {
  return !reducedMotion;
}
```

- [ ] **Step 4: Run the test — verify it passes.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- story`
Expected: PASS. Then run the full gate: `pnpm --filter @gt100k/evidence-explorer test` and `pnpm --filter @gt100k/evidence-explorer build` — both green.

- [ ] **Step 5: Commit.**

```bash
git add passion/apps/evidence-explorer/components/story.ts passion/apps/evidence-explorer/test/story.test.ts
git commit -m "feat(evidence): Story Mode captions, real short-hash, and playback math"
```

---

## Task 2: `CommitLog.tsx` — the git-log-style DAG list

**Files:**
- Create: `passion/apps/evidence-explorer/components/CommitLog.tsx`
- Test: extend `passion/apps/evidence-explorer/test/structure.test.ts`

**Interfaces:**
- Consumes: `ExplorerView` (type) from `@gt100k/evidence-explorer-view`; `shortHash`, `isMerge`, `STORY_CAPTIONS` from `./story.js`.
- Produces: `CommitLog({ view, revealedCount, onSelectBeat }): JSX.Element` where `onSelectBeat: (nodeId: string) => void`.

- [ ] **Step 1: Add a failing guard.** Append to `test/structure.test.ts` (it already has the `read()` helper reading from `components/`):

```ts
describe("CommitLog is a git-log-style, non-linear history", () => {
  const src = read("CommitLog.tsx");
  it("renders a real short content-address per beat", () => {
    expect(src).toMatch(/shortHash\(beat\.nodeId\)/);
  });
  it("marks the current beat with aria-current=\"step\"", () => {
    expect(src).toMatch(/aria-current/);
    expect(src).toMatch(/"step"/);
  });
  it("dims future (unrevealed) beats", () => {
    expect(src).toMatch(/is-future/);
  });
  it("shows a merge cue for multi-input (non-linear) steps", () => {
    expect(src).toMatch(/isMerge/);
    expect(src).toMatch(/is-merge/);
  });
  it("rows are clickable to jump to a beat", () => {
    expect(src).toMatch(/onSelectBeat\(beat\.nodeId\)/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.** Run: `pnpm --filter @gt100k/evidence-explorer test -- structure` → FAIL (`CommitLog.tsx` missing).

- [ ] **Step 3: Write `components/CommitLog.tsx`:**

```tsx
"use client";
// A git log-style commit list beside the constellation. Presentational: reads the view and calls
// back to jump to a beat. Real DOM text (never a canvas cue), so it stays accessible. The list is
// chronological but does not imply a single line — multi-input steps carry a merge cue; the graph
// edges remain the authoritative branch/merge structure.
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
import { STORY_CAPTIONS, isMerge, shortHash } from "./story.js";

export function CommitLog({
  view,
  revealedCount,
  onSelectBeat,
}: {
  view: ExplorerView;
  revealedCount: number;
  onSelectBeat: (nodeId: string) => void;
}): JSX.Element {
  const beats = view.growthTimeline.beats;
  const nodeById = new Map(view.nodes.map((n) => [n.id, n]));
  return (
    <ol className="commit-log" aria-label="Project history — every step, oldest first">
      {beats.map((beat, i) => {
        const node = nodeById.get(beat.nodeId);
        const revealed = i < revealedCount;
        const isCurrent = i === revealedCount - 1;
        const merge = isMerge(view, beat.nodeId);
        const message = STORY_CAPTIONS[beat.birthOrder] ?? node?.label ?? "";
        const className = ["commit-row", revealed ? "is-revealed" : "is-future", isCurrent ? "is-current" : "", merge ? "is-merge" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <li key={beat.nodeId} className={className} aria-current={isCurrent ? "step" : undefined}>
            <button type="button" className="commit-jump" onClick={() => onSelectBeat(beat.nodeId)}>
              <code className="commit-hash">{shortHash(beat.nodeId)}</code>
              {merge ? (
                <span className="commit-merge" aria-hidden="true" title="draws on more than one earlier step">
                  ⑂
                </span>
              ) : null}
              <span className="commit-msg">{message}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
```

- [ ] **Step 4: Run the guard + gate.** Run: `pnpm --filter @gt100k/evidence-explorer test -- structure` → PASS. Then full: `pnpm --filter @gt100k/evidence-explorer test` and `... build` → green.

- [ ] **Step 5: Commit.**

```bash
git add passion/apps/evidence-explorer/components/CommitLog.tsx passion/apps/evidence-explorer/test/structure.test.ts
git commit -m "feat(evidence): git-log-style commit list with real hashes and merge cues"
```

---

## Task 3: `use-story-playback.ts` — the transport hook

**Files:**
- Create: `passion/apps/evidence-explorer/components/use-story-playback.ts`
- Test: extend `passion/apps/evidence-explorer/test/structure.test.ts`

**Interfaces:**
- Consumes: `canAutoAdvance`, `isAtEnd`, `isAtStart`, `nextCount`, `prevCount`, `STORY_STEP_MS` from `./story.js`; React.
- Produces: `useStoryPlayback({ count, revealedCount, onScrub, reducedMotion }): StoryPlayback` and the exported interface:

```ts
export interface StoryPlayback {
  readonly playing: boolean;
  readonly atStart: boolean;
  readonly atEnd: boolean;
  readonly canAutoPlay: boolean;
  readonly toggle: () => void;
  readonly next: () => void;
  readonly prev: () => void;
  readonly pause: () => void;
  readonly restart: () => void;
}
```
Param types: `count: number`, `revealedCount: number`, `onScrub: (n: number) => void`, `reducedMotion: boolean`.

- [ ] **Step 1: Add a failing guard.** Append to `test/structure.test.ts`:

```ts
describe("useStoryPlayback reuses the pure step logic and honors reduced motion", () => {
  const src = read("use-story-playback.ts");
  it("advances on the STORY_STEP_MS interval", () => {
    expect(src).toMatch(/setInterval/);
    expect(src).toMatch(/STORY_STEP_MS/);
  });
  it("suppresses auto-advance under reduced motion (step-only)", () => {
    expect(src).toMatch(/canAutoAdvance|canAutoPlay/);
    expect(src).toMatch(/if \(!canAutoPlay\)/);
  });
  it("reuses the pure playback helpers rather than re-deriving them", () => {
    expect(src).toMatch(/nextCount/);
    expect(src).toMatch(/prevCount/);
  });
  it("is presentation-only (never imports the domain graph)", () => {
    expect(src).not.toMatch(/@gt100k\/evidence-graph/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.** Run: `pnpm --filter @gt100k/evidence-explorer test -- structure` → FAIL (file missing).

- [ ] **Step 3: Write `components/use-story-playback.ts`:**

```ts
"use client";
// Story Mode transport: advances the shared reveal counter on a timer, honoring reduced motion.
// Presentation-only — it only moves `revealedCount` via `onScrub`; it never touches the graph,
// view, or verification. The step arithmetic lives in ./story.js so it is unit-tested there.
import { useCallback, useEffect, useRef, useState } from "react";
import { STORY_STEP_MS, canAutoAdvance, isAtEnd, isAtStart, nextCount, prevCount } from "./story.js";

export interface StoryPlayback {
  readonly playing: boolean;
  readonly atStart: boolean;
  readonly atEnd: boolean;
  readonly canAutoPlay: boolean;
  readonly toggle: () => void;
  readonly next: () => void;
  readonly prev: () => void;
  readonly pause: () => void;
  readonly restart: () => void;
}

export function useStoryPlayback({
  count,
  revealedCount,
  onScrub,
  reducedMotion,
}: {
  count: number;
  revealedCount: number;
  onScrub: (n: number) => void;
  reducedMotion: boolean;
}): StoryPlayback {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealedRef = useRef(revealedCount);
  revealedRef.current = revealedCount;

  const canAutoPlay = canAutoAdvance(reducedMotion);

  const pause = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setPlaying(false);
  }, []);

  // Advance one beat per STORY_STEP_MS while playing; the effect below stops at full reveal.
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      onScrub(nextCount(revealedRef.current, count));
    }, STORY_STEP_MS);
    return () => {
      if (timer.current !== null) clearInterval(timer.current);
      timer.current = null;
    };
  }, [playing, count, onScrub]);

  useEffect(() => {
    if (playing && isAtEnd(revealedCount, count)) pause();
  }, [playing, revealedCount, count, pause]);

  // Reduced motion can turn on mid-play (tri-state HUD toggle) — stop auto-advance immediately.
  useEffect(() => {
    if (!canAutoPlay && playing) pause();
  }, [canAutoPlay, playing, pause]);

  const toggle = useCallback(() => {
    if (!canAutoPlay) return; // step-only under reduced motion
    if (playing) {
      pause();
      return;
    }
    if (isAtEnd(revealedRef.current, count)) onScrub(0); // replay from the start
    setPlaying(true);
  }, [canAutoPlay, playing, count, onScrub, pause]);

  const next = useCallback(() => {
    pause();
    onScrub(nextCount(revealedRef.current, count));
  }, [pause, onScrub, count]);

  const prev = useCallback(() => {
    pause();
    onScrub(prevCount(revealedRef.current));
  }, [pause, onScrub]);

  const restart = useCallback(() => {
    pause();
    onScrub(0);
  }, [pause, onScrub]);

  return {
    playing,
    atStart: isAtStart(revealedCount),
    atEnd: isAtEnd(revealedCount, count),
    canAutoPlay,
    toggle,
    next,
    prev,
    pause,
    restart,
  };
}
```

- [ ] **Step 4: Run the guard + gate.** `pnpm --filter @gt100k/evidence-explorer test -- structure` → PASS; then full `test` + `build` → green.

- [ ] **Step 5: Commit.**

```bash
git add passion/apps/evidence-explorer/components/use-story-playback.ts passion/apps/evidence-explorer/test/structure.test.ts
git commit -m "feat(evidence): Story Mode playback hook (timer + reduced-motion step-only)"
```

---

## Task 4: `StoryTransport.tsx` — caption, controls, and the Verify nudge

**Files:**
- Create: `passion/apps/evidence-explorer/components/StoryTransport.tsx`
- Test: extend `passion/apps/evidence-explorer/test/structure.test.ts`

**Interfaces:**
- Consumes: `ExplorerView` (type); `STORY_END_NUDGE`, `STORY_VERIFY_CTA`, `storyCaption` from `./story.js`; `StoryPlayback` (type) from `./use-story-playback.js`.
- Produces: `StoryTransport({ view, revealedCount, onScrub, onOpenVerify, playback }): JSX.Element` where `onScrub: (n: number) => void`, `onOpenVerify: () => void`, `playback: StoryPlayback`.

- [ ] **Step 1: Add a failing guard.** Append to `test/structure.test.ts`:

```ts
describe("StoryTransport renders caption, controls, and the Verify nudge", () => {
  const src = read("StoryTransport.tsx");
  it("shows the caption in an aria-live region", () => {
    expect(src).toMatch(/story-caption/);
    expect(src).toMatch(/aria-live="polite"/);
  });
  it("has Play/Pause + Prev + Next controls", () => {
    expect(src).toMatch(/story-play/);
    expect(src).toMatch(/story-prev/);
    expect(src).toMatch(/story-next/);
  });
  it("hides auto-play under reduced motion (canAutoPlay gate)", () => {
    expect(src).toMatch(/playback\.canAutoPlay \?/);
  });
  it("ends on a nudge that opens Verify", () => {
    expect(src).toMatch(/playback\.atEnd/);
    expect(src).toMatch(/onOpenVerify/);
    expect(src).toMatch(/STORY_END_NUDGE/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.** `pnpm --filter @gt100k/evidence-explorer test -- structure` → FAIL.

- [ ] **Step 3: Write `components/StoryTransport.tsx`:**

```tsx
"use client";
// The Story Mode transport bar: the current caption (aria-live), the controls, and the closing
// "here's the proof" nudge to Verify. Presentation-only — every handler comes from props.
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
import { STORY_END_NUDGE, STORY_VERIFY_CTA, storyCaption } from "./story.js";
import type { StoryPlayback } from "./use-story-playback.js";

export function StoryTransport({
  view,
  revealedCount,
  onScrub,
  onOpenVerify,
  playback,
}: {
  view: ExplorerView;
  revealedCount: number;
  onScrub: (n: number) => void;
  onOpenVerify: () => void;
  playback: StoryPlayback;
}): JSX.Element {
  const count = view.growthTimeline.count;
  const caption = storyCaption(view, revealedCount);
  return (
    <section className="story-transport" aria-label="Story mode">
      <p className="story-caption" aria-live="polite">
        {caption}
      </p>

      <div className="story-controls">
        <button type="button" className="story-prev" onClick={playback.prev} disabled={playback.atStart}>
          ‹ Prev
        </button>
        {playback.canAutoPlay ? (
          <button type="button" className="story-play" onClick={playback.toggle} aria-pressed={playback.playing}>
            {playback.playing ? "⏸ Pause" : "▶ Play the story"}
          </button>
        ) : null}
        <button type="button" className="story-next" onClick={playback.next} disabled={playback.atEnd}>
          Next ›
        </button>
        <input
          type="range"
          className="story-scrub"
          aria-label="Scrub the project history"
          min={0}
          max={count}
          value={revealedCount}
          onChange={(e) => {
            playback.pause();
            onScrub(Number(e.target.value));
          }}
        />
      </div>

      {playback.atEnd ? (
        <p className="story-nudge">
          {STORY_END_NUDGE}{" "}
          <button type="button" className="story-verify" onClick={onOpenVerify}>
            {STORY_VERIFY_CTA}
          </button>
        </p>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run the guard + gate.** `... test -- structure` → PASS; then full `test` + `build` → green.

- [ ] **Step 5: Commit.**

```bash
git add passion/apps/evidence-explorer/components/StoryTransport.tsx passion/apps/evidence-explorer/test/structure.test.ts
git commit -m "feat(evidence): Story Mode transport — caption, controls, Verify nudge"
```

---

## Task 5: Wire Story Mode into the stage; retire `TimeScrub`

**Files:**
- Modify: `passion/apps/evidence-explorer/components/ObservatoryStage.tsx`
- Modify: `passion/apps/evidence-explorer/components/Observatory.tsx`
- Delete: `passion/apps/evidence-explorer/components/TimeScrub.tsx`
- Test: extend `passion/apps/evidence-explorer/test/structure.test.ts`

**Interfaces:**
- Consumes: `useStoryPlayback` from `./use-story-playback.js`; `CommitLog` from `./CommitLog.js`; `StoryTransport` from `./StoryTransport.js`; `frontierNodeId` from `./story.js`. Existing: `revealedCount`/`setRevealedCount`, `effFocus`, `select`, `revealedNodeIds`/`effectiveFocusId` from `./scrub.js`, `useHud().reducedMotion`, `Constellation2D` (`focusNodeId` prop).
- Produces: `ObservatoryStage` gains a required prop `onOpenVerify: () => void`. Its other props (`view`, `verification`, `ledger`, `verifyVisual`) are unchanged.

Context for the implementer: read `ObservatoryStage.tsx` and `Observatory.tsx` in full first. Today the stage renders `<div className="obs-stage"> → <div className="obs-viewport">(Constellation2D + Inspector)</div> → <TimeScrub .../>`. `revealedCount` starts at `view.growthTimeline.count` (fully grown) — keep that default (the hero should look complete on load; pressing Play rewinds to 0 and replays). `verifyOpen`/`setVerifyOpen` live in `Observatory`, not the stage — that is why we thread `onOpenVerify` down.

- [ ] **Step 1: Add failing wiring guards.** Append to `test/structure.test.ts`:

```ts
describe("Story Mode is wired into the stage (TimeScrub retired)", () => {
  const stage = read("ObservatoryStage.tsx");
  it("renders the CommitLog and the StoryTransport, not TimeScrub", () => {
    expect(stage).toMatch(/<CommitLog/);
    expect(stage).toMatch(/<StoryTransport/);
    expect(stage).not.toMatch(/TimeScrub/);
  });
  it("drives the playback engine off the shared revealedCount", () => {
    expect(stage).toMatch(/useStoryPlayback/);
    expect(stage).toMatch(/setRevealedCount/);
  });
  it("highlights the frontier node via focusNodeId during play (no Inspector hijack)", () => {
    expect(stage).toMatch(/storyFocus/);
    expect(stage).toMatch(/frontierNodeId/);
  });
  it("accepts and forwards an onOpenVerify for the end nudge", () => {
    expect(stage).toMatch(/onOpenVerify/);
  });
  const obs = read("Observatory.tsx");
  it("Observatory opens Verify from the stage nudge", () => {
    expect(obs).toMatch(/onOpenVerify=\{\(\) => setVerifyOpen\(true\)\}/);
  });
});
```

- [ ] **Step 2: Run it — verify it fails.** `... test -- structure` → FAIL.

- [ ] **Step 3: Edit `ObservatoryStage.tsx`.**
  1. Remove the `TimeScrub` import; add:
     ```ts
     import { CommitLog } from "./CommitLog.js";
     import { StoryTransport } from "./StoryTransport.js";
     import { useStoryPlayback } from "./use-story-playback.js";
     import { frontierNodeId } from "./story.js";
     ```
  2. Add `onOpenVerify: () => void` to the destructured props and the prop type.
  3. After `revealedCount`/`revealed`/`effFocus`/`selectNode` are set up, add the playback + jump + focus logic:
     ```ts
     const playback = useStoryPlayback({
       count: view.growthTimeline.count,
       revealedCount,
       onScrub: setRevealedCount,
       reducedMotion,
     });

     // Clicking a commit row jumps the reveal to that beat and selects it (Inspector opens on purpose).
     const jumpToBeat = useCallback(
       (nodeId: string) => {
         playback.pause();
         const beat = view.growthTimeline.beats.find((b) => b.nodeId === nodeId);
         if (beat) setRevealedCount(beat.birthOrder + 1);
         select(nodeId);
       },
       [playback, view, select],
     );

     // During auto-play, highlight the newest node with the focus ring only — NOT select() —
     // so the Inspector does not pop open on every beat.
     const frontier = frontierNodeId(view, revealedCount);
     const storyFocus = playback.playing && frontier ? frontier : effFocus;
     ```
     (`useCallback` is already imported in this file for `selectNode`; if not, add it to the React import.)
  4. Pass `focusNodeId={storyFocus}` to `<Constellation2D>` (replacing the current `focusNodeId={effFocus}`).
  5. Replace the viewport + `<TimeScrub>` block with a two-pane hero + the transport:
     ```tsx
     <div className="obs-stage">
       <div className="obs-hero">
         <div className="obs-viewport">
           {/* Constellation2D (now focusNodeId={storyFocus}) + the AnimatePresence Inspector — unchanged */}
         </div>
         <CommitLog view={view} revealedCount={revealedCount} onSelectBeat={jumpToBeat} />
       </div>
       <StoryTransport
         view={view}
         revealedCount={revealedCount}
         onScrub={setRevealedCount}
         onOpenVerify={onOpenVerify}
         playback={playback}
       />
     </div>
     ```
     Keep the existing Constellation2D props and the Inspector `AnimatePresence` block exactly as they were, only moving them inside `.obs-hero > .obs-viewport` and changing `focusNodeId`.

- [ ] **Step 4: Edit `Observatory.tsx`.** Where `<ObservatoryStage ... />` is rendered, add the prop:
  ```tsx
  <ObservatoryStage
    view={view}
    verification={verification}
    ledger={ledger}
    verifyVisual={verifyVisual}
    onOpenVerify={() => setVerifyOpen(true)}
  />
  ```

- [ ] **Step 5: Delete `TimeScrub.tsx` and confirm no stragglers.**
  ```bash
  git rm passion/apps/evidence-explorer/components/TimeScrub.tsx
  grep -rn "TimeScrub" passion/apps/evidence-explorer --include=*.ts --include=*.tsx
  ```
  The grep must return nothing (if a Phase-1 test or file still references `TimeScrub`, update it to the Story Mode components). `components/scrub.ts` and its `test/scrub.test.ts` are KEPT — do not touch them.

- [ ] **Step 6: Run guards + gate.** `... test -- structure` → PASS; then full `test` + `build` → green. The build must typecheck the new `onOpenVerify` prop end-to-end.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "feat(evidence): wire Story Mode into the stage; retire TimeScrub"
```

---

## Task 6: Styles — two-pane hero, commit log, transport

**Files:**
- Modify: `passion/apps/evidence-explorer/app/globals.css`

No new test file: `test/motion-budget.test.ts` and `test/a11y.test.ts` already run over `globals.css` and enforce the motion budget. Read the current `.obs-stage` / `.obs-viewport` rules first and match the token vocabulary already in the file (CSS custom properties like `--focus`, spacing, radii). Do NOT introduce a CSS variable that is not already defined (a Phase-1 CI gate — `@gt100k/boundaries` — fails on undefined custom properties).

- [ ] **Step 1: Add the layout + component styles.** Append near the existing `.obs-stage` rules. Requirements:
  - `.obs-hero` — a responsive grid: one column by default; at a suitable min-width, `grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr)` so the graph is the larger left pane and the commit log the right. Use `gap` for spacing (static `gap` is fine; never *transition* `gap`).
  - `.commit-log` — reset list styling; a readable max-height with `overflow-y: auto` so 12 rows never blow out the layout.
  - `.commit-row` — a row; `.commit-row.is-future { opacity: 0.4; }` (dim the not-yet-revealed steps). Emphasis for `.commit-row.is-current` via `background-color` and/or `transform`/`box-shadow` (NOT margin/padding/border-width changes). If you add a transition, it may list ONLY `opacity`, `transform`, `filter`, `background-color`, `color`, `box-shadow` — never a layout prop.
  - `.commit-jump` — button reset (transparent, full-width, left-aligned text, pointer cursor); a `:focus-visible` outline using the existing `--focus` token.
  - `.commit-hash` — monospace, muted; `.commit-merge` — small accent glyph; `.commit-msg` — the message text.
  - `.story-transport`, `.story-caption` (readable, a little breathing room), `.story-controls` (flex row, wraps on narrow), `.story-play` / `.story-prev` / `.story-next` (match existing button styles), `.story-scrub` (the range input), `.story-nudge` + `.story-verify` (a call-to-action that stands out).
  - Do NOT add any new `@keyframes` unless it animates only `transform`/`opacity`/`filter`. The global `@media (prefers-reduced-motion: reduce)` reset already zeroes durations — leave it intact; your transitions inherit it.

- [ ] **Step 2: Run the motion + a11y gate.**

Run: `pnpm --filter @gt100k/evidence-explorer test -- motion-budget` and `... test -- a11y` → PASS.
Run the full gate: `pnpm --filter @gt100k/evidence-explorer test` and `... build` → green.

- [ ] **Step 3: Commit.**

```bash
git add passion/apps/evidence-explorer/app/globals.css
git commit -m "style(evidence): two-pane story hero, git-log commit list, transport bar"
```

---

## Task 7: e2e smoke + visual verification gate

The vitest gate is text/pure; "the story plays and looks right" needs a real browser. This is a manual gate (like Phase 1's visual check) plus a committed Playwright spec.

**Files:**
- Modify: `passion/apps/evidence-explorer/e2e/smoke.spec.ts`
- No committed screenshots (scratch under `$CLAUDE_JOB_DIR/tmp`).

- [ ] **Step 1: Start the dev server.** `pnpm --filter @gt100k/evidence-explorer dev` (serves on :3030). Wait for "Ready". If :3030 is busy, a stale `next-server` from another worktree may be squatting it — check and kill only an evidence-explorer server you started, then re-run.

- [ ] **Step 2: Screenshot the three story states** with Python Playwright. Save PNGs to `$CLAUDE_JOB_DIR/tmp`:

```python
from playwright.sync_api import sync_playwright
import os, re
out = os.environ["CLAUDE_JOB_DIR"] + "/tmp"
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 1280, "height": 900})
    pg.goto("http://localhost:3030", wait_until="networkidle"); pg.wait_for_timeout(1000)
    pg.screenshot(path=f"{out}/p2-loaded.png", full_page=True)          # commit log beside graph
    pg.get_by_role("button", name=re.compile("Play the story")).click()
    pg.wait_for_timeout(1200)
    pg.screenshot(path=f"{out}/p2-playing.png", full_page=True)          # mid-story: caption + current row
    # let it finish, then the nudge should appear and open Verify
    pg.wait_for_timeout(9000)
    pg.get_by_role("button", name=re.compile(r"^Verify$")).first.click(); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{out}/p2-verify.png", full_page=True)
    b.close()
```

- [ ] **Step 3: Eyeball each screenshot.** Checklist: `p2-loaded` shows the 2D graph beside a readable commit list (short hashes + plain messages, at least one merge glyph, current row emphasized); `p2-playing` shows the caption changing and the newest node ring-highlighted WITHOUT the Inspector popping open; `p2-verify` shows the end nudge led to the Verify panel opening. Note any layout breakage (especially the two-pane grid on this width) and fix before committing.

- [ ] **Step 4: Add a Story Mode e2e spec.** In `e2e/smoke.spec.ts`, add a test that: loads the page; asserts `ol.commit-log` is visible with 12 `li.commit-row`; clicks "Play the story"; waits and asserts the reveal advanced (e.g. `.story-caption` text is no longer the lead-in, or a `.commit-row.is-current` moved); waits for full reveal and asserts `.story-nudge` is visible; clicks its `Verify` button and asserts `#verify-panel` appears. Keep the existing Phase-1 specs (svg.constellation mounts, no canvas, header Verify) intact.

- [ ] **Step 5: Commit.**

```bash
git add passion/apps/evidence-explorer/e2e/smoke.spec.ts
git commit -m "test(evidence): e2e smoke for Story Mode playback and the Verify nudge"
```

---

## Self-Review

**1. Spec coverage (design §6 + §6.1):**
- Auto-advancing narration over existing beats, presentation-only, drives `revealedCount` on a timer → Task 3 (hook) + Task 5 (wiring). ✔
- One plain caption per beat, keyed table, label fallback → Task 1 (`STORY_CAPTIONS`, `storyCaption`). ✔
- Highlights the newest node via the existing focus path, without Inspector hijack → Task 5 (`storyFocus` → `Constellation2D focusNodeId`). ✔
- Controls Play/Pause + Next/Prev, reuse step logic, reduced-motion step-only → Task 3 (hook) + Task 4 (transport, `canAutoPlay` gate). ✔
- Ends on a nudge that opens Verify → Task 4 (`story-nudge` + `onOpenVerify`) + Task 5 (`setVerifyOpen(true)`). ✔
- `git log` commit list beside the graph, real short-hash, non-linear/merge cue → Task 1 (`shortHash`, `isMerge`) + Task 2 (`CommitLog`) + Task 6 (two-pane hero). ✔
- Retire `TimeScrub`, keep `scrub.ts` → Task 5. ✔
- No new domain data; view read never mutated → enforced across all tasks; the hook guard asserts no `@gt100k/evidence-graph` import. ✔
- Tests: advance/caption/reduced-motion-step (§8) → Task 1 (caption + playback math + reduced-motion) + Task 3 (hook guard) + Task 7 (e2e advance). ✔

**2. Placeholder scan:** No TBD/TODO. Every code step has complete code. The one conditional path (merge via `node.inputs` vs. edge in-degree) is a precise, testable fork with a named fallback location, not a placeholder.

**3. Type consistency:** `StoryPlayback` (Task 3) is consumed by Task 4 (`playback: StoryPlayback`) and Task 5 (the hook return). `shortHash`/`isMerge`/`STORY_CAPTIONS`/`storyCaption`/`frontierNodeId` (Task 1) match their call sites in Tasks 2, 4, 5. `onOpenVerify: () => void` produced by Task 5's stage prop and supplied by `Observatory` (`setVerifyOpen(true)`). `onSelectBeat: (nodeId: string) => void` (CommitLog) is satisfied by the stage's `jumpToBeat`. Playback params (`count`, `revealedCount`, `onScrub`, `reducedMotion`) match the stage's call.

**4. Scope:** Phase 2 only. No domain/view-package changes; the app-layer surface only.
