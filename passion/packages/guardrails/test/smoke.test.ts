import { describe, expect, it } from "vitest";
import { buildPilotRoster, PILOT_NOW } from "@gt100k/student-profile";

describe("@gt100k/guardrails scaffold", () => {
  it("can read the merged discovery-spine pilot roster", () => {
    const roster = buildPilotRoster(PILOT_NOW);
    expect(roster.size).toBe(4);
  });
});
