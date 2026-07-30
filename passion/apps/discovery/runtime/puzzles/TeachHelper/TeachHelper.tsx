/**
 * Teach the Helper — instructions that have to work on boards the child cannot see.
 *
 * THE FAILURE IS WATCHED, NOT ANNOUNCED
 * ------------------------------------------------------------------------------------------------
 * When a program clears the visible board and fails a hidden one, the hidden boards are *shown*, with
 * whatever the helper left behind still sitting on them. A child does not read "that did not
 * generalise"; they see a parcel nobody picked up, on a floor they had not thought about. That is the
 * whole lesson and it is not something copy can deliver.
 *
 * Before a run the hidden boards are not merely hidden but **not yet drawn**, because a child who can
 * see them would write for them and the round would measure nothing.
 *
 * WHY THERE IS NO PARSER TO OUTSMART
 * ------------------------------------------------------------------------------------------------
 * The specced version of this door had a literal-minded helper interpreting near-natural-language and
 * doing something amusingly wrong when it was ambiguous — which is one step from
 * guess-what-the-parser-wants, the thing PROJECT.md forbids. So the words are the same four the rest
 * of the cabin uses, every one has a single visible rule, the whole list is on screen, and **what the
 * helper understood is echoed back live as the child types**. A word either turns into an instruction
 * or says what it needs. There is nothing to second-guess.
 *
 * WHAT IS DELIBERATELY ABSENT
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7).
 *  - **No hint that the hidden boards differ from the visible one.** Being told would replace the
 *    insight with an instruction, and the insight is the thing being detected.
 *  - **No penalty for a wasted `take`.** Grabbing where there is nothing must stay free, or "grab
 *    everywhere" becomes a punished strategy and the door argues against its own answer.
 */
import { useCallback, useMemo, useState } from "react";
import { VERBS, parseLine } from "../../code/parse";
import type { Program, Statement } from "../../code/program";
import type { PuzzleProps } from "../../game/types";
import { cellKey } from "../SpriteLoop/logic";
import TeachIn from "../../teachin/TeachIn";
import { openTier } from "../openTier";
import "./TeachHelper.css";
import { TIERS, generateForRound } from "./generate";
import { isSolved, leftovers, outcomes } from "./logic";
import { HELPER_START, corridorCells } from "./world";

/**
 * The helper stands on the same cell at the start of every floor — the left end, facing east (see
 * `HELPER_START`). Drawing it there is what makes "it picks up whatever is under the helper's feet"
 * and "take while it is standing there" something the child can see rather than infer: without a
 * marker the board is a row of cells and parcels with no actor in it, and the rule has no referent.
 */
const START_KEY = cellKey(HELPER_START.x, HELPER_START.y);

const REASON_TEXT: Record<string, string> = {
  empty: "",
  "unknown-word": "I do not know that word",
  "needs-number": "how many?",
  "needs-side": "left or right?",
};

/** One corridor, drawn. `left` is what is still on the floor; `null` means nothing has run yet. */
function Corridor({
  parcels,
  label,
  cleared,
}: {
  parcels: ReadonlySet<string>;
  label: string;
  cleared: boolean | null;
}): JSX.Element {
  return (
    <div className="th-row">
      <span className="th-row-label">{label}</span>
      <div className="th-corridor">
        {corridorCells().map((key) => (
          <div className="th-cell" key={key}>
            {parcels.has(key) ? <span className="th-parcel" aria-hidden="true" /> : null}
            {/* A ring, not a disc, so a parcel on the helper's own cell — the one it must `take`
                from where it stands — still shows through the middle. */}
            {key === START_KEY ? (
              <span
                className="th-helper"
                role="img"
                aria-label="the helper, at the start, facing right"
              />
            ) : null}
          </div>
        ))}
      </div>
      {cleared === null ? null : (
        <span className={cleared ? "th-verdict th-verdict-ok" : "th-verdict"}>
          {cleared ? "all picked up" : "something left behind"}
        </span>
      )}
    </div>
  );
}

