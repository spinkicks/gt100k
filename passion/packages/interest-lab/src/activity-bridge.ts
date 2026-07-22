import { type ActivityEvent, type ActivityKind, DEFAULT_RETURN_GRID_CONFIG } from "./activity";
import type { EngagementEvent, EventType } from "./events";

const EVENT_TYPE_BY_KIND: Partial<Record<ActivityKind, EventType>> = {
  revise: "UNREQUIRED_REVISION",
  challenge: "CHOSEN_CHALLENGE",
  recover: "FAILURE_RECOVERY",
  "author-scope": "SELF_AUTHORED_SCOPE",
  artifact: "ARTIFACT_COMPETENCE",
  assist: "ASSISTIVE",
};

function eventTypeFor(event: ActivityEvent, noveltyHorizon: number): EventType | undefined {
  if (event.assistive === true) {
    return "ASSISTIVE";
  }
  if (event.kind === "return") {
    if (event.dayOffset < noveltyHorizon) {
      return undefined;
    }
    return event.intervention === undefined ? "VOLUNTARY_RETURN" : "PROMPTED_RETURN";
  }
  return EVENT_TYPE_BY_KIND[event.kind];
}

export function toEngagementEvents(
  activity: readonly ActivityEvent[],
  opts: { learnerRef?: string; noveltyHorizon?: number } = {},
): EngagementEvent[] {
  const learnerRef = opts.learnerRef ?? "synthetic-interest-lab-learner";
  const noveltyHorizon = opts.noveltyHorizon ?? DEFAULT_RETURN_GRID_CONFIG.noveltyHorizon;

  return activity.flatMap((event, index): EngagementEvent[] => {
    if (event.withdrawn === true) {
      return [];
    }

    const type = eventTypeFor(event, noveltyHorizon);
    if (type === undefined) {
      return [];
    }

    return [
      {
        id: `${event.zoneId}:${event.probeId}:${event.action}:${event.dayOffset}:${index}`,
        learnerRef,
        probeId: event.probeId,
        familyId: event.probeId,
        domain: event.domain,
        type,
        occurredAtDayOffset: event.dayOffset,
        ...(type === "PROMPTED_RETURN" ? { interventionContext: event.intervention } : {}),
        assistive: event.assistive ?? false,
        reliability: "high",
        optionalReflection: false,
        withdrawn: false,
      },
    ];
  });
}
