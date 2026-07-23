import { stubProbe } from "./probes";
import { createStubZone } from "./stub-zone";

export const artStub = createStubZone({
  id: "art",
  domain: "visual_design",
  mapBuilding: {
    label: "Art Studio",
    glyph: "art-brush",
    enterVerb: "Step inside",
    cell: { col: 2, row: 0 },
  },
  probes: [
    stubProbe({
      id: "a_build",
      domain: "visual_design",
      workMode: "build",
      difficulty: "foundational",
      social: "solo",
      audience: "no_audience",
    }),
    stubProbe({
      id: "a_compose",
      domain: "visual_design",
      workMode: "compose",
      difficulty: "foundational",
      social: "group",
      audience: "audience",
    }),
    stubProbe({
      id: "a_explain",
      domain: "visual_design",
      workMode: "explain",
      difficulty: "foundational",
      social: "group",
      audience: "audience",
    }),
  ],
});
