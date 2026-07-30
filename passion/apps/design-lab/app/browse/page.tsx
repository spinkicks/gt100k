"use client";

// The child-facing discovery wall: forty-four concrete pursuits, flat, on one screen.
//
// WHY FLAT, AND WHY THIS MANY. Hutchinson, Bederson & Druin ran the closest thing to this product
// that exists — 36 children aged 6-11, a children's digital library, a 14-category hierarchy
// replaced by 44 flat concrete categories. The flat version was faster in EVERY grade, needed 116
// hints against 221, and produced 224 exploratory queries against 104. Nineteen children preferred
// it and four preferred the tree. They had already tried fixing the hierarchy by narrowing it to
// six top-level categories and that failed too, which is the finding: the problem was never
// branching factor, it was abstraction. Only about half of kindergarteners and first-graders sort
// superordinate categories taxonomically at all, while they sort basic-level ones like adults by
// three. Their flat version was a ring of category ICONS rather than a list of words, which is why
// the tiles here carry art; `browse.css` has the rest of that argument.
//
// WHY NO PAGING, EVER. In the same study, of twelve first-graders, ZERO found the "More Choices"
// control unaided. Anything behind a pager does not exist for the youngest half of the band — and
// a pursuit a child never sees produces no signal, which is a silent hole in the measurement rather
// than a mere usability cost. Whatever is on this screen is, for a small child, the whole world.
//
// WHY THE CABINS ARE CHIPS AND NOT A STEP. They remain the model's coordinate system: a belief has
// to live in a cell coarse enough to accumulate evidence, and the surfacing engine pays maintenance
// debts per domain. None of that requires making a child walk through the abstraction to reach a
// thing they can do.
//
// WHAT IS DELIBERATELY ABSENT. No popularity, no "others liked", no recommendation. Salganik's
// 14,341-person experiment showed social influence increases both the inequality AND the
// unpredictability of what succeeds — show a child what other children chose and the return data
// measures a cascade rather than that child. And no reward of any kind: the signal is voluntary
// cross-day return, so anything that manufactures engagement corrupts the thing being read.
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";

import { ExternalGlyph } from "./glyphs.js";
import { useFittedColumns } from "./useFittedColumns.js";
import {
  artFor,
  CABIN_LABEL,
  CABINS,
  PURSUITS,
  reachableAt,
  resourcesFor,
  shuffled,
  type CabinId,
  type Pursuit,
} from "./model.js";
import "./browse.css";

/**
 * Dwell before the panel follows the pointer.
 *
 * Crossing a wall of forty-four sweeps the cursor through a dozen tiles. Without a dwell each one
 * would take the ring and rewrite the panel on the way past, and what the child sees is a flicker.
 */
const HOVER_MS = 90;

/** Ages the prototype can be viewed at, to make the floors visible rather than theoretical. */
const AGES = [6, 8, 10, 12, 14] as const;

