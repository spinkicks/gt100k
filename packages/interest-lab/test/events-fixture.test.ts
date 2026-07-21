import { describe, expect, it } from "vitest";
import { EVENTS_GOLDEN_V1 } from "./fixtures/events";

describe("EVENTS_GOLDEN_V1", () => {
  it("matches the normative ten-event stream in order", () => {
    expect(
      EVENTS_GOLDEN_V1.map(
        ({ id, type, occurredAtDayOffset, interventionContext, assistive, optionalReflection }) => [
          id,
          type,
          occurredAtDayOffset,
          interventionContext?.source ?? null,
          assistive,
          optionalReflection,
        ],
      ),
    ).toEqual([
      ["e1", "VOLUNTARY_RETURN", 7, null, false, false],
      ["e2", "VOLUNTARY_RETURN", 30, null, false, false],
      ["e3", "PROMPTED_RETURN", 7, "reminder", false, false],
      ["e4", "UNREQUIRED_REVISION", 9, null, false, false],
      ["e5", "CHOSEN_CHALLENGE", 12, null, false, false],
      ["e6", "FAILURE_RECOVERY", 14, null, false, false],
      ["e7", "SELF_AUTHORED_SCOPE", 20, null, false, true],
      ["e8", "ASSISTIVE", 21, null, true, false],
      ["e9", "SAFETY_RESCUE", 22, null, false, false],
      ["e10", "ARTIFACT_COMPETENCE", 25, null, false, false],
    ]);
  });

  it("uses one synthetic catalog identity and neutral replay defaults", () => {
    expect(EVENTS_GOLDEN_V1).toHaveLength(10);
    expect(new Set(EVENTS_GOLDEN_V1.map((event) => event.learnerRef))).toEqual(
      new Set(["synthetic-learner-001"]),
    );
    expect(
      EVENTS_GOLDEN_V1.every(
        (event) =>
          event.probeId === "p01" &&
          event.familyId === "p01" &&
          event.domain === "making" &&
          event.reliability === "high" &&
          event.withdrawn === false,
      ),
    ).toBe(true);
  });
});
