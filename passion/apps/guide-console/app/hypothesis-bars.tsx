/**
 * Every specialization as one column, so a guide sees the shape of a child in a glance.
 *
 * WHY COLUMNS AND NOT ROWS. This was a stack of full-width horizontal rows, one per specialization,
 * each about 34px tall. Six of them filled a third of the screen before a single card; forty of them
 * — which is what a child who has genuinely explored the catalogue produces — would be a scroll of
 * over 1300px with nothing else on it. Turned on its side the same forty fit in one band about 90px
 * tall, and comparing heights along a shared baseline is easier than comparing bar lengths stacked
 * down a page anyway.
 *
 * WHY LABELS ARE NOT UNDER EVERY COLUMN. At forty columns a label is about 30px wide, which fits no
 * word worth reading. The top few are named because those are the ones a guide acts on; the rest
 * answer on hover and on focus, and the accessible name on every column carries the full text
 * regardless. That is the same trade the discovery wall makes for the same reason.
 *
 * HOLLOW MEANS NOT YET CONFIDENT. `confident` is the store's flag for whether enough distinct days
 * have accumulated to mean anything, and it is the most important thing here: a tall column built on
 * one afternoon and a tall column built on six weeks are identical as numbers. Hatching carries it,
 * and so does the accessible name, because fill alone is a difference nobody sees.
 *
 * WHAT IT IS NOT. Not a score, and not comparable across children. Each column is the LOWER BOUND of
 * a Beta posterior — the pessimistic end — and GC1 forbids collapsing a child into one number.
 * Columns for one child answer "which of these, for this child". They do not answer "how interested
 * is this child" and nothing here should invite that reading.
 */
import type { JSX } from "react";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

import { modeLabel, specPath } from "./vocab.js";

/**
 * How many get a full card underneath.
 *
 * Three, because the point of ranking is that the top is where attention should go, and a "top" that
 * includes most of the list is not a top.
 */
const DETAILED = 3;

/** How many columns get a printed label, when there is room for one at all. */
const LABELLED = 3;

/**
 * Past this many columns nothing gets a printed label.
 *
 * A label needs roughly 50px to hold a readable word. At forty columns a column is about 20px, and
 * "Music Theory" wraps into a stack of three-character fragments that is worse than no label. The
 * top three are named in full on the cards directly below, every column answers on hover and on
 * focus, and the accessible name always carries the whole thing — so dropping the print costs a
 * sighted guide nothing they cannot get by pointing at it.
 */
const LABEL_UP_TO = 10;

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

  // Tallest first. The store returns insertion order, which records when a child happened to touch
  // each area and means nothing to a guide.
  const ranked = [...cards].sort((a, b) => b.lowerBound - a.lowerBound);

  return (
    <section className="bars" aria-label="Tracked specializations">
      <ol className="bars__plot" style={{ "--n": ranked.length } as React.CSSProperties}>
        {ranked.map((c, i) => {
          const pct = Math.max(3, Math.round(c.lowerBound * 100));
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`hbar${selectedId === c.id ? " hbar--on" : ""}`}
                onClick={() => onPick(c.id)}
                // Everything the column shows visually, said in words. A screen reader gets no
                // height and no hatching, and the confidence distinction is the one that must never
                // depend on looks.
                aria-label={`${specPath(c.domainPath)}, ${modeLabel(c.mode)}, ${pct} out of 100, ${
                  c.confident ? "enough evidence to rely on" : "not enough evidence yet"
                }`}
                title={`${specPath(c.domainPath)} · ${modeLabel(c.mode)}`}
              >
                <span className="hbar__track">
                  <span
                    className={`hbar__fill${c.confident ? "" : " hbar__fill--thin"}`}
                    style={{ height: `${pct}%` }}
                  />
                </span>
                {/* Only where there is room. Everything else is on hover, on focus and in the
                    accessible name. The figure is printed on every labelled column rather than only
                    the top few, because a bar whose height a guide is reading should say what the
                    height is -- and it is the same number, in the same format, as the card below. */}
                <span className="hbar__name" aria-hidden="true">
                  {ranked.length <= LABEL_UP_TO ? (
                    <>
                      <span className="hbar__pct">{pct}%</span>
                      {i < LABELLED ? shortName(c.domainPath) : ""}
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="bars__key">
        Tallest first. Striped means not enough evidence yet. Click one to open it.
      </p>
    </section>
  );
}

/**
 * The subtopic in a guide's words. "Code & Computers › Game Dev" does not fit a column; "Game Dev"
 * does.
 *
 * Taken off the END of the display path rather than off the raw domain path, which was the bug
 * here: `path[1]` is the taxonomy id, so columns were labelled "music-th..." and "game-dev" instead
 * of "Music Theory" and "Game Dev".
 */
function shortName(path: readonly string[]): string {
  const parts = specPath(path).split("\u203a");
  return (parts[parts.length - 1] ?? "").trim();
}

/** The cards worth showing in full: the top few by lower bound, in the same order as the columns. */
export function detailed(cards: readonly HypothesisCard[]): readonly HypothesisCard[] {
  return [...cards].sort((a, b) => b.lowerBound - a.lowerBound).slice(0, DETAILED);
}
