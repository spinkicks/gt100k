"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * The tile's shape. Must match `.tile__art`'s `aspect-ratio` in `browse.css`.
 *
 * Kept here rather than read back from the DOM because the search runs before the tiles have their
 * final size, so reading them would measure the layout it is trying to produce.
 */
const ART_ASPECT = 3 / 2;
const GAP_PX = 5;

/** Horizontal padding inside the label overlay, in px, matching `.tile__label`. */
const LABEL_PAD_X = 16;

/**
 * The label's font size at a given tile width, in px.
 *
 * The wall's names have to survive at every tile size the search can produce, and at the smallest
 * of them a fixed size does not: "Watching Stars Change" needs a third line at 97px and gets
 * clipped mid-word by the two-line scrim. Truncation is not an option — a child cannot choose a
 * thing whose name is cut off — so the type scales with the tile.
 *
 * The divisor is the width budget in ems: the longest line the catalogue produces after wrapping
 * is "Stars Change" at twelve characters, and a 600-weight sans averages about 0.6em per character,
 * so twelve characters need 7.2em. The upper clamp is where the label stops growing because it is
 * already comfortable; the lower is where it would stop being readable, and the search refuses tiles
 * that small anyway.
 *
 * IT NO LONGER AFFECTS THE FIT, since the name overlays the picture rather than sitting under it —
 * the tile is exactly its art now. It stays owned here anyway because it is derived from `tileW`,
 * which only this hook knows, and a copy of the arithmetic in a stylesheet would be a copy that
 * could drift.
 */
function labelFont(tileW: number, rem: number): number {
  return Math.min(0.9 * rem, Math.max(0.65 * rem, (tileW - LABEL_PAD_X) / 7.2));
}

/**
 * Below this a tile stops showing an object and starts showing a brown smudge.
 *
 * Judged by rendering the set at decreasing widths, not derived from anything. It is the point at
 * which the search gives up and lets the grid scroll, so it is the honest boundary of the claim
 * that the whole catalogue is on one screen.
 */
const MIN_TILE_PX = 96;

/**
 * And the ceiling, which the renders set.
 *
 * They are 480px wide, so 240 is the widest tile that is still pixel-exact on a 2x display. Without
 * a cap the search does the arithmetic it was asked to and hands a single-pursuit filter one tile
 * 1044px across, upscaled four times and looking nothing like the wall it belongs to. Slack above
 * the cap is centred rather than spent.
 */
const MAX_TILE_PX = 240;

/**
 * The largest a tile can be at this column count, or 0 if it would be too small to read.
 *
 * Width and height each cap it and the smaller cap wins, which is the part that `1fr` columns
 * cannot express. At eight columns on a 1440 laptop the width allows 126px and the six rows that
 * implies allow 124px, so the tiles are 124px and two pixels per column go unused. At nine columns
 * the width allows 111px and the five rows allow 164px, so they are 111px and a third of the
 * vertical space goes unused. Stretching to the full width would have taken the second of those.
 */
function largestTile(cols: number, count: number, w: number, h: number): number {
  const rows = Math.ceil(count / cols);
  const byWidth = (w - (cols - 1) * GAP_PX) / cols;
  // No label row to subtract any more: the name overlays the picture, so a tile IS its art and the
  // row height is exactly `tileW / ART_ASPECT`. That reclaims roughly 30px per row, which on a
  // laptop is a whole extra row's worth of size spread across the wall.
  const byHeight = ((h - (rows - 1) * GAP_PX) / rows) * ART_ASPECT;
  const tile = Math.min(byWidth, byHeight, MAX_TILE_PX);
  return tile >= MIN_TILE_PX ? tile : 0;
}

/**
 * How many columns show every tile at once, as large as possible.
 *
 * `grid-template-columns: auto-fill` cannot answer this. It reads the width and nothing else, so it
 * overflowed the fold on a 1440x900 laptop and produced twelve columns of tall thin tiles on a
 * wide monitor — and a tall thin box cropping a landscape render throws away the object's ends.
 * Packing a known number of fixed-aspect boxes into a known box is a two-dimensional question, so
 * it is answered here and handed to CSS as `--cols`.
 *
 * The search is exhaustive rather than analytic because the objective is not monotonic in the
 * column count: fewer columns are wider but need more rows, and which of those binds flips back and
 * forth. Forty-four iterations of arithmetic, once per resize.
 *
 * If nothing fits, the viewport is genuinely too small for the catalogue; it packs the tiles at
 * their minimum and the grid scrolls, which `browse.css` states rather than hides.
 *
 * Returns a ref for the grid and the three numbers CSS needs: how many columns, how wide a tile is,
 * and what size its label is set at.
 */
export interface Fit {
  cols: number;
  tileW: number;
  labelFontPx: number;
}

export function useFittedColumns(count: number): Fit & { ref: React.RefObject<HTMLUListElement> } {
  const ref = useRef<HTMLUListElement>(null);
  const [fit, setFit] = useState<Fit>({ cols: 7, tileW: MIN_TILE_PX, labelFontPx: 13 });

  const measure = useCallback(() => {
    const el = ref.current;
    if (el === null || count === 0) return;
    const style = getComputedStyle(el);
    const w =
      el.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
    const h =
      el.clientHeight -
      Number.parseFloat(style.paddingTop) -
      Number.parseFloat(style.paddingBottom);
    if (w <= 0 || h <= 0) return;

    // Read the root size rather than assuming 16px, so a reader who has enlarged their browser
    // font gets larger labels and correspondingly fewer, larger tiles instead of clipped names.
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    let best = { cols: 0, tileW: 0 };
    for (let c = 1; c <= count; c++) {
      const tile = largestTile(c, count, w, h);
      if (tile > best.tileW) best = { cols: c, tileW: tile };
    }
    if (best.cols === 0) {
      // Nothing fits. Pack at the minimum, which makes the scroll as short as it can be.
      const cols = Math.max(1, Math.floor((w + GAP_PX) / (MIN_TILE_PX + GAP_PX)));
      best = { cols, tileW: (w - (cols - 1) * GAP_PX) / cols };
    }
    setFit({ ...best, labelFontPx: labelFont(best.tileW, rem) });
  }, [count]);

  // Layout effect so the first paint is already correct; a visible reflow of the whole wall is
  // exactly the thing that makes it move under a child's hand. Re-runs when `measure` changes,
  // which is when the tile count does.
  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { ref, ...fit };
}
