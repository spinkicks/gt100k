/**
 * The wellbeing read, carried above every tab instead of hidden behind one of them.
 *
 * WHY IT STOPPED BEING A TAB. Wellbeing (016) decides whether to push, hold or scaffold, and whether
 * to hand autonomy back. As a tab, a guide could open Plan, read a fortnight's practice dose, and
 * act on it without ever learning that the engine wanted them to back off — the one read that
 * changes how every other read should be used was the one a guide had to remember to go and look
 * at. A precondition does not belong in a sibling tab.
 *
 * WHAT IT CARRIES, AND WHAT IT DROPPED. The state, the two moves and the review flag with its
 * reason: everything a guide acts on. The rationale for a healthy read is dropped, because a strip
 * that is always on screen has to earn its height, and "here is why nothing is wrong" is the first
 * thing that fails that test. It stays one line per specialization for the same reason.
 *
 * ONE ROW PER SPECIALIZATION, scoped by the caller exactly as the tab was. A child with three
 * tracked specializations can be pushing on one and burning out on another, and averaging those
 * into a single child-level verdict would be inventing a signal the engine does not produce.
 */
import type { JSX } from "react";

import { recoveryTriggerForState } from "./recovery.js";
import type { RecoveryTrigger } from "./recovery.js";
import { specPath } from "./vocab.js";
import type { WellbeingCardVM } from "./wellbeing.js";
/**
 * The engine's states and moves in a guide's words.
 *
 * These lived in `wellbeing-panel.tsx` alongside a component that stopped rendering when wellbeing
 * became a strip. Only the maps were still imported, so the panel was dead code carrying live copy
 * -- and any edit made to the words in it would silently have done nothing.
 *
 * "Scaffold" and "Autonomy" are gone. Both are terms of art: scaffolding is education theory and
 * autonomy is self-determination theory, and neither tells a teacher what to do on Monday. The
 * engine's own vocabulary is unchanged; only what a guide reads has.
 */
export const STATE_LABEL: Record<string, string> = {
  UNDER_CHALLENGED: "Not stretched enough",
  IN_ZONE: "In the zone",
  OVER_CHALLENGED: "Stretched too far",
  DANGER_WINDOW: "Watch closely",
  EARLY_BURNOUT: "Early signs of exhaustion",
  BURNOUT_TIP: "Close to burning out",
  GAP: "Quiet for a while",
};
export const CHALLENGE_LABEL: Record<string, string> = {
  PUSH: "Make it harder",
  HOLD: "Keep it where it is",
  SCAFFOLD: "Make it easier",
};
export const PRESSURE_LABEL: Record<string, string> = {
  AUTONOMY_UP: "Give more freedom",
  STEADY: "Leave as is",
};

/**
 * The success rate in words.
 *
 * Prose rather than a percentage, deliberately. A number invites a guide to chase it, and this one
 * is a rate over a handful of puzzles in a fortnight, which cannot carry that weight. The bands are
 * wide for the same reason.
 */
export function howItIsGoing(rate: number | undefined): string {
  if (rate === undefined) return "Not enough judged work to tell yet";
  if (rate >= 0.85) return "Getting nearly all of them first go";
  if (rate >= 0.6) return "Getting most of them, missing some";
  if (rate >= 0.35) return "Missing about as often as landing";
  return "Missing far more than landing";
}

export function WellbeingStrip({
  cards,
  onRecover,
}: {
  readonly cards: readonly WellbeingCardVM[];
  // Opens the recovery drawer (console.tsx) for a row whose state has a plan (the two burnout
  // states). Absent on any caller that predates recovery, and on those the button never renders.
  readonly onRecover?: (trigger: RecoveryTrigger, specId: string | null) => void;
}): JSX.Element | null {
  // Nothing tracked for this child, so there is no read to carry. Rendering an empty strip on every
  // tab would cost height on every screen to say nothing.
  if (cards.length === 0) return null;

  return (
    <section className="wbstrip" aria-label="Wellbeing">
      {cards.map((c) => (
        <div
          key={c.id}
          className={`wbstrip__row${c.read.escalateToHuman ? " wbstrip__row--review" : ""}`}
          data-state={c.read.state}
        >
          {/* THE TWO MOVES ARE THE POINT, so they are the two biggest things here. They used to sit
              as small grey key-value pairs at the end of a sentence-shaped row, and disappeared into
              the surrounding prose -- which is a real failure, because they are the only instruction
              on screen that applies whatever tab is open. Now they read as two settings on an
              instrument: the label small above, the value large below. */}
          <span className="wbstrip__now">
            <span className="wbstrip__state">{STATE_LABEL[c.read.state] ?? c.read.state}</span>
            <span className="wbstrip__spec">{specPath(c.domainPath)}</span>
          </span>
          <span className="wbstrip__moves">
            <span className="wbstrip__move">
              <span className="wbstrip__k">Difficulty</span>
              <span className="wbstrip__v">
                {CHALLENGE_LABEL[c.read.challenge] ?? c.read.challenge}
              </span>
              {/* What the recommendation rests on. A guide who can only see "make it harder" has to
                  take it on faith, and the honest answer for most spikes is that we cannot tell. */}
              <span className="wbstrip__why">{howItIsGoing(c.successRate)}</span>
            </span>
            <span className="wbstrip__move">
              <span className="wbstrip__k">Freedom</span>
              <span className="wbstrip__v">
                {PRESSURE_LABEL[c.read.pressure] ?? c.read.pressure}
              </span>
            </span>
          </span>
          {c.read.escalateToHuman ? (
            // The reason travels with the flag and is never folded away. A flag a guide cannot act
            // on without opening something else is a flag that gets ignored.
            <span className="wbstrip__review" role="note">
              <span className="wbstrip__reviewk">Needs your review</span>
              {c.read.escalationReason ?? c.read.rationale}
            </span>
          ) : null}
          {onRecover !== undefined && recoveryTriggerForState(c.read.state) !== null ? (
            // Action-first, evidence-on-demand: the strip stays the summary, and the concrete
            // recovery steps open in a drawer only when the guide asks for them.
            <button
              type="button"
              className="wbstrip__recover"
              onClick={() => onRecover(recoveryTriggerForState(c.read.state)!, c.id)}
            >
              See recovery steps
            </button>
          ) : null}
        </div>
      ))}
    </section>
  );
}
