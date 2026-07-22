import type { ActivityEvent, Domain, WorkMode } from "@gt100k/interest-lab";

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

export function buildTimeLapse(_activity: readonly ActivityEvent[]): TimeLapseView {
  return {
    phases: [
      {
        id: "first-session",
        dayOffset: 0,
        label: "Right now",
        quieted: false,
        activeCells: [],
      },
    ],
    currentPhaseId: "first-session",
  };
}
