/**
 * The engine, driven against a hand-written fake `AudioContext`.
 *
 * The fake exists to assert *scheduling*, which is the only part of this module with logic in it: are
 * notes laid out end to end at the right times, is every voice given a start and a stop, does mute
 * actually prevent scheduling rather than merely turning the volume down. What the result sounds like
 * is not testable here and is not pretended to be.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAudioEngine,
  getAudioEngine,
  resetAudioEngineForTests,
  silentEngine,
} from "./engine";
import { frequencyForDegree } from "./pitch";

interface FakeOsc {
  type: string;
  frequency: { value: number };
  startedAt: number | null;
  stoppedAt: number | null;
  connect: (n: unknown) => void;
  start: (t: number) => void;
  stop: (t?: number) => void;
  onended: (() => void) | null;
}

interface GainEvent {
  kind: "set" | "ramp";
  value: number;
  time: number;
}

function makeFakeContext(startTime = 0) {
  const oscs: FakeOsc[] = [];
  const gainEvents: GainEvent[] = [];
  let state: AudioContextState = "running";
  let resumeCalls = 0;
  let builds = 0;

  const ctx = {
    currentTime: startTime,
    destination: { id: "destination" },
    get state() {
      return state;
    },
    resume: () => {
      resumeCalls++;
      state = "running";
      return Promise.resolve();
    },
    createGain: () => ({
      gain: {
        value: 0,
        setValueAtTime: (value: number, time: number) =>
          gainEvents.push({ kind: "set", value, time }),
        linearRampToValueAtTime: (value: number, time: number) =>
          gainEvents.push({ kind: "ramp", value, time }),
      },
      connect: () => {},
    }),
    createOscillator: () => {
      const osc: FakeOsc = {
        type: "",
        frequency: { value: 0 },
        startedAt: null,
        stoppedAt: null,
        connect: () => {},
        start: (t: number) => {
          osc.startedAt = t;
        },
        stop: (t?: number) => {
          osc.stoppedAt = t ?? -1;
        },
        onended: null,
      };
      oscs.push(osc);
      return osc;
    },
    suspend: () => {
      state = "suspended";
    },
  };

  return {
    // A NAMED function expression on purpose: the formatter rewrites an anonymous `function () {}`
    // into an arrow, and `new (arrow)` throws "is not a constructor".
    Ctor: function FakeCtor() {
      builds++;
      return ctx;
    } as unknown as new () => AudioContext,
    ctx,
    oscs,
    gainEvents,
    get resumeCalls() {
      return resumeCalls;
    },
    get builds() {
      return builds;
    },
  };
}

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  resetAudioEngineForTests();
});

afterEach(() => {
  resetAudioEngineForTests();
});

describe("createAudioEngine", () => {
  it("does not create a context until something is played", () => {
    const fake = makeFakeContext();
    const spy = vi.fn(fake.Ctor as unknown as () => void);
    createAudioEngine(spy as unknown as new () => AudioContext);
    expect(spy).not.toHaveBeenCalled();
  });

  it("plays one note as three partials on the harmonic series", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.playNote({ degree: 0, beats: 1 });

    expect(fake.oscs).toHaveLength(3);
    const base = frequencyForDegree(0);
    expect(fake.oscs.map((o) => o.frequency.value)).toEqual([base, base * 2, base * 3]);
    for (const osc of fake.oscs) {
      expect(osc.startedAt).not.toBeNull();
      expect(osc.stoppedAt).not.toBeNull();
      expect(osc.stoppedAt!).toBeGreaterThan(osc.startedAt!);
    }
  });

  it("lays a sequence out end to end, one slot per beat", () => {
    const fake = makeFakeContext(10);
    const engine = createAudioEngine(fake.Ctor);
    // 120 bpm makes a beat exactly 0.5s, so the arithmetic is readable.
    engine.playSequence(
      [
        { degree: 0, beats: 1 },
        { degree: 1, beats: 1 },
        { degree: 2, beats: 2 },
      ],
      120,
    );

    // Three notes x three partials.
    expect(fake.oscs).toHaveLength(9);
    const starts = [...new Set(fake.oscs.map((o) => o.startedAt))];
    expect(starts).toEqual([10, 10.5, 11]);
  });

  it("reports a sequence's duration in ms so a caller can animate without knowing the tempo", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    const ms = engine.playSequence(
      [
        { degree: 0, beats: 1 },
        { degree: 0, beats: 3 },
      ],
      120,
    );
    expect(ms).toBe(2000);
  });

  it("resumes a suspended context rather than scheduling into silence", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.playNote({ degree: 0, beats: 1 });
    fake.ctx.suspend();
    engine.playNote({ degree: 0, beats: 1 });
    expect(fake.resumeCalls).toBeGreaterThanOrEqual(1);
  });

  it("ramps every voice in and out instead of switching gain on", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.playNote({ degree: 0, beats: 1 });
    // Master gain is set directly; each of the three voices contributes an envelope with two ramps.
    expect(fake.gainEvents.filter((e) => e.kind === "ramp")).toHaveLength(6);
    // Every envelope starts silent.
    expect(fake.gainEvents.some((e) => e.kind === "set" && e.value === 0)).toBe(true);
  });

  it("reuses one context across many plays", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.playNote({ degree: 0, beats: 1 });
    engine.playSequence([{ degree: 1, beats: 1 }]);
    engine.playNote({ degree: 2, beats: 1 });
    // One context for the whole session: a per-play context would leak one per click, and browsers
    // cap how many a page may create.
    expect(fake.builds).toBe(1);
  });
});

describe("mute", () => {
  it("prevents scheduling entirely, rather than playing at zero volume", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.setMuted(true);
    engine.playNote({ degree: 0, beats: 1 });
    engine.playSequence([{ degree: 0, beats: 1 }]);
    expect(fake.oscs).toHaveLength(0);
  });

  it("still reports duration when muted, so the visual channel stays in step", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.setMuted(true);
    expect(engine.playSequence([{ degree: 0, beats: 2 }], 120)).toBe(1000);
  });

  it("persists across engines", () => {
    const a = createAudioEngine(makeFakeContext().Ctor);
    a.setMuted(true);
    const b = createAudioEngine(makeFakeContext().Ctor);
    expect(b.isMuted()).toBe(true);
  });

  it("defaults to unmuted, because the room is for hearing things", () => {
    expect(createAudioEngine(makeFakeContext().Ctor).isMuted()).toBe(false);
  });
});

describe("stop", () => {
  it("stops every scheduled voice", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.playSequence([
      { degree: 0, beats: 1 },
      { degree: 1, beats: 1 },
    ]);
    for (const osc of fake.oscs) osc.stoppedAt = null;
    engine.stop();
    expect(fake.oscs.every((o) => o.stoppedAt !== null)).toBe(true);
  });

  it("survives a voice that has already ended", () => {
    const fake = makeFakeContext();
    const engine = createAudioEngine(fake.Ctor);
    engine.playNote({ degree: 0, beats: 1 });
    for (const osc of fake.oscs) {
      osc.stop = () => {
        throw new Error("already stopped");
      };
    }
    expect(() => engine.stop()).not.toThrow();
  });
});

describe("getAudioEngine in an environment with no Web Audio", () => {
  /**
   * This is the case that means no test in this app needs an AudioContext stub, and it is also the
   * case a locked-down school device hits. It must be silent, not broken.
   */
  it("falls back to the silent engine under jsdom", () => {
    expect((globalThis as { AudioContext?: unknown }).AudioContext).toBeUndefined();
    expect(getAudioEngine()).toBe(silentEngine);
    expect(getAudioEngine().supported).toBe(false);
  });

  it("silent engine still reports honest durations, so callers do not special-case it", () => {
    expect(
      silentEngine.playSequence(
        [
          { degree: 0, beats: 1 },
          { degree: 0, beats: 1 },
        ],
        120,
      ),
    ).toBe(1000);
  });

  it("silent engine satisfies the interface without throwing", () => {
    expect(() => {
      silentEngine.playNote({ degree: 3, beats: 1 });
      silentEngine.setMuted(false);
      silentEngine.stop();
    }).not.toThrow();
  });
});
