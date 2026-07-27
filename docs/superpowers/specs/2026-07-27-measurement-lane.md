# Connecting the measurement lane

**Status:** Spec, ready for review. Not implemented.
**Date:** 2026-07-27 (rev 2, after a red-team pass that found four blockers in rev 1)
**Affects:** `@gt100k/signal-pipeline`, `passion/apps/mvp-jul24`, and the guide-facing copy in
`@gt100k/mastery-map` + `guide-console` that currently promises the opposite of what this delivers.
**Prior art:** the TimeBack subject-to-cabin crosswalk (G2/020) is the precedent for §4's table.

---

## 1. What is actually broken

The engine receives nothing from the discovery game. There are **four** blocks between a child's
click and a posterior, and they are in series, so fixing any three changes nothing observable.

**Block 0 — emission is switched off.** `EMISSION_ENABLED = false`
(`mvp-jul24/src/signals/session.ts:38`) and `sessionLog` is a no-op with the same shape. Nothing is
recorded at all. This is deliberate and documented: the backdrop's prop polygons and the shelf are
not wired to `recordOpen`/`recordSurfaced`, so a live log would under-count every open, and the
decision was to be honest about coverage rather than ship a partial one. **Its precondition is
unscoped work in the app, and this spec does not scope it either.** Flipping the flag without doing
that work reinstates exactly the silent under-count it was turned off to prevent.

**Block 1 — no artifact catalog.** Nothing maps `nonogram`, or any gadget id, to an
`Artifact { domainPath, affordedModes, ... }`. `catalog.get(artifactId)` misses and the record is
dropped `unknown-artifact`.

**Block 2 — no resolvable action.** `ACTION_MODE_RULES` (`two-axis-tagging/src/resolver.ts:6`) holds
`play`, `assemble`, `inspect`, `tinker`, `write-melody`, `fix`, `teach`, `pitch`, `co-work`, `tend`.
The app emits `open` and, via `recordDepth`, the depth kinds as actionTypes. Verified by running each
shape through `deriveSignals`:

```
actionType "open"                 -> DROPPED, unresolved-action
actionType "chosen_challenge"     -> DROPPED, unresolved-action
actionType "unrequired_revision"  -> DROPPED, unresolved-action
```

**Block 3 — no crosswalk.** Game topics are `logic-games`, `math`, `music`, `code`, `art`, `science`,
`words`. Taxonomy cabins are `music-sound`, `code-computers`, `games-strategy`,
`making-engineering`, `art-motion`, `influence-media`, `science-nature`, `math-puzzles`.

### Why this is worth doing

While it holds, `depthAccumulation` is 0 for any real game data, so nothing clears `DEPTH_S2` (3);
`stretchSeeking` is false, so S3 and S4 are unreachable; and the interest read has no events, so no
hypothesis becomes confident, so nothing is promotable and no plan can be produced. Everything
downstream currently runs on synthetic fixtures. That is acceptable today, because no child is
enrolled. It is not a pre-live gate blocking us; it is the thing that would make the pre-live gates
worth passing.

---

## 2. The decision that shapes everything: `open` has no work-mode

**An open does not resolve to a work-mode, and must not be made to.**

The one-line fix is to give `open` a rule, most plausibly the artifact's first afforded mode. That
would quietly corrupt the read we take most care over. Opening a thing is presence, not a way of
working: a child who opens the Gear Train and looks at it has not built anything, and recording
`build` manufactures evidence for a mode they never engaged.

It matters here more than it would elsewhere because the mode read is deliberately a **nuisance
covariate, not a trait** (`DISCOVERY-APP-PRD.md` §6.4). The nine modes have no established
developmental basis at ages 6 to 8, mode preference has a stability ceiling near .31 in childhood,
and the only reason the engine models mode is to soak up variance so the *topic* read comes out
clean. A mode inferred from presence is noise injected into the term that exists to absorb noise.

### 2.1 An open stays in `dropped`, under an honest reason

