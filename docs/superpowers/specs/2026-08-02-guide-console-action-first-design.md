# Guide Console — action-first, evidence-on-demand

**Date:** 2026-08-02
**Status:** Design approved, pre-implementation
**Scope:** `passion/apps/guide-console` (+ one-line guard in its `overview.ts`)

## Problem

An 8-persona adversarial usability review (guides drawn from different professions,
each using the console cold, against the rubric "I have 20 other kids — do I
*immediately* know how to help this one, and do I know if this one needs help,
without reading anything I don't have to?") converged on nine findings:

1. **The roster can't triage.** Every child reads the same `"N tracked · M ready"`.
   Nothing says who needs attention, so the 20-kid scan is impossible.
2. **The wellbeing read is undifferentiated and can mislead.** A child whose
   engagement has cratered still shows a reassuring "In the zone" at the top of the
   screen, with the decline buried in a stat tile. The pediatric-nurse persona
   called a reassuring-but-wrong indicator "worse than no indicator."
3. **A jargon wall,** starting with the "Hypotheses" tab; the console ships with a
   glossary, which is the tell.
4. **Numbers mislead:** baseline-free percentages, `−100%` on n=2, an undefined
   "confidence 80%", tall bars over thin data.
5. **Advice is app-verbs, not child-actions;** the mentor path is a gated dead-end.
6. **Buried lede** and the same specialization list rendered three times on one
   screen.
7. **The Family tab is hidden** although it is the carer-facing persona's best
   content.
8. **Legibility:** pale pink-on-cream, tiny grey caps.
9. **Promote's 3/3 criteria live on a different tab from the PROMOTE button.**

Underlying architecture fact that reframes finding (2): the `@gt100k/wellbeing`
engine **already represents struggling states** (`BURNOUT_TIP`, `EARLY_BURNOUT`,
`GAP`, `DANGER_WINDOW`, `OVER_CHALLENGED`; four force `escalateToHuman`). "Always
In the zone" is not an engine limit — it is that **wellbeing (is the child okay?)
and engagement (is this interest still alive?) are two separate reads, and the calm
wellbeing read visually dominates while the cratering engagement lives only in a
stat tile.**

## Principle

**Action-first, evidence-on-demand.** The guide should instantly know what to do,
and be able to investigate only if they choose to. Every screen answers "what does
this child need from me right now?" before it offers anything to read.

## Decisions (locked with the operator)

- **Phasing:** enhance-in-place first, then add a cross-kid roster ("Both, phased").
- **Signal:** one unified per-child status — `Needs you / Ready / Steady` — that
  fires on wellbeing escalation **or** fading engagement.
- **Vocabulary:** rename to plain words (tab + stages), technical term on hover.
- **Where the signal lives:** an app-layer module in `guide-console`
  (`app/attention.ts`) — passion-side only, no new package, no cross-`evidence-*`
  boundary, no barrel edits. Pure and unit-testable. If a second surface ever needs
  it, moving the file into a package later is a mechanical lift (YAGNI until then).

## §1 The attention signal — `app/attention.ts`

Pure module. Input: the already-composed per-child data (wellbeing reads, cvm
cards, one engagement read). Output: one verdict per child.

```ts
export type AttentionLevel = "NEEDS_YOU" | "READY" | "STEADY";

export interface Attention {
  level: AttentionLevel;
  headline: string;          // one plain line — what's up / what to do
  reason: "WELLBEING" | "ENGAGEMENT_FADING" | "GATE_READY" | "STEADY";
  specId: string | null;     // which spike it points at, for drill-in
}
```

Priority order (deterministic, mirrors `assess.ts`: safety first, then opportunity,
then quiet):

1. **Any card `escalateToHuman`** → `NEEDS_YOU` / `WELLBEING`. Headline = the worst
   state's plain label (e.g. "Early signs of exhaustion"). `specId` = that card.
2. **Engagement fading** (voluntary-returns trend down *and* past the min-count
   guard) → `NEEDS_YOU` / `ENGAGEMENT_FADING`. Headline "Interest is cooling —
   returns down." **This is the Cyrus fix**: a calm wellbeing read cannot stand
   alone when the interest is dying.
3. **Any card `gate.passed`** → `READY` / `GATE_READY`. Headline "Ready to
   promote — {area}." `specId` = the top promotable card.
4. Else → `STEADY`. Headline "Steady — nothing needs you." `specId` = null.

A child both escalating **and** gate-ready resolves to `NEEDS_YOU` (safety wins).

**State→plain-label map** is shared with `wellbeing-strip.tsx`'s existing
`STATE_LABEL` (lifted to one place so the strip and the verdict never disagree).

**Tests (pure):** one per branch; the escalation-and-ready tie (needs-you wins);
the fading guard boundary; the empty-roster/no-cards fallback (→ STEADY, never
throws).

## §2 Engagement read + the −100% fix — `app/engagement.ts` + `overview.ts`

Today `overview.ts` computes voluntary-returns halves inline for the "Voluntary
returns" tile, and its generic `trendFrom(previous, current, windowDays, noun)`
(line ~196) guards only on `windowDays < MIN_TREND_WINDOW_DAYS` and
`previous <= 0` — with **no minimum-count guard**, so `previous=2, current=0` →
`−100%` and `previous=5, current=11` → `+120%` read identically to large-sample
trends. Note the chart already has the right idea one screen over:
`MIN_TREND_EVENTS = 5` guards the returns chart (`returnsOk`), just not the tiles.

Fix, one guarded source of truth:

- Extract a pure helper `voluntaryReturns(kidId)` into `app/engagement.ts` that
  computes the window-halves (prev vs current) **with the min-count guard**
  (`prev + curr < MIN_TREND_EVENTS` → no trend / `fading = false`).
- `attention.ts` reads its `.fading`.
- `overview.ts`'s voluntary tile consumes the same helper instead of its ad-hoc
  halves.
- Add the same `prev + curr < MIN_TREND_EVENTS → return null` guard line to the
  generic `trendFrom`, so depth / sessions / coverage tiles also stop printing
  extreme percentages on tiny denominators.

`MIN_TREND_EVENTS` stays the single shared constant. (Preserve the existing Unicode
minus `−` in the label; do not regress it to an ASCII hyphen.)

**Tests:** `voluntaryReturns` guard boundary (n below → `fading:false`, no pct);
`trendFrom` regression (n=2 → null, no chip).

## §3 Phase 1 — enhance in place

- **Roster (`ChildSwitcher`, `components.tsx` ~line 393; `ChildSummary` in
  `useConsole.ts` lines 35–39 / 150–161):** extend the per-child summary with its
  `Attention`. Replace `"N tracked · M ready"` with the verdict as the primary
  line — a colored status dot + the level word (**Needs you / Ready / Steady**) +
  the terse headline. Sort the roster `NEEDS_YOU → READY → STEADY`. Demote the
  `tracked` count to a muted secondary line. The 20-kid scan now takes seconds.
- **Per-kid action line** (top of `main` in `console.tsx`, above the wellbeing
  strip): one prominent line = the selected child's headline + the single primary
  button (Promote / Review / — ). "Do this next," before any tab. The Promote
  button and its readiness now sit together (addresses finding 9 at the action
  altitude).
- **Honest strip:** `WellbeingStrip` stays but is no longer the sole signal. When
  engagement is fading under a calm wellbeing read, the action line says so, so the
  reassuring read cannot mislead on its own.

## §4 Phase 1 — vocabulary (plain words)

- Tab **"Hypotheses" → "Interests."**
- Stage labels through one shared map: plain phrase visible, technical term on
  `title=` hover. Working set (finalized against `vocab.ts` `stateTerm()` during the
  plan): Emerging→"Taking hold", Candidate→"Worth a real look", Active→"Committed",
  Parked→"Set aside".
- Tile "Depth signals" → "Going deeper."
- Retire the glossary once the terms are self-explaining.

## §5 Phase 1 — non-branching cleanups

- **Dedupe** the specialization list where it renders more than once on one screen
  (SpecRail + overview table): one canonical list; the other becomes a
  reference/link rather than a full re-render.
- **Family** tab relabel → "Family & coaching" so the carer-facing content is
  findable (discoverability improves further with Phase 2's roster).
- **Contrast:** CSS-only bump of pale-pink-on-cream and tiny grey caps to plainly
  readable. This is **basic legibility, not accessibility-parity** (parity is
  deprioritized per admissions, 2026-07-28); do not record parity as satisfied.

## §6 Phase 2 — the Today roster

A new top-level view: every child as a row = status dot + level + headline + inline
primary action, sorted by attention. Act from here; click a row to drill into the
per-kid console to investigate. Reuses `attention.ts` verbatim. New `app/today.tsx`
+ a view toggle in `console.tsx`. Ships as its own PR after Phase 1 lands.

## §7 Testing & PR phasing

**Tests**

- Pure-function unit tests: `attention.ts` (all branches + ties + empty),
  `engagement.ts` (guard boundary).
- `trendFrom` guard regression (n=2 → no chip).
- Roster-ordering: a pure sort test on the verdict list
  (`NEEDS_YOU → READY → STEADY`); a component-level assertion only if the app
  already has component-test infra.

**PRs** — each `< ~400 lines`, opened as `spinkicks`, draft, never to `main`;
Conventional Commits; run `pnpm lint` / `pnpm typecheck` / `pnpm test` before each:

- **PR 1** — §1–§3: attention signal + engagement/number fix + roster &
  action-line. The core usability win.
- **PR 2** — §4–§5: vocabulary + cleanups.
- **PR 3** — §6: Today roster.

## Non-goals / preserved

- **Do not touch the `@gt100k/wellbeing` engine or its state machine.** The console
  surfaces what it returns; the honesty fix is presentational + the engagement
  signal, not a new state.
- **Preserve** the review's list of things that already work: the NEXT TEST plain
  sentences, POINTS TO IT / POINTS AWAY framing, gating PROMOTE on 3/3, the
  "A check on our read" honesty note, the Family coaching content, and the Coverage
  tile's honest `X of Y areas we can observe` denominator.
- No new package, no barrel `index.ts`, no cross-`evidence-*` runtime import.
- Accessibility-parity is out of scope (deprioritized); §5 contrast is basic
  readability only.
