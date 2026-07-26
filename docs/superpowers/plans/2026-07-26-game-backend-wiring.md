# 🧪 EXPERIMENTAL — Game → discovery chain: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **EXPERIMENTAL — awaiting teammate review before execution.** Do not start implementing this
> until the design's §9 open questions have been answered. Question 1 in particular (is
> `investigate` the right work-mode?) sets the key every cell in the demo is derived on, and
> answering it differently changes Task 2's data.

**Goal:** A child plays the game, and an operator sees an interest read that was genuinely derived by the real discovery engines rather than hand-built.

**Architecture:** The whole discovery chain runs **in the browser, inside the game**. Every engine package is pure and imports no Node builtins, so the game imports them and calls `runCycle` directly — no server, no HTTP, no database, no `guide-console` change, and no modification to any engine package. A new `src/backend/` directory holds the game's two missing inputs (a tagged artifact catalog and a backdated seed log) plus the call and an operator-facing read panel.

**Tech Stack:** React 18 + TypeScript, Vite, Zustand, Vitest + jsdom + `@testing-library/react`, and five workspace packages consumed as raw TypeScript sources: `@gt100k/signal-pipeline`, `@gt100k/interest-inference`, `@gt100k/hypothesis-store`, `@gt100k/student-profile`, `@gt100k/two-axis-tagging`.

**Design doc:** [`../specs/2026-07-26-game-backend-wiring-design.md`](../specs/2026-07-26-game-backend-wiring-design.md). Read it first — it carries the *why*, the two verified reasons nothing works today, and the honest limits in §7.

## Global Constraints

- **App directory for all commands:** `passion/apps/mvp-jul24`. Tests: `pnpm vitest run <path>`. Repo-root gate: `pnpm typecheck` + `pnpm test` + `pnpm lint`.
- **pnpm only** — never npm or yarn (AGENTS.md).
- **Conventional Commits**, one per task. PRs under ~400 lines.
- **No engine package is modified.** If a task seems to need a change under `passion/packages/`, stop and report it — that is a design defect, not an implementation detail.
- **The read is operator-facing and QA-gated. No child-reachable path may render it.** A prior branch removed a child-facing time-on-task readout as a live PRD §11 violation; re-adding a child-facing read here would undo that.
- **No scalar score, no ranking, no fixed label, and no duration anywhere a child can reach.** `dwellBucket` may appear as an operator diagnostic; it may never be scored.
- **Nothing gated.** No locks, prerequisites, or completion-contingent reveal anywhere.
- **Emission order is fixed:** wire the silent surfaces (Task 4) **before** flipping `EMISSION_ENABLED` (Task 5). `signals/session.ts` states why: flipping first reinstates a silent under-count.
- **Gadget ids are the artifact ids.** `nonogram`, `mirror`, `chess`, `pipes` (`logic-games`); `balance-scale`, `gear-train`, `fraction-laser`, `function-machine`, `ratio-mixing` (`math`). No translation at the emission boundary.

---

### Task 1: Prove Vite can consume the engine packages at runtime

**Do this first and alone.** Everything else rests on it. The packages export **raw TypeScript** (`"main": "./src/index.ts"`), and the game currently imports `@gt100k/signal-pipeline` as a **type-only devDependency** that is erased at build. Nothing in this app has ever transpiled a workspace package's TS source.

**Files:**
- Modify: `passion/apps/mvp-jul24/package.json` (move `@gt100k/signal-pipeline` to `dependencies`; add the other four)
- Create: `passion/apps/mvp-jul24/src/backend/smoke.test.ts`

**Interfaces:**
- Produces: nothing importable. This task's deliverable is the *proof* that later tasks can import these packages, plus the dependency entries they need.

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/backend/smoke.test.ts`:

```ts
import { expect, test } from "vitest";
import { ACTION_MODE_RULES, createTaxonomy, makeArtifact } from "@gt100k/two-axis-tagging";
import { deriveSignals } from "@gt100k/signal-pipeline";
import { runCycle, emptyProfile } from "@gt100k/student-profile";

