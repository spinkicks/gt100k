import { describe, expect, expectTypeOf, it } from "vitest";
import { EVENT_TYPES, SIGNAL_FAMILIES } from "../src/events";
import type {
  EngagementEvent,
  EventType,
  InterventionContext,
  InterventionSource,
  SignalFamily,
  SignalSummary,
} from "../src/events";

describe("engagement event contracts", () => {
  it("defines the exact event and intervention vocabularies", () => {
    expect(EVENT_TYPES).toEqual([
      "VOLUNTARY_RETURN",
      "PROMPTED_RETURN",
      "UNREQUIRED_REVISION",
      "CHOSEN_CHALLENGE",
      "FAILURE_RECOVERY",
      "SELF_AUTHORED_SCOPE",
      "ARTIFACT_COMPETENCE",
      "ASSISTIVE",
      "SAFETY_RESCUE",
    ]);

    expectTypeOf<EventType>().toEqualTypeOf<(typeof EVENT_TYPES)[number]>();
    expectTypeOf<InterventionSource>().toEqualTypeOf<
      "reminder" | "deadline" | "nudge" | "rivalry" | "reward"
    >();
    expectTypeOf<InterventionContext>().toEqualTypeOf<{
      source: InterventionSource;
    }>();
  });

  it("keeps prompted context and withdrawal state on each event", () => {
    expectTypeOf<EngagementEvent>().toEqualTypeOf<{
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
    }>();
  });
});

describe("signal summary contracts", () => {
  it("defines only the six promotion-gate signal families", () => {
    expect(SIGNAL_FAMILIES).toEqual([
      "voluntary_return",
      "unrequired_revision",
      "chosen_challenge",
      "failure_recovery",
      "self_authored_scope",
      "artifact_competence",
    ]);
    expectTypeOf<SignalFamily>().toEqualTypeOf<(typeof SIGNAL_FAMILIES)[number]>();
  });

  it("keeps signal magnitudes separated in the G4 shape", () => {
    expectTypeOf<SignalSummary>().toEqualTypeOf<{
      voluntaryReturn: { day7: number; day30: number };
      unrequiredRevision: number;
      chosenChallenge: number;
      failureRecovery: number;
      scopeAuthorship: number;
      competenceGrowth: number;
      noveltyDecay: number;
      promptDependence: number;
      contextEffects: string[];
      familiesPresent: SignalFamily[];
    }>();
  });
});
