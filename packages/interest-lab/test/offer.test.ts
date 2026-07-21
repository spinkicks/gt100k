import { describe, expect, it } from "vitest";
import { buildLab } from "../src/offer";
import type { Probe, ProbeFamily } from "../src/probe";

const GOLDEN_ROWS = [
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

const makeProbe = (row: (typeof GOLDEN_ROWS)[number], overrides: Partial<Probe> = {}): Probe => {
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

const CATALOG_GOLDEN_V1: ProbeFamily[] = [
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
      makeProbe(GOLDEN_ROWS[12], { id: "p23", familyId: "p23", prerequisites: ["prereq_x"] }),
    ],
  },
  {
    familyId: "p24",
    variants: [
      makeProbe(GOLDEN_ROWS[9], { id: "p24", familyId: "p24", prerequisites: ["prereq_y"] }),
    ],
  },
];

const FRESH_LEARNER = { metPrereqs: [], engagedDomains: [] } as const;

const CATALOG_FAMILY_V1: ProbeFamily[] = [
  {
    familyId: "fam_A",
    variants: ["fam_A_v1", "fam_A_v2", "fam_A_v3"].map((id) =>
      makeProbe(GOLDEN_ROWS[0], { id, familyId: "fam_A" }),
    ),
  },
];

const makeSurplusFamily = (
  familyId: string,
  domain: string,
  workMode: Probe["workMode"],
  overrides: Partial<Probe> = {},
): ProbeFamily => ({
  familyId,
  variants: [
    makeProbe(GOLDEN_ROWS[0], {
      id: familyId,
      familyId,
      domain,
      workMode,
      ...overrides,
    }),
  ],
});

const countBy = <T>(items: readonly T[], keyOf: (item: T) => string): Record<string, number> =>
  items.reduce<Record<string, number>>((counts, item) => {
    const key = keyOf(item);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

describe("buildLab", () => {
  it("matches the exact G1 balanced rules-engine Lab", () => {
    const lab = buildLab("synthetic-fresh-learner", CATALOG_GOLDEN_V1, FRESH_LEARNER, {
      seed: 42,
    });

    expect(lab.offers).toHaveLength(20);
    expect(countBy(lab.offers, ({ domain }) => domain)).toEqual({
      making: 3,
      living_systems: 3,
      symbols_math: 3,
      word_craft: 3,
      sound_music: 2,
      movement_body: 2,
      visual_design: 2,
      social_world: 2,
    });
    expect(countBy(lab.offers, ({ workMode }) => workMode)).toEqual({
      build: 3,
      debug: 2,
      compose: 2,
      investigate: 3,
      care: 2,
      explain: 2,
      persuade: 2,
      perform: 2,
      collaborate: 2,
    });
    expect(countBy(lab.offers, ({ social }) => social)).toEqual({ solo: 13, group: 7 });
    expect(countBy(lab.offers, ({ difficulty }) => difficulty)).toEqual({
      foundational: 12,
      stretch: 8,
    });
    expect(countBy(lab.offers, ({ audience }) => audience)).toEqual({
      no_audience: 12,
      audience: 8,
    });
    expect(lab.explorationReserved).toBe(20);
    expect(lab.choicePointsMinEligible).toBeGreaterThanOrEqual(2);
    expect(lab.offers.every(({ eligible }) => eligible)).toBe(true);
    expect(lab.offers.every(({ provenance }) => provenance === "RULE")).toBe(true);
    expect(lab.offers.every(({ reason }) => reason.trim().length > 0)).toBe(true);
  });

  it("is byte-identical for the same input and selects the same full eligible set across seeds", () => {
    const build = (seed: number) =>
      buildLab("synthetic-fresh-learner", CATALOG_GOLDEN_V1, FRESH_LEARNER, { seed });

    expect(JSON.stringify(build(42))).toBe(JSON.stringify(build(42)));

    const selectedIds = [1, 42, 999].map((seed) =>
      build(seed).offers.map(({ probeId }) => probeId),
    );
    expect(selectedIds[1]).toEqual(selectedIds[0]);
    expect(selectedIds[2]).toEqual(selectedIds[0]);
  });

  it("never offers safety or prerequisite controls to an ineligible learner", () => {
    const lab = buildLab("synthetic-fresh-learner", CATALOG_GOLDEN_V1, FRESH_LEARNER);
    const filteredControlIds = new Set(["p21", "p22", "p23", "p24"]);

    expect(lab.offers.some(({ probeId }) => filteredControlIds.has(probeId))).toBe(false);
  });

  it("draws at most one equivalent variant from a family at a choice point", () => {
    const lab = buildLab("synthetic-fresh-learner", CATALOG_FAMILY_V1, FRESH_LEARNER);

    expect(lab.offers).toHaveLength(1);
    expect(new Set(lab.offers.map(({ familyId }) => familyId))).toEqual(new Set(["fam_A"]));
    expect(["fam_A_v1", "fam_A_v2", "fam_A_v3"]).toContain(lab.offers[0]?.probeId);
  });

  it("uses seeded family order and coverage gain to select a complete subset under surplus", () => {
    const surplusCatalog = [
      makeSurplusFamily("a", "domain_1", "build"),
      makeSurplusFamily("b", "domain_1", "build"),
      makeSurplusFamily("c", "domain_1", "build"),
      makeSurplusFamily("d", "domain_2", "investigate"),
      makeSurplusFamily("e", "domain_3", "compose", {
        difficulty: "stretch",
        social: "group",
        audience: "audience",
      }),
      makeSurplusFamily("f", "domain_4", "explain", {
        difficulty: "stretch",
        social: "group",
        audience: "audience",
      }),
    ];

    const build = () =>
      buildLab("synthetic-fresh-learner", surplusCatalog, FRESH_LEARNER, {
        probeCountTarget: 4,
        probeCountRange: { min: 4, max: 4 },
        minDomains: 4,
        minWorkModes: 4,
        seed: 2,
      });
    const lab = build();

    expect(lab.offers.map(({ probeId }) => probeId)).toEqual(["c", "e", "d", "f"]);
    expect(lab.coverage.complete).toBe(true);
    expect(lab.coverage.gaps).toEqual([]);
    expect(JSON.stringify(build())).toBe(JSON.stringify(lab));
  });
});
