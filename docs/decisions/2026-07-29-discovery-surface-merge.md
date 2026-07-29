# The child-facing surface: merge the game into the browse wall

**Status:** **PROPOSED — needs a surface-owner ruling.** This revisits and, if adopted, **supersedes
the 2026-07-27 ruling** ([`2026-07-27-discovery-surface.md`](./2026-07-27-discovery-surface.md)),
which kept the `mvp-jul24` game and declined a second child-facing surface. That doc scoped itself to
*"the surface we have now, not the surface forever"* and required that revisiting it *"needs a new
ruling rather than a quiet drift"* (§-1). This is that revisit. **No merge code ships until this is
ruled on** — shipping first would be the quiet drift the prior doc forbids.
**Date:** 2026-07-29
**Question:** Should the child-facing surface become the `#237` browse wall, with the 15 built games
ported in as the generative activity behind each cabin?

---

## The decision proposed

Build **one** new child-facing app, `passion/apps/discovery`, that is the **browse wall as the choice
surface** with the **15 existing games ported in as the generative act behind a subtopic**. At the
subtopic level the child gets **a game *and* the curated resource links beside it** — the game is the
"make something" depth channel; the links are the "leave to learn" channel the prior doc left open.

This is not "replace the game with the wall." It is a merge in which each surface supplies exactly what
the other structurally cannot.

## Why — the two surfaces are complementary, not competing

The 2026-07-27 doc lists the design rules a discovery surface must meet. Mapping both surfaces against
those rules shows they are mirror images:

| Design rule (from 2026-07-27 §0) | `mvp-jul24` game | Browse wall (`#237`) |
|---|---|---|
| **Rule 1** — choice moment is a *label*, not a picture (Javora aesthetic confound) | ✗ painted props / backdrops | ✓ uniform OKLCH tiles, one glyph vocabulary |
| **Rule 5 / #203** — log the offered set incl. `position` | ✗ backdrop props emit nothing | ✓ logs every offered tile with position |
| **Rules 3–4** — fixed non-personalised membership, random order (keeps *decline* ≠ *never-shown*) | ✗ | ✓ fixed roster, random order per session |
| **Generative act per topic** — the depth channel (chose-harder, revised-unprompted, made-something) | ✓ 15 real puzzles | ✗ *"no expression in a page of links"* |

The prior doc pre-sanctions this exact shape: it kept the games specifically because they are *"the
thing a launcher cannot have — an active generative task per topic"* (§ "what stays open"), and it put
the gadget→taxonomy crosswalk *"back in scope … no minting is required."* The merge is the first
surface that passes **all** the rules at once. The residual — a game surface still contains pictures —
is the acknowledged, un-closable aesthetic cost, now confined to *behind* the label rather than *at*
the choice moment.

## Architecture — a fresh app, both surfaces port in

