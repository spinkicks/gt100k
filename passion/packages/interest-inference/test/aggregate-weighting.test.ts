import { describe, it, expect } from "vitest";
import { attributionFor } from "../src/aggregate.js";
import type { CellBelief, DomainPath } from "../src/model.js";

// E7: marginals are weighted by evidence mass, so a thin cell cannot outvote a dense one.
function belief(domain: string, mode: string, mean: number, evidenceMass: number): CellBelief {
  const domainPath: DomainPath = [domain];
  return {
    cellKey: `${domain}::${mode}`,
    domainPath,
    mode,
    alpha: 1,
    beta: 1,
    mean,
    sd: 0.1,
    lowerBound: mean,
    evidenceMass,
    distinctDays: 2,
    confident: true,
    attribution: null,
    supporting: [],
    disconfirming: [],
  };
}

describe("attribution marginals are weighted by evidence mass (E7)", () => {
  it("is unchanged when every cell carries the same mass", () => {
    // Equal mass is the case the spec §6 attribution fixtures use, so they must be untouched.
    const equal = [
      belief("audio", "build", 0.8, 5),
      belief("audio", "perform", 0.3, 5),
      belief("chess", "build", 0.8, 5),
    ];
    // audio marginal (0.8 + 0.3)/2 = 0.55; build marginal (0.8 + 0.8)/2 = 0.80 → style.
    expect(attributionFor(equal[0]!, equal)).toBe("style");
  });

  it("stops a single thin cell from dominating a marginal", () => {
    // One barely-touched `build` cell in another cabin used to pull the mode marginal up as hard
    // as a heavily evidenced one. Weighted, its influence collapses to near nothing.
    const cells = [
      belief("audio", "build", 0.8, 20),
      belief("audio", "perform", 0.75, 20),
      belief("chess", "build", 0.05, 0.2), // thin: one stray touch
    ];
    // Unweighted, the build marginal would be (0.8 + 0.05)/2 = 0.425, dragging it below the audio
    // marginal of 0.775 and reporting "domain". Weighted it is ~0.793, so the two are level.
    expect(attributionFor(cells[0]!, cells)).toBe("mixed");
  });

  it("lets a dense cell carry the marginal it deserves", () => {
    const cells = [
      belief("audio", "build", 0.8, 20),
      belief("audio", "perform", 0.2, 1), // thin, should barely dilute the audio marginal
      belief("chess", "build", 0.2, 20),
    ];
    // Weighted: audio ≈ 0.771, build = 0.5 → domain. Unweighted audio would be 0.5, i.e. a tie.
    expect(attributionFor(cells[0]!, cells)).toBe("domain");
  });

  it("falls back to an unweighted mean rather than dividing by zero", () => {
    const massless = [
      belief("audio", "build", 0.9, 0),
      belief("audio", "perform", 0.9, 0),
      belief("chess", "build", 0.1, 0),
    ];
    // audio 0.9 vs build 0.5 → domain, and crucially not NaN.
    expect(attributionFor(massless[0]!, massless)).toBe("domain");
  });
});
