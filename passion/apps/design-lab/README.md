# @gt100k/design-lab

The **prototype lab** — a Next.js scratch surface on `:3060` where a screen can be looked at full
size, on real data, before anyone commits to building it. It is deliberately **not a product
surface**: it is absent from the surfaces registry in `@gt100k/ui`, it renders no `ProductHeader`, and
no other app links to it. It reads the same design tokens as the real apps so what you see is what
they would look like, and nothing here is wired to an engine.

## Run

```bash
pnpm --filter @gt100k/design-lab dev     # local dev server on :3060
pnpm --filter @gt100k/design-lab build   # production build, into .next-build
pnpm --filter @gt100k/design-lab test    # the tile-art checks, below
```

A build writes to `.next-build` rather than `.next`, because this is the app most likely to be built
and browsed at the same moment and the two fighting over one directory produces a module-not-found
overlay that tells you nothing about the real cause.

No secrets and no env vars.

## What is in it

`/` is an index of the prototypes. Two are live.

**`/browse` — the discovery wall.** The child-facing surface: **all forty-four pursuits from
`@gt100k/pursuits` on one screen**, flat, each a picture over its name. Pointing at one names it in
the side panel, says a line about what you would be doing, names the venue that will judge the work,
and lists where to start from the curated library in `@gt100k/concierge`. The eight cabins are filter
chips along the top — a facet, never a step to walk through. Age is a hard filter and the footer says
how many pursuits it hid.

The shelf under each pursuit is that pursuit's own. It used to be its cabin's, because the library
was filed by taxonomy subtopic and the wall is a different partition of the same material, so all
eight music tiles returned one shelf and tapping Speaker Design gave you orchestral instruments.
Resources now carry a `pursuits` tag alongside their `domainPath`, and
`concierge/test/pursuit-coverage.test.ts` fails if any tile is empty or shares a shelf with another.

**`/browse/styles` — the tile art registers.** The same three subjects drawn minimal, flat and
rendered, **at the real tile size on the real ground**, which is the only way the question is
answerable. Rendered won and shipped.

## The wall is flat, and everything is on one screen

Both are load-bearing rather than stylistic, and both come from Hutchinson, Bederson & Druin's ICDL
studies — the closest thing to this product that has been run on children.

**Flat.** 36 children aged 6–11, a 14-category hierarchy against 44 flat concrete categories. The
flat version was faster in every grade, needed 116 hints against 221, and produced 224 exploratory
queries against 104. They had already tried narrowing the hierarchy to six top-level categories and
that failed too: the problem was never branching factor, it was abstraction. Which is also why the
wall shows *pursuits* and not the taxonomy — "board games" is a cell a belief can live in, not a
thing a child can picture doing.

**No pager, ever.** In the same study, of twelve first-graders, **zero** found the "More Choices"
control unaided. A pursuit a child never sees produces no signal, so anything behind a pager is not a
usability cost but a silent hole in the data. `useFittedColumns` therefore sizes the grid from both
dimensions rather than leaving it to `auto-fill`, which reads the width alone and overflowed the fold
on a 1440×900 laptop.

**Order is random per session; membership never changes.** Randomising decorrelates position from
preference, which is what makes the logged position a usable variable instead of a constant.
Rotating the *set* would be the trigger-and-abandon pattern, where children whose interest was
triggered and then not maintained finish below children never triggered at all.

## The art, and why it is uniform

Every tile carries a rendered object. That reverses a decision made a day earlier to ship a wall of
words, on the argument that 44 tiles are too small for rendered detail and that Magner et al. found
decorative illustration hinders learning. The second half was a misreading — the seductive-details
effect concerns pictures placed *beside* material a child is learning, and nothing is being learned
on a chooser — and the first half was simply wrong, which `/browse/styles` shows at size. The flat
interface that beat the hierarchy in every grade was itself a ring of **category icons**.

The real risk is Javora et al.: children aged 9–11 chose the prettier of two versions of identical
content 62% of the time and learned no more. On a wall that reads a click as interest, a tile that is
merely nicer than its neighbours gets recorded as a passion. So uniformity is enforced twice:

- **By construction.** One generation scaffold for all 44 — one object, one camera, one light, one
  palette, one dark ground, no people or hands. `scripts/build-art.mjs` carries the prompt.
- **By measurement.** The same script pulls every tile to the same mean luminance, closing the raw
  renders' **3.84:1** spread to **1.06:1**, and `test/art.test.ts` fails the build if that reopens
  past 1.1:1 or if any pursuit is missing its file. The cabin hue tints the label strip and never
  washes over the picture, because a colour over the art would put the brightness confound back.

Regenerating after a catalogue change:

```bash
pnpm --filter @gt100k/design-lab build-art ~/renders   # p-<pursuit-id>.png per pursuit
```

## There is a test script now

The earlier version of this file said there was not, and gave a reason: a prototype held in place by
tests stops being cheap to throw away. That still holds for layout and copy, and none of it is
tested. It does not hold for the tile art, which is 44 binary files that no compiler reads and no
reviewer diffs — a missing one is a hole in the wall and a bright one is a bias in the data, and both
are invisible in a pull request. So the suite checks exactly those two things and nothing else.

## This is not a console, and there is not one here any more

`/` used to be a static MUI console mockup with hardcoded fake children, built to choose the adult
design language by putting two candidates side by side at full width. MUI won
(`docs/decisions/2026-07-25-design-language.md`), the real console at `passion/apps/guide-console` was
restyled on top of that choice, and the mockup was **deleted**. A second console that no longer
matched the first was worse than no second console. Do not describe this app as a console or as a
design-system reference, and do not rebuild a mirror of a real surface here.

## Where this sits in an open question

The team is actively reconsidering whether the child-facing discovery surface should be the game in
`passion/apps/mvp-jul24` or a browsable catalogue of the kind prototyped here. Nothing in this app
settles that. The game's central property is an active generative task per topic, which a page of
links cannot have; the wall reaches all eight domains and every curated resource behind them, at the
cost of the in-app depth signals. The argument, including the ruling that currently stands and the
terms on which it could be revisited, is in `docs/decisions/2026-07-27-discovery-surface.md`.
