/**
 * The labelled diagrams, one per activity.
 *
 * Every diagram is an inline SVG on a shared 260×92 stage, so twelve of them read as one component
 * rather than twelve. The stage is deliberately short: PROJECT.md budgets ~20 seconds for the whole
 * teach-in against a vigilance decrement detectable inside ~6 minutes at this age, and a tall
 * illustration invites the reading time a tall illustration deserves.
 *
 * WHY THE SVGs ARE `aria-hidden`. The rule sentence in TeachIn.tsx is the accessible content — it
 * states the rule in words, which is the whole point of direct instruction. The diagram is a second
 * encoding of the *same* rule for a child who reads a picture faster than a sentence, so exposing
 * its scattered `<text>` labels to a screen reader would produce a word salad that says nothing the
 * sentence did not already say properly. Same reasoning as the boards in Mirror.tsx and
 * FractionLaser.tsx, which hide their beam layers for the same reason.
 *
 * NOTE ON WORDING. Everything here lands in the host puzzle's `container.textContent`, and several
 * puzzles assert against D7's banned vocabulary (score / points / streak / stars / timer / seconds).
 * Label text therefore avoids those words — including the innocent ones, so "the arrow points at"
 * is spelled some other way.
 */
import type { ReactNode } from "react";

/** Shared stage. Fixed viewBox so every diagram occupies exactly the same block. */
function Stage({ children }: { children: ReactNode }): JSX.Element {
  return (
    <svg className="ti-sketch" viewBox="0 0 260 92" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/** A small square cell, filled or outlined. */
function Cell({
  x,
  y,
  size = 22,
  fill = false,
  cross = false,
}: {
  x: number;
  y: number;
  size?: number;
  fill?: boolean;
  cross?: boolean;
}): JSX.Element {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        rx={3}
        className={fill ? "ti-cell ti-cell-on" : "ti-cell"}
      />
      {cross ? (
        <g className="ti-cross">
          <line x1={x + 5} y1={y + 5} x2={x + size - 5} y2={y + size - 5} />
          <line x1={x + size - 5} y1={y + 5} x2={x + 5} y2={y + size - 5} />
        </g>
      ) : null}
    </g>
  );
}

/**
 * An arrow at any angle. Drawn rather than markered because a shared `<marker>` needs a
 * document-unique id per instance, and twelve sketches on one page would need twelve.
 *
 * The head is built from the real unit vector, not from `Math.sign` of the deltas. An earlier version
 * used the signs, which is correct for horizontal and vertical arrows and silently collapses a
 * diagonal one into an invisible sliver — the Chess and Pipes sketches both lost their arrow to it.
 */
const HEAD_LENGTH = 7;
const HEAD_HALF_WIDTH = 3.6;

function Arrow({
  x1,
  y1,
  x2,
  y2,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}): JSX.Element {
  const length = Math.hypot(x2 - x1, y2 - y1) || 1;
  const ux = (x2 - x1) / length;
  const uy = (y2 - y1) / length;
  // Perpendicular to the shaft, so the head is symmetric about it whatever the angle.
  const baseX = x2 - ux * HEAD_LENGTH;
  const baseY = y2 - uy * HEAD_LENGTH;
  const head = [
    `${x2},${y2}`,
    `${baseX - uy * HEAD_HALF_WIDTH},${baseY + ux * HEAD_HALF_WIDTH}`,
    `${baseX + uy * HEAD_HALF_WIDTH},${baseY - ux * HEAD_HALF_WIDTH}`,
  ].join(" ");
  return (
    <g className="ti-arrow">
      <line x1={x1} y1={y1} x2={baseX} y2={baseY} />
      <polygon points={head} />
    </g>
  );
}

/** A caption tied to a part of the sketch. */
function Tag({
  x,
  y,
  children,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: "start" | "middle" | "end";
}): JSX.Element {
  return (
    <text x={x} y={y} className="ti-tag" textAnchor={anchor}>
      {children}
    </text>
  );
}

/** A gear drawn from its real tooth count, matching GearTrain's own geometry idea. */
function GearGlyph({
  cx,
  cy,
  r,
  teeth,
  markFirst = false,
}: {
  cx: number;
  cy: number;
  r: number;
  teeth: number;
  markFirst?: boolean;
}): JSX.Element {
  const ticks: Array<{ angle: number; d: string }> = [];
  for (let i = 0; i < teeth; i++) {
    const a = ((i * 360) / teeth) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(a);
    const y1 = cy + r * Math.sin(a);
    const x2 = cx + (r + 4) * Math.cos(a);
    const y2 = cy + (r + 4) * Math.sin(a);
    ticks.push({ angle: i, d: `M${x1},${y1} L${x2},${y2}` });
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="ti-gear" />
      {ticks.map((t) => (
        <path
          key={t.d}
          d={t.d}
          className={markFirst && t.angle === 0 ? "ti-tooth ti-tooth-mark" : "ti-tooth"}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.22} className="ti-gear-hub" />
    </g>
  );
}

// ---------------------------------------------------------------------------------------------
// logic-games
// ---------------------------------------------------------------------------------------------

export function NonogramDiagram(): JSX.Element {
  const xs = [66, 90, 114, 138, 162];
  return (
    <Stage>
      <Tag x={8} y={26} anchor="start">
        clue
      </Tag>
      <text x={8} y={48} className="ti-big" textAnchor="start">
        2 1
      </text>
      {xs.map((x, i) => (
        <Cell key={x} x={x} y={22} fill={i === 0 || i === 1 || i === 3} />
      ))}
      <Tag x={90} y={62}>
        2 filled
      </Tag>
      <Tag x={125} y={76}>
        blank between
      </Tag>
      <Tag x={172} y={62} anchor="start">
        then 1
      </Tag>
    </Stage>
  );
}

export function PipesDiagram(): JSX.Element {
  return (
    <Stage>
      <Tag x={24} y={20}>
        source
      </Tag>
      <circle cx={24} cy={46} r={8} className="ti-node ti-node-on" />
      <line x1={32} y1={46} x2={62} y2={46} className="ti-pipe ti-pipe-on" />
      <rect x={62} y={24} width={44} height={44} rx={4} className="ti-tile" />
      <line x1={62} y1={46} x2={106} y2={46} className="ti-pipe ti-pipe-on" />
      <rect x={110} y={24} width={44} height={44} rx={4} className="ti-tile" />
      <line x1={132} y1={28} x2={132} y2={64} className="ti-pipe" />
      {/* Points at the misaligned tile, from clear of it. */}
      <Arrow x1={158} y1={10} x2={138} y2={26} />
      <Tag x={132} y={84}>
        turn this a quarter
      </Tag>
      <rect x={158} y={24} width={44} height={44} rx={4} className="ti-tile" />
      <line x1={158} y1={46} x2={202} y2={46} className="ti-pipe" />
      <circle cx={210} cy={46} r={8} className="ti-node" />
      <Tag x={212} y={20}>
        end
      </Tag>
    </Stage>
  );
}

export function MirrorDiagram(): JSX.Element {
  return (
    <Stage>
      <Tag x={40} y={34}>
        beam
      </Tag>
      <line x1={16} y1={44} x2={150} y2={44} className="ti-beam" />
      <line x1={144} y1={30} x2={162} y2={58} className="ti-mirror" />
      <Tag x={168} y={34} anchor="start">
        mirror
      </Tag>
      <line x1={153} y1={44} x2={153} y2={78} className="ti-beam" />
      <circle cx={153} cy={84} r={6} className="ti-node ti-node-on" />
      <Tag x={168} y={88} anchor="start">
        target
      </Tag>
      {/* No arrow labelling the bend: the bend is drawn, and an arrow pointing at the straight run
          before it (which is where an earlier version put it) said the opposite of the truth. */}
      <Tag x={82} y={74}>
        a quarter-turn at the mirror
      </Tag>
    </Stage>
  );
}

export function ChessDiagram(): JSX.Element {
  const squares = [
    { x: 96, y: 20, dark: false },
    { x: 124, y: 20, dark: true },
    { x: 96, y: 48, dark: true },
    { x: 124, y: 48, dark: false },
  ];
  return (
    <Stage>
      {squares.map((s) => (
        <rect
          key={`${s.x}-${s.y}`}
          x={s.x}
          y={s.y}
          width={28}
          height={28}
          className={s.dark ? "ti-sq ti-sq-dark" : "ti-sq"}
        />
      ))}
      <circle cx={110} cy={62} r={9} className="ti-piece" />
      <Arrow x1={114} y1={58} x2={136} y2={36} />
      <Tag x={88} y={78} anchor="end">
        1 · your piece
      </Tag>
      <Tag x={158} y={30} anchor="start">
        2 · where it goes
      </Tag>
    </Stage>
  );
}

export function LogicGridDiagram(): JSX.Element {
  const cols = ["red", "blue"];
  const rows = ["Ana", "Ben"];
  const marks = [
    ["yes", "no"],
    ["no", "yes"],
  ];
  return (
    <Stage>
      {cols.map((c, ci) => (
        <Tag key={c} x={96 + ci * 34} y={18}>
          {c}
        </Tag>
      ))}
      {/* Rows 24..44 and 50..70, so the summary caption at y=88 clears the table instead of sitting
          on top of the second row. */}
      {rows.map((r, ri) => (
        <g key={r}>
          <Tag x={68} y={38 + ri * 26} anchor="end">
            {r}
          </Tag>
          {cols.map((c, ci) => (
            <g key={c}>
              <rect
                x={82 + ci * 34}
                y={24 + ri * 26}
                width={26}
                height={20}
                rx={3}
                className="ti-cell"
              />
              <text x={95 + ci * 34} y={39 + ri * 26} className="ti-mark" textAnchor="middle">
                {marks[ri]?.[ci] === "yes" ? "✓" : "✗"}
              </text>
            </g>
          ))}
        </g>
      ))}
      <Tag x={160} y={36} anchor="start">
        ✓ must be true
      </Tag>
      <Tag x={160} y={54} anchor="start">
        ✗ cannot be
      </Tag>
      <Tag x={112} y={88}>
        exactly one ✓ per row and per column
      </Tag>
    </Stage>
  );
}

export function LitsDiagram(): JSX.Element {
  const S = 11;
  /**
   * The four allowed shapes: `letter`, the x it is drawn at, and its cells as "col,row" pairs.
   * A string beats nested tuple arrays here purely for legibility — the formatter explodes
   * `[[0, 0], [0, 1], …]` one coordinate per line, which buries four tiny shapes in forty lines.
   */
  const shapes = [
    { letter: "L", x: 14, cells: "0,0 0,1 0,2 1,2" },
    { letter: "I", x: 58, cells: "0,0 0,1 0,2 0,3" },
    { letter: "T", x: 92, cells: "0,0 1,0 2,0 1,1" },
    { letter: "S", x: 146, cells: "1,0 2,0 0,1 1,1" },
  ];
  return (
    <Stage>
      {shapes.map((s) => (
        <g key={s.letter}>
          {s.cells.split(" ").map((pair) => {
            const [cx, cy] = pair.split(",").map(Number) as [number, number];
            return <Cell key={pair} x={s.x + cx * S} y={22 + cy * S} size={S} fill={true} />;
          })}
          <Tag x={s.x + S} y={82}>
            {s.letter}
          </Tag>
        </g>
      ))}
      <g>
        <Cell x={210} y={26} size={S} fill={true} />
        <Cell x={210 + S} y={26} size={S} fill={true} />
        <Cell x={210} y={26 + S} size={S} fill={true} />
        <Cell x={210 + S} y={26 + S} size={S} fill={true} cross={true} />
        <Tag x={210 + S} y={82}>
          never 2×2
        </Tag>
      </g>
    </Stage>
  );
}

export function MinesweeperDiagram(): JSX.Element {
  const S = 22;
  // Grid centred with a clear column of label space either side; an earlier x0=74 put the
  // left-hand caption underneath the bottom-left cell.
  const x0 = 88;
  const y0 = 16;
  return (
    <Stage>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={x0 + c * S}
            y={y0 + r * S}
            width={S}
            height={S}
            rx={3}
            className={r === 1 && c === 1 ? "ti-cell ti-cell-open" : "ti-cell"}
          />
        )),
      )}
      <text x={x0 + S + S / 2} y={y0 + S + 16} className="ti-big" textAnchor="middle">
        2
      </text>
      <text x={x0 + S / 2} y={y0 + 16} className="ti-mark" textAnchor="middle">
        ⚑
      </text>
      <text x={x0 + 2 * S + S / 2} y={y0 + 2 * S + 16} className="ti-mark" textAnchor="middle">
        ⚑
      </text>
      <Tag x={82} y={44} anchor="end">
        the eight
      </Tag>
      <Tag x={82} y={58} anchor="end">
        neighbours
      </Tag>
      <Tag x={160} y={44} anchor="start">
        two of these
      </Tag>
      <Tag x={160} y={58} anchor="start">
        nine hide a mine
      </Tag>
    </Stage>
  );
}

