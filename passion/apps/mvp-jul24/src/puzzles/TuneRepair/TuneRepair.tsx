/**
 * Tune Repair — the music stand.
 *
 * A short melody plays. One note is outside the key, so it sounds sour. Click that note, nudge it up
 * or down by a semitone, and the melody is right again.
 *
 * THIS ACTIVITY CANNOT BE SOLVED WITHOUT HEARING IT, AND THAT IS THE DESIGN
 * ------------------------------------------------------------------------------------------------
 * The previous version could be solved with the sound off, because "wrong" meant a broken *shape* and
 * a broken shape is visible. The first playtest said so plainly, and it was right: it was a pattern
 * puzzle drawn as a bar chart. Now "wrong" means *outside the key*, which has no visual signature —
 * the roll draws every semitone as a row, so a sour note occupies an ordinary row, and `generate.ts`
 * throws away any melody with a regularity for the eye to lock onto.
 *
 * The honest consequence, recorded rather than buried: **there is no visual route to the answer, so a
 * deaf or hard-of-hearing child cannot do this task.** That breaks `DISCOVERY-APP-PRD.md` §5.2's
 * Layer-3 parity requirement for this gadget. The surface owner took that trade knowingly. What this
 * file owes in return is to *say so* — see `tr-needs-sound` — rather than presenting a child with a
 * puzzle that silently cannot be finished. It is also the strongest argument for the music room
 * holding at least one activity that is not pitch-perception based.
 *
 * WHY ONLY A SEMITONE EITHER WAY
 * ------------------------------------------------------------------------------------------------
 * A selected note offers exactly two destinations, one row up and one row down. Free placement would
 * let a player satisfy "everything is in the key" while rewriting the melody, and — more importantly —
 * a long column of choices invites reading the answer off the screen. Two adjacent rows tell the eye
 * nothing: both look identical, and only one sounds right.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ------------------------------------------------------------------------------------------------
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7).
 *  - **No success or failure sound.** The confirmation is that the melody plays correctly, which is
 *    intrinsic to the task. A chime would be a reward contingency.
 *  - **No highlight on the sour note, and no "getting warmer".** Finding it is the puzzle.
 *  - **No autoplay.** The first sound of a session follows a click.
 *  - **No key signature, and no note names.** Being told the key would turn listening into lookup.
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
  /** The melody as the player has it now. Starts as the soured one. */
  phrase: number[];
}

const makeStand = (seed: number, index: number): Stand => {
  const puzzle = generateForRound(seed, index);
  return { index, puzzle, phrase: [...puzzle.broken] };
};

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
 * `tier` is the round to open at, so a registry entry for this gadget must set `supportsTier: true`.
 * Round index and tier index are the same number by construction, which makes "give me an easier one"
 * a one-number change. Never rendered: a visible tier would quantify the child's own engagement.
 */
export default function TuneRepair({ seed, tier = 0, onSolved, onExit }: PuzzleProps) {
  const [stand, setStand] = useState<Stand>(() => makeStand(seed, tier));
  const { puzzle, phrase } = stand;
  const [held, setHeld] = useState<number | null>(null);
  const [sounding, setSounding] = useState<number | null>(null);
  const engine = getAudioEngine();
  const [muted, setMuted] = useState(() => engine.isMuted());
  const firedFor = useRef<TuneRepairPuzzle | null>(null);
  const timers = useRef<number[]>([]);

  const solved = isSolved(phrase, puzzle.key);
  /** Nothing about this task is available without sound. */
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

  const play = useCallback(
    (notes: number[]) => {
      clearTimers();
      engine.stop();
      const seq = notesFor(notes, puzzle.beats);
      engine.playSequence(seq, puzzle.bpm);
      // The highlight runs on the same schedule whether or not sound is playing, so the child can see
      // which note is which — it locates notes in time, it never says which one is sour.
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

  /** Chromatic rows, highest pitch at the top. Every semitone gets one, which is what hides the note. */
  const rows = useMemo(() => {
    const out: number[] = [];
    for (let s = puzzle.hi; s >= puzzle.lo; s--) out.push(s);
    return out;
  }, [puzzle.hi, puzzle.lo]);

  const placeAt = (semitone: number) => {
    if (held === null) return;
    const next = [...phrase];
    next[held] = semitone;
    setStand((s) => ({ ...s, phrase: next }));
    setHeld(null);
    // Replay immediately: "did that fix it?" should not cost a second click, and hearing the result of
    // your own move is the whole feedback loop. Plays after a wrong move too, so it is not a reward.
    play(next);
  };

  const pickUp = (i: number) => {
    if (solved) return;
    setHeld((h) => (h === i ? null : i));
    engine.playNote({ semitone: phrase[i] as number, beats: 1 }, puzzle.bpm);
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

      {silent && (
        // `<output>` rather than a `<p role="status">`: it carries the status role implicitly, so the
        // announcement is semantic rather than bolted on.
        <output className="tr-needs-sound">
          {engine.supported
            ? "This one needs sound — turn it on to hear which note is wrong."
            : "This one needs sound, and this device has none."}
        </output>
      )}

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

      <div
        className="tr-roll"
        style={{
          gridTemplateColumns: puzzle.beats.map((b) => `${b}fr`).join(" "),
          gridTemplateRows: `repeat(${rows.length}, 1fr)`,
        }}
      >
        {/* Columns outer, rows inner, so DOM and keyboard order follow TIME rather than pitch. */}
        {phrase.map((noteSemitone, col) =>
          rows.map((semitone, rowIndex) => {
            const filled = noteSemitone === semitone;
            const isHeld = held === col;
            const key = `${semitone}-${col}`;
            const position = { gridColumn: col + 1, gridRow: rowIndex + 1 };
            // Only the two rows either side of the held note are destinations.
            const landing = held === col && !filled && Math.abs(semitone - noteSemitone) === 1;

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
                onClick={() => (filled ? pickUp(col) : placeAt(semitone))}
                aria-label={
                  filled
                    ? `${ordinal(col)} note${isHeld ? ", picked up" : ""}`
                    : `Nudge it ${semitone > noteSemitone ? "up" : "down"}`
                }
              />
            );
          }),
        )}
      </div>

      <div className="tr-stand">
        {held !== null && !solved && (
          <span className="tr-note-hint">Nudge it up or down a step.</span>
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
