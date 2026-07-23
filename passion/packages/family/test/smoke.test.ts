import { describe, expect, it } from "vitest";
import { FAMILY_PACKAGE } from "../src/index.js";

describe("@gt100k/family scaffold", () => {
  it("exports its package identifier", () => {
    expect(FAMILY_PACKAGE).toBe("@gt100k/family");
  });
});
