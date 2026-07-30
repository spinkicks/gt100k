// The discovery surface's data: the pursuits catalogue, the curated library, and the games.
//
// This file used to build tiles from `CABINS` and `SEED_SUBTOPICS`, which meant a child was shown
// the model's coordinate system. That is where "Board games" and "Instruments" came from — cells
// coarse enough to hold a belief, rendered as though they were things to do. They are not: Rosch's
// basic level is the most inclusive level at which a shared action program applies, and there is no
// common action across Scrabble and Catan.
//
// So the menu is `@gt100k/pursuits` and the taxonomy stays where it belongs, keyed to beliefs. The
// cabin survives as a filter facet and as the tile's hue.
import {
  curatedForPursuit,
  SEED_LIBRARY,
  type AgeTier,
  type CuratedResource,
} from "@gt100k/concierge";
import { pursuitsFor } from "@gt100k/discovery-catalog";
import { PURSUITS, reachableAt, type Pursuit } from "@gt100k/pursuits";
import { CABINS, type CabinId } from "@gt100k/two-axis-tagging";

/** `PROJECT.md` puts the target band at 9-12, so the shelf serves the two tiers that span it. */
export const AGE_TIERS: readonly AgeTier[] = ["9-11", "12-14"];

export { PURSUITS, reachableAt, CABINS };
export type { Pursuit, CabinId };

/** Cabin names as a child would say them. Filter chips, never a step to pass through. */
export const CABIN_LABEL: Record<CabinId, string> = {
  "math-puzzles": "Puzzles & Numbers",
  "code-computers": "Code & Computers",
  "games-strategy": "Games & Strategy",
  "making-engineering": "Making & Building",
  "art-motion": "Art & Animation",
  "music-sound": "Music & Sound",
  "science-nature": "Science & Nature",
  "influence-media": "Words & Persuasion",
};

/**
 * The tile art for a pursuit.
 *
 * Derived from the id rather than stored on the `Pursuit`, because the path is a fact about this
 * app's `public/` directory and not about the pursuit. A missing file would otherwise be invisible
 * until someone looked at the wall, so `test/art.test.ts` asserts the set is complete.
 *
 * Built by `scripts/build-art.mjs`, which is where the reasoning about uniformity lives.
 */
export function artFor(p: Pursuit): string {
  return `/pursuits/${p.id}.webp`;
}

/**
 * How many links the panel shows.
 *
 * Four rather than five, and it is the surface's call to make: the curated-library standard says
 * plainly that the library is a STORE, that Patall's 3-5 is a property of a choice moment, and that
 * which subset a child sees is decided here. Four sits inside that range.
 *
 * The reason to spend the fifth is measured. These titles are long — "Djembe drumming and rhythms
 * from West Africa (Oak National Academy, Y8)" runs to three lines — so a fifth row pushed the
 * venue block off the bottom of the panel at 1600x950. That block answers who will eventually judge
 * the work, which is the whole external-validation claim, and a fifth link is worth less than
 * keeping it on screen without scrolling.
 */
const SHELF_LIMIT = 4;

/** Where to start on this tile: the shelf curated for it, never for its cabin. */
export function resourcesFor(p: Pursuit): readonly CuratedResource[] {
  return curatedForPursuit(SEED_LIBRARY, p.id, AGE_TIERS, SHELF_LIMIT);
}

/**
 * A game reachable from a tile, named for a child.
 *
 * This is a COMPONENTS-FREE index on purpose. The playable component and its `supportsTier` flag
 * live in `runtime/gadgets/registry.ts`, which imports all fifteen puzzles (plus the audio engine,
 * motion and chess.js). If the wall imported that to decide *which tile has a game*, the entire game
 * bundle would join the wall's first load — the wall is the child's front door and must stay light.
 * So the door only needs an id and a label; `runtime/host` resolves the id to a component and mounts
 * it lazily when a child actually opens one (see `GameLauncher`).
 *
 * The registry is the source of truth for the roster. If a gadget is added there, add its id +
 * child-facing label here too — the build will not catch the omission, only a missing game will.
 */
export interface GameRef {
  readonly id: string;
  readonly label: string;
}

/**
 * The fifteen active gadgets, in registry order, labelled the way a child would read them. Which
 * tile each one appears on is NOT written here — it is read from the crosswalk (`pursuitsFor`), so
 * the mapping stays owned by `@gt100k/discovery-catalog` and this list only ever holds copy.
 */
const GAMES: readonly GameRef[] = [
  { id: "nonogram", label: "Nonogram" },
  { id: "mirror", label: "Mirror Maze" },
  { id: "pipes", label: "Pipes" },
  { id: "chess", label: "Chess" },
  { id: "balance-scale", label: "Balance Scale" },
  { id: "fraction-laser", label: "Fraction Laser" },
  { id: "function-machine", label: "Function Machine" },
  { id: "ratio-mixing", label: "Ratio Mixing" },
  { id: "gear-train", label: "Gear Train" },
  { id: "tune-repair", label: "Tune Repair" },
  { id: "chord-fit", label: "Chord Fit" },
  { id: "downbeat", label: "Downbeat" },
  { id: "sprite-loop", label: "Sprite Loop" },
  { id: "trace-repair", label: "Trace & Repair" },
  { id: "teach-helper", label: "Teach the Helper" },
];

/** Index built once from the crosswalk: pursuit id → the games offered there. */
const GAMES_BY_PURSUIT: ReadonlyMap<string, readonly GameRef[]> = (() => {
  const m = new Map<string, GameRef[]>();
  for (const g of GAMES) {
    for (const p of pursuitsFor(g.id)) {
      const bucket = m.get(p);
      if (bucket) bucket.push(g);
      else m.set(p, [g]);
    }
  }
  return m;
})();

/**
 * The game(s) a child can play on a tile — the generative act that sits beside the curated links.
 *
 * Membership is fixed and returned in registry order. This is inside an already-chosen pursuit, not
 * a cross-topic choice moment, so it is not part of the offered set the wall randomises.
 */
export function gamesFor(pursuit: string): readonly GameRef[] {
  return GAMES_BY_PURSUIT.get(pursuit) ?? [];
}

/**
 * A deterministic shuffle, seeded once per session.
 *
 * RANDOM ORDER, NOT A RANDOM ROSTER, and the distinction is the whole design.
 *
 * Random ordering is strictly better than a fixed one for measurement. A fixed list bakes in
 * position bias forever: whatever sits first accumulates engagement and nothing can ever separate
 * "first" from "preferred". Randomising decorrelates the two, which is what makes the `position` we
 * log a usable variable rather than a constant. It matters more on this wall than the last one,
 * because grid position is a large and unmeasured confound for children specifically — every
 * eye-tracking study of grid attention has been run on adults.
 *
 * Random membership is a different thing and it is dangerous. Rotating fresh topics in every
 * session is the trigger-and-abandon pattern, and in a multi-session study (n = 212) children whose
 * interest was triggered and then not maintained finished BELOW children never triggered at all.
 * So the set is fixed; only the order moves.
 *
 * Seeded rather than `Math.random` so a session is stable across re-renders: a grid that reshuffles
 * under a child's hand as they reach for a tile is a different and much worse product.
 */
export function shuffled<T>(items: readonly T[], seed: number): readonly T[] {
  const out = [...items];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296; // numerical recipes LCG; adequate for a shuffle
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
