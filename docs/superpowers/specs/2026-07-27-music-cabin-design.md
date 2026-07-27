# The Music cabin — design

**Date:** 2026-07-27 · **Status:** design, for review. **No code written.**
**App:** `passion/apps/mvp-jul24` · **Target band:** ages 9–12, gifted (PROJECT.md)
**Reads with:** `PROJECT.md` (the app's own record) · `docs/decisions/2026-07-27-discovery-surface.md`
(including the surface-owner ruling, #212) · `docs/research/passion-pipeline/06-activity-design-ages-6-8.md`
§8 · `docs/research/passion-pipeline/07-child-facing-ux-6-8.md`

## What this is

`music` is one of the three horizon cabins on the map, currently `active: false`. This promotes it to a
real, playable third room. The surface-owner ruling of 2026-07-27 keeps `mvp-jul24` as the child-facing
surface and re-scopes the discovery-surface evidence "from a reason to replace the surface into the bar
the surface is audited against," so a new room is now the right unit of work.

Three decisions were taken before this was written and are treated as settled input:

1. **Audio is dual-coded.** Every gadget makes real sound, and every gadget also exposes a visual
   representation sufficient to solve it.
2. **This document only.** No implementation until it is reviewed.
3. **The map art gets regenerated** so `music` is a near cabin, not a horizon one.

---

## 1. The problem that actually needs solving

Not "how do we build a room." The room template is well-established and §6 below is mostly mechanical.
The hard question is:

> **What makes a music activity musical, rather than arithmetic or deduction wearing a violin skin?**

This repo has already been burned by exactly this, and the scar tissue is load-bearing. Research memo 06
conflict **C1** found that all seven original gadgets were filed under `math` while in fact being
deduction puzzles: they "survive replacing every numeral with an arbitrary symbol." That produced a 1×1
matrix that could not be decomposed, and the fix was the `logic-games` / `math` split that
`src/gadgets/registry.ts` now documents at length.

So the music cabin inherits a **distinctness requirement** on top of the usual swap test. A music gadget
must not be:

- **constraint deduction** — that is `logic-games` (nonogram, mirror, chess, pipes);
- **quantitative reasoning** — that is `math` (balance scale, gear train, fraction laser, function
  machine, ratio mixing).

This is a sharper bar than it sounds, and it eliminates the most obvious "music" puzzles:

| Tempting gadget | Why it is rejected |
|---|---|
| **Monochord / harmonic series** — stop a string at 1/2 for the octave, 2/3 for the fifth | The mechanic is ratio arithmetic. `math` already ships `fraction-laser` and `ratio-mixing`. Beautiful physics, wrong cabin. |
| **Polyrhythm alignment** — when do 3-against-2 coincide? | Least common multiple. `math`. |
| **Fit the note durations into the bar** | Integer partition. `math`. |
| **"Which of these three clips is a waltz?"** | A quiz attached to audio. Fails intrinsic integration outright (memo 06 §2.1/D1): the domain content is not the mechanic, it is the question text. |

What is left, once arithmetic and deduction are removed, is the thing that is irreducibly musical:
**a heard relation between sounds.** Pitch as height, consonance, metrical feel, melodic expectation.
Those cannot be recovered from symbols, which is precisely what makes them the right content.

### 1.1 The cost of dual-coding, stated honestly

Dual-coding was chosen for good reasons — it preserves the PRD §5.2 Layer-3 accessibility mirror at
parity (`plainViewEquals`), it keeps the gadgets testable without mocking Web Audio, and it does not
strand a deaf or hard-of-hearing child in the one room built on sound. But it **weakens the swap test**,
because a visual representation is a symbolic representation, and symbols can be manipulated without
hearing anything.

If the visual channel shows **numbers** — semitone counts, interval sizes, frequency ratios — then the
puzzle *is* arithmetic in that channel, and we have rebuilt the `math` cabin with a piano on the wall.

**So this is the binding rule of the whole design, and it is cheap to hold:**

> **R1 — The visual channel is musical notation, never numeric.** Pitch renders as vertical position.
> Duration renders as horizontal extent. Simultaneity renders as vertical stacking. **No gadget in this
> room ever displays a number, an interval name, a note name, or a ratio as part of its solvable state.**

A piano-roll contour is musical content: replace it with arbitrary symbols and the task dies, because
"higher" and "lower" and "longer" stop meaning anything. A column of semitone integers is not. R1 is what
keeps both channels inside the domain, and it is checkable by a test that greps the rendered output.

---

## 2. The gadget roster

Four gadgets, four distinct musical constructs, density-matched to `logic-games`' four.

| id | Name | Construct | Slice order |
|---|---|---|---|
| `tune-repair` | Tune Repair | melodic expectation | **1 — build first** |
| `downbeat` | Downbeat | metrical inference | 2 |
| `chord-fit` | Chord Fit | harmonic function / consonance | 3 |
| `echo` | Echo | aural imitation | 4 |

### 2.1 `tune-repair` — Tune Repair *(the slice)*

A short phrase plays. One note is wrong. Click it, then drag it to where it belongs.

**Why this is the first one to build.** It has a unique right answer, it generates cleanly from a seed, it
dual-codes without either channel becoming trivial, and it carries the fewest confounds of the four.

**What "wrong" must mean, and this is the whole design of the gadget.** The naive version makes the wrong
note the one *outside the scale*. Do not build that: "find the element not in the permitted set" is a
set-membership check, which is deduction, which is `logic-games`. Instead the wrong note is **inside the
scale and wrong for the phrase** — it breaks the phrase's own melodic logic. Generate phrases with a
strong internal shape (a stepwise ascent, a sequence repeated a step higher, an arch that turns once) and
then displace exactly one note so the shape breaks while every pitch stays diatonic.

That distinction is the difference between a music gadget and a logic gadget in the same wrapper, and it
is the single most likely thing to be quietly lost in implementation.

**Swap test.** Replace pitches with arbitrary symbols and both the audible wrongness and the visual
contour vanish; nothing marks any element as the broken one. **Passes.**

**Deliberately not using famous tunes.** "Find the wrong note in *Twinkle Twinkle*" measures whether the
child knows the tune, which is a cultural-familiarity confound and would make the score partly a proxy
for musical background. Generated phrases with internal logic are solvable from the phrase itself.

### 2.2 `downbeat` — Downbeat

A rhythm loops with no accents. Place the barlines where the bar restarts.

**Construct:** metrical inference — hearing where time re-anchors. Distinct from the other three (which
are all pitch or memory), and distinct from `math` provided it is framed as *where does it feel like it
starts again*, not *what factors of twelve are these*. Generate rhythms whose grouping is genuinely
perceptible (a longer note or a rest at the group boundary) rather than ambiguous.

**Swap test.** Metrical feel is temporal and heard; the visual dual-code is a horizontal strip where
duration is length, so the grouping is still perceptible visually as spacing. Symbols destroy both.
**Passes**, though less strongly than `tune-repair` — a visual strip of durations can be grouped by eye
fairly mechanically. Flagged.

### 2.3 `chord-fit` — Chord Fit

A melody note sounds. Three chords are offered. Choose the one that supports it.

**Construct:** harmonic function and consonance. Consonance is a property of frequency relationships *as
heard*; it has no symbolic residue. The visual dual-code stacks the notes vertically so interval spacing
is visible (R1: as spacing, never as an interval name).

**Swap test.** Passes. **Caveat worth recording:** with three options this is the closest thing in the
roster to multiple choice, which is the shape memo 06 §2.1 warns about. It survives because the options
are *sounds the child plays and compares*, not labels they read — but if implementation ever renders the
three chords as text names, it becomes a quiz and must be cut.

### 2.4 `echo` — Echo

A phrase plays. Play it back.

**Construct:** aural imitation, the most canonically musical act in the roster and the only gadget here
that **cannot exist silently**. Strongest swap test of the four.

**Why it is last.** Two real problems:

1. **It loads on auditory working memory**, which is a construct confound of exactly the kind memo 06
   §2.4 flags for executive function. Interest and memory span would be entangled in the signal.
2. **Dual-coding is awkward.** Showing the target makes it trivial. The resolution is that the visual
   channel is a **"show me" mode** the child can open at any time — always available, never gated — and
   opening it is *recorded as choosing the easier variant*, which is signal rather than cheating. That
   inverts cleanly against `chosen_challenge`. It is a good design, but it is more design than the other
   three need, which is why it is fourth.

### 2.5 Rejected: `transpose`

Move a phrase to start on a different note, preserving its shape. Cut deliberately, and recorded here so
it is not re-proposed as an obvious omission: the mechanic is **"add k to every element"**, which is
arithmetic, which is the `math` cabin. Interval invariance is a real musical idea, but this particular
operationalisation of it is a fractions puzzle with a treble clef.

Three gadgets would have been a defensible roster; padding to four with `transpose` would not.

---

## 3. Audio design

**No audio files. Ever.** `src/shelf/types.ts` states offline is a hard requirement — "no `fetch`, no
image URL, and nothing that degrades when the network is gone" — and the shelf's diagrams are inline SVG
for exactly that reason. Sampled audio would be the first asset in this app to break that. Every sound is
**synthesized at runtime with the Web Audio API**, which costs zero bytes and works on a plane.

- **One shared `AudioContext`**, created lazily on the first user gesture and reused. Browsers suspend
  contexts created without a gesture; the child clicking a prop to open the gadget *is* that gesture, so
  the natural flow satisfies it. Resume defensively anyway.
- **Voicing:** a small additive/FM voice with a short attack and a soft decay. Not a raw sine (thin and
  hard to pitch-match) and not a sawtooth (harsh). Two or three partials is enough to sound like an
  instrument.
- **Equal-temperament pitch from a note index**, A4 = 440 Hz. The conversion lives in one tested pure
  function; nothing else computes frequencies.
- **Nothing autoplays.** Every sound is the result of a click, including the phrase playback.
- **A mute control, persisted**, and audio is never required to progress. This is the same posture as
  `prefers-reduced-motion` elsewhere in the app, and it is what makes R1's visual channel load-bearing
  rather than decorative.
- **No sound is a reward.** No fanfare on success, no buzzer on error (PRD §11, GC6, memo 06 D7). A
  correct answer is confirmed by the phrase simply playing correctly — which is intrinsic to the task and
  is the whole point of the room.

### 3.1 Testability

All musical logic (pitch conversion, phrase generation, break-detection, grouping, chord construction,
answer checking) is **pure and lives outside the component**, matching the existing
`generate.ts` / `logic.ts` / `naive.ts` pattern in `src/puzzles/*`. Web Audio is confined to one thin
`audio/` module behind a narrow interface, stubbed in tests. jsdom never needs an `AudioContext`.

The generators get the same treatment the existing puzzles get: a `naive.ts` reference solver and a test
that the generated instance has exactly one solution (see `BalanceScale/naive.test.ts`,
`GearTrain/naive.test.ts`, `RatioMixing/naive.test.ts` for the established shape).

---

## 4. Art

The binding constraint, and the reason this is a design decision rather than a config change. The
registry's own comment says it: *"Step 3 is the reason this is a decision and not a toggle: the art is
the constraint."*

### 4.1 The map — regenerate

`src/map/cabins.data.ts` documents that `/art/map.png` is composed *for the current split*: two large,
warmly-lit near cabins for the playable topics, and three "small, mist-washed cabins strung along the
horizon" for the coming-soon ones. `music` sits at `yPct: 26` on one of the distant ones.

Promoting `music` while leaving that art in place would ship a topic whose **choice affordance is
visibly worse than its competitors'**. That is not a polish issue. It is the Javora confound, which the
surface-owner ruling named as one of the two rules the game does not currently satisfy: *"the choice
moment is a painting and not a topic label, which is the Javora confound in its most direct form."*
Javora et al. (2019): children chose the prettier version of the *same* game 62% of the time (d > 0.86)
and learned no more. A misty distant cabin against two warm near ones would bias topic choice by art,
and topic choice is the primary signal.

**Plan.** Regenerate `/art/map.png` with **three** warmly-lit near cabins (puzzle den, clockmaker's
workshop, and a music room) plus **two** horizon cabins for `code` and `art`. Then re-tune all five
`xPct`/`yPct` values, remembering the conversion the file documents: the art is square, rendered
`object-fit: cover` in a 16:9 frame, so `yPct` 0–100 maps to image y 21.9%–78.1%.

Generated through the TrueFoundry gateway already used by `scripts/gen-art.mjs`. **The existing
`map.png` is kept until the replacement is approved** — new art can come back worse, and this is the
riskiest item in the document (§8).

### 4.2 The cabin interior — one painting, four surfaces

`cabin-backdrop-music.png`, in the same style, framing and light as the two existing backdrops, with
**four** paintable prop surfaces: an instrument for `tune-repair`, something percussive for `downbeat`,
a keyboard for `chord-fit`, something to sing/play back into for `echo`. Plus a bookshelf surface for the
shelf (§5.2).

**Why four surfaces when only one gadget ships.** `quads.data.test.ts` asserts the room *"covers every
gadget in the topic exactly once, **with no props for absent gadgets**"* — the match is exact in both
directions, so painting one surface now would force a full repaint per gadget added. The `Gadget` type
already carries `status: "active" | "coming-soon"` with an optional `Puzzle`, and `CabinStatic.tsx`
renders coming-soon hotspots dimmed. So: **register all four, paint all four once, ship `tune-repair`
active and the other three `coming-soon`.** One art pass instead of four.

**This makes the roster irreversible at the art pass, which sets the ordering.** Because the quad test
forbids props for absent gadgets, a surface painted for a gadget that later gets cut breaks the build
until the room is repainted. So **§8.3's decision on `downbeat` — and §8.4's on `echo` — must be settled
before PR 2 (the room), not during it.** PR 1 (audio + `tune-repair` logic) does not depend on the roster
and can proceed while that is resolved. If either gadget is cut, the painting is briefed for three
surfaces instead of four and §4.3's density claim becomes 3 / 4 / 5 rather than 4 / 5 / 4.

**The cost, acknowledged.** PROJECT.md warns that visible-but-empty is not free. Memo 06 **D5** ("never
trigger a domain we cannot maintain") is the real version of that worry, and it binds *topics*, not props
inside a room. A dimmed drum in a room whose instrument works does not raise-and-abandon the music
*domain* — the domain is live and maintained. It is the same trade the map already makes for `code` and
`art`, and it is milder.

### 4.3 Equal polish is a measurement requirement

PRD §5.3 and memo 06 C8. The music room must match the other two on style, framing, light, prop count
and legibility, because uneven art means the topic ranking inherits the production schedule rather than
the child's interest. Four props matches `logic-games`' four.

---

## 5. The rest of the room

### 5.1 Teaching — non-negotiable

PROJECT.md attaches a binding condition to the 9–12 gifted framing: high difficulty is wanted, but
**every activity is explained**, and "difficulty is not allowed to become a reading-the-mind-of-the-designer
test." So each gadget gets a `TeachIn` entry following `src/teachin/rules.tsx`.

Music raises the stakes here, because the room assumes vocabulary the other two do not: *higher*,
*step*, *the tune starting again*. The teach-in must establish the relation in the child's ear and eye
before the first puzzle, not name it. Per memo 07 D6, demonstration beats instruction at this age band's
lower edge and interactive tutorials underperformed plain animation — so teach by playing two sounds and
showing the contour, not by defining "interval".

### 5.2 The shelf

A `MUSIC_DECK` in `src/shelf/cards.data.ts`: 3–6 cards, exactly one `invitation`, one `activity` card per
active gadget, each with two paragraphs pitched at 9–12 and "not written down to them", and **a real
source that was actually fetched and read** — the file's own standard, because "a card citing something
that does not exist is worse than a card with no link: it teaches a child that citations are decoration."
A diagram in `diagrams.tsx` where one earns its space; contour is a good candidate.

Note the correction the ruling records: **the shelf and the curated library are not the same store.** The
shelf reads hand-authored `cards.data.ts` and nothing in the app calls `curatedForCell`. So the music
cards are new writing, not a query.

### 5.3 Signals

Per memo 06 §8.5 and the ruling's second unsatisfied rule (*"the backdrop backend's props and bookshelf
emit nothing at all today"*):

- **Choice events with the offered set recorded** — which prop was clicked, and which others were on
  screen and not clicked. Choice is only interpretable against what was declined.
- **`SurfacedRecord.position`** — the ruling notes this "applies to a map as much as to a list." Prop
  position in the room should be carried so ordering/placement bias can be separated from preference.
- **No duration in any belief-bearing term.** `activeMs` is a validity gate only (memo 06 §8.6).
- **`chosen_challenge`** when a harder variant is taken; `echo`'s "show me" mode is the inverse signal.
- **Zero rewards**, enforced by the existing guardrails.

This slice should emit for its own prop and not attempt the general crosswalk — that work is already
designed on `dev/mvp-jul24/backend-wiring-plan`, which the ruling says "stops conflicting with this
decision and becomes the path through it." **Coordinate rather than duplicate** (§8).

---

## 6. Change surface

New files:
- `src/puzzles/TuneRepair/` — `TuneRepair.tsx`, `logic.ts`, `generate.ts`, `naive.ts`, `harness.tsx`, tests
- `src/audio/` — context, voice, pitch conversion, tests
- `src/cabin/backdrop/previews/TuneRepairPreview.tsx`
- `public/art/cabin-backdrop-music.png`

Edited:
- `src/gadgets/registry.ts` — four music entries
- `src/map/cabins.data.ts` — `music.active: true`, plus all five nodes re-tuned to the new map art
- `src/cabin/backdrop/quads.data.ts` — a `MUSIC` room, four prop quads + shelf
- `src/cabin/hotspots.ts` — `STATIC_POSITIONS` for the four
- `src/shelf/cards.data.ts` + `diagrams.tsx` — the music deck
- `src/teachin/rules.tsx` — teach-in for `tune-repair`
- `public/art/map.png` — regenerated
- `PROJECT.md` — the third cabin, the roster, and why `transpose` was cut

**This will exceed the ~400-line PR guideline** if it lands as one PR. Proposed split:

1. **Audio + Tune Repair logic** — pure functions and tests, no UI, no art. Self-contained and reviewable.
2. **The room** — art, quads, hotspots, registry, map promotion, previews.
3. **Teach-in + shelf** — the writing, with real sources.

Order matters: 1 is the part most likely to need rework and has no dependency on art.

---

## 7. Out of scope

- The other three gadgets (registered `coming-soon`, painted, not implemented).
- The general gadget-to-taxonomy crosswalk — `dev/mvp-jul24/backend-wiring-plan`.
- `code` and `art` cabins.
- Any change to how the shelf sources content (`curatedForCell` stays uncalled here).
- The leave/stay question the ruling deliberately left open.

---

## 8. Risks and open questions

1. **The map regeneration is the biggest risk.** Generated art may come back worse than the current
   composition, which is good and deliberately built for the two-cabin split. Mitigation: keep `map.png`,
   generate candidates, and get sign-off before replacing. If nothing good comes back, the fallback is
   §"ship it on the horizon and record the confound" — worse, but honest, and reversible.
2. **Four other worktrees are live on `mvp-jul24`** (`subgames`, `math-room-2`, `backend-wiring-plan`,
   `p0-event-emission`). `registry.ts`, `cabins.data.ts` and `quads.data.ts` are exactly the shared files
   they are most likely to touch, and AGENTS.md prefers a new file over editing a shared one. **This
   needs a human to confirm nobody else is mid-flight on the registry before implementation starts.**
3. **`downbeat`'s swap test is the roster's weakest** (§2.2) — a visual duration strip can be grouped
   fairly mechanically by eye. If it does not firm up during design, cut it to three gadgets rather than
   ship a pattern puzzle in a music room.
4. **`echo` entangles interest with auditory working memory.** May need to stay unbuilt.
5. **Density becomes 4 / 5 / 4 across three rooms** — fine, and no worse than today. Cross-cabin
   comparison remains invalid for the reasons PROJECT.md's Risks section already gives; this does not
   improve that and should not be claimed to.
6. **Age band.** This app targets **9–12**; memo 07 and the discovery-surface doc are evidenced at
   **6–8**. The ruling flags this directly: *"the age bands do not line up."* Where this design leans on
   memo 07 it uses the structural claims (dual-coding for accessibility, demonstrate-don't-instruct,
   marker-must-not-move-the-target), not the age-bounded figures. **Memo 07's §2.7 app audit applied a
   6–8 bar to this 9–12 app and needs correcting; that is a separate fix on
   `dev/research/child-facing-ux-6-8`, noted here so it is not lost.**
7. **No evidence was gathered for this document.** It is a design derived from constraints already in the
   repo plus general musical structure. The gadget constructs are argued, not validated — in particular
   nobody has checked that `tune-repair`'s "diatonic but shape-breaking" wrong note is reliably
   perceptible to a 9-year-old. That is a playtest, and it is the cheapest thing that would de-risk the
   whole roster.

   **Update, same day: the first playtest happened, and it said "this is really hard."** One adult, one
   session, so treat it as a signal and not a measurement — but it points the right way, because an
   adult struggling means a 9-year-old struggles more. Three causes were identified and two were fixed:

   - **The easiest tier was a coin flip between a run and an arch.** An arch demands working out where
     the turn is *before* the puzzle's own question can be asked. Fixed: a new **tier 0 is runs only**,
     six notes, single steps, a two-degree displacement, at **76 bpm** instead of 108. The old tiers
     became 1 and 2, and `tierForIndex` now cycles all three starting from the easiest.
   - **Checking your own move cost a second click.** The child had to carry the phrase in their ear
     across pressing Play again. Fixed: placing a note **replays the whole phrase immediately**. It is
     not autoplay (it follows a click) and not a reward (it replays after a wrong move too).
   - **Not fixed, and the real remaining gap: you never hear what "right" sounds like.** Ear-training
     normally gives a reference. Here the child must infer the intended shape *and* locate the
     deviation — two inferences. Every fix above reduces the first; none removes it. If tier 0 is still
     too hard, that is the next thing to change, and it needs a design decision rather than a parameter,
     because the obvious version (play the correct phrase first) gives away the answer.

   Worth recording that **the easier tier did not cost construct validity**: measured over 500 seeds,
   tier 0 puts the wrong note *inside* the phrase's own pitch range **100%** of the time, so it is still
   not solvable by scanning for the extreme note. The easiness comes from shape predictability and
   tempo, which are musical levers, rather than from reinstating the spot-the-outlier shortcut.

   And a note on difficulty as a *product* question rather than a tuning one: `PuzzleProps.tier` already
   exists for "the child asked for an easier/harder one", and `chosen_challenge` is already a designed
   signal in memo 06 §8.5. So *offering* the choice is in-model, and which way a child takes it is
   evidence rather than a settings screen. `TuneRepair` now reads `tier`, so a registry entry for it must
   set `supportsTier: true`.
