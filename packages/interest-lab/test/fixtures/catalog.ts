import type { Probe, ProbeFamily } from "../../src/probe";

export const GOLDEN_ROWS = [
  ["p01", "making", "build", "foundational", "solo", "no_audience"],
  ["p02", "making", "debug", "stretch", "solo", "no_audience"],
  ["p03", "making", "compose", "foundational", "group", "audience"],
  ["p04", "living_systems", "investigate", "foundational", "solo", "no_audience"],
  ["p05", "living_systems", "care", "foundational", "solo", "no_audience"],
  ["p06", "living_systems", "explain", "stretch", "group", "audience"],
  ["p07", "symbols_math", "investigate", "foundational", "solo", "no_audience"],
  ["p08", "symbols_math", "build", "stretch", "solo", "no_audience"],
  ["p09", "symbols_math", "debug", "stretch", "solo", "no_audience"],
  ["p10", "word_craft", "compose", "foundational", "solo", "no_audience"],
  ["p11", "word_craft", "explain", "foundational", "group", "audience"],
  ["p12", "word_craft", "persuade", "stretch", "solo", "audience"],
  ["p13", "sound_music", "perform", "stretch", "solo", "audience"],
  ["p14", "sound_music", "build", "foundational", "group", "no_audience"],
  ["p15", "movement_body", "perform", "foundational", "group", "audience"],
  ["p16", "movement_body", "collaborate", "stretch", "solo", "no_audience"],
  ["p17", "visual_design", "investigate", "foundational", "solo", "no_audience"],
  ["p18", "visual_design", "persuade", "stretch", "solo", "audience"],
  ["p19", "social_world", "collaborate", "foundational", "group", "no_audience"],
  ["p20", "social_world", "care", "foundational", "group", "audience"],
] as const;

export const makeProbe = (
  row: (typeof GOLDEN_ROWS)[number],
  overrides: Partial<Probe> = {},
): Probe => {
  const [id, domain, workMode, difficulty, social, audience] = row;
  return {
    id,
    familyId: id,
    domain,
    workMode,
    prerequisites: [],
    difficulty,
    autonomy: "medium",
    social,
    audience,
    equipment: [],
    accessibilityVariants: [],
    expectedBurden: 0,
    safetyClass: "cleared",
    artifactEvidence: "synthetic catalog fixture",
    ...overrides,
  };
};

export const CATALOG_GOLDEN_V1: ProbeFamily[] = [
  ...GOLDEN_ROWS.map((row) => {
    const probe = makeProbe(row);
    return { familyId: probe.familyId, variants: [probe] };
  }),
  {
    familyId: "p21",
    variants: [
      makeProbe(GOLDEN_ROWS[0], { id: "p21", familyId: "p21", safetyClass: "review_required" }),
    ],
  },
  {
    familyId: "p22",
    variants: [makeProbe(GOLDEN_ROWS[6], { id: "p22", familyId: "p22", safetyClass: "blocked" })],
  },
  {
    familyId: "p23",
    variants: [
      makeProbe(GOLDEN_ROWS[12], {
        id: "p23",
        familyId: "p23",
        prerequisites: ["prereq_x"],
      }),
    ],
  },
  {
    familyId: "p24",
    variants: [
      makeProbe(GOLDEN_ROWS[9], {
        id: "p24",
        familyId: "p24",
        prerequisites: ["prereq_y"],
      }),
    ],
  },
];

export const FRESH_LEARNER = { metPrereqs: [], engagedDomains: [] } as const;

export const CATALOG_FAMILY_V1: ProbeFamily[] = [
  {
    familyId: "fam_A",
    variants: ["fam_A_v1", "fam_A_v2", "fam_A_v3"].map((id) =>
      makeProbe(GOLDEN_ROWS[0], { id, familyId: "fam_A" }),
    ),
  },
];
