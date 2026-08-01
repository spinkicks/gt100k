# Deepen the chess mastery map: design

**Status:** designed, not yet built.
**Date:** 2026-08-01
**Context:** For the demo, the chess vertical is the proof of concept, and the centerpiece is the
mastery map itself — it must read as **deep and real**. The map's *reasoning* is already rigorous
(`docs/decisions/2026-07-30-mastery-scaffold.md`, authored under the Steps Method with FIDE and
research citations). What is thin is everything a guide would actually run a child through:
resources, opportunities, coverage, and shape. This spec closes that gap on all four axes without
weakening the honesty the map is built on.

## 1. The gap, precisely

`CONSOLE_CHESS_MAP` in `passion/apps/guide-console/app/maps-seed.ts` today:

- **12 milestones**, `ch-whole-game` → `ch-rating-that-means-something`, each with a sourced
  `ordering`, a `demonstration`, DAG `requires`, and honest `limit`s. This part is strong and mostly
  stays.
- **Only two curated resources** (`STEPS_WORKBOOKS`, `LICHESS_PRACTICE`) reused across all 12
  milestones.
- **Two milestones** carry an `OpportunityHint`; the other ten carry none.
- `modes: ["perform", "investigate"]` are *declared* on the map, but **every milestone is trunk**
  (`modes: []`). The graph is a straight line.

The guide console panel (`maps-panel.tsx`) **already renders** resources (as links with age tiers),
practice forms, opportunities, and a `Trunk` / `Branch: …` label per milestone. So depth authored
into the seed is visible in the demo with **no UI work**.

## 2. What this is (and is not)

- **It is data authoring** against the existing `@gt100k/mastery-map` model plus test updates. No new
  types, no model changes, no panel changes.
- **It is not** a child-facing surface, a second-domain map, or any change to the
  attestation / socratic-defense engine (`mastery-map/src/attest.ts`) — that engine consumes the map
  unchanged.

## 3. Honesty constraints (the rules the work lives inside)

These are enforced by `validateMap` and by the map's stated ethos. Every item below is a hard gate,
not a preference.

- **Sourcing.** Every new or changed `ordering` names a real `basis` and real `sources`. A `model`
  basis carries **no** sources (validator `E4`) and the **share of `model`-basis milestones stays
  under 34%** (`MODEL_BASIS_MAX_SHARE`). The chess domain has a federation, a rating, and a
  published syllabus, so nearly every milestone should be `syllabus` or `research`; `model` is a
  last resort.
- **Resources are real and vetted.** Every new `CuratedResource` is a **live-verified URL**
  (checked with WebFetch during implementation — no invented or guessed links), with honest
  `provenance: "curated-library:human-vetted"`, correct `ageTiers`, a defensible `reputation`, and
  accurate `affordedModes` / `domainPath` / `pursuits`.
- **Capabilities are verbs of doing.** No capability begins with a consumption opener
  (read/watch/study X) — validator `W6`. The field says what the child can *do*.
- **The ceiling stays honest.** The ~2100 Steps ceiling, the "titles are a different undertaking"
  limit, and the "solitary-study research is contested" caveats are preserved verbatim in the
  milestones that carry them.
- **No progress theatre.** Nothing added implies a percentage, a count, or a pass. The map names the
  climb; standings come only from a child's real work, downstream.

## 4. The four deepenings

### 4.1 Resources per milestone

New file: `passion/apps/guide-console/app/maps-seed-chess-resources.ts`, exporting a vetted library
imported by `maps-seed.ts` (prefer-a-new-file; keeps the growing resource list out of the shared
seed's body). Target **~18–24** resources, each verified live. Candidate set (final list confirmed
at implementation, URLs verified, unreachable ones dropped):

- The **Steps Method** workbooks by step (Step 1 … Step 6), so a milestone points at *its* workbook
  rather than the whole method.
- **Lichess**: the training/puzzles trainer, specific endgame practice, and relevant public studies
  (e.g. basic checkmates, pawn endgames).
- **chess.com**: the Learn lessons path and puzzle sections (age-appropriate).
- A **notation / scoresheet** guide for `ch-write-it-down`.
- **US Chess** and **FIDE** pages: rating classes, the tournament/event finder, the Laws of Chess.

Each milestone gets **2–4** resources chosen for *that* capability. `affordedModes` on each resource
must be consistent with the milestone(s) it serves.

### 4.2 Opportunities and rating anchors

Add `OpportunityHint`s so the real-world climb is legible, each with an honest `readinessNote` and a
`stageFloor` no lower than the milestone's:

