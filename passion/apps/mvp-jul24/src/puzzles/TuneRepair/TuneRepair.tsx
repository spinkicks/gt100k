/**
 * Tune Repair — the music stand.
 *
 * What the player sees and hears: a short phrase, drawn as blocks on a grid and playable on demand.
 * One note is in the wrong place. Click it, then click where it belongs. The tune plays correctly when
 * it is right, and that is the only confirmation there is.
 *
 * THE VISUAL CHANNEL IS MUSICAL NOTATION, NOT NUMBERS (rule R1)
 * ------------------------------------------------------------------------------------------------
 * Pitch is vertical position. Duration is horizontal width. Nothing on this screen is a number, a note
 * name, an interval name or a count, and `TuneRepair.test.tsx` asserts that by scanning the rendered
 * output for digits.
 *
 * That rule is what lets the puzzle be dual-coded without ceasing to be a music puzzle. The cabin
 * design requires a visual channel sufficient to solve by, so that the room works for a deaf child and
 * so the accessibility mirror can reach parity — but a channel that showed semitone counts would make
 * the puzzle arithmetic, which is the `math` cabin. A contour is musical content: replace it with
 * arbitrary symbols and "higher" stops meaning anything.
 *
 * WHY CLICK-THEN-PLACE AND NOT DRAG
 * ------------------------------------------------------------------------------------------------
 * Dragging is the interaction children are worst at — Nielsen Norman's testing has under-nines
 * abandoning tasks that need precise dragging, and their sharpest finding is that a click-only
 * alternative existing is worthless if nobody discovers it ("none of the kids in our study discovered
 * that function"). So click-then-place is not a fallback offered beside a drag; it is the only
 * interaction, it is keyboard-operable, and there is nothing to discover.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ------------------------------------------------------------------------------------------------
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7).
 *  - **No success or failure sound.** A correct answer is confirmed by the phrase playing correctly,
 *    which is intrinsic to the task. A fanfare would be a reward contingency, and the free-choice
 *    return this whole app measures is defined by the *absence* of one.
 *  - **No "you are close" meter, and no highlight on the wrong note.** Finding it is the puzzle.
 *  - **No autoplay.** The first sound of the session is a click on Play.
 *  - **No tutorial in this file.** The shared teach-in owns explanation.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAudioEngine } from "../../audio/engine";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import "./TuneRepair.css";
import { generateForRound } from "./generate";
import { type TuneRepairPuzzle, isSolved, notesFor } from "./logic";

interface Stand {
  index: number;
  puzzle: TuneRepairPuzzle;
  /** The phrase as the player has it now. Starts as the broken one. */
  phrase: number[];
}

const makeStand = (seed: number, index: number): Stand => {
  const puzzle = generateForRound(seed, index);
  return { index, puzzle, phrase: [...puzzle.broken] };
};

const COUNT_WORDS = [
  "",
  "a",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
] as const;

/**
 * Describe a move in steps, in words, relative to where the note currently sits.
 *
 * Words rather than digits, and relative rather than absolute, for the same reason as R1: "three
 * steps higher" is how a musician describes an interval, whereas "row 7" or "degree 4" hands a
 * screen-reader user a coordinate system to do arithmetic in that a sighted user does not get. A
 * blind player still has the audio channel, which is the primary one here — this label is for
 * navigating, not for solving.
 */
export function stepsLabel(delta: number): string {
  const size = Math.min(Math.abs(delta), COUNT_WORDS.length - 1);
  const word = COUNT_WORDS[size] ?? "several";
  const plural = size === 1 ? "step" : "steps";
  return `${word} ${plural} ${delta > 0 ? "higher" : "lower"}`;
}

const ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
] as const;

const ordinal = (i: number): string => ORDINALS[i] ?? "later";

/**
 * `tier` is the round to open at, and this component genuinely reads it — so a registry entry for
 * Tune Repair must set `supportsTier: true` (see the doc comment on `Gadget.supportsTier`).
 *
 * Round index and tier index are the same number by construction: `tierForIndex` cycles the tiers in
 * order, so opening at round N opens at tier N, and each subsequent tune advances through the cycle
 * from there. That is what lets "give me an easier one" be a one-number change rather than a mode.
 *
 * It is never rendered. A visible tier would be a quantified display of the child's own engagement,
 * which PRD §11 refuses.
 */