// These are RUNTIME imports, not type-only. The packages export raw .ts, and this app has never
// transpiled a workspace package's source before — so this test exists to prove the toolchain
// works before anything is built on top of it.
test("the engine packages are importable at runtime from this app", () => {
  expect(typeof deriveSignals).toBe("function");
  expect(typeof runCycle).toBe("function");
  expect(typeof emptyProfile).toBe("function");
  expect(typeof makeArtifact).toBe("function");
  expect(typeof createTaxonomy).toBe("function");
  // The closed verb vocabulary the emitter has to satisfy. `open` is deliberately NOT in it.
  expect(Object.keys(ACTION_MODE_RULES)).toContain("inspect");
  expect(Object.keys(ACTION_MODE_RULES)).not.toContain("open");
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/smoke.test.ts
```

Expected: FAIL — the four packages other than `signal-pipeline` are not dependencies, so resolution fails.

- [ ] **Step 3: Add the dependencies**

In `passion/apps/mvp-jul24/package.json`, **move** `"@gt100k/signal-pipeline": "workspace:*"` out of `devDependencies` into `dependencies`, and add alongside it:

```json
    "@gt100k/hypothesis-store": "workspace:*",
    "@gt100k/interest-inference": "workspace:*",
    "@gt100k/student-profile": "workspace:*",
    "@gt100k/two-axis-tagging": "workspace:*",
```

Then from the repo root: `pnpm install`.

- [ ] **Step 4: Run the test, then prove the *browser* build works too**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/smoke.test.ts && pnpm build
```

Expected: test PASSES and `pnpm build` exits 0. **Both are required.** Vitest and Vite resolve differently — a passing test with a failing build means the demo cannot ship, and the failure would otherwise surface in Task 8.

If `pnpm build` fails on the raw-TS imports, apply the fallbacks in this order and record which you used and why in your report:
1. add `resolve.alias` entries in `vite.config.ts` pointing each package name at its `src/index.ts`;
2. add the five package names to `optimizeDeps.include`;
3. only if both fail, add a build step for the packages — and stop and report before doing this, because it changes the repo's build topology and is beyond this task.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/package.json passion/apps/mvp-jul24/src/backend/smoke.test.ts pnpm-lock.yaml
git commit -m "chore(mvp-jul24): consume the discovery engines at runtime, not type-only

The five engine packages are pure (no Node builtins) and export raw
TypeScript. This app imported signal-pipeline type-only, erased at build,
so nothing here had ever transpiled a workspace package's source. Proven
by a runtime smoke test AND a real vite build before anything is built on
top of it."
```

---

### Task 2: The artifact catalog and the taxonomy crosswalk

Without this, `deriveSignals` drops every record as `unknown-artifact`. This is the single most load-bearing task.

**Files:**
- Create: `passion/apps/mvp-jul24/src/backend/catalog.ts`
- Create: `passion/apps/mvp-jul24/src/backend/catalog.test.ts`

**Interfaces:**
- Consumes: `createTaxonomy()`, `makeArtifact(tax, input)` and the `Artifact` type from `@gt100k/two-axis-tagging`; `GADGETS` from `../gadgets/registry`.
- Produces: `GAME_CATALOG: ReadonlyMap<string, Artifact>` and `DOMAIN_FOR_TOPIC: Record<string, DomainPath>`, both from `backend/catalog.ts`. Tasks 6, 7 and 8 consume `GAME_CATALOG`.

The crosswalk, which the design settles: the taxonomy already models this app's room split as two subtopics of one cabin, and both are in `SEED_SUBTOPICS` for `math-puzzles`, so they validate without minting.

| Game topic | `domainPath` |
|---|---|
| `logic-games` | `["math-puzzles", "logic-puzzles"]` |
| `math` | `["math-puzzles", "competition-math"]` |

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/backend/catalog.test.ts`:

```ts
import { expect, test } from "vitest";
import { resolveEngagedModes } from "@gt100k/two-axis-tagging";
import { GADGETS } from "../gadgets/registry";
import { GAME_CATALOG } from "./catalog";

// Every gadget a player can reach must be tagged, or its records vanish as `unknown-artifact`.
// Same exactly-once discipline as quads.data.test.ts, and for the same reason: a gadget that is
// half-wired fails the build instead of silently producing no evidence.
test("every registry gadget has exactly one catalog entry", () => {
  const ids = GADGETS.map((g) => g.id).sort();
  expect([...GAME_CATALOG.keys()].sort()).toEqual(ids);
});

test("no catalog entry exists for a gadget that is not in the registry", () => {
  for (const id of GAME_CATALOG.keys()) {
    expect(GADGETS.some((g) => g.id === id)).toBe(true);
  }
});

test("logic-games maps to logic-puzzles and math to competition-math", () => {
  expect(GAME_CATALOG.get("nonogram")?.domainPath).toEqual(["math-puzzles", "logic-puzzles"]);
  expect(GAME_CATALOG.get("gear-train")?.domainPath).toEqual([
    "math-puzzles",
    "competition-math",
  ]);
});

// The catalog is only useful if the emitter's verb actually resolves against it. This is the
// pairing that was broken in both directions before this plan.
test("every artifact affords a mode that `inspect` resolves to", () => {
  for (const [id, artifact] of GAME_CATALOG) {
    const r = resolveEngagedModes(artifact, { artifactId: id, actionType: "inspect" });
    expect(r.ok, `${id} does not resolve for inspect`).toBe(true);
  }
});

test("every artifact affords at least one mode and is gold-tagged", () => {
  for (const [, a] of GAME_CATALOG) {
    expect(a.affordedModes.length).toBeGreaterThan(0);
    expect(a.source).toBe("gold");
  }
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/catalog.test.ts
```

Expected: FAIL on `Cannot find module './catalog'`.

- [ ] **Step 3: Write the catalog**

Create `passion/apps/mvp-jul24/src/backend/catalog.ts`:

```ts
import {
  type Artifact,
  type DomainPath,
  createTaxonomy,
  makeArtifact,
} from "@gt100k/two-axis-tagging";
import type { TopicId } from "../game/types";

/**
 * The game's nine activities, tagged for the discovery engines.
 *
 * WHY THIS FILE IS THE DIFFERENCE BETWEEN A READ AND NOTHING. `deriveSignals` looks every
 * interaction's `artifactId` up in a catalog, and drops it as `unknown-artifact` if it misses.
 * Before this file existed the game emitted well-formed records that were discarded 100% of the
 * time — `tsc` was happy because the emitter is typed against the real contract, and the data
 * still went nowhere.
 *
 * THE CROSSWALK IS A RECOGNITION, NOT A COMPROMISE. The app split `logic-games` from `math`
 * because the deduction puzzles survive the swap test and the maths ones do not, so the two rooms
 * measure different constructs. The taxonomy had already drawn the same line, as two subtopics of
 * one cabin. Both paths are in `SEED_SUBTOPICS` for `math-puzzles`, so `makeArtifact` validates
 * them without minting anything.
 *
 * `music` / `code` / `art` get NO entries. They have no activities, so a record naming one is a
 * bug, and `unknown-artifact` is the right answer to a bug.
 */
export const DOMAIN_FOR_TOPIC: Readonly<Partial<Record<TopicId, DomainPath>>> = {
  "logic-games": ["math-puzzles", "logic-puzzles"],
  math: ["math-puzzles", "competition-math"],
};

/**
 * Every activity affords `investigate` and only `investigate`.
 *
 * This is honest rather than lazy: all nine are solve-a-puzzle, they produce understanding rather
 * than an artifact, a performance or a repair, and `investigate` is the work-mode for that. The
 * consequence is recorded in the design's §7.1 and must not be papered over — the mode axis is
 * DEGENERATE, so this catalog yields roughly a 2x1 matrix with no mode marginals and no
 * topic-vs-style attribution. Closing that needs activities that afford `build`, `compose` or
 * `explain`; no tagging choice here can substitute for content that does not exist.
 *
 * Do not be tempted to over-declare modes to make the matrix look richer. An artifact that claims
 * to afford `build` when nothing about it is building produces cells the child never actually
 * entered, which is worse than a narrow read.
 */
const AFFORDED = ["investigate"] as const;

const tax = createTaxonomy();

function gameArtifact(id: string, topic: TopicId): Artifact {
  const domainPath = DOMAIN_FOR_TOPIC[topic];
  if (!domainPath) throw new Error(`no domain crosswalk for topic: ${topic}`);
  return makeArtifact(tax, {
    id,
    domainPath,
    affordedModes: [...AFFORDED],
    kind: "gadget",
    // `gold` because a human wrote this mapping by hand against the taxonomy, which is exactly
    // what `gold` means (=> tagConfidence 1). It is not a model's guess.
    source: "gold",
  });
}

const ENTRIES: readonly Artifact[] = [
  gameArtifact("nonogram", "logic-games"),
  gameArtifact("mirror", "logic-games"),
  gameArtifact("chess", "logic-games"),
  gameArtifact("pipes", "logic-games"),
  gameArtifact("balance-scale", "math"),
  gameArtifact("gear-train", "math"),
  gameArtifact("fraction-laser", "math"),
  gameArtifact("function-machine", "math"),
  gameArtifact("ratio-mixing", "math"),
];

export const GAME_CATALOG: ReadonlyMap<string, Artifact> = new Map(
  ENTRIES.map((a) => [a.id, a]),
);
```

- [ ] **Step 4: Run the test**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/catalog.test.ts
```

Expected: PASS. If the exactly-once test fails, the registry and this list have drifted — fix the list, never the test.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/backend/catalog.ts passion/apps/mvp-jul24/src/backend/catalog.test.ts
git commit -m "feat(mvp-jul24): tag the nine activities for the discovery engines

deriveSignals drops any interaction whose artifactId is not in a catalog,
so before this the game's records were discarded 100% of the time while
looking well-formed. The crosswalk is a recognition rather than a
compromise: the taxonomy already models this app's logic-vs-maths room
split as math-puzzles/{logic-puzzles, competition-math}, both seeded.

Every activity affords investigate and only investigate, which leaves the
mode axis deliberately degenerate — see the design's §7.1. Over-declaring
modes to enrich the matrix would invent cells no child entered."
```

---

### Task 3: Make the emitted `actionType` resolvable

The second of the two independent reasons every record is dropped. `"open"` is not one of `ACTION_MODE_RULES`'s ten verbs, so it resolves to nothing.

**Files:**
- Modify: `passion/apps/mvp-jul24/src/signals/log.ts` (`recordOpen`, `recordDepth`)
- Modify: `passion/apps/mvp-jul24/src/signals/log.test.ts`

**Interfaces:**
- Consumes: `ACTION_MODE_RULES` from `@gt100k/two-axis-tagging` (in the test only).
- Produces: `createSignalLog(...)`'s emitted records now carry `actionType: "inspect"`, and depth occurrences carry `depthSignals: [{ kind, value: 1 }]` with `actionType: "inspect"` rather than the kind. Tasks 5 and 7 depend on this.

- [ ] **Step 1: Write the failing test**

Append to `passion/apps/mvp-jul24/src/signals/log.test.ts`:

```ts
import { ACTION_MODE_RULES } from "@gt100k/two-axis-tagging";

// THE TEST WHOSE ABSENCE LET A 100% DROP RATE SHIP LOOKING CORRECT.
// `actionType` is a closed vocabulary of ten verbs owned by 009. An emitter that invents one is
// typed correctly and discarded silently, which is the worst combination available.
test("every emitted actionType is a verb the resolver knows", () => {
  const c = { now: () => Date.parse("2026-07-26T10:00:00.000Z") };
  const log = createSignalLog({ sessionId: "s1", now: c.now });
  log.recordOpen("nonogram", FLOOR_MS);
  log.recordDepth("nonogram", "unrequired_revision");

  const verbs = [...new Set(log.interactions().map((i) => i.actionType))];
  expect(verbs.length).toBeGreaterThan(0);
  for (const v of verbs) {
    expect(Object.keys(ACTION_MODE_RULES), `unknown verb: ${v}`).toContain(v);
  }
});

test("a depth occurrence carries its kind in depthSignals, not in actionType", () => {
  const c = { now: () => Date.parse("2026-07-26T10:00:00.000Z") };
  const log = createSignalLog({ sessionId: "s1", now: c.now });
  log.recordDepth("nonogram", "unrequired_revision");

  const i = log.interactions().at(-1)!;
  expect(i.actionType).toBe("inspect");
  expect(i.depthSignals).toEqual([{ kind: "unrequired_revision", value: 1 }]);
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/signals/log.test.ts
```

Expected: FAIL — the emitted verbs are `open` and `unrequired_revision`, neither in `ACTION_MODE_RULES`.

- [ ] **Step 3: Fix the emitter**

In `src/signals/log.ts`, introduce the verb as a named constant and use it in both methods:

```ts
/**
 * The one work-mode-bearing verb this app emits. `ACTION_MODE_RULES` (009) is a CLOSED vocabulary
 * of ten verbs and `inspect` is the one that resolves to `investigate` — which is what these
 * activities afford (see backend/catalog.ts).
 *
 * This used to be the string "open". That is not in the vocabulary, so every record the app
 * emitted resolved to nothing and was dropped `unresolved-action`. Do not invent a verb here: if a
 * new activity needs a mode this cannot express, the vocabulary is 009's to extend, not this
 * file's to work around.
 */
const ACTION_INSPECT = "inspect";
```

`recordOpen` sets `actionType: ACTION_INSPECT` in place of `"open"`.

`recordDepth` sets `actionType: ACTION_INSPECT` in place of `kind`, and keeps `depthSignals: [{ kind, value: 1 }]` exactly as it is — the kind belongs there and `buildActionEvents` reads it from there.

Update `recordDepth`'s doc comment to say the kind travels in `depthSignals` and why the verb is not the kind.

- [ ] **Step 4: Run the tests**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/signals
```

Expected: PASS. Pre-existing assertions in `log.test.ts` that pinned `actionType: "open"` need updating to `"inspect"` — that is the behaviour change, not a broken test.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/signals/log.ts passion/apps/mvp-jul24/src/signals/log.test.ts
git commit -m "fix(mvp-jul24): emit a verb the resolver actually knows

actionType is a closed ten-verb vocabulary owned by 009. The emitter sent
\"open\", which resolves to nothing, so every record was dropped
unresolved-action even once a catalog existed. Depth was also emitted AS
an actionType; the kind belongs in depthSignals, which is where
buildActionEvents reads it.

The new test asserts every emitted verb is in ACTION_MODE_RULES. Its
absence is what let a 100% drop rate ship looking correct."
```

---

### Task 4: Wire the two surfaces that emit nothing

**Files:**
- Modify: `passion/apps/mvp-jul24/src/cabin/backdrop/CabinBackdrop.tsx` (`PropHotspot`'s `activate`)
- Modify: `passion/apps/mvp-jul24/src/shelf/ShelfPanel.tsx` (or `CabinShelf.tsx` — read both and put it where the open actually happens)
- Test: `passion/apps/mvp-jul24/src/signals/wiring.test.tsx`

**Interfaces:**
- Consumes: `sessionLog` from `../signals/session` (already imported by `CabinView`), and `createSignalLog` in the test.
- Produces: no new exports. Task 5 depends on these surfaces emitting.

`backdrop` is now the only backend, so these are the *only* interaction surfaces a player has. `PropHotspot`'s `activate()` currently calls `focusGadget` and nothing else. `signals/session.ts` records that this is why emission is off, and that wiring must come first.

Note the existing seam: `GadgetOverlay`'s effect already calls `sessionLog.recordOpen(id, activeMs)` on cleanup, so a prop click *does* eventually produce an open record via the overlay. **Read that effect before changing anything** and determine whether `PropHotspot` needs its own emission at all, or whether the real gap is only the shelf. Report what you find. If the overlay already covers prop opens, do not double-count — emitting twice for one open is worse than the current silence.

The shelf is definitely uncovered: opening it and opening a card produce no record of any kind.

- [ ] **Step 1: Write the failing test**

Append to `passion/apps/mvp-jul24/src/signals/wiring.test.tsx`, following the file's existing `vi.mock("./session", ...)` pattern that substitutes a live `createSignalLog` (emission is globally off, so a real log has to be injected to observe wiring at all):

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import CabinBackdrop from "../cabin/backdrop/CabinBackdrop";
import { backdropRoomFor } from "../cabin/backdrop/quads.data";

/**
 * The shelf is a real interaction surface and emitted nothing. It is the cabin's standing
 * maintenance path (PROJECT.md's D5 mitigation), so a child who opens it and reads a card has
 * done something, and a log that omits it reports that engagement as absence of engagement.
 *
 * The shelf's control is a `role="button"` polygon whose accessible name is `shelf.label` — the
 * same idiom `shelf/CabinShelf.test.tsx` already uses.
 */
test("opening the shelf emits a record", () => {
  render(<CabinBackdrop topic="logic-games" />);
  const shelf = backdropRoomFor("logic-games")!.shelf!;

  expect(injectedLog.interactions()).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: shelf.label }));

  expect(injectedLog.interactions().length).toBeGreaterThan(0);
});

