import type { CoverageMatrix } from "./hypothesis";
import { type Domain, WORK_MODES, type WorkMode } from "./probe";

export type ActivityKind =
  | "explore"
  | "return"
  | "revise"
  | "challenge"
  | "recover"
  | "author-scope"
  | "artifact"
  | "assist";

export interface ActivityEvent {
  zoneId: string;
  probeId: string;
  domain: Domain;
  workMode: WorkMode;
  action: string;
  kind: ActivityKind;
  dayOffset: number;
  intervention?: import("./events").InterventionContext;
  assistive?: boolean;
  withdrawn?: boolean;
}

export interface GridCell {
  domain: Domain;
  workMode: WorkMode;
  visits: number;
  noveltyVisits: number;
  voluntaryReturns: number;
  promptedReturns: number;
  firstSeenDayOffset: number;
  lastSeenDayOffset: number;
}

export interface DomainRow {
  domain: Domain;
  voluntaryReturns: number;
  workModesTouched: WorkMode[];
}

export interface WorkModeColumn {
  workMode: WorkMode;
  voluntaryReturns: number;
  domainsTouched: Domain[];
}

export interface ReturnGrid {
  cells: GridCell[];
  rows: DomainRow[];
  columns: WorkModeColumn[];
  rowSpike: Domain | null;
  columnSpike: WorkMode | null;
  domainOrder: Domain[];
}

export interface ReturnGridConfig {
  noveltyHorizon: number;
  minAxisReturns: number;
  spikeLeadMargin: number;
  minAxisSpread: number;
}

export const DEFAULT_RETURN_GRID_CONFIG: ReturnGridConfig = {
  noveltyHorizon: 7,
  minAxisReturns: 2,
  spikeLeadMargin: 1,
  minAxisSpread: 2,
};

export function buildReturnGrid(
  activity: readonly ActivityEvent[],
  opts: { domainOrder?: readonly Domain[]; config?: Partial<ReturnGridConfig> } = {},
): ReturnGrid {
  const domainOrder = [...(opts.domainOrder ?? new Set(activity.map(({ domain }) => domain)))];

  return {
    cells: [],
    rows: domainOrder.map((domain) => ({ domain, voluntaryReturns: 0, workModesTouched: [] })),
    columns: WORK_MODES.map((workMode) => ({
      workMode,
      voluntaryReturns: 0,
      domainsTouched: [],
    })),
    rowSpike: null,
    columnSpike: null,
    domainOrder,
  };
}

export interface AxisSpike<A extends Domain | WorkMode, Cross extends Domain | WorkMode> {
  axis: A;
  voluntaryReturns: number;
  spans: Cross[];
}

export type HypothesisReading = "topic-leaning" | "work-mode-leaning" | "mixed" | "insufficient";

export interface RevisableHypothesis {
  reading: HypothesisReading;
  topicSpike: AxisSpike<Domain, WorkMode> | null;
  workModeSpike: AxisSpike<WorkMode, Domain> | null;
  supporting: string[];
  disconfirming: string[];
  coverageGaps: string[];
  nextDistinguishingProbe: { domain: Domain; workMode: WorkMode; why: string } | null;
}

export function buildRevisableHypothesis(
  _grid: ReturnGrid,
  coverage: CoverageMatrix,
  _offeredCells: readonly { domain: Domain; workMode: WorkMode }[],
): RevisableHypothesis {
  return {
    reading: "insufficient",
    topicSpike: null,
    workModeSpike: null,
    supporting: [],
    disconfirming: [],
    coverageGaps: [...coverage.gaps],
    nextDistinguishingProbe: null,
  };
}
