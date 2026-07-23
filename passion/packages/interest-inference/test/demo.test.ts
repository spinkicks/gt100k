import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";

describe("demo", () => {
  it("produces at least one confident belief", () => {
    const read = runDemo();
    expect(read.cells.some((c) => c.confident)).toBe(true);
  });
});
