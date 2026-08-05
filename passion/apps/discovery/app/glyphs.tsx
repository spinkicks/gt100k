import type { JSX } from "react";

// This file used to hold a glyph per cabin — eight marks, one stroke weight, drawn to be
// distinguishable without any of them being nicer to look at.
//
// They went with the hierarchy. A cabin glyph is the wrong level for a wall of pursuits: the music
// mark would sit identically on piano, violin, drums, guitar, singing, making tracks and
// songwriting, discriminating nothing while adding seven identical pictures to a screen whose whole
// job is to let the differences between things show.
//
// The right level is a mark per pursuit, and that is what the tiles now carry: forty-four bespoke
// flat-SVG icons, one per pursuit, drawn to one locked palette (constant OKLCH lightness/chroma) and
// held within a color-energy band so none of them is prettier than its neighbours. The palette in
// `app/palette.generated.ts` and the guard in `test/icon-conformance.ts` carry that argument.
//
// The reading gap is narrowed by them rather than closed. Memo 07 §2.5 is clear that a picture works
// when it depicts the referent and not otherwise, which is why these are objects rather than
// symbols — but a six-year-old still cannot read "Watching Stars Change", and the honest mitigation
// remains that age filtering leaves them seventeen tiles rather than thirty-seven. Audio labels are
// memo 07's actual recommendation and are not built.

/**
 * Start. On the one button that opens a game.
 *
 * The single icon on this surface that is not an adult convention, and it is here because it is the
 * one shape a child reads before they read words. Filled rather than stroked, unlike everything else
 * in this file, because it is the primary action and the odd one out on purpose — an outline
 * triangle beside outline link arrows would read as a fifth link.
 */
export function PlayGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="play__mark">
      <path d="M9 6.8v10.4a1 1 0 0 0 1.53.85l8.2-5.2a1 1 0 0 0 0-1.7l-8.2-5.2A1 1 0 0 0 9 6.8Z" />
    </svg>
  );
}

/** An outbound link, on the resource rows. The one place an adult convention is the right call. */
export function ExternalGlyph(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="row__out">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 5h5v5M19 5l-8 8M17 14v4.5A1.5 1.5 0 0 1 15.5 20h-10A1.5 1.5 0 0 1 4 18.5v-10A1.5 1.5 0 0 1 5.5 7H10" />
      </g>
    </svg>
  );
}
