/**
 * The app's one sound source. Synthesized, never sampled.
 *
 * WHY THERE ARE NO AUDIO FILES AND THERE MUST NEVER BE
 * ------------------------------------------------------------------------------------------------
 * `src/shelf/types.ts` makes offline a hard requirement for this app: "no `fetch`, no image URL, and
 * nothing that degrades when the network is gone — the plane, the school bus and the bad hotel wifi
 * all get the same shelf." The shelf's diagrams are inline SVG for exactly that reason. A sampled
 * instrument would be the first asset in this app to break that promise, so every note here is built
 * from oscillators at runtime and the whole music cabin costs zero bytes of payload.
 *
 * WHY A MISSING `AudioContext` IS A SUPPORTED STATE, NOT AN ERROR
 * ------------------------------------------------------------------------------------------------
 * `silentEngine` is returned whenever Web Audio is absent, and it satisfies the same interface while
 * making no sound. That covers three cases with one code path: an old browser, a locked-down device,
 * and **jsdom** — which is why no test in this app mocks Web Audio and none needs to. If you find
 * yourself writing an `AudioContext` stub in a test, this fallback is what you were looking for.
 *
 * That is only sound design because of rule R1 in the cabin spec: the visual channel of every music
 * gadget is sufficient to solve it. Silence costs a player the primary channel and never the puzzle.
 *
 * WHAT IS DELIBERATELY ABSENT
 * ------------------------------------------------------------------------------------------------
 *  - **No autoplay.** Nothing here is called on mount. Every sound is the direct result of a click,
 *    which is also what keeps browsers from suspending the context out from under us.
 *  - **No success or failure sound.** No fanfare, no buzzer, no click track. PRD §11 and research
 *    memo 06 D7 bar reward mechanics, and a sound that fires *because you were right* is one. The
 *    confirmation in Tune Repair is that the tune simply plays correctly, which is intrinsic to the
 *    task rather than bolted onto it.
 *  - **No looping or background music.** There is nothing to turn off except the notes themselves.
 */

import { TONIC_FROM_A4, frequencyForSemitone } from "./pitch";

/**
 * One note to sound: a **chromatic semitone** relative to the cabin's reference pitch, and how long
 * to hold it in beats.
 *
 * Semitones rather than diatonic degrees because Tune Repair's whole task is a note OUTSIDE the key
 * (see that puzzle's logic.ts) — a degree cannot represent one.
 */
export interface Note {
  semitone: number;
  beats: number;
}

export interface AudioEngine {
  /** False when Web Audio is unavailable, so a caller can hide a mute control that would do nothing. */
  readonly supported: boolean;
  /** Play one note immediately. Used for "what does this note sound like" on selection. */
  playNote(note: Note, tempoBpm?: number): void;
  /** Play notes in sequence from now. Returns the total duration in ms so a caller can animate. */
  playSequence(notes: readonly Note[], tempoBpm?: number): number;
  /** Silence anything currently sounding and cancel anything scheduled. */
  stop(): void;
  isMuted(): boolean;
  setMuted(muted: boolean): void;
}

const MUTE_KEY = "mvp-jul24.audio.muted";

/**
 * Timbre. Three partials at falling amplitude — roughly a soft plucked-string spectrum.
 *
 * A bare sine was tried first and rejected: it is genuinely hard to judge "same or different pitch"
 * on, because there are no overtones to anchor it, which made the puzzle harder in a way that had
 * nothing to do with music. A sawtooth was the other extreme and simply unpleasant over many
 * repetitions. Two overtones is enough to hear a note *as* a note.
 */
const PARTIALS = [
  { ratio: 1, gain: 0.6 },
  { ratio: 2, gain: 0.22 },
  { ratio: 3, gain: 0.1 },
] as const;

const DEFAULT_BPM = 108;
/** Seconds a beat lasts at `bpm`. */
const beatSeconds = (bpm: number) => 60 / bpm;
/** Held slightly shorter than its slot so consecutive notes articulate instead of slurring. */
const GATE = 0.86;
const ATTACK = 0.012;
const RELEASE = 0.09;
const MASTER_GAIN = 0.22;

