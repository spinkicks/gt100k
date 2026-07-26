import { describe, it, expect } from "vitest";
import { deriveBrokerInputs } from "../src/derive.js";
import { brokerAccess } from "../src/broker.js";
import { stubCatalog } from "../src/catalog.js";
import type { Brokerage } from "../src/model.js";
import { PLAN_S3 } from "../src/__fixtures__/plans.js";
import { okWellbeing, restWellbeing } from "../src/__fixtures__/wellbeing.js";

const NOW = "2026-07-24T00:00:00.000Z";

describe("deriveBrokerInputs (Task 5)", () => {
  it("bundles plan + wellbeing + ageBand and defaults existing to []", () => {
    const wb = okWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey);
    const inputs = deriveBrokerInputs(PLAN_S3, wb, "9-11");
    expect(inputs).toEqual({ plan: PLAN_S3, wellbeing: wb, ageBand: "9-11", existing: [] });
  });

  it("passes existing brokerages through", () => {
    const existing: Brokerage[] = [
      {
        id: "b1",
        kidId: PLAN_S3.kidId,
        spikeCell: { cellKey: PLAN_S3.cellKey },
        opportunityId: "mn-thin-expert",
        kind: "mentor",
        state: "proposed",
        createdAt: NOW,
        updatedAt: NOW,
      },
    ];
    const inputs = deriveBrokerInputs(
      PLAN_S3,
      okWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey),
      "9-11",
      existing,
    );
    expect(inputs.existing).toBe(existing);
  });

  it("feeds straight into brokerAccess (ok read ⇒ matches; rest read ⇒ held)", () => {
    const ok = brokerAccess(
      deriveBrokerInputs(PLAN_S3, okWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey), "9-11"),
      { catalog: stubCatalog },
      NOW,
    );
    expect(ok.held).toBe(false);
    expect(ok.mentorMatches.length).toBeGreaterThan(0);

    const held = brokerAccess(
      deriveBrokerInputs(PLAN_S3, restWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey), "9-11"),
      { catalog: stubCatalog },
      NOW,
    );
    expect(held.held).toBe(true);
    expect(held.mentorMatches).toEqual([]);
  });
});
