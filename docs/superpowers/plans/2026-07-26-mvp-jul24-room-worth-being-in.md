# `mvp-jul24` — a room worth being in: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the discovery-cabins game better at being a room — retire a child-facing PRD §11 violation, collapse three cabin backends to one, and give the `logic-games` cabin the difficulty variety its generators already support.

**Architecture:** Two phases. Phase A (tasks 1–5) is mostly deletion: one backend survives, the child-facing time-on-task readout moves behind a QA gate, and three docs plus one PRD section get reconciled with what shipped. Phase B (tasks 6–9) spends the headroom Phase A frees on the two rooms that exist. The measurement lane — artifact catalog, taxonomy crosswalk, `CellEvent` derivation — is deliberately **not** in this plan; see the spec's §2.

**Tech Stack:** React 18 + TypeScript, Vite, Zustand (`game/store.ts`), Vitest + jsdom + `@testing-library/react` (`toBeInTheDocument` comes from `vitest.setup.ts`), Playwright for the headless screenshot tooling (`tools/`), Biome for lint/format.

**Design doc:** [`../specs/2026-07-26-mvp-jul24-room-worth-being-in-design.md`](../specs/2026-07-26-mvp-jul24-room-worth-being-in-design.md). Read it first — it carries the *why*, and this plan does not restate the evidence.

## Global Constraints

- **App directory for all commands:** `passion/apps/mvp-jul24`. Run tests from there with `pnpm vitest run <path>`; the repo-root gate is `pnpm test` + `pnpm typecheck` + `pnpm lint` from the repo root.
- **pnpm only** — never npm or yarn (AGENTS.md).
- **Conventional Commits**, one per task. PRs stay under ~400 lines.
- **Nothing is gated.** No locks, no prerequisites, no completion-contingent reveal, anywhere. `shelf/types.ts` carries the full argument; a change that adds `unlockedBy` / `requiresSolve` / `revealed` is out of bounds.
- **No child-facing quantified or ranked display of the child's own engagement**, and no visible tier/level number. This is the constraint task 1 enforces and task 7 must not reintroduce.
- **No rewards, points, streaks, or unlocks** on any signal (PRD §11, hard refusal).
- **Nothing is deleted, only parked.** Parked code stays in the tree, stays compiled, keeps its passing tests, and leaves the render path — the precedent is LITS / LogicGrid / Minesweeper in `gadgets/registry.ts`.
- **"Hotspots" is overloaded.** `cabin/hotspots.ts` is the *static* backend's positions and parks in task 2. `.cabin-backdrop-hotspots` is the *backdrop*'s live SVG prop layer and must survive — it is the only interaction surface the product has. Never grep `hotspots` and delete the matches.

---

### Task 1: Retire the child-facing interest readout

The highest-priority task, and independent of every other one. `App.tsx` puts an ungated **"Interest"** button in the child's primary nav; it opens a screen titled "Your interests" listing gadgets **ranked by time-on-task with the minutes printed**. PRD §11 refuses that three times over. The counters stay — operator-facing readouts are explicitly fine — but the child gets no path to them.

**Files:**
- Create: `passion/apps/mvp-jul24/src/qa.ts`
- Modify: `passion/apps/mvp-jul24/src/App.tsx:39-56` (remove the nav button), `:66` (keep the readout render, now QA-only)
- Modify: `passion/apps/mvp-jul24/src/main.tsx` (install the QA contract)
- Test: `passion/apps/mvp-jul24/src/App.test.tsx`

**Interfaces:**
- Consumes: `useGame` from `game/store.ts` (`goToReadout`, `screen`), unchanged.
- Produces: `installQa(): void` exported from `src/qa.ts`, and `window.__qa` with `{ ready: true, showReadout(): void, interest(): Record<string, {activeMs: number; opens: number; solves: number}> }`. No later task depends on this.

Keep `goToReadout` on the store and `"readout"` in the `Screen` union. The screen stays reachable — through `window.__qa.showReadout()` only. That is what "in tree, behind the QA gate" means here, and it keeps `ReadoutScreen.test.tsx` meaningful instead of leaving a dead component.

- [ ] **Step 1: Write the failing test**

Append to `passion/apps/mvp-jul24/src/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import App from "./App";
import { useGame } from "./game/store";
import { useInterest } from "./interest/store";

beforeEach(() => {
  useGame.setState({ screen: "map", cabinId: null, focusedGadgetId: null });
  useInterest.setState({ byGadget: {} });
});

// PRD §11 refuses any child-facing quantified or ranked display of the child's own engagement.
// A time-on-task ranking makes the measured quantity a target, which converts the instrument into
// an engagement-contingent reward (d = -0.46 in children, growing to -0.55 at ~2 weeks).
test("no child-reachable navigation offers the interest readout", () => {
  render(<App />);
  expect(screen.queryByRole("button", { name: /interest/i })).not.toBeInTheDocument();
  const nav = screen.getByRole("navigation", { name: /primary/i });
  expect(nav.querySelectorAll("button")).toHaveLength(1);
});

// The stronger guard: not "the button is gone" but "nothing a child can reach prints a duration".
// A button-absence test passes again the day someone adds a different entry point.
test("no child-reachable screen renders a time-on-task figure", () => {
  useInterest.setState({ byGadget: { nonogram: { activeMs: 90_000, opens: 3, solves: 1 } } });
  const { container } = render(<App />);
  expect(container.textContent).not.toMatch(/\d+(\.\d+)?\s*(sec|min)\b/);
});

test("the readout is still reachable behind the QA gate, for an operator", async () => {
  const { installQa } = await import("./qa");
  installQa();
  useInterest.setState({ byGadget: { nonogram: { activeMs: 90_000, opens: 3, solves: 1 } } });
  window.__qa?.showReadout();
  render(<App />);
  expect(screen.getByText("Your interests")).toBeInTheDocument();
  expect(window.__qa?.interest().nonogram?.activeMs).toBe(90_000);
});
```

Check `interest/store.ts`'s actual `byGadget` value shape before running, and match it exactly — if the fields differ from `{activeMs, opens, solves}`, use the real ones in `setState`.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/App.test.tsx
```

Expected: the first two tests FAIL (the "Interest" button is present; the container prints `1.5 min`), and the third FAILS on `Cannot find module './qa'`.

- [ ] **Step 3: Create the QA contract**

Create `passion/apps/mvp-jul24/src/qa.ts`, modelled on `passion/apps/guide-console/app/qa.ts`:

```ts
// The `window.__qa` contract for this app.
//
// The interest counters are NOT deleted — PRD §11's refusal is specifically about a *child-facing*
// quantified display, and it says operator/guide-facing readouts are fine. So they move here: an
// operator can read them, and a child has no path to them. `ReadoutScreen` stays mounted for this
// entry point and for its own tests.
import { useGame } from "./game/store";
import { useInterest } from "./interest/store";

export interface QaContract {
  readonly ready: boolean;
  showReadout(): void;
  interest(): Record<string, { activeMs: number; opens: number; solves: number }>;
}

declare global {
  interface Window {
    __qa?: QaContract;
  }
}

export function installQa(): void {
  if (typeof window === "undefined") return;
  window.__qa = {
    ready: true,
    showReadout: () => useGame.getState().goToReadout(),
    interest: () => useInterest.getState().byGadget,
  };
}
```

- [ ] **Step 4: Remove the nav button from `App.tsx`**

Delete the whole second `<button>` (lines 48–55), leaving the "Map" button as the only child of `<nav>`. Update the file's header comment, which currently says "a persistent top bar (Map / Interest nav)" and also mentions a "cabin A/B backend toggle" that no longer exists:

```tsx
/**
 * Top-level router: a persistent top bar and a body that switches on the current game screen.
 *
 * There is deliberately NO interest / readout entry point here. A child-facing display of their own
 * time-on-task is refused by PRD §11 three times over — it is a quantified display of the child's
 * own engagement, it makes the measured quantity a target (converting the instrument into an
 * engagement-contingent reward, d = -0.46 in children and growing to -0.55 by ~2 weeks), and "your
 * interests" asserts the fixed discovered-interest model. The screen still exists for operators
 * behind `window.__qa.showReadout()` — see src/qa.ts. Do not re-add a button.
 */
