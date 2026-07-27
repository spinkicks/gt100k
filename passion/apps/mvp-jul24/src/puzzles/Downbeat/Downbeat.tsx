/**
 * Downbeat — the pulse strip.
 *
 * A loop of evenly-spaced pulses plays. Some are stressed. Mark every stressed one.
 *
 * EVERY PULSE IS DRAWN IDENTICALLY, AND THAT IS THE WHOLE DESIGN (rule R2)
 * ------------------------------------------------------------------------------------------------
 * Same width, same height, same colour, evenly spaced. The strip says *where the pulses are in time* and
 * nothing whatsoever about which of them are stressed — because the stress is the answer, and R2 is that
 * the property making an answer wrong must have no visual signature.
 *
 * That is why the metre is carried by loudness rather than by note length, which is how the spec
 * originally had it: a wide block every third position writes the answer on the screen.
 *
 * The only mark that ever appears without the child putting it there is which pulse is *currently
 * sounding*, and that is positional — it says "this one is playing now", never "this one is stressed".
 *
 * WHAT IS DELIBERATELY ABSENT
 * ------------------------------------------------------------------------------------------------
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7).
 *  - **No metronome or click track**, which would supply an external pulse grid and hand over the metre.
 *  - **No "which ones did you get wrong".** The line says how many are missing or extra, never where —
 *    a count is feedback, positions would be the answer.
 *  - **No numerals.** "How many beats to a bar" is never asked or displayed (R1).
 *  - **No autoplay.** The first sound of a session follows a click.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioEngine } from "../../audio/engine";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import "./Downbeat.css";
import { generateForRound } from "./generate";
import { type DownbeatPuzzle, isSolved, markingDiff, notesFor } from "./logic";

interface Strip {
  index: number;
  puzzle: DownbeatPuzzle;
  marked: ReadonlySet<number>;
}

const makeStrip = (seed: number, index: number): Strip => ({
  index,
  puzzle: generateForRound(seed, index),
  marked: new Set<number>(),
});

/** Words, not digits (R1). Only ever used for "how many are missing", never for a metre. */
const COUNTS = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight"] as const;
const countWord = (n: number): string => COUNTS[n] ?? "several";

/**
 * Positional names for the pulses, for screen-reader users.
 *
 * Words rather than digits (R1), and ordinals rather than a count, because "the fourth pulse" is a place
 * in the loop while "pulse 4" invites arithmetic on a grid a sighted player is not given. Says nothing
 * about stress — that is the answer.
 */
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
  "eleventh",
  "twelfth",
  "thirteenth",
  "fourteenth",
  "fifteenth",
  "sixteenth",
] as const;
const ordinal = (i: number): string => ORDINALS[i] ?? "later";

export default function Downbeat({ seed, tier = 0, onSolved, onExit }: PuzzleProps) {
  const [strip, setStrip] = useState<Strip>(() => makeStrip(seed, tier));
  const { puzzle, marked } = strip;
  const [sounding, setSounding] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const engine = getAudioEngine();
  const [muted, setMuted] = useState(() => engine.isMuted());
  const firedFor = useRef<DownbeatPuzzle | null>(null);
  const timers = useRef<number[]>([]);

  const solved = isSolved(puzzle, marked);
  const silent = !engine.supported || muted;

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

  const play = useCallback(() => {
    clearTimers();
    engine.stop();
    const seq = notesFor(puzzle);
    engine.playSequence(seq, puzzle.bpm);
    const beatMs = 60_000 / puzzle.bpm;
    seq.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setSounding(i), i * beatMs),
        window.setTimeout(() => setSounding(null), (i + 1) * beatMs),
      );
    });
  }, [clearTimers, engine, puzzle]);

  const toggle = (i: number) => {
    if (solved) return;
    setChecked(false);
    setStrip((s) => {
      const next = new Set(s.marked);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { ...s, marked: next };
    });
  };

  const clear = useCallback(() => {
    setChecked(false);
    setStrip((s) => ({ ...s, marked: new Set<number>() }));
  }, []);

  const nextLoop = useCallback(() => {
    clearTimers();
    engine.stop();
    setSounding(null);
    setChecked(false);
    setStrip((s) => makeStrip(seed, s.index + 1));
  }, [clearTimers, engine, seed]);

  const toggleMute = () => {
    const next = !muted;
    engine.setMuted(next);
    setMuted(next);
  };

  const diff = markingDiff(puzzle, marked);

  return (
    <div className="db">
      <button type="button" className="db-exit" onClick={onExit}>
        ← Back
      </button>

      <TeachIn activity="downbeat" />

      {silent && (
        // `<output>` carries the status role implicitly.
        <output className="db-needs-sound">
          {engine.supported
            ? "This one needs sound — turn it on to hear which pulses are stressed."
            : "This one needs sound, and this device has none."}
        </output>
      )}

      <div className="db-controls">
        <button type="button" className="db-play" onClick={play}>
          ▶ Play the loop
        </button>
        {engine.supported && (
          <button
            type="button"
            className="db-mute"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        )}
        <button
          type="button"
          className="db-check"
          onClick={() => setChecked(true)}
          disabled={marked.size === 0 || solved}
        >
          Check
        </button>
        <button type="button" className="db-clear" onClick={clear} disabled={marked.size === 0}>
          Clear the marks
        </button>
      </div>

      {/* The strip. Identical blocks, evenly spaced: position in time and nothing else. */}
      <ul className="db-strip">
        {Array.from({ length: puzzle.pulses }, (_, i) => {
          const isMarked = marked.has(i);
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed strip of pulses; position is the identity.
              key={i}
              className="db-slot"
            >
              <button
                type="button"
                className={[
                  "db-pulse",
                  isMarked ? "db-marked" : "",
                  sounding === i ? "db-sounding" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => toggle(i)}
                aria-pressed={isMarked}
                aria-label={`${ordinal(i)} pulse`}
              />
            </li>
          );
        })}
      </ul>

      <div className="db-bench">
        {checked && !solved && (
          <span className="db-note-off">
            {diff.missing > 0 && `${countWord(diff.missing)} still to find`}
            {diff.missing > 0 && diff.extra > 0 && ", and "}
            {diff.extra > 0 && `${countWord(diff.extra)} marked that is not stressed`}
            {"."}
          </span>
        )}
        {solved && <span className="db-note-right">That is the beat.</span>}
        {solved && (
          <button type="button" className="db-next" onClick={nextLoop}>
            Another loop →
          </button>
        )}
      </div>
    </div>
  );
}