test("opening a card in the shelf emits a record", () => {
  render(<CabinBackdrop topic="logic-games" />);
  const shelf = backdropRoomFor("logic-games")!.shelf!;
  fireEvent.click(screen.getByRole("button", { name: shelf.label }));

  const before = injectedLog.interactions().length;
  // The panel is a `role="dialog"`; each card is a button named by its title.
  const card = screen.getAllByRole("button").find((b) => b.textContent && b !== document.body);
  expect(card).toBeDefined();
  fireEvent.click(card!);

  expect(injectedLog.interactions().length).toBeGreaterThan(before);
});
```

`injectedLog` is the live `createSignalLog` this file's existing `vi.mock("./session", ...)` factory substitutes — reuse that same mock rather than adding a second one, and reset it between tests so the `toHaveLength(0)` precondition holds. If the mock currently exposes the log under a different name, use the real one.

**Decide and record the shelf's artifact identity.** The shelf is not a gadget and has no catalog entry, so a bare `recordOpen("shelf")` would be dropped `unknown-artifact`. Two defensible options — pick one, implement it, and say why in your report:
- **(a) Do not emit interactions for the shelf at all**, only note it in a non-pipeline diagnostic. Honest, zero risk, and the shelf genuinely is not an activity whose domain we are inferring.
- **(b) Give the shelf a catalog entry per room** (`kind: "resource"`, same `domainPath` as the room) so opening it is real evidence of engagement with that domain.

**(b) is the better demo and the better product**, because the shelf is the domain-invitation surface and a child who reads about a field is engaging with it. But it adds two catalog entries and Task 2's exactly-once test asserts the catalog matches `GADGETS` exactly — so **(b) requires amending that test** to allow non-gadget resource entries. If you choose (b), amend the test deliberately and explain it; do not weaken it into vagueness.

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/signals/wiring.test.tsx
```

