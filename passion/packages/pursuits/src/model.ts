import type { CabinId } from "@gt100k/two-axis-tagging";

/**
 * How often a child can get a fresh verdict on fresh work.
 *
 * Recorded because it turned out to separate entries that look equivalent. Backgammon and Go both
 * pass every other test; one hands a child a rated result every week and the other once a year.
 */
export type Cadence =
  | "continuous"
  | "weekly"
  | "monthly"
  | "several-yearly"
  | "annual"
  | "on-demand";

/**
 * Whether a child with no money, no club and one supportive-but-uninformed adult can reach the
 * verdict.
 *
 * This is the test that failed the most candidates, and it is the one the product cannot compromise
 * on: it exists for children who lack exactly the family access that every school-gated competition
 * assumes. FIRST LEGO League is an excellent programme and scores `needs-organisation`, which means
 * most of our children cannot reach it however good it is.
 */
export type Reach =
  /** The child and an adult can do the whole thing unaided. */
  | "alone"
  /** One specific, explainable action from an adult who knows nothing about the domain. */
  | "adult-action"
  /** Requires a school, club or team that already exists nearby. */
  | "needs-organisation";

/** Where the venue accepts entries from. Most of the best venues are not international. */
export type Region = "international" | "us" | "uk";

/** Who renders the verdict, and where to find them. */
export interface Venue {
  readonly name: string;
  readonly url: string;
}

/**
 * A measured participation skew, kept as data because it is a confound the product must design
 * against rather than a fact about children.
 *
 * Children under about 14 partly evaluate interest items by gender representation rather than by
 * content, so a catalogue that ignores this will sort children by stereotype and report the sorting
 * as interest. The instrument figures come from Hallam, Rogers & Creech (2008), which matched all
 * 150 English Music Services against the national dataset. Note the baseline: 60% of all children
 * learning any instrument are girls, so a 75%-male instrument is further from its baseline than the
 * raw number suggests.
 *
 * `male` is the share of participants recorded as male, 0 to 1. Absent where no figure was found,
 * which is not the same as balanced.
 */
export interface Skew {
  readonly male: number;
  readonly source: string;
}

export interface Pursuit {
  readonly id: string;
  /**
   * What a child sees.
   *
   * Basic-level, in Rosch's sense: the most inclusive level at which a common action program
   * applies. There is a way you play chess and a way you bow a cello. There is no shared action
   * across "board games" or "instruments", which is why neither can be a label here.
   */
  readonly label: string;
  /** One line, in words a nine-year-old reads without help. Never a pitch. */
  readonly blurb: string;
  /**
   * The umbrella this filters under.
   *
   * A FACET, NOT A PARENT. The child never navigates through it. It stays because the inference
   * model keys beliefs to cabins and the surfacing engine pays maintenance debts per domain, both
   * of which need cells coarse enough to have debts.
   */
  readonly cabin: CabinId;
  /** The published document that defines quality independently of any particular judge. */
  readonly standard: string;
  readonly venue: Venue;
  /**
   * The youngest age at which a child can actually do this and get a verdict.
   *
   * THE EFFECTIVE FLOOR, not the venue's stated one, and the difference matters. Most venues state
   * no minimum at all, which is not the same as admitting a six-year-old: nothing in USACO's rules
   * bars an infant from the Bronze division and no infant has ever passed it. Recording the stated
   * floor and calling it this produced a catalogue in which two thirds of everything was reachable
   * at six, which is false and would have shown a small child a wall of doors that open onto work
   * they cannot do.
   *
   * So where a venue states a floor, that floor wins and is verified. Where it states none, this is
   * a judgement about the activity, and it should be read as one.
   *
   * This is the field that turned out to matter most. The product targets 6-14 and most venues open
   * at 10 to 13, so a large part of the catalogue is out of reach at the bottom of the band.
   */
  readonly minAge: number;
  /** Roughly what a year of doing this seriously costs a family in USD, excluding the instrument. */
  readonly costUsd: number;
  readonly cadence: Cadence;
  readonly reach: Reach;
  readonly region: Region;
  /** Present only where a figure was actually found. Absent means unmeasured, not balanced. */
  readonly skew?: Skew;
  /** Anything a reader would otherwise have to rediscover: a caveat, a correction, a dead end. */
  readonly note?: string;
}
