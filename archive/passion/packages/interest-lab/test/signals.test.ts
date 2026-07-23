import { describe, expect, expectTypeOf, it } from "vitest";
import type { EngagementEvent, SignalSummary } from "../src/events";
import { summarizeSignals } from "../src/signals";
import { EVENTS_GOLDEN_V1 } from "./fixtures/events";

const EMPTY_SUMMARY: SignalSummary = {
  voluntaryReturn: { day7: 0, day30: 0 },
  unrequiredRevision: 0,
  chosenChallenge: 0,
  failureRecovery: 0,
  scopeAuthorship: 0,
  competenceGrowth: 0,
  noveltyDecay: 0,
  promptDependence: 0,
  contextEffects: [],
  familiesPresent: [],
};

describe("summarizeSignals", () => {
  it("deep-equals the exact G4 separated signal summary", () => {
    expect(summarizeSignals(EVENTS_GOLDEN_V1)).toEqual({
      voluntaryReturn: { day7: 1, day30: 1 },
      unrequiredRevision: 1,
      chosenChallenge: 1,
      failureRecovery: 1,
      scopeAuthorship: 1,
      competenceGrowth: 1,
      noveltyDecay: 0,
      promptDependence: 1,
      contextEffects: ["reminder"],
      familiesPresent: [
        "voluntary_return",
        "unrequired_revision",
        "chosen_challenge",
        "failure_recovery",
        "self_authored_scope",
        "artifact_competence",
      ],
    });
  });

  it("keeps prompted return and context out of voluntary and promotion families", () => {
    const prompted = EVENTS_GOLDEN_V1.filter(({ id }) => id === "e3");

    expect(summarizeSignals(prompted)).toEqual({
      ...EMPTY_SUMMARY,
      promptDependence: 1,
      contextEffects: ["reminder"],
    });
    expect(summarizeSignals(prompted).familiesPresent).not.toContain("prompt_dependence");
    expect(summarizeSignals(prompted).familiesPresent).not.toContain("contextEffects");
  });

  it("produces an identical interpretation when evidence is assistive-tagged", () => {
    const assisted: EngagementEvent[] = EVENTS_GOLDEN_V1.map((event) =>
      event.id === "e4" || event.id === "e6" ? { ...event, assistive: true } : event,
    );

    expect(summarizeSignals(assisted)).toEqual(summarizeSignals(EVENTS_GOLDEN_V1));
  });

  it("excludes a withdrawn optional reflection from scope authorship", () => {
    const withdrawn: EngagementEvent[] = EVENTS_GOLDEN_V1.map((event) =>
      event.id === "e7" ? { ...event, withdrawn: true } : event,
    );
    const summary = summarizeSignals(withdrawn);

    expect(summary.scopeAuthorship).toBe(0);
    expect(summary.familiesPresent).toEqual([
      "voluntary_return",
      "unrequired_revision",
      "chosen_challenge",
      "failure_recovery",
      "artifact_competence",
    ]);
  });

  it("has no input path for parent family context to affect child signals", () => {
    const parentProjection = {
      familyContext: { claimedInterest: "synthetic-parent-context" },
      childEvents: [] as EngagementEvent[],
    };

    expectTypeOf(summarizeSignals).parameters.toEqualTypeOf<[events: readonly EngagementEvent[]]>();
    expect(parentProjection.familyContext).toBeDefined();
    expect(summarizeSignals(parentProjection.childEvents)).toEqual(EMPTY_SUMMARY);
  });
});
