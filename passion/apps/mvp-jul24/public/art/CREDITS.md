# Art credits

All images here are AI-generated placeholder art, produced via the TrueFoundry
image gateway (`https://tfy.promptlens.trilogy.com`). They are for prototyping
and demo purposes; replace with commissioned or licensed art before production.

## `map.png` and `map-v2.png`

World maps. Text-to-image, `gpt-image-1.5`, via `scripts/gen-art.mjs map` and
`scripts/gen-art.mjs map-v2`.

**`map-v2.png` is the one the app loads**, since 2026-07-27: it paints three
equally-lit near cabins where `map.png` paints two, and it was generated because
promoting `music` to a playable cabin while leaving it small and mist-washed on
the horizon would have biased topic choice by paint. `map.png` is deliberately
kept rather than overwritten — generated art can come back worse, and this way
reverting is one `src` and five coordinate pairs. See `src/map/cabins.data.ts`.

## `cabin-backdrop-music.png` — the Music cabin backdrop

Text-to-image in **one pass**, `gpt-image-1.5`, via `scripts/gen-art.mjs
cabin-backdrop-music`. The only backdrop this repo can regenerate from a fresh
checkout, and the only one that needs no `gen-cabins.mjs` prop surgery: nothing
in the room is a combinatorial board, so there is no layout for a diffusion
model to get wrong. A lute, a pump organ, a hand drum and a bookcase are just
objects, and the prompt's job is only to keep them separated enough to trace.

Regenerated once after the first attempt came back with no bookcase, which a
room with three activities and no explainer shelf needed.

Its predecessor `cabin-music.png` (same image, legacy `CabinStatic` filename,
added in #215 before the room existed) was deleted when this file landed rather
than kept as a byte-identical 3.2 MB duplicate.

## `cabin-backdrop-logic-games.png` — the Logic Games cabin backdrop

Built by `scripts/gen-cabins.mjs cabin-logic-games`, which does **not** generate
a room. It starts from the approved concept still `shots/concept/concept-logic.png`
(text-to-image, `gpt-image-2`) and edits only the prop regions. Every pixel
outside those regions is copied byte-for-byte from the still — measured at
100.0000% identical over the 1,435,261 pixels outside them.

Three flat puzzle boards were re-painted. The still's own versions were wrong in
the way diffusion models are always wrong about combinatorial structure: its
"Pipes" board was a set of disconnected, off-grid segments with no source or
sink, and its "Nonogram" carried invented numerals down two edges. Three stages
fix that without letting a model near the layout:

1. **Exact render.** The app's own puzzle components export each board as a
   reference PNG. Correct by construction. This is a *spec* — deliberately flat
   and maximum-contrast so every mark is separable — and never the final pixels.
2. **Stylize.** The spec is handed to the image model as its input and repainted
   as a real physical object: a hand-made wooden puzzle board with paper grain,
   hand-inked grid lines, painted walnut tiles, glowing copper against dull iron,
   brass-bezelled mirrors, warm dusk cabin light. The prompt fixes the layout as
   inviolable. Skipping this stage is what made the first attempt read as a
   screenshot taped inside a picture frame.
3. **Verify, then warp.** The repaint is checked against the spec before it goes
   anywhere — for the nonogram by sampling every one of the 100 cells and
   comparing to the known fill map (`scripts/art-inspect.mjs cells`), which the
   `game-board-images` skill's own notes recommend over a vision read for fine
   geometric detail. Only then is the board's face fitted onto the frame's inner
   quad with a homography and matched into the plate: level and colour from the
   pixels it replaces, the room's light direction fitted from the wall around the
   frame, the frame's rabbet shadow, and film grain.

Two openings are portrait while the puzzle generators are square-only, so those
boards genuinely sit in their frames the way a square print sits in a portrait
frame — with a mount above and below, painted as a mount with the board's edge
shadow falling across it.

The chess set is the concept still's own, untouched. It is a 3D object at a very
shallow angle, so a homography would flatten it; it was audited instead with the
`game-board-images` skill's `verify` and read back as an 8x8 board with two
distinguishable armies on squares.

## `cabin-backdrop-math.png`

Currently the approved concept still `shots/concept/concept-math.png`, byte for
byte. Its props (gear train, pan balance, vial rack) are a later pass;
`scripts/gen-cabins.mjs cabin-math` holds their definitions.

## `cabin-logic-games.png`, `cabin-math.png` — legacy

First-pass whole-room text-to-image art (`gpt-image-1.5`, `scripts/gen-art.mjs`),
1024x1024, still referenced by `src/cabin/CabinStatic.tsx` — which is itself
parked and unreachable (PROJECT.md, "The backend fork is closed"). Superseded for
the backdrop path by the `cabin-backdrop-*.png` files above. There is no
`cabin-music.png`, so `CabinStatic topic="music"` falls back to its own warm
wash; the image is decorative there and a 404 is a supported state.

## Inputs not in this repo

Every image here needs a gateway key in `ANTHROPIC_CUSTOM_HEADERS` to regenerate,
which is not committed and never will be. Beyond that, the two `gen-cabins.mjs`
backdrops need local inputs the repo does not carry: `shots/` is gitignored and
the rendered puzzle references live outside the repo entirely, so those two
finished PNGs are committed but cannot be re-derived from a fresh checkout
without both:

- `shots/concept/concept-logic.png`, `shots/concept/concept-math.png`
- the reference boards, located by `GEN_CABINS_REFS` (see `gen-cabins.mjs`)

The `gen-art.mjs` targets — the maps and `cabin-backdrop-music.png` — need no
such inputs: prompt in, image out.