function readMuted(): boolean {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === "1";
  } catch {
    // Private-mode Safari throws on localStorage access. Defaulting to unmuted is right: the child
    // gets the sound the room is for, and the toggle still works for the session.
    return false;
  }
}

function writeMuted(muted: boolean): void {
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* not persisting a preference is not worth failing a click over */
  }
}

export const silentEngine: AudioEngine = {
  supported: false,
  playNote: () => {},
  playSequence: (notes, tempoBpm = DEFAULT_BPM) =>
    notes.reduce((ms, n) => ms + n.beats * beatSeconds(tempoBpm) * 1000, 0),
  stop: () => {},
  isMuted: () => true,
  setMuted: () => {},
};

type AudioContextCtor = new () => AudioContext;

function audioContextCtor(): AudioContextCtor | undefined {
  const w = globalThis as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext;
}

/**
 * Build a real Web Audio engine.
 *
 * Exported for tests, which drive it against a hand-written fake context. Product code should call
 * `getAudioEngine()` so there is exactly one context for the whole session — browsers cap how many a
 * page may create, and a per-component context leaks one per mount.
 */
export function createAudioEngine(Ctor: AudioContextCtor): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = readMuted();
  /** Every oscillator currently scheduled, so `stop` can reach them. */
  let voices: OscillatorNode[] = [];

  /** Created on first use, which is always inside a click handler, which is what browsers require. */
  function ensure(): { ctx: AudioContext; master: GainNode } {
    if (!ctx || !master) {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);
    }
    // A context can be suspended by the browser after creation (tab hidden, autoplay policy), and a
    // suspended context accepts scheduling silently and plays nothing. Resume every time rather than
    // only on creation.
    if (ctx.state === "suspended") void ctx.resume?.();
    return { ctx, master };
  }

  function scheduleNote(at: number, note: Note, bpm: number): void {
    const { ctx: c, master: m } = ensure();
    const hz = frequencyForSemitone(TONIC_FROM_A4 + note.semitone);
    const hold = note.beats * beatSeconds(bpm) * GATE;

    for (const partial of PARTIALS) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = hz * partial.ratio;

      // A ramped envelope, because a gain that jumps from 0 to full produces an audible click that
      // reads as a percussive attack on every single note.
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(partial.gain, at + ATTACK);
      gain.gain.setValueAtTime(partial.gain, at + hold);
      gain.gain.linearRampToValueAtTime(0, at + hold + RELEASE);

      osc.connect(gain);
      gain.connect(m);
      osc.start(at);
      osc.stop(at + hold + RELEASE);
      voices.push(osc);
      osc.onended = () => {
        voices = voices.filter((v) => v !== osc);
      };
    }
  }

  return {
    supported: true,
    isMuted: () => muted,
    setMuted(next) {
      muted = next;
      writeMuted(next);
      if (next) this.stop();
    },
    playNote(note, tempoBpm = DEFAULT_BPM) {
      if (muted) return;
      const { ctx: c } = ensure();
      scheduleNote(c.currentTime, note, tempoBpm);
    },
    playSequence(notes, tempoBpm = DEFAULT_BPM) {
      const totalMs = notes.reduce((ms, n) => ms + n.beats * beatSeconds(tempoBpm) * 1000, 0);
      if (muted) return totalMs;
      const { ctx: c } = ensure();
      let at = c.currentTime;
      for (const note of notes) {
        scheduleNote(at, note, tempoBpm);
        at += note.beats * beatSeconds(tempoBpm);
      }
      return totalMs;
    },
    stop() {
      for (const osc of voices) {
        try {
          osc.stop();
        } catch {
          // Already stopped. Nothing to do, and not worth a branch to find out first.
        }
      }
      voices = [];
    },
  };
}

let shared: AudioEngine | null = null;

/** The one engine for the session. Silent where Web Audio is unavailable — see the header. */
export function getAudioEngine(): AudioEngine {
  if (!shared) {
    const Ctor = audioContextCtor();
    shared = Ctor ? createAudioEngine(Ctor) : silentEngine;
  }
  return shared;
}

/** Drop the shared engine. Tests only. */
export function resetAudioEngineForTests(): void {
  shared = null;
}