- **Online arena** (Lichess / chess.com rated play) — early, `perform`.
- **Club ladder / internal tournament** — after a whole game under a clock.
- **Scholastic / age-group tournament** — after the first rated game.
- **Federation-rated open event** — later, tied to `ch-rating-that-means-something`.
- **Rating-class checkpoints** (US Chess class bands: E/D/C/B/A/Expert) surfaced as
  `competition`/`community` hints, never as a promise, and never contradicting the honest ceiling.

### 4.3 Fuller coverage (new milestones)

Add **~4–6** milestones that fill *real* gaps, each sourced. Candidates (final placement and sources
confirmed at implementation; any that cannot be honestly sourced are cut, not padded):

- **Opening principles** — develop, castle, don't move the same piece twice, fight for the centre.
  Currently absent; the Steps Method treats opening play as principles before repertoire, which is
  the citable placement. `basis: "syllabus"`.
- **King safety / when to castle** — as a named decision, not a rule recital.
- **Study your own games** — find the move you actually lost to and why. Distinct from
  `ch-teach-yourself` (which is choosing your own *material*). `basis: "syllabus"`/`research`.
- **Visualization / play a move blindfold** — a short rung on picturing the board, related to but
  earlier than `ch-see-ahead`.

Each new milestone: `capability` (a doing-verb), `requires` wired into the DAG with no cycle or
dangling edge, `stageFloor`, sourced `ordering`, ≥1 vetted resource, ≥1 practice form, a
`demonstration` artefact.

### 4.4 Mode branches (line → graph)

After tactics are secure (around `ch-see-the-tactic` / `ch-real-tournament-game`), branch by
`WorkMode`. Branch milestones set `modes` to a non-empty subset of the map's `modes`, and the map's
`modes` list is the union of every branch mode used.

- **`perform` (compete):** the tournament → rating ladder (existing
  `ch-real-tournament-game` → `ch-rating-that-means-something`), marked as a `perform` branch.
- **`investigate` (study deeply):** annotation, endgame theory, studying your own games — an
  `investigate` branch.
- **`explain` (teach others):** add `explain` to the map's `modes` and add a teach-a-beginner /
  write-a-lesson milestone. Basis: the **learning-by-teaching / protégé-effect** literature
  (e.g. Fiorella & Mayer; Chase et al. on tutoring) — `basis: "research"` with real citations
  verified at implementation. If that literature cannot be cited cleanly for a *chess* progression,
  this branch is cut rather than asserted on a `model` basis.

The trunk remains the shared spine; branches hang off it. Every branch milestone's `modes` ⊆ map
`modes` (validator-checked).

## 5. Validation and testing

Extend `passion/apps/guide-console/test/chess-map.test.ts`:

- `validateMap(CONSOLE_CHESS_MAP).errors` is empty (publishable).
- Model-basis share ≤ `MODEL_BASIS_MAX_SHARE`.
- Every milestone has ≥1 resource; every resource has non-empty `provenance`.
- The `requires` graph is acyclic and every referenced id resolves (no dangling edge).
- Every branch milestone's `modes` is non-empty and ⊆ `CONSOLE_CHESS_MAP.modes`; every trunk
  milestone has `modes: []`.
- The honest-ceiling `limit` text on `ch-rating-that-means-something` is present (guards against an
  edit silently dropping it).

Gates before PR: `pnpm lint` (biome), `pnpm typecheck` (`tsc -b`), `pnpm test` (vitest). CI also
builds every app under `passion/apps/`.

## 6. Slicing and delivery

Delivered as **one PR** (cohesive data authoring; the operator approved combining). The natural
internal order, should it ever be stacked instead:

1. Resources file + attach to existing milestones + opportunities/rating anchors.
2. New coverage milestones + mode branches (adds `explain` to map `modes`); DAG + validator changes.
3. **Optional final slice — demo child.** Seed a child whose attested chess.com work + studio
   artefacts light up rungs across the branches, so the guide console shows a child *climbing* the
   deep map. Built only if time allows before the demo; the deep map stands on its own without it.

The PR will likely exceed the usual ~400-line guideline because most of the diff is seed data; this
is called out for the reviewer rather than split artificially.

## 7. Out of scope

- Child-facing map surface (maps stay guide-facing by design).
- A second-domain map (the post-demo generalization proof the scaffold decision calls for).
- Any change to `@gt100k/mastery-map`, the panel UI, or the attestation engine.
