import type { EngagementEvent, EventType, InterventionContext } from "../../src/events";

interface FixtureEvent {
  id: string;
  type: EventType;
  occurredAtDayOffset: number;
  interventionContext?: InterventionContext;
  assistive?: boolean;
  optionalReflection?: boolean;
}

const makeEvent = (event: FixtureEvent): EngagementEvent => ({
  learnerRef: "synthetic-learner-001",
  probeId: "p01",
  familyId: "p01",
  domain: "making",
  assistive: false,
  reliability: "high",
  optionalReflection: false,
  withdrawn: false,
  ...event,
});

export const EVENTS_GOLDEN_V1: EngagementEvent[] = [
  makeEvent({ id: "e1", type: "VOLUNTARY_RETURN", occurredAtDayOffset: 7 }),
  makeEvent({ id: "e2", type: "VOLUNTARY_RETURN", occurredAtDayOffset: 30 }),
  makeEvent({
    id: "e3",
    type: "PROMPTED_RETURN",
    occurredAtDayOffset: 7,
    interventionContext: { source: "reminder" },
  }),
  makeEvent({ id: "e4", type: "UNREQUIRED_REVISION", occurredAtDayOffset: 9 }),
  makeEvent({ id: "e5", type: "CHOSEN_CHALLENGE", occurredAtDayOffset: 12 }),
  makeEvent({ id: "e6", type: "FAILURE_RECOVERY", occurredAtDayOffset: 14 }),
  makeEvent({
    id: "e7",
    type: "SELF_AUTHORED_SCOPE",
    occurredAtDayOffset: 20,
    optionalReflection: true,
  }),
  makeEvent({ id: "e8", type: "ASSISTIVE", occurredAtDayOffset: 21, assistive: true }),
  makeEvent({ id: "e9", type: "SAFETY_RESCUE", occurredAtDayOffset: 22 }),
  makeEvent({ id: "e10", type: "ARTIFACT_COMPETENCE", occurredAtDayOffset: 25 }),
];