export default function TeachHelper({ seed, tier, onSolved, onExit }: PuzzleProps): JSX.Element {
  const [roundIndex, setRoundIndex] = useState(() => openTier(tier ?? 0, TIERS.length));
  const puzzle = useMemo(() => generateForRound(seed, roundIndex), [seed, roundIndex]);

  const [text, setText] = useState("");
  const [ran, setRan] = useState(false);
  /** See SpriteLoop.tsx: what the room SAYS follows the instructions; what it COUNTS must not. */
  const [reported, setReported] = useState(false);

  /** What the helper understood, line by line — echoed live so no word has to be trusted blind. */
  const { program, problems } = useMemo(() => {
    const program: Statement[] = [];
    const problems: string[] = [];
    for (const raw of text.split("\n")) {
      if (raw.trim() === "") continue;
      const parsed = parseLine(raw);
      if (parsed.ok) program.push(parsed.statement);
      else problems.push(`"${raw.trim()}" — ${REASON_TEXT[parsed.reason] || "I cannot read this"}`);
    }
    return { program: program as Program, problems };
  }, [text]);

  const results = useMemo(() => (ran ? outcomes(puzzle, program) : null), [ran, puzzle, program]);
  /**
   * What is still on each floor once the helper has finished. Drawn instead of the starting
   * arrangement, so the picture is the evidence for the verdict beside it rather than a contradiction
   * of it — see `leftovers` for the bug this replaced.
   */
  const left = useMemo(() => (ran ? leftovers(puzzle, program) : null), [ran, puzzle, program]);

  /** Whether the instructions as they stand clear every floor. Recomputed, never stored. */
  const matches = useMemo(() => program.length > 0 && isSolved(puzzle, program), [puzzle, program]);
  /** Success is only claimed after a send, because before one the child has not watched it happen. */
  const showSuccess = ran && matches;

  const send = useCallback(() => {
    setRan(true);
    if (matches && !reported) {
      setReported(true);
      onSolved();
    }
  }, [matches, reported, onSolved]);

  const nextRound = useCallback(() => {
    setText("");
    setRan(false);
    setReported(false);
    setRoundIndex((i) => i + 1);
  }, []);

  const edit = useCallback((next: string) => {
    setText(next);
    // A change to the instructions makes the last run stale, so the boards go back to unrun rather
    // than showing a verdict about a program that no longer exists.
    setRan(false);
  }, []);

  return (
    <div className="th">
      <button type="button" className="th-exit" onClick={onExit}>
        ← Back
      </button>

      <TeachIn activity="teach-helper" />

      <div className="th-boards">
        <Corridor
          parcels={left ? left[0]! : puzzle.visible}
          label="This floor"
          cleared={results ? results[0]! : null}
        />
        {ran
          ? puzzle.hidden.map((h, i) => (
              <Corridor
                // biome-ignore lint/suspicious/noArrayIndexKey: fixed set of arrangements per round.
                key={i}
                parcels={left ? left[i + 1]! : h}
                label="Another floor"
                cleared={results ? results[i + 1]! : null}
              />
            ))
          : null}
      </div>

      <label className="th-write">
        <span className="th-write-label">Your instructions, one on each line</span>
        <textarea
          className="th-text"
          value={text}
          onChange={(e) => edit(e.target.value)}
          rows={7}
          spellCheck={false}
          autoComplete="off"
        />
      </label>

      <p className="th-words">
        Words the helper knows: {VERBS.join(", ")} — turn takes left or right, and take picks up
        whatever is under the helper's feet.
      </p>

      <ul className="th-understood" aria-label="What the helper understood">
        {program.map((s, i) => (
          // The composite key already carries the index, so noArrayIndexKey does not fire and needs
          // no suppression here; order is the step's identity in this read-only recap.
          <li className="th-chip" key={`${s.kind}-${i}`}>
            {s.kind === "move" ? `move ${s.steps}` : s.kind === "turn" ? "turn" : s.kind}
          </li>
        ))}
      </ul>

      {problems.length > 0 ? (
        <ul className="th-problems" aria-label="Lines the helper could not read">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}

      <p className="th-say">
        {showSuccess
          ? "It worked on every floor, including the ones you never saw."
          : ran
            ? "Send it again when you have changed something."
            : "The helper will try your instructions on this floor and on some others you have not seen."}
      </p>

      <div className="th-controls">
        <button type="button" className="th-send" onClick={send} disabled={program.length === 0}>
          Send the helper
        </button>
        {showSuccess ? (
          <button type="button" className="th-next" onClick={nextRound}>
            Next one
          </button>
        ) : null}
      </div>
    </div>
  );
}
