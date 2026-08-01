/**
 * The shelf cards' diagrams: inline SVG, one per id, no image files and no network.
 *
 * WHY INLINE SVG AND NOT PICTURES
 * A card has to render with the wifi off (see `ShelfDeck`), and it has to stay legible on a parchment
 * surface inside a firelit room, so every stroke here is authored in the app's own ink tokens and
 * scales with the card rather than being a fixed-size bitmap fetched from somewhere else.
 *
 * WHY THE NUMBERS IN THEM ARE CHECKABLE
 * Each diagram states the same arithmetic its card states, and both are exact: cells 3, 4 and 8 of a
 * `4 3` clue in a row of ten really are forced, Königsberg's four banks really have 5/3/3/3 bridges,
 * 8 litres of 1:3 paint really is 2 red to 6 white. A diagram that rounded or hand-waved would teach
 * the opposite of what this room is for.
 *
 * ACCESSIBILITY. Each diagram is `role="img"` with a real description rather than `aria-hidden`:
 * these are explanatory, so a child using a screen reader should get the explanation, not be told
 * that a picture exists. The description is a sentence; the short label inside the drawing is a
 * caption for people who can see it, and never the only copy of the point.
 */

import type { JSX } from "react";

export type DiagramId =
  | "nonogram-overlap"
  | "konigsberg"
  | "reflection"
  | "balance-thirds"
  | "gear-ratio"
  | "unit-fractions"
  | "function-machine"
  | "ratio-cans";

interface Diagram {
  /** The accessible description: a sentence that stands in for seeing the drawing. */
  description: string;
  viewBox: string;
  render: () => JSX.Element;
}

const CELL = 22;
const ROW_X = 56;

function NonogramOverlap(): JSX.Element {
  // Clue `4 3` in a row of ten. The 4 can start at cell 1, 2 or 3; the 3 at cell 6, 7 or 8. Whichever
  // is true, cells 3, 4 and 8 are filled — that intersection is the deduction the card is about.
  const forced = [2, 3, 7];
  return (
    <>
      <text className="shelf-dg-label" x="6" y="27">
        4 3
      </text>
      {Array.from({ length: 10 }, (_, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed row of ten cells, never reordered — the index IS the identity (cell 3 is cell 3).
          key={`cell-${i}`}
          className={forced.includes(i) ? "shelf-dg-cell is-filled" : "shelf-dg-cell"}
          x={ROW_X + i * CELL}
          y="10"
          width={CELL}
          height={CELL}
        />
      ))}
      {[0, 1, 2].map((start) => (
        <g key={`arrangement-${start}`}>
          <rect
            className="shelf-dg-ghost"
            x={ROW_X + start * CELL}
            y={48 + start * 20}
            width={CELL * 4}
            height="14"
          />
          <rect
            className="shelf-dg-ghost"
            x={ROW_X + (start + 5) * CELL}
            y={48 + start * 20}
            width={CELL * 3}
            height="14"
          />
        </g>
      ))}
      <text className="shelf-dg-note" x="6" y="122">
        cells 3, 4 and 8 are filled in all three
      </text>
    </>
  );
}

function Konigsberg(): JSX.Element {
  // North bank, big island, small island, south bank: 3, 5, 3, 3 bridges. Every count odd, so no walk
  // crosses all seven exactly once (Euler, 1736).
  // Laid out shallow on purpose: the card caps a diagram's height, so a tall viewBox is scaled down
  // and takes its labels with it. At 300x172 this one renders near 1:1 and the bridge counts stay
  // readable, which is the only thing in the drawing that carries the argument.
  const banks: Array<[string, number, number, string]> = [
    ["north", 170, 26, "3"],
    ["big island", 60, 88, "5"],
    ["small island", 280, 88, "3"],
    ["south", 170, 150, "3"],
  ];
  return (
    <>
      {/* The two bridges between a bank and the big island bow SYMMETRICALLY either side of the straight
          line between them — one control point offset a little each way along the perpendicular. Drawn
          the obvious way, as two long sweeping curves, they merged into one arc that appeared to run
          from the north bank to the south bank behind the island, i.e. the picture claimed a bridge that
          does not exist and hid two that do. This is a diagram about counting edges; it has to be
          countable. */}
      <path className="shelf-dg-edge" d="M170 26 Q106 41 60 88" />
      <path className="shelf-dg-edge" d="M170 26 Q124 73 60 88" />
      <path className="shelf-dg-edge" d="M170 150 Q124 103 60 88" />
      <path className="shelf-dg-edge" d="M170 150 Q106 135 60 88" />
      {/* one from each bank to the small island, and one between the islands */}
      <path className="shelf-dg-edge" d="M170 26 L280 88" />
      <path className="shelf-dg-edge" d="M170 150 L280 88" />
      <path className="shelf-dg-edge" d="M60 88 L280 88" />
      {/* Nodes last, and opaque (see `.shelf-dg-node`): the edges meet at their centres, so a
          translucent disc left every bridge drawn straight through the digit it was labelling. */}
      {banks.map(([name, x, y, degree]) => (
        <g key={name}>
          <circle className="shelf-dg-node" cx={x} cy={y} r="17" />
          <text className="shelf-dg-node-label" x={x} y={y + 6} textAnchor="middle">
            {degree}
          </text>
        </g>
      ))}
      <text className="shelf-dg-note" x="6" y="174">
        5, 3, 3, 3 bridges — all odd
      </text>
    </>
  );
}

