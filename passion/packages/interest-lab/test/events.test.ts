import { describe, expect, it } from "vitest";
import { recordEvent } from "../src/events";
import type { EngagementEvent } from "../src/events";

const makeEvent = (overrides: Partial<EngagementEvent> = {}): EngagementEvent => ({
  id: "event-1",
  learnerRef: "synthetic-learner-001",
  probeId: "probe-1",
  familyId: "family-1",
  domain: "making",
  type: "VOLUNTARY_RETURN",
  occurredAtDayOffset: 7,
  assistive: false,
  reliability: "high",
  optionalReflection: false,
  withdrawn: false,
  ...overrides,
});

describe("recordEvent", () => {
  it("appends immutably and is idempotent by event id", () => {
    const events: EngagementEvent[] = [];
    const event = makeEvent();

    const recorded = recordEvent(events, event);
    const duplicate = recordEvent(recorded, {
      ...event,
      type: "CHOSEN_CHALLENGE",
    });

    expect(events).toEqual([]);
    expect(recorded).toEqual([event]);
    expect(duplicate).toEqual([event]);
  });

  it("requires intervention context for prompted returns and keeps them non-voluntary", () => {
    const prompted = makeEvent({
      id: "prompted-7",
      type: "PROMPTED_RETURN",
      interventionContext: { source: "reminder" },
    });

    const recorded = recordEvent([], prompted);

    expect(recorded).toEqual([prompted]);
    expect(recorded.filter(({ type }) => type === "VOLUNTARY_RETURN")).toHaveLength(0);
    expect(() =>
      recordEvent(
        [],
        makeEvent({
          id: "invalid-prompted",
          type: "PROMPTED_RETURN",
        }),
      ),
    ).toThrowError(/PROMPTED_RETURN.*interventionContext/);
  });

  it("preserves distinct 7-day and 30-day voluntary-return horizons", () => {
    const day7 = makeEvent({ id: "voluntary-7", occurredAtDayOffset: 7 });
    const day30 = makeEvent({ id: "voluntary-30", occurredAtDayOffset: 30 });
    const prompted = makeEvent({
      id: "prompted-7",
      type: "PROMPTED_RETURN",
      occurredAtDayOffset: 7,
      interventionContext: { source: "deadline" },
    });

    const recorded = recordEvent(recordEvent(recordEvent([], day7), day30), prompted);

    expect(
      recorded
        .filter(({ type }) => type === "VOLUNTARY_RETURN")
        .map(({ occurredAtDayOffset }) => occurredAtDayOffset),
    ).toEqual([7, 30]);
  });

  it("retains assistive, safety, and withdrawal tags for downstream signal handling", () => {
    const support = makeEvent({
      id: "support",
      type: "ASSISTIVE",
      occurredAtDayOffset: 21,
      assistive: true,
    });
    const rescue = makeEvent({
      id: "rescue",
      type: "SAFETY_RESCUE",
      occurredAtDayOffset: 22,
    });
    const withdrawn = makeEvent({
      id: "withdrawn-reflection",
      type: "SELF_AUTHORED_SCOPE",
      occurredAtDayOffset: 20,
      optionalReflection: true,
      withdrawn: true,
    });

    const recorded = recordEvent(recordEvent(recordEvent([], support), rescue), withdrawn);

    expect(recorded).toEqual([support, rescue, withdrawn]);
  });
});
