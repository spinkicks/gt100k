/**
 * Every specialization as one bar, so a guide can see the shape of a child in a glance.
 *
 * WHY BARS. The tab used to be a wall of equal-sized cards, one per tracked specialization, each
 * carrying a number printed as `Lower-bound: 0.80`. Two problems. A guide had to read every card to
 * find out which mattered, because nothing was ranked and everything looked equally important. And
 * the number was printed rather than drawn, so comparing three of them meant reading three decimals
 * and holding them in your head. A bar is the one chart that answers "which is biggest" without
 * being read.
 *
 * HOLLOW MEANS NOT YET CONFIDENT. `confident` is the store's own flag for whether enough distinct
 * days of evidence have accumulated to mean anything, and it is the single most important thing on
 * this screen: a tall bar on three hours of one afternoon and a tall bar on six weeks look identical
 * as numbers and must not look identical here. Fill carries it, and the word carries it too, because
 * a difference in fill alone is a difference nobody sees.
 *
 * WHAT IT IS NOT. Not a score, and not comparable across children. The bar is the LOWER BOUND of a
 * Beta posterior — deliberately the pessimistic end — and GC1 forbids collapsing a child into one
 * number. Three bars for one child answer "which of these, for this child"; they do not answer "how
 * interested is this child" and nothing here should invite that reading.
 */
import type { JSX } from "react";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

import { modeLabel, specPath } from "./vocab.js";

/**
 * How many get a full card underneath.
 *
 * Three, because the point of ranking is that the top of the list is where a guide should spend
 * their attention, and a "top" that includes most of the list is not a top. A child with four
 * tracked specializations gets three cards and one bar, which is the intended pressure.
 */
const DETAILED = 3;

export function HypothesisBars({
  cards,
  selectedId,
  onPick,
}: {
  cards: readonly HypothesisCard[];
  selectedId: string | null;
  onPick: (id: string) => void;
}): JSX.Element | null {
  if (cards.length === 0) return null;

  // Tallest first. The store returns them in insertion order, which is an accident of when a child
  // happened to touch each area and carries no meaning for a guide.
  const ranked = [...cards].sort((a, b) => b.lowerBound - a.lowerBound);

  return (
    <section className="bars" aria-label="Tracked specializations">
      <ul className="bars__list">
        {ranked.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className={`bar${selectedId === c.id ? " bar--on" : ""}`}
              onClick={() => onPick(c.id)}
              // The number is read out, because the bar is invisible to a screen reader and the
              // fill state is the one distinction that must never be carried by looks alone.
              aria-label={`${specPath(c.domainPath)}, ${modeLabel(c.mode)}, ${Math.round(c.lowerBound * 100)} out of 100, ${
                c.confident ? "enough evidence to rely on" : "not enough evidence yet"
              }`}
            >
              {/* The mode rides along, because a topic tracked under two work-styles is two
                  different hypotheses. Without it three of Demo Child's six bars read identically
                  and a guide has no way to tell which row they just clicked. */}
              <span className="bar__name">
                {specPath(c.domainPath)}
                <span className="bar__mode">{modeLabel(c.mode)}</span>
              </span>
              <span className="bar__track">
                <span
                  className={`bar__fill${c.confident ? "" : " bar__fill--thin"}`}
                  style={{ width: `${Math.max(2, Math.round(c.lowerBound * 100))}%` }}
                />
              </span>
              <span className="bar__note">{c.confident ? "" : "needs more"}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The cards worth showing in full: the top few by lower bound, in the same order as the bars. */
export function detailed(cards: readonly HypothesisCard[]): readonly HypothesisCard[] {
  return [...cards].sort((a, b) => b.lowerBound - a.lowerBound).slice(0, DETAILED);
}
