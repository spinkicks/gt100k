import { describe, expect, it } from "vitest";
import { buildLab } from "../src/offer";
import { CATALOG_GOLDEN_V1, FRESH_LEARNER, GOLDEN_ROWS } from "./fixtures/catalog";

const G2_COMPLETE_COVERAGE = {
  probeCount: { met: true, count: 20, need: 18 },
  domains: {
    met: true,
    count: 8,
    need: 6,
    have: [
      "making",
      "living_systems",
      "symbols_math",
      "word_craft",
      "sound_music",
      "movement_body",
      "visual_design",
      "social_world",
    ],
    gaps: [],
  },
  workModes: {
    met: true,
    count: 9,
    need: 6,
    have: [
      "build",
      "investigate",
      "compose",
      "explain",
      "perform",
      "debug",
      "collaborate",
      "care",
      "persuade",
    ],
    gaps: [],
  },
  social: { met: true, solo: true, group: true, gaps: [] },
  difficulty: { met: true, foundational: true, stretch: true, gaps: [] },
  audience: { met: true, audience: true, no_audience: true, gaps: [] },
  complete: true,
  gaps: [],
};

describe("interest-lab smoke", () => {
  it("keeps the seeded G1 Lab deterministic with complete G2 coverage", () => {
    const labs = [1, 42, 999].map((seed) =>
      buildLab("synthetic-fresh-learner", CATALOG_GOLDEN_V1, FRESH_LEARNER, { seed }),
    );
    const expectedProbeIds = GOLDEN_ROWS.map(([id]) => id);

    for (const lab of labs) {
      expect(lab.offers).toHaveLength(20);
      expect(lab.offers.map(({ probeId }) => probeId)).toEqual(expectedProbeIds);
      expect(lab.coverage).toEqual(G2_COMPLETE_COVERAGE);
    }
  });
});
