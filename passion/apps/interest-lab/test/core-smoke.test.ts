import {
  ACTIVITY_GOLDEN_V1,
  type ReturnGrid,
  type RevisableHypothesis,
  WORK_MODES,
  buildLab,
  buildReturnGrid,
  buildRevisableHypothesis,
} from "@gt100k/interest-lab";
import {
  INITIAL_ZONE_HOST_STATE,
  buildCuriosityMapView,
  buildQaSnapshot,
  buildZoneActivityModel,
  zoneHostReducer,
} from "@gt100k/interest-lab-view";
import {
  STUB_ZONES,
  V1_DOMAIN_ORDER,
  ZONE_LAB_CONFIG_V1,
  createZoneRegistry,
} from "@gt100k/interest-zone-kit";
import { describe, expect, it } from "vitest";

const EMPTY_COLUMNS: ReturnGrid["columns"] = WORK_MODES.map((workMode) => ({
  workMode,
  voluntaryReturns: 0,
  domainsTouched: [],
}));

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

const HYP_GOLDEN_A: RevisableHypothesis = {
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
};

const MAP_GOLDEN = {
  buildings: [
    {
      zoneId: "music",
      domain: "sound_music",
      label: "Music Studio",
      glyph: "music-note",
      enterVerb: "Step inside",
      cell: { col: 0, row: 0 },
      hue: "#E8825A",
      returnState: "voluntary-return",
      unfinished: 0,
      ariaLabel: "Music Studio, discovery zone, 0 unfinished, you came back here",
    },
    {
      zoneId: "code",
      domain: "symbols_math",
      label: "Code Lab",
      glyph: "code-brackets",
      enterVerb: "Step inside",
      cell: { col: 1, row: 0 },
      hue: "#5FB98C",
      returnState: "prompted-return",
      unfinished: 1,
      ariaLabel: "Code Lab, discovery zone, 1 unfinished, you came back after a reminder",
    },
    {
      zoneId: "art",
      domain: "visual_design",
      label: "Art Studio",
      glyph: "art-brush",
      enterVerb: "Step inside",
      cell: { col: 2, row: 0 },
      hue: "#6C8CE8",
      returnState: "explored",
      unfinished: 1,
      ariaLabel: "Art Studio, discovery zone, 1 unfinished, you've been here",
    },
  ],
  timeLapse: {
    phases: [
      {
        id: "first-session",
        dayOffset: 0,
        label: "Right now",
        quieted: false,
        activeCells: [
          { domain: "sound_music", workMode: "build" },
          { domain: "sound_music", workMode: "perform" },
          { domain: "symbols_math", workMode: "build" },
          { domain: "visual_design", workMode: "build" },
        ],
      },
      {
        id: "a-week-later",
        dayOffset: 7,
        label: "A week later…",
        quieted: true,
        activeCells: [
          { domain: "sound_music", workMode: "build" },
          { domain: "sound_music", workMode: "perform" },
          { domain: "sound_music", workMode: "debug" },
          { domain: "symbols_math", workMode: "build" },
        ],
      },
      {
        id: "a-month-later",
        dayOffset: 30,
        label: "A month later…",
        quieted: true,
        activeCells: [{ domain: "sound_music", workMode: "build" }],
      },
    ],
    currentPhaseId: "a-month-later",
  },
  legend: [
    { returnState: "new", note: "Not explored yet." },
    { returnState: "explored", note: "Explored once." },
    { returnState: "voluntary-return", note: "Returned without prompting." },
    { returnState: "prompted-return", note: "Returned after a prompt." },
  ],
  domainOrder: [...V1_DOMAIN_ORDER],
};

describe("Interest Lab shared-core smoke", () => {
  it("runs the exact seeded map-to-QA chain through the frozen public contracts", () => {
    const registry = createZoneRegistry(STUB_ZONES);
    expect(registry.ids).toEqual(["music", "code", "art"]);

    const lab = buildLab(
      "synthetic-smoke-learner",
      registry.catalog(),
      { metPrereqs: [], engagedDomains: [] },
      ZONE_LAB_CONFIG_V1,
    );
    expect(lab).toMatchObject({ offers: { length: 9 }, coverage: { complete: true } });

    const host = zoneHostReducer(INITIAL_ZONE_HOST_STATE, { type: "enter", zoneId: "music" });
    const grid = buildReturnGrid(ACTIVITY_GOLDEN_V1, { domainOrder: V1_DOMAIN_ORDER });
    const hypothesis = buildRevisableHypothesis(
      grid,
      lab.coverage,
      lab.offers.map(({ domain, workMode }) => ({ domain, workMode })),
    );
    const map = buildCuriosityMapView(registry.manifests, ACTIVITY_GOLDEN_V1, {
      domainOrder: V1_DOMAIN_ORDER,
    });
    const musicActions = buildZoneActivityModel(registry.byId("music")).actions;
    const qa = buildQaSnapshot({
      ready: true,
      host,
      map,
      grid,
      hypothesis,
      interactives: [
        ...map.buildings.map(({ zoneId, label, domain }) => ({
          id: `map:${zoneId}`,
          kind: "map-building" as const,
          label,
          domain,
        })),
        { id: "control:time-lapse", kind: "map-control", label: "A month later…" },
        ...musicActions.map(({ actionId, label, domain, workMode }) => ({
          id: `action:${actionId}`,
          kind: "activity-action" as const,
          label,
          domain,
          workMode,
        })),
      ],
    });

    expect(grid).toEqual(GRID_GOLDEN_A);
    expect(hypothesis).toEqual(HYP_GOLDEN_A);
    expect(map).toEqual(MAP_GOLDEN);
    expect(qa.interactives().map(({ id }) => id)).toEqual([
      "map:music",
      "map:code",
      "map:art",
      "control:time-lapse",
      "action:m_build",
      "action:m_debug",
      "action:m_perform",
    ]);
    expect(qa.stateHash()).toBe(
      '{"activeZoneId":"music","cells":[["sound_music","build",2,0],["sound_music","perform",1,0],["sound_music","debug",1,0],["symbols_math","build",0,1]],"reading":"topic-leaning"}',
    );
  });
});
