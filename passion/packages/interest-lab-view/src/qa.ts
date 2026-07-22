import {
  type Domain,
  type ReturnGrid,
  type RevisableHypothesis,
  WORK_MODES,
  type WorkMode,
} from "@gt100k/interest-lab";
import type { CuriosityMapView, ZoneId } from "./curiosity-map";
import type { ZoneHostState } from "./zone-host";

export interface QaInteractive {
  id: string;
  kind: "map-building" | "map-control" | "activity-action";
  label: string;
  domain?: Domain;
  workMode?: WorkMode;
  screenRect?: { x: number; y: number; w: number; h: number };
}

export interface Qa {
  ready: boolean;
  error: string | null;
  settle(frames?: number): Promise<void>;
  primarySurface: "curiosity-map";
  canvas: { present: boolean; ariaHidden: boolean; primary: false; hasDomAlternative: true };
  activeZoneId: ZoneId | null;
  interactives(): QaInteractive[];
  stateHash(): string;
  grid(): ReturnGrid;
  hypothesis(): RevisableHypothesis;
}

export function buildQaSnapshot(input: {
  ready: boolean;
  error?: string | null;
  host: ZoneHostState;
  map: CuriosityMapView;
  grid: ReturnGrid;
  hypothesis: RevisableHypothesis;
  interactives: QaInteractive[];
}): Qa {
  const { ready, error = null, host, grid, hypothesis, interactives } = input;
  const domainIndex = new Map(grid.domainOrder.map((domain, index) => [domain, index]));
  const workModeIndex = new Map(WORK_MODES.map((workMode, index) => [workMode, index]));
  const cells = grid.cells
    .filter(({ voluntaryReturns, promptedReturns }) => Boolean(voluntaryReturns || promptedReturns))
    .map(({ domain, workMode, voluntaryReturns, promptedReturns }) => ({
      domain,
      workMode,
      voluntaryReturns,
      promptedReturns,
    }))
    .sort(
      (left, right) =>
        (domainIndex.get(left.domain) ?? grid.domainOrder.length) -
          (domainIndex.get(right.domain) ?? grid.domainOrder.length) ||
        (workModeIndex.get(left.workMode) ?? WORK_MODES.length) -
          (workModeIndex.get(right.workMode) ?? WORK_MODES.length),
    )
    .map(({ domain, workMode, voluntaryReturns, promptedReturns }) => [
      domain,
      workMode,
      voluntaryReturns,
      promptedReturns,
    ]);

  return {
    ready,
    error,
    settle: () => Promise.resolve(),
    primarySurface: "curiosity-map",
    canvas: { present: true, ariaHidden: true, primary: false, hasDomAlternative: true },
    activeZoneId: host.activeZoneId,
    interactives: () => [...interactives],
    stateHash: () =>
      JSON.stringify({
        activeZoneId: host.activeZoneId,
        cells,
        reading: hypothesis.reading,
      }),
    grid: () => grid,
    hypothesis: () => hypothesis,
  };
}
