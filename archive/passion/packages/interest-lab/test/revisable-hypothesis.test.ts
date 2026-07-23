import { describe, expect, it } from "vitest";
import {
  ACTIVITY_GOLDEN_INSUFFICIENT_V1,
  ACTIVITY_GOLDEN_V1,
  ACTIVITY_GOLDEN_WORKMODE_V1,
  buildCoverageMatrix,
  buildReturnGrid,
  buildRevisableHypothesis,
} from "../src/index";
import type { CoverageItem, RevisableHypothesis } from "../src/index";

const V1_DOMAIN_ORDER = ["sound_music", "symbols_math", "visual_design"] as const;

const OFFERED_COVERAGE = [
  {
    domain: "sound_music",
    workMode: "build",
    difficulty: "foundational",
    social: "solo",
    audience: "no_audience",
  },
  {
    domain: "sound_music",
    workMode: "perform",
    difficulty: "stretch",
    social: "group",
    audience: "audience",
  },
  {
    domain: "sound_music",
    workMode: "debug",
    difficulty: "stretch",
    social: "solo",
    audience: "no_audience",
  },
  {
    domain: "symbols_math",
    workMode: "build",
    difficulty: "foundational",
    social: "solo",
    audience: "no_audience",
  },
  {
    domain: "symbols_math",
    workMode: "debug",
    difficulty: "stretch",
    social: "solo",
    audience: "no_audience",
  },
  {
    domain: "symbols_math",
    workMode: "investigate",
    difficulty: "foundational",
    social: "solo",
    audience: "no_audience",
  },
  {
    domain: "visual_design",
    workMode: "build",
    difficulty: "foundational",
    social: "solo",
    audience: "no_audience",
  },
  {
    domain: "visual_design",
    workMode: "compose",
    difficulty: "foundational",
    social: "group",
    audience: "audience",
  },
  {
    domain: "visual_design",
    workMode: "explain",
    difficulty: "foundational",
    social: "group",
    audience: "audience",
  },
] as const satisfies readonly CoverageItem[];

const OFFERED_CELLS = OFFERED_COVERAGE.map(({ domain, workMode }) => ({ domain, workMode }));

const COMPLETE_COVERAGE = buildCoverageMatrix(OFFERED_COVERAGE, {
  probeCountRange: { min: 9, max: 9 },
  minDomains: 3,
  minWorkModes: 6,
});

const HYP_GOLDEN_A = {
  reading: "topic-leaning",
  topicSpike: {
    axis: "sound_music",
    voluntaryReturns: 4,
    spans: ["build", "perform", "debug"],
  },
  workModeSpike: null,
  supporting: [
    "Returned to sound_music across 3 kinds of work (build, perform, and debug) without prompting.",
  ],
  disconfirming: [
    "'build' returns so far appear only in sound_music — a work-mode preference across topics is not ruled out.",
  ],
  coverageGaps: [
    "No return data yet for symbols_math.",
    "No return data yet for visual_design.",
    "No return data yet for investigate.",
    "No return data yet for compose.",
    "No return data yet for explain.",
  ],
  nextDistinguishingProbe: {
    domain: "symbols_math",
    workMode: "build",
    why: "Offer build in another topic to test whether the work-mode travels or the pull is specific to sound_music.",
  },
} satisfies RevisableHypothesis;

const HYP_GOLDEN_B = {
  reading: "work-mode-leaning",
  topicSpike: null,
  workModeSpike: {
    axis: "build",
    voluntaryReturns: 4,
    spans: ["sound_music", "symbols_math", "visual_design"],
  },
  supporting: [
    "Returned to build across 3 topics (sound_music, symbols_math, and visual_design) without prompting.",
  ],
  disconfirming: [
    "'build' returns are strongest in symbols_math (2) — a pull toward the symbols_math topic is not ruled out.",
  ],
  coverageGaps: [
    "No return data yet for investigate.",
    "No return data yet for compose.",
    "No return data yet for explain.",
    "No return data yet for perform.",
    "No return data yet for debug.",
  ],
  nextDistinguishingProbe: {
    domain: "symbols_math",
    workMode: "investigate",
    why: "Offer a different kind of work in the strongest topic to test whether the pull is the topic or the making.",
  },
} satisfies RevisableHypothesis;

const HYP_GOLDEN_C = {
  reading: "insufficient",
  topicSpike: null,
  workModeSpike: null,
  supporting: [],
  disconfirming: [],
  coverageGaps: [
    "No return data yet for sound_music.",
    "No return data yet for symbols_math.",
    "No return data yet for visual_design.",
    "No return data yet for build.",
    "No return data yet for investigate.",
    "No return data yet for compose.",
    "No return data yet for explain.",
    "No return data yet for perform.",
    "No return data yet for debug.",
  ],
  nextDistinguishingProbe: null,
} satisfies RevisableHypothesis;

describe("buildRevisableHypothesis", () => {
  it("matches the exact topic-leaning hypothesis golden", () => {
    const grid = buildReturnGrid(ACTIVITY_GOLDEN_V1, { domainOrder: V1_DOMAIN_ORDER });

    expect(buildRevisableHypothesis(grid, COMPLETE_COVERAGE, OFFERED_CELLS)).toEqual(HYP_GOLDEN_A);
  });

  it("matches the exact work-mode-leaning hypothesis golden", () => {
    const grid = buildReturnGrid(ACTIVITY_GOLDEN_WORKMODE_V1, {
      domainOrder: V1_DOMAIN_ORDER,
    });

    expect(buildRevisableHypothesis(grid, COMPLETE_COVERAGE, OFFERED_CELLS)).toEqual(HYP_GOLDEN_B);
  });

  it("matches the exact insufficient-data hypothesis golden", () => {
    const grid = buildReturnGrid(ACTIVITY_GOLDEN_INSUFFICIENT_V1, {
      domainOrder: V1_DOMAIN_ORDER,
    });

    expect(buildRevisableHypothesis(grid, COMPLETE_COVERAGE, OFFERED_CELLS)).toEqual(HYP_GOLDEN_C);
  });
});
