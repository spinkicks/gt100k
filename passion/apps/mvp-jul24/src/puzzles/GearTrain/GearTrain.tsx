/**
 * Gear Train — fit gears so the marked tooth returns to the top after exactly N crank turns.
 *
 * No score, no timer, no fail state (PROJECT.md D7). Gears can be pulled back out at any time, so
 * there is nothing to lose by trying something.
 *
 * TEETH ARE DRAWN, NOT PRINTED. Each gear renders its actual tooth count as geometry, so the child
 * can count them, and the tooth count is what determines the motion — that is the swap test passing
 * visibly rather than on paper. The number is printed too, because counting 24 teeth on a small SVG
 * is tedious and the point is the reasoning, not the tally.
 *
 * ROTATION IS A PURE FUNCTION OF TIME. The repo drives all animation from clock time rather than
 * accumulating per frame, so screenshots stay reproducible (see the top of scene3d/Cabin.tsx and
 * cabin/aliveness/signal.ts). Here that also keeps the *relative* rates exactly right: each gear's
 * angle is derived from elapsed seconds times its own signed rate, so meshed gears cannot drift out
 * of step no matter how frames land.
 */
import { useEffect, useRef, useState } from "react";
import type { PuzzleProps } from "../../game/types";
import "./GearTrain.css";
import { type Level, TIERS, generateLevel } from "./generate";
import {
  SLOTS,
  type SlotName,
  type Train,
  clearSlot,
  isSolved,
  place,
  ratesOf,
  ratioOf,
  remaining,
  turnsToRealign,
} from "./logic";

function tierFor(round: number): number {
  return round % 2 === 0 ? 0 : Math.min(1, TIERS.length - 1);
}

/**
 * Pitch radius in px per tooth, shared by every gear so relative sizes are honest: a 24-tooth gear
 * really is twice the radius of a 12-tooth one, which is what makes "more teeth turns slower"
 * visible rather than merely stated.
 *
 * KNOWN GAP, recorded rather than hidden: the gears do NOT physically mesh. They sit in separate
 * slots, so tooth tips do not interlock and centre distances are not the sum of the pitch radii.
 * Real meshing needs one SVG with computed centre positions instead of flex-laid-out boxes, plus a
 * shared tooth pitch across the whole train. The maths and the rates are exact either way; what is
 * missing is the visual proof that the teeth drive each other.
 */
const PX_PER_TOOTH = 2.3;

function radiusFor(teeth: number): number {
  return teeth * PX_PER_TOOTH;
}

/**
 * A gear drawn from its real tooth count: a hub, a rim, and `teeth` trapezoids around the pitch
 * circle. `marked` draws one tooth in ember so the child can see it come back around.
 */
function Gear({
  teeth,
  angle,
  marked = false,
}: {
  teeth: number;
  angle: number;
  marked?: boolean;
}): JSX.Element {
  const r = radiusFor(teeth);
  const toothH = Math.max(3.2, r * 0.13);
  const half = 360 / teeth / 2.6;
  const size = (r + toothH) * 2 + 4;
  const c = size / 2;
  const points: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i * 360) / teeth - half;
    const a1 = (i * 360) / teeth + half;
    const rad = (d: number): number => (d * Math.PI) / 180;
    const inner = r;
    const outer = r + toothH;
    points.push(
      [
        `${c + inner * Math.cos(rad(a0))},${c + inner * Math.sin(rad(a0))}`,
        `${c + outer * Math.cos(rad(a0))},${c + outer * Math.sin(rad(a0))}`,
        `${c + outer * Math.cos(rad(a1))},${c + outer * Math.sin(rad(a1))}`,
        `${c + inner * Math.cos(rad(a1))},${c + inner * Math.sin(rad(a1))}`,
      ].join(" "),
    );
  }
  return (
    <svg
      className="gt-gear"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: `${c}px ${c}px` }}>
        <circle cx={c} cy={c} r={r} className="gt-gear-body" />
        {/*
         * Keyed on the points string, not the index. Each tooth sits at its own angle, so its
         * polygon path is unique within the gear — a genuinely stable key rather than a suppressed
         * warning. (The index is still used to pick the marked tooth, which is fine; only the key
         * has to be stable.)
         */}
        {points.map((p, i) => (
          <polygon
            key={p}
            points={p}
            className={marked && i === 0 ? "gt-tooth gt-tooth-marked" : "gt-tooth"}
          />
        ))}
        <circle cx={c} cy={c} r={Math.max(4, r * 0.22)} className="gt-gear-hub" />
        {marked ? <line x1={c} y1={c} x2={c + r} y2={c} className="gt-gear-spoke" /> : null}
      </g>
    </svg>
  );
}

