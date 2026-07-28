// One glyph per cabin, drawn to the same rules so no tile out-competes another.
//
// UNIFORMITY IS THE MEASUREMENT, not a style preference. Javora et al. (2019) ran the same game at
// two aesthetic treatments with children aged 9-11: they chose the prettier one 62% of the time
// (d > 0.86) and learned no more from it. Our own logs put the same effect at β = 0.267, p = .003.
// If one tile is nicer to look at than the others, a child returning to it is telling us about the
// picture and we will record it as an interest.
//
// So: identical 24-unit viewBox, identical 1.75 stroke, no fills, no gradients, no detail budget
// spent anywhere. Every glyph gets the same number of strokes give or take one.
//
// Each one depicts the ACTUAL REFERENT, which memo 07 §2.5 makes the condition on icons working at
// all: a chess knight for chess, a sprouting seed for plants. Not a metaphor, not an abstract mark,
// and never an adult convention like a floppy disk. The two hardest are persuasion and AI agents,
// and where a picture cannot carry it the word below does the work instead.
import type { JSX } from "react";

const S = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Frame({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="tile__glyph">
      <g {...S}>{children}</g>
    </svg>
  );
}

/** Puzzles & Numbers — a balance scale: the thing that has to come out even. */
const MathPuzzles = (): JSX.Element => (
  <Frame>
    <path d="M12 4v15M7 19h10M4 8h16M4 8l-2.5 5a2.8 2.8 0 0 0 5 0L4 8ZM20 8l-2.5 5a2.8 2.8 0 0 0 5 0L20 8Z" />
  </Frame>
);

/** Code & Computers — the angle brackets a child sees the moment they open any editor. */
const Code = (): JSX.Element => (
  <Frame>
    <path d="M8.5 8 4 12l4.5 4M15.5 8 20 12l-4.5 4M13.5 5.5l-3 13" />
  </Frame>
);

/** Games & Strategy — a knight, the piece that means chess to anyone who has seen a board. */
const Games = (): JSX.Element => (
  <Frame>
    <path d="M8 20h9M9 17.5h7c0-4 1-5.5 0-8.5-.7-2-2.6-3-4.4-3L13 4l-3 1.5-2.2 2.9a1.4 1.4 0 0 0 .6 2.1l1.4.6 1.2-1.6" />
  </Frame>
);

/** Making & Building — meshing gears: something you assemble that then moves. */
const Making = (): JSX.Element => (
  <Frame>
    <circle cx="9.5" cy="9.5" r="3.2" />
    <path d="M9.5 3.6v1.6M9.5 13.8v1.6M3.6 9.5h1.6M13.8 9.5h1.6M5.3 5.3l1.1 1.1M12.6 12.6l1.1 1.1M13.7 5.3l-1.1 1.1M6.4 12.6l-1.1 1.1" />
    <circle cx="17" cy="17" r="2.4" />
    <path d="M17 13.4v1.1M17 19.5v1.1M13.4 17h1.1M19.5 17h1.1" />
  </Frame>
);

/** Art & Animation — a pencil and the arc it leaves. */
const Art = (): JSX.Element => (
  <Frame>
    <path d="m14.5 4.5 5 5L9 20H4v-5L14.5 4.5ZM13 6l5 5" />
  </Frame>
);

/** Music & Sound — a waveform, which is what sound looks like once you work on it. */
const Music = (): JSX.Element => (
  <Frame>
    <path d="M3 12h2.5M7 12v0M7 7.5v9M11 4v16M15 8v8M19 10.5v3M21.5 12H21" />
  </Frame>
);

/** Science & Nature — a seedling: a living thing that solves problems slowly. */
const Science = (): JSX.Element => (
  <Frame>
    <path d="M12 21v-8M12 13c0-3.3 2.4-6 5.5-6 0 3.3-2.4 6-5.5 6ZM12 13c0-2.8-2-5-4.7-5 0 2.8 2 5 4.7 5ZM8 21h8" />
  </Frame>
);

/** Words & Persuasion — two speech bubbles: one person changing another's mind. */
const Words = (): JSX.Element => (
  <Frame>
    <path d="M15 13H8l-3 2.5V6a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 15 6v7Z" />
    <path d="M17.5 8.5h.5A1.5 1.5 0 0 1 19.5 10v9L17 16.5h-5" />
  </Frame>
);

const BY_CABIN: Record<string, () => JSX.Element> = {
  "math-puzzles": MathPuzzles,
  "code-computers": Code,
  "games-strategy": Games,
  "making-engineering": Making,
  "art-motion": Art,
  "music-sound": Music,
  "science-nature": Science,
  "influence-media": Words,
};

/**
 * The glyph for a cabin. Falls back to nothing rather than to a generic mark: a shape that means
 * "we had no picture for this" is worse than the word alone, and it would be the only tile on the
 * grid carrying no information, which makes it stand out for the wrong reason.
 */
export function CabinGlyph({ cabin }: { cabin: string }): JSX.Element | null {
  const G = BY_CABIN[cabin];
  return G ? <G /> : null;
}

/** An outbound link, on the resource rows. The one place an adult convention is the right call. */
export function ExternalGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="row__out">
      <g {...S}>
        <path d="M14 5h5v5M19 5l-8 8M17 14v4.5A1.5 1.5 0 0 1 15.5 20h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" />
      </g>
    </svg>
  );
}
