/**
 * Motivation, as things a guide DOES rather than a state we claim to read.
 *
 * WHAT WAS ASKED FOR, AND WHY IT IS NOT HERE. The ask was a detector: tell a guide whether a child
 * is over- or under-motivated, presumably as a quadrant with intensity on an axis. That cannot be
 * built, and the reason is not that we lack data — it is that the axis carries no information.
 * Across 94 studies and 1,308 effect sizes, harmonious and obsessive passion correlate with
 * deliberate practice indistinguishably, with obsessive correlating slightly MORE with hours per
 * week (Curran, Hill, Appleton, Vallerand & Standage, 2015). Volume is the one thing an adult can
 * see and the one variable that does not separate the child you should feed from the child you
 * should intervene on. A quadrant keyed on intensity is not merely useless; it is wrong in a
 * predictable direction, flagging the absorbed child as at-risk and missing the pressured one.
 *
 * The behavioural channel cannot rescue it either. Under ego-involvement, free-choice persistence
 * INVERTS with prior feedback: after success the internally-pressured child returns less, after a
 * setback more, and reports no enjoyment either way (Ryan, Koestner & Deci, 1991). Adult praise
 * flips the sign of voluntary return, which is this product's core signal.
 *
 * WHAT REPLACES IT. Three things, all of which a program can actually do:
 *
 *   1. THE INTERRUPTION TEST. Make the activity unavailable and watch. This is where the
 *      meta-analytic separation between the two passions actually lives, rather than in volume.
 *   2. THE EXIT TEST. Offer a real, cost-free exit. Attraction declines it; entrapment cannot hear
 *      it (Raedeke, 1997, on age-group swimmers).
 *   3. SUBTRACTION FROM THE ADULTS. The only controlled child evidence in this field points at the
 *      grown-ups: a coach-behaviour workshop cut next-season dropout from 26% to 5% with no change
 *      in win-loss records (Smith, Smoll & Curtis, 1979; Barnett, Smoll & Smith, 1992).
 *
 * NEITHER PROBE RETURNS A VERDICT, and the types below enforce that. A probe yields an observation
 * and a set of readings it is consistent with, never a classification of the child.
 */

/**
 * How much weight a move deserves, stated so a guide can tell our reasoning from a trial.
 *
 * Ordered strongest to weakest. This grading is the honest part of the whole module: without it a
 * suggestion derived from a controlled trial in children and a suggestion we reasoned out over
 * lunch appear on screen as the same kind of thing.
 */
export type EvidenceGrade =
  /** A controlled trial, in children, measuring an outcome we care about. Rare, and precious. */
  | "controlled-in-children"
  /** Correlational, or established in adolescents or adults rather than in six-to-fourteens. */
  | "correlational-or-older-sample"
  /** Our own reasoning from the mechanism. Defensible, and nobody else vouches for it. */
  | "reasoned";

/** Which of the two tests this is. Kept as a closed set: a third probe needs its own evidence. */
export type ProbeId = "interruption" | "exit";

/**
 * A test a guide runs in the world, not a computation we run over logs.
 *
 * `cannotTell` is not a disclaimer bolted on. It is the field that stops a probe being read as a
 * detector, and it is required.
 */
export interface Probe {
  readonly id: ProbeId;
  readonly title: string;
  /** What the guide actually does, concretely enough to do it this week. */
  readonly how: string;
  /** Why this particular test separates anything, in one sentence. */
  readonly why: string;
  /** What each plausible outcome is consistent with. NEVER "the child is X". */
  readonly readings: readonly ProbeReading[];
  /** What this probe cannot establish, however it comes out. Required, and shown. */
  readonly cannotTell: string;
  readonly grade: EvidenceGrade;
  readonly sourceIds: readonly string[];
}

export interface ProbeReading {
  /** The observable outcome, in the guide's words. */
  readonly ifYouSee: string;
  /** What that is consistent with. Hedged deliberately: one observation is not a finding. */
  readonly consistentWith: string;
  /** The move it points at, by id. Absent where the honest answer is to watch again. */
  readonly suggests?: string;
}

/**
 * Something an adult stops doing, or starts doing, aimed at the adult rather than at the child.
 *
 * SUBTRACTION FIRST, and this is the module's strongest opinion. The one controlled child result in
 * the literature works by changing what the grown-ups do, not by motivating the child. Moves are
 * therefore written as instructions to a guide or a parent, and the list is deliberately weighted
 * towards removing something.
 */
export interface AdultMove {
  readonly id: string;
  readonly title: string;
  /** The instruction, in a sentence a parent can be given verbatim. */
  readonly does: string;
  /** Why it works, or why we think it might. */
  readonly why: string;
  readonly grade: EvidenceGrade;
  readonly sourceIds: readonly string[];
  /** True when the move is "stop doing something" rather than "do something new". */
  readonly isSubtraction: boolean;
  /** Domain this is written for, or absent when it holds across domains. */
  readonly domain?: string;
}
