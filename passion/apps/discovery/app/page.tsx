"use client";

// A browse prototype for the child-facing surface, in the shape of a Kaleidescape covers wall.
//
// WHAT IS TAKEN FROM THE REFERENCE: a dense grid on a dark ground, content edge to edge with almost
// no chrome, one selected tile ringed in a bright colour, and a panel that names the selection and
// says one line about it. The posture is the valuable part — everything is on offer, nothing is
// gated, nothing is recommended at you, and the interface gets out of the way.
//
// WHAT IS DELIBERATELY NOT TAKEN, and why each one would cost us something:
//
//   The shuffle. Kaleidescape reorders around whatever you linger on, which makes it a recommender:
//   the choice set changes per child and per moment, so a decline and a never-shown become the same
//   log line and E4 stops being identifiable. Here the order is random per session and the MEMBERSHIP
//   IS FIXED. Random order is better than a fixed one, because it decorrelates position from
//   content. Random membership would be trigger-and-abandon, which finishes below never-triggered.
//
//   Poster art. A movie poster's entire job is to out-compete the poster beside it. Javora (2019),
//   ages 9-11: same content at two aesthetic treatments, the prettier chosen 62% of the time,
//   d > 0.86, with no learning benefit. Tiles here are uniform by construction — one glyph
//   vocabulary, one stroke weight, and hue varying at CONSTANT LIGHTNESS AND CHROMA in OKLCH, so
//   cabins are distinguishable without any of them being nicer to look at.
//
//   The density. A wall of fifty is a conjunction-search display, and Patall's optimum is 3-5 per
//   choice moment. But the robust finding in that paper is not about options per screen at all: it
//   is 2-4 SUCCESSIVE choices at d = 0.61 against d = 0.21 for one. So this is a sequence — cabin,
//   then subtopic, then resource. Three moments, each small, and far more than fifty things reachable.
import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import dynamic from "next/dynamic";

import { solveVerbFor } from "@gt100k/discovery-catalog";

import { CabinGlyph, ExternalGlyph } from "./glyphs.js";
import {
  CABIN_TILES,
  gamesForCell,
  resourcesFor,
  shuffled,
  subtopicTiles,
  type Tile,
} from "./model.js";
import { sessionLog, startUplink } from "../runtime/signals/session";
import "./browse.css";

// The games load only when a child opens one — the whole roster (fifteen components, the audio
// engine, chess.js) stays out of the wall's first paint behind this boundary. `ssr: false` because
// a puzzle is a client-only, interactive thing; there is nothing meaningful to render on the server.
const GameLauncher = dynamic(() => import("./GameLauncher"), { ssr: false });

type Step = "cabin" | "subtopic";

