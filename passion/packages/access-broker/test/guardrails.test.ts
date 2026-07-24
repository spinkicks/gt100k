import { describe, it, expect } from "vitest";
import { brokerAccess, type BrokerPlan } from "../src/broker.js";
import { proposeMatch, approve } from "../src/lifecycle.js";
import { stubCatalog, SEED_CATALOG } from "../src/catalog.js";
import type { Brokerage, Opportunity, SpecializationPlan } from "../src/model.js";
import { PLAN_S1, PLAN_S3 } from "../src/__fixtures__/plans.js";
import { okWellbeing } from "../src/__fixtures__/wellbeing.js";

const NOW = "2026-07-24T00:00:00.000Z";
const deps = { catalog: stubCatalog };
const runPlan = (plan: SpecializationPlan, ageBand: "6-8" | "9-11" | "12-14"): BrokerPlan =>
  brokerAccess({ plan, wellbeing: okWellbeing(plan.kidId, plan.cellKey), ageBand, existing: [] }, deps, NOW);

// ── SC-7: no gamification key anywhere ─────────────────────────────────────────────────────────
const FORBIDDEN = /score|rank|streak|points|xp|badge|leaderboard|win|lose/i;

function assertNoForbiddenKeys(obj: unknown, path = "root"): void {
  if (obj === null || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => assertNoForbiddenKeys(v, `${path}[${i}]`));
    return;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    expect(FORBIDDEN.test(k), `${path}.${k} matches the forbidden gamification pattern`).toBe(false);
    assertNoForbiddenKeys(v, `${path}.${k}`);
  }
}

describe("guardrails (SC-7): no gamification, guide-only, family-not-judge", () => {
  it("no key matches /score|rank|streak|points|xp|badge|leaderboard|win|lose/i on any runtime object", () => {
    // the whole seed catalog
    for (const o of SEED_CATALOG) assertNoForbiddenKeys(o);
    // a full BrokerPlan (matches + fit + reasons)
    assertNoForbiddenKeys(runPlan(PLAN_S3, "9-11"));
    // a fully-advanced Brokerage
    const b = approve(
      proposeMatch(runPlan(PLAN_S3, "9-11").mentorMatches[0]!, { kidId: PLAN_S3.kidId, cellKey: PLAN_S3.cellKey }, NOW),
      { guardianConsent: true, guideId: "guide-1" },
      NOW,
    );
    assertNoForbiddenKeys(b);
  });

  it("no child-facing field: Brokerage records the GUIDE (approvedBy), never a child id", () => {
    const b = approve(
      proposeMatch(runPlan(PLAN_S3, "9-11").mentorMatches[0]!, { kidId: PLAN_S3.kidId, cellKey: PLAN_S3.cellKey }, NOW),
      { guardianConsent: true, guideId: "guide-1" },
      NOW,
    );
    expect(b.approvedBy).toBe("guide-1");
    // the only child reference is the opaque kidId (the routing key), no child-facing surface field.
    const keys = Object.keys(b);
    expect(keys).not.toContain("childFacing");
    expect(keys.some((k) => /child/i.test(k) && k !== "kidId")).toBe(false);
  });

  it("family-as-amplifier: a FAMILY-sourced mentor still gates on the guide (no family-owned path)", () => {
    const s1 = runPlan(PLAN_S1, "6-8");
    const fam = s1.mentorMatches.find((m) => m.opportunity.sourceLayer === "FAMILY");
    expect(fam).toBeDefined();
    const proposed = proposeMatch(fam!, { kidId: PLAN_S1.kidId, cellKey: PLAN_S1.cellKey }, NOW);
    // it surfaces (relational door-opener) but cannot leave `approved` without the guide + consent.
    expect(() => approve(proposed, { guardianConsent: false, guideId: "guide-1" }, NOW)).toThrow(
      "CONSENT_REQUIRED",
    );
    const approved = approve(proposed, { guardianConsent: true, guideId: "guide-1" }, NOW);
    expect(approved.approvedBy).toBe("guide-1"); // the GUIDE, never the family member
  });

  it("only vetted opportunities can ever be surfaced (synthetic G4 stand-in)", () => {
    const all: Opportunity[] = [
      ...runPlan(PLAN_S3, "9-11").mentorMatches.map((m) => m.opportunity),
      ...runPlan(PLAN_S3, "9-11").audienceMatches.map((m) => m.opportunity),
    ];
    for (const o of all) expect(o.vetting).toBe("vetted");
  });

  it("the engine never emits a Brokerage state past proposed/held (offline, deterministic)", () => {
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
    const bp = brokerAccess(
      { plan: PLAN_S3, wellbeing: okWellbeing(PLAN_S3.kidId, PLAN_S3.cellKey), ageBand: "9-11", existing },
      deps,
      NOW,
    );
    for (const b of bp.brokerages) expect(["matched", "proposed", "held"]).toContain(b.state);
  });
});