// ---------------------------------------------------------------------------------------------
// math
// ---------------------------------------------------------------------------------------------

export function BalanceScaleDiagram(): JSX.Element {
  return (
    <Stage>
      <line x1={40} y1={30} x2={200} y2={30} className="ti-beam-arm" />
      <path d="M112,30 L120,52 L104,52 Z" className="ti-fulcrum" />
      <line x1={62} y1={30} x2={62} y2={44} className="ti-hanger" />
      <line x1={178} y1={30} x2={178} y2={44} className="ti-hanger" />
      <rect x={34} y={44} width={56} height={22} rx={4} className="ti-pan" />
      <rect x={150} y={44} width={56} height={22} rx={4} className="ti-pan" />
      <text x={62} y={60} className="ti-mark" textAnchor="middle">
        bag + 3
      </text>
      <text x={178} y={60} className="ti-mark" textAnchor="middle">
        9
      </text>
      <Tag x={120} y={82}>
        take 3 off both sides → bag = 6
      </Tag>
      <Tag x={120} y={20}>
        always level
      </Tag>
    </Stage>
  );
}

export function GearTrainDiagram(): JSX.Element {
  return (
    <Stage>
      <GearGlyph cx={70} cy={46} r={18} teeth={12} />
      <GearGlyph cx={140} cy={46} r={30} teeth={24} markFirst={true} />
      {/* Staggered, and the small gear's label pulled left: on one line at 9px the two captions
          collide over the gap between the gears. */}
      <Tag x={56} y={80}>
        12 teeth · fast
      </Tag>
      <Tag x={152} y={88}>
        24 teeth · half as fast
      </Tag>
      <Arrow x1={210} y1={30} x2={178} y2={30} />
      <Tag x={214} y={34} anchor="start">
        marked
      </Tag>
      <Tag x={214} y={48} anchor="start">
        tooth
      </Tag>
    </Stage>
  );
}

