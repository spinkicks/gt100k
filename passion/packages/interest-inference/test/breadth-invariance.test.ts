/**
 * Breadth of discovery must not suppress a spike (E4).
 *
 * The scenario: a child who has settled on one favourite cell and returns to it in each of ten
 * sessions, while 1, 3 or 6 other known cells sit on the map, surfaced and passed over every time.
 * The alternatives became known earlier, in a short run of exploring sessions — and it is those
 * sessions that put disconfirming evidence on the FAVOURITE, because while the child was trying an
 * alternative, the favourite was itself surfaced and not taken.
 *
 * Before normalization, each of those pass-overs cost the favourite a full `B_SKIP`, so its beta
 * grew linearly with the number of cabins the child had explored. The proposal's illustration of
 * the same defect, pooled over a child's whole known set and ignoring decay:
 *
 *   known cells | alpha | beta  | posterior mean
 *   2           | +10.0 | +5.0  | 0.647
 *   4           | +10.0 | +15.0 | 0.407
 *   7           | +10.0 | +30.0 | 0.262
 *
 * `SPIKE_THRESHOLD` is 0.6, so past four known cells the spike stops being detectable at all —
 * the engine would get worse at its one job precisely as the child got more curious.
 *
 * Only the favourite's own cell is modelled here. The model is a Beta-Bernoulli per cell, so the
 * alternatives' own posteriors cannot move the favourite's; what they contribute is the choice-set
 * size carried on the favourite's skips.
 */
import { describe, it, expect } from "vitest";
import { runInference } from "../src/inference.js";
import type { CellEvent } from "../src/model.js";
import { SPIKE_THRESHOLD } from "../src/model.js";

const NOW = Date.parse("2026-06-01T00:00:00.000Z");
const FAVOURITE: CellEvent["domainPath"] = ["music-sound", "audio-systems"];
const KEY = "music-sound/audio-systems::build";
const RETURN_SESSIONS = 10;

/** ISO timestamp for a whole number of days before NOW. */
const daysAgo = (n: number): string => new Date(NOW - n * 86_400_000).toISOString();

const fav = (kind: CellEvent["kind"], age: number, choiceSetSize?: number): CellEvent => ({
  domainPath: FAVOURITE,
  mode: "build",
  kind,
  novelty: false,
  timestamp: daysAgo(age),
  ...(choiceSetSize === undefined ? {} : { choiceSetSize }),
});

/**
 * The favourite cell's event stream, as `deriveSkips` would emit it.
 *
 * `normalized: false` reproduces the pre-fix scoring exactly: a skip with no `choiceSetSize`
 * takes the full `B_SKIP`.
 */
function favouriteEvents(alternatives: number, normalized: boolean): CellEvent[] {
  const events: CellEvent[] = [];
  // The exploring sessions, oldest first: one per alternative. The child took the alternative, so
  // the favourite was passed over — one skip each, out of a choice set of `alternatives` cells
  // (every cell on the map except the one taken).
  for (let i = alternatives - 1; i >= 0; i--) {
    events.push(fav("skip", RETURN_SESSIONS + i, normalized ? alternatives : undefined));
  }
  // Then ten sessions of returning to the favourite. It is engaged in each, so it is never in the
  // not-chosen set: these ages are the same in every arm, which fixes alpha across the three.
  for (let age = RETURN_SESSIONS - 1; age >= 0; age--) events.push(fav("cross_day_return", age));
  return events;
}

const meanFor = (alternatives: number, normalized: boolean): number => {
  const read = runInference(favouriteEvents(alternatives, normalized), [], NOW);
  return read.cells.find((c) => c.cellKey === KEY)!.mean;
};

describe("a spike survives breadth of discovery (E4)", () => {
  it("the favourite's posterior mean barely moves as the alternatives grow 1 → 3 → 6", () => {
    const means = [1, 3, 6].map((k) => meanFor(k, true));
    // 0.874406 / 0.875627 / 0.877321 — not bit-identical, because the exploring sessions sit at
    // different ages in each arm and so decay differently. That is recency, not breadth.
    for (const m of means) expect(m).toBeGreaterThan(SPIKE_THRESHOLD);
    expect(Math.max(...means) - Math.min(...means)).toBeLessThan(0.01);
  });

  it("without normalization the same child's spike erodes with every cabin explored", () => {
    // The regression this guards: 0.874406 / 0.829224 / 0.776049 — a spread over thirty times
    // wider, in the wrong direction, driven by nothing the child did to the favourite.
    const means = [1, 3, 6].map((k) => meanFor(k, false));
    expect(means[0]! - means[2]!).toBeGreaterThan(0.09);
  });
});
