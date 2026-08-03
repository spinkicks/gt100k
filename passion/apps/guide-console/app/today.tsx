"use client";

// The Today roster: every child as one row, and the view the console lands on. It answers the
// question a guide opens the console with -- who needs me -- before asking anything about a single
// child. Each row shows the same verdict the single-child action line shows (attention.ts), sorted
// so whoever needs the guide floats to the top. Promote acts in place and stays on the roster;
// Review and a plain row click drill into that child's console to investigate.
import type { JSX } from "react";
import { childInitials } from "./console-data.js";
import { orderByAttention, type Attention } from "./attention.js";
import type { ChildSummary, ConsoleController } from "./useConsole.js";

// The verdict word. Kept beside the roster (as the action line keeps its own copy) rather than
// imported from a shared map: three characters of duplication is cheaper than a barrel of shared
// UI strings, and each surface owns the exact wording it puts on screen.
const WORD: Record<Attention["level"], string> = {
  NEEDS_YOU: "Needs you",
  READY: "Ready",
  STEADY: "Steady",
};

// A child whose summary has not been computed yet reads as STEADY, never as an alarm: an absent
// verdict is the absence of a reason to act, not a hidden one. Matches the switcher's fallback.
const STEADY_FALLBACK: ChildSummary = {
  tracked: 0,
  promotableCount: 0,
  topState: null,
  promotableId: null,
  attention: {
    level: "STEADY",
    headline: "Steady. Nothing needs you.",
    reason: "STEADY",
    specId: null,
  },
};

export function TodayRoster({
  ctrl,
  onOpen,
  ingestedCount,
}: {
  ctrl: ConsoleController;
  onOpen: (kidId: string, specId: string | null) => void;
  // How many real sessions have been ingested, for the provenance chip. The label someone checks
  // before deciding what a promote means belongs where the promote is, not one drill-in away.
  ingestedCount: number;
}): JSX.Element {
  const summaryFor = (id: string): ChildSummary => ctrl.summaries.get(id) ?? STEADY_FALLBACK;
  // The same triage order the switcher uses, so the roster and the sidebar never disagree about who
  // is first. Stable within a level: a child does not jump around as the store changes underneath.
  const rows = orderByAttention(ctrl.children, (c) => summaryFor(c.id).attention.level);
  const needing = rows.filter((c) => summaryFor(c.id).attention.level === "NEEDS_YOU").length;

  return (
    <section className="today" aria-label="Today">
      <header className="today__head">
        <div className="today__headrow">
          <h1 className="today__title">Today</h1>
          {/* The same data-provenance chip the child console carries in its sidebar, brought to the
              surface a guide acts on: Promote is one click from every row here, and the label
              someone checks before deciding what a promote means must sit where the promote is, not
              one drill-in away. A false reassurance about provenance is worse than none, so it says
              synthetic plainly. Wording is kept in step with the sidebar chip (console.tsx). */}
          <span className="chip chip--soft">
            {ingestedCount === 0
              ? "Synthetic data only"
              : `Synthetic, plus ${ingestedCount} ingested`}
          </span>
        </div>
        <p className="today__sub">
          {/* Says what the list is sorted by, and how much of it is asking for you, so the order is
              not a mystery the guide has to infer from the dots. */}
          {needing === 0
            ? "Everyone is steady. Nothing needs you right now."
            : `${needing} ${needing === 1 ? "child needs" : "children need"} you first.`}
        </p>
      </header>
      <ul className="today__list">
        {rows.map((c) => {
          const s = summaryFor(c.id);
          const a = s.attention;
          const level = a.level.toLowerCase();
          // Promote only when the gate has genuinely passed AND the store agrees there is a
          // promotable card, so the button never fires an action the engine would refuse -- the same
          // guard the single-child action line uses.
          const canPromote = a.reason === "GATE_READY" && s.promotableId !== null;
          return (
            <li key={c.id} className={`todayrow todayrow--${level}`}>
              {/* The whole meta block is the drill-in target. A row is not itself a <button> because
                  it carries an inline action button, and a button inside a button is invalid; the
                  open affordance and the action are two siblings in a flex row instead. */}
              <button
                type="button"
                className="todayrow__open"
                onClick={() => onOpen(c.id, null)}
                aria-label={`Open ${c.name}'s console`}
              >
                <span className="kid__av" aria-hidden="true">
                  {childInitials(c.name)}
                </span>
                <span className="todayrow__meta">
                  <span className="todayrow__line">
                    <span className="todayrow__name">{c.name}</span>
                    <span className={`kid__flag kid__flag--${level}`}>
                      <span className={`kid__dot kid__dot--${level}`} aria-hidden="true" />
                      <span className="kid__flagword">{WORD[a.level]}</span>
                    </span>
                  </span>
                  <span className="todayrow__headline">{a.headline}</span>
                  <span className="kid__sub kid__sub--muted">
                    {/* "to promote", not "ready": the verdict chip one line up already owns the word
                        "Ready", and printing it again as a lowercase count read as the same fact
                        stuttering. This counts promotable specs (see `promotableCount`), so it agrees
                        with the Promote button and empties the moment a promote lands. */}
                    {s.tracked} tracked
                    {s.promotableCount ? ` · ${s.promotableCount} to promote` : ""}
                  </span>
                </span>
              </button>
              {canPromote ? (
                // Promote commits here and leaves you on the roster; the label says so, because two
                // same-shaped buttons in this slot otherwise read as the same kind of commit.
                <button
                  type="button"
                  className="todayrow__do"
                  onClick={() => ctrl.promoteKid(c.id)}
                  aria-label={`Promote ${c.name}. Acts here; you stay on Today.`}
                  title="Promotes now. You stay on Today."
                >
                  Promote
                </button>
              ) : a.specId !== null ? (
                // Review does NOT commit anything: it opens this child's console to look. The chevron
                // marks it as a move to another view, the one visible difference from Promote's
                // in-place action, so the two buttons stop reading as a matched pair of commits.
                <button
                  type="button"
                  className="todayrow__do todayrow__do--review"
                  onClick={() => onOpen(c.id, a.specId)}
                  aria-label={`Open ${c.name}'s console to review`}
                  title="Opens this child's console"
                >
                  Review
                  <span className="todayrow__go" aria-hidden="true">
                    ›
                  </span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
