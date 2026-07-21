import { describe, expect, it } from "vitest";
import { buildCoverageMatrix } from "../src/coverage";

const DEFAULT_COVERAGE_CONFIG = {
  probeCountRange: { min: 18, max: 24 },
  minDomains: 6,
  minWorkModes: 6,
} as const;

const COMPLETE_COVERAGE_INPUT = [
  ["making", "build", "foundational", "solo", "no_audience"],
  ["making", "debug", "stretch", "solo", "no_audience"],
  ["making", "compose", "foundational", "group", "audience"],
  ["living_systems", "investigate", "foundational", "solo", "no_audience"],
  ["living_systems", "care", "foundational", "solo", "no_audience"],
  ["living_systems", "explain", "stretch", "group", "audience"],
  ["symbols_math", "investigate", "foundational", "solo", "no_audience"],
  ["symbols_math", "build", "stretch", "solo", "no_audience"],
  ["symbols_math", "debug", "stretch", "solo", "no_audience"],
  ["word_craft", "compose", "foundational", "solo", "no_audience"],
  ["word_craft", "explain", "foundational", "group", "audience"],
  ["word_craft", "persuade", "stretch", "solo", "audience"],
  ["sound_music", "perform", "stretch", "solo", "audience"],
  ["sound_music", "build", "foundational", "group", "no_audience"],
  ["movement_body", "perform", "foundational", "group", "audience"],
  ["movement_body", "collaborate", "stretch", "solo", "no_audience"],
  ["visual_design", "investigate", "foundational", "solo", "no_audience"],
  ["visual_design", "persuade", "stretch", "solo", "audience"],
  ["social_world", "collaborate", "foundational", "group", "no_audience"],
  ["social_world", "care", "foundational", "group", "audience"],
] as const;

const GAPPY_COVERAGE_INPUT = [
  ["making", "build"],
  ["making", "investigate"],
  ["living_systems", "compose"],
  ["living_systems", "explain"],
  ["symbols_math", "build"],
  ["word_craft", "compose"],
  ["sound_music", "care"],
  ["sound_music", "build"],
] as const;

describe("buildCoverageMatrix", () => {
  it("matches G2 for a coverage-complete Lab", () => {
    const offers = COMPLETE_COVERAGE_INPUT.map(
      ([domain, workMode, difficulty, social, audience]) => ({
        domain,
        workMode,
        difficulty,
        social,
        audience,
      }),
    );

    expect(buildCoverageMatrix(offers, DEFAULT_COVERAGE_CONFIG)).toEqual({
      probeCount: { met: true, count: 20, need: 18 },
      domains: {
        met: true,
        count: 8,
        need: 6,
        have: [
          "making",
          "living_systems",
          "symbols_math",
          "word_craft",
          "sound_music",
          "movement_body",
          "visual_design",
          "social_world",
        ],
        gaps: [],
      },
      workModes: {
        met: true,
        count: 9,
        need: 6,
        have: [
          "build",
          "investigate",
          "compose",
          "explain",
          "perform",
          "debug",
          "collaborate",
          "care",
          "persuade",
        ],
        gaps: [],
      },
      social: { met: true, solo: true, group: true, gaps: [] },
      difficulty: { met: true, foundational: true, stretch: true, gaps: [] },
      audience: { met: true, audience: true, no_audience: true, gaps: [] },
      complete: true,
      gaps: [],
    });
  });

  it("matches G3 and aggregates every named gap in dimension order", () => {
    const offers = GAPPY_COVERAGE_INPUT.map(([domain, workMode]) => ({
      domain,
      workMode,
      difficulty: "foundational" as const,
      social: "solo" as const,
      audience: "no_audience" as const,
    }));

    expect(buildCoverageMatrix(offers, DEFAULT_COVERAGE_CONFIG)).toEqual({
      probeCount: { met: false, count: 8, need: 18 },
      domains: {
        met: false,
        count: 5,
        need: 6,
        have: ["making", "living_systems", "symbols_math", "word_craft", "sound_music"],
        gaps: ["only 5 of ≥6 required domains"],
      },
      workModes: {
        met: false,
        count: 5,
        need: 6,
        have: ["build", "investigate", "compose", "explain", "care"],
        gaps: ["only 5 of ≥6 required work modes"],
      },
      social: {
        met: false,
        solo: true,
        group: false,
        gaps: ["no collaborative (group) probe"],
      },
      difficulty: {
        met: false,
        foundational: true,
        stretch: false,
        gaps: ["no stretch-band probe"],
      },
      audience: {
        met: false,
        audience: false,
        no_audience: true,
        gaps: ["no audience-condition probe"],
      },
      complete: false,
      gaps: [
        "probe count 8 below minimum 18",
        "only 5 of ≥6 required domains",
        "only 5 of ≥6 required work modes",
        "no collaborative (group) probe",
        "no stretch-band probe",
        "no audience-condition probe",
      ],
    });
  });

  it("never collapses coverage into a score or confidence field", () => {
    const offers = GAPPY_COVERAGE_INPUT.map(([domain, workMode]) => ({
      domain,
      workMode,
      difficulty: "foundational" as const,
      social: "solo" as const,
      audience: "no_audience" as const,
    }));

    const serialized = JSON.stringify(buildCoverageMatrix(offers, DEFAULT_COVERAGE_CONFIG));
    expect(serialized).not.toMatch(/"(?:score|confidence)":/i);
  });
});