export function FractionLaserDiagram(): JSX.Element {
  return (
    <Stage>
      <Tag x={16} y={26}>
        1 whole
      </Tag>
      <line x1={10} y1={40} x2={86} y2={40} className="ti-beam ti-beam-thick" />
      <rect x={86} y={24} width={32} height={32} rx={4} className="ti-prism" />
      <text x={102} y={45} className="ti-mark" textAnchor="middle">
        ⬦
      </text>
      <Tag x={102} y={18}>
        prism
      </Tag>
      <line x1={118} y1={40} x2={188} y2={40} className="ti-beam" />
      <Tag x={158} y={30}>
        2/3 straight on
      </Tag>
      <rect x={190} y={28} width={24} height={24} rx={3} className="ti-crystal" />
      <text x={202} y={45} className="ti-mark" textAnchor="middle">
        2/3
      </text>
      <line x1={102} y1={56} x2={102} y2={78} className="ti-beam" />
      <Tag x={112} y={80} anchor="start">
        1/3 out the side · 2/3 + 1/3 = 1
      </Tag>
    </Stage>
  );
}

export function FunctionMachineDiagram(): JSX.Element {
  return (
    <Stage>
      <rect x={82} y={22} width={80} height={34} rx={6} className="ti-machine" />
      <Tag x={122} y={44}>
        the hidden rule
      </Tag>
      <Arrow x1={44} y1={39} x2={78} y2={39} />
      <Arrow x1={166} y1={39} x2={200} y2={39} />
      <Tag x={30} y={30}>
        in
      </Tag>
      <Tag x={216} y={30}>
        out
      </Tag>
      <text x={30} y={50} className="ti-mark" textAnchor="middle">
        3
      </text>
      <text x={216} y={50} className="ti-mark" textAnchor="middle">
        7
      </text>
      <Tag x={122} y={76}>
        3 → 7 · 4 → 9 · so 5 → ?
      </Tag>
      <Tag x={122} y={90}>
        the machine will not run 5 — say what comes out
      </Tag>
    </Stage>
  );
}

