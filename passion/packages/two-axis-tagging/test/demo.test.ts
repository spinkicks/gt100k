import { describe, it, expect } from "vitest";
import { runDemo } from "../src/demo.js";

describe("demo", () => {
  it("produces a coverage matrix over (domain × work-mode) cells", async () => {
    const matrix = await runDemo();
    expect(matrix.length).toBeGreaterThan(0);
    for (const cell of matrix) {
      expect(cell.cell).toMatch(
        /.+::(build|investigate|compose|perform|debug|explain|persuade|collaborate|care)/,
      );
      expect(cell.count).toBeGreaterThanOrEqual(1);
    }
  });

  it("counts the two synthetic modes engaged on the demo artifact (golden)", async () => {
    const matrix = await runDemo();
    // Artifact tagged music-sound/audio-systems, afforded [perform, build, investigate].
    // play→perform (×1); assemble→build, tinker→build (build ×2). Deterministic.
    const byCell = new Map(matrix.map((c) => [c.cell, c.count]));
    expect(byCell.get("music-sound/audio-systems::perform")).toBe(1);
    expect(byCell.get("music-sound/audio-systems::build")).toBe(2);
    expect(matrix).toHaveLength(2);
  });
});
