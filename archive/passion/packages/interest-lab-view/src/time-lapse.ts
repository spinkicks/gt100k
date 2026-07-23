import { type ActivityEvent, type Domain, WORK_MODES, type WorkMode } from "@gt100k/interest-lab";

export type TimeLapsePhaseId = "first-session" | "a-week-later" | "a-month-later";

export interface TimeLapsePhase {
  id: TimeLapsePhaseId;
  dayOffset: number;
  label: string;
  quieted: boolean;
  activeCells: { domain: Domain; workMode: WorkMode }[];
}

export interface TimeLapseView {
  phases: TimeLapsePhase[];
  currentPhaseId: TimeLapsePhaseId;
}

const PHASES: readonly Omit<TimeLapsePhase, "activeCells">[] = [
  {
    id: "first-session",
    dayOffset: 0,
    label: "Right now",
    quieted: false,
  },
  {
    id: "a-week-later",
    dayOffset: 7,
    label: "A week later…",
    quieted: true,
  },
  {
    id: "a-month-later",
    dayOffset: 30,
    label: "A month later…",
    quieted: true,
  },
];

export function buildTimeLapse(activity: readonly ActivityEvent[]): TimeLapseView {
  const domainOrder = [...new Set(activity.map(({ domain }) => domain))];
  const eligibleActivity = activity.filter(
    ({ assistive, withdrawn }) => assistive !== true && withdrawn !== true,
  );
  const phases = PHASES.flatMap((phase): TimeLapsePhase[] => {
    const events = eligibleActivity.filter(({ dayOffset }) => dayOffset === phase.dayOffset);
    if (events.length === 0) {
      return [];
    }

    const workModesByDomain = new Map<Domain, Set<WorkMode>>();
    for (const { domain, workMode } of events) {
      const workModes = workModesByDomain.get(domain) ?? new Set<WorkMode>();
      workModes.add(workMode);
      workModesByDomain.set(domain, workModes);
    }
    const activeCells = domainOrder.flatMap((domain) =>
      WORK_MODES.filter((workMode) => workModesByDomain.get(domain)?.has(workMode)).map(
        (workMode) => ({ domain, workMode }),
      ),
    );

    return [{ ...phase, activeCells }];
  });

  return {
    phases,
    currentPhaseId: phases.at(-1)?.id ?? "first-session",
  };
}