export default function BrowsePage(): JSX.Element {
  const [seed, setSeed] = useState(1);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 2 ** 31) || 1);
    setReady(true);
  }, []);

  const [age, setAge] = useState<number>(10);
  const [cabin, setCabin] = useState<CabinId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Age first, then cabin. Age is a hard filter because the alternative is showing a child a door
  // that is locked; cabin is a soft one the child chose.
  const tiles = useMemo(() => {
    const byAge = reachableAt(age, PURSUITS);
    const byCabin = cabin === null ? byAge : byAge.filter((p) => p.cabin === cabin);
    return shuffled(byCabin, seed);
  }, [age, cabin, seed]);

  const hidden = PURSUITS.length - reachableAt(age, PURSUITS).length;

  const current: Pursuit | null =
    selected === null ? null : (tiles.find((t) => t.id === selected) ?? null);
  const resources = useMemo(() => (current ? resourcesFor(current) : []), [current]);

  const { ref: gridRef, cols, tileW, labelFontPx } = useFittedColumns(tiles.length);
  const hoverTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    },
    [],
  );

  const pointAt = useCallback((id: string): void => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setSelected(id), HOVER_MS);
  }, []);

  const cancelPoint = useCallback((): void => {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  }, []);

  return (
    <main className="browse" data-mood="child">
      <header className="browse__bar">
        {/* biome-ignore lint/a11y/useSemanticElements: <fieldset> groups form controls, and these
            are filters outside any form; its UA groove border and min-inline-size would also
            reshape the wrapping chip row. */}
        <div className="browse__facets" role="group" aria-label="Filter by area">
          <button
            type="button"
            className="chip"
            aria-pressed={cabin === null}
            onClick={() => setCabin(null)}
          >
            Everything
          </button>
          {CABINS.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              aria-pressed={cabin === c}
              onClick={() => setCabin(cabin === c ? null : c)}
            >
              {CABIN_LABEL[c]}
            </button>
          ))}
        </div>
        <label className="browse__age">
          Age
          <select value={age} onChange={(e) => setAge(Number(e.target.value))}>
            {AGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      </header>

      <ul
        className="browse__grid"
        aria-label={cabin === null ? "Things to try" : CABIN_LABEL[cabin]}
        ref={gridRef}
        style={
          {
            "--cols": cols,
            "--tile-w": `${tileW}px`,
            "--label-font": `${labelFontPx}px`,
          } as React.CSSProperties
        }
        onMouseLeave={cancelPoint}
      >
        {tiles.map((t, i) => (
          <li key={t.id}>
            <button
              type="button"
              data-tile={t.id}
              className="tile"
              data-cabin={t.cabin}
              aria-current={t.id === current?.id}
              tabIndex={current === null ? (i === 0 ? 0 : -1) : t.id === current.id ? 0 : -1}
              onMouseEnter={() => pointAt(t.id)}
              onFocus={() => setSelected(t.id)}
            >
              {/* Empty alt, deliberately: the picture and the word name the same thing, so
                  describing it would make a screen reader say everything twice.

                  A plain `img` and not `next/image`, because these are forty-four local files that
                  are already sized and already compressed, and routing them through the optimiser
                  buys nothing an export can use. */}
              <img
                className="tile__art"
                src={artFor(t)}
                alt=""
                width={480}
                height={320}
                decoding="async"
              />
              <span className="tile__label">{t.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Always mounted, so the wall does not shift sideways the first time a child points. */}
      <aside className="panel" aria-live="polite">
        {current === null ? (
          <p className="panel__prompt">Point at anything to see what it is.</p>
        ) : (
          <>
            <img
              className="panel__art"
              src={artFor(current)}
              alt=""
              width={480}
              height={320}
              decoding="async"
            />
            <h2 className="panel__title">{current.label}</h2>
            <p className="panel__blurb">{current.blurb}</p>

            {/* Who will tell this child they are getting better. Named, because a pursuit with no
                venue is a topic, and because the child should be able to see the judge is real and
                is not us. */}
            <p className="panel__more">Who says you are good at it</p>
            <a className="row" href={current.venue.url} target="_blank" rel="noreferrer noopener">
              <span className="row__title">{current.venue.name}</span>
              <ExternalGlyph />
            </a>
            <p className="panel__meta">
              From age {current.minAge}
              {current.costUsd === 0 ? " · free" : ` · about $${current.costUsd} a year`}
            </p>

            {resources.length > 0 ? (
              <>
                <p className="panel__more">Where to start</p>
                <ul className="panel__rows">
                  {resources.map((r) => (
                    <li key={r.id}>
                      <a href={r.url} target="_blank" rel="noreferrer noopener" className="row">
                        <span className="row__title">{r.title}</span>
                        <ExternalGlyph />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="panel__empty">Nothing here yet. Try another one.</p>
            )}
          </>
        )}
      </aside>

      <footer className="browse__meter">
        <span>
          Showing <strong>{tiles.length}</strong> of <strong>{PURSUITS.length}</strong>
          {hidden > 0 ? (
            <>
              {" "}
              · <strong>{hidden}</strong> need you to be older
            </>
          ) : null}
        </span>
        <span className="browse__meter-note">
          {ready ? "Order is random per session; which pursuits exist is not." : "\u00a0"}
        </span>
      </footer>
    </main>
  );
}