function Reflection(): JSX.Element {
  // A beam meeting a vertical mirror at 45 degrees leaves at 45 on the other side of the normal: a
  // 90 degree turn. Dashed line is the normal, the arc is the pair of equal angles.
  return (
    <>
      <line className="shelf-dg-mirror" x1="150" y1="18" x2="150" y2="132" />
      <line className="shelf-dg-normal" x1="150" y1="75" x2="46" y2="75" />
      <path className="shelf-dg-ray" d="M40 20 L146 74" />
      <path className="shelf-dg-ray" d="M146 76 L40 130" />
      <path className="shelf-dg-arc" d="M112 57 A 42 42 0 0 0 112 93" />
      <text className="shelf-dg-label" x="70" y="50">
        in
      </text>
      <text className="shelf-dg-label" x="64" y="118">
        out
      </text>
      <text className="shelf-dg-note" x="162" y="79">
        mirror
      </text>
      <text className="shelf-dg-note" x="6" y="156">
        angle in = angle out
      </text>
    </>
  );
}

function BalanceThirds(): JSX.Element {
  // Nine coins, one of them light. Weigh three against three: the light group is the side that rises,
  // or the three left aside if the pans balance. Two weighings settle nine, because 3 x 3 = 9.
  const pan = (cx: number) => (
    <>
      <line className="shelf-dg-edge" x1={cx} y1="42" x2={cx} y2="66" />
      <path
        className="shelf-dg-pan"
        d={`M${cx - 26} 66 L${cx + 26} 66 L${cx + 18} 80 L${cx - 18} 80 Z`}
      />
      {[0, 1, 2].map((i) => (
        <circle key={i} className="shelf-dg-coin" cx={cx - 14 + i * 14} cy="60" r="6" />
      ))}
    </>
  );
  return (
    <>
      <line className="shelf-dg-beam" x1="34" y1="42" x2="166" y2="42" />
      <path className="shelf-dg-pan" d="M100 42 L88 86 L112 86 Z" />
      {pan(34)}
      {pan(166)}
      {[0, 1, 2].map((i) => (
        <circle key={`aside-${i}`} className="shelf-dg-coin" cx={222 + i * 16} cy="60" r="6" />
      ))}
      <text className="shelf-dg-note" x="212" y="82">
        left aside
      </text>
      <text className="shelf-dg-note" x="6" y="108">
        three against three, three untouched
      </text>
    </>
  );
}

function GearRatio(): JSX.Element {
  // Pitch circles touch, so the centres are r1 + r2 apart: 20 + 62 = 82.
  const teeth = (cx: number, cy: number, r: number, count: number) =>
    Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return (
        <line
          // biome-ignore lint/suspicious/noArrayIndexKey: gear teeth at fixed angles, never reordered.
          key={i}
          className="shelf-dg-tooth"
          x1={cx + Math.cos(angle) * r}
          y1={cy + Math.sin(angle) * r}
          x2={cx + Math.cos(angle) * (r + 6)}
          y2={cy + Math.sin(angle) * (r + 6)}
        />
      );
    });
  return (
    <>
      <circle className="shelf-dg-gear" cx="58" cy="74" r="20" />
      {teeth(58, 74, 20, 12)}
      <circle className="shelf-dg-gear" cx="140" cy="74" r="62" />
      {teeth(140, 74, 62, 36)}
      {/* Rotation, shown at the TOP of each gear, where the direction is unambiguous: at the top of a
          wheel, moving right is clockwise and moving left is anticlockwise. Two arcs inside the rims
          was the first attempt and it failed a read-back — the big gear's arrowhead landed next to the
          small gear and the pair read as one arrow travelling between them. Meshed gears always turn
          opposite ways, and that is the thing the picture has to say at a glance. */}
      <path className="shelf-dg-arc" d="M30 40 A 40 40 0 0 1 74 40" />
      <polygon className="shelf-dg-head" points="80,40 68,34 68,46" />
      <path className="shelf-dg-arc" d="M174 34 A 60 60 0 0 0 118 34" />
      <polygon className="shelf-dg-head" points="112,34 124,28 124,40" />
      <text className="shelf-dg-label" x="58" y="79" textAnchor="middle">
        12
      </text>
      <text className="shelf-dg-label" x="140" y="102" textAnchor="middle">
        36
      </text>
      <text className="shelf-dg-note" x="6" y="164">
        36 ÷ 12 = 3 turns, the other way round
      </text>
    </>
  );
}

