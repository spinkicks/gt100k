import { describe, expect, it } from "vitest";
import { buildSyntheticInterestLabSeed } from "../app/seed";

describe("buildSyntheticInterestLabSeed", () => {
  it("feeds the golden catalog through the domain and child view without external data", () => {
    const seed = buildSyntheticInterestLabSeed();

    expect(seed.kind).toBe("synthetic");
    expect(seed.lab.learnerRef).toBe("synthetic-interest-lab-preview");
    expect(seed.lab.offers.map(({ probeId }) => probeId)).toEqual(
      Array.from({ length: 20 }, (_, index) => `p${String(index + 1).padStart(2, "0")}`),
    );
    expect(seed.view.surface).toBe("child");
    expect(seed.view.probePicker.quests).toHaveLength(20);
    expect(seed.view.probePicker.quests.map(({ probeId }) => probeId)).toEqual(
      seed.lab.offers.map(({ probeId }) => probeId),
    );
    expect(seed.view.flags).toMatchObject({
      ageBand: "9-11",
      reducedMotion: false,
      plainMode: false,
      deviceCaps: { webglAvailable: false },
    });
  });

  it("is byte-deterministic for the same synthetic defaults", () => {
    expect(JSON.stringify(buildSyntheticInterestLabSeed())).toBe(
      JSON.stringify(buildSyntheticInterestLabSeed()),
    );
  });
});