Rev 1 proposed letting a mode-less record "through as a non-scoring exposure". That is not
implementable and would have been a net loss. `BuiltEvent.cellKey` is required (`actions.ts:14`),
`engagedModes.primary` is required (`records.ts:65`), `classifyReturns` keys on
`exposureKey(kid, cellKey)` (`returns.ts:54`), and `buildFirstExposure`/`isNovelty` take a cellKey
whose serialization embeds the mode (`novelty.ts:19,36`). A mode-less record can be none of those.
Since `deriveSignals` returns only `{actionEvents, cellEvents, dropped}`, "letting it through" would
have meant its sole effect was *disappearing from `dropped`* — deleting the firewall's own reporting
channel for it.

So: **an open is dropped, with reason `no-work-mode` rather than `unresolved-action`.** That
distinguishes "this is not a way of working, by design" from "we could not resolve this, which may
be a bug", which is the distinction a reader of `dropped` needs. It costs nothing and keeps the
record observable.

Consequently `dwellBucket` also goes nowhere for now, and rev 1's claim that an open would "carry
its `dwellBucket`" was empty: nothing in `signal-pipeline` reads that field today.

### 2.2 The sign inversion this exposes, which must be fixed in the same change

An unresolved open does not merely fail to help. **It produces a negative signal against the very
cell the child opened.** `deriveSkips` builds `engagedBySession` only from resolved events
(`skips.ts:79-85`), and treats a surfaced cell absent from that set as passed over
(`skips.ts:122`), so: surface `nonogram`, open it, engage nothing else, and the child earns a
`skip` at full `B_SKIP` weight against the thing they just chose to look at.

This is the same inversion that `dwellBucket` exists to prevent, recorded at
`signal-pipeline/src/model.ts:26-34` and guarded for the glance case by
`mvp-jul24/src/signals/wiring.test.tsx`. Opens simply reintroduce it by another door.

**Resolution: an open marks its artifact's cells as engaged for the session, without producing an
event.** Presence is not evidence *for* a mode, but it is proof the child did not pass the thing
over, and those are different claims. Concretely, `deriveSkips` gains a set of
(kid, session, artifact) touched by a mode-less record, and expands it through `offeredCells` when
deciding what was not chosen.

The opposite hazard is real and is accepted knowingly: a child who opens something, glances, and
leaves will now suppress a decline that arguably should have fired. That is the safer error. A
false decline is negative evidence against a cell the child actively chose; a missing decline is
one absent weak negative among the choice set. E4 already normalises declines by choice-set size
precisely because one choice is one observation.

---

## 3. What the game must emit instead

If opens carry no mode, the game must emit the **action** when an action happens. Solving a Nonogram
is `inspect`. Completing a Gear Train is `assemble`. The emitter reports what the child did; the
engine decides what it is worth.

`recordDepth` must stop setting `actionType` to the depth kind. Depth **rides on** an actioned
interaction; that is the shape that already resolves. This is not free for either existing signal:

- **`chosen_challenge`** fires on a click after a solve whose record was already appended and
  written (`log.ts:111-120`). It therefore emits its own interaction, carrying the same action verb
  as the solve it followed. It is not a mutation of the previous record.
- **`unrequired_revision`** is emitted in the overlay's cleanup, gated on
  `activeMs >= FLOOR_MS && solvesAtOpen > 0` (`GadgetOverlay.tsx:34-42`): a re-open of an
  already-solved gadget, with **no action in that visit**. There is no verb to ride. Either it is
  re-defined to fire on a re-solve (which has a verb), or it stays unemitted and we say so. Rev 1's
  claim that riding an action "fixes the depth signals for free" was wrong for this one.

**Recommendation:** re-define it to fire on a re-solve. Solving something again that was already
solved is a cleaner reading of "the puzzle owed them nothing" than re-opening it is, and it has an
action to attach to.

---

## 4. The crosswalk

By hand, as a small table, as with TimeBack. Keyed by registry **id**. The action verb is part of
the mapping, not an afterthought: `resolveEngagedModes` takes primary from `ACTION_MODE_RULES` order
intersected with `affordedModes` (`resolver.ts:33-36`), so the verb decides the mode, and
`affordedModes` order means nothing.

