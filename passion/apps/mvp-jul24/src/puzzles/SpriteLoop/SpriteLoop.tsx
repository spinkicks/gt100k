/**
 * Sprite Loop — build a behaviour that matches the one being demonstrated.
 *
 * THE DEMONSTRATION LEAVES NO TRAIL, AND THAT IS THE WHOLE DESIGN (rule X2)
 * ------------------------------------------------------------------------------------------------
 * The ghost loops forever and draws nothing behind it. Drawing its path is the easier build and it
 * would convert this activity into "match this shape", which is a visual pattern task the app already
 * measures four times over in `logic-games`. There is no trail element in this file and a test
 * asserts there never is one.
 *
 * WHAT IS DELIBERATELY ABSENT
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7).
 *  - **No printed target program.** The child meets the target as motion, never as code.
 *  - **No obstacles and no goal tile.** An empty board, because a maze would be Pipes.
 *  - **No "your third block is wrong."** Running shows what the program *does*; it does not mark it.
 *    Where it went differently is visible in the two creatures, which is feedback the child reads
 *    rather than a verdict handed down.
 *
 * DISCOVERABILITY IS IN THE AFFORDANCES, NOT IN THE TEACH-IN
 * ------------------------------------------------------------------------------------------------
 * The standing ruling is that a child who cannot find a mechanic needs the affordance fixed, and that
 * copy is not a sufficient fix on its own. So:
 *
 *  - the tray always shows **every** block in the round, never a subset that grows;
 *  - hovering *or focusing* a block **ghosts where the creature would end up**, so the mechanic is met
 *    as a consequence before it is committed — and it is on focus as well as hover so the affordance
 *    is not mouse-only;
 *  - `run` is disabled rather than hidden while the stack is empty, because a missing control and a
 *    visibly-unavailable one teach different things;
 *  - every block in the stack carries its own remove control, so a mistake is never a dead end.
 *
 * `repeat` is not offered by any tier yet (see `generate.ts`), but the stack renders a repeat's body
 * inside a visible bracket so that nesting will read as a shape rather than as a syntax when it is.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Program, Statement } from "../../code/program";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { openTier } from "../openTier";
import "./SpriteLoop.css";
import { TIERS, generateForRound } from "./generate";
import {
  GRID,
  type TrayBlock,
  isSolved,
  poseSequence,
  statementFor,
} from "./logic";

/** How long one tick of the demonstration is held, in ms. Presentation only. */
const TICK_MS = 520;

/**
 * Words for a block, and for a screen reader.
 *
 * Numerals are fine here and are not the music room's R1: a `move 2` block whose 2 was hidden would
 * be a program the child cannot read. The numeral IS the domain content in this room.
 */
function blockLabel(b: TrayBlock): string {
  switch (b.kind) {
    case "move":
      return b.steps === 1 ? "move one" : `move ${b.steps}`;
    case "turn":
      return b.quarters > 0 ? "turn right" : "turn left";
    case "wait":
      return b.ticks === 1 ? "wait" : `wait ${b.ticks}`;
    case "repeat":
      return `repeat ${b.times}`;
  }
}

function statementLabel(s: Statement): string {
  switch (s.kind) {
    case "move":
      return s.steps === 1 ? "move one" : `move ${s.steps}`;
    case "turn":
      return s.quarters > 0 ? "turn right" : "turn left";
    case "wait":
      return s.ticks === 1 ? "wait" : `wait ${s.ticks}`;
    case "repeat":
      return `repeat ${s.times}`;
  }
}

/** Which way a creature is facing, as a rotation. 0 = north. */
const FACING_DEG = [0, 90, 180, 270];

function Creature({
  x,
  y,
  facing,
  className,
}: {
  x: number;
  y: number;
  facing: number;
  className: string;
}): JSX.Element {
  return (
    <div
      className={className}
      style={{
        gridColumn: x + 1,
        gridRow: y + 1,
        transform: `rotate(${FACING_DEG[facing] ?? 0}deg)`,
      }}
      aria-hidden="true"
    />
  );
}

