/**
 * Teach the Helper — write instructions that work on boards you cannot see.
 *
 * WHAT THIS DOOR MEASURES, AND WHY IT IS NOT THE OTHER TWO
 * ------------------------------------------------------------------------------------------------
 * Sprite Loop asks a child to reproduce one behaviour from one known start: imitation. Trace & Repair
 * asks them to find why an existing program diverges: diagnosis. This one asks for a program that is
 * still right on **three arrangements the child never sees** — specification that generalises, which
 * is the `agentic-engineering` idea as it actually is, and which nothing else in the app detects.
 *
 * HOW THE MIND-READING RISK WAS REMOVED RATHER THAN MITIGATED
 * ------------------------------------------------------------------------------------------------
 * The design this door was specced from had a "literal-minded helper" reading near-natural-language
 * instructions and doing something amusingly wrong when they were ambiguous. Spec §10.1 flagged that
 * as the door most likely to fail on contact, because a deliberately literal interpreter is one step
 * from guess-what-the-parser-wants — and PROJECT.md forbids difficulty that resolves to reading the
 * designer's mind.
 *
 * The risk turned out to live entirely in the *near-natural-language framing*, not in the construct.
 * So the framing is gone and the construct is kept: the child writes the same tiny language the other
 * two doors use, every word has exactly one visible rule, and the difficulty comes from the hidden
 * arrangements rather than from anything a parser might or might not understand. There is nothing to
 * second-guess.
 *
 * THE GUARD (rule X1 for this door)
 * ------------------------------------------------------------------------------------------------
 * Every round is built so that **the program a child would write for the board in front of them fails
 * at least one hidden arrangement** — see `naive.ts`'s `writtenForWhatYouSee`. Without that, a round
 * would accept the naive answer and measure nothing. It is the same shape as the other two guards:
 * Sprite Loop's drawn path underdetermines the behaviour, Trace & Repair's ending underdetermines the
 * repair, and here the visible board underdetermines the instructions.
 */
import type { Program } from "../../code/program";
import { clears, runWorld } from "./world";

export interface TeachHelperPuzzle {
  /** The arrangement the child can see while writing. */
  readonly visible: ReadonlySet<string>;
  /**
   * Arrangements the program is also run against, and which the child never sees while writing.
   *
   * Not secret for the sake of being secret: they are shown *after* a run, so a failure is something
   * the child watches happen rather than a verdict. What they cannot do is write against them.
   */
  readonly hidden: readonly ReadonlySet<string>[];
}

/** Every arrangement a program has to survive: the visible one and the hidden ones. */
export function allArrangements(puzzle: TeachHelperPuzzle): readonly ReadonlySet<string>[] {
  return [puzzle.visible, ...puzzle.hidden];
}

/** Which arrangements this program clears, in order, with the visible one first. */
export function outcomes(puzzle: TeachHelperPuzzle, program: Program): readonly boolean[] {
  return allArrangements(puzzle).map((parcels) => clears(program, parcels));
}

/** A program is right when it clears every arrangement, seen and unseen. */
export function isSolved(puzzle: TeachHelperPuzzle, program: Program): boolean {
  if (program.length === 0) return false;
  return outcomes(puzzle, program).every(Boolean);
}

/**
 * What each arrangement still has on the floor once the program has run.
 *
 * This is what the boards must draw after a run, and drawing the *starting* arrangement instead was a
 * real bug caught by looking at a screenshot: a floor where the helper collected two parcels of three
 * rendered untouched, so "something left behind" sat next to a picture that made it look as though
 * nothing at all had been picked up. The verdict is a sentence; this is the evidence for it, and the
 * two have to agree.
 */
export function leftovers(
  puzzle: TeachHelperPuzzle,
  program: Program,
): readonly ReadonlySet<string>[] {
  return allArrangements(puzzle).map((parcels) => {
    const frames = runWorld(program, parcels).frames;
    return frames[frames.length - 1]!.remaining;
  });
}

/**
 * A program that clears what the child can see but not everything.
 *
 * The interesting near-miss, and the state most children will reach first. Named so the component can
 * say something true about it — "it works on this one" — instead of a flat no.
 */
export function worksOnVisibleOnly(puzzle: TeachHelperPuzzle, program: Program): boolean {
  const [visible, ...rest] = outcomes(puzzle, program);
  return visible === true && rest.some((ok) => !ok);
}
