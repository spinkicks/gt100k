import { describe, expect, it } from "vitest";
import { CATALOG_FAMILY_V1, CATALOG_GAPPY_V1, CATALOG_GOLDEN_V1 } from "../src/index";

const tally = (values: readonly string[]) =>
  values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});

const isEligibleForFreshLearner = (probe: {
  prerequisites: readonly string[];
  safetyClass: string;
}) => probe.safetyClass === "cleared" && probe.prerequisites.length === 0;

describe("CATALOG_GOLDEN_V1", () => {
  it("contains the exact 20 eligible seed rows in normative order", () => {
    expect(CATALOG_GOLDEN_V1).toHaveLength(24);

    const eligible = CATALOG_GOLDEN_V1.flatMap((family) => family.variants).filter(
      isEligibleForFreshLearner,
    );

    expect(
      eligible.map((probe) => [
        probe.ord,
        probe.id,
        probe.domain,
        probe.workMode,
        probe.difficulty,
        probe.social,
        probe.audience,
      ]),
    ).toEqual([
      [0, "p01", "making", "build", "foundational", "solo", "no_audience"],
      [1, "p02", "making", "debug", "stretch", "solo", "no_audience"],
      [2, "p03", "making", "compose", "foundational", "group", "audience"],
      [3, "p04", "living_systems", "investigate", "foundational", "solo", "no_audience"],
      [4, "p05", "living_systems", "care", "foundational", "solo", "no_audience"],
      [5, "p06", "living_systems", "explain", "stretch", "group", "audience"],
      [6, "p07", "symbols_math", "investigate", "foundational", "solo", "no_audience"],
      [7, "p08", "symbols_math", "build", "stretch", "solo", "no_audience"],
      [8, "p09", "symbols_math", "debug", "stretch", "solo", "no_audience"],
      [9, "p10", "word_craft", "compose", "foundational", "solo", "no_audience"],
      [10, "p11", "word_craft", "explain", "foundational", "group", "audience"],
      [11, "p12", "word_craft", "persuade", "stretch", "solo", "audience"],
      [12, "p13", "sound_music", "perform", "stretch", "solo", "audience"],
      [13, "p14", "sound_music", "build", "foundational", "group", "no_audience"],
      [14, "p15", "movement_body", "perform", "foundational", "group", "audience"],
      [15, "p16", "movement_body", "collaborate", "stretch", "solo", "no_audience"],
      [16, "p17", "visual_design", "investigate", "foundational", "solo", "no_audience"],
      [17, "p18", "visual_design", "persuade", "stretch", "solo", "audience"],
      [18, "p19", "social_world", "collaborate", "foundational", "group", "no_audience"],
      [19, "p20", "social_world", "care", "foundational", "group", "audience"],
    ]);
  });

  it("matches the exact G1 coverage tallies", () => {
    const eligible = CATALOG_GOLDEN_V1.flatMap((family) => family.variants).filter(
      isEligibleForFreshLearner,
    );

    expect(tally(eligible.map((probe) => probe.domain))).toEqual({
      making: 3,
      living_systems: 3,
      symbols_math: 3,
      word_craft: 3,
      sound_music: 2,
      movement_body: 2,
      visual_design: 2,
      social_world: 2,
    });
    expect(tally(eligible.map((probe) => probe.workMode))).toEqual({
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
    expect(tally(eligible.map((probe) => probe.social))).toEqual({ solo: 13, group: 7 });
    expect(tally(eligible.map((probe) => probe.difficulty))).toEqual({
      foundational: 12,
      stretch: 8,
    });
    expect(tally(eligible.map((probe) => probe.audience))).toEqual({
      no_audience: 12,
      audience: 8,
    });
  });

  it("keeps the four safety and prerequisite controls ineligible", () => {
    const controls = CATALOG_GOLDEN_V1.flatMap((family) => family.variants).slice(20);

    expect(
      controls.map(({ id, domain, workMode, safetyClass, prerequisites }) => ({
        id,
        domain,
        workMode,
        safetyClass,
        prerequisites,
      })),
    ).toEqual([
      {
        id: "p21",
        domain: "making",
        workMode: "build",
        safetyClass: "review_required",
        prerequisites: [],
      },
      {
        id: "p22",
        domain: "symbols_math",
        workMode: "investigate",
        safetyClass: "blocked",
        prerequisites: [],
      },
      {
        id: "p23",
        domain: "sound_music",
        workMode: "perform",
        safetyClass: "cleared",
        prerequisites: ["prereq_x"],
      },
      {
        id: "p24",
        domain: "word_craft",
        workMode: "compose",
        safetyClass: "cleared",
        prerequisites: ["prereq_y"],
      },
    ]);
    expect(controls.some(isEligibleForFreshLearner)).toBe(false);
  });
});

describe("CATALOG_GAPPY_V1", () => {
  it("contains exactly the eight eligible rows and pinned gaps", () => {
    const probes = CATALOG_GAPPY_V1.flatMap((family) => family.variants);

    expect(probes.map(({ id, domain, workMode }) => [id, domain, workMode])).toEqual([
      ["g1", "making", "build"],
      ["g2", "making", "investigate"],
      ["g3", "living_systems", "compose"],
      ["g4", "living_systems", "explain"],
      ["g5", "symbols_math", "build"],
      ["g6", "word_craft", "compose"],
      ["g7", "sound_music", "care"],
      ["g8", "sound_music", "build"],
    ]);
    expect(probes).toHaveLength(8);
    expect(probes.every(isEligibleForFreshLearner)).toBe(true);
    expect(new Set(probes.map((probe) => probe.domain))).toHaveLength(5);
    expect(new Set(probes.map((probe) => probe.workMode))).toEqual(
      new Set(["build", "investigate", "compose", "explain", "care"]),
    );
    expect(
      probes.every(
        (probe) =>
          probe.difficulty === "foundational" &&
          probe.social === "solo" &&
          probe.audience === "no_audience",
      ),
    ).toBe(true);
  });
});

describe("CATALOG_FAMILY_V1", () => {
  it("provides three semantically equivalent cosmetic variants", () => {
    expect(CATALOG_FAMILY_V1).toHaveLength(1);
    const variants = CATALOG_FAMILY_V1[0]?.variants ?? [];
    expect(variants.map(({ id, prompt }) => ({ id, prompt }))).toEqual([
      { id: "fam_A_v1", prompt: "Cosmetic variant 1" },
      { id: "fam_A_v2", prompt: "Cosmetic variant 2" },
      { id: "fam_A_v3", prompt: "Cosmetic variant 3" },
    ]);

    const semantics = ({
      id: _id,
      ord: _ord,
      prompt: _prompt,
      ...probe
    }: (typeof variants)[number]) => probe;
    expect(semantics(variants[1]!)).toEqual(semantics(variants[0]!));
    expect(semantics(variants[2]!)).toEqual(semantics(variants[0]!));
  });
});
