import { stubProbe } from "./probes";
import { createStubZone } from "./stub-zone";

export const musicStub = createStubZone({
  id: "music",
  domain: "sound_music",
  mapBuilding: {
    label: "Music Studio",
    glyph: "music-note",
    enterVerb: "Step inside",
    cell: { col: 0, row: 0 },
  },
  probes: [
    stubProbe({
      id: "m_build",
      domain: "sound_music",
      workMode: "build",
      difficulty: "foundational",
      social: "solo",
      audience: "no_audience",
    }),
    stubProbe({
      id: "m_perform",
      domain: "sound_music",
      workMode: "perform",
      difficulty: "stretch",
      social: "group",
      audience: "audience",
    }),
    stubProbe({
      id: "m_debug",
      domain: "sound_music",
      workMode: "debug",
      difficulty: "stretch",
      social: "solo",
      audience: "no_audience",
    }),
  ],
});