| id | topic | → `domainPath` | verb on solve | modes engaged |
|---|---|---|---|---|
| `nonogram` | `logic-games` | `math-puzzles/logic-puzzles` | `inspect` | investigate |
| `mirror` | `logic-games` | `math-puzzles/logic-puzzles` | `inspect` | investigate |
| `pipes` | `logic-games` | `math-puzzles/logic-puzzles` | `tinker` | build + investigate |
| `chess` | `logic-games` | `games-strategy/chess` | `play` | perform |
| `balance-scale` | `math` | `math-puzzles/foundations` | `inspect` | investigate |
| `fraction-laser` | `math` | `math-puzzles/foundations` | `inspect` | investigate |
| `function-machine` | `math` | `math-puzzles/foundations` | `inspect` | investigate |
| `ratio-mixing` | `math` | `math-puzzles/foundations` | `inspect` | investigate |
| `gear-train` | `math` | `making-engineering` | `assemble` | build |

**`pipes` takes `tinker`, not `inspect`.** With `[build, investigate]` afforded, `inspect` engages
investigate only and leaves `build` generating skip-noise; `tinker` engages both, primary `build`.
Routing a pipe network is construction first.

**`chess` takes `play`.** With `[perform]` afforded, `inspect` would drop the record
`invalid-for-artifact`. `perform` for chess is also the majority precedent across the repo
(`student-profile/__fixtures__/pilot.ts`, `access-broker`'s `CELL_CHESS`).

**Chess does not follow its game topic.** The game files it under `logic-games` because it survives
the symbol-swap test, sound reasoning for *that* taxonomy. Ours has `games-strategy/chess` as an
exact match, and the domain read exists to name what a child could go deep on. A child returning to
the chess puzzle is telling us about chess; routing it into `logic-puzzles` discards that. Two
taxonomies, two purposes, and the crosswalk is where they are allowed to disagree.

**`math-puzzles/foundations` is a new subtopic and must be minted.** Rev 1 mapped these four to a
bare `math-puzzles`, arguing no seed subtopic fitted. That is true but the consequences are worse
than the imprecision: `curatedForCell`'s `pathsCompatible` makes a bare cabin match *every*
subtopic, so a Balance Scale spike would be served competition-math resources — the exact
misdescription the bare path was chosen to avoid — while `mastery-map`'s `servesPath` runs the other
way, and the only math map that exists is `math-puzzles/competition-math`, so a bare-cabin spike
would get no map at all. Minting the subtopic costs one line.

**Not covered:** `music`, `code`, `art`, `science`, `words` have no gadgets. Omitted rather than
guessed; a topic with no gadget emits nothing. `words` has no cabin at all, which is a taxonomy
question for when a gadget exists.

### 4.1 The mode read is not identifiable from this app, and the spec says so

Seven of nine gadgets engage `investigate`, and eight of nine sit in `math-puzzles`. `attributionFor`
(`aggregate.ts:37-43`) compares a domain marginal against a mode marginal over near-identical cell
sets, so attribution will be `"mixed"` essentially always. **This app measures domain. It cannot
distinguish "loves deduction" from "loves maths", and nothing built on it should claim to.** The
prior design doc named this and rev 1 dropped it; it is stated here so no one reads the crosswalk as
restoring the two-axis read. Varying mode requires gadgets that afford other modes, which is content
work, not wiring.

### 4.2 Surfaced records are not all gadgets

`MapScreen` surfaces **cabin** ids (`math`, `logic-games`), not gadget ids. A gadget-keyed catalog
misses them, and `deriveSkips` silently `continue`s on a catalog miss (`skips.ts:94`) — there is no
`dropped` channel for surfaced records at all. The catalog therefore needs cabin-level entries too,
or `recordSurfaced` must stop emitting cabin ids. **Recommendation:** cabin-level entries, since
surfacing a cabin is a real choice moment on the map screen.

---

## 5. Where the catalog lives, and the dependency question it raises

**In the app.** `two-axis-tagging` should not know a product called Nonogram exists.

But `mvp-jul24` deliberately holds `@gt100k/signal-pipeline` and `@gt100k/two-axis-tagging` as
**type-only** imports, recorded at `signals/types.ts:5-8`: "no runtime dependency and no bundle
cost", because it is a standalone Vite demo. `makeArtifact` is a runtime import. So either the
catalog is written as literals (all eight `Artifact` fields, no validation) or the app takes its
first runtime dependency on the taxonomy.

**Recommendation: literals, plus a test that validates them** against `CABINS` and `SEED_SUBTOPICS`.
Keeps the bundle promise, and a test gives the validation `makeArtifact` would have. Note
`makeArtifact` always returns `tagStatus: "PROVISIONAL"` anyway, whereas these mappings are authored
by hand and are `TRUSTED`.

---

## 6. Consequences for already-shipped guide-facing copy

Seven sites assert that no child can reach S3/S4 because nothing emits `chosen_challenge`, and one
of them says so to a guide in the product: `REACHABLE_CEILING` / `CEILING_NOTE`
(`guide-console/app/maps.ts:353-372`), plus `mastery-map/src/select.ts:278`, `src/model.ts:124`,
`src/stub-generator.ts:68`, `src/__fixtures__/maps.ts:10`, `test/select.test.ts:336`,
`test/golden.test.ts:40`. All must change in the same PR that lands this.

**And the claim must be corrected while doing it.** `offersHarder` gates on `supportsTier`, which
only Nonogram sets. After this work, `stretchSeeking` is reachable through **exactly one gadget, in
one cell**. It is not "every branch milestone in every mastery map"; that was my overstatement.
Making it general is content work: more gadgets with tiers.

---

## 7. Order of work

1. **`signal-pipeline`**: `no-work-mode` as a distinct drop reason; opens mark their artifact's cells
   engaged for the session so §2.2's inversion cannot fire. Tightest tests in the change.
2. **`mvp-jul24`**: crosswalk table beside the registry; catalog literals built from it, including
   cabin entries; emit the action verb on solve; `recordDepth` rides an action; re-define
   `unrequired_revision` to fire on re-solve.
3. **`two-axis-tagging`**: mint `math-puzzles/foundations`. Nothing else. `open`'s absence from the
   rules table is §2's point, not an omission.
4. **Guide-facing copy**: retire the seven ceiling assertions, with the honest replacement from §6.
5. **End to end**: play the game's emissions through `deriveSignals` and assert what comes out. This
   must `vi.mock` the session module the way `wiring.test.tsx` does, because `sessionLog` is a no-op.

Block 0 is **not** in this list. This spec makes the lane correct; it does not turn it on. Flipping
`EMISSION_ENABLED` requires wiring the backdrop and shelf first, and that should be its own decision
with its own scope.

---

## 8. Tests that must exist

- Every registry gadget has exactly one crosswalk row; every row names a real cabin and subtopic.
- An open produces no `CellEvent`, moves neither alpha nor beta, and appears in `dropped` as
  `no-work-mode`.
- **An open does not produce a skip or decline against its own artifact's cells.** The regression
  test for §2.2, and the one whose absence allows the inversion today.
- A glance that opens nothing still declines normally, so §2.2 has not blunted E4 wholesale.
- A solve produces a return event in the mapped cell; a depth signal riding a solve arrives as a
  depth `CellEvent`. The assertion whose absence let this whole gap survive.
- `chess` routes to `games-strategy/chess` with mode `perform`, pinning both halves of that call.
- Cabin-level surfaced records resolve, per §4.2.
- **The shortest emission sequence that actually moves alpha**, written out. With
  `noveltyWindowDays: 3` and `fold.ts` skipping every novel event, a cell's first three days score
  nothing, so a naive one-session test would pass while the engine saw nothing.

---

## 9. What this does not do

It does not turn emission on (Block 0). It does not make the data real: everything stays synthetic,
no child is enrolled, and G3/G4/G5 are untouched. It does not make the mode read identifiable
(§4.1), or `chosen_challenge` reachable from more than one gadget (§6). It does not address
`failure_recovery` or `self_authored_scope`, which have no affordance to emit from — and inventing
one to satisfy the engine would be the same error as giving `open` a mode.

Existing fixtures need no migration: none use gadget ids (`pipeline.fixtures.ts` uses `synth-01`,
`pilot.ts` uses `ari-*`/`dulce-*`).