Expected: FAIL — the shelf emits nothing.

- [ ] **Step 3: Wire the surfaces**

Add the emission at the shelf's open handler, and at `PropHotspot`'s `activate()` **only if** step 1's investigation showed the overlay does not already cover prop opens.

- [ ] **Step 4: Run the tests**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/signals src/shelf src/cabin
```

Expected: PASS, with no double-counted opens.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/shelf passion/apps/mvp-jul24/src/cabin/backdrop/CabinBackdrop.tsx passion/apps/mvp-jul24/src/signals/wiring.test.tsx
git commit -m "feat(mvp-jul24): the shelf and the backdrop props emit signal records

backdrop is the only backend now, so these are the only interaction
surfaces a player has, and the shelf emitted nothing at all. PROJECT.md
calls the shelf the room's standing maintenance path, so a child reading a
card has engaged with the domain and a log that omits it reports that
engagement as absence."
```

---

### Task 5: Flip `EMISSION_ENABLED`, and prove nothing is dropped

**Files:**
- Modify: `passion/apps/mvp-jul24/src/signals/session.ts`
- Modify: `passion/apps/mvp-jul24/src/signals/session.test.ts`
- Create: `passion/apps/mvp-jul24/src/backend/pipeline.test.ts`

**Interfaces:**
- Consumes: `GAME_CATALOG` from `./catalog` (Task 2); `deriveSignals` from `@gt100k/signal-pipeline`.
- Produces: `EMISSION_ENABLED === true`. Tasks 7 and 8 depend on records actually accumulating.

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/backend/pipeline.test.ts`:

```ts
import { expect, test } from "vitest";
import { deriveSignals } from "@gt100k/signal-pipeline";
import { createSignalLog, FLOOR_MS } from "../signals/log";
import { GAME_CATALOG } from "./catalog";

