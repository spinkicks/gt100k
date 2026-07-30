import type { JSX } from "react";

// This file used to hold a glyph per cabin — eight marks, one stroke weight, drawn to be
// distinguishable without any of them being nicer to look at.
//
// They went with the hierarchy. A cabin glyph is the wrong level for a wall of pursuits: the music
// mark would sit identically on piano, violin, drums, guitar, singing, making tracks and
// songwriting, discriminating nothing while adding seven identical pictures to a screen whose whole
// job is to let the differences between things show.
//
// The right level would be a mark per pursuit, and memo 07 §2.5 is discouraging about that too —
// icons do not rescue the reading gap on their own, and adult conventions actively mislead. The
// reading gap is real and unresolved here: forty-four text tiles asks a lot of a six-year-old, and
// the mitigation currently in place is only that age filtering leaves them eighteen.

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
