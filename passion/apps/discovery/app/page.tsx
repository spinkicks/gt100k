"use client";

// The child-facing discovery surface: forty-four concrete pursuits, flat, on one screen, each one
// offering both something to make and somewhere to read.
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
// thing they can do. This replaced a two-step cabin-then-subtopic wall, which was that walk.
//
// WHERE THE GAMES WENT. They are on the tiles, in the panel, above the links — the merge decision
// was that a pursuit offers BOTH a thing to make and things to read, not one instead of the other.
// A game is opened from the panel rather than by clicking a tile, so the click still selects and
// the child chooses between playing and reading rather than having the choice made for them.
//
// WHAT IS DELIBERATELY ABSENT. No popularity, no "others liked", no recommendation. Salganik's
// 14,341-person experiment showed social influence increases both the inequality AND the
// unpredictability of what succeeds — show a child what other children chose and the return data
// measures a cascade rather than that child. And no reward of any kind: the signal is voluntary
// cross-day return, so anything that manufactures engagement corrupts the thing being read.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";

import { solveVerbFor } from "@gt100k/discovery-catalog";

import { ExternalGlyph } from "./glyphs.js";
import {
  artFor,
  CABIN_LABEL,
  CABINS,
  gamesFor,
  PURSUITS,
  reachableAt,
  resourcesFor,
  shuffled,
  type CabinId,
  type Pursuit,
} from "./model.js";
import { useFittedColumns } from "./useFittedColumns.js";
import { sessionLog, startUplink } from "../runtime/signals/session";
import "./browse.css";

// The games load only when a child opens one — the whole roster (fifteen components, the audio
// engine, chess.js) stays out of the wall's first paint behind this boundary. `ssr: false` because
// a puzzle is a client-only, interactive thing; there is nothing meaningful to render on the server.
const GameLauncher = dynamic(() => import("./GameLauncher"), { ssr: false });

/**
 * Dwell before the panel follows the pointer.
 *
 * Crossing a wall of forty-four sweeps the cursor through a dozen tiles. Without a dwell each one
 * would take the ring and rewrite the panel on the way past, and what the child sees is a flicker.
 */
const HOVER_MS = 90;

/** Ages the surface can be viewed at, to make the floors visible rather than theoretical. */
const AGES = [6, 8, 10, 12, 14] as const;

/**
 * Below this age the names start pinned open.
 *
 * The wall shows pictures and reveals a name when a tile is pointed at, which is the right trade for
 * anyone who can read one: the art scans faster than forty-four words and the name is a 90ms dwell
 * away. It is the wrong trade for a child who cannot yet name the object, because several of these
 * renders are honestly ambiguous — two are telescopes, two are small machines — and a wall of
 * pictures they cannot identify is a wall they have to interview one tile at a time.
 *
 * Memo 07 D1 puts the label channel as most load-bearing exactly where reading is weakest, so this
 * follows the age the child is already being filtered by rather than adding a second thing to set.
 * It is a default and not a lock: the toggle is on the bar in both directions.
 */
const NAMES_ON_BELOW = 10;

