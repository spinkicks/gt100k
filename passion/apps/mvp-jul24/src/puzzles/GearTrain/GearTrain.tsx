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
import TeachIn from "../../teachin/TeachIn";
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
 * How fast one gear turns, per single turn of the crank, as an exact reduced fraction plus a plain
 * gloss. This exists because the puzzle was unreadable without it: the gears visibly spun, but
 * nothing said how fast the crank turns or how fast the output ends up turning, so "a gear with more
 * teeth turns slower" was an assertion the child could not check against anything on screen. The
 * ratio only appeared once all three slots were full, which is exactly too late to reason with.
 *
 * Signed input, unsigned label: direction is shown by the arrow glyph instead, because "-2/3 turns"
 * reads as a quantity rather than as a reversal.
 */
function rateLabel(rate: number | null): { fraction: string; gloss: string } | null {
  if (rate === null || rate === 0) return null;
  const mag = Math.abs(rate);
  // Rates here are always ratios of small integers, so a denominator search is exact and cheap.
  let num = 0;
  let den = 0;
  for (let d = 1; d <= 400 && den === 0; d++) {
    const n = mag * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      num = Math.round(n);
      den = d;
    }
  }
  if (den === 0) return null;
  const fraction = den === 1 ? `${num}` : `${num}/${den}`;
  // One phrasing for every rate, so two gears can be compared by reading rather than by converting.
  // "16/9x as fast" and "9/16 of a turn" were the same quantity in two shapes, which is exactly the
  // arithmetic the child should be spending on the puzzle instead of on the label.
  const gloss =
    mag === 1 ? "1 turn per crank turn — same as the crank" : `${fraction} turns per crank turn`;
  return { fraction, gloss };
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
  /*
   * TOOTH 0 IS DRAWN AT THE TOP, and the -90 is why. SVG angle 0 points RIGHT (cos 0 = 1, sin 0 = 0),
   * so without this offset the marked tooth sits at 3 o'clock — and the whole puzzle is stated as
   * "the ember tooth comes back to the TOP". The maths was always right; the picture and the words
   * disagreed with each other, so the indicator announced "on top" about a tooth on the side.
   */
  const points: string[] = [];
  const TOP_OFFSET = -90;
  for (let i = 0; i < teeth; i++) {
    const a0 = (i * 360) / teeth - half + TOP_OFFSET;
    const a1 = (i * 360) / teeth + half + TOP_OFFSET;
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
        {marked ? <line x1={c} y1={c} x2={c} y2={c - r} className="gt-gear-spoke" /> : null}
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
  /** Whole crank turns the child has made. The unit the goal is stated in. */
  const [target, setTarget] = useState(0);
  /** Where the crank actually is, mid-animation. Equals `target` at rest. */
  const [turns, setTurns] = useState(0);
  const solvedRef = useRef(false);

  useEffect(() => {
    const next = generateLevel(seed + round, tierFor(round));
    setLevel(next);
    setTrain(next.train);
    setPicked(null);
    setTarget(0);
    setTurns(0);
    solvedRef.current = false;
  }, [seed, round]);

  /*
   * THE CRANK IS TURNED BY HAND, ONE COUNTED TURN AT A TIME. This replaced a continuous free-spin
   * animation, and the reason is that the goal was literally unobservable before.
   *
   * The goal is "the ember tooth comes back to the top after exactly N turns of the crank". With the
   * gears spinning on their own, nothing counted turns, nothing marked where a turn began or ended,
   * and there was no crank the child touched — so "12 crank turns" named a quantity that appeared
   * nowhere on screen. A player could not check the claim, could not tell a right answer from a wrong
   * one by watching, and reasonably could not tell what the sentence meant.
   *
   * Now: press once, the crank makes exactly one full turn, the counter goes up by one, and the
   * output gear moves by its own rate. Twelve presses IS twelve crank turns. The unit is a thing you
   * do.
   *
   * `turns` is fractional only while a press is animating; `target` is the integer count. Animation
   * is still a pure function of a start time and a start value rather than a per-frame accumulator,
   * so it stays reproducible (see the note at the top of this file).
   */
  useEffect(() => {
    if (turns === target) return;
    if (typeof requestAnimationFrame !== "function") {
      setTurns(target);
      return;
    }
    const from = turns;
    const distance = target - from;
    const DURATION_MS = 520;
    let raf = 0;
    let started: number | null = null;
    const tick = (now: number): void => {
      if (started === null) started = now;
      const t = Math.min(1, (now - started) / DURATION_MS);
      // ease-out, so a turn lands rather than stopping dead
      const eased = 1 - (1 - t) ** 3;
      setTurns(from + distance * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, turns]);

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
  /** A gear's angle after `turns` crank turns: its own rate times the turns, in degrees. */
  const angle = (rate: number | null): number => (rate === null ? 0 : rate * turns * 360);

  // Is the ember tooth back at the top right now? Exact: the output has made a whole number of turns.
  const outputTurns = rates.c === null ? null : rates.c * target;
  const emberOnTop =
    outputTurns !== null && target > 0 && Math.abs(outputTurns - Math.round(outputTurns)) < 1e-9;

  const slotTeeth = (slot: SlotName): number | undefined => train.placement[slot];

  return (
    <div className="gt-root">
      <button type="button" className="gt-back" onClick={onExit}>
        ← Back
      </button>

      {/* Explanation lives in the one shared teach-in; this file grows no tutorial of its own. The
          panel reuses `.gt-rule`'s words, minus the interpolated target this level happens to have —
          a static table cannot know it, and `.gt-rule` states it anyway. */}
      <TeachIn activity="gear-train" />

      <p className="gt-rule">
        A gear with more teeth turns slower. Fit three gears so the ember tooth comes back to the
        top after exactly <strong>{train.target}</strong> turns of the crank.
      </p>

      <div className="gt-bench">
        <div className="gt-stage">
          <span className="gt-label">crank · {train.crankTeeth} teeth</span>
          <Gear teeth={train.crankTeeth} angle={angle(rates.crank)} />
          <span className="gt-rate">↻ you turn this</span>
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
              {/* Speed is reported per gear as soon as that gear can have one, so the chain can be
                  reasoned about while it is still half-built rather than only once it is complete. */}
              <span className="gt-rate">
                {(() => {
                  const label = rateLabel(rate);
                  if (label === null) return "—";
                  const dir = (rate ?? 0) < 0 ? "↺" : "↻";
                  return `${dir} ${label.gloss}`;
                })()}
              </span>
            </div>
          );
        })}
      </div>

      {/*
       * The crank bar. This is what makes the goal checkable: the target is stated in crank turns, so
       * there has to be a crank the child turns and a count they can read. Pressing once is one turn,
       * by definition, and the ember-tooth light answers "is it back on top?" for the current count —
       * which is the exact question the goal asks.
       */}
      {ratio === null ? (
        /* No disabled crank. Same call as BalanceScale's split hint: a control that cannot do
           anything is worse than a sentence saying what to do first, and it keeps the "no dead
           controls" test honest rather than carving an exception into it. */
        <p className="gt-crank-hint">Fit all three gears, then you can turn the crank and count.</p>
      ) : (
        <div className="gt-crankbar">
          <button type="button" className="gt-crank-turn" onClick={() => setTarget((t) => t + 1)}>
            ↻ Turn the crank once
          </button>
          <span className="gt-crank-count">
            crank turns: <strong>{target}</strong> of {train.target}
          </span>
          <span className={`gt-ember${emberOnTop ? " gt-ember-on" : ""}`}>
            {target === 0
              ? "ember tooth starts on top"
              : emberOnTop
                ? "ember tooth is back on top"
                : "ember tooth is not on top"}
          </span>
          {target > 0 ? (
            <button
              type="button"
              className="gt-crank-reset"
              onClick={() => {
                setTarget(0);
                setTurns(0);
              }}
            >
              back to the start
            </button>
          ) : null}
        </div>
      )}

      <p className="gt-readout">
        {ratio === null ? (
          "Fill all three slots, then turn the crank and watch the ember tooth."
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
