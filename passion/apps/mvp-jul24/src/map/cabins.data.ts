import type { TopicId } from "../game/types";

export interface CabinNode {
  id: TopicId;
  label: string;
  xPct: number;
  yPct: number;
  active: boolean;
  /**
   * Signpost accent colour (hex) — the per-cabin hue a later visual pass tints the node (and,
   * eventually, the cabin interior) with, so the five nodes read as five distinct places rather
   * than five copies of the same amber pill. Nothing consumes this yet.
   */
  accent: string;
  /**
   * Stable short id for the glyph shown on the signpost, resolved to actual artwork by the same
   * later visual pass. Kept as an id (not an SVG path or an import) so the data file stays free of
   * presentation and the ids can be reused by other surfaces (the readout, cabin signage).
   */
  emblem: string;
}

/**
 * Cabin nodes shown on the world map.
 *
 * Two are playable: `logic-games` (the seven deduction puzzles that used to be filed under `math` —
 * see the TopicId doc comment in src/game/types.ts for why they moved) and `math`, which is
 * deliberately active-but-empty. `math` opens a real, furnished, gadget-free room; its games land in
 * a later PR. Keeping it on the map from day one means the split is visible to a player instead of
 * appearing later as a surprise sixth cabin.
 *
 * The other three are `active: false` and render as visible "coming soon" signposts — deliberately
 * NOT padlocks and NOT hidden. A greyed-but-legible node advertises what's coming; a padlock reads
 * as "you failed to unlock this", which is the wrong message for content that simply doesn't exist
 * yet.
 *
 * Layout: `xPct`/`yPct` are percentages of the framed 16:9 map and each node is centered on its
 * point (translate(-50%, -50%) in MapScreen). They're tuned to sit on the painted cabins in
 * `/art/map.png`, which is composed for exactly this split (see scripts/gen-art.mjs): two large,
 * warmly-lit cabins near the bottom — a puzzle den on the left, a clockmaker's workshop on the
 * right — and three small, mist-washed cabins strung along the horizon. So the two active labels
 * ride just above the roofs of the two near cabins and the three coming-soon labels sit just under
 * the three distant ones, which puts the whole "playable vs. later" hierarchy in the art rather than
 * only in the pill styling.
 *
 * The map art is square and rendered `object-fit: cover` in a 16:9 frame, so only the middle ~56% of
 * the image height is on screen: `yPct` 0–100 maps to image y 21.9%–78.1%. Anything computed against
 * the raw artwork has to go through that conversion.
 *
 * Horizontal values are also chosen so no two pills overlap within a shared row — the widest label,
 * "Logic Games", spans roughly 14% of the frame, and a "coming soon" node roughly 16%.
 */
export const CABINS: CabinNode[] = [
  // Near cabins, bottom of the frame: slate blue for the puzzle den's painted wooden pegs and
  // chequerboard, brass for the clockmaker's cogs.
  {
    id: "logic-games",
    label: "Logic Games",
    xPct: 27,
    yPct: 45,
    active: true,
    accent: "#5b7fa6",
    emblem: "grid",
  },
  {
    id: "math",
    label: "Math",
    xPct: 72,
    yPct: 43,
    active: true,
    accent: "#c9962f",
    emblem: "gear",
  },
  // Horizon cabins: accents deliberately desaturated so they sit behind the two active nodes in the
  // visual hierarchy the way the painted cabins sit behind them in the landscape.
  {
    id: "music",
    label: "Music",
    xPct: 19,
    yPct: 26,
    active: false,
    accent: "#7a6a86",
    emblem: "note",
  },
  {
    id: "code",
    label: "Code",
    xPct: 54,
    yPct: 18,
    active: false,
    accent: "#4f7a6a",
    emblem: "bracket",
  },
  {
    id: "art",
    label: "Art",
    xPct: 83,
    yPct: 27,
    active: false,
    accent: "#a5705c",
    emblem: "brush",
  },
];
