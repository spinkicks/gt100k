// The browse prototype's data: the pursuits catalogue, unmodified.
//
// This file used to build tiles from `CABINS` and `SEED_SUBTOPICS`, which meant a child was shown
// the model's coordinate system. That is where "Board games" and "Instruments" came from — cells
// coarse enough to hold a belief, rendered as though they were things to do. They are not: Rosch's
// basic level is the most inclusive level at which a shared action program applies, and there is no
// common action across Scrabble and Catan.
//
// So the menu is now `@gt100k/pursuits` and the taxonomy stays where it belongs, keyed to beliefs.
// The cabin survives here only as a filter facet.
import {
  curatedForPursuit,
  SEED_LIBRARY,
  type AgeTier,
  type CuratedResource,
} from "@gt100k/concierge";
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

export function resourcesFor(p: Pursuit): readonly CuratedResource[] {
  return curatedForPursuit(SEED_LIBRARY, p.id, AGE_TIERS, 5);
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
