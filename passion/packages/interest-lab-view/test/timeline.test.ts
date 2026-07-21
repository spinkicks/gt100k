import { EVENTS_GOLDEN_V1 } from "@gt100k/interest-lab-domain";
import { describe, expect, it } from "vitest";
import { resolveMotion } from "../src/motion";
import { buildReturnTimelineView } from "../src/timeline";

describe("buildReturnTimelineView", () => {
  it("matches the exact day-ascending return timeline golden", () => {
    const view = buildReturnTimelineView(EVENTS_GOLDEN_V1);

    expect(view.axisDays).toEqual({ min: 0, max: 30 });
    expect(view.markers).toEqual([
      {
        eventId: "e1",
        dayOffset: 7,
        kind: "voluntary",
        horizon: 7,
        tone: "tide",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e3",
        dayOffset: 7,
        kind: "prompted",
        tone: "prompted",
        interventionContext: "reminder",
        provenanceRecedes: true,
        lowersSignal: false,
      },
      {
        eventId: "e4",
        dayOffset: 9,
        kind: "revision",
        tone: "neutral",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e5",
        dayOffset: 12,
        kind: "challenge",
        tone: "beacon",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e6",
        dayOffset: 14,
        kind: "recovery",
        tone: "neutral",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e7",
        dayOffset: 20,
        kind: "scope",
        tone: "beacon",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e8",
        dayOffset: 21,
        kind: "support",
        tone: "support",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e9",
        dayOffset: 22,
        kind: "support",
        tone: "support",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e10",
        dayOffset: 25,
        kind: "artifact",
        tone: "sprout",
        provenanceRecedes: false,
        lowersSignal: false,
      },
      {
        eventId: "e2",
        dayOffset: 30,
        kind: "voluntary",
        horizon: 30,
        tone: "tide",
        provenanceRecedes: false,
        lowersSignal: false,
      },
    ]);
  });

  it("keeps prompted returns out of voluntary horizons and support events neutral", () => {
    const { markers } = buildReturnTimelineView(EVENTS_GOLDEN_V1);
    const prompted = markers.find(({ eventId }) => eventId === "e3");
    const support = markers.filter(({ kind }) => kind === "support");

    expect(prompted).toEqual(
      expect.objectContaining({
        kind: "prompted",
        interventionContext: "reminder",
        provenanceRecedes: true,
      }),
    );
    expect(prompted).not.toHaveProperty("horizon");
    expect(support.map(({ eventId }) => eventId)).toEqual(["e8", "e9"]);
    expect(support.every(({ tone, lowersSignal }) => tone === "support" && !lowersSignal)).toBe(
      true,
    );
  });

  it("provides color-independent legend copy and the pinned timeline motion", () => {
    const view = buildReturnTimelineView(EVENTS_GOLDEN_V1);

    expect(view.legend).toEqual([
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
    ]);
    expect(view.motion).toEqual({
      line: resolveMotion("timelineDraw", { reducedMotion: false }),
      marker: resolveMotion("markerPop", { reducedMotion: false }),
    });
  });
});