`passion/apps/discovery`, a new Next.js app modelled on `design-lab` (the wall's current host). Both
originals stay in the tree as reference until the new app is validated.

**Why fresh:** the game is a Vite/React/Zustand SPA; the wall is Next.js. A fresh app gives one clean
product boundary, avoids retrofitting either original, and keeps the port a mechanical copy on both
sides. Cost is upfront scaffolding, accepted.

### What ports cleanly

- **All 15 games** — each is a self-contained `ComponentType<{ seed, tier?, onSolved, onExit }>` with
  **zero reach-in** to the store, router, or signal log (verified by grep across every puzzle: no
  `useGame` / `signals/` / `useInterest` imports). Copy the `src/puzzles/<Name>/` dirs verbatim.
- **4 shell-agnostic shared modules** the games depend on: `src/teachin/` (18 games), `src/audio/engine.ts`
  (singleton, 6 games), `src/code/` (3 code games), `src/puzzles/openTier.ts` (tiered games).
- **The wall itself** — `page.tsx`, `model.ts`, `glyphs.tsx`, `browse.css` already consume the *real*
  canonical data (`CABINS`, `SEED_SUBTOPICS`, the 157-resource `SEED_LIBRARY`, `curatedForCell`). No
  mock content to unwind.

### What is dropped (the painted-shell layer the wall replaces)

`MapScreen`, `CabinView`, `CabinBackdrop`, `quads.data.ts`, `cabins.data.ts`, the `scene3d/` and static
hotspot backends — all specific to the map→cabin metaphor and irrelevant to a browse wall.

## The hard part — signal wiring (this is the real engineering)

The wall prototype **emits nothing real**: its offer log is local React state, it logs *DomainPaths*
(`math-puzzles/logic-puzzles`) not catalog `artifactId`s, and it never emits an `Interaction`. The game
*does* emit correctly (in `GadgetOverlay.tsx` + `src/signals/{log.ts,uplink.ts}`), and those modules are
shell-agnostic — so the new app **reuses the game's emitter and rebuilds the thin call-site**. Binding
invariants (from `@gt100k/signal-pipeline`) the merged surface MUST honor:

1. Emit a `SurfacedRecord` (with `position`) for **every** offered item, idempotent per session.
2. **Same `sessionId` on surfacings and interactions** — a mismatch silently discards *all* skip/decline
   evidence (the most fragile cross-surface invariant; see `2026-07-27-no-choice-no-decline.md`).
3. Emit `artifactId`s that resolve in `CONSOLE_CATALOG` via the `discovery-catalog` crosswalk. Games map
   to gadget ids (`balance-scale` → `math-puzzles/foundations/…`); the wall's tile ids are DomainPaths.
   **The merge must fix the `artifactId` at each level** (cabin tile, subtopic tile, game, resource link)
   and avoid id↔domainPath collisions, or `mergedCatalog()` throws.
4. Distinguish **presence** (`open`) from a **scoreable engagement** (`recordAction(id, solveVerbFor(id))`);
   emit `chosen_challenge` on "harder", `unrequired_revision` on post-solve revisit.
5. Bucket dwell (`under_floor`/`short`/`medium`/`long`); **never emit a raw duration**. Set `prompted`
   correctly (voluntary vs system-surfaced).
6. Consent gate **G3** (`discovery-measurement`) still runs server-side before ingest; **no gamification**
   (Rule 4 / guardrails GC1·GC6) — no points, streaks, badges, unlocks, notifications.

## Phased plan

- **Phase 0 — ruling.** Land this doc; get the surface owner's decision. *(Gate; nothing below starts first.)*
- **Phase 1 — scaffold `passion/apps/discovery`.** New Next app, wall ported in unchanged, real data wired.
  Exit: `/discovery` renders the wall; `tsc -b`, biome, `next build` green.
- **Phase 2 — port the game runtime.** Copy 15 puzzle dirs + 4 shared modules; stand up a puzzle-host
  component (the reusable half of `GadgetOverlay`: seed generation, Solved panel, tier offer). Exit: every
  game mounts standalone behind a subtopic and is solvable.
- **Phase 3 — the merged subtopic view.** Subtopic opens to game-beside-links. Wire `onSolved` → the real
  emitter. Exit: a solve produces a correct `Interaction` + cell in the guide console (real ingest path).
- **Phase 4 — offered-set + position emission.** Replace the prototype's local offer log with real
  `SurfacedRecord` emission; shared `sessionId`; consent-gated uplink. Exit: skips/declines derive
  correctly in `deriveSkips`; the identifiability invariant (fixed membership, random order) holds.
- **Phase 5 — cutover.** `discovery` becomes the child-facing surface; `mvp-jul24` and the `#237` branch
  retire to reference. Exit: parity checklist + the requirements table from `2026-07-27-discovery-surface.md`.

## Risks & open questions

- **`artifactId` scheme across four levels** — needs a small spec before Phase 3 so the crosswalk and
  `CONSOLE_CATALOG` stay collision-free. The single most likely source of silent signal loss.
- **Games under Next** — the puzzles are client components using Web Audio + timers; Phase 2 must verify
  each under Next's SSR/build boundary (`"use client"`, no server-render of audio).
- **`localStorage` namespacing** — game and wall both persist under `mvp-jul24:*`; the new app needs its
  own namespace or the two collide in one origin.
- **Evidence gap (unchanged, carried forward):** no study compares a game surface vs a browse surface as
  interest-measurement instruments at this age. The merge is argued from adjacent findings, same as the
  prototype — this doc does not close that gap, it inherits it.
- **Family layers unaffected:** admissions selection (`familyBrainlift.md`) and the co-engagement engine
  (`packages/family`) both sit outside the child surface and only read its emitted beliefs — invisible to
  this merge **provided** the emission contract and no-gamification rule hold.
