/**
 * What a parent gets to see, and why it is not a dashboard.
 *
 * THE ARGUMENT THAT DECIDED THIS IS NOT THE ETHICAL ONE. The whole measurement model rests on one
 * behaviour: the child coming back unprompted. The moment a child knows a parent can see whether
 * they came back, coming back is evidence of compliance and is indistinguishable from the
 * introjected returns this product already worries about. A progress dashboard would spend our only
 * valid instrument to build a feature the evidence also says harms the child.
 *
 * THE EVIDENCE IS BEST EXACTLY WHERE OUR USERS ARE. Butler randomly assigned fifth and sixth
 * graders to receive grades, comments, or both. Interest was highest after comments, and
 * grades-plus-comments performed like grades ALONE. Adding a number did not dilute the comment, it
 * erased it. So a narrative beside a metric is not a compromise; it is the metric, and there is no
 * safe way to put a figure on this page.
 *
 * THE TEMPTING MIDDLE PATH ALSO FAILS. "Show parents only the good news" is conditional positive
 * regard, which across 31 samples associates with introjected regulation MORE strongly than
 * conditional negative regard does. A feed of wins is not the harmless half.
 *
 * See `docs/decisions/2026-08-04-what-can-be-sensed.md` §5 for the full list of what is refused.
 */

/** Something the child made or said, carried across in their own words. Never summarised. */
export interface TheirWords {
  /** What they were working on, as they described it. */
  readonly about: string;
  /** The child's own sentence. Quoted, not paraphrased into a progress note. */
  readonly said: string;
  /** When. A date, so a parent can ask about a real moment rather than a general trend. */
  readonly on: string;
}

/** What we suggest a parent does. Exactly one, because a list is a checklist. */
export interface OneThing {
  /** The opening line. Asks the parent to offer something of their own first. */
  readonly say: string;
  /** Why this and not something else. Shown, because a parent following a script is not present. */
  readonly because: string;
}

/**
 * A month of a child's interest, as their parent sees it.
 *
 * `holdBack` is the part that makes this legitimate. The child sees exactly this before it is sent
 * and can remove anything without giving a reason: what a parent knows about a child comes
 * overwhelmingly from the child telling them, and adolescents who feel their privacy invaded
 * disclose LESS a year later, so a surveillance channel ends up knowing less than a disclosure one.
 */
export interface ParentDigest {
  readonly kidId: string;
  readonly covering: string;
  readonly words: readonly TheirWords[];
  readonly oneThing: OneThing;
  /** True when the honest advice is to do nothing at all. */
  readonly leaveItAlone: boolean;
}

/**
 * How settled an interest is, which only we can see.
 *
 * This is the asymmetry worth building on. Interest develops in phases, and in the early ones a
 * child depends on other people to re-trigger it while a well-developed interest is self-generated
 * and needs no external push. We can read which phase a child is in; a parent cannot. Telling them
 * "this one runs on its own now, leave it be" is the single most valuable thing we can say, and
 * nobody else is in a position to say it.
 */
export type InterestPhase = "new" | "growing" | "their-own";

/**
 * Build the digest.
 *
 * Takes the child's own words rather than any derived quantity, because there is nothing on this
 * page a parent could watch move.
 */
export function parentDigest(input: {
  readonly kidId: string;
  readonly covering: string;
  readonly words: readonly TheirWords[];
  readonly phase: InterestPhase;
}): ParentDigest {
  const leaveItAlone = input.phase === "their-own";
  return {
    kidId: input.kidId,
    covering: input.covering,
    // Oldest first would bury the thing they could ask about tonight.
    words: [...input.words].sort((a, b) => Date.parse(b.on) - Date.parse(a.on)),
    oneThing: leaveItAlone ? LEAVE_IT : opener(input.words[0]),
    leaveItAlone,
  };
}

/**
 * The advice when an interest is self-sustaining.
 *
 * Deliberately the loudest thing on the page when it applies. Parental encouragement did not
 * predict a child sticking with an activity in a two-wave study of 420 adolescents; parents simply
 * attending did. Doing less is a real instruction, not a fallback for having nothing to say.
 */
const LEAVE_IT: OneThing = {
  say: "Nothing, this month. They are running this one themselves.",
  because:
    "An interest at this stage keeps itself going, and the usual ways of helping tend to get in the way. If you want to do something, go and watch them do it without commenting.",
};

/**
 * The opener when there is something to talk about.
 *
 * ASKS THE PARENT TO GO FIRST. A conversation-analysis study of real car journeys home found
 * children resisted whenever a parent opened a review of their performance, including a supportive
 * one, and talked warmly at length when they opened it themselves. Reciprocal disclosure inverts
 * the interrogation: a parent who offers something of their own is not conducting a review.
 */
function opener(w: TheirWords | undefined): OneThing {
  if (w === undefined) {
    return {
      say: "Tell them about something you got stuck on this week.",
      because:
        "Nothing came across from them this month, and asking directly tends to close the subject. Offering something of your own leaves the door open without putting them on the spot.",
    };
  }
  return {
    say: `Tell them about a time you found something as fiddly as ${w.about}, then ask them to show you theirs.`,
    because:
      "Going first turns it into a conversation rather than a review. Children pull away when a grown-up opens with how it went, and talk for ages when they start it themselves.",
  };
}
