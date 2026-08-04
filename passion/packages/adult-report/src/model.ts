/**
 * What an adult saw, in a form worth trusting.
 *
 * WHY THIS PACKAGE EXISTS. Three things the system needs cannot be read from behaviour and are not
 * ours to guess: whether a child seems worn out, whether something high-stakes is coming, and what
 * they did away from our screens. All three have to be told to us. The belief math has scored
 * `external_report` at `A_REPORT_BROAD` since the beginning; nothing could ever produce one.
 *
 * WHY THE SHAPE MATTERS MORE THAN THE SOURCE. Cross-informant agreement about children has sat at
 * about r = .28 for forty years, but the spread *within* adult report is far wider than the gap
 * between kinds of adult. Parent report checked against tablet telemetry managed r = 0.35, while a
 * single global retrospective question about a child's activity correlated r = -0.11 with a week of
 * accelerometry -- worse than useless. The same parents reporting in the moment tracked the
 * objective measure well. The problem is retrospection, not the parent, so everything here asks for
 * an episode rather than an impression.
 *
 * See `docs/decisions/2026-08-04-what-can-be-sensed.md` and
 * `docs/research/passion-pipeline/hardening/09-adult-observation-validity.md`.
 */

/** Who saw it. Deliberately not weighted differently: there is no evidence base for a split. */
export type Reporter = "parent" | "guide" | "teacher";

/**
 * Something an adult watched a child do, away from anything we instrument.
 *
 * ONE EPISODE, DATED. Not "what are they interested in", which invites the inferential leap where
 * halo and stereotype enter and produces nothing anyone can check later.
 */
export interface Sighting {
  readonly id: string;
  readonly kidId: string;
  readonly reporter: Reporter;
  /** When the adult filed it. */
  readonly at: string;
  /** What they saw, in their words. */
  readonly what: string;
  /**
   * The days they saw it, as ISO dates.
   *
   * More than one day is what separates a habit from an afternoon, and it is the condition for this
   * counting toward anything. A single sighting is recorded and scores nothing.
   */
  readonly days: readonly string[];
  /** The cell it points at, when the adult picked one. Absent means recorded but unattributed. */
  readonly cellKey?: string;
}

/** How worn out a child seems, as the adult who watched them would put it. Never a score. */
export type RestDirection = "seems-fine" | "flagging" | "worn-out";

/**
 * An adult's read on whether the child is running down.
 *
 * A DIRECTION, NEVER A THRESHOLD. Mind Garden withdrew every MBI cut-off in 2016 for having no
 * diagnostic validity, and the WHO classifies burnout as an occupational phenomenon rather than a
 * condition. A boolean here would have no scientific referent in any population, so the engine gets
 * a direction and a guide gets the adult's own words.
 */
export interface RestReport {
  readonly kidId: string;
  readonly reporter: Reporter;
  readonly at: string;
  readonly direction: RestDirection;
  /** What made them say so. Required for anything but `seems-fine`: a flag with no story is noise. */
  readonly because?: string;
}

/** What kind of thing is coming. Shapes the advice, not the weight. */
export type StakesKind = "competition" | "performance" | "audition" | "deadline" | "assessment";

/**
 * Something with stakes, on a date.
 *
 * The only signal in this package that is not a report about a mental state. It is a calendar fact
 * the adult already holds, so asking carries no inferential risk at all -- which is why it is the
 * one the other two hang off.
 */
export interface StakesEvent {
  readonly kidId: string;
  readonly kind: StakesKind;
  /** What it is, in plain words: "county chess tournament", "grade 2 piano exam". */
  readonly what: string;
  /** ISO date. */
  readonly on: string;
  /** The specialization it belongs to, when the adult picked one. */
  readonly cellKey?: string;
}

/** Everything adults have told us about one child. */
export interface AdultReports {
  readonly sightings: readonly Sighting[];
  readonly rest: readonly RestReport[];
  readonly stakes: readonly StakesEvent[];
}

export const NO_REPORTS: AdultReports = { sightings: [], rest: [], stakes: [] };
