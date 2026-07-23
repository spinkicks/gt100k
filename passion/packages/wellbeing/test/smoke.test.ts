import { describe, expect, it } from "vitest";
import { WELLBEING_PACKAGE } from "../src/index.js";

describe("@gt100k/wellbeing scaffold", () => {
  it("exports its package identifier", () => {
    expect(WELLBEING_PACKAGE).toBe("@gt100k/wellbeing");
  });
});