/**
 * The end-to-end guard for the wiring this whole plan exists to fix. A read derived from an empty
 * CellEvent stream is indistinguishable from a read of a child who did nothing, so `dropped` being
 * empty is the single most important assertion in this app.
 */
test("a scripted session produces cell events and drops nothing", () => {
  let t = Date.parse("2026-07-26T10:00:00.000Z");
  const log = createSignalLog({ sessionId: "s1", now: () => (t += 60_000) });

  log.recordSurfaced("nonogram");
  log.recordSurfaced("gear-train");
  log.recordOpen("nonogram", FLOOR_MS);
  log.recordOpen("gear-train", 3 * 60_000);
  log.recordDepth("nonogram", "unrequired_revision");

  const { cellEvents, dropped } = deriveSignals({
    interactions: log.interactions(),
    surfaced: log.surfaced(),
    catalog: GAME_CATALOG,
  });

  expect(dropped).toEqual([]);
  expect(cellEvents.length).toBeGreaterThan(0);
});

test("emission is on, now that the surfaces are wired", async () => {
  const { EMISSION_ENABLED } = await import("../signals/session");
  expect(EMISSION_ENABLED).toBe(true);
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/pipeline.test.ts
```

Expected: the second test FAILS (`EMISSION_ENABLED` is `false`). The first should already PASS after Tasks 2 and 3 — **if it fails, stop.** A non-empty `dropped` means the catalog or the verb is still wrong, and flipping the flag would ship a silent under-count, which is exactly what the flag exists to prevent.

- [ ] **Step 3: Flip the flag and rewrite its comment**

In `src/signals/session.ts` set `EMISSION_ENABLED = true`, and replace the comment explaining why it is off with one stating what is now covered: the backdrop props and the shelf emit, the catalog covers every gadget, and `backend/pipeline.test.ts` asserts `dropped` is empty. Keep the historical note about *why* it was off — a future reader needs to know the failure mode it was guarding against.

- [ ] **Step 4: Run the tests**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run
```

Expected: whole suite green. `session.test.ts`'s assertions that the log records nothing must be **inverted**, not deleted — they were correct when emission was off and are now wrong.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/signals/session.ts passion/apps/mvp-jul24/src/signals/session.test.ts passion/apps/mvp-jul24/src/backend/pipeline.test.ts
git commit -m "feat(mvp-jul24): turn signal emission on, with a dropped-is-empty guard

Emission was off because the only backend's surfaces emitted nothing, so
a live log would have under-counted every open while looking well-formed.
The surfaces are wired and the catalog covers every gadget, so the
condition session.ts set for flipping this is met.

The guard that matters is dropped === []: a read derived from an empty
CellEvent stream is indistinguishable from a read of a child who did
nothing."
```

---

### Task 6: The backdated demo seed

**Files:**
- Create: `passion/apps/mvp-jul24/src/backend/demo-kid.ts`
- Create: `passion/apps/mvp-jul24/src/backend/demo-kid.test.ts`

**Interfaces:**
- Consumes: `GAME_CATALOG` (Task 2); `Interaction` / `SurfacedRecord` types from `@gt100k/signal-pipeline`.
- Produces: `DEMO_KID_ID: string`, `DEMO_KID_NAME: string`, `DEMO_NOW: string`, `SEED_LOG: readonly Interaction[]`, `SEED_SURFACED: readonly SurfacedRecord[]`, and `SEED_TARGET_CELL: string` (the cell the live session is meant to tip). Tasks 7 and 8 consume all six.

The engine will not call an interest confident from one sitting — E6 requires distinct days and there is a 3-day novelty window — so a live session alone correctly returns "not sure yet". This seed makes the mechanism visible. **It is the synthetic part of the demo and its own file so that it is impossible to mistake for real data.**

Mirror `ARI_LOG`'s shape in `passion/packages/student-profile/src/__fixtures__/pilot.ts`: a novel first exposure at −97d (outside the novelty window, so later visits count as returns), voluntary returns at −90 / −70 / −30, then a recent cluster every other day from −19 to −1. **Read that fixture first** — it encodes gate-spread timing that took work to get right, and copying its shape is cheaper and more correct than re-deriving it.

Aim the seed at `logic-games`' cell and leave it **one qualifying event short of EMERGING**, so the live session is what tips it.

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/backend/demo-kid.test.ts`:

```ts
import { expect, test } from "vitest";
import { deriveSignals } from "@gt100k/signal-pipeline";
import { GAME_CATALOG } from "./catalog";
import { DEMO_NOW, SEED_LOG, SEED_SURFACED } from "./demo-kid";

test("the seed log drops nothing against the real catalog", () => {
  const { dropped } = deriveSignals({
    interactions: SEED_LOG,
    surfaced: SEED_SURFACED,
    catalog: GAME_CATALOG,
  });
  expect(dropped).toEqual([]);
});

// Distinct days are what E6's confidence gate counts. A seed clustered into one day would look
// substantial and gate exactly like a single sitting.
test("the seed spans many distinct days, all before DEMO_NOW", () => {
  const days = new Set(SEED_LOG.map((i) => i.timestamp.slice(0, 10)));
  expect(days.size).toBeGreaterThanOrEqual(8);
  for (const i of SEED_LOG) {
    expect(Date.parse(i.timestamp)).toBeLessThan(Date.parse(DEMO_NOW));
  }
});

test("every seed interaction is voluntary — the demo must not rest on prompted returns", () => {
  for (const i of SEED_LOG) expect(i.prompted).toBe(false);
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/demo-kid.test.ts
```

Expected: FAIL on `Cannot find module './demo-kid'`.

- [ ] **Step 3: Write the seed**

Create `passion/apps/mvp-jul24/src/backend/demo-kid.ts`. Build timestamps as offsets from a fixed `DEMO_NOW` constant (never `Date.now()` — the seed must be deterministic or the golden test in Task 7 flakes). Carry a header comment stating plainly:

- this data is **synthetic** and exists so the demo can show a mechanism that genuinely needs multi-day evidence;
- what is real when the demo runs (the pipeline, the inference, the lifecycle, the gate arithmetic, and the live session's own records) and what is fabricated (the history that lets the arithmetic reach a conclusion);
- that the demo script must say so out loud.

- [ ] **Step 4: Run the test**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/demo-kid.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/backend/demo-kid.ts passion/apps/mvp-jul24/src/backend/demo-kid.test.ts
git commit -m "feat(mvp-jul24): a backdated seed log for the demo child

E6 requires distinct days and there is a 3-day novelty window, so one
sitting correctly yields \"not sure yet\". This seed gives the mechanism
something to work on: novel exposure at -97d, voluntary returns at
-90/-70/-30, a recent cluster from -19 to -1, left one qualifying event
short of EMERGING so the live session is what tips it.

Its own file, and a header that says so, because this is the synthetic
part of the demo and must be impossible to mistake for real data."
```

---

### Task 7: `derive.ts` — the call, and the golden transition

**Files:**
- Create: `passion/apps/mvp-jul24/src/backend/derive.ts`
- Create: `passion/apps/mvp-jul24/src/backend/derive.test.ts`

**Interfaces:**
- Consumes: `runCycle`, `emptyProfile` from `@gt100k/student-profile`; `deriveSignals` from `@gt100k/signal-pipeline`; `GAME_CATALOG` (Task 2); `DEMO_KID_ID`, `DEMO_KID_NAME`, `DEMO_NOW`, `SEED_LOG`, `SEED_SURFACED`, `SEED_TARGET_CELL` (Task 6).
- Produces: `deriveRead(sessionInteractions, sessionSurfaced, now): DerivedRead` where
  `DerivedRead = { profile: StudentProfile; droppedCount: number }`. Task 8 consumes both fields.

`runCycle` discards `dropped` (it destructures only `cellEvents`), so surfacing the drop count means calling `deriveSignals` once more purely as a diagnostic. Both calls are pure, so this is cheap and cannot disagree with itself.

**This unit holds no logic of its own.** If it grows a branch, that branch belongs in an engine.

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/backend/derive.test.ts`:

```ts
import { expect, test } from "vitest";
import { createSignalLog, FLOOR_MS } from "../signals/log";
import { DEMO_NOW, SEED_TARGET_CELL } from "./demo-kid";
import { deriveRead } from "./derive";

function sessionOn(day: string) {
  let t = Date.parse(`${day}T10:00:00.000Z`);
  const log = createSignalLog({ sessionId: "live", now: () => (t += 60_000) });
  log.recordSurfaced("nonogram");
  log.recordOpen("nonogram", 3 * 60_000);
  log.recordDepth("nonogram", "unrequired_revision");
  return log;
}

const stateOf = (r: ReturnType<typeof deriveRead>, cellKey: string) =>
  r.profile.store.byId[`${r.profile.kidId}::${cellKey}`]?.state;

test("the seed alone does not reach EMERGING on the target cell", () => {
  const r = deriveRead([], [], DEMO_NOW);
  expect(r.droppedCount).toBe(0);
  expect(stateOf(r, SEED_TARGET_CELL)).not.toBe("EMERGING");
});

// The half that proves the LIVE session is what tipped it. Without this, the demo could be a
// hardcoded seed with a decorative play session bolted on.
test("seed plus a live session tips the target cell to EMERGING", () => {
  const log = sessionOn(DEMO_NOW.slice(0, 10));
  const r = deriveRead(log.interactions(), log.surfaced(), DEMO_NOW);
  expect(r.droppedCount).toBe(0);
  expect(stateOf(r, SEED_TARGET_CELL)).toBe("EMERGING");
});

test("deriving twice from the same input gives the same result", () => {
  const a = deriveRead([], [], DEMO_NOW);
  const b = deriveRead([], [], DEMO_NOW);
  expect(a.profile.store).toEqual(b.profile.store);
});
```

- [ ] **Step 2: Run it and watch it fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/derive.test.ts
```

Expected: FAIL on `Cannot find module './derive'`.

- [ ] **Step 3: Write `derive.ts`**

```ts
import { deriveSignals } from "@gt100k/signal-pipeline";
import type { Interaction, SurfacedRecord } from "@gt100k/signal-pipeline";
import { emptyProfile, runCycle, type StudentProfile } from "@gt100k/student-profile";
import { GAME_CATALOG } from "./catalog";
import { DEMO_KID_ID, DEMO_KID_NAME, SEED_LOG, SEED_SURFACED } from "./demo-kid";

export interface DerivedRead {
  readonly profile: StudentProfile;
  /** Interactions the firewall refused to resolve. MUST be 0; anything else means broken wiring. */
  readonly droppedCount: number;
}

/**
 * Run the real discovery chain over the demo child's seed plus this session's records.
 *
 * NO LOGIC LIVES HERE, deliberately. `runCycle` is pure and re-derives the whole log every call, so
 * there is no incremental state to keep consistent and no cache to invalidate. If this function
 * ever grows a branch, that branch belongs in an engine package instead.
 *
 * `droppedCount` needs its own `deriveSignals` call because `runCycle` destructures only
 * `cellEvents` and discards `dropped`. Both calls are pure over the same input, so they cannot
 * disagree.
 */
export function deriveRead(
  sessionInteractions: readonly Interaction[],
  sessionSurfaced: readonly SurfacedRecord[],
  now: string,
): DerivedRead {
  const interactions = [...SEED_LOG, ...sessionInteractions];
  const surfaced = [...SEED_SURFACED, ...sessionSurfaced];
  const ctx = { catalog: GAME_CATALOG, surfaced };

  const { dropped } = deriveSignals({ interactions, surfaced, catalog: GAME_CATALOG });
  const profile = runCycle(
    emptyProfile(DEMO_KID_ID, DEMO_KID_NAME, [], {}),
    interactions,
    ctx,
    now,
  );

  return { profile, droppedCount: dropped.length };
}
```

- [ ] **Step 4: Run the test**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/derive.test.ts
```

Expected: PASS. If the EMERGING assertion fails, tune **the seed in Task 6's file**, not the assertion — the test states the demo's requirement and the seed is the adjustable part. If it cannot be tuned to tip, report that: it means the gate needs more evidence than one session can add, which is a design problem worth surfacing rather than forcing.

- [ ] **Step 5: Commit**

```bash
git add passion/apps/mvp-jul24/src/backend/derive.ts passion/apps/mvp-jul24/src/backend/derive.test.ts
git commit -m "feat(mvp-jul24): derive a real interest read from seed plus live play

runCycle over the demo child's backdated seed and this session's records:
012 -> 011 -> 013, the real chain, no hand-built read anywhere. The golden
test asserts both halves — the seed alone does NOT reach EMERGING and the
live session tips it — because only the second half proves the play
session is doing the work.

droppedCount comes from a separate deriveSignals call since runCycle
discards dropped. Both are pure over the same input."
```

---

### Task 8: The operator read panel

**Files:**
- Create: `passion/apps/mvp-jul24/src/backend/ReadPanel.tsx`
- Create: `passion/apps/mvp-jul24/src/backend/ReadPanel.css`
- Create: `passion/apps/mvp-jul24/src/backend/ReadPanel.test.tsx`
- Modify: `passion/apps/mvp-jul24/src/qa.ts` (add `showRead` / `read`)
- Modify: `passion/apps/mvp-jul24/src/App.tsx` (render the panel for the QA-only screen)
- Modify: `passion/apps/mvp-jul24/src/game/types.ts` (add `"read"` to the `Screen` union)
- Modify: `passion/apps/mvp-jul24/src/game/store.ts` (add `goToRead`)
- Test: `passion/apps/mvp-jul24/src/App.test.tsx`

**Interfaces:**
- Consumes: `deriveRead`, `DerivedRead` (Task 7); `sessionLog` from `../signals/session`; `DEMO_NOW` (Task 6).
- Produces: nothing later tasks use — this is the last task.

Follow Task 1's precedent from the previous branch exactly: the screen joins the `Screen` union and the store gains `goToRead`, but **no child-reachable control navigates to it.** The only entry point is `window.__qa.showRead()`.

- [ ] **Step 1: Write the failing test**

Create `passion/apps/mvp-jul24/src/backend/ReadPanel.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DEMO_NOW } from "./demo-kid";
import ReadPanel from "./ReadPanel";

test("renders a cell with its lifecycle state", () => {
  render(<ReadPanel now={DEMO_NOW} />);
  expect(screen.getByText(/math-puzzles/)).toBeInTheDocument();
});

// §11: no scalar score, no ranking, no fixed label. This panel is operator-facing, which permits a
// readout at all, but not a scored one.
test("renders no scalar score, percentage, or ranking", () => {
  const { container } = render(<ReadPanel now={DEMO_NOW} />);
  expect(container.textContent).not.toMatch(/\d+\s*%/);
  expect(container.textContent).not.toMatch(/\bscore\b/i);
  expect(container.textContent).not.toMatch(/\brank(ed|ing)?\b/i);
});

// The wiring canary, on screen. A read derived from nothing looks exactly like a read of a child
// who did nothing, so the operator needs to see the drop count.
test("shows the dropped count so broken wiring is visible", () => {
  const { container } = render(<ReadPanel now={DEMO_NOW} />);
  expect(container.textContent).toMatch(/dropped/i);
});
```

And append to `passion/apps/mvp-jul24/src/App.test.tsx`:

```tsx
test("no child-reachable navigation offers the derived read", () => {
  render(<App />);
  expect(screen.queryByRole("button", { name: /read|interest|belief/i })).not.toBeInTheDocument();
});

test("the derived read is reachable behind the QA gate", async () => {
  const { installQa } = await import("./qa");
  installQa();
  window.__qa?.showRead();
  render(<App />);
  expect(screen.getByText(/math-puzzles/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run them and watch them fail**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run src/backend/ReadPanel.test.tsx src/App.test.tsx
```

Expected: FAIL on `Cannot find module './ReadPanel'` and on `showRead` not existing.

- [ ] **Step 3: Write the panel**

`ReadPanel` takes `{ now }: { now?: string }` (defaulting to `DEMO_NOW`), calls `deriveRead(sessionLog.interactions(), sessionLog.surfaced(), now)` in a `useMemo`, and renders per cell: the cell key (`domainPath × workMode`), its lifecycle state, and the evidence count behind it. Where the engine declines to conclude, render an explicit **"not sure yet"** rather than an empty row — a blank is indistinguishable from a bug.

Render `droppedCount` with a visible label containing the word "dropped", and make a non-zero value obvious.

Carry a header comment stating: this is operator-facing and QA-gated, why a child must never reach it (§11, and the readout removed on the previous branch), that the mode axis is degenerate so every cell will share one mode (design §7.1), and that the confident cell rests on a synthetic seed (§3.4) so a demo must say so.

- [ ] **Step 4: Wire the screen and the QA contract**

Add `"read"` to the `Screen` union in `game/types.ts`; add `goToRead: () => set({ screen: "read", focusedGadgetId: null })` to `game/store.ts`; render `{screen === "read" ? <ReadPanel /> : null}` in `App.tsx`'s `<main>`; and extend `qa.ts`'s `QaContract` with `showRead(): void` and `read(): DerivedRead`. **Add no nav button.**

- [ ] **Step 5: Run the tests and the build**

```bash
cd passion/apps/mvp-jul24 && pnpm vitest run && pnpm typecheck && pnpm build
```

Expected: whole suite green, typecheck 0, and `pnpm build` exits 0 — the build matters here because this is the first task where engine code reaches the browser bundle for real.

- [ ] **Step 6: Commit**

```bash
git add passion/apps/mvp-jul24/src/backend passion/apps/mvp-jul24/src/qa.ts passion/apps/mvp-jul24/src/App.tsx passion/apps/mvp-jul24/src/App.test.tsx passion/apps/mvp-jul24/src/game/types.ts passion/apps/mvp-jul24/src/game/store.ts
git commit -m "feat(mvp-jul24): an operator-facing panel for the derived read

Renders the cells runCycle produced, their lifecycle states, an explicit
\"not sure yet\" where the engine declines to conclude, and the dropped
count so broken wiring is visible rather than silent.

QA-gated with no nav button, following the precedent set when the
child-facing time-on-task readout was removed: a child-facing read is a
PRD §11 violation, an operator-facing one is explicitly permitted."
```

---

## Final gate

From the repo root:

```bash
pnpm typecheck && pnpm test && pnpm lint
```

Then, from `passion/apps/mvp-jul24`, `pnpm build` — the repo-root gate does not build this app, and a browser bundle that fails to build makes the demo undemonstrable no matter how green the tests are.

## Ordering

**Task 1 first and alone** — it retires the toolchain risk everything else assumes. **Tasks 2 and 3 are the two independent causes of the 100% drop rate** and can be done in either order, but both must precede Task 5. **Task 4 must precede Task 5** (`session.ts` states why: flipping the flag before wiring the surfaces reinstates a silent under-count). Task 6 precedes Task 7. Task 8 is last and depends on 6 and 7.

## What a reviewer should push on

- **Task 2's `AFFORDED = ["investigate"]`.** This sets the key every cell is derived on and it is design open question 1. If `perform` is the better read for puzzle-solving, this is the one line to change and every downstream expectation moves with it.
- **Task 4's shelf identity decision** (a: don't emit, or b: catalog the shelf as a resource). Option b is the better product and requires deliberately amending Task 2's exactly-once test.
- **Task 6's seed.** It is synthetic by design, and the question is whether a demo resting on it is worth more than an honest single-session "not sure yet".
- **Whether Task 8 belongs in the game at all**, or whether the read should only ever appear in `guide-console` — design open question 4.
