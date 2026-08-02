/**
 * The two probes, and the chess moves they point at.
 *
 * Both probes are written so a guide can run one this week without any instrumentation from us. That
 * is deliberate: the reason they exist is that the thing we CAN instrument — volume, session length,
 * return frequency — is the thing the meta-analysis says does not separate anything.
 */
import type { AdultMove, Probe } from "./model.js";

export const PROBES: readonly Probe[] = [
  {
    id: "interruption",
    title: "Take it away for a week",
    how: "Make the activity genuinely unavailable for about a week, for an ordinary reason rather than as a test or a punishment. A family trip, a broken board, a busy fortnight. Then watch what happens, and say nothing about it.",
    why: "Volume tells you nothing, because absorbed and driven children practise about the same amount. What separates them is what happens when they cannot practise.",
    readings: [
      {
        ifYouSee:
          "They find something else to be interested in, and pick it back up when it returns",
        consistentWith:
          "The interest sits alongside the rest of their life rather than holding it up.",
      },
      {
        ifYouSee: "Relief. They do not go back to it on their own when it becomes available again",
        consistentWith:
          "It may have been running on something outside them. Worth finding out what, before deciding anything.",
        suggests: "ask-whose-idea",
      },
      {
        ifYouSee: "Distress out of proportion to a week, or guilt about the days missed",
        consistentWith:
          "The activity may be carrying more than it should — self-worth, or somebody's approval.",
        suggests: "decouple-worth",
      },
    ],
    cannotTell:
      "Nothing about how much they enjoy it, and nothing about whether they should continue. A child can be deeply absorbed and unbothered by a week off.",
    grade: "correlational-or-older-sample",
    sourceIds: ["curran-2015", "raedeke-1997"],
  },
  {
    id: "exit",
    title: "Offer a real way out",
    how: "Say, once and plainly, that they can stop and that nothing bad happens if they do. Then mean it: no follow-up, no disappointment, no asking again next week. The offer only works if it costs them nothing to take.",
    why: "A child who is there because they want to be will decline. A child who is there because they cannot see a way out often cannot hear the offer at all, and will check whether you meant it.",
    readings: [
      {
        ifYouSee: "An easy no, and they carry on",
        consistentWith: "They are choosing it. This is the answer you want and it needs no action.",
      },
      {
        ifYouSee: "They ask what you would think, or whether you would be disappointed",
        consistentWith:
          "The choice may not feel like theirs. That is a fact about the adults, not about them.",
        suggests: "subtract-outcome-talk",
      },
      {
        ifYouSee: "They take it",
        consistentWith:
          "They wanted out and had not been able to say so. Let them go without negotiating.",
        suggests: "let-them-stop",
      },
    ],
    cannotTell:
      "Whether they will still want it in six months. It reads today's choice, and only once — asking repeatedly turns a genuine offer into pressure.",
    grade: "correlational-or-older-sample",
    sourceIds: ["raedeke-1997"],
  },
];

/**
 * What an adult does, for chess and in general.
 *
 * SUBTRACTION LEADS, because the strongest evidence in the field is subtractive. Smith, Smoll and
 * Curtis trained coaches to change what they did — more reinforcement, less punitive control — and
 * next-season dropout fell from 26% to 5% with no change in win-loss records. Nothing was done to
 * the children.
 */
export const MOVES: readonly AdultMove[] = [
  {
    id: "subtract-outcome-talk",
    title: "Stop talking about the result",
    does: "For the next month, say nothing about wins, losses or rating after a game. Ask what happened in it instead: what they tried, where it turned, what they would do again.",
    why: "The one controlled trial in this literature works by changing adult behaviour rather than the child's. Coaches trained to cut punitive control and raise reinforcement saw next-season dropout fall from 26% to 5%, with no change in win-loss records.",
    grade: "controlled-in-children",
    sourceIds: ["smith-smoll-1979", "barnett-1992"],
    isSubtraction: true,
    domain: "chess",
  },
  {
    id: "decouple-worth",
    title: "Separate how they did from who they are",
    does: "Say out loud, at a moment when nothing has just gone wrong, that you think the same of them whatever the result. Then make it true after the next loss by not changing your behaviour at all.",
    why: "Warmth that arrives after wins and withdraws after losses teaches a child that the activity is what makes them acceptable, which is the mechanism behind the distress the interruption test picks up.",
    grade: "correlational-or-older-sample",
    sourceIds: ["curran-2015"],
    isSubtraction: true,
  },
  {
    id: "ask-whose-idea",
    title: "Find out whose idea it was",
    does: "Ask them what they would be doing this week if nobody had signed them up for anything, and let the answer sit without correcting it.",
    why: "A child running on somebody else's plan looks identical from the outside to one running on their own. Asking is the only instrument that separates them, and it is the one we deliberately do not automate.",
    grade: "reasoned",
    sourceIds: ["guay-2000"],
    isSubtraction: false,
  },
  {
    id: "let-them-stop",
    title: "Let them stop, and do not negotiate",
    does: "Accept it in one sentence, without a counter-offer, a trial period, or a conversation about what a shame it is. Leave the door open by saying nothing about it again.",
    why: "An exit that turns into a negotiation was never an exit. Taking it at face value is what makes the next offer of one believable.",
    grade: "reasoned",
    sourceIds: ["raedeke-1997"],
    isSubtraction: true,
  },
  {
    id: "cap-the-calendar",
    title: "Take a tournament off the calendar",
    does: "Remove one entry the child did not ask for, and tell them you have done it. If they object and want it back, that is useful information and you should put it back.",
    why: "Chess escalates through the calendar rather than through hours at the board, and the entries a child did not choose are the ones that carry somebody else's ambition. Their objecting is itself the exit test, run for free.",
    grade: "reasoned",
    sourceIds: ["raedeke-1997"],
    isSubtraction: true,
    domain: "chess",
  },
  {
    id: "no-rating-in-the-house",
    title: "Stop checking the rating between events",
    does: "Look up the published rating when a rating period closes and not otherwise, and do not narrate it to the child at all.",
    why: "A rating updates in public and invites daily checking by an adult, which converts a slow measure into a running scoreboard the child can feel being watched. This is our reasoning from the mechanism, not a finding: nobody has tested it.",
    grade: "reasoned",
    sourceIds: [],
    isSubtraction: true,
    domain: "chess",
  },
];

/** The moves a guide should be shown for a domain: those written for it, plus the general ones. */
export function movesFor(domain: string): readonly AdultMove[] {
  return MOVES.filter((m) => m.domain === undefined || m.domain === domain);
}

/**
 * Subtractions first, then by how much the evidence is worth.
 *
 * Both orderings are arguments. Subtraction leads because the only controlled result works that
 * way, and grade breaks the tie because a guide with time for one move should spend it on the one
 * somebody actually tested.
 */
const GRADE_ORDER: Record<string, number> = {
  "controlled-in-children": 0,
  "correlational-or-older-sample": 1,
  reasoned: 2,
};

export function ranked(moves: readonly AdultMove[]): readonly AdultMove[] {
  return [...moves].sort(
    (a, b) =>
      Number(b.isSubtraction) - Number(a.isSubtraction) ||
      (GRADE_ORDER[a.grade] ?? 9) - (GRADE_ORDER[b.grade] ?? 9),
  );
}