export default function DiscoveryPage(): JSX.Element {
  // One seed per page load, so the order is stable while the child is looking at it and different
  // the next time they come. Fixed on the server pass to keep hydration honest.
  //
  // `seed` starts fixed so the server and the first client render agree, then moves once on mount.
  // `ready` gates the offer log through that transition: the pre-hydration order was never on a
  // screen anyone saw, and counting it would report offers that did not happen.
  const [seed, setSeed] = useState(1);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSeed(Math.floor(Math.random() * 2 ** 31) || 1);
    setReady(true);
  }, []);

  // Ship the log if — and only if — an ingest endpoint was configured. A mount-scoped effect so it
  // starts once and tears down on unmount; a no-op when nothing is configured, which is the default
  // in every environment (see `startUplink` / `INGEST_URL`).
  useEffect(() => startUplink(), []);

  const [age, setAge] = useState<number>(10);
  const [cabin, setCabin] = useState<CabinId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // `null` means "follow the age"; once the child touches the toggle their choice sticks, because a
  // preference that silently reverts when some other control moves is worse than no preference.
  const [namesPinned, setNamesPinned] = useState<boolean | null>(null);
  const showNames = namesPinned ?? age < NAMES_ON_BELOW;
  const [offered, setOffered] = useState(0);
  // The gadget id currently mounted over the wall, or null.
  const [playing, setPlaying] = useState<string | null>(null);

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
  const games = useMemo(() => (current ? gamesFor(current.id) : []), [current]);

  // Every tile on screen is an offer, and an offer nobody logged cannot be declined later. Position
  // rides along because it can only be captured now: after the fact there is no way to know where a
  // thing sat, and with the order randomised it is the variable that makes the bias measurable.
  //
  // `recordSurfaced` is idempotent per (session, artifact), so running it on each change carries the
  // position without inflating the count — a re-render is not a second time the child was shown
  // something.
  useEffect(() => {
    if (!ready) return;
    tiles.forEach((t, position) => sessionLog.recordSurfaced(t.id, position));
    setOffered(sessionLog.surfaced().length);
  }, [ready, tiles]);

  // The games shown in the panel are offers too — and unlike the tiles they resolve to catalog
  // artifacts, so THESE are the surfacings a later non-engagement reads as a skip (`deriveSkips`
  // only forms a decline for ids in the crosswalk). Positioned within the play list.
  useEffect(() => {
    if (!ready || games.length === 0) return;
    games.forEach((g, position) => sessionLog.recordSurfaced(g.id, position));
    setOffered(sessionLog.surfaced().length);
  }, [ready, games]);

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

  // Arrow keys move the selection the way the eye expects. A grid a child can only reach with a
  // mouse excludes the ones using a keyboard, and the school-hardware decision quietly also chose
  // mouse-and-trackpad, the harder modality at this age.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const i = tiles.findIndex((t) => t.id === selected);
      if (i < 0) return;
      const delta: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: cols,
        ArrowUp: -cols,
      };
      const d = delta[e.key];
      if (d === undefined) return;
      e.preventDefault();
      const next = tiles[Math.min(Math.max(i + d, 0), tiles.length - 1)];
      if (next) {
        setSelected(next.id);
        gridRef.current
          ?.querySelector<HTMLElement>(`[data-tile="${CSS.escape(next.id)}"]`)
          ?.focus();
      }
    },
    // `cols` belongs here: the fit changes with the viewport and the filter, and without it
    // ArrowDown would jump by a row width the grid no longer has.
    [cols, gridRef, selected, tiles],
  );

  return (
    <main className="browse" data-mood="child" data-names={showNames ? "on" : "off"}>
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
        {/* Presented, not merely offered. Memo 07 D7 records a case where no child found the
            click-only alternative because it was one level in; this is a chip on the same row as
            the filters, in both states, so a child who needs the names can see that they exist. */}
        <button
          type="button"
          className="chip browse__names"
          aria-pressed={showNames}
          onClick={() => setNamesPinned(!showNames)}
        >
          Names
        </button>
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

      {/* A list, which is what it is. `role="grid"` promises rows and gridcells to a screen reader
          that this does not have; claiming a pattern without implementing it describes the screen
          wrongly, which is worse than describing it plainly. A real <ul> also gets a blind child
          the count, announced before they start moving through it. */}
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
        onKeyDown={onKeyDown}
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
              // Roving tabindex: one stop for the whole grid, then arrows inside it. Forty-four tab
              // stops to cross a screen is a keyboard trap with extra steps.
              tabIndex={current === null ? (i === 0 ? 0 : -1) : t.id === current.id ? 0 : -1}
              onMouseEnter={() => pointAt(t.id)}
              onFocus={() => setSelected(t.id)}
              // Click selects rather than navigating: the panel already holds everything behind
              // this tile, and on a touch screen there is no hover to select with.
              onClick={() => setSelected(t.id)}
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

            {/* The generative act, and it leads. A child who wants to do sees the doing first; a
                child who wants to read scrolls a thumb's width. Doing this is not scored, gated, or
                counted back at the child (Rule 4) — it is a door that happens to open onto making. */}
            {games.length > 0 ? (
              <div className="panel__play">
                <p className="panel__play-lead">
                  {games.length === 1 ? "Try it yourself" : "Try one yourself"}
                </p>
                <ul className="panel__play-list">
                  {games.map((g) => (
                    <li key={g.id}>
                      <button
                        type="button"
                        className="panel__play-btn"
                        onClick={() => setPlaying(g.id)}
                      >
                        {g.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

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
                <p className="panel__more">
                  {games.length > 0 ? "Or read about it" : "Where to start"}
                </p>
                <ul className="panel__rows">
                  {resources.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="row"
                        // Following a link out is the one act on the panel worth recording, and it
                        // is attributed to the pursuit the child is standing on — never to the
                        // shelf — so a follow reads as "left THIS tile to learn more".
                        onClick={() => sessionLog.recordSourceFollow(current.id)}
                      >
                        <span className="row__title">{r.title}</span>
                        <ExternalGlyph />
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : games.length > 0 ? null : (
              // Said plainly rather than hidden. A child who picked this deserves to know the
              // product has nothing here yet, instead of a panel that quietly ends. Only shown when
              // there is neither a game nor a link — a tile with a game is not empty.
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
          {ready
            ? `Offered this session: ${offered}. Order is random; which pursuits exist is not.`
            : "\u00a0"}
        </span>
      </footer>

      {/* The game mounts over the wall as a full-screen overlay (see PuzzleHost). Loaded lazily, so
          the wall paid nothing for it until this moment.

          The three callbacks are the whole engagement contract, and each maps to one emitter method:
          `onOpen` reports presence when the child leaves (an `open` with a dwell bucket — without it
          a game the child opened but did not finish reads to `deriveSkips` as a decline); `onSolve`
          is the one record that forms a work-mode cell, tagged with the gadget's crosswalk verb; and
          `onHarder` is that same verb carrying `chosen_challenge`, the voluntary-difficulty depth
          signal. All three are attributed to the gadget id, which is what the crosswalk resolves. */}
      {playing ? (
        <GameLauncher
          gadgetId={playing}
          onExit={() => setPlaying(null)}
          onOpen={(id, activeMs) => sessionLog.recordOpen(id, activeMs)}
          onSolve={(id) => {
            const verb = solveVerbFor(id);
            if (verb) sessionLog.recordAction(id, verb);
          }}
          onHarder={(id) => {
            const verb = solveVerbFor(id);
            if (verb) sessionLog.recordAction(id, verb, ["chosen_challenge"]);
          }}
        />
      ) : null}
    </main>
  );
}
