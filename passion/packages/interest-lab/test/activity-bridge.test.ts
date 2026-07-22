import { describe, expect, it } from "vitest";
import { ACTIVITY_GOLDEN_V1, summarizeSignals, toEngagementEvents } from "../src/index";
import type { ActivityEvent, EngagementEvent, EventType } from "../src/index";

describe("toEngagementEvents", () => {
  it("produces the exact signal-summary golden", () => {
    expect(summarizeSignals(toEngagementEvents(ACTIVITY_GOLDEN_V1))).toEqual({
      voluntaryReturn: { day7: 3, day30: 1 },
      unrequiredRevision: 0,
      chosenChallenge: 0,
      failureRecovery: 0,
      scopeAuthorship: 0,
      competenceGrowth: 0,
      noveltyDecay: 0,
      promptDependence: 1,
      contextEffects: ["reminder"],
      familiesPresent: ["voluntary_return"],
    });
  });

  it("maps every signal-bearing kind while dropping novelty and withdrawn events", () => {
    const kinds: Array<{
      action: string;
      kind: ActivityEvent["kind"];
      dayOffset: number;
      expectedType?: EventType;
      intervention?: ActivityEvent["intervention"];
      assistive?: boolean;
      withdrawn?: boolean;
    }> = [
      { action: "explore", kind: "explore", dayOffset: 0 },
      { action: "early-return", kind: "return", dayOffset: 6 },
      { action: "return", kind: "return", dayOffset: 7, expectedType: "VOLUNTARY_RETURN" },
      {
        action: "prompted",
        kind: "return",
        dayOffset: 7,
        intervention: { source: "reward" },
        expectedType: "PROMPTED_RETURN",
      },
      { action: "revise", kind: "revise", dayOffset: 8, expectedType: "UNREQUIRED_REVISION" },
      {
        action: "challenge",
        kind: "challenge",
        dayOffset: 9,
        expectedType: "CHOSEN_CHALLENGE",
      },
      { action: "recover", kind: "recover", dayOffset: 10, expectedType: "FAILURE_RECOVERY" },
      {
        action: "scope",
        kind: "author-scope",
        dayOffset: 11,
        expectedType: "SELF_AUTHORED_SCOPE",
      },
      { action: "artifact", kind: "artifact", dayOffset: 12, expectedType: "ARTIFACT_COMPETENCE" },
      {
        action: "assist",
        kind: "assist",
        dayOffset: 13,
        assistive: true,
        expectedType: "ASSISTIVE",
      },
      {
        action: "assisted-revision",
        kind: "revise",
        dayOffset: 14,
        assistive: true,
        expectedType: "ASSISTIVE",
      },
      {
        action: "withdrawn-artifact",
        kind: "artifact",
        dayOffset: 15,
        withdrawn: true,
      },
    ];
    const activity: ActivityEvent[] = kinds.map((event) => ({
      zoneId: "code",
      probeId: "c_build",
      domain: "symbols_math",
      workMode: "build",
      ...event,
    }));

    const projected = toEngagementEvents(activity, { learnerRef: "synthetic-bridge-learner" });
    const expected = kinds.flatMap((event, index): EngagementEvent[] => {
      if (event.expectedType === undefined) {
        return [];
      }

      return [
        {
          id: `code:c_build:${event.action}:${event.dayOffset}:${index}`,
          learnerRef: "synthetic-bridge-learner",
          probeId: "c_build",
          familyId: "c_build",
          domain: "symbols_math",
          type: event.expectedType,
          occurredAtDayOffset: event.dayOffset,
          ...(event.intervention === undefined ? {} : { interventionContext: event.intervention }),
          assistive: event.assistive ?? false,
          reliability: "high",
          optionalReflection: false,
          withdrawn: false,
        },
      ];
    });

    expect(projected).toEqual(expected);
  });
});