function UnitFractions(): JSX.Element {
  // One bar in halves, thirds and sixths: 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 1.
  const parts: Array<[string, number, number]> = [
    ["1/2", 0, 120],
    ["1/3", 120, 80],
    ["1/6", 200, 40],
  ];
  return (
    <>
      {parts.map(([label, x, width]) => (
        <g key={label}>
          <rect className="shelf-dg-part" x={20 + x} y="18" width={width} height="42" />
          <text className="shelf-dg-label" x={20 + x + width / 2} y="45" textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <text className="shelf-dg-note" x="20" y="84">
        3/6 + 2/6 + 1/6 = 1
      </text>
    </>
  );
}

function FunctionMachine(): JSX.Element {
  const steps = ["+ 2", "× 6", "− 2"];
  return (
    <>
      <text className="shelf-dg-label" x="8" y="46">
        2
      </text>
      {steps.map((step, i) => (
        <g key={step}>
          <line className="shelf-dg-arrow" x1={26 + i * 76} y1="40" x2={46 + i * 76} y2="40" />
          <rect className="shelf-dg-box" x={46 + i * 76} y="20" width="56" height="40" rx="8" />
          <text className="shelf-dg-label" x={74 + i * 76} y="46" textAnchor="middle">
            {step}
          </text>
        </g>
      ))}
      <line className="shelf-dg-arrow" x1="254" y1="40" x2="272" y2="40" />
      <text className="shelf-dg-label" x="278" y="46">
        22
      </text>
      <text className="shelf-dg-note" x="8" y="82">
        + 1, × 6, + 4 fits these numbers too
      </text>
    </>
  );
}

function RatioCans(): JSX.Element {
  // Eight litres of each paint, counted rather than assumed: 1:3 is 2 red + 6 white, 1:7 is 1 red +
  // 7 white, and the mixture is 3 red to 13 white — which is not 1:5.
  const strip = (x: number, y: number, cells: number, red: number) =>
    Array.from({ length: cells }, (_, i) => (
      <rect
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed strip of litre squares, never reordered.
        key={i}
        className={i < red ? "shelf-dg-cell is-filled" : "shelf-dg-cell"}
        x={x + i * 15}
        y={y}
        width="15"
        height="15"
      />
    ));
  return (
    <>
      <text className="shelf-dg-label" x="6" y="23">
        1:3
      </text>
      {strip(46, 10, 8, 2)}
      <text className="shelf-dg-label" x="6" y="57">
        1:7
      </text>
      {strip(46, 44, 8, 1)}
      <text className="shelf-dg-label" x="6" y="97">
        mix
      </text>
      {strip(46, 84, 16, 3)}
      <text className="shelf-dg-note" x="6" y="122">
        3 red to 13 white — not 1:5
      </text>
    </>
  );
}

export const DIAGRAMS: Record<DiagramId, Diagram> = {
  "nonogram-overlap": {
    description:
      "A row of ten nonogram cells with the clue 4 3. Three ghosted arrangements below show the only places the run of four can sit, and cells three, four and eight are filled in every one of them.",
    viewBox: "0 0 300 130",
    render: NonogramOverlap,
  },
  konigsberg: {
    description:
      "The four land masses of Königsberg drawn as circles joined by seven bridges: five bridges meet at the big island and three at each of the other banks. Every count is odd.",
    viewBox: "0 0 300 180",
    render: Konigsberg,
  },
  reflection: {
    description:
      "A light ray arriving at a vertical mirror and leaving it again. A dashed line runs at right angles to the mirror, and the angle between it and the arriving ray equals the angle between it and the leaving ray.",
    viewBox: "0 0 300 164",
    render: Reflection,
  },
  "balance-thirds": {
    description:
      "A balance with three coins in each pan and three more set aside. One weighing has three possible outcomes: the left three are light, the right three are light, or the light coin is among the three set aside.",
    viewBox: "0 0 300 116",
    render: BalanceThirds,
  },
  "gear-ratio": {
    description:
      "A twelve-tooth gear meshed with a thirty-six-tooth gear. Arrows inside each show them turning in opposite directions, and the small gear turns three times for each turn of the large one.",
    viewBox: "0 0 300 172",
    render: GearRatio,
  },
  "unit-fractions": {
    description:
      "One bar divided into pieces labelled one half, one third and one sixth. Rewritten as sixths they are three sixths, two sixths and one sixth, which is exactly one whole bar.",
    viewBox: "0 0 300 92",
    render: UnitFractions,
  },
  "function-machine": {
    description:
      "A function machine: the number two goes in, passes through boxes that add two, multiply by six and subtract two, and comes out as twenty-two.",
    viewBox: "0 0 300 92",
    render: FunctionMachine,
  },
  "ratio-cans": {
    description:
      "Three strips of squares. Eight litres of one-to-three paint is two red squares and six white, eight litres of one-to-seven paint is one red and seven white, and poured together they make sixteen squares of which three are red.",
    viewBox: "0 0 300 130",
    render: RatioCans,
  },
};

/** One card's diagram. */
export function ShelfDiagram({ id }: { id: DiagramId }): JSX.Element {
  const diagram = DIAGRAMS[id];
  const Shape = diagram.render;
  return (
    <svg
      className="shelf-diagram"
      viewBox={diagram.viewBox}
      role="img"
      aria-label={diagram.description}
      data-diagram={id}
    >
      <Shape />
    </svg>
  );
}
