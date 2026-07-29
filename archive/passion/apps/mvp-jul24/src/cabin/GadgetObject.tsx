/**
 * Little illustrated puzzle-objects, one per gadget, drawn as cohesive cozy
 * SVG motifs so the hotspot reads as the object itself (a puzzle board, a
 * chess set, pipe tiles…) rather than a floating label pill. Purely decorative
 * — no <text> nodes, so nothing here leaks into the host button's accessible
 * name. Warm ink/ember palette pulled from the shared theme tokens.
 */

const INK = "var(--ink)";
const INK_SOFT = "var(--ink-soft)";
const EMBER = "var(--ember)";
const EMBER_DEEP = "var(--ember-deep)";

/** Shared decorative <svg> shell — aria-hidden is a literal so it never leaks
 *  into the host button's accessible name. */
function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className="gadget-object-svg">
      {children}
    </svg>
  );
}

/** 4×4 nonogram board with clue rails and a filled diamond. */
function NonogramObj() {
  const cells: Array<[number, number]> = [
    [1, 0],
    [2, 0],
    [0, 1],
    [3, 1],
    [0, 2],
    [3, 2],
    [1, 3],
    [2, 3],
  ];
  const x0 = 34;
  const y0 = 34;
  const s = 15;
  return (
    <Svg>
      {/* clue rails */}
      <rect x={12} y={y0} width={18} height={s * 4} rx={2} fill={INK_SOFT} opacity={0.18} />
      <rect x={x0} y={12} width={s * 4} height={18} rx={2} fill={INK_SOFT} opacity={0.18} />
      {[0, 1, 2, 3].map((r) => (
        <line
          key={`rc-${r}`}
          x1={16}
          y1={y0 + s * r + s / 2}
          x2={26}
          y2={y0 + s * r + s / 2}
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {[0, 1, 2, 3].map((c) => (
        <line
          key={`cc-${c}`}
          x1={x0 + s * c + s / 2}
          y1={16}
          x2={x0 + s * c + s / 2}
          y2={26}
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
        />
      ))}
      {/* filled cells */}
      {cells.map(([c, r]) => (
        <rect
          key={`f-${c}-${r}`}
          x={x0 + s * c + 1.5}
          y={y0 + s * r + 1.5}
          width={s - 3}
          height={s - 3}
          rx={2.5}
          fill={EMBER}
        />
      ))}
      {/* grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`gv-${i}`}
          x1={x0 + s * i}
          y1={y0}
          x2={x0 + s * i}
          y2={y0 + s * 4}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`gh-${i}`}
          x1={x0}
          y1={y0 + s * i}
          x2={x0 + s * 4}
          y2={y0 + s * i}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
    </Svg>
  );
}

/** A little clue sheet / deduction grid with ✓ and ✗ marks. */
function LogicGridObj() {
  const x0 = 20;
  const y0 = 22;
  const w = 60;
  const h = 60;
  const c = w / 3;
  return (
    <Svg>
      <rect x={x0} y={y0} width={w} height={h} rx={4} fill="#fff" opacity={0.28} />
      {/* header shading */}
      <rect x={x0} y={y0} width={w} height={c} fill={INK_SOFT} opacity={0.2} />
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`v-${i}`}
          x1={x0 + c * i}
          y1={y0}
          x2={x0 + c * i}
          y2={y0 + h}
          stroke={INK}
          strokeWidth={1.6}
          opacity={0.7}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`h-${i}`}
          x1={x0}
          y1={y0 + c * i}
          x2={x0 + w}
          y2={y0 + c * i}
          stroke={INK}
          strokeWidth={1.6}
          opacity={0.7}
        />
      ))}
      {/* ✓ marks */}
      {(
        [
          [1, 1],
          [2, 2],
        ] as Array<[number, number]>
      ).map(([col, row]) => {
        const cx = x0 + c * col + c / 2;
        const cy = y0 + c * row + c / 2;
        return (
          <polyline
            key={`ok-${col}-${row}`}
            points={`${cx - 5},${cy} ${cx - 1},${cy + 4} ${cx + 5},${cy - 4}`}
            fill="none"
            stroke={EMBER_DEEP}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      {/* ✗ marks */}
      {(
        [
          [2, 1],
          [1, 2],
        ] as Array<[number, number]>
      ).map(([col, row]) => {
        const cx = x0 + c * col + c / 2;
        const cy = y0 + c * row + c / 2;
        return (
          <g key={`no-${col}-${row}`} stroke={INK} strokeWidth={2.4} strokeLinecap="round">
            <line x1={cx - 4} y1={cy - 4} x2={cx + 4} y2={cy + 4} />
            <line x1={cx + 4} y1={cy - 4} x2={cx - 4} y2={cy + 4} />
          </g>
        );
      })}
    </Svg>
  );
}

/** Angled mirrors bouncing a firelight beam. */
function MirrorObj() {
  return (
    <Svg>
      <rect x={16} y={16} width={68} height={68} rx={6} fill={INK_SOFT} opacity={0.16} />
      {/* beam */}
      <polyline
        points="20,30 44,54 64,34 80,50"
        fill="none"
        stroke={EMBER}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* mirrors */}
      <g stroke={INK} strokeWidth={5} strokeLinecap="round">
        <line x1={36} y1={62} x2={52} y2={46} />
        <line x1={56} y1={26} x2={72} y2={42} />
      </g>
      <g stroke="#fff" strokeWidth={1.6} strokeLinecap="round" opacity={0.6}>
        <line x1={37} y1={60} x2={51} y2={47} />
        <line x1={57} y1={27} x2={71} y2={41} />
      </g>
    </Svg>
  );
}

/** A chess set: a checkered base with a king and a pawn. */
function ChessObj() {
  const x0 = 18;
  const y0 = 62;
  const s = 16;
  const squares = [];
  for (let r = 0; r < 2; r++) {
    for (let cc = 0; cc < 4; cc++) {
      if ((r + cc) % 2 === 0)
        squares.push(
          <rect
            key={`sq-${r}-${cc}`}
            x={x0 + cc * s}
            y={y0 + r * s}
            width={s}
            height={s}
            fill={INK}
            opacity={0.8}
          />,
        );
    }
  }
  return (
    <Svg>
      <rect x={x0} y={y0} width={s * 4} height={s * 2} rx={2} fill={INK_SOFT} opacity={0.35} />
      {squares}
      <rect
        x={x0}
        y={y0}
        width={s * 4}
        height={s * 2}
        rx={2}
        fill="none"
        stroke={INK}
        strokeWidth={2}
      />
      {/* king (ember) */}
      <g fill={EMBER} stroke={EMBER_DEEP} strokeWidth={1.5} strokeLinejoin="round">
        <path d="M30 60c0-6-8-8-8-16 0-5 4-8 8-8s8 3 8 8c0 8-8 10-8 16z" />
        <rect x={24} y={58} width={12} height={5} rx={1.5} />
        <line x1={30} y1={22} x2={30} y2={30} stroke={EMBER_DEEP} strokeWidth={2.4} />
        <line x1={26} y1={26} x2={34} y2={26} stroke={EMBER_DEEP} strokeWidth={2.4} />
      </g>
      {/* pawn (ink) */}
      <g fill={INK} stroke={INK} strokeWidth={1}>
        <circle cx={58} cy={40} r={5.5} />
        <path d="M52 62c0-8 3-12 6-12s6 4 6 12z" />
        <rect x={50} y={60} width={16} height={5} rx={1.5} />
      </g>
    </Svg>
  );
}

/** Minesweeper: a grid with a planted flag and hint dots. */
function MinesweeperObj() {
  const x0 = 20;
  const y0 = 20;
  const s = 16;
  return (
    <Svg>
      <rect x={x0} y={y0} width={s * 4} height={s * 4} rx={4} fill={INK_SOFT} opacity={0.2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`v-${i}`}
          x1={x0 + s * i}
          y1={y0}
          x2={x0 + s * i}
          y2={y0 + s * 4}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`h-${i}`}
          x1={x0}
          y1={y0 + s * i}
          x2={x0 + s * 4}
          y2={y0 + s * i}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
      {/* hint dots */}
      <circle cx={x0 + s * 2.5} cy={y0 + s * 0.5} r={2.4} fill={EMBER_DEEP} />
      <circle cx={x0 + s * 0.5} cy={y0 + s * 2.5} r={2.4} fill={INK} />
      <circle cx={x0 + s * 3.5} cy={y0 + s * 2.5} r={2.4} fill={EMBER_DEEP} />
      {/* flag on a raised cell */}
      <g>
        <line
          x1={x0 + s * 1.5}
          y1={y0 + s * 1.35}
          x2={x0 + s * 1.5}
          y2={y0 + s * 2.6}
          stroke={INK}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <path
          d={`M${x0 + s * 1.5} ${y0 + s * 1.3} L${x0 + s * 2.4} ${y0 + s * 1.7} L${x0 + s * 1.5} ${y0 + s * 2.1} Z`}
          fill={EMBER}
        />
      </g>
    </Svg>
  );
}

/** Pipe tiles to be connected. */
function PipesObj() {
  return (
    <Svg>
      <rect x={16} y={16} width={68} height={68} rx={6} fill={INK_SOFT} opacity={0.16} />
      <g fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
        {/* elbow top-left → straight → elbow down */}
        <path d="M33 22 V40 H72" />
        <path d="M67 40 V62 H45" />
      </g>
      <g fill="none" stroke={EMBER} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M33 22 V40 H72" />
        <path d="M67 40 V62 H45" />
      </g>
      {/* joints */}
      <g fill={EMBER_DEEP}>
        <circle cx={33} cy={22} r={3.4} />
        <circle cx={45} cy={62} r={3.4} />
      </g>
    </Svg>
  );
}

/** LITS: a grid with an L-tetromino shaded in. */
function LitsObj() {
  const x0 = 20;
  const y0 = 20;
  const s = 15;
  const filled: Array<[number, number]> = [
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 2],
  ];
  return (
    <Svg>
      <rect x={x0} y={y0} width={s * 4} height={s * 4} rx={4} fill={INK_SOFT} opacity={0.18} />
      {filled.map(([c, r]) => (
        <rect
          key={`l-${c}-${r}`}
          x={x0 + s * c + 1.5}
          y={y0 + s * r + 1.5}
          width={s - 3}
          height={s - 3}
          rx={2.5}
          fill={EMBER}
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`v-${i}`}
          x1={x0 + s * i}
          y1={y0}
          x2={x0 + s * i}
          y2={y0 + s * 4}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`h-${i}`}
          x1={x0}
          y1={y0 + s * i}
          x2={x0 + s * 4}
          y2={y0 + s * i}
          stroke={INK}
          strokeWidth={1.5}
          opacity={0.7}
        />
      ))}
    </Svg>
  );
}

const OBJECTS: Record<string, () => JSX.Element> = {
  nonogram: NonogramObj,
  "logic-grid": LogicGridObj,
  mirror: MirrorObj,
  chess: ChessObj,
  minesweeper: MinesweeperObj,
  pipes: PipesObj,
  lits: LitsObj,
};

export function GadgetObject({ id }: { id: string }) {
  const Obj = OBJECTS[id] ?? NonogramObj;
  return <Obj />;
}

export default GadgetObject;