```

Leave line 66 (`{screen === "readout" ? <ReadoutScreen /> : null}`) exactly as it is: the screen is now only entered through the QA gate.

- [ ] **Step 5: Install the contract at startup**

In `passion/apps/mvp-jul24/src/main.tsx`, import and call it before render:

```tsx
import { installQa } from "./qa";

installQa();
```

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/App.test.tsx src/interest
```

Expected: PASS, including the pre-existing `ReadoutScreen.test.tsx` and `interest/store.test.ts`, which must not need changes — if they do, the counters were altered rather than relocated, which is wrong.

- [ ] **Step 7: Commit**

```bash
git add passion/apps/mvp-jul24/src/qa.ts passion/apps/mvp-jul24/src/App.tsx \
        passion/apps/mvp-jul24/src/main.tsx passion/apps/mvp-jul24/src/App.test.tsx
git commit -m "fix(mvp-jul24): remove the child-facing time-on-task readout (PRD §11)

An ungated \"Interest\" button in the child's primary nav opened a screen
titled \"Your interests\" ranking gadgets by time-on-task with the minutes
printed. §11 refuses that on three counts, and the strongest is that a
visible time-on-task ranking converts the instrument into an
engagement-contingent reward: d = -0.46 in children, growing from -0.35
immediate to -0.55 at ~2 weeks.

The counters are relocated, not deleted — §11 permits operator-facing
readouts — and reach an operator through window.__qa.showReadout(). The
regression guard asserts no child-reachable path renders a duration at
all, because a button-absence test passes again the day someone adds a
different entry point."
```

---

### Task 2: Collapse three cabin backends to `backdrop` only

**Do this before tasks 6 and 7.** Every activity currently needs placing in three hand-tuned coordinate systems; parking two backends removes that tax from all later work.

**Files:**
- Modify: `passion/apps/mvp-jul24/src/game/store.ts:17-46`
- Modify: `passion/apps/mvp-jul24/src/cabin/CabinView.tsx` (whole file)
- Modify: `passion/apps/mvp-jul24/src/game/types.ts` (the `CabinBackend` type)
- Modify: `passion/apps/mvp-jul24/tools/shoot.ts:66-79`, `passion/apps/mvp-jul24/tools/smoke.ts:90-120,159-200`
- Test: `passion/apps/mvp-jul24/src/cabin/CabinView.test.tsx` (create if absent), `passion/apps/mvp-jul24/src/game/store.test.ts`

**Interfaces:**
- Consumes: `backdropRoomFor(topic)` and `BACKDROP_ROOMS` from `cabin/backdrop/quads.data.ts`; `CabinBackdrop` from `cabin/backdrop/CabinBackdrop.tsx`. Both unchanged.
- Produces: `CabinView` renders `CabinBackdrop` unconditionally when a cabin is open. `useGame` no longer has `cabinBackend` or `setBackend`. Later tasks touch neither.

**Park, do not delete:** `cabin/Cabin3D.tsx`, `cabin/scene3d/` (10 files), `cabin/CabinStatic.tsx`, `cabin/CabinStatic.css`, `cabin/hotspots.ts`. They keep compiling and keep their tests. Only `CabinView.tsx`'s imports of `Cabin3D` and `CabinStatic` go away — verified: those two files have no other importer, and `scene3d/` is imported only by `Cabin3D.tsx`.

`CabinStatic.test.tsx` and any `scene3d` tests keep passing because they render the components directly. Do not touch them.

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/cabin/CabinView.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useGame } from "../game/store";
import { BACKDROP_ROOMS } from "./backdrop/quads.data";
import CabinView from "./CabinView";

beforeEach(() => {
  useGame.setState({ screen: "cabin", cabinId: "logic-games", focusedGadgetId: null });
});

test("renders nothing when no cabin is open", () => {
  useGame.setState({ cabinId: null });
  const { container } = render(<CabinView />);
  expect(container.firstChild).toBeNull();
});

// One backend. `?cabin=3d` / `?cabin=static` are gone, so no query param and no store field can
// route a player to a parked backend.
test("every cabin renders the backdrop, and no other backend", () => {
  for (const room of BACKDROP_ROOMS) {
    useGame.setState({ cabinId: room.topic });
    const { container, unmount } = render(<CabinView />);
    expect(container.querySelector(".cabin-backdrop")).not.toBeNull();
    expect(container.querySelector(".cabin-static")).toBeNull();
    // (Correction, post-implementation: `querySelector("canvas")` is impossible to satisfy — the
    // aliveness dust-mote layer legitimately renders a `<canvas>`. What this guards against is the
    // 3D backend's WebGL canvas specifically, so exclude the aliveness one by class.)
    expect(container.querySelector("canvas:not(.cabin-aliveness-motes)")).toBeNull();
    unmount();
  }
});

