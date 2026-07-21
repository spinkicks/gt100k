import type {
  AudienceCondition,
  DifficultyBand,
  Probe,
  ProbeFamily,
  SafetyClass,
  SocialMode,
  WorkMode,
} from "@gt100k/interest-lab";

interface CatalogFixtureProbe extends Probe {
  ord: number;
  prompt?: string;
}

interface CatalogFixtureFamily extends ProbeFamily {
  variants: CatalogFixtureProbe[];
}

interface FixtureRow {
  ord: number;
  id: string;
  familyId?: string;
  domain: string;
  workMode: WorkMode;
  difficulty?: DifficultyBand;
  social?: SocialMode;
  audience?: AudienceCondition;
  safetyClass?: SafetyClass;
  prerequisites?: string[];
  prompt?: string;
}

const makeProbe = (row: FixtureRow): CatalogFixtureProbe => ({
  ord: row.ord,
  id: row.id,
  familyId: row.familyId ?? row.id,
  domain: row.domain,
  workMode: row.workMode,
  prerequisites: row.prerequisites ? [...row.prerequisites] : [],
  difficulty: row.difficulty ?? "foundational",
  autonomy: "medium",
  social: row.social ?? "solo",
  audience: row.audience ?? "no_audience",
  equipment: [],
  accessibilityVariants: [],
  expectedBurden: 0,
  safetyClass: row.safetyClass ?? "cleared",
  artifactEvidence: "synthetic catalog fixture",
  ...(row.prompt === undefined ? {} : { prompt: row.prompt }),
});

const makeFamily = (row: FixtureRow): CatalogFixtureFamily => {
  const probe = makeProbe(row);
  return { familyId: probe.familyId, variants: [probe] };
};

type GoldenRow = readonly [
  id: string,
  domain: string,
  workMode: WorkMode,
  difficulty: DifficultyBand,
  social: SocialMode,
  audience: AudienceCondition,
];

const GOLDEN_ELIGIBLE_ROWS = [
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
] satisfies readonly GoldenRow[];

export const CATALOG_GOLDEN_V1: CatalogFixtureFamily[] = [
  ...GOLDEN_ELIGIBLE_ROWS.map(([id, domain, workMode, difficulty, social, audience], ord) =>
    makeFamily({ ord, id, domain, workMode, difficulty, social, audience }),
  ),
  makeFamily({
    ord: 20,
    id: "p21",
    domain: "making",
    workMode: "build",
    safetyClass: "review_required",
  }),
  makeFamily({
    ord: 21,
    id: "p22",
    domain: "symbols_math",
    workMode: "investigate",
    safetyClass: "blocked",
  }),
  makeFamily({
    ord: 22,
    id: "p23",
    domain: "sound_music",
    workMode: "perform",
    prerequisites: ["prereq_x"],
  }),
  makeFamily({
    ord: 23,
    id: "p24",
    domain: "word_craft",
    workMode: "compose",
    prerequisites: ["prereq_y"],
  }),
];

type GappyRow = readonly [id: string, domain: string, workMode: WorkMode];

const GAPPY_ROWS = [
  ["g1", "making", "build"],
  ["g2", "making", "investigate"],
  ["g3", "living_systems", "compose"],
  ["g4", "living_systems", "explain"],
  ["g5", "symbols_math", "build"],
  ["g6", "word_craft", "compose"],
  ["g7", "sound_music", "care"],
  ["g8", "sound_music", "build"],
] satisfies readonly GappyRow[];

export const CATALOG_GAPPY_V1: CatalogFixtureFamily[] = GAPPY_ROWS.map(
  ([id, domain, workMode], ord) => makeFamily({ ord, id, domain, workMode }),
);

export const CATALOG_FAMILY_V1: CatalogFixtureFamily[] = [
  {
    familyId: "fam_A",
    variants: [
      makeProbe({
        ord: 0,
        id: "fam_A_v1",
        familyId: "fam_A",
        domain: "making",
        workMode: "build",
        prompt: "Cosmetic variant 1",
      }),
      makeProbe({
        ord: 1,
        id: "fam_A_v2",
        familyId: "fam_A",
        domain: "making",
        workMode: "build",
        prompt: "Cosmetic variant 2",
      }),
      makeProbe({
        ord: 2,
        id: "fam_A_v3",
        familyId: "fam_A",
        domain: "making",
        workMode: "build",
        prompt: "Cosmetic variant 3",
      }),
    ],
  },
];
