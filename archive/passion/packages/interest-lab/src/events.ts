export const EVENT_TYPES = [
  "VOLUNTARY_RETURN",
  "PROMPTED_RETURN",
  "UNREQUIRED_REVISION",
  "CHOSEN_CHALLENGE",
  "FAILURE_RECOVERY",
  "SELF_AUTHORED_SCOPE",
  "ARTIFACT_COMPETENCE",
  "ASSISTIVE",
  "SAFETY_RESCUE",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type InterventionSource = "reminder" | "deadline" | "nudge" | "rivalry" | "reward";

export interface InterventionContext {
  source: InterventionSource;
}

export interface EngagementEvent {
  id: string;
  learnerRef: string;
  probeId: string;
  familyId: string;
  domain: string;
  type: EventType;
  occurredAtDayOffset: number;
  interventionContext?: InterventionContext;
  assistive: boolean;
  reliability: "low" | "medium" | "high";
  optionalReflection: boolean;
  withdrawn: boolean;
}

export function recordEvent(
  events: readonly EngagementEvent[],
  event: EngagementEvent,
): EngagementEvent[] {
  if (event.type === "PROMPTED_RETURN" && event.interventionContext === undefined) {
    throw new Error("PROMPTED_RETURN requires interventionContext");
  }

  if (events.some(({ id }) => id === event.id)) {
    return [...events];
  }

  return [...events, event];
}

export const SIGNAL_FAMILIES = [
  "voluntary_return",
  "unrequired_revision",
  "chosen_challenge",
  "failure_recovery",
  "self_authored_scope",
  "artifact_competence",
] as const;

export type SignalFamily = (typeof SIGNAL_FAMILIES)[number];

export interface SignalSummary {
  voluntaryReturn: {
    day7: number;
    day30: number;
  };
  unrequiredRevision: number;
  chosenChallenge: number;
  failureRecovery: number;
  scopeAuthorship: number;
  competenceGrowth: number;
  noveltyDecay: number;
  promptDependence: number;
  contextEffects: string[];
  familiesPresent: SignalFamily[];
}