test("the store exposes no backend selector", () => {
  expect("cabinBackend" in useGame.getState()).toBe(false);
  expect("setBackend" in useGame.getState()).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/cabin/CabinView.test.tsx
```

Expected: FAIL — the last test finds `cabinBackend` and `setBackend` still on the store.

- [ ] **Step 3: Simplify `CabinView.tsx`**

Replace the whole file:

```tsx
import { useEffect } from "react";
import { gadgetsForTopic } from "../gadgets/registry";
import { useGame } from "../game/store";
import { sessionLog } from "../signals/session";
import CabinBackdrop from "./backdrop/CabinBackdrop";
import "./CabinView.css";

/**
 * Renders the open cabin, or nothing when none is open.
 *
 * ONE BACKEND, DECIDED 2026-07-26. `backdrop` — the generated still plate with clickable
 * perspective prop polygons — is the only path. `3d` (Cabin3D + scene3d/) and `static`
 * (CabinStatic + hotspots.ts) are PARKED on the LITS/Minesweeper precedent: still in the tree,
 * still compiled, still covered by their own tests, simply not rendered. Nothing was deleted.
 *
 * The old authored-quads fallback to `static` is gone with them, and it is not missed:
 * `quads.data.test.ts` already requires a topic's backdrop room to cover every gadget in that topic
 * exactly once, so the build is the reachability guard. The fallback was insuring against a failure
 * the test already prevents.
 *
 * TO REVERSE: re-import Cabin3D or CabinStatic here and branch on a backend again. Both components
 * and all their placements (`scene3d/anchors.ts`, `cabin/hotspots.ts`) were left in place on
 * purpose. Note that `backdrop` needs no WebGL — it is an <img> plus SVG polygons — so restoring
 * `static` as a "no-WebGL fallback" would be restoring it for a reason that no longer exists.
 */
export const CabinView: React.FC = () => {
  const cabinId = useGame((s) => s.cabinId);

  // Every gadget on the wall was on offer, so each one the child walked past is a decline against a
  // visible alternative. Recorded once per session — a re-render must not inflate availability.
  useEffect(() => {
    if (!cabinId) return;
    for (const gadget of gadgetsForTopic(cabinId)) {
      sessionLog.recordSurfaced(gadget.id);
    }
  }, [cabinId]);

  if (!cabinId) return null;

  return (
    <div className="cabin-view" data-backend="backdrop">
      <CabinBackdrop topic={cabinId} />
    </div>
  );
};

export default CabinView;
```

Keep `data-backend="backdrop"` — `CabinView.css` and the smoke tooling both key off `.cabin-view`, and a stable attribute costs nothing.

- [ ] **Step 4: Remove the backend from the store**

In `game/store.ts`, delete `SELECTABLE_BACKENDS`, `requested`, `initialBackend`, the `cabinBackend` field, the `setBackend` action, and both of their entries in `interface GameState`. Replace the long header comment with:

```ts
/**
 * `backdrop` — the still generated painting with clickable perspective props — is the ONLY cabin
 * backend as of 2026-07-26. The `?cabin=` query param is gone along with the `3d` and `static`
 * backends it selected; both are parked (see cabin/CabinView.tsx for what that means and how to
 * reverse it). The reachable-in-WebGL ceiling is why: the hand-built room read as under-furnished,
 * and raising it would cost more than the painting did while still losing on fidelity. The "a still
 * is dead" objection is answered by the aliveness layer (firelight, dust in the shaft, parallax).
 */
```

Leave `game/types.ts`'s `CabinBackend` type in place if the parked components reference it; if nothing references it after this change, delete the type. Check with `grep -rn "CabinBackend" passion/apps/mvp-jul24/src` and act on what you find — do not leave an unreferenced type.

- [ ] **Step 5: Repoint the headless tooling**

`store.ts` recorded that `?cabin=static` is "what the headless screenshot tooling drives … since it needs no GPU". `backdrop` needs no GPU either — it is an `<img>` plus SVG — so the tooling drops the param and takes the default. Three edits:

In `tools/shoot.ts`, replace the `?cabin=static` URL (line ~68) and its comment:

```ts
    // The backdrop is the only backend and needs no WebGL (an <img> plus SVG polygons), so the
    // headless shooter takes the default with no query param.
    const url = `${base}/`;
```

In `tools/smoke.ts`, in the static function (line ~99): change `${base}/?cabin=static` to `${base}/`, change `waitForSelector(".cabin-static")` to `waitForSelector(".cabin-backdrop")`, change the click selector `[data-gadget="nonogram"]` to `[data-prop="nonogram"]` (the backdrop labels props `data-prop={prop.gadgetId}`), and rename the function and its labels from `static` to `backdrop` — including the output filename `smoke-cabin-static.png` → `smoke-cabin-backdrop.png` and the `wireConsoleWatchers(page, "static")` tag.

Then delete `shoot3dCabin` entirely along with its call in `smoke()`. It exists only to screenshot a parked backend, and its `canvasCount === 0` warning would now fire every run.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/cabin src/game
```

Expected: PASS, including `CabinStatic.test.tsx` and `quads.data.test.ts` untouched. Then confirm the parked code still compiles:

```bash
cd passion/apps/mvp-jul24 && pnpm typecheck
```

Expected: exit 0. A failure here means something was deleted rather than parked.

- [ ] **Step 7: Commit**

```bash
git add passion/apps/mvp-jul24/src/cabin/CabinView.tsx \
        passion/apps/mvp-jul24/src/cabin/CabinView.test.tsx \
        passion/apps/mvp-jul24/src/game/store.ts passion/apps/mvp-jul24/src/game/types.ts \
        passion/apps/mvp-jul24/tools/shoot.ts passion/apps/mvp-jul24/tools/smoke.ts
git commit -m "refactor(mvp-jul24): one cabin backend — backdrop; park 3d and static

Every activity needed placing in three hand-tuned coordinate systems
(scene3d/anchors.ts, cabin/hotspots.ts, backdrop/quads.data.ts).
PROJECT.md called the default \"still open\" while the code already
defaulted to backdrop; this closes it.

Cabin3D + scene3d/ and CabinStatic + hotspots.ts are parked on the
LITS/Minesweeper precedent — in tree, compiled, tests passing, out of the
render path. Nothing deleted. CabinView's authored-quads fallback goes
too: quads.data.test.ts already enforces exactly-once gadget coverage per
topic, so the build is the reachability guard.

Retiring static costs no hardware coverage: backdrop is an <img> plus SVG
polygons and needs no WebGL, so the \"no-WebGL fallback\" rationale dies
with the 3D path. The headless tooling that drove ?cabin=static now takes
the default, with .cabin-static -> .cabin-backdrop and
[data-gadget] -> [data-prop]."
```

---

### Task 3: Amend PRD §5.2 for the dormant canvas rule

**Files:**
- Modify: `docs/prd/DISCOVERY-APP-PRD.md` §5.2 (the Layer 2 bullet, and a new paragraph after the fixed-camera rationale)

**Interfaces:** none — documentation only. No task depends on this.

This is a separate PR because `docs/prd/` is a different CODEOWNERS lane from `passion/apps/`.

§5.2 currently requires "**One cabin's 3D loads at a time**, on a **single persistent canvas whose contents swap** on enter/exit (never a fresh scene per cabin — the one architectural rule that must not be violated)." After task 2 there is no 3D canvas in the product's only path, so the rule is moot rather than met. Do not delete it: its justification is a ~3× art-budget saving, which is exactly the kind of reasoning that gets forgotten and then re-violated.

- [ ] **Step 1: Amend the Layer 2 bullet**

Append to that bullet, after "(never a fresh scene per cabin — the one architectural rule that must not be violated)":

```markdown
**Status as of 2026-07-26: dormant, not withdrawn.** The interior is now served by a generated
still plate with clickable perspective prop polygons (`backdrop`), which uses no WebGL and mounts
no canvas, so there is no canvas to persist. The rule is unchanged and binds any future 3D
interior; it simply has nothing to govern while the interior is a still. It was never satisfied
while 3D *was* the default — `<Canvas>` mounted inside `Cabin3D` and unmounted on exit to the map,
which is the fresh-scene-per-cabin case the rule names — so this records a rule going dormant, not
a rule being met. Do not delete it on the grounds that nothing currently violates it: the 3× art
budget saving it protects is the reason the fixed camera is permanent, and a future walkable or
free-camera interior needs to argue with this sentence first.
```

- [ ] **Step 2: Note the parked backend where the reader will look for it**

In the same section, after the "Life comes from camera motion inside the frame" paragraph, add:

```markdown
**Which backend serves Layer 2 (2026-07-26).** One: `backdrop`, a generated still plate with
clickable perspective prop polygons in the art's own coordinate space. The real-time R3F room and
the flat-illustration fallback are parked in the tree, not deleted
(`passion/apps/mvp-jul24/src/cabin/CabinView.tsx` records how to reverse it). The still buys
fidelity the hand-built room could not reach at roughly zero GPU cost, which is the same
pre-rendered-adventure economics that makes the fixed camera correct — the two decisions share one
argument. Note this does **not** reopen Layer 3: `backdrop` needing no WebGL is a hardware fact and
has nothing to do with the accessibility mirror, which is still required on its own grounds.
```

- [ ] **Step 3: Verify the section still reads coherently**

Re-read §5.2 start to finish. The three status notes it now carries must not contradict each other: the walkable overworld is **deferred**, the fixed camera is **permanent**, and the persistent-canvas rule is **dormant**. If any sentence still implies 3D is the shipping interior, fix it.

- [ ] **Step 4: Commit**

```bash
git add docs/prd/DISCOVERY-APP-PRD.md
git commit -m "docs(prd): §5.2 — the single-persistent-canvas rule is dormant, not withdrawn

The interior is now a still plate with no canvas, so the rule has nothing
to govern. Recorded as dormant rather than deleted: it was never actually
satisfied while 3D was the default (<Canvas> unmounted on exit to the
map, the fresh-scene-per-cabin case it names), and the ~3x art-budget
saving it protects is the same argument that makes the fixed camera
permanent. Also records which backend serves Layer 2, and that this does
not reopen the Layer 3 accessibility mirror."
```

---

### Task 4: Reconcile three docs stale since #179

**Files:**
- Modify: `passion/apps/mvp-jul24/PROJECT.md`
- Modify: `passion/apps/mvp-jul24/src/gadgets/registry.ts:20-30` (the header comment only)
- Modify: `passion/apps/mvp-jul24/src/cabin/CabinView.tsx` — already rewritten in task 2; verify no stale claim survived

**Interfaces:** none — comments and prose only. No code behaviour changes, so no new tests.

Three claims were true before #179 and are false after it. `math` has five authored activities and `BACKDROP_ROOMS` contains both `LOGIC_GAMES` and `MATH`.

- [ ] **Step 1: Fix `registry.ts`'s header comment**

Replace the paragraph beginning "The `math` entries carry no `hotspot` that means anything yet":

```ts
 * The `math` entries are fully authored: `cabin/backdrop/quads.data.ts` has a `MATH` room whose prop
 * quads cover all five, traced onto `public/art/cabin-backdrop-math.png` (#179). PROJECT.md's
 * prop-to-activity map records which painted object is which.
```

Also fix the sentence above it — "Consumers of `gadgetsForTopic` must still tolerate an empty list — `music`/`code`/`art` return one (see scene3d/anchors.ts and cabin/CabinStatic.tsx, both of which render a normal empty room)" — since both files named are now parked. Point it at the live renderer instead:

```ts
 * Consumers of `gadgetsForTopic` must still tolerate an empty list: `music`/`code`/`art` return one.
 * `cabin/backdrop/CabinBackdrop.tsx` renders a normal empty room for them.
```

- [ ] **Step 2: Amend `PROJECT.md` — the backend fork**

In *Visual direction*, the bullet claiming "**3D is the direction and the winner**" and the later sentence "Which becomes the default is **still open**" are both superseded. Write the reversal as a reversal — do not delete the old sentence silently:

```markdown
### The backend fork is closed — DECIDED 2026-07-26

**`backdrop` is the only backend. `3d` and `static` are parked.** This **reverses** "3D is the
direction and the winner… the painterly static art is not the target and never was the
destination," recorded above and deliberately left there so the change is legible.

What reversed it is the thing that motivated the still plate in the first place: the
reachable-in-WebGL ceiling is a real ceiling, and #159/#166/#179 are where the app's actual fidelity
came from. Parking `static` costs nothing extra — `backdrop` is an `<img>` plus SVG polygons and
needs no WebGL, so the "no-WebGL fallback" rationale dies together with the 3D path rather than
outliving it. Accessibility is unaffected either way: that is **A5**, the Layer-3 DOM mirror, which
`CabinStatic` never was.

Nothing was deleted. `Cabin3D.tsx`, `scene3d/`, `CabinStatic.tsx` and `hotspots.ts` are all still in
the tree, still compiled, still covered by their own passing tests — the LITS/Minesweeper precedent.
`cabin/CabinView.tsx` carries the reversal instructions.
```

- [ ] **Step 3: Amend `PROJECT.md` — the readout, and the stale `math` claims**

Add to *Risks logged but not solved* or a new *Corrected* section:

```markdown
### The child-facing interest readout is gone — 2026-07-26

An ungated "Interest" button sat in the child's primary nav and opened a screen titled "Your
interests", ranking gadgets by time-on-task with the minutes printed. PRD §11 refuses that three
times over: it is a child-facing quantified display of the child's own engagement; a visible
time-on-task ranking makes the measured quantity a target, converting the instrument into an
engagement-contingent reward (**d = −0.46** in children, growing −0.35 immediate → −0.55 at ~2
weeks); and "your interests" asserts the fixed discovered-interest model. The counters survive
behind `window.__qa` — §11 permits operator-facing readouts — and no child-reachable path renders a
duration. **Do not re-add a child-facing one.**
```

Then correct the two stale `math` statements. In *Risks*, "`math` currently has zero activities in it anyway" is false — it has five. Rewrite that clause while **keeping the cross-cabin warning intact**, because the warning does not depend on the count:

```markdown
  create one.** Density is now 4-vs-5 rather than 7-vs-5, which is a real improvement and is one of
  the reasons the trim was taken — but memo §8.2's limit is not a density threshold that 4-vs-5
  clears. Unequal cabins are not a criticism of the build; **no cross-cabin comparison from it is
  valid**, density included. Any number comparing Logic Games against Math out of this build is an
  artifact of how many doors each room has. Do not let "we density-matched it" become a licence to
  compare.
```

Also update the *Explicitly deferred* entry for live previews and the *Risks* entry about backdrop emission if either still describes `math` as unauthored, and fix the *Visual direction* line saying `?cabin=backdrop` "opts in" — it is now the only path and there is no query param.

- [ ] **Step 4: Verify no stale claim survives**

```bash
cd passion/apps/mvp-jul24 && grep -rn "cabin=static\|cabin=3d\|cabin=backdrop\|zero activities\|not authored\|still open" PROJECT.md src/ tools/
```

Expected: no hit that asserts a query param exists, that `math` is unauthored, or that the backend choice is open. Hits inside the parked components' own comments are fine if they describe those components accurately.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/PROJECT.md passion/apps/mvp-jul24/src/gadgets/registry.ts
git commit -m "docs(mvp-jul24): reconcile PROJECT.md and registry.ts with what shipped

Three claims were true before #179 and false after it: that math has zero
activities, that its backdrop room is unauthored, and that the backend
default is still open. Records the backend reversal as a reversal rather
than deleting the superseded sentence, and records why the child-facing
interest readout is gone so it is not re-added as a feature."
```

---

### Task 5: Make emission-off recorded rather than unstated

**Files:**
- Modify: `passion/apps/mvp-jul24/src/signals/session.ts`
- Test: `passion/apps/mvp-jul24/src/signals/session.test.ts`

**Interfaces:**
- Consumes: `createSignalLog` from `signals/log.ts`, unchanged.
- Produces: `EMISSION_ENABLED: boolean` and the existing `sessionLog` export from `signals/session.ts`. When emission is off, `sessionLog`'s recording methods are no-ops and its readers return empty arrays. `CabinView.tsx` and `GadgetOverlay.tsx` keep calling it unconditionally — call sites do not branch.

`PROJECT.md` logs this and gives the instruction: the backdrop's prop polygons and the bookshelf emit nothing, so records are *silently partial* — well-formed, and under-counting every prop opened through the backdrop. Its words: "Either wire the backdrop props into emission before trusting any of it, or gate the backdrop out of sessions whose records are analysed. **Do not split the difference.**" After task 2 the backdrop is the only backend, so the under-count is total. Wiring emission is measurement work and out of scope; this makes the off-state explicit so nobody reads missing engagement as absence of engagement.

- [ ] **Step 1: Write the failing test**

Append to `passion/apps/mvp-jul24/src/signals/session.test.ts`:

```ts
import { expect, test } from "vitest";
import { EMISSION_ENABLED, sessionLog } from "./session";

// PROJECT.md: the backdrop's prop polygons and the bookshelf emit nothing, and the backdrop is now
// the only backend. So a log that looks well-formed would under-count every open. Emission is OFF,
// stated in one place, rather than silently partial.
test("emission is off, and that is an explicit recorded fact", () => {
  expect(EMISSION_ENABLED).toBe(false);
});

test("with emission off the log accepts calls and records nothing", () => {
  sessionLog.recordSurfaced("nonogram");
  sessionLog.recordOpen("nonogram", 60_000);
  sessionLog.recordDepth("nonogram", "unrequired_revision");
  expect(sessionLog.surfaced()).toHaveLength(0);
  expect(sessionLog.interactions()).toHaveLength(0);
});
```

The existing tests in this file assert that `recordSurfaced` *does* record. They now contradict the new behaviour, so move them to test `createSignalLog` directly (which keeps working — it is the log, not the session wrapper) rather than deleting them. `signals/log.test.ts` already covers `createSignalLog` and needs no change.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/signals
```

Expected: FAIL on `EMISSION_ENABLED` not being exported.

- [ ] **Step 3: Add the switch**

Rewrite `signals/session.ts`:

```ts
import { createSignalLog } from "./log";

/** Stable per page load. */
export const SESSION_ID = `s-${Date.now().toString(36)}`;

/**
 * WHETHER THIS APP EMITS SIGNAL RECORDS AT ALL. It does not, and that is a decision.
 *
 * The `backdrop` backend is the only one left, and its interaction surfaces — the perspective prop
 * polygons and the bookshelf — emit nothing. So a log left switched on would be *silently partial*:
 * records exist, they look well-formed, and they under-count every prop opened through the backdrop.
 * Anyone reading that data without reading this comment would treat missing engagement as absence of
 * engagement, which is the one misreading `SurfacedRecord` exists to prevent.
 *
 * PROJECT.md's instruction is "either wire the backdrop props into emission before trusting any of
 * it, or gate the backdrop out of sessions whose records are analysed. Do not split the difference."
 * Wiring emission is measurement work, deferred by decision (see the design doc's §2), so this is
 * the other branch — taken explicitly, in one place, instead of left implicit.
 *
 * TO TURN IT BACK ON: wire the backdrop's `PropHotspot` and the shelf into `recordOpen` /
 * `recordSurfaced` FIRST, then flip this. Flipping it alone reinstates the silent under-count.
 *
 * Note what this is NOT: it is not a claim the records would be wrong if complete, and it is not a
 * privacy control. It is truth-in-labelling on coverage.
 */
export const EMISSION_ENABLED = false;

const live = createSignalLog({ sessionId: SESSION_ID, now: () => Date.now() });

/**
 * A no-op with the same shape, so call sites never branch on emission. A call site that had to ask
 * "are we recording?" would eventually ask it inconsistently.
 */
const off: typeof live = {
  recordSurfaced: () => {},
  recordOpen: () => {},
  recordDepth: () => {},
  surfaced: () => [],
  interactions: () => [],
};

export const sessionLog: typeof live = EMISSION_ENABLED ? live : off;
```

If `session.ts` currently exports anything else, keep it exactly as it was.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/signals src/cabin src/overlay
```

Expected: PASS. `signals/log.test.ts` is unchanged and still green — the log itself is untouched. `signals/wiring.test.tsx` may assert that opening a gadget produces a record; if so, repoint it at `createSignalLog` so it still tests the wiring shape, and add a comment saying why the session-level log is off.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/signals/session.ts passion/apps/mvp-jul24/src/signals/session.test.ts
git commit -m "fix(mvp-jul24): state emission-off explicitly instead of leaving it partial

The backdrop's prop polygons and bookshelf emit nothing, and after the
backend collapse the backdrop is the only path — so a live log
under-counts every open while looking well-formed. PROJECT.md's own
instruction is to wire it or gate it and not split the difference;
wiring is deferred measurement work, so this takes the other branch in
one named place. A no-op log with the same shape keeps call sites from
branching on emission."
```

---

### Task 6: Give `logic-games` alternating difficulty

**Depends on task 2.** Phase B starts here.

**Files:**
- Modify: `passion/apps/mvp-jul24/src/puzzles/Nonogram/Nonogram.tsx:26-38,67-69`
- Modify: `passion/apps/mvp-jul24/src/puzzles/Pipes/Pipes.tsx` (the `size` default at line ~58)
- Test: `passion/apps/mvp-jul24/src/puzzles/Nonogram/Nonogram.test.tsx`, `passion/apps/mvp-jul24/src/puzzles/Pipes/Pipes.test.tsx`

**Interfaces:**
- Consumes: `generatePuzzle(seed: number, size?: number)` from `Nonogram/generate.ts`; `generateLevel(seed: number, size?: number)` and `EASY_SIZE` from `Pipes/generate.ts`.
- Produces: nothing other tasks consume. Task 7 adds an optional `tier` prop to `PuzzleProps` and wires it here — keep the round-derived default so task 7 is additive.

**The convention, stated once:** `logic-games` gets **alternation**, matching the majority of `math` (`GearTrain`, `BalanceScale`, `RatioMixing` all alternate; `RatioMixing.tsx` records it as deliberate — "Tiers alternate so a session meets both benches"). Not climb-and-cap: a monotonic climb is an escalation the child never chose, which is the objection task 7 exists to answer. `FunctionMachine` and `FractionLaser` keep their climb-and-cap and are **out of scope** — they are not broken.

- [ ] **Step 1: Write the failing tests**

Create `passion/apps/mvp-jul24/src/puzzles/Nonogram/Nonogram.test.tsx`:

```tsx
import { expect, test } from "vitest";
import { SIZES, sizeForRound } from "./Nonogram";

// Alternation, not a climb: a session meets both sizes, and nothing escalates past what the child
// chose. Same convention as GearTrain/BalanceScale/RatioMixing in the math cabin.
test("consecutive rounds are not all the same size", () => {
  const sizes = [0, 1, 2, 3].map(sizeForRound);
  expect(new Set(sizes).size).toBeGreaterThan(1);
});

test("round 0 is the easier size, so a first visit is never the hard one", () => {
  expect(sizeForRound(0)).toBe(Math.min(...SIZES));
});

test("every size is one the generator can actually satisfy", () => {
  for (const size of SIZES) expect(size).toBeGreaterThanOrEqual(5);
});
```

Then the equivalent in `passion/apps/mvp-jul24/src/puzzles/Pipes/Pipes.test.tsx`, importing `sizeForRound` and `SIZES` from `./Pipes`. If a test file already exists for either, append rather than overwrite.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/Nonogram src/puzzles/Pipes
```

Expected: FAIL on `sizeForRound` not being exported.

- [ ] **Step 3: Add rounds and alternation to `Nonogram`**

`Nonogram` has no round concept — its "Next puzzle" regenerates in place. Add one, and export the tier function so it is testable:

```tsx
/**
 * The two board sizes this cabin alternates between, easier first.
 *
 * Nonogram was permanently 5x5 before 2026-07-26: `generatePuzzle`'s `size` parameter existed and
 * nothing ever passed it, so the room a player meets first was also the flat one while every math
 * activity varied. 7 is the step up — large enough to need real line-solving, small enough that the
 * generator's uniqueness check still converges inside MAX_ATTEMPTS.
 */
export const SIZES = [5, 7] as const;

/**
 * ALTERNATES, deliberately — it does not climb. Same convention as GearTrain, BalanceScale and
 * RatioMixing, whose comment states the reason: a session should meet both. A monotonic ramp is an
 * escalation the child never chose, and offering a choice is what the harder-variant control is for.
 */
export function sizeForRound(round: number): number {
  return SIZES[round % SIZES.length]!;
}
```

Then thread a round through the component. Add `const [round, setRound] = useState(0);`, pass the size into generation, and advance the round in `nextPuzzle`:

```tsx
function generateFreshPuzzle(base: number, size: number, avoid?: boolean[][]): NonogramPuzzle {
  let puzzle = generatePuzzle(nextGeneratorSeed(base), size);
  while (avoid && sameSolution(puzzle.solution, avoid)) {
    puzzle = generatePuzzle(nextGeneratorSeed(base), size);
  }
  return puzzle;
}
```

```tsx
  const [round, setRound] = useState(0);
  const [puzzle, setPuzzle] = useState<NonogramPuzzle>(() =>
    generateFreshPuzzle(seed, sizeForRound(0)),
  );

  const nextPuzzle = useCallback(() => {
    setRound((r) => {
      const nextRound = r + 1;
      setPuzzle((p) => generateFreshPuzzle(seed, sizeForRound(nextRound), p.solution));
      return nextRound;
    });
  }, [seed]);
```

The existing `useEffect` that resets the grid keys on `[puzzle]`, so it already handles a size change — `blankGrid(puzzle.size)` reads the new size. Verify that, and do not add a second reset effect.

- [ ] **Step 4: Add the same to `Pipes`**

`Pipes` already takes a `size`; it just always receives the default. Read `Pipes/generate.ts` for its existing presets (`EASY_SIZE` and any others) and use the real constants rather than inventing numbers. Export `SIZES` and `sizeForRound` with the same alternating shape and the same comment, then replace the `size` default at the `generateLevel(genSeed, size)` call so it comes from a round the component owns. If `Pipes` takes `size` as a prop from outside, keep the prop and use it as an override — `sizeForRound(round)` becomes the default only.

- [ ] **Step 5: Inspect `Mirror` and `Chess`, and record what you find**

The other two `logic-games` activities may have no sensible difficulty axis, and the spec is explicit that this gets **recorded, not forced**.

```bash
cd passion/apps/mvp-jul24
grep -nE "export function generate|size|difficulty|tier|TIERS" src/puzzles/Mirror/*.ts
grep -nE "export |bank|rating|elo|difficulty" src/puzzles/Chess/bank.ts src/puzzles/Chess/freeplay.ts
```

Then act on what is actually there:

- **`Mirror`** — if its generator takes a grid size or a mirror count, give it the same `SIZES` / `sizeForRound` treatment as `Nonogram`, in the same commit.
- **`Chess`** — it is a curated puzzle bank, not a generator, so its only ladder is *selection*. If the bank entries carry a rating or a mate-in-N depth, alternate between an easier and a harder band using the same `round % 2` shape. If they carry nothing to sort by, **do not invent a difficulty**: add a comment in `Chess.tsx` recording that the bank has no difficulty axis, that this is why Chess does not alternate, and what would have to exist in the bank for it to.

Either way one of the two outcomes is written down. Leaving it silent is the failure mode — the next person re-derives it.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles
```

Expected: PASS across every puzzle suite — the `math` five must be untouched and still green. Then check the generator actually converges at the new size, since Nonogram's uniqueness check can exhaust `MAX_ATTEMPTS`:

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/puzzles/Nonogram/generate.test.ts
```

If a 7×7 generation throws or hangs, drop the harder size to 6 and say so in the `SIZES` comment. Do not raise `MAX_ATTEMPTS` to force it.

- [ ] **Step 7: Commit**

```bash
git add passion/apps/mvp-jul24/src/puzzles/Nonogram passion/apps/mvp-jul24/src/puzzles/Pipes \
        passion/apps/mvp-jul24/src/puzzles/Mirror passion/apps/mvp-jul24/src/puzzles/Chess
git commit -m "feat(mvp-jul24): logic-games alternates difficulty like the math cabin

Nonogram was permanently 5x5 — its generator's size parameter existed and
nothing passed it — while all five math activities varied. The older,
more-played room was the flat one.
(Correction, post-implementation: Pipes was NOT permanently easy — it
already alternated EASY_SIZE/HARD_SIZE via its own sizeForRound. Nonogram
was the only flat one in the room; drop Pipes from this commit's file list
and message if it needed no change.)

Alternation, not a climb, matching GearTrain/BalanceScale/RatioMixing,
whose comment records the reason: a session should meet both tiers, and a
monotonic ramp escalates past what the child chose. FunctionMachine and
FractionLaser keep their climb-and-cap; they are not broken."
```

---

### Task 7: Offer a harder variant

**Depends on tasks 2 and 6.**

**Files:**
- Modify: `passion/apps/mvp-jul24/src/game/types.ts` (`PuzzleProps` gains optional `tier`)
- Modify: `passion/apps/mvp-jul24/src/overlay/GadgetOverlay.tsx:58-62,71-117,119-138`
- Modify: `passion/apps/mvp-jul24/src/puzzles/Nonogram/Nonogram.tsx` (accept the prop)
- Test: `passion/apps/mvp-jul24/src/overlay/GadgetOverlay.test.tsx`

**Interfaces:**
- Consumes: `sizeForRound` / `SIZES` from task 6.
- Produces: `PuzzleProps.tier?: number`. Optional on purpose — the other eight puzzles keep compiling untouched, which is what makes this a small change instead of a nine-component migration.

**There is no "Next puzzle" button in the overlay.** Each puzzle owns its own (`Nonogram`'s `nextPuzzle`, `RatioMixing`'s "Next order"). The overlay's one shared post-solve surface is its `Solved` component, which every puzzle reaches through `onSolved`. So the control goes there.

**Three constraints, all load-bearing.** It is a choice, never a gate — `shelf/types.ts` carries the argument, and gating depth on completion would launder an ability measure into a depth measure. No achievement copy. And **no visible tier number**, which would reintroduce exactly the quantified display task 1 removed.

- [ ] **Step 1: Write the failing test**

(Correction, post-implementation: this file already existed with 5 passing tests by the time this
task was reached — "Create" should read "extend". Add the tests below to the existing
`passion/apps/mvp-jul24/src/overlay/GadgetOverlay.test.tsx` rather than starting a new file.)

Create `passion/apps/mvp-jul24/src/overlay/GadgetOverlay.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
// (Correction, post-implementation: `@testing-library/user-event` is NOT an installed dependency
// of this app. Use `fireEvent` from `@testing-library/react` instead, and drop the `await` on the
// click calls below — `fireEvent.click` is synchronous.)
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test } from "vitest";
import { useGame } from "../game/store";
import GadgetOverlay from "./GadgetOverlay";

beforeEach(() => {
  useGame.setState({ screen: "cabin", cabinId: "logic-games", focusedGadgetId: null });
});

test("renders nothing with no gadget focused", () => {
  const { container } = render(<GadgetOverlay />);
  expect(container.querySelector(".gadget-overlay")).toBeNull();
});

// The offered harder variant. A CHOICE: the easier path stays available beside it, so nothing is
// gated and nothing escalates unasked.
test("the solved state offers a harder variant and an unchanged way back", async () => {
  useGame.setState({ focusedGadgetId: "nonogram" });
  render(<GadgetOverlay />);
  // Reach the solved state the way a player does — see step 2 for how the harness solves it.
  await solveCurrentPuzzle();
  expect(screen.getByRole("button", { name: /harder/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
});

// PRD §11 again: a visible tier/level number is a quantified display of the child's own
// engagement, which is what the child-facing readout was removed for.
test("no tier or level number is ever rendered", async () => {
  useGame.setState({ focusedGadgetId: "nonogram" });
  const { container } = render(<GadgetOverlay />);
  await solveCurrentPuzzle();
  await userEvent.click(screen.getByRole("button", { name: /harder/i }));
  expect(container.textContent).not.toMatch(/\b(tier|level|difficulty)\b/i);
  expect(container.textContent).not.toMatch(/\b\d+\s*\/\s*\d+\b/);
});
```

- [ ] **Step 2: Give the test a way to solve a puzzle**

Solving a generated nonogram through the DOM is slow and brittle, and it would test the generator rather than the overlay. Mock the registry instead, so the overlay renders a stub puzzle that solves on click. Put this **above** the `import GadgetOverlay` line in the test file — `vi.mock` is hoisted, but the stub has to be defined inside the factory:

```tsx
import type { PuzzleProps } from "../game/types";

// A stub puzzle, so the overlay's solved path is reachable in one click. `tier` is echoed into a
// data attribute rather than text: the no-number test below reads `textContent`, and production
// markup must never print a tier at all (PRD §11).
vi.mock("../gadgets/registry", () => ({
  gadgetById: (id: string) => ({
    id,
    topic: "logic-games",
    label: "Stub",
    status: "active",
    hotspot: { top: "50%", left: "50%" },
    Puzzle: ({ tier, onSolved, onExit }: PuzzleProps) => (
      <div data-testid="stub-puzzle" data-tier={tier ?? 0}>
        <button type="button" data-testid="qa-solve" onClick={onSolved}>
          solve
        </button>
        <button type="button" onClick={onExit}>
          exit
        </button>
      </div>
    ),
  }),
  gadgetsForTopic: () => [],
}));

/** Reach the solved state the way the overlay does: the puzzle calls `onSolved`. */
async function solveCurrentPuzzle(): Promise<void> {
  await userEvent.click(await screen.findByTestId("qa-solve"));
}
```

Match the mocked `hotspot` shape to whatever `GadgetHotspot` actually is in `game/types.ts` — if it differs, use the real shape, or the mock will not typecheck.

Add one assertion that the tier actually reaches the puzzle, which is the plumbing this task adds:

```tsx
test("the chosen tier reaches the puzzle", async () => {
  useGame.setState({ focusedGadgetId: "nonogram" });
  render(<GadgetOverlay />);
  expect(screen.getByTestId("stub-puzzle")).toHaveAttribute("data-tier", "0");
  await solveCurrentPuzzle();
  await userEvent.click(screen.getByRole("button", { name: /harder/i }));
  expect(screen.getByTestId("stub-puzzle")).toHaveAttribute("data-tier", "1");
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/overlay/GadgetOverlay.test.tsx
```

Expected: FAIL — no button matching `/harder/i` exists.

- [ ] **Step 4: Add the optional `tier` to `PuzzleProps`**

In `game/types.ts`:

```ts
export interface PuzzleProps {
  seed: number;
  /**
   * Which difficulty variant to open at, when the child asked for one. OPTIONAL on purpose: a
   * puzzle that has no tiers ignores it and still compiles, which is what keeps the harder-variant
   * control a small change rather than a nine-component migration.
   *
   * Never rendered. A visible tier number would be a quantified display of the child's own
   * engagement — the thing PRD §11 refuses and the child-facing readout was removed for.
   */
  tier?: number;
  onSolved: () => void;
  onExit: () => void;
}
```

- [ ] **Step 5: Own the tier in the overlay and offer the choice**

In `GadgetOverlay`, hold the tier and reset it per gadget, then pass it down and offer the bump from `Solved`:

```tsx
  const [tier, setTier] = useState(0);

  useEffect(() => {
    setSolved(false);
    setTier(0);
    // ...the rest of the existing effect body is unchanged
  }, [focusedGadgetId]);
```

```tsx
            {solved ? (
              <Solved
                reduce={!!reduce}
                onBack={() => useGame.getState().closeGadget()}
                onHarder={() => {
                  setTier((t) => t + 1);
                  setSolved(false);
                }}
              />
            ) : (
              <GadgetPuzzle id={focusedGadgetId} tier={tier} onSolved={() => setSolved(true)} />
            )}
```

In `Solved`, add the button beside the existing "← Back" — both present, neither preferred:

```tsx
      <button type="button" className="gadget-overlay-solved-harder" onClick={onHarder}>
        Try a harder one
      </button>
```

Add its signature to `Solved`'s props (`onHarder: () => void`) and a comment on the pair:

```tsx
/**
 * The win state, and the one shared place a harder variant is OFFERED.
 *
 * Both buttons are present and neither is preferred. That is the whole design: nothing is gated
 * (see shelf/types.ts for why — a completion gate would make "went deeper" a deterministic function
 * of "solved it", and `solves` indexes prior ability), and the harder board is a choice the child
 * makes rather than an escalation the app performs. No achievement copy, and no tier number: §11
 * refuses a quantified display of the child's own engagement.
 */
```

Then pass `tier` through `GadgetPuzzle` to the component:

```tsx
function GadgetPuzzle({ id, tier, onSolved }: { id: string; tier: number; onSolved: () => void }) {
```

```tsx
    <Component
      seed={seed}
      tier={tier}
      onSolved={/* unchanged */}
      onExit={/* unchanged */}
    />
```

- [ ] **Step 6: Let `Nonogram` honour the prop**

`Nonogram` owns a round from task 6. The `tier` prop overrides where it starts:

```tsx
export default function Nonogram({ seed, tier = 0, onSolved, onExit }: PuzzleProps) {
  const [round, setRound] = useState(tier);
  const [puzzle, setPuzzle] = useState<NonogramPuzzle>(() =>
    generateFreshPuzzle(seed, sizeForRound(tier)),
  );
```

Leave the other eight puzzles alone. They ignore `tier` and keep working — that is what optional buys.

- [ ] **Step 7: Run the tests to verify they pass**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/overlay src/puzzles && pnpm typecheck
```

Expected: PASS and exit 0.

- [ ] **Step 8: Commit**

```bash
git add passion/apps/mvp-jul24/src/game/types.ts passion/apps/mvp-jul24/src/overlay \
        passion/apps/mvp-jul24/src/puzzles/Nonogram
git commit -m "feat(mvp-jul24): offer a harder variant from the shared solved state

Automatic per-round variation is fine but it escalates past what the
child chose, and it produces none of the behaviour §8.5 defines as
chosen_challenge — took the harder variant though an easier one was
offered. The overlay's Solved component is the one shared post-solve
surface every puzzle reaches, so the offer lives there; PuzzleProps gains
an optional tier so the other eight puzzles compile untouched.

Both buttons are present and neither is preferred: nothing is gated, and
no tier number is rendered anywhere, which is the same §11 constraint the
child-facing readout was removed for. Nothing is recorded."
```

---

### Task 8: Cross-reference the Mirror Maze / Fraction Laser twin pair

**Files:**
- Modify: `passion/apps/mvp-jul24/src/shelf/cards.data.ts` (the `mirror` activity card in the `logic-games` deck, and the `fraction-laser` card in the `math` deck)
- Modify: `passion/apps/mvp-jul24/src/teachin/rules.tsx` (the two rules' text)
- Test: `passion/apps/mvp-jul24/src/shelf/cards.data.test.ts`

**Interfaces:**
- Consumes: `ShelfCard` from `shelf/types.ts`. `body` is `readonly [string, string]` — **exactly two paragraphs**, enforced by the type — so the cross-reference goes *inside* existing prose. Do not add a third paragraph; it will not compile.
- Produces: nothing other tasks consume.

The pair is the design's load-bearing comparison — same shell, only the content binding varied, the in-product analogue of the Zombie Division design (**75.7 min vs 10.28 min** of free-choice play, r = .89) — and a player currently cannot tell the two are one shell.

**Inert cross-reference only.** Not "you liked this, try that": a system-surfaced nudge is the `prompted`-versus-voluntary distinction the whole engine turns on, and priming a child toward the twin destroys the comparison the pair exists to enable. Static prose in a card the child chose to open is not a nudge. A banner, a toast, a highlight on the map, or anything appearing *because* the other was played, is.

- [ ] **Step 1: Write the failing test**

Append to `passion/apps/mvp-jul24/src/shelf/cards.data.test.ts`:

```ts
import { expect, test } from "vitest";
import { DECKS } from "./cards.data";

const cardFor = (topic: string, gadgetId: string) =>
  DECKS.find((d) => d.topic === topic)?.cards.find((c) => c.gadgetId === gadgetId);

// The twin pair is the same shell with only the content binding varied, and it is how "loves
// deduction" is told apart from "loves mathematics" by observation. A player could not tell.
test("each twin's card names the other", () => {
  const mirror = cardFor("logic-games", "mirror");
  const laser = cardFor("math", "fraction-laser");
  expect(mirror?.body.join(" ")).toMatch(/fraction laser/i);
  expect(laser?.body.join(" ")).toMatch(/mirror maze/i);
});

// Inert, not a nudge. Nothing may read as "you played X, so try Y" — a system-surfaced prompt is
// the prompted-vs-voluntary distinction the engine turns on, and priming the pair destroys the
// comparison it exists to enable.
test("neither cross-reference is phrased as a recommendation", () => {
  for (const card of [cardFor("logic-games", "mirror"), cardFor("math", "fraction-laser")]) {
    const text = card?.body.join(" ") ?? "";
    expect(text).not.toMatch(/you (should|might|liked|enjoyed)|try (it|this|that)|recommend|next up/i);
  }
});

// The type says two paragraphs and the prose has to live inside them.
test("both cards still have exactly two paragraphs", () => {
  expect(cardFor("logic-games", "mirror")?.body).toHaveLength(2);
  expect(cardFor("math", "fraction-laser")?.body).toHaveLength(2);
});
```

Check the real export name and the real card ids first — the `logic-games` mirror card is `id: "mirror-reflection"` with `gadgetId: "mirror"`, and the deck export may not be called `DECKS`. Match what `cards.data.ts` actually exports.

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/shelf/cards.data.test.ts
```

Expected: FAIL — neither card mentions the other.

- [ ] **Step 3: Extend the two cards' second paragraphs**

Add a sentence to the end of `mirror-reflection`'s second paragraph. It states a fact about the world, not a suggestion:

```
 The Fraction Laser in the Math cabin is this same maze with one thing changed: the beam's turns are governed by fractional quantities instead of by 45° mirrors, so the geometry you just used is the part that stays and the arithmetic is the part that arrives.
```

And to the `fraction-laser` card's second paragraph:

```
 The Mirror Maze in the Logic Games cabin is this same board with the fractions taken out: the beam still reflects, but nothing has to be divided, so what is left is the spatial reasoning on its own.
```

- [ ] **Step 4: Mention it in the two teach-ins**

In `teachin/rules.tsx`, find the `mirror` and `fraction-laser` rule entries and add one clause each in the same register — describing what the other activity *is*, never suggesting the child go there. Keep it to a single sentence; the teach-in dismisses on first interaction and is not a place for prose.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/shelf src/teachin
```

Expected: PASS, including the pre-existing deck-shape tests (3–6 cards, exactly one `invitation`).

- [ ] **Step 6: Commit**

```bash
git add passion/apps/mvp-jul24/src/shelf/cards.data.ts \
        passion/apps/mvp-jul24/src/shelf/cards.data.test.ts \
        passion/apps/mvp-jul24/src/teachin/rules.tsx
git commit -m "feat(mvp-jul24): each twin names the other, inertly

Mirror Maze and Fraction Laser are the same shell with only the content
binding varied — the in-product Zombie Division design (75.7 vs 10.28 min
free-choice play, r = .89) and the mechanism by which loving deduction is
told apart from loving mathematics by observation. A player had no way to
notice they are one shell.

Static prose in a card the child chose to open, phrased as a fact about
the other activity. Deliberately not \"you liked this, try that\": a
system-surfaced nudge is the prompted-vs-voluntary distinction the engine
turns on, and priming the pair would destroy the comparison it exists to
enable. A test pins the phrasing."
```

---

### Task 9: Improve the Function Machine prop

**Files:**
- Modify: `passion/apps/mvp-jul24/public/art/cabin-backdrop-math.png` (regenerate the one object)
- Modify: `passion/apps/mvp-jul24/src/cabin/backdrop/quads.data.ts` (the `function-machine` prop polygon in the `MATH` room)
- Test: `passion/apps/mvp-jul24/src/cabin/backdrop/quads.data.test.ts` (existing; must stay green)

**Interfaces:**
- Consumes: `BackdropProp` from `cabin/backdrop/types.ts`. Coordinates are literal art pixels in the plate's own `viewBox` — never percentages.
- Produces: nothing other tasks consume. Last task; nothing follows it.

`PROJECT.md` names this the weakest of the five math props — "closer to a curio cabinet than a machine" — and the first to improve if any is revisited. PRD §5.3 asks a prop for a **clear affordance**: the child must see "that is the function machine". Recognition is the whole job; a prop is not load-bearing for accuracy, and `PROJECT.md` records why the exactness path was built and rejected twice on appearance.

- [ ] **Step 1: Read the two constraints before touching the art**

Read `PROJECT.md`'s "The generated-still backdrop, and why props are inexact on purpose" and the prop-to-activity map. Two things bind: the plate is **one composed frame at dusk**, shared lighting and camera with `logic-games`, so a regenerated object must match colour temperature and grain or it reads as pasted in — the failure mode that killed both earlier exactness attempts. And `quads.data.test.ts` requires the `MATH` room to cover all five gadgets **exactly once** with **non-overlapping** polygons, so the new object must not grow into a neighbour's quad.

- [ ] **Step 2: Regenerate just that object**

Use `scripts/gen-art.mjs` / `scripts/gen-cabins.mjs` as they are already used for this plate — read them for the prompt and parameter conventions rather than inventing a call. Target a recognisable machine: a hopper or funnel in, a crank or gear housing, a chute or tray out, so the in→transform→out reading is visible at prop size. Keep it on the same surface the current curio cabinet occupies so the composition does not move.

Verify at prop scale, not full size: `scripts/art-inspect.mjs` exists for this. A prop that reads well at 100% and not at its on-wall size has not been improved.

- [ ] **Step 3: Re-trace the polygon**

Update the `function-machine` prop's polygon points in the `MATH` room in `quads.data.ts` to trace the new object's silhouette in the plate's own pixel coordinates. Follow the surrounding entries' style exactly — they carry comments recording what each vertex follows.

- [ ] **Step 4: Run the tests**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/cabin/backdrop
```

Expected: PASS, specifically the exactly-once coverage test and the non-overlap test. An overlap failure means the new object grew into a neighbour — shrink the polygon, do not relax the test.

- [ ] **Step 5: Screenshot the room and look at it**

```bash
cd passion/apps/mvp-jul24 && pnpm dev
```

In a second shell: `cd passion/apps/mvp-jul24 && pnpm shoot`. Open the `math` cabin output and check three things — the object reads as a machine at prop size; its focus trace follows the silhouette rather than a box; and the room still looks like one photograph rather than a collage. If the last one fails, the regeneration was the problem, not the polygon.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/mvp-jul24/public/art/cabin-backdrop-math.png \
        passion/apps/mvp-jul24/src/cabin/backdrop/quads.data.ts
git commit -m "feat(mvp-jul24): the function machine reads as a machine

PROJECT.md named this the weakest of the five math props — closer to a
curio cabinet than a machine — and first to improve if any was revisited.
PRD §5.3 asks a prop for a clear affordance, and recognition is the whole
job a prop is load-bearing for.

Regenerated on the same surface so the composition does not move, with
in-transform-out visible at prop size, and the polygon re-traced in the
plate's own pixel coordinates. Non-overlap and exactly-once coverage
still enforced by quads.data.test.ts."
```

---

## Final gate, before opening any PR

Run from the repo root, not the app directory:

```bash
pnpm typecheck && pnpm test && pnpm lint
```

All three must pass. `pnpm typecheck` is `tsc -b` across the workspace and is what catches a parked component that stopped compiling. Then rebase on `origin/main` and keep each task's commit as its own PR, per AGENTS.md.

## Ordering

Task 1 is independent — do it first regardless, it is a live PRD §11 violation. **Task 2 must land before tasks 6 and 7**, since parking two backends removes the three-coordinate-system placement tax. Tasks 3, 4, 5, 8 and 9 may go in any order, except that task 4's verification step greps for stale `?cabin=` claims and so reads better after task 2.
