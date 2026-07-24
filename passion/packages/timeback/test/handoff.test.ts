// SC-5: the light two-block daily handoff is ONE-WAY (school → passion hint) + reward-neutral by
// construction. No reward/points/grade/score/streak channel anywhere (only the reward-neutral FLAG).
import { describe, expect, it } from "vitest";
import { buildDailyHandoff, toDomainPriors } from "../src/index.js";
import { GOLDEN_SNAPSHOT } from "../src/__fixtures__/snapshots.js";

describe("buildDailyHandoff (SC-5)", () => {
  const handoff = buildDailyHandoff(GOLDEN_SNAPSHOT, "2026-04-01");

  it("carries the priors from toDomainPriors (one-way school→passion hint)", () => {
    expect(handoff.priors).toEqual(toDomainPriors(GOLDEN_SNAPSHOT));
    expect(handoff.priors.length).toBeGreaterThan(0);
  });

  it("echoes kidId + date", () => {
    expect(handoff.kidId).toBe(GOLDEN_SNAPSHOT.kidId);
    expect(handoff.date).toBe("2026-04-01");
  });

  it("is reward-neutral + block-independent by construction", () => {
    expect(handoff.passionBlockRewardNeutral).toBe(true);
    expect(handoff.blocksIndependent).toBe(true);
  });

  it("carries NO reward/points/grade/score/streak channel (only the reward-neutral FLAG)", () => {
    const keys = Object.keys(handoff);
    expect(new Set(keys)).toEqual(
      new Set([
        "kidId",
        "date",
        "priors",
        "passionBlockRewardNeutral",
        "blocksIndependent",
      ]),
    );
    // no back-channel field beyond the literal reward-neutral flag
    const forbidden = keys
      .filter((k) => k !== "passionBlockRewardNeutral")
      .filter((k) => /reward|point|streak|grade|score/i.test(k));
    expect(forbidden).toEqual([]);
  });
});