export default function SpriteLoop({ seed, tier, onSolved, onExit }: PuzzleProps): JSX.Element {
  const [roundIndex, setRoundIndex] = useState(() => openTier(tier ?? 0, TIERS.length));
  const [program, setProgram] = useState<Statement[]>([]);
  const [hovered, setHovered] = useState<TrayBlock | null>(null);
  const [solved, setSolved] = useState(false);
  /** Which tick of the child's own run is showing, or null when it is not running. */
  const [runTick, setRunTick] = useState<number | null>(null);
  /**
   * Which tick of the demonstration is showing **while nothing is running**.
   *
   * While a run IS in progress the demonstration is driven by `runTick` instead, so the two creatures
   * step in lockstep — see the note on `ghost` below. This tick only advances the idle loop.
   */
  const [idleTick, setIdleTick] = useState(0);

  const puzzle = useMemo(() => generateForRound(seed, roundIndex), [seed, roundIndex]);
  const ghostPoses = useMemo(
    () => poseSequence(puzzle.target, puzzle.start),
    [puzzle.target, puzzle.start],
  );
  const myPoses = useMemo(
    () => poseSequence(program, puzzle.start),
    [program, puzzle.start],
  );

  /**
   * The demonstration loops on its own while idle, so there is nothing to press to see it.
   *
   * Paused during a run, because a run drives it from the shared tick instead.
   */
  useEffect(() => {
    if (runTick !== null) return;
    const id = setInterval(() => setIdleTick((t) => (t + 1) % ghostPoses.length), TICK_MS);
    return () => clearInterval(id);
  }, [ghostPoses.length, runTick]);

  /**
   * A run lasts as long as the LONGER of the two walks, and each creature holds its last pose after
   * it finishes.
   *
   * Stopping at the child's own length would mean a child whose program is too short never sees the
   * rest of the demonstration — the run would cut off exactly where their answer ran out, hiding the
   * part they still had to account for. Running to the longer length shows them where the two parted
   * company, which is feedback they can read rather than a verdict.
   */
  const runLength = Math.max(myPoses.length, ghostPoses.length);
  useEffect(() => {
    if (runTick === null) return;
    if (runTick >= runLength - 1) return;
    const id = setTimeout(() => setRunTick((t) => (t === null ? null : t + 1)), TICK_MS);
    return () => clearTimeout(id);
  }, [runTick, runLength]);

  const add = useCallback((b: TrayBlock) => {
    setRunTick(null);
    setProgram((p) => [...p, statementFor(b)]);
  }, []);

  const removeAt = useCallback((i: number) => {
    setRunTick(null);
    setProgram((p) => p.filter((_, n) => n !== i));
  }, []);

  /**
   * Running reports the solve immediately and animates afterwards.
   *
   * The animation is presentation; the signal is not. Holding `onSolved` back until the last frame
   * would make a child who leaves mid-walk lose a solve they had already earned.
   */
  const runProgram = useCallback(() => {
    setRunTick(0);
    if (program.length > 0 && isSolved(puzzle, program as Program) && !solved) {
      setSolved(true);
      onSolved();
    }
  }, [program, puzzle, solved, onSolved]);

  const nextRound = useCallback(() => {
    setProgram([]);
    setRunTick(null);
    setIdleTick(0);
    setSolved(false);
    setRoundIndex((i) => i + 1);
  }, []);

  /**
   * THE TWO CREATURES MOVE ON THE SAME TICK DURING A RUN, AND THAT IS NOT A DETAIL.
   *
   * The demonstration used to loop on its own timer while a run played out on another, which meant
   * the two were never in motion at the same moment — so comparing them was a memory task, and the
   * activity quietly measured how well a child can hold a pattern in their head. That is the same
   * construct confound the music spec flags for `echo` (auditory working memory entangled with
   * interest), arriving here through the back door.
   *
   * Driving both from `runTick` makes the comparison *visible* instead of remembered. It also buys the
   * clearest success signal the room has: a correct program is the same length as the target, so the
   * two creatures walk in step and end the run superimposed — they become one arrow.
   */
  const ghost =
    runTick === null
      ? (ghostPoses[idleTick] ?? puzzle.start)
      : (ghostPoses[Math.min(runTick, ghostPoses.length - 1)] ?? puzzle.start);
  const mine = runTick === null ? myPoses[0]! : (myPoses[runTick] ?? myPoses[myPoses.length - 1]!);

  /** Where the hovered block would leave the creature. Never committed, never a trail. */
  const preview = useMemo(() => {
    if (hovered === null) return null;
    const poses = poseSequence([...program, statementFor(hovered)], puzzle.start);
    return poses[poses.length - 1] ?? null;
  }, [hovered, program, puzzle.start]);

  return (
    <div className="sl">
      <button type="button" className="sl-exit" onClick={onExit}>
        ← Back
      </button>

      <TeachIn activity="sprite-loop" />

      <div className="sl-board" aria-hidden="true">
        {Array.from({ length: GRID * GRID }, (_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed grid; position is the identity.
          <div className="sl-cell" key={i} />
        ))}
        <Creature x={ghost.x} y={ghost.y} facing={ghost.facing} className="sl-ghost" />
        <Creature x={mine.x} y={mine.y} facing={mine.facing} className="sl-mine" />
        {preview ? (
          <div
            className="sl-preview"
            style={{ gridColumn: preview.x + 1, gridRow: preview.y + 1 }}
          />
        ) : null}
      </div>

      <p className="sl-say">
        {solved
          ? "Yours moves the same way."
          : "The pale one is moving in a pattern. Build yours to match it."}
      </p>

      <div className="sl-tray" role="group" aria-label="Blocks you can use">
        {puzzle.tray.map((b, i) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: the tray is fixed per round.
            key={`${b.kind}-${i}`}
            type="button"
            className="sl-block"
            onClick={() => add(b)}
            onMouseEnter={() => setHovered(b)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(b)}
            onBlur={() => setHovered(null)}
          >
            {blockLabel(b)}
          </button>
        ))}
      </div>

      <ol className="sl-stack" aria-label="Your program">
        {program.map((s, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: order in the stack is the identity.
            key={`${s.kind}-${i}`}
            className={s.kind === "repeat" ? "sl-step sl-step-repeat" : "sl-step"}
          >
            <span className="sl-step-label">{statementLabel(s)}</span>
            {s.kind === "repeat" ? (
              <ol className="sl-bracket" aria-label="Inside the repeat">
                {s.body.map((inner, n) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: order is the identity.
                  <li className="sl-step" key={`${inner.kind}-${n}`}>
                    <span className="sl-step-label">{statementLabel(inner)}</span>
                  </li>
                ))}
              </ol>
            ) : null}
            <button
              type="button"
              className="sl-remove"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${statementLabel(s)}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ol>

      <div className="sl-controls">
        <button
          type="button"
          className="sl-run"
          onClick={runProgram}
          // Disabled rather than absent: an unavailable control and a missing one teach different
          // things, and a child who has not put a block down yet should be able to see that run is
          // the thing they will press.
          disabled={program.length === 0}
        >
          Run
        </button>
        {solved ? (
          <button type="button" className="sl-next" onClick={nextRound}>
            Next one
          </button>
        ) : null}
      </div>
    </div>
  );
}
