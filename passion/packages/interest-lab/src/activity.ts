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
  grid: ReturnGrid,
  coverage: CoverageMatrix,
  offeredCells: readonly { domain: Domain; workMode: WorkMode }[],
): RevisableHypothesis {
  const topicRow = grid.rows.find(({ domain }) => domain === grid.rowSpike);
  const workModeColumn = grid.columns.find(({ workMode }) => workMode === grid.columnSpike);
  const topicSpike = topicRow
    ? {
        axis: topicRow.domain,
        voluntaryReturns: topicRow.voluntaryReturns,
        spans: [...topicRow.workModesTouched],
      }
    : null;
  const workModeSpike = workModeColumn
    ? {
        axis: workModeColumn.workMode,
        voluntaryReturns: workModeColumn.voluntaryReturns,
        spans: [...workModeColumn.domainsTouched],
      }
    : null;
  const reading = hypothesisReading(topicSpike !== null, workModeSpike !== null);
  const topMode = topicSpike ? topWorkModeInDomain(grid, topicSpike.axis) : null;
  const topDomain = workModeSpike ? topDomainInWorkMode(grid, workModeSpike.axis) : null;

  const supporting: string[] = [];
  if (topicSpike) {
    supporting.push(
      `Returned to ${topicSpike.axis} across ${topicSpike.spans.length} kinds of work (${formatList(topicSpike.spans)}) without prompting.`,
    );
  }
  if (workModeSpike) {
    supporting.push(
      `Returned to ${workModeSpike.axis} across ${workModeSpike.spans.length} topics (${formatList(workModeSpike.spans)}) without prompting.`,
    );
  }

  const disconfirming: string[] = [];
  if (reading === "topic-leaning" && topicSpike && topMode) {
    const column = grid.columns.find(({ workMode }) => workMode === topMode);
    if (column?.domainsTouched.length === 1) {
      disconfirming.push(
        `'${topMode}' returns so far appear only in ${topicSpike.axis} — a work-mode preference across topics is not ruled out.`,
      );
    }
  } else if (reading === "work-mode-leaning" && workModeSpike && topDomain) {
    disconfirming.push(
      `'${workModeSpike.axis}' returns are strongest in ${topDomain.domain} (${topDomain.voluntaryReturns}) — a pull toward the ${topDomain.domain} topic is not ruled out.`,
    );
  }

  const offeredDomains = new Set(offeredCells.map(({ domain }) => domain));
  const offeredWorkModes = new Set(offeredCells.map(({ workMode }) => workMode));
  const coverageGaps = [
    ...grid.rows
      .filter(
        ({ domain, voluntaryReturns }) => offeredDomains.has(domain) && voluntaryReturns === 0,
      )
      .map(({ domain }) => `No return data yet for ${domain}.`),
    ...grid.columns
      .filter(
        ({ workMode, voluntaryReturns }) =>
          offeredWorkModes.has(workMode) && voluntaryReturns === 0,
      )
      .map(({ workMode }) => `No return data yet for ${workMode}.`),
    ...coverage.gaps,
  ];

  let nextDistinguishingProbe: RevisableHypothesis["nextDistinguishingProbe"] = null;
  if (reading === "topic-leaning" && topicSpike && topMode) {
    const domain = grid.domainOrder.find(
      (candidate) =>
        candidate !== topicSpike.axis &&
        offeredCells.some((cell) => cell.domain === candidate && cell.workMode === topMode),
    );
    if (domain !== undefined) {
      nextDistinguishingProbe = {
        domain,
        workMode: topMode,
        why: `Offer ${topMode} in another topic to test whether the work-mode travels or the pull is specific to ${topicSpike.axis}.`,
      };
    }
  } else if (reading === "work-mode-leaning" && workModeSpike && topDomain) {
    const workMode = WORK_MODES.find(
      (candidate) =>
        candidate !== workModeSpike.axis &&
        offeredCells.some(
          (cell) => cell.domain === topDomain.domain && cell.workMode === candidate,
        ),
    );
    if (workMode !== undefined) {
      nextDistinguishingProbe = {
        domain: topDomain.domain,
        workMode,
        why: "Offer a different kind of work in the strongest topic to test whether the pull is the topic or the making.",
      };
    }
  }

  return {
    reading,
    topicSpike,
    workModeSpike,
    supporting,
    disconfirming,
    coverageGaps,
    nextDistinguishingProbe,
  };
}

function hypothesisReading(hasTopicSpike: boolean, hasWorkModeSpike: boolean): HypothesisReading {
  if (hasTopicSpike && hasWorkModeSpike) {
    return "mixed";
  }
  if (hasTopicSpike) {
    return "topic-leaning";
  }
  return hasWorkModeSpike ? "work-mode-leaning" : "insufficient";
}

function voluntaryReturnsFor(grid: ReturnGrid, domain: Domain, workMode: WorkMode): number {
  return (
    grid.cells.find((cell) => cell.domain === domain && cell.workMode === workMode)
      ?.voluntaryReturns ?? 0
  );
}

function topWorkModeInDomain(grid: ReturnGrid, domain: Domain): WorkMode {
  return WORK_MODES.reduce((top, candidate) =>
    voluntaryReturnsFor(grid, domain, candidate) > voluntaryReturnsFor(grid, domain, top)
      ? candidate
      : top,
  );
}

function topDomainInWorkMode(
  grid: ReturnGrid,
  workMode: WorkMode,
): { domain: Domain; voluntaryReturns: number } | null {
  const firstDomain = grid.domainOrder[0];
  if (firstDomain === undefined) {
    return null;
  }

  const domain = grid.domainOrder.reduce((top, candidate) =>
    voluntaryReturnsFor(grid, candidate, workMode) > voluntaryReturnsFor(grid, top, workMode)
      ? candidate
      : top,
  );
  return { domain, voluntaryReturns: voluntaryReturnsFor(grid, domain, workMode) };
}

function formatList(items: readonly string[]): string {
  if (items.length < 2) {
    return items[0] ?? "";
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}
