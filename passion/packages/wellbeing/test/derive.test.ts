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
    // Not-yet-instrumented proxies are left undefined (never fabricated).
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
