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
 * Three are playable. `logic-games` holds the four deduction puzzles that used to be filed under
 * `math` — see the TopicId doc comment in src/game/types.ts for why they moved, and
 * src/gadgets/registry.ts for why there are four and not the original seven. `math` holds five.
 * `music` joined them on 2026-07-27 with three: see src/cabin/backdrop/quads.data.ts for its painted
 * room and src/signals/catalog.ts for how its activities enter the product taxonomy.
 *
 * The other two are `active: false` and render as visible "coming soon" signposts — deliberately
 * NOT padlocks and NOT hidden. A greyed-but-legible node advertises what's coming; a padlock reads
 * as "you failed to unlock this", which is the wrong message for content that simply doesn't exist
 * yet.
 *
 * Layout: `xPct`/`yPct` are percentages of the framed 16:9 map and each node is centered on its
 * point (translate(-50%, -50%) in MapScreen). They're tuned to sit on the painted cabins in
 * `/art/map.png`, **regenerated on 2026-07-27** so that THREE cabins stand large and warmly lit in
 * the foreground — puzzle den left, musician's cabin centre, clockmaker's workshop right, each the
 * same size, each equally lit, each with its own path to the bottom edge — and only TWO remain small
 * and mist-washed on the horizon.
 *
 * WHY THE MAP WAS REPAINTED, since it is the more atmospheric composition that was given up. The
 * previous plate put `music` on a distant, unlit, pathless cabin, so promoting it would have shipped
 * a topic whose choice affordance was visibly worse than its competitors'. That is the Javora
 * confound the surface-owner ruling names as one of two rules the game did not satisfy: children
 * chose the prettier version of the *same* game 62% of the time and learned no more, so a topic that
 * simply looks better wins clicks that mean nothing. Topic choice is this app's primary signal, so it
 * must not be decided by paint. Equal size and equal light across the three playable cabins is a
 * MEASUREMENT requirement (PRD §5.3), not a finish preference.
 *
 * The three active labels ride just above the roofs of the near cabins (yPct ~35) and the two
 * coming-soon labels sit above the distant ones in the mist (yPct ~6), which keeps the two rows well
 * clear of each other while leaving the hierarchy in the art rather than only in the pill styling.
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
    xPct: 12,
    yPct: 35,
    active: true,
    accent: "#5b7fa6",
    emblem: "grid",
  },
  {
    id: "math",
    label: "Math",
    xPct: 83.5,
    yPct: 35,
    active: true,
    accent: "#c9962f",
    emblem: "gear",
  },
  // Horizon cabins: accents deliberately desaturated so they sit behind the two active nodes in the
  // visual hierarchy the way the painted cabins sit behind them in the landscape.
  {
    id: "music",
    label: "Music",
    xPct: 49.3,
    yPct: 35,
    active: true,
    // Saturated now that it is a near, playable cabin: the old value was deliberately desaturated to
    // sit back in the horizon row. Plum reads as distinct from the puzzle den's slate blue and the
    // clockmaker's brass, which is all this hue has to do.
    accent: "#a8607e",
    emblem: "note",
  },
  {
    id: "code",
    label: "Code",
    xPct: 18.6,
    yPct: 6,
    active: false,
    accent: "#4f7a6a",
    emblem: "bracket",
  },
  {
    id: "art",
    label: "Art",
    xPct: 79.1,
    yPct: 6,
    active: false,
    accent: "#a5705c",
    emblem: "brush",
  },
];
