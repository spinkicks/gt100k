import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";

describe("demo", () => {
  it("derives signals and yields a confident build cell", () => {
    const { cellEventCount, read } = runDemo();
    expect(cellEventCount).toBeGreaterThan(0);
    expect(read.cells.some((c) => c.mode === "build" && c.confident)).toBe(true);
  });
});
