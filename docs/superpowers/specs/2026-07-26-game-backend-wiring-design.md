# 🧪 EXPERIMENTAL — Wiring the game into the discovery chain

> **Status: EXPERIMENTAL. Design only, nothing built. Awaiting teammate review.**
> Labelled experimental at the operator's request. This is a proposal for how the `mvp-jul24` game
> could feed the real discovery engines, chosen for demo value rather than for production fitness.
> §7 states plainly what it is not.

**Date:** 2026-07-26
**App:** [`passion/apps/mvp-jul24`](../../../passion/apps/mvp-jul24)
**Stacked on:** the "a room worth being in" branch (`dev/mvp-jul24/room-worth-being-in-spec`, PR #183).
That work is a premise here, not a coincidence: it made `backdrop` the only backend and switched
signal emission off, and both facts change what this design has to do.
**Reads with:** `docs/prd/DISCOVERY-APP-PRD.md` §5.4 / §6 / §11, `docs/prd/engines/C2-tagging.md`,
`docs/prd/engines/C3-inference.md`, and the previous design's
[§2](2026-07-26-mvp-jul24-room-worth-being-in-design.md), which recorded this lane when it was cut.

## 1. The goal, and what makes it small

**A child plays the game and an operator sees a genuinely derived interest read.** End to end,
through the real engines, with nothing hand-built in between.

The reason this is a modest change rather than a project is that **the entire discovery chain is
pure and browser-safe.** Verified by inspection: `@gt100k/signal-pipeline`,
`@gt100k/interest-inference`, `@gt100k/hypothesis-store`, `@gt100k/student-profile` and
`@gt100k/two-axis-tagging` import **no Node builtins at all**. Only the `profile-store-fs` adapter
does, and this design does not use it.

So there is no server, no transport, no API, no CORS, no database and no second app. The game
imports the engines and calls them. The chosen shape is **the whole chain running in the browser,
inside the game**, with the read rendered behind the existing QA gate.

The engine seam is already the right shape and needs no change:

```
runCycle(profile, newInteractions, ctx, now) → StudentProfile
```

`guide-console` already calls exactly this, over hardcoded synthetic logs with a `PILOT_CATALOG` of
tagged artifacts (`passion/apps/guide-console/app/console-data.ts`). This design supplies the game's
equivalents of those two inputs. **No engine package is modified.**

## 2. Why nothing works today

Two independent hard blocks, both verified in code. Either one alone drops **100%** of what the game
emits, and `#161` shipped an emitter that looks correct because it is typed against the real
contract — `tsc` passes, the records are well-formed, and every one of them is discarded.

`buildActionEvents` (`passion/packages/signal-pipeline/src/actions.ts`) is where they die:

1. **No artifact catalog exists.** Nothing in the repo maps `nonogram` — or any other gadget id — to
   an `Artifact { domainPath, affordedModes }`. `catalog.get(artifactId)` misses, so every record is
   dropped `unknown-artifact`.
2. **`actionType: "open"` yields no cell** — but see the correction immediately below, because this
   is no longer the defect it was when this design was first written. The mode table
   (`passion/packages/two-axis-tagging/src/resolver.ts`) is a closed vocabulary of ten verbs:
   `play`, `assemble`, `inspect`, `tinker`, `write-melody`, `fix`, `teach`, `pitch`, `co-work`,
   `tend`. `"open"` is not among them, so it resolves to no work-mode and produces no `CellEvent`.
   Depth is also emitted *as* an `actionType` (`recordDepth(id, "unrequired_revision")`), which
   resolves to nothing and is a straightforward bug.

> ### ⚠️ Correction — `main` moved while this was being written
>
> This design was drafted against `main` at `4c6aff6`. `main` has since advanced 23 commits, and one
> of them changes claim 2 above materially. **`"open"` is now a first-class recognised action.**
>
> `passion/packages/signal-pipeline/src/model.ts` now exports
> `MODELESS_ACTIONS: ReadonlySet<string> = new Set(["open"])` — *"actions that describe presence, not
> work. They emit no event and resolve to no cell, but they are still proof the child did not pass
> the thing over, which is what `deriveSkips` needs."* `buildActionEvents` checks it **after** the
> catalog lookup, records the interaction in `dropped` with a new reason **`"no-work-mode"`**, and
> **also** emits a new `Presence { kidId, sessionId, artifactId }` that `deriveSkips` consumes. There
> is a test named `presence-is-not-rejection.test.ts` making the point.
>
> **What this changes:**
>
> - An `open` is **not** discarded. It carries real disconfirming-signal weight: it is how the engine
>   knows a surfaced artifact was engaged rather than skipped.
> - So the fix is **not** "replace `open` with a resolvable verb". Doing that would delete the
>   presence signal and additionally assert that opening a thing *is* investigating it, which is a
>   claim about the child that the record does not support.
> - The corrected design is **two records for two different facts** (§3.2): `open` for the open, and
>   `inspect` for the child actually working the activity.
> - `dropped` will therefore legitimately contain `no-work-mode` entries, so "dropped is empty" is
>   the wrong assertion. The right one is **no `unknown-artifact` and no `unresolved-action`** — the
>   two reasons that do indicate broken wiring.
>
> Claim 1 (no artifact catalog) is unaffected and remains the load-bearing gap. The crosswalk in
> §3.1 is also unaffected: `math-puzzles` still seeds `competition-math` and `logic-puzzles` on
> current `main` (the `poker` → `odds-and-chance` rename in #204 was under `games-strategy`).
>
> **Open question 5 for the reviewer:** was `MODELESS_ACTIONS` added *for* this game's `open`, or for
> another caller? If the former, part of this design may already have been anticipated by whoever
> wrote it, and they should be asked before it is built.

A third fact, inherited from the branch this stacks on: **emission is switched off**, because the
`backdrop` backend's prop polygons and the bookshelf emit nothing and `backdrop` is now the only
backend. `signals/session.ts` records the reason and the required order — *wire the surfaces first,
then flip the flag.* This design follows that order and does not flip it early.

## 3. Architecture

One new directory in the game, `src/backend/`, plus runtime dependencies on the five engine
packages. Seven units, each with one job and a testable boundary.

### 3.1 `backend/catalog.ts` — the crosswalk and the nine artifacts

The game's topic ids are not the taxonomy's cabin ids, and the mapping is not guessable. Game
topics are `logic-games`, `math`, `music`, `code`, `art`. Taxonomy `CABINS` are `music-sound`,
`code-computers`, `games-strategy`, `making-engineering`, `art-motion`, `influence-media`,
`science-nature`, `math-puzzles`.

**The taxonomy already models the split this app made, as two subtopics of one cabin:**

| Game topic | Taxonomy `domainPath` |
|---|---|
| `logic-games` | `["math-puzzles", "logic-puzzles"]` |
| `math` | `["math-puzzles", "competition-math"]` |

That is a genuinely good fit and it is worth saying why: the app split these two rooms because the
deduction puzzles survive the swap test and the maths ones do not, so they measure different
constructs. The taxonomy independently drew the same line. The crosswalk is therefore a recognition,
not a compromise.

Nine artifacts follow `PILOT_CATALOG`'s exact pattern —
`makeArtifact(tax, { id, domainPath, affordedModes, kind: "gadget", source: "gold" })`, collected
into a `ReadonlyMap<string, Artifact>` keyed by id. The ids are the registry's gadget ids, unchanged,
so `artifactId` needs no translation at the emission boundary.

`music` / `code` / `art` get **no entries**, because they have no activities. A record referencing
them would be a bug, and `unknown-artifact` is the correct response to a bug.

### 3.2 The `actionType` vocabulary — two records for two different facts

**Revised after the correction in §2.** `recordOpen` **keeps** emitting `"open"`. It is in
`MODELESS_ACTIONS`, so the engine treats it as presence: no cell, but proof the child did not skip a
surfaced artifact, which is exactly what an open *is* and all it honestly attests.

What was missing is the second fact: **the child worked the activity.** That gets its own record with
`actionType: "inspect"`, which `ACTION_MODE_RULES` resolves to the `investigate` work-mode — the
honest reading, since these activities produce understanding rather than an artifact, a performance,
or a repair.

The distinction is not pedantry. Opening a puzzle and closing it immediately, versus opening it and
working it, are different observations about a child, and collapsing them into one verb throws away
the difference. The emitter therefore needs a defensible threshold for "worked it" rather than
"opened it" — and one already exists and is already used: `FLOOR_MS` in `signals/log.ts`, the floor
below which an open is unlikely to be real engagement. An open below the floor stays presence only.

`recordDepth` stops putting the depth kind in `actionType` — that part of the original design stands
and is a plain bug. A depth occurrence is an `inspect` carrying
`depthSignals: [{ kind, value: 1 }]`, which is the field's purpose and where `buildActionEvents`
reads it.

### 3.3 Wiring the surfaces that emit nothing

Two live interaction surfaces are silent today, and they are the only ones that matter now that
`backdrop` is the sole backend:

- **`backdrop/CabinBackdrop.tsx`'s `PropHotspot`** — the SVG polygon that opens a gadget. Its
  `activate()` calls `focusGadget` and nothing else.
- **The shelf** — opening it, and opening a card.

Both get emission. Only then does `EMISSION_ENABLED` flip to `true`, and its comment — which
currently explains why it is off — is rewritten to explain what is now covered.

### 3.4 `backend/demo-kid.ts` — the backdated seed

The engine will not call an interest confident from one sitting, by design: E6 requires distinct
days and there is a 3-day novelty window. A single session correctly returns "not sure yet".

So one demo child ships with a backdated log, mirroring `ARI_LOG`'s established shape: a novel first
exposure at −97d (outside the novelty window, so the later returns count as returns), voluntary
returns at −90 / −70 / −30, and a recent cluster every other day from −19 to −1. One cell sits
**one qualifying event short of EMERGING**, so the live session is what tips it.

**This is the part of the demo that is synthetic, and the spec says so here so the demo says so
out loud.** What is real: the pipeline, the inference, the lifecycle, the gate arithmetic, and the
records the live session contributes. What is fabricated: the history that makes the arithmetic
reach a conclusion.

### 3.5 `backend/derive.ts` — the call

```
emptyProfile(DEMO_KID_ID, DEMO_KID_NAME, priors, {})
  → runCycle(profile, [...SEED_LOG, ...sessionInteractions], { catalog, surfaced }, now)
```

`runCycle` is pure and re-derives the whole log every time, so there is no incremental state to keep
consistent and no cache to invalidate. This unit contains **no logic of its own** — if it grows a
branch, something belongs in the engine instead.

### 3.6 `backend/ReadPanel.tsx` — the operator read

Per cell: the `domainPath × workMode` label, the lifecycle state (`EXPLORING` / `EMERGING` / …), the
evidence behind it, and an explicit **"not sure yet"** where the engine declines to conclude. Plus
the pipeline's `dropped` count, which must be zero and is the fastest way to see the wiring break
again.

**Hard constraints, all inherited and all load-bearing:**

- **QA-gated, operator-facing, no child-reachable path.** The branch this stacks on removed a
  child-facing readout as a live PRD §11 violation. Re-adding one here would undo that.
- **No scalar score, no ranking, no fixed label.** §11 soft guidelines.
- **No duration anywhere a child can reach.** `dwellBucket` may be shown as a diagnostic in this
  operator panel; it may never be scored, and the engine already makes that structurally impossible
  by keeping it off `CellEvent`.

### 3.7 `window.__qa`

Extends the contract added on the previous branch: `showRead()` and `read()` beside the existing
`showReadout()` and `interest()`.

## 4. Data flow

```
child plays
  → sessionLog writes Interaction[] + SurfacedRecord[]   (localStorage)
  → operator: window.__qa.showRead()
  → derive.ts: SEED_LOG ++ session records
  → runCycle: deriveSignals (012) → runInference (011) → applyInterestRead (013)
  → ReadPanel: cells, states, "not sure yet", dropped === 0
```

One direction, no round trip, no persistence beyond localStorage.

## 5. Testing

- **Catalog completeness** — every gadget in `GADGETS` has exactly one catalog entry and every entry
  a valid `domainPath` affording ≥1 mode. Same shape as `quads.data.test.ts`'s exactly-once rule,
  which already catches this class of drift at build time.
- **Every emitted `actionType` is one the engine knows** — in `ACTION_MODE_RULES` **or** in
  `MODELESS_ACTIONS`. *This is the test whose absence allowed a 100% drop rate to ship looking
  correct, and it is the most valuable test in the plan.* Note the `or`: asserting membership in
  `ACTION_MODE_RULES` alone would fail on a legitimate `open` and push an implementer to delete a
  correct behaviour.
- **No `unknown-artifact` and no `unresolved-action`** in `dropped`, for a scripted session over the
  real catalog. Those two reasons mean broken wiring. `no-work-mode` entries are **expected** — they
  are the presence records — so asserting `dropped` is empty would be asserting the engine's designed
  behaviour away.
- **Presence is produced for opens.** A scripted session's opens should appear as `present` records,
  because that is what makes a surfaced-but-not-engaged artifact distinguishable from an engaged one.
- **Golden transition** — seed + scripted session moves the target cell EXPLORING → EMERGING, and
  seed alone does not. Both halves matter: the second proves the live session is what tipped it.
- **No child-reachable read** — the same guard the previous branch used, extended to the new panel.
- **No scalar score or ranking rendered.**

## 6. What this deliberately does not do

- No server, no HTTP, no `profile-store-fs`, no change to `guide-console`, no new app.
- No change to any engine package.
- No wiring of `music` / `code` / `art`.
- No `CellEvent` persistence across browsers or devices.
- No choice-set recording beyond the `SurfacedRecord`s already emitted (proposal E3 stays open).

## 7. Honest limits — read this before demoing it

1. **The mode axis is degenerate.** All nine activities are solve-a-puzzle, so all nine afford
   `investigate` and every record lands in one column. C3 keys beliefs on `(domain × work-mode)`
   cells, so this produces roughly a **2×1 matrix**: a real *domain* read (`logic-puzzles` vs
   `competition-math`) with **no mode marginals and no topic-vs-style attribution**. That is the
   ceiling of a demo built on these nine activities. It is a *content* gap — the fix is activities
   that afford `build`, `compose`, `explain` — and no amount of wiring closes it.
2. **The confident cell rests on synthetic history** (§3.4). The mechanism is real; the conclusion is
   reachable only because the seed was authored to make it reachable.
3. **localStorage only.** One browser, one profile; clearing site data resets the child.
4. **Still not a defensible interest read**, and this design does not claim to make one. The
   previous design's §2 and the memo's P1/P2/P4 remain open: no choice-set recording, and
   `voluntary_return` still conflates a same-session reopen with a cross-day return. This produces a
   read that is *genuinely derived* — which is a different and much weaker claim than *valid*.
5. **One child.** No roster, no multi-kid switching.

## 8. The risk to retire first

The engine packages export **raw TypeScript** (`"main": "./src/index.ts"`, `"exports": { ".":
"./src/index.ts" }`) and the game consumes `@gt100k/signal-pipeline` today as a **type-only
devDependency**, erased at build. Promoting it to a runtime dependency means Vite must transpile
workspace-linked TS sources it has never had to transpile here before.

This is expected to work — they are symlinked workspace packages, which Vite treats as source rather
than pre-bundled deps — but it is **unproven in this app** and everything else rests on it. The plan
therefore proves it in its first task, with a throwaway import and a build, before any of the above
is written. If it fails, the fallbacks in order of preference are Vite `resolve.alias` entries to the
package sources, adding the packages to `optimizeDeps.include`, or a build step for the five
packages.

## 9. Open questions for the reviewing teammate

1. Is `investigate` the right mode for these activities, or is `play → perform` the better read for
   the puzzle-solving ones? The choice sets what every cell in the demo is keyed on, and I may be
   wrong.
2. Is the `math-puzzles/{logic-puzzles, competition-math}` crosswalk right, or should the game's two
   rooms map to two different *cabins* rather than two subtopics of one?
3. Is a synthetic backdated seed acceptable in a demo, or does it undercut the point badly enough to
   prefer the honest single-session "not sure yet"?
4. Should this land in the game at all, or wait for the real two-surface integration (an ingest route
   into `guide-console`) so the operator sees it in the actual operator product?
