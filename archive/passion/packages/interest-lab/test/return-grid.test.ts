import { describe, expect, it } from "vitest";
import { ACTIVITY_GOLDEN_V1, ACTIVITY_GOLDEN_WORKMODE_V1, buildReturnGrid } from "../src/index";
import type { ActivityEvent, ReturnGrid } from "../src/index";

const V1_DOMAIN_ORDER = ["sound_music", "symbols_math", "visual_design"] as const;

const EMPTY_COLUMNS: ReturnGrid["columns"] = [
  { workMode: "build", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "investigate", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "compose", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "explain", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "perform", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "debug", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "collaborate", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "care", voluntaryReturns: 0, domainsTouched: [] },
  { workMode: "persuade", voluntaryReturns: 0, domainsTouched: [] },
];

const GRID_GOLDEN_A: ReturnGrid = {
  cells: [
    {
      domain: "sound_music",
      workMode: "build",
      visits: 3,
      noveltyVisits: 1,
      voluntaryReturns: 2,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 30,
    },
    {
      domain: "sound_music",
      workMode: "perform",
      visits: 2,
      noveltyVisits: 1,
      voluntaryReturns: 1,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 7,
    },
    {
      domain: "sound_music",
      workMode: "debug",
      visits: 1,
      noveltyVisits: 0,
      voluntaryReturns: 1,
      promptedReturns: 0,
      firstSeenDayOffset: 7,
      lastSeenDayOffset: 7,
    },
    {
      domain: "symbols_math",
      workMode: "build",
      visits: 2,
      noveltyVisits: 1,
      voluntaryReturns: 0,
      promptedReturns: 1,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 7,
    },
    {
      domain: "visual_design",
      workMode: "build",
      visits: 1,
      noveltyVisits: 1,
      voluntaryReturns: 0,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 0,
    },
  ],
  rows: [
    {
      domain: "sound_music",
      voluntaryReturns: 4,
      workModesTouched: ["build", "perform", "debug"],
    },
    { domain: "symbols_math", voluntaryReturns: 0, workModesTouched: [] },
    { domain: "visual_design", voluntaryReturns: 0, workModesTouched: [] },
  ],
  columns: EMPTY_COLUMNS.map((column) => {
    if (column.workMode === "build") {
      return { ...column, voluntaryReturns: 2, domainsTouched: ["sound_music"] };
    }
    if (column.workMode === "perform" || column.workMode === "debug") {
      return { ...column, voluntaryReturns: 1, domainsTouched: ["sound_music"] };
    }
    return column;
  }),
  rowSpike: "sound_music",
  columnSpike: null,
  domainOrder: [...V1_DOMAIN_ORDER],
};

const GRID_GOLDEN_B: ReturnGrid = {
  cells: [
    {
      domain: "sound_music",
      workMode: "build",
      visits: 2,
      noveltyVisits: 1,
      voluntaryReturns: 1,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 7,
    },
    {
      domain: "sound_music",
      workMode: "perform",
      visits: 1,
      noveltyVisits: 1,
      voluntaryReturns: 0,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 0,
    },
    {
      domain: "symbols_math",
      workMode: "build",
      visits: 3,
      noveltyVisits: 1,
      voluntaryReturns: 2,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 30,
    },
    {
      domain: "visual_design",
      workMode: "build",
      visits: 2,
      noveltyVisits: 1,
      voluntaryReturns: 1,
      promptedReturns: 0,
      firstSeenDayOffset: 0,
      lastSeenDayOffset: 7,
    },
  ],
  rows: [
    { domain: "sound_music", voluntaryReturns: 1, workModesTouched: ["build"] },
    { domain: "symbols_math", voluntaryReturns: 2, workModesTouched: ["build"] },
    { domain: "visual_design", voluntaryReturns: 1, workModesTouched: ["build"] },
  ],
  columns: EMPTY_COLUMNS.map((column) =>
    column.workMode === "build"
      ? {
          ...column,
          voluntaryReturns: 4,
          domainsTouched: ["sound_music", "symbols_math", "visual_design"],
        }
      : column,
  ),
  rowSpike: null,
  columnSpike: "build",
  domainOrder: [...V1_DOMAIN_ORDER],
};

describe("buildReturnGrid", () => {
  it("matches the exact topic-leaning grid golden", () => {
    expect(buildReturnGrid(ACTIVITY_GOLDEN_V1, { domainOrder: V1_DOMAIN_ORDER })).toEqual(
      GRID_GOLDEN_A,
    );
  });

  it("matches the exact work-mode-leaning grid golden", () => {
    expect(buildReturnGrid(ACTIVITY_GOLDEN_WORKMODE_V1, { domainOrder: V1_DOMAIN_ORDER })).toEqual(
      GRID_GOLDEN_B,
    );
  });

  it("separates novelty and prompted returns while ignoring assistive and withdrawn activity", () => {
    const activity: ActivityEvent[] = [
      {
        zoneId: "music",
        probeId: "m_build",
        domain: "sound_music",
        workMode: "build",
        action: "open",
        kind: "explore",
        dayOffset: 0,
      },
      {
        zoneId: "music",
        probeId: "m_build",
        domain: "sound_music",
        workMode: "build",
        action: "open",
        kind: "return",
        dayOffset: 7,
        intervention: { source: "reward" },
      },
      {
        zoneId: "music",
        probeId: "m_build",
        domain: "sound_music",
        workMode: "build",
        action: "open",
        kind: "return",
        dayOffset: 7,
        assistive: true,
      },
      {
        zoneId: "art",
        probeId: "a_build",
        domain: "visual_design",
        workMode: "build",
        action: "open",
        kind: "return",
        dayOffset: 7,
        withdrawn: true,
      },
    ];

    const grid = buildReturnGrid(activity, { domainOrder: V1_DOMAIN_ORDER });

    expect(grid.cells).toEqual([
      {
        domain: "sound_music",
        workMode: "build",
        visits: 2,
        noveltyVisits: 1,
        voluntaryReturns: 0,
        promptedReturns: 1,
        firstSeenDayOffset: 0,
        lastSeenDayOffset: 7,
      },
    ]);
    expect(grid.rows.every(({ voluntaryReturns }) => voluntaryReturns === 0)).toBe(true);
    expect(grid.columns.every(({ voluntaryReturns }) => voluntaryReturns === 0)).toBe(true);
    expect(grid.rowSpike).toBeNull();
    expect(grid.columnSpike).toBeNull();
  });
});
