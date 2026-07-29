/**
 * Trace & Repair — the program does the wrong thing, and one line is why.
 *
 * THE SCRUBBER IS THE INSTRUMENT, NOT A GARNISH
 * ------------------------------------------------------------------------------------------------
 * `generate.ts` guarantees, per round, that **more than one line could be blamed from where the
 * creature stops** and that the two runs part company somewhere in the middle. So the final board
 * genuinely cannot tell a child which line is wrong; only the middle of the run can. Dragging the
 * scrubber moves both creatures — the pale intended one and the child's actual one — through the same
 * tick, so the moment they part company is a thing you watch happen rather than deduce.
 *
 * WHAT IS DELIBERATELY ABSENT
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7).
 *  - **No prose in the round.** Logic Grid left `logic-games` because it loads reading comprehension
 *    on top of its own construct; a round here is code and a board, and the intended result is a
 *    creature that moves rather than a sentence saying where it should go.
 *  - **No mark on the faulty line.** Highlighting it would be the answer. The line the child is
 *    editing is marked; the line that is *wrong* never is.
 *  - **No "wrong, try again".** Running shows what the program does. Divergence is visible in the two
 *    creatures, which is something the child reads rather than a verdict handed down.
 *
 * DISCOVERABILITY IS IN THE AFFORDANCES
 *  - every line is an editable field, so nothing has to say which ones can be changed;
 *  - the whole word list is on screen, taken from the parser's own `VERBS` so the two cannot drift —
 *    a child must never be asked to guess a word;
 *  - a line that does not parse says what it needs ("how many?") rather than "invalid", and the
 *    creature simply stops at that line instead of the room breaking;
 *  - the scrubber is present and usable from the first frame, because a child who does not touch it
 *    has to be able to see what it is for.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { VERBS, parseLine, printLine } from "../../code/parse";
import type { Program, Statement } from "../../code/program";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import { openTier } from "../openTier";
import { GRID } from "../SpriteLoop/logic";
import "./TraceRepair.css";
import { TIERS, generateForRound } from "./generate";
import { type TraceRepairPuzzle, isSolved, posesOf } from "./logic";

const FACING_DEG = [0, 90, 180, 270];

/** What to say back about a line that does not parse yet. Never the word "invalid". */
const REASON_TEXT: Record<string, string> = {
  empty: "this line is blank",
  "unknown-word": "I do not know that word",
  "needs-number": "how many?",
  "needs-side": "left or right?",
};

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

/** The program the child currently has, plus which lines are not yet readable. */
function readProgram(lines: readonly string[]): {
  program: Program;
  problems: ReadonlyMap<number, string>;
} {
  const program: Statement[] = [];
  const problems = new Map<number, string>();
  lines.forEach((text, i) => {
    const parsed = parseLine(text);
    if (parsed.ok) program.push(parsed.statement);
    else problems.set(i, REASON_TEXT[parsed.reason] ?? "I cannot read this line");
  });
  return { program, problems };
}

export default function TraceRepair({ seed, tier, onSolved, onExit }: PuzzleProps): JSX.Element {
  const [roundIndex, setRoundIndex] = useState(() => openTier(tier ?? 0, TIERS.length));
  const puzzle: TraceRepairPuzzle = useMemo(
    () => generateForRound(seed, roundIndex),
    [seed, roundIndex],
  );

  const [lines, setLines] = useState<string[]>(() => puzzle.buggy.map(printLine));
  const [tick, setTick] = useState(0);
  /** See SpriteLoop.tsx: what the room SAYS follows the program; what it COUNTS must not. */
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setLines(puzzle.buggy.map(printLine));
    setTick(0);
    setReported(false);
  }, [puzzle]);

  const { program, problems } = useMemo(() => readProgram(lines), [lines]);

  const intendedPoses = useMemo(() => posesOf(puzzle, puzzle.intended), [puzzle]);
  const myPoses = useMemo(() => posesOf(puzzle, program), [puzzle, program]);

  /**
   * The scrubber spans the LONGER of the two runs, and each creature holds its last pose past its own
   * end. A child whose edit made the program shorter must still be able to watch the intended run
   * finish, or the comparison stops exactly where their mistake starts.
   */
  const lastTick = Math.max(intendedPoses.length, myPoses.length) - 1;
  const at = (poses: readonly { x: number; y: number; facing: number }[]) =>
    poses[Math.min(tick, poses.length - 1)]!;
  const intendedNow = at(intendedPoses);
  const mineNow = at(myPoses);

  /** Whether the program as it stands reproduces the intended run. Recomputed, never stored. */
  const matches = problems.size === 0 && program.length > 0 && isSolved(puzzle, program);

  /** Reported the moment the run matches, so a child never has to scrub to the end to be counted. */
  useEffect(() => {
    if (reported || !matches) return;
    setReported(true);
    onSolved();
  }, [matches, reported, onSolved]);

  const editLine = useCallback((i: number, text: string) => {
    setLines((ls) => ls.map((old, n) => (n === i ? text : old)));
  }, []);

  const nextRound = useCallback(() => setRoundIndex((i) => i + 1), []);

  return (
    <div className="tr">
      <button type="button" className="tr-exit" onClick={onExit}>
        ← Back
      </button>

      <TeachIn activity="trace-repair" />

      <div className="tr-body">
        <div className="tr-board" aria-hidden="true">
          {Array.from({ length: GRID * GRID }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a fixed grid; position is the identity.
            <div className="tr-cell" key={i} />
          ))}
          <Creature
            x={intendedNow.x}
            y={intendedNow.y}
            facing={intendedNow.facing}
            className="tr-intended"
          />
          <Creature x={mineNow.x} y={mineNow.y} facing={mineNow.facing} className="tr-mine" />
        </div>

        <ol className="tr-listing" aria-label="The program">
          {lines.map((text, i) => {
            const problem = problems.get(i);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: a line's number is its identity.
              <li className="tr-line" key={i}>
                <input
                  className={problem ? "tr-input tr-input-unread" : "tr-input"}
                  value={text}
                  onChange={(e) => editLine(i, e.target.value)}
                  aria-label={`Line ${i + 1}`}
                  spellCheck={false}
                  autoComplete="off"
                />
                {problem ? <span className="tr-problem">{problem}</span> : null}
              </li>
            );
          })}
        </ol>
      </div>

      <label className="tr-scrub">
        <span className="tr-scrub-label">Step through it</span>
        <input
          type="range"
          min={0}
          max={Math.max(lastTick, 1)}
          value={Math.min(tick, lastTick)}
          onChange={(e) => setTick(Number(e.target.value))}
        />
      </label>

      <p className="tr-say">
        {matches
          ? "Both go the same way now."
          : "The pale one shows what it should do. Find the line that sends yours somewhere else."}
      </p>

      <p className="tr-words">
        Words you can use: {VERBS.join(", ")} — and for turn, left or right.
      </p>

      {matches ? (
        <button type="button" className="tr-next" onClick={nextRound}>
          Next one
        </button>
      ) : null}
    </div>
  );
}
