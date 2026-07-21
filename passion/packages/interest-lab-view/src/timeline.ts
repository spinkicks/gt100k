import type { EngagementEvent, EventType } from "@gt100k/interest-lab-domain";
import type { MarkerView, ReturnTimelineView } from "./model";
import { resolveMotion } from "./motion";

const MARKER_PRESENTATION = {
  VOLUNTARY_RETURN: { kind: "voluntary", tone: "tide" },
  PROMPTED_RETURN: { kind: "prompted", tone: "prompted" },
  UNREQUIRED_REVISION: { kind: "revision", tone: "neutral" },
  CHOSEN_CHALLENGE: { kind: "challenge", tone: "beacon" },
  FAILURE_RECOVERY: { kind: "recovery", tone: "neutral" },
  SELF_AUTHORED_SCOPE: { kind: "scope", tone: "beacon" },
  ARTIFACT_COMPETENCE: { kind: "artifact", tone: "sprout" },
  ASSISTIVE: { kind: "support", tone: "support" },
  SAFETY_RESCUE: { kind: "support", tone: "support" },
} as const satisfies Record<EventType, Pick<MarkerView, "kind" | "tone">>;

const LEGEND: ReturnTimelineView["legend"] = [
  {
    kind: "voluntary",
    tone: "tide",
    note: "Returned by choice at a 7- or 30-day horizon",
  },
  {
    kind: "prompted",
    tone: "prompted",
    note: "Returned after an intervention; contributes no voluntary signal",
  },
  {
    kind: "support",
    tone: "support",
    note: "Accessibility or safety support; never lowers a signal",
  },
];

const toMarker = (event: EngagementEvent): MarkerView => {
  const presentation = MARKER_PRESENTATION[event.type];
  const horizon =
    event.type === "VOLUNTARY_RETURN" &&
    (event.occurredAtDayOffset === 7 || event.occurredAtDayOffset === 30)
      ? event.occurredAtDayOffset
      : undefined;
  const interventionContext =
    event.type === "PROMPTED_RETURN" ? event.interventionContext?.source : undefined;

  return {
    eventId: event.id,
    dayOffset: event.occurredAtDayOffset,
    ...presentation,
    ...(horizon === undefined ? {} : { horizon }),
    ...(interventionContext === undefined ? {} : { interventionContext }),
    provenanceRecedes: event.type === "PROMPTED_RETURN",
    lowersSignal: false,
  };
};

export function buildReturnTimelineView(events: readonly EngagementEvent[]): ReturnTimelineView {
  const markers = events
    .map((event, fixtureOrder) => ({ fixtureOrder, marker: toMarker(event) }))
    .sort(
      (left, right) =>
        left.marker.dayOffset - right.marker.dayOffset || left.fixtureOrder - right.fixtureOrder,
    )
    .map(({ marker }) => marker);

  return {
    axisDays: {
      min: 0,
      max: Math.max(0, ...markers.map(({ dayOffset }) => dayOffset)),
    },
    markers,
    legend: LEGEND.map((item) => ({ ...item })),
    motion: {
      line: resolveMotion("timelineDraw", { reducedMotion: false }),
      marker: resolveMotion("markerPop", { reducedMotion: false }),
    },
  };
}
