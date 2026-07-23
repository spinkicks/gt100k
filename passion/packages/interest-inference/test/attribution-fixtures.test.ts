import { describe, it, expect } from "vitest";
import { attributionFor } from "../src/aggregate.js";
import type { CellBelief, DomainPath } from "../src/model.js";
import {
  MAKER_GRID,
  MAKER_EXPECTED,
  LOYALIST_GRID,
  LOYALIST_EXPECTED,
  type AttrGrid,
} from "../src/__fixtures__/interest.fixtures.js";

function toBeliefs(grid: readonly AttrGrid[]): CellBelief[] {
  return grid.map((g) => {
    const domainPath: DomainPath = [g.domain];
    return {
      cellKey: `${g.domain}::${g.mode}`,
      domainPath,
      mode: g.mode,
      alpha: 1,
      beta: 1,
      mean: g.mean,
      sd: 0.1,
      lowerBound: g.mean,
      evidenceMass: 5,
      confident: true,
      attribution: null,
      supporting: [],
      disconfirming: [],
    };
  });
}

describe("attribution grids (spec §6 fixtures)", () => {
  it("maker fixture → style for the (audio, build) cell", () => {
    const beliefs = toBeliefs(MAKER_GRID);
    expect(attributionFor(beliefs[0]!, beliefs)).toBe(MAKER_EXPECTED);
  });
  it("loyalist fixture → domain for the (audio, build) cell", () => {
    const beliefs = toBeliefs(LOYALIST_GRID);
    expect(attributionFor(beliefs[0]!, beliefs)).toBe(LOYALIST_EXPECTED);
  });
});
