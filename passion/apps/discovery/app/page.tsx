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

import { ExternalGlyph, PlayGlyph } from "./glyphs.js";
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
      {/* THE CABINS ARE A SELECT NOW, AND THAT IS AN ARGUMENT RATHER THAN A SPACE SAVING.
       *
       * They were nine buttons across the top, each at the 56px child touch floor, which is the
       * largest and most prominent furniture on a child's screen — spent on eight abstract
       * superordinate words. That contradicts the wall directly beneath them: the only reason it is
       * flat and concrete is that children of this age do not sort superordinate categories
       * reliably, which is the whole Hutchinson finding. Putting "Words & Persuasion" in 56px type
       * above a photograph of a typewriter argues with the photograph.
       *
       * THE OBJECTION, AND WHY IT DOES NOT HOLD. Hiding things behind a control is exactly what
       * failed in that study: zero of twelve first-graders found "More Choices". But that control
       * hid CONTENT. This one only narrows a wall that is already complete — a child who never
       * opens it sees all forty-four, which is the default and the recommended state. Nothing
       * becomes unreachable by ignoring it, so the lesson does not transfer.
       *
       * It also fixes a real defect: nine chips could not hold one row below 1600px, and a wrapped
       * bar cost the panel a 60px row at every laptop size. */}
      <header className="browse__bar">
        <p className="browse__lede">Find something worth getting good at.</p>

        <div className="browse__view">
          <label className="browse__pick">
            Show
            <select
              value={cabin ?? "all"}
              onChange={(e) =>
                setCabin(e.target.value === "all" ? null : (e.target.value as CabinId))
              }
            >
              <option value="all">Everything</option>
              {CABINS.map((c) => (
                <option key={c} value={c}>
                  {CABIN_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          {/* Presented, not merely offered. Memo 07 D7 records a case where no child found the
              click-only alternative because it was one level in; this sits on the bar in both
              states, so a child who needs the names can see that they exist. */}
          <button
            type="button"
            className="chip"
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
        </div>
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

      {/* Always mounted, so the wall does not shift sideways the first time a child points.
       *
       * ORDERED BY WHAT A CHILD NEEDS NEXT, which is not the order these facts were written in.
       * The name and the one line answer "what is this". The game is the only thing on the panel
       * that can be done right now, so it comes before anything that leaves the site. The shelf is
       * where to go if reading is the answer. The venue sits last, because "who will eventually
       * judge you" is the long-run frame rather than a next step — it used to be third from the
       * top, in a box identical to the links, which made it read as a fifth place to click. */}
      <aside className="panel" aria-live="polite">
        {current === null ? (
          // Teaches the surface rather than reporting that it is empty. This is the first thing a
          // child sees, so it says what the wall is and what the two controls above it do.
          <div className="prompt">
            <p className="prompt__lead">Point at anything.</p>
            <p className="prompt__body">
              Everything here is something a person can really get good at. Nothing is locked and
              nothing is scored, so you can wander.
            </p>
            <p className="prompt__body">
              <strong>Show</strong> narrows the wall to one kind of thing. <strong>Names</strong>{" "}
              labels all of them at once, so you do not have to point at each one to find out.
            </p>
          </div>
        ) : (
          <article className="card">
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

            {/* The only thing on this panel that happens HERE rather than somewhere else, so it is
                the only thing that gets the accent. Doing it is not scored, gated, or counted back
                at the child (Rule 4) — it is a door that happens to open onto making. */}
            {games.length > 0 ? (
              <div className="panel__play">
                {games.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="play u-primary-target"
                    onClick={() => setPlaying(g.id)}
                  >
                    <PlayGlyph />
                    <span>{g.label}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {resources.length > 0 ? (
              <section className="panel__sect">
                <h3 className="panel__label">
                  {games.length > 0 ? "Or read about it" : "Where to start"}
                </h3>
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
              </section>
            ) : games.length > 0 ? null : (
              // Said plainly rather than hidden. A child who picked this deserves to know the
              // product has nothing here yet, instead of a panel that quietly ends. Only shown when
              // there is neither a game nor a link — a tile with a game is not empty.
              <p className="panel__empty">Nothing here yet. Try another one.</p>
            )}

            {/* Who will tell this child they are getting better. Named, because a pursuit with no
                venue is a topic, and because the child should be able to see that the judge is real
                and is not us. Deliberately not a `.row`: it is a fact with a link in it, not an
                errand, and rendering it as one more grey box was most of why the panel read as a
                pile of buttons. */}
            <footer className="judge">
              {/* Lead and cost on one line. Three stacked lines put this block below the fold on any
                  pursuit with a long shelf, and the block is the external-validation claim. */}
              <p className="judge__lead">
                Who says you are good at it
                <span className="judge__meta">
                  from age {current.minAge}
                  {current.costUsd === 0 ? " · free" : ` · about $${current.costUsd}/yr`}
                </span>
              </p>
              <a
                className="judge__who"
                href={current.venue.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                <span>{current.venue.name}</span>
                <ExternalGlyph />
              </a>
            </footer>
          </article>
        )}
      </aside>

      {/* Two audiences on one line, and they used to be set identically.
       *
       * The left half is for the child: it is the only thing on the screen that explains why the
       * wall is missing eight things, and without it the gap reads as the product being small. The
       * right half is instrumentation for whoever is evaluating the measurement. Setting them at
       * the same size and colour was the clearest single tell that nobody had decided who this
       * surface is talking to. */}
      <footer className="browse__meter">
        <p className="meter__count">
          Showing <strong>{tiles.length}</strong> of <strong>{PURSUITS.length}</strong>
          {hidden > 0 ? (
            <>
              {" "}
              · <strong>{hidden}</strong> need you to be older
            </>
          ) : null}
        </p>
        <p className="meter__note">
          {ready ? `${offered} offered this session · order random, roster fixed` : "\u00a0"}
        </p>
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