export const GearTrain: React.FC<PuzzleProps & { initialRound?: number }> = ({
  seed,
  onSolved,
  onExit,
  initialRound = 0,
}) => {
  const [round, setRound] = useState(initialRound);
  const [level, setLevel] = useState<Level>(() =>
    generateLevel(seed + initialRound, tierFor(initialRound)),
  );
  const [train, setTrain] = useState<Train>(level.train);
  const [picked, setPicked] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const solvedRef = useRef(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const next = generateLevel(seed + round, tierFor(round));
    setLevel(next);
    setTrain(next.train);
    setPicked(null);
    solvedRef.current = false;
  }, [seed, round]);

  // Drive the animation from elapsed clock time, never from an accumulator, so the rates stay exact.
  useEffect(() => {
    if (typeof requestAnimationFrame !== "function") return;
    let raf = 0;
    const tick = (now: number): void => {
      if (startRef.current === null) startRef.current = now;
      setSeconds((now - startRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const solved = isSolved(train);
  useEffect(() => {
    if (solved && !solvedRef.current) {
      solvedRef.current = true;
      onSolved();
    }
  }, [solved, onSolved]);

  const rates = ratesOf(train);
  const ratio = ratioOf(train);
  const realign = turnsToRealign(train);
  const pool = remaining(train);
  /** Degrees per second for the crank. Slow enough to watch a tooth come round. */
  const CRANK_DPS = 42;

  const angle = (rate: number | null): number => (rate === null ? 0 : rate * seconds * CRANK_DPS);

  const slotTeeth = (slot: SlotName): number | undefined => train.placement[slot];

  return (
    <div className="gt-root">
      <button type="button" className="gt-back" onClick={onExit}>
        ← Back
      </button>

      <p className="gt-rule">
        A gear with more teeth turns slower. Fit three gears so the ember tooth comes back to the
        top after exactly <strong>{train.target}</strong> turns of the crank.
      </p>

      <div className="gt-bench">
        <div className="gt-stage">
          <span className="gt-label">crank · {train.crankTeeth}</span>
          <Gear teeth={train.crankTeeth} angle={angle(rates.crank)} />
        </div>

        {SLOTS.map((slot) => {
          const teeth = slotTeeth(slot);
          const rate = slot === "a" ? rates.a : slot === "b" ? rates.b : rates.c;
          return (
            <div className="gt-stage" key={slot}>
              <span className="gt-label">
                {slot === "b" ? "same shaft" : "slot"} {slot.toUpperCase()}
                {typeof teeth === "number" ? ` · ${teeth}` : ""}
              </span>
              <button
                type="button"
                className={`gt-slot${typeof teeth === "number" ? " gt-slot-filled" : ""}`}
                onClick={() => {
                  if (typeof teeth === "number") setTrain(clearSlot(train, slot));
                  else if (picked !== null) {
                    setTrain(place(train, slot, picked));
                    setPicked(null);
                  }
                }}
              >
                {typeof teeth === "number" ? (
                  <Gear teeth={teeth} angle={angle(rate)} marked={slot === "c"} />
                ) : (
                  <span className="gt-slot-empty">{picked === null ? "empty" : "put it here"}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p className="gt-readout">
        {ratio === null ? (
          "Fill all three slots to see how it turns."
        ) : (
          <>
            Turns of the output per crank turn:{" "}
            <strong>
              {ratio.num}/{ratio.den}
            </strong>{" "}
            · ember tooth back on top after <strong>{realign}</strong> turn
            {realign === 1 ? "" : "s"}
          </>
        )}
      </p>

      <output className="gt-note">
        {solved ? `Exactly ${train.target}. The ember tooth lines up again.` : ""}
      </output>

      {solved ? (
        <button type="button" className="gt-next" onClick={() => setRound((r) => r + 1)}>
          Next puzzle →
        </button>
      ) : (
        <div className="gt-rack">
          {pool.map((teeth, i) => (
            <button
              // biome-ignore lint/suspicious/noArrayIndexKey: sizes can repeat and carry no identity
              key={`${teeth}-${i}`}
              type="button"
              className={`gt-pick${picked === teeth ? " gt-pick-on" : ""}`}
              onClick={() => setPicked(picked === teeth ? null : teeth)}
            >
              {teeth} teeth
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GearTrain;
