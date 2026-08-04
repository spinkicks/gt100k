// SC-7: a synthetic 014 profile whose log shows early voluntary depth → declining voluntary return +
// compliance-without-depth derives `devaluation:true` + `returnTrend:"declining"`, and feeding those
// signals to `assessWellbeing` returns BURNOUT_TIP.
import { describe, expect, it } from "vitest";
import { assessWellbeing } from "../src/assess.js";
import { deriveWellbeingSignals } from "../src/derive.js";
import {
  buildDevaluationProfile,
  DEVAL_CATALOG,
  DEVAL_CELL_KEY,
  DEVAL_KID,
  DEVAL_NOW,
} from "../src/__fixtures__/devaluation-profile.js";

describe("deriveWellbeingSignals (SC-7)", () => {
  const profile = buildDevaluationProfile();
  const signals = deriveWellbeingSignals(profile, DEVAL_CELL_KEY, DEVAL_NOW, DEVAL_CATALOG);

  it("derives the devaluation pattern from the 014 interaction log", () => {
    expect(signals.kidId).toBe(DEVAL_KID);
    expect(signals.cellKey).toBe(DEVAL_CELL_KEY);
    expect(signals.returnTrend).toBe("declining");
    expect(signals.depthTrend).toBe("declining");
    expect(signals.devaluation).toBe(true);
    expect(signals.stretchSeeking).toBe(false);
    // This fixture logs no judged work, so there is no rate to have. Never fabricated.
    expect(signals.successRate).toBeUndefined();
    expect(signals.exhaustion).toBeUndefined();
    expect(signals.obsessiveTip).toBeUndefined();
    expect(signals.stakesEvent).toBeUndefined();
  });

  it("feeding the derived signals to the engine → BURNOUT_TIP (rest + escalate)", () => {
    const read = assessWellbeing(signals);
    expect(read.state).toBe("BURNOUT_TIP");
    expect(read.challenge).toBe("HOLD");
    expect(read.pressure).toBe("AUTONOMY_UP");
    expect(read.rest).toBe(true);
    expect(read.escalateToHuman).toBe(true);
  });

  it("an unknown cellKey / empty catalog derives the safe default (stable, no devaluation → IN_ZONE)", () => {
    const none = deriveWellbeingSignals(profile, "no/such::cell", DEVAL_NOW, DEVAL_CATALOG);
    expect(none.returnTrend).toBe("stable");
    expect(none.depthTrend).toBe("stable");
    expect(none.devaluation).toBe(false);
    expect(assessWellbeing(none).state).toBe("IN_ZONE");

    // No catalog → interactions can't be resolved to cells → safe default, never a fabricated PUSH.
    const noCatalog = deriveWellbeingSignals(profile, DEVAL_CELL_KEY, DEVAL_NOW);
    expect(noCatalog.returnTrend).toBe("stable");
    expect(assessWellbeing(noCatalog).challenge).not.toBe("PUSH");
  });
});

describe("successRate", () => {
  // A cell whose artifacts the child met and got judged on. `tries` is what a surface reports when
  // it can tell a right answer from a wrong one; most surfaces cannot, and say nothing.
  const KID = "kid-sr";
  const NOW = "2026-08-04T12:00:00.000Z";
  const ART = "chess-tactics";
  const CATALOG = new Map([
    [
      ART,
      {
        id: ART,
        domainPath: ["games-strategy", "chess"] as const,
        affordedModes: ["SOLVE"] as const,
        kind: "game" as const,
        source: "curated" as const,
        origin: "seed" as const,
        tagConfidence: 1,
        tagStatus: "confirmed" as const,
      },
    ],
  ]);
  const CELL = "games-strategy/chess::SOLVE";

  const solve = (tries: number, dayOffset: number) => ({
    kidId: KID,
    artifactId: ART,
    actionType: "solve-tactic",
    timestamp: new Date(Date.parse(NOW) - dayOffset * 86_400_000).toISOString(),
    prompted: false,
    sessionId: `s${dayOffset}`,
    tries,
  });

  const profileOf = (interactions: readonly ReturnType<typeof solve>[]) =>
    ({ kidId: KID, interactions, surfaced: [] }) as never;

  it("is solves over tries", () => {
    // Four solves taking two tries each: half the attempts worked.
    const p = profileOf([solve(2, 1), solve(2, 2), solve(2, 3), solve(2, 4)]);
    const s = deriveWellbeingSignals(p, CELL, NOW, CATALOG as never);
    expect(s.successRate).toBeCloseTo(0.5, 5);
  });

  it("reads high when the child barely misses, which is what under-challenged looks like", () => {
    const p = profileOf([solve(1, 1), solve(1, 2), solve(1, 3), solve(1, 4)]);
    expect(deriveWellbeingSignals(p, CELL, NOW, CATALOG as never).successRate).toBe(1);
  });

  it("stays undefined below the floor, so one bad afternoon cannot pull difficulty down", () => {
    // The engine turns a low rate into SCAFFOLD. Two puzzles is not a success rate, and an absent
    // one is the safe answer: the engine reads it as "no reason to back off".
    const p = profileOf([solve(9, 1), solve(9, 2)]);
    expect(deriveWellbeingSignals(p, CELL, NOW, CATALOG as never).successRate).toBeUndefined();
  });

  it("ignores work from a different cell", () => {
    const p = profileOf([solve(1, 1), solve(1, 2), solve(1, 3), solve(1, 4)]);
    const other = deriveWellbeingSignals(
      p,
      "music-sound/instruments::BUILD",
      NOW,
      CATALOG as never,
    );
    expect(other.successRate).toBeUndefined();
  });

  it("ignores an artifact the catalog does not know", () => {
    // Unresolvable means unattributable. Counting it would put another cell's failures on this one.
    const p = profileOf([solve(1, 1), solve(1, 2), solve(1, 3), solve(1, 4)]);
    expect(deriveWellbeingSignals(p, CELL, NOW, new Map() as never).successRate).toBeUndefined();
  });

  it("ignores work older than the trend window", () => {
    const p = profileOf([solve(1, 60), solve(1, 61), solve(1, 62), solve(1, 63)]);
    expect(deriveWellbeingSignals(p, CELL, NOW, CATALOG as never).successRate).toBeUndefined();
  });
});
