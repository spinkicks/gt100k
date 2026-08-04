/**
 * What actually happened, in two lists: what a guide decided, and what the child made.
 *
 * WHY THIS EXISTS. The Family tab was advice with nothing under it. It said what to coach and never
 * said what had been coached before, whether it was taken up, or what the child had produced in the
 * meantime. A parent conversation built on that is a conversation about the engine's current
 * opinion, which is the least useful thing in the room.
 *
 * WHY ARTEFACTS AND NOT STANDING. This is the surface most likely to grow a verdict, because a
 * parent asks "how is she doing" and a verdict is the shortest answer. It stays a list of things
 * made, with dates. Butler (1988): 132 children aged roughly 10-12, and a bare verdict with no task
 * anchoring behaved like a grade and depressed subsequent interest. The finding is about feedback to
 * the child, and the mechanism travels through the parent, which is exactly who reads this.
 *
 * NEITHER LIST IS GENERATED. The decisions are the guide's own, replayed from the persisted log; the
 * artefacts are what the child built in the studio. Nothing here is the engine's opinion, which is
 * the point: it is the part of the conversation that is not up for debate.
 */
import type { JSX } from "react";
import { EFFORT_EXPECTED, saysFor } from "@gt100k/project-workspace";
import { Look } from "./look.js";

import type { GuideDecision } from "./decisions.js";
import { workForKid } from "./map-evidence.js";
import { specPath } from "./vocab.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

/** A guide's decisions, newest first, named by the specialization they were about. */
export function CoachingLog({
  decisions,
  cards,
}: {
  decisions: readonly GuideDecision[];
  cards: readonly HypothesisCard[];
}): JSX.Element {
  if (decisions.length === 0) {
    return (
      <p className="fhist__none">
        No decisions recorded yet. Promoting, parking or contesting a specialization logs it here.
      </p>
    );
  }

  const named = new Map(cards.map((c) => [c.id, specPath(c.domainPath)]));
  const recent = [...decisions].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <ul className="fhist">
      {recent.map((d) => (
        <li key={`${d.hypothesisId}-${d.at}`}>
          <span className="fhist__when">{shortDate(d.at)}</span>
          <span className="fhist__what">
            <strong>{ACTION_WORD[d.action] ?? d.action}</strong>{" "}
            {named.get(d.hypothesisId) ?? "a specialization no longer tracked"}
          </span>
          {d.reason === undefined ? null : <span className="fhist__why">{d.reason}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * What the child made, under the project it belongs to. The half of the conversation that is not an
 * opinion.
 *
 * NO DATES, because `ChildProject` carries none. Grouping by project is the better answer anyway:
 * "three things, and here is the piece of work they came out of" survives a parent's next question,
 * where a bare dated list does not.
 */
export function MadeHistory({ kidId }: { kidId: string }): JSX.Element {
  const projects = workForKid(kidId).projects.filter((p) => p.made.length > 0);

  if (projects.length === 0) {
    return <p className="fhist__none">Nothing finished yet.</p>;
  }

  return (
    <ul className="fhist fhist--made">
      {projects.map((p) => (
        <li key={p.id}>
          <span className="fhist__what">{p.title}</span>
          <ul className="fhist__made">
            {p.made.map((m) => (
              <li key={m.title}>
                {m.title}
                <Look url={m.url} />
                {/* What stood behind it. Shown only when the record is thin, because the ordinary
                    case needs no comment and a count on every line would train guides to skim it.
                    The sentence carries the innocent reading; see `saysFor`. */}
                {m.behind !== undefined && m.behind.effort < EFFORT_EXPECTED ? (
                  <span className="fhist__behind">
                    {saysFor(m.behind.effort, m.behind.everStuck)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

const ACTION_WORD: Record<string, string> = {
  promote: "Promoted",
  park: "Parked",
  contest: "Contested",
  reopen: "Reopened",
};

/** Dates a parent reads, not timestamps. The day is the only part that matters in this room. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