export default function TuneRepair({ seed, tier = 0, onSolved, onExit }: PuzzleProps) {
  const [stand, setStand] = useState<Stand>(() => makeStand(seed, tier));
  const { puzzle, phrase } = stand;
  /** Which note the player has picked up, or null. */
  const [held, setHeld] = useState<number | null>(null);
  /** Which note is sounding right now, for the playing highlight. */
  const [sounding, setSounding] = useState<number | null>(null);
  const engine = getAudioEngine();
  const [muted, setMuted] = useState(() => engine.isMuted());
  const firedFor = useRef<TuneRepairPuzzle | null>(null);
  const timers = useRef<number[]>([]);

  const solved = isSolved(phrase);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) clearTimeout(t);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (solved && firedFor.current !== puzzle) {
      firedFor.current = puzzle;
      onSolved();
    }
  }, [solved, puzzle, onSolved]);

  /** Play the phrase as it currently stands, walking the highlight along it. */
  const play = useCallback(
    (notes: number[]) => {
      clearTimers();
      engine.stop();
      const seq = notesFor(notes, puzzle.beats);
      engine.playSequence(seq, puzzle.bpm);
      // The highlight follows the same schedule whether or not sound is playing, so a muted or
      // silent session still shows which note is which.
      let atMs = 0;
      const beatMs = 60_000 / puzzle.bpm;
      seq.forEach((note, i) => {
        timers.current.push(
          window.setTimeout(() => setSounding(i), atMs),
          window.setTimeout(() => setSounding(null), atMs + note.beats * beatMs),
        );
        atMs += note.beats * beatMs;
      });
    },
    [clearTimers, engine, puzzle.beats, puzzle.bpm],
  );

  const rows = useMemo(() => {
    const out: number[] = [];
    // Highest pitch first, so up on screen is up in pitch.
    for (let d = puzzle.hi; d >= puzzle.lo; d--) out.push(d);
    return out;
  }, [puzzle.hi, puzzle.lo]);

  const placeAt = (degree: number) => {
    if (held === null) return;
    const next = [...phrase];
    next[held] = degree;
    setStand((s) => ({ ...s, phrase: next }));
    setHeld(null);
    /**
     * Play the whole phrase back, not just the note that moved.
     *
     * The first playtest's complaint was that the puzzle is hard, and a large part of that is that
     * "did my move fix it?" required pressing Play again — so the child had to hold the phrase in
     * their ear across a click. Hearing the result of your own move immediately is the tight loop
     * this task needs, and it is not autoplay in the policy sense (it is the direct consequence of a
     * click) nor a reward (it plays whether the move was right or wrong; being right just sounds
     * right, which is the intrinsic confirmation the design asks for).
     */
    play(next);
  };

  const pickUp = (i: number) => {
    if (solved) return;
    setHeld((h) => (h === i ? null : i));
    engine.playNote({ degree: phrase[i] as number, beats: 1 });
  };

  const reset = useCallback(() => {
    setHeld(null);
    setStand((s) => ({ ...s, phrase: [...s.puzzle.broken] }));
  }, []);

  const nextTune = useCallback(() => {
    clearTimers();
    engine.stop();
    setHeld(null);
    setSounding(null);
    setStand((s) => makeStand(seed, s.index + 1));
  }, [clearTimers, engine, seed]);

  const toggleMute = () => {
    const next = !muted;
    engine.setMuted(next);
    setMuted(next);
  };

  return (
    <div className="tr">
      <button type="button" className="tr-exit" onClick={onExit}>
        ← Back
      </button>

      <TeachIn activity="tune-repair" />

      <div className="tr-controls">
        <button type="button" className="tr-play" onClick={() => play(phrase)}>
          ▶ Play the tune
        </button>
        {engine.supported && (
          <button
            type="button"
            className="tr-mute"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        )}
        <button
          type="button"
          className="tr-reset"
          onClick={reset}
          disabled={phrase.every((d, i) => d === puzzle.broken[i])}
        >
          Put it back
        </button>
      </div>

      {/* The roll. A grid of rows (pitch) by columns (time). Presentational only: the accessible
          description of each note lives on its button. */}
      <div
        className="tr-roll"
        style={{
          gridTemplateColumns: puzzle.beats.map((b) => `${b}fr`).join(" "),
          gridTemplateRows: `repeat(${rows.length}, 1fr)`,
        }}
      >
        {/* Columns outer, rows inner — so DOM order is TIME order. Explicit gridColumn/gridRow means
            the visual layout does not depend on this, but keyboard and screen-reader traversal does:
            iterating rows first would walk the phrase by pitch, handing a blind player the notes in
            an order the tune is not in. */}
        {phrase.map((noteDegree, col) =>
          rows.map((degree, rowIndex) => {
            const filled = noteDegree === degree;
            const isHeld = held === col;
            const key = `${degree}-${col}`;
            const position = { gridColumn: col + 1, gridRow: rowIndex + 1 };
            // A cell is clickable when it is the note itself (pick it up), or when a note is held and
            // this is a landing place in that note's own column.
            const landing = held === col && !filled;

            // Everything else is empty paper. It is a plain element rather than a disabled button on
            // purpose: a grid of eighty labelled disabled buttons is unusable with a screen reader
            // and made every landing label ambiguous, which is the bug this shape fixes.
            if (!filled && !landing) {
              return <div key={key} className="tr-cell" style={position} aria-hidden="true" />;
            }

            return (
              <button
                key={key}
                type="button"
                className={[
                  "tr-cell",
                  filled ? "tr-note" : "",
                  isHeld && filled ? "tr-held" : "",
                  landing ? "tr-landing" : "",
                  sounding === col && filled ? "tr-sounding" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={position}
                onClick={() => (filled ? pickUp(col) : placeAt(degree))}
                aria-label={
                  filled
                    ? `${ordinal(col)} note${isHeld ? ", picked up" : ""}`
                    : `Move it ${stepsLabel(degree - (phrase[col] as number))}`
                }
              />
            );
          }),
        )}
      </div>

      <div className="tr-stand">
        {held !== null && !solved && (
          <span className="tr-note-hint">Now click where it should go.</span>
        )}
        {solved && <span className="tr-note-right">That is the tune.</span>}
        {solved && (
          <button type="button" className="tr-next" onClick={nextTune}>
            Another tune →
          </button>
        )}
      </div>
    </div>
  );
}
