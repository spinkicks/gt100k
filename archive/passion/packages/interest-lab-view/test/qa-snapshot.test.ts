import { ACTIVITY_GOLDEN_V1, buildReturnGrid } from "@gt100k/interest-lab";
import type { RevisableHypothesis } from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import {
  INITIAL_ZONE_HOST_STATE,
  buildCuriosityMapView,
  buildQaSnapshot,
  zoneHostReducer,
} from "../src/index";
import type { QaInteractive } from "../src/index";

const V1_DOMAIN_ORDER = ["sound_music", "symbols_math", "visual_design"] as const;

const STUB_MANIFESTS = [
  {
    id: "music",
    domain: "sound_music",
    mapBuilding: {
      label: "Music Studio",
      glyph: "music-note",
      enterVerb: "Step inside",
      cell: { col: 0, row: 0 },
    },
  },
  {
    id: "code",
    domain: "symbols_math",
    mapBuilding: {
      label: "Code Lab",
      glyph: "code-brackets",
      enterVerb: "Step inside",
      cell: { col: 1, row: 0 },
    },
  },
  {
    id: "art",
    domain: "visual_design",
    mapBuilding: {
      label: "Art Studio",
      glyph: "art-brush",
      enterVerb: "Step inside",
      cell: { col: 2, row: 0 },
    },
  },
] as const;

const hypothesis = (reading: RevisableHypothesis["reading"]): RevisableHypothesis => ({
  reading,
  topicSpike: null,
  workModeSpike: null,
  supporting: [],
  disconfirming: [],
  coverageGaps: [],
  nextDistinguishingProbe: null,
});

const mapInteractives: QaInteractive[] = [
  {
    id: "map:music",
    kind: "map-building",
    label: "Music Studio",
    domain: "sound_music",
  },
  {
    id: "map:code",
    kind: "map-building",
    label: "Code Lab",
    domain: "symbols_math",
  },
  {
    id: "map:art",
    kind: "map-building",
    label: "Art Studio",
    domain: "visual_design",
  },
  {
    id: "control:time-lapse",
    kind: "map-control",
    label: "A week later…",
  },
];

const musicInteractives: QaInteractive[] = [
  {
    id: "action:m_build",
    kind: "activity-action",
    label: "Build",
    domain: "sound_music",
    workMode: "build",
  },
  {
    id: "action:m_perform",
    kind: "activity-action",
    label: "Perform",
    domain: "sound_music",
    workMode: "perform",
  },
  {
    id: "action:m_debug",
    kind: "activity-action",
    label: "Debug",
    domain: "sound_music",
    workMode: "debug",
  },
];

describe("buildQaSnapshot", () => {
  it("matches the exact initial window.__qa contract and state hash", async () => {
    const grid = buildReturnGrid([], { domainOrder: V1_DOMAIN_ORDER });
    const map = buildCuriosityMapView(STUB_MANIFESTS, [], { domainOrder: V1_DOMAIN_ORDER });
    const qa = buildQaSnapshot({
      ready: true,
      host: INITIAL_ZONE_HOST_STATE,
      map,
      grid,
      hypothesis: hypothesis("insufficient"),
      interactives: mapInteractives,
    });

    expect(qa).toMatchObject({
      ready: true,
      error: null,
      primarySurface: "curiosity-map",
      canvas: {
        present: true,
        ariaHidden: true,
        primary: false,
        hasDomAlternative: true,
      },
      activeZoneId: null,
    });
    expect(qa.interactives().map(({ id }) => id)).toEqual([
      "map:music",
      "map:code",
      "map:art",
      "control:time-lapse",
    ]);
    expect(qa.stateHash()).toBe('{"activeZoneId":null,"cells":[],"reading":"insufficient"}');
    await expect(qa.settle(3)).resolves.toBeUndefined();
  });

  it("matches the entered golden and canonicalizes cells independently of input order", () => {
    const grid = buildReturnGrid(ACTIVITY_GOLDEN_V1, { domainOrder: V1_DOMAIN_ORDER });
    const shuffledGrid = { ...grid, cells: [...grid.cells].reverse() };
    const enteredHost = zoneHostReducer(INITIAL_ZONE_HOST_STATE, {
      type: "enter",
      zoneId: "music",
    });
    const map = buildCuriosityMapView(STUB_MANIFESTS, ACTIVITY_GOLDEN_V1, {
      domainOrder: V1_DOMAIN_ORDER,
    });
    const enteredHypothesis = hypothesis("topic-leaning");
    const qa = buildQaSnapshot({
      ready: true,
      host: enteredHost,
      map,
      grid: shuffledGrid,
      hypothesis: enteredHypothesis,
      interactives: [...mapInteractives, ...musicInteractives],
    });

    expect(qa.activeZoneId).toBe("music");
    expect(qa.interactives().map(({ id }) => id)).toEqual([
      "map:music",
      "map:code",
      "map:art",
      "control:time-lapse",
      "action:m_build",
      "action:m_perform",
      "action:m_debug",
    ]);
    expect(qa.stateHash()).toBe(
      '{"activeZoneId":"music","cells":[["sound_music","build",2,0],["sound_music","perform",1,0],["sound_music","debug",1,0],["symbols_math","build",0,1]],"reading":"topic-leaning"}',
    );
    expect(qa.grid()).toBe(shuffledGrid);
    expect(qa.hypothesis()).toBe(enteredHypothesis);
  });
});
