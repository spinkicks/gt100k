import { describe, it, expect } from "vitest";
import { runInference } from "../src/inference.js";
import type { CellEvent, DomainPrior } from "../src/model.js";

const NOW = Date.parse("2026-01-01T00:00:00.000Z");
const TS = "2026-01-01T00:00:00.000Z";
function ret(domain: string, sub: string, mode: string): CellEvent {
  return { domainPath: [domain, sub], mode, kind: "voluntary_return", magnitude: 1, novelty: false, timestamp: TS };
}

describe("runInference", () => {
  it("returns a well-formed InterestRead (no scalar; candidates ⊆ cells; attribution only on candidates)", () => {
    const priors: DomainPrior[] = [];
    // 4 strong returns each on two cells → both should be confident candidates
    const evts: CellEvent[] = [
      ...Array.from({ length: 4 }, () => ret("music-sound", "audio-systems", "build")),
      ...Array.from({ length: 4 }, () => ret("code-computers", "game-dev", "build")),
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
