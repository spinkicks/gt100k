import { describe, it, expect } from "vitest";
import { runInference } from "../src/inference.js";
import type { CellEvent, DomainPrior } from "../src/model.js";

const NOW = Date.parse("2026-01-08T00:00:00.000Z");
const DAYS = [1, 2, 3, 4, 5, 6, 7, 8];
function ret(domain: string, sub: string, mode: string, day: number): CellEvent {
  return {
    domainPath: [domain, sub],
    mode,
    kind: "cross_day_return",
    novelty: false,
    timestamp: `2026-01-0${day}T00:00:00.000Z`,
  };
}

describe("runInference", () => {
  it("returns a well-formed InterestRead (no scalar; candidates ⊆ cells; attribution only on candidates)", () => {
    const priors: DomainPrior[] = [];
    // A week of daily returns on each of two cells → both should be confident candidates. Under
    // E6 the returns have to sit on distinct days to get there; four returns on one timestamp
    // used to suffice and now, correctly, does not.
    const evts: CellEvent[] = [
      ...DAYS.map((d) => ret("music-sound", "audio-systems", "build", d)),
      ...DAYS.map((d) => ret("code-computers", "game-dev", "build", d)),
    ];
    const read = runInference(evts, priors, NOW);
    expect(Array.isArray(read.cells)).toBe(true);
    expect(read.candidates.length).toBeGreaterThan(0);
    const cellKeys = new Set(read.cells.map((c) => c.cellKey));
    for (const cand of read.candidates) expect(cellKeys.has(cand.cellKey)).toBe(true);
    for (const cell of read.cells) {
      if (read.candidates.some((c) => c.cellKey === cell.cellKey))
        expect(cell.attribution).not.toBeNull();
      else expect(cell.attribution).toBeNull();
    }
    expect((read as unknown as { score?: number }).score).toBeUndefined(); // never a scalar
  });
});
