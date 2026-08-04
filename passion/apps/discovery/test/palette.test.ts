import { describe, expect, it } from "vitest";
import { FILLS, STROKE, STROKE_WIDTH, ALLOWED_FILLS, HIGHLIGHT } from "../app/palette.generated";

describe("locked palette", () => {
  it("has 8 distinct 6-digit hex fills", () => {
    expect(FILLS).toHaveLength(8);
    for (const c of FILLS) expect(c).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(FILLS).size).toBe(8);
  });
  it("exposes a single navy stroke and width", () => {
    expect(STROKE).toBe("#002a3a");
    expect(STROKE_WIDTH).toBe(9);
  });
  it("allows the fills plus white and the off-white highlight", () => {
    expect(ALLOWED_FILLS.has("#ffffff")).toBe(true);
    expect(ALLOWED_FILLS.has(HIGHLIGHT)).toBe(true);
    for (const c of FILLS) expect(ALLOWED_FILLS.has(c)).toBe(true);
  });
});
