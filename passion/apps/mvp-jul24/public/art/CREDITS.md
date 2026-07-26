# Art credits

All images here are AI-generated placeholder art, produced via the TrueFoundry
image gateway (`https://tfy.promptlens.trilogy.com`). They are for prototyping
and demo purposes; replace with commissioned or licensed art before production.

## `map.png`

World map. Text-to-image, `gpt-image-1.5`, via `scripts/gen-art.mjs map`.

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
still loaded by `src/cabin/CabinStatic.tsx`. Superseded for the backdrop path by
the `cabin-backdrop-*.png` files above.

## Inputs not in this repo

`shots/` is gitignored, and the rendered puzzle references live outside the repo
entirely, so the finished PNGs are committed but cannot be re-derived from a
fresh checkout without both:

- `shots/concept/concept-logic.png`, `shots/concept/concept-math.png`
- the reference boards, located by `GEN_CABINS_REFS` (see `gen-cabins.mjs`)
