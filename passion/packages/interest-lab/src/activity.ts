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
  const config = { ...DEFAULT_RETURN_GRID_CONFIG, ...opts.config };
  const cellsByDomain = new Map<Domain, Map<WorkMode, GridCell>>();

  for (const event of activity) {
    if (event.withdrawn === true || event.assistive === true) {
      continue;
    }

    let cellsByWorkMode = cellsByDomain.get(event.domain);
    if (cellsByWorkMode === undefined) {
      cellsByWorkMode = new Map();
      cellsByDomain.set(event.domain, cellsByWorkMode);
    }

    let cell = cellsByWorkMode.get(event.workMode);
    if (cell === undefined) {
      cell = {
        domain: event.domain,
        workMode: event.workMode,
        visits: 0,
        noveltyVisits: 0,
        voluntaryReturns: 0,
        promptedReturns: 0,
        firstSeenDayOffset: event.dayOffset,
        lastSeenDayOffset: event.dayOffset,
      };
      cellsByWorkMode.set(event.workMode, cell);
    }

    cell.visits += 1;
    cell.firstSeenDayOffset = Math.min(cell.firstSeenDayOffset, event.dayOffset);
    cell.lastSeenDayOffset = Math.max(cell.lastSeenDayOffset, event.dayOffset);

    if (event.dayOffset < config.noveltyHorizon) {
      cell.noveltyVisits += 1;
    } else if (event.intervention === undefined) {
      cell.voluntaryReturns += 1;
    } else {
      cell.promptedReturns += 1;
    }
  }

  const rows = domainOrder.map((domain): DomainRow => {
    const domainCells = cellsByDomain.get(domain);
    const touchedCells = WORK_MODES.map((workMode) => domainCells?.get(workMode)).filter(
      (cell): cell is GridCell => cell !== undefined && cell.voluntaryReturns > 0,
    );

    return {
      domain,
      voluntaryReturns: touchedCells.reduce(
        (total, { voluntaryReturns }) => total + voluntaryReturns,
        0,
      ),
      workModesTouched: touchedCells.map(({ workMode }) => workMode),
    };
  });

  const columns = WORK_MODES.map((workMode): WorkModeColumn => {
    const touchedCells = domainOrder
      .map((domain) => cellsByDomain.get(domain)?.get(workMode))
      .filter((cell): cell is GridCell => cell !== undefined && cell.voluntaryReturns > 0);

    return {
      workMode,
      voluntaryReturns: touchedCells.reduce(
        (total, { voluntaryReturns }) => total + voluntaryReturns,
        0,
      ),
      domainsTouched: touchedCells.map(({ domain }) => domain),
    };
  });

  const domainIndex = new Map(domainOrder.map((domain, index) => [domain, index]));
  const workModeIndex = new Map(WORK_MODES.map((workMode, index) => [workMode, index]));
  const cells = [...cellsByDomain.values()]
    .flatMap((cellsByWorkMode) => [...cellsByWorkMode.values()])
    .sort((left, right) => {
      const domainDifference =
        (domainIndex.get(left.domain) ?? domainOrder.length) -
        (domainIndex.get(right.domain) ?? domainOrder.length);
      return (
        domainDifference ||
        (workModeIndex.get(left.workMode) ?? WORK_MODES.length) -
          (workModeIndex.get(right.workMode) ?? WORK_MODES.length)
      );
    });

  const rowSpike = findSpike(
    rows,
    ({ domain }) => domain,
    ({ voluntaryReturns }) => voluntaryReturns,
    ({ workModesTouched }) => workModesTouched.length,
    config,
  );
  const columnSpike = findSpike(
    columns,
    ({ workMode }) => workMode,
    ({ voluntaryReturns }) => voluntaryReturns,
    ({ domainsTouched }) => domainsTouched.length,
    config,
  );

  return {
    cells,
    rows,
    columns,
    rowSpike,
    columnSpike,
    domainOrder,
  };
}

function findSpike<Entry, Axis extends Domain | WorkMode>(
  entries: readonly Entry[],
  axisOf: (entry: Entry) => Axis,
  returnsOf: (entry: Entry) => number,
  spreadOf: (entry: Entry) => number,
  config: ReturnGridConfig,
): Axis | null {
  if (entries.length === 0) {
    return null;
  }

  let topIndex = 0;
  for (let index = 1; index < entries.length; index += 1) {
    if (returnsOf(entries[index]!) > returnsOf(entries[topIndex]!)) {
      topIndex = index;
    }
  }

  const top = entries[topIndex]!;
  const secondHighest = entries.reduce(
    (highest, entry, index) => (index === topIndex ? highest : Math.max(highest, returnsOf(entry))),
    0,
  );
  const topReturns = returnsOf(top);

  return topReturns >= config.minAxisReturns &&
    topReturns - secondHighest >= config.spikeLeadMargin &&
    spreadOf(top) >= config.minAxisSpread
    ? axisOf(top)
    : null;
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
