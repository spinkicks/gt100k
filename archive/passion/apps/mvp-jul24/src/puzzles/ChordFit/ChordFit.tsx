/**
 * Chord Fit — the listening bench.
 *
 * One melody note is sounding. Three chords can be played under it. Exactly one contains that note and
 * holds it up; the other two clash.
 *
 * THERE IS NOTHING TO LOOK AT, AND THAT IS THE FEATURE
 * ------------------------------------------------------------------------------------------------
 * `PROJECT.md` R2: the property that makes an answer wrong must have no visual signature. This screen
 * therefore draws **no notes, no staff, no roll, no heights and no spacing** — the three options are
 * identical buttons distinguished only by what they sound like. The spec originally proposed stacking
 * each chord's notes vertically "so interval spacing is visible", which is precisely the mistake that
 * turned the other gadget into a shape puzzle: a child would learn which spacing looks right and stop
 * listening.
 *
 * So the visual design here is deliberately, almost aggressively plain. If a future change adds a picture
 * of the chords, it has removed the reason this activity is in the music cabin.
 *
 * WHY EACH OPTION PLAYS THE CHORD *WITH* THE NOTE
 * ------------------------------------------------------------------------------------------------
 * Support is a relation, not a property, so it cannot be judged from the chord alone. Pressing an option
 * sounds the chord and the melody note together, which is the comparison the task is actually about. The
 * note can also be heard by itself, because knowing what you are trying to support is not a hint.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ------------------------------------------------------------------------------------------------
 *  - **No score, points, stars, streak, timer or attempt count** (PRD §11, memo 06 D7). A wrong pick
 *    costs nothing and is not counted; the child hears the clash, which is the whole feedback.
 *  - **No success or failure sound.** Being right sounds like consonance, which is intrinsic.
 *  - **No chord names, no key, no numerals.** Being told the key would turn listening into lookup.
 *  - **No limit on replays.** Listening repeatedly is the activity, not a cost.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioEngine } from "../../audio/engine";
import type { PuzzleProps } from "../../game/types";
import TeachIn from "../../teachin/TeachIn";
import "./ChordFit.css";
import { openTier } from "../openTier";
import { TIERS, generateForRound } from "./generate";
import { type ChordFitPuzzle, isCorrect, voicingFor } from "./logic";

interface Bench {
  index: number;
  puzzle: ChordFitPuzzle;
  /** Which option the child has committed to, or null. */
  picked: number | null;
}

const makeBench = (seed: number, index: number): Bench => ({
  index,
  puzzle: generateForRound(seed, index),
  picked: null,
});

/** Positional words, so nothing on screen is a digit (R1). */
const PLACES = ["first", "second", "third"] as const;

/**
 * `tier` is the round to open at, so the registry entry for this gadget sets `supportsTier: true`.
 * Clamped through `openTier`, because the overlay's counter grows without bound while `TIERS` has
 * three entries — see `puzzles/openTier.ts`. The "Next round" path below still wraps on purpose.
 */
export default function ChordFit({ seed, tier = 0, onSolved, onExit }: PuzzleProps) {
  const [bench, setBench] = useState<Bench>(() => makeBench(seed, openTier(tier, TIERS.length)));
  const { puzzle, picked } = bench;
  /** Which option is ringing, purely so the button can show it is the one you are hearing. */
  const [ringing, setRinging] = useState<number | null>(null);
  const engine = getAudioEngine();
  const [muted, setMuted] = useState(() => engine.isMuted());
  const firedFor = useRef<ChordFitPuzzle | null>(null);
  const timers = useRef<number[]>([]);

  const solved = picked !== null && isCorrect(puzzle, picked);
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

  const playOption = (i: number) => {
    clearTimers();
    engine.stop();
    const ms = engine.playChord(voicingFor(puzzle, i), puzzle.bpm);
    setRinging(i);
    timers.current.push(window.setTimeout(() => setRinging(null), ms));
  };

  const playNoteAlone = () => {
    clearTimers();
    engine.stop();
    engine.playNote({ semitone: puzzle.melodyNote, beats: puzzle.beats }, puzzle.bpm);
    setRinging(null);
  };

  const choose = (i: number) => {
    if (solved) return;
    setBench((b) => ({ ...b, picked: i }));
    // Always play the pick, right or wrong: hearing the clash is how a wrong answer teaches anything,
    // and playing only on success would make the sound a reward.
    playOption(i);
  };

  const nextRound = useCallback(() => {
    clearTimers();
    engine.stop();
    setRinging(null);
    setBench((b) => makeBench(seed, b.index + 1));
  }, [clearTimers, engine, seed]);

  const toggleMute = () => {
    const next = !muted;
    engine.setMuted(next);
    setMuted(next);
  };

  const wrongPick = picked !== null && !solved;

  return (
    <div className="cf">
      <button type="button" className="cf-exit" onClick={onExit}>
        ← Back
      </button>

      <TeachIn activity="chord-fit" />

      {silent && (
        // `<output>` carries the status role implicitly.
        <output className="cf-needs-sound">
          {engine.supported
            ? "This one needs sound — turn it on to hear which chord fits."
            : "This one needs sound, and this device has none."}
        </output>
      )}

      <div className="cf-controls">
        <button type="button" className="cf-note" onClick={playNoteAlone}>
          ▶ Hear the note
        </button>
        {engine.supported && (
          <button
            type="button"
            className="cf-mute"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        )}
      </div>

      {/* Three identical options. No geometry, no notation, nothing to compare by eye. */}
      <ul className="cf-options">
        {puzzle.options.map((_, i) => {
          const place = PLACES[i] ?? "next";
          const chosen = picked === i;
          return (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: three fixed slots; position is the identity.
              key={i}
              className={[
                "cf-option",
                ringing === i ? "cf-ringing" : "",
                chosen && solved ? "cf-chosen-right" : "",
                chosen && !solved ? "cf-chosen-wrong" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="cf-play"
                onClick={() => playOption(i)}
                aria-label={`Hear the ${place} chord under the note`}
              >
                ▶
              </button>
              <button
                type="button"
                className="cf-pick"
                onClick={() => choose(i)}
                disabled={solved}
                aria-label={`Choose the ${place} chord`}
              >
                This one
              </button>
            </li>
          );
        })}
      </ul>

      <div className="cf-bench">
        {wrongPick && <span className="cf-note-clash">That one clashes. Keep listening.</span>}
        {solved && <span className="cf-note-right">That one holds it up.</span>}
        {solved && (
          <button type="button" className="cf-next" onClick={nextRound}>
            Another note →
          </button>
        )}
      </div>
    </div>
  );
}
