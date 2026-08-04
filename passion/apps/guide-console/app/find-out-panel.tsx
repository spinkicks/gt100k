/**
 * What to find out, as the counterpart to what to offer next.
 *
 * WHY BOTH EXIST. "What to offer next" answers a question the logs can answer: which areas has this
 * child not been given a fair chance at. This panel answers the ones they cannot. A log records that
 * a child came back; it cannot record whose idea it was, whether they felt able to stop, or what
 * they would be doing if nobody had signed them up. Those are the questions that actually separate
 * the child you should feed from the child you should intervene on, and the only instrument that
 * reads them is a guide asking.
 *
 * WHY IT IS NOT A DETECTOR. The ask was for something that tells a guide whether a child is over- or
 * under-motivated. Across 94 studies and 1,308 effect sizes, harmonious and obsessive passion
 * correlate with deliberate practice indistinguishably, obsessive slightly more — so the axis an
 * adult would use carries no information, and a grid built on it flags the absorbed child and misses
 * the pressured one. See `@gt100k/motivation` for the full argument. What is here instead is two
 * tests a guide runs in the world and a set of moves aimed at the grown-ups.
 *
 * WHY THE MOVES POINT AT ADULTS. The only controlled child evidence in this literature works that
 * way: coaches trained to cut punitive control and raise reinforcement saw next-season dropout fall
 * from 26% to 5%, with no change in win-loss records. Nothing was done to the children.
 */
import type { JSX } from "react";
import { PROBES, movesFor, ranked, type AdultMove } from "@gt100k/motivation";

import { specPath } from "./vocab.js";

/** Which domain's moves to show, from the selected specialization. */
function domainOf(path: readonly string[] | undefined): string {
  return path?.[1] ?? "";
}

export function FindOutPanel({
  domainPath,
}: {
  domainPath?: readonly string[];
}): JSX.Element {
  const moves = ranked(movesFor(domainOf(domainPath)));

  return (
    <section className="findout" aria-label="What to find out">
      <p className="findout__lede">
        The console can see what they did. It cannot see whose idea it was, or whether they feel
        able to stop. Those you have to ask.
      </p>

      <span className="planproject__k">Two things to try</span>
      <ul className="findout__probes">
        {PROBES.map((p) => (
          <li key={p.id}>
            <details>
              <summary className="findout__title">{p.title}</summary>
              <p className="findout__how">{p.how}</p>
              <p className="findout__why">{p.why}</p>
              <ul className="findout__readings">
                {p.readings.map((r) => (
                  <li key={r.ifYouSee}>
                    <strong>{r.ifYouSee}.</strong> {r.consistentWith}
                  </li>
                ))}
              </ul>
              {/* Never folded away and never optional. A probe read as a detector is worse than no
                  probe, because it launders one observation into a claim about a child. */}
              <p className="findout__cannot">
                <strong>What it cannot tell you:</strong> {p.cannotTell}
              </p>
            </details>
          </li>
        ))}
      </ul>

      <span className="planproject__k">
        If something needs changing, change it in the adults first
        {domainPath === undefined ? null : <> ({specPath(domainPath)})</>}
      </span>
      {/* Titles first, reasoning one click away. Rendered flat, all six carried about five hundred
          words and a guide with six children and ten minutes reads none of it. The title and the
          grade are what choose a move; the argument behind it is what you read once, if at all. */}
      <ul className="findout__moves">
        {moves.map((m, i) => (
          <li key={m.id}>
            <details open={i === 0}>
              <summary className="findout__moveTop">
                <strong>{m.title}</strong>
                <Grade m={m} />
              </summary>
              <p className="findout__does">{m.does}</p>
              <p className="findout__why">{m.why}</p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * How much the suggestion is worth, on the suggestion.
 *
 * Without this a move from a controlled trial in children and a move we reasoned out over lunch look
 * identical on screen, and a guide has no way to spend their one bit of effort on the better one.
 * `reasoned` is styled as the weakest for the same reason the mastery map marks a `model` ordering.
 */
function Grade({ m }: { m: AdultMove }): JSX.Element {
  const label =
    m.grade === "controlled-in-children"
      ? "Tested in children"
      : m.grade === "correlational-or-older-sample"
        ? "Suggested by research"
        : "Our own reasoning";
  return <span className={`chip chip--basis chip--grade-${m.grade}`}>{label}</span>;
}
