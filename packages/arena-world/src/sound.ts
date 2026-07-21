import type { SoundCue } from "./model";

export const SOUND_CUES = {
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
} satisfies Record<string, SoundCue>;

export function resolveSoundCue(event: keyof typeof SOUND_CUES): SoundCue {
  return { ...SOUND_CUES[event] };
}
