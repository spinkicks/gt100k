// SC-1 + SC-8: programMetrics over the 014 pilot roster returns the exact golden funnel counts,
// avgDomainsPerKid, confidentRate, reopenRate — and is deterministic (same roster → same metrics).
// Golden values measured off buildPilotRoster(PILOT_NOW) (synthetic, deterministic fixture).
import { describe, expect, it } from "vitest";
import { buildPilotRoster, PILOT_NOW } from "@gt100k/student-profile";
import { programMetrics } from "../src/index.js";

describe("programMetrics — golden over the 014 pilot roster (SC-1)", () => {
  const roster = buildPilotRoster(PILOT_NOW);
  const m = programMetrics(roster);

  it("counts the kids", () => {
    expect(m.kids).toBe(5);
  });

  it("pins the lifecycle funnel (all 7 states, zeros included)", () => {
    // Elle (005) adds one more ACTIVE cell — an active specialization gone quiet, the recovery
    // surface's live burnout trigger — so ACTIVE is 2. Everything else is unchanged.
    expect(m.funnel).toEqual({
      EXPLORING: 3,
      EMERGING: 3,
      CANDIDATE: 1,
      ACTIVE: 2,
      PARKED: 1,
      CONTESTED: 0,
      REOPENED: 0,
    });
  });

  it("pins coverage-breadth (avg distinct top-domains per kid; none pass ≥6)", () => {
    // 10 distinct-domain sum across 5 kids (Elle adds music-sound). Still nobody near the ≥6 bar.
    expect(m.coverage.avgDomainsPerKid).toBe(2);
    expect(m.coverage.pctKidsCoveragePass).toBe(0);
  });

  it("pins calibration (confident 6/10; not-sure-yet 3/10)", () => {
    // Elle's cell is confident, so confident is 6 of 10 cells now.
    expect(m.calibration.confidentRate).toBeCloseTo(6 / 10, 12);
    expect(m.calibration.notSureYetRate).toBeCloseTo(3 / 10, 12);
  });

  it("pins reopenRate (no REOPENED transitions on the clean roster)", () => {
    expect(m.reopenRate).toBe(0);
  });
});

describe("programMetrics — edge + determinism (SC-8)", () => {
  it("empty roster → all zeros, no div-by-zero", () => {
    const m = programMetrics(new Map());
    expect(m.kids).toBe(0);
    expect(m.funnel).toEqual({
      EXPLORING: 0,
      EMERGING: 0,
      CANDIDATE: 0,
      ACTIVE: 0,
      PARKED: 0,
      CONTESTED: 0,
      REOPENED: 0,
    });
    expect(m.coverage.avgDomainsPerKid).toBe(0);
    expect(m.coverage.pctKidsCoveragePass).toBe(0);
    expect(m.calibration.confidentRate).toBe(0);
    expect(m.calibration.notSureYetRate).toBe(0);
    expect(m.reopenRate).toBe(0);
  });

  it("is deterministic — same roster yields deeply-equal metrics", () => {
    const roster = buildPilotRoster(PILOT_NOW);
    expect(programMetrics(roster)).toEqual(programMetrics(roster));
  });
});