export function RatioMixingDiagram(): JSX.Element {
  const S = 18;
  const x0 = 74;
  return (
    <Stage>
      <rect x={x0 - 5} y={21} width={6 * S + 10} height={S + 10} rx={4} className="ti-jar" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Cell key={i} x={x0 + i * S} y={26} size={S - 2} fill={i < 2} />
      ))}
      <Tag x={x0 + S} y={62}>
        2 dye
      </Tag>
      <Tag x={x0 + 4 * S} y={62}>
        4 water
      </Tag>
      <Tag x={130} y={84}>
        2 : 4 is the same mix as 1 : 2
      </Tag>
    </Stage>
  );
}

/**
 * Tune Repair. A melody as blocks, with a sound mark over the note that does not belong.
 *
 * **The contour here is deliberately irregular**, and that is the whole point of the drawing. An
 * earlier version showed a tidy staircase with one block off the line, which taught a child to hunt
 * for a broken pattern — and the redesigned puzzle has no pattern to break, because a shape you can
 * see is a shape you can solve with the sound off. The wrong note here sits on an ordinary row at an
 * ordinary height; nothing about its *position* marks it. Only the ear finds it, so the mark in the
 * picture is a sound cue rather than a spatial one.
 *
 * Height is still pitch and width is still duration, which is what the two side labels say. No stave,
 * no clef, no note names: the roll is not notation a child has to already read.
 */
