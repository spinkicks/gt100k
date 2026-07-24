import { describe, it, expect } from "vitest";
import { SPECIALIZATION_PLANNER_PACKAGE } from "../src/index.js";

describe("@gt100k/specialization-planner smoke", () => {
  it("exposes the package name constant", () => {
    expect(SPECIALIZATION_PLANNER_PACKAGE).toBe("@gt100k/specialization-planner");
  });
});