export default function BrowsePage(): JSX.Element {
  // One seed per page load, so the order is stable while the child is looking at it and different
  // the next time they come. Fixed on the server pass to keep hydration honest.
  //
  // `seed` starts fixed so the server and the first client render agree, then moves once on mount.
  // `ready` gates the offer log through that transition: the pre-hydration order was never on a
  // screen anyone saw, and counting it would report eight offers that did not happen.
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

  const [cabin, setCabin] = useState<Tile | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // The meter's two numbers, mirrored into React state because the log itself lives in localStorage
  // and is not reactive: `offered` is snapshotted from `sessionLog.surfaced()` right after each
  // surfacing effect writes, and `screens` counts the distinct browse screens seen.
  const [offered, setOffered] = useState(0);
  const [screens, setScreens] = useState<ReadonlySet<string>>(() => new Set());
  // The gadget id currently mounted over the wall, or null. A game is opened from the panel, not by
  // clicking a tile: the tile selects, the panel is where the child sees both what to play and where
  // to read, and chooses between them. That is the merge — the game as the generative act, the
  // curated links beside it — rather than a game that hijacks the click.
  const [playing, setPlaying] = useState<string | null>(null);

  const step: Step = cabin === null ? "cabin" : "subtopic";
  const tiles = useMemo(
    () => shuffled(cabin === null ? CABIN_TILES : subtopicTiles(cabin.cabin), seed),
    [cabin, seed],
  );

  // Every tile on screen is an offer, and an offer nobody logged cannot be declined later. Position
  // rides along because it can only be captured now: after the fact there is no way to know where a
  // thing sat, and with the order randomised it is the variable that makes the bias measurable.
  //
  // `recordSurfaced` is idempotent per (session, artifact), so running it on each render carries the
  // position without inflating the count — a re-render is not a second time the child was shown
  // something. The `setOffered`/`setScreens` snapshots exist only for the meter; the log itself
  // lives in localStorage, not React state.
  const screenKey = `${step}:${cabin?.id ?? "root"}:${seed}`;
  useEffect(() => {
    if (!ready) return;
    tiles.forEach((t, position) => sessionLog.recordSurfaced(t.id, position));
    setScreens((prev) => (prev.has(screenKey) ? prev : new Set(prev).add(screenKey)));
    setOffered(sessionLog.surfaced().length);
    setSelected(tiles[0]?.id ?? null);
  }, [ready, screenKey, tiles]);

  const current = tiles.find((t) => t.id === selected) ?? tiles[0] ?? null;
  const resources = useMemo(
    () =>
      cabin && current && step === "subtopic"
        ? resourcesFor(cabin.cabin, current.id.split("/")[1] ?? "")
        : [],
    [cabin, current, step],
  );

  // The games at the cell the child is looking at. At subtopic level that is the selected leaf; at
  // cabin level it is the cabin itself, which surfaces the one cabin-level gadget (gear-train under
  // Making & Building) that has no subtopic to live under. Most cells have one game, a few have up
  // to four; membership is fixed, order is the registry's.
  const games = useMemo(() => {
    if (!current) return [];
    return step === "subtopic"
      ? gamesForCell(current.cabin, current.id.split("/")[1] ?? "")
      : gamesForCell(current.cabin);
  }, [current, step]);

  // The games shown in the panel are offers too — and unlike the topic tiles they resolve to
  // catalog artifacts, so THESE are the surfacings a later non-engagement reads as a skip
  // (`deriveSkips` only forms a decline for ids in the crosswalk). Positioned within the play list.
  useEffect(() => {
    if (!ready || games.length === 0) return;
    games.forEach((g, position) => sessionLog.recordSurfaced(g.id, position));
    setOffered(sessionLog.surfaced().length);
  }, [ready, games]);

  const gridRef = useRef<HTMLUListElement>(null);
  // Follows the count so the grid fills the screen rather than stranding one short row against a
  // half-empty wall. The reference's density is most of what makes it feel like a library, and a
  // visible hole where a tile should be reads as something failing to load.
  //
  // Chosen to leave no gap: three across in one row beats two-and-a-orphan, four goes two-by-two.
  const columns =
    tiles.length <= 2 ? tiles.length : tiles.length === 4 ? 2 : tiles.length <= 6 ? 3 : 4;

  // Arrow keys move the selection the way the eye expects; Enter opens. A grid a child can only
  // reach with a mouse excludes the ones using a keyboard, and `PROJECT.md` records that the school
  // hardware decision quietly also chose mouse-and-trackpad, the harder modality at this age.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const i = tiles.findIndex((t) => t.id === selected);
      if (i < 0) return;
      const delta: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: columns,
        ArrowUp: -columns,
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
    // `columns` belongs here: it changes between levels, and without it ArrowDown would jump by
    // the previous screen's row width after drilling in.
    [columns, selected, tiles],
  );

  const open = (t: Tile): void => {
    if (step === "cabin") {
      setCabin(t);
      return;
    }
    // At subtopic level the tile is already open: its links are in the panel. There is nowhere
    // further to click, because the next step leaves the product.
    setSelected(t.id);
  };

  return (
    <main className="browse" data-mood="child">
      <header className="browse__bar">
        <button
          type="button"
          className="browse__back"
          onClick={() => {
            setCabin(null);
            setSelected(null);
          }}
          disabled={cabin === null}
        >
          All topics
        </button>
        {cabin ? <span className="browse__crumb">{cabin.label}</span> : null}
        <p className="browse__hint">
          {cabin === null ? "Pick anything. You can come back." : "Pick one to see where to start."}
        </p>
      </header>
      {/* A list, which is what it is. `role="grid"` was the first attempt and it promises rows and
          gridcells to a screen reader that this does not have; claiming a pattern without
          implementing it describes the screen wrongly, which is worse than describing it plainly.
          A real <ul> also gets a blind child something the others could not: the count, announced
          before they start moving through it. */}
      <ul
        className="browse__grid"
        aria-label={cabin === null ? "Topics" : `Inside ${cabin.label}`}
        ref={gridRef}
        onKeyDown={onKeyDown}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {tiles.map((t, i) => (
          <li key={t.id}>
            <button
              type="button"
              data-tile={t.id}
              className="tile"
              data-cabin={t.cabin}
              aria-current={t.id === current?.id}
              // Roving tabindex: one stop for the whole grid, then arrows inside it. Thirty-two tab
              // stops to cross a screen is a keyboard trap with extra steps.
              tabIndex={t.id === current?.id ? 0 : -1}
              onFocus={() => setSelected(t.id)}
              onClick={() => open(t)}
            >
              {t.image ? (
                // Decorative. The label beside it already names the tile, so alt text here would
                // make a screen reader announce every tile twice.
                // A plain <img> rather than next/image on purpose: the optimiser would re-encode
                // these, and the prototype exists to look at the art as it was generated. They are
                // already WebP at render size, 19.8 MB of PNG down to 0.29 MB for all twelve.
                <img className="tile__art" src={t.image} alt="" loading="lazy" decoding="async" />
              ) : step === "cabin" ? (
                // The fallback where no art exists yet. Memo 07 §2.5: an icon works when it depicts
                // the referent, and nothing depicts "3D Modelling" as against "Animation" —
                // repeating the cabin's glyph across its subtopics would put the same picture on
                // every tile and discriminate nothing. Below the cabin the word does the work.
                <CabinGlyph cabin={t.cabin} />
              ) : null}
              <span className="tile__label">{t.label}</span>
              {/* Position is shown because this is a prototype and the measurement is the point. It
                would not appear in the product. */}
              <span className="tile__pos" aria-hidden="true">
                {i + 1}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {current ? (
        <aside className="panel" aria-live="polite">
          <h2 className="panel__title">{current.label}</h2>
          <p className="panel__blurb">{current.blurb}</p>

          {/* The generative act, and it leads. The merge decision was that a cell offers BOTH a
              thing to make and things to read, not one instead of the other — so the game is not
              buried under a link list, and the links are not hidden behind the game. A child who
              wants to do sees the doing first; a child who wants to read scrolls a thumb's width.
              Doing this is not scored, gated, or counted back at the child (Rule 4) — it is just a
              door that happens to open onto making rather than reading. */}
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

          {step === "subtopic" ? (
            resources.length > 0 ? (
              <>
                {/* Named only when there is also a game above, so the two halves read as two
                    halves rather than one undifferentiated list. */}
                {games.length > 0 ? <p className="panel__rows-lead">Or read about it</p> : null}
                <ul className="panel__rows">
                  {resources.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="row"
                        // Following a link out is the one act on the panel worth recording, and it
                        // is attributed to the subtopic cell the child is standing in — never to the
                        // shelf — so a follow reads as "left THIS cell to learn more". See
                        // `recordSourceFollow`. Fires alongside navigation; not gated on it.
                        onClick={() => current && sessionLog.recordSourceFollow(current.id)}
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
              // product has nothing here yet, instead of a panel that quietly ends. Only shown
              // when there is neither a game nor a link — a cell with a game is not empty.
              <p className="panel__empty">Nothing here yet. Try another one.</p>
            )
          ) : (
            <>
              {/* What is behind the door, before committing to it. Not a second set of buttons —
                  that would turn one choice moment into two competing ones. Just the answer to
                  "what would I even find in here", which a picture and two words cannot give. */}
              <p className="panel__more">Inside you would find</p>
              <ul className="panel__inside">
                {subtopicTiles(current.cabin).map((s) => (
                  <li key={s.id}>{s.label}</li>
                ))}
              </ul>
            </>
          )}
        </aside>
      ) : null}

      <footer className="browse__meter">
        <span>
          Offered this session: <strong>{offered}</strong> across <strong>{screens.size}</strong>{" "}
          {screens.size === 1 ? "screen" : "screens"}
        </span>
        <span className="browse__meter-note">
          Every tile shown is logged as offered, with its position. Order is random per session;
          which topics appear is not.
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
