import { describe, expect, it } from "vitest";

import { WORK_EVENT_KINDS } from "../src/index.js";

describe("WorkEvent model (spec §4.1)", () => {
  it("pins the ten work-event kinds, in spec order", () => {
    expect(WORK_EVENT_KINDS).toEqual([
      "session",
      "attempt",
      "outcome",
      "revision",
      "artifact",
      "decision",
      "reflection",
      "ai_help",
      "milestone",
      "showcase",
    ]);
  });

  it("has exactly ten kinds with no duplicates", () => {
    expect(WORK_EVENT_KINDS).toHaveLength(10);
    expect(new Set(WORK_EVENT_KINDS).size).toBe(10);
  });
});
