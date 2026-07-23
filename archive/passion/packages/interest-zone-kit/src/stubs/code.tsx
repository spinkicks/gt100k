import { stubProbe } from "./probes";
import { createStubZone } from "./stub-zone";

export const codeStub = createStubZone({
  id: "code",
  domain: "symbols_math",
  mapBuilding: {
    label: "Code Lab",
    glyph: "code-brackets",
    enterVerb: "Step inside",
    cell: { col: 1, row: 0 },
  },
  probes: [
    stubProbe({
      id: "c_build",
      domain: "symbols_math",
      workMode: "build",
      difficulty: "foundational",
      social: "solo",
      audience: "no_audience",
    }),
    stubProbe({
      id: "c_debug",
      domain: "symbols_math",
      workMode: "debug",
      difficulty: "stretch",
      social: "solo",
      audience: "no_audience",
    }),
    stubProbe({
      id: "c_investigate",
      domain: "symbols_math",
      workMode: "investigate",
      difficulty: "foundational",
      social: "solo",
      audience: "no_audience",
    }),
  ],
});
