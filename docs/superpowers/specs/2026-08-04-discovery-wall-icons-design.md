# Discovery Wall icon redesign — design spec

**Date:** 2026-08-04
**Surface:** `passion/apps/discovery/` (the child-facing Discovery Wall, ages 9–12)
**Status:** design approved; implementation plan to follow.

## Problem

The 44 pursuit tiles on the Discovery Wall currently use AI-generated 3D object renders
(`public/pursuits/*.webp`): dark, moody, deliberately uniform, and — by the design's own
admission — sometimes ambiguous ("two are telescopes, two are small machines"). They were made
dark and uniform on purpose, to stop the app from measuring *which picture is prettiest* instead of
*what a child is interested in* (Javora et al.: 9–11-year-olds pick the prettier of two identical
options 62% of the time). That measurement goal is sound. The visuals are not child-friendly, are
AI art, and several are unreadable.

## Goal

Replace all 44 icons with **bright, clear, playful, bespoke flat-SVG icons** that a 9–12-year-old
reads instantly — while **keeping** the measurement constraint that no tile may out-shine another.
No AI-generated art.

## Decisions (locked with the operator)

1. **Keep the equal-brightness/equal-polish constraint** — work within it, don't drop it.
2. **Bespoke flat SVG** — hand-authored vector, not an icon library, not AI renders.
3. **Style: "Bold Sticker"** — thick navy outlines, flat bright fills, rounded, instantly legible.
4. **Integration: serve SVG directly + palette-lock by construction**, and replace the luminance
   CI guard with a palette-conformance + color-energy guard.
5. Cabins are no longer a wall organizing device — **each icon stands on its own**; it does not
   depend on a cabin hue. (The cabin filter/logic elsewhere is left untouched.)

## The locked style ("gold master" rules)

Every icon obeys one recipe, so none can out-shine another:

- **Canvas:** `viewBox="0 0 240 240"`; subject centered within the middle ~70%; transparent
  background (the tile card provides the background, not the SVG).
- **Outline:** a single navy stroke color `#002a3a`, one fixed weight (~9 units on the 240 canvas),
  rounded caps and joins, on every icon. Constant ink weight is what keeps "loudness" uniform.
- **Fills:** flat only — no gradients, no 3D shading, no texture, no photorealism. Colors come only
  from the locked fill palette below.
- **One subject**, instantly legible to a 9–12-year-old. Legibility beats detail. This is the rule
  the old telescope/telescope ambiguity broke; the per-pursuit subject map (below) fixes the
  metaphor so it is decided once, not per-drawer.
- Living subjects may carry a simple friendly feature (e.g. an eye) consistent with the sticker
  style; no hand-wobble or crayon texture (that was style C, not chosen).

## Equal brightness *by construction*

We make variance structurally impossible rather than measuring it away after the fact:

- **One uniform tile card** for all 44 (warm white, e.g. `#ffffff` on the `#fcf4ef` wall), so the
  background stops being a per-tile variable.
- **Locked fill palette in OKLCH at constant lightness and constant chroma** — the same device the
  cabins already use (`L ≈ 70%`, `C ≈ 0.13`), rotating only the hue. ~8–10 bright fills (coral,
  teal, sunny, leaf, blue, gold, plum, sky…) that are all *perceptually equally bright and equally
  vivid*. Each icon uses 2–3 fills + the navy stroke + off-white highlights.
- **Coverage band:** each subject fills roughly the same fraction of the canvas.

Constant stroke + constant-lightness/chroma fills + constant card + banded coverage ⇒ every tile is
structurally equal in visual "pop." Cheerful, but fair.

The exact OKLCH token values (hues + the fixed L/C) are produced in implementation and committed as
a shared palette module the icons and the guard both read, so they cannot disagree.

## The new CI guard (replaces the luminance test)

`test/art.test.ts`'s mean-luminance check was built for dark objects on a dark ground; on bright
icons over a white card the card dominates the mean and the check passes trivially while no longer
catching the confound. The confound for flat bright art is **color energy** (saturation × ink
coverage), not luminance. So the guard becomes:

- **Palette-conformance (static, the strong guarantee):** parse each SVG; assert every `fill` and
  `stroke` value is a token from the locked palette, and the stroke width matches the locked weight.
  Non-conforming color is impossible to merge.
- **Color-energy band (rasterized backstop):** render each icon on the standard card, compute mean
  chroma × coverage per icon, require `max / min` within a tight band.
- **Ported checks:** completeness (one SVG per pursuit), no orphans, per-file size ceiling — all
  retargeted from `.webp` to `.svg`.

## Integration surface

- `app/model.ts` → `artFor(p)` returns `/pursuits/${p.id}.svg`.
- `app/browse.css` → tile art box changes from dark `#1c1510` to the warm-white card.
- `public/pursuits/<id>.svg` × 44 added; old `public/pursuits/<id>.webp` removed.
- `scripts/build-art.mjs` (the AI-render normalizer) is retired/archived — it is no longer part of
  the pipeline. `scripts/imagemagick.mjs` is retained only if the rasterized energy check needs it.
- `test/art.test.ts` rewritten per the guard above.

**CODEOWNERS note:** `model.ts`, `browse.css`, and `art.test.ts` are shared files, so this is not
purely additive. Confirm lane ownership before editing and prefer new files (e.g. a new palette
module, a new guard helper) where possible.

## Per-pursuit subject map

The metaphor for each of the 44 pursuits is fixed here so parallel drawers cannot diverge on *what*
to draw. (Exact list finalized against `packages/pursuits/src/catalogue.ts` during planning; the
ambiguity-prone ones are pinned explicitly.)

Pinned examples: `asteroid-hunting` → telescope on a tripod with a streaking rock; `speedcubing` →
a cube caught mid-turn; `variable-stars` → a star with a small brightness graph; `ctf` (Hacking
Puzzles) → a padlock with a flag; `assistive-design` → a hand + a helpful gadget; `amateur-radio` →
a radio with an antenna wave; `food-preservation` → a sealed mason jar. The full 44-row table lives
in the implementation plan.

## Production plan (parallelized)

1. Refine the 4 approved Style-A samples (chess, piano, birding, robotics) into **gold-master
   references**; commit the palette tokens + the spec extract the drawers read.
2. **Fan out ~44 icons** across ~8–10 parallel subagents, each handed the style rules + palette +
   gold masters + its slice of the subject map. Each writes `public/pursuits/<id>.svg`.
3. **QA / normalize pass:** an agent rasterizes all 44, runs the color-energy + palette-conformance
   checks, compares against the gold master, and fixes drift.
4. Wire into the app (`artFor` → `.svg`, `browse.css` card), rewrite the guard test, remove the old
   `.webp` set, archive `build-art.mjs`.
5. Run `pnpm lint` / `pnpm typecheck` / `pnpm test`; screenshot the real wall to eyeball uniformity;
   open a PR as `spinkicks`/operator with `Closes #<id>`.

## Success criteria

- All 44 pursuits have a bespoke flat-SVG icon; no AI art; no `.webp` tiles remain.
- Every icon is instantly legible to a 9–12-year-old (no ambiguous pairs).
- The palette-conformance guard passes and the color-energy spread is within the locked band.
- The wall renders bright and cheerful on the warm-white cards; no single tile visibly pops.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` all green; the discovery app builds.

## Non-goals

- No change to the wall's layout, ordering/shuffle, age filter, detail panel, or cabin filter logic.
- No change to the catalogue of 44 pursuits itself.
- Not adopting a third-party icon set.
