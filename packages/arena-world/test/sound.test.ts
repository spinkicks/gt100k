import { SOUND_CUES, type SoundCue } from "@gt100k/arena-world";
import * as arenaWorld from "@gt100k/arena-world";
import { describe, expect, expectTypeOf, it } from "vitest";

type SoundEvent = keyof typeof SOUND_CUES;
type SoundCueResolver = (event: SoundEvent) => SoundCue;

const resolveSoundCue = (arenaWorld as typeof arenaWorld & { resolveSoundCue?: SoundCueResolver })
  .resolveSoundCue;

const GOLDEN_SOUND_CUES = {
  boot: { cueId: "boot-chime", caption: "[warm chime]", mutedByDefault: true },
  traverse: { cueId: "footfall", caption: "[soft step]", mutedByDefault: true },
  nodeAvailable: {
    cueId: "ready-shimmer",
    caption: "[ready shimmer]",
    mutedByDefault: true,
  },
  unlockMedium: {
    cueId: "bloom-chord",
    caption: "[unlock chime]",
    mutedByDefault: true,
  },
  unlockHigh: {
    cueId: "beacon-arpeggio",
    caption: "[beacon lights up]",
    mutedByDefault: true,
  },
  productiveStruggle: {
    cueId: "encourage-tone",
    caption: "[keep-going tone]",
    mutedByDefault: true,
  },
  notYet: { cueId: "soft-tap", caption: "[soft tap]", mutedByDefault: true },
  equip: { cueId: "cloth-whoosh", caption: "[cloth whoosh]", mutedByDefault: true },
  tierAdvance: {
    cueId: "rising-sweep",
    caption: "[tier up]",
    mutedByDefault: true,
  },
  baseAccretion: {
    cueId: "place-murmur",
    caption: "[placed]",
    mutedByDefault: true,
  },
} as const satisfies Record<SoundEvent, SoundCue>;

const SOUND_EVENTS = Object.keys(GOLDEN_SOUND_CUES) as SoundEvent[];

describe("resolveSoundCue", () => {
  it("maps every event to the exact cue in registry order", () => {
    expect(resolveSoundCue).toBeTypeOf("function");
    if (!resolveSoundCue) return;

    expect(Object.keys(SOUND_CUES)).toEqual(SOUND_EVENTS);
    expect(SOUND_EVENTS.map((event) => resolveSoundCue(event))).toEqual(
      Object.values(GOLDEN_SOUND_CUES),
    );
  });

  it("returns fresh muted descriptors deterministically", () => {
    expect(resolveSoundCue).toBeTypeOf("function");
    if (!resolveSoundCue) return;

    expect(resolveSoundCue).toHaveLength(1);
    for (const event of SOUND_EVENTS) {
      const first = resolveSoundCue(event);
      const second = resolveSoundCue(event);

      expect(JSON.stringify(first)).toBe(JSON.stringify(second));
      expect(first).not.toBe(second);
      expect(first.mutedByDefault).toBe(true);
    }
  });

  it("keeps the not-yet cue neutral with no negative, alarm, or loop flags", () => {
    expectTypeOf<Extract<keyof SoundCue, "negative" | "alarm" | "loop">>().toEqualTypeOf<never>();
    expect(resolveSoundCue).toBeTypeOf("function");
    if (!resolveSoundCue) return;

    const cue = resolveSoundCue("notYet");

    expect(cue).toEqual({
      cueId: "soft-tap",
      caption: "[soft tap]",
      mutedByDefault: true,
    });
    expect(Object.keys(cue).sort()).toEqual(["caption", "cueId", "mutedByDefault"]);
  });
});
