import { describe, it, expect } from "vitest";
import { rankCandidates, attributionFor } from "../src/aggregate.js";
import type { CellBelief, DomainPath } from "../src/model.js";

function belief(
  domain: string,
  mode: string,
  mean: number,
  confident = true,
  lowerBound = mean,
): CellBelief {
  const domainPath: DomainPath = [domain];
  return {
    cellKey: `${domain}::${mode}`,
    domainPath,
    mode,
    alpha: 1,
    beta: 1,
    mean,
    sd: 0.1,
    lowerBound,
    evidenceMass: 5,
    confident,
    attribution: null,
    supporting: [],
    disconfirming: [],
  };
}

describe("rankCandidates", () => {
  it("keeps confident cells with lowerBound >= 0.6, sorted desc, capped at 3", () => {
    const bs = [
      belief("a", "build", 0.9, true, 0.9),
      belief("b", "build", 0.7, true, 0.7),
      belief("c", "build", 0.65, true, 0.65),
      belief("d", "build", 0.8, true, 0.8),
      belief("e", "build", 0.5, true, 0.5), // below threshold
      belief("f", "build", 0.95, false, 0.95), // not confident
    ];
    expect(rankCandidates(bs).map((b) => b.cellKey)).toEqual(["a::build", "d::build", "b::build"]);
  });
});

describe("attributionFor", () => {
  const maker = [
    belief("audio", "build", 0.8),
    belief("gamedev", "build", 0.8),
    belief("audio", "perform", 0.4),
    belief("gamedev", "perform", 0.35),
  ];
  const loyalist = [
    belief("audio", "build", 0.8),
    belief("audio", "perform", 0.8),
    belief("gamedev", "build", 0.4),
    belief("gamedev", "perform", 0.35),
  ];
  it("maker → style", () => {
    expect(attributionFor(maker[0]!, maker)).toBe("style");
  });
  it("loyalist → domain", () => {
    expect(attributionFor(loyalist[0]!, loyalist)).toBe("domain");
  });

  it("groups sub-topics under one cabin (per-cabin marginal, locks M2)", () => {
    function bsub(cabin: string, sub: string, mode: string, m: number): CellBelief {
      const domainPath: DomainPath = [cabin, sub];
      return {
        cellKey: `${cabin}/${sub}::${mode}`,
        domainPath,
        mode,
        alpha: 1,
        beta: 1,
        mean: m,
        sd: 0.1,
        lowerBound: m,
        evidenceMass: 5,
        confident: true,
        attribution: null,
        supporting: [],
        disconfirming: [],
      };
    }
    const cells = [
      bsub("music-sound", "audio-systems", "build", 0.8),
      bsub("music-sound", "synthesis", "build", 0.8), // second sub-topic, same cabin + mode
      bsub("code-computers", "game-dev", "build", 0.4),
    ];
    // domainMarginal(music-sound) = mean(0.8, 0.8) = 0.8; modeMarginal(build) = mean(0.8, 0.8, 0.4) = 0.6667
    // 0.8 − 0.6667 = 0.1333 > ATTR_MARGIN(0.1) → "domain" (cabin-loyal across sub-topics)
    expect(attributionFor(cells[0]!, cells)).toBe("domain");
  });
});