export function TuneRepairDiagram(): JSX.Element {
  const W = 18;
  const H = 8;
  const x0 = 52;
  const baseline = 68;
  // An irregular, singable-looking line — no constant step, no single turn, no repeated motif.
  const melody = [0, 2, 1, 4, 3, 5];
  const sour = 3;
  return (
    <Stage>
      {melody.map((step, i) => (
        <rect
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed row of marks; position is the identity.
          key={i}
          x={x0 + i * (W + 5)}
          y={baseline - step * H}
          width={i === melody.length - 1 ? W * 2 : W}
          height={H - 1}
          rx={2}
          className="ti-cell ti-cell-on"
        />
      ))}
      {/* A sound cue over the sour note: little arcs, not a position marker. */}
      <g className="ti-beam">
        <path
          d={`M ${x0 + sour * (W + 5) + 3} ${baseline - melody[sour]! * H - 6} q 6 -7 12 0`}
          fill="none"
        />
        <path
          d={`M ${x0 + sour * (W + 5)} ${baseline - melody[sour]! * H - 11} q 9 -11 18 0`}
          fill="none"
        />
      </g>
      <Tag x={34} y={baseline - 5 * H + 4} anchor="end">
        higher
      </Tag>
      <Tag x={34} y={baseline + 6} anchor="end">
        lower
      </Tag>
      <Tag x={x0 + 3.4 * (W + 5)} y={88}>
        one note sounds wrong
      </Tag>
    </Stage>
  );
}

/**
 * Chord Fit. One note held up by a stack, next to two stacks that do not fit it.
 *
 * **Deliberately abstract, and this is a rule rather than a style choice.** The gadget's whole claim to
 * being musical is that the three options differ only in sound (PROJECT.md R2), so a diagram that drew
 * their actual notes would hand over a spacing to compare and undo the design. What is drawn is the
 * RELATION — one thing resting on a support that fits, two that do not — with no pitches in it at all.
 */
export function ChordFitDiagram(): JSX.Element {
  const y = 44;
  const seat = 62;
  return (
    <Stage>
      {/* The melody note: one mark, repeated over each option, because it is the same note each time. */}
      {[0, 1, 2].map((i) => (
        <rect
          key={`n${i}`}
          x={54 + i * 66}
          y={y - 10}
          width={26}
          height={9}
          rx={2}
          className="ti-cell ti-cell-on"
        />
      ))}
      {/* The fitting support: flush under the note. The two others sit askew, so nothing about their
          height or spacing encodes a pitch — only "meets it" versus "does not". */}
      <rect x={54} y={seat} width={26} height={9} rx={2} className="ti-cell ti-cell-on" />
      <rect x={120} y={seat + 6} width={26} height={9} rx={2} className="ti-cell" />
      <rect x={186} y={seat - 7} width={26} height={9} rx={2} className="ti-cell" />
      <Tag x={67} y={seat + 26}>
        fits
      </Tag>
      <Tag x={133} y={seat + 26}>
        clash
      </Tag>
      <Tag x={199} y={seat + 26}>
        clash
      </Tag>
      <Tag x={30} y={y - 2} anchor="end">
        the note
      </Tag>
    </Stage>
  );
}
