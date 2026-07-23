/**
 * Headless test for the guide-console Plan view-model (018-D1 SC-12 groundwork). The served DOM +
 * live `window.__qa` are verified by LOOP_QA; here we pin the pure wiring: certified spikes produce
 * deterministic, grounded, guide-facing plans with the stub brief — no network, no child-facing score.
 */
import { describe, expect, it } from "vitest";
import { plansForKid, planReviewCount } from "../app/plan.js";

const DULCE = "kid-synthetic-004"; // has an ACTIVE (game-dev) + a CANDIDATE (production) spike
const ARI = "kid-synthetic-001"; // EMERGING + EXPLORING only → nothing certified to plan

describe("guide-console Plan view-model (018-D1)", () => {
  it("plans the selected child's CERTIFIED spikes (ACTIVE + CANDIDATE)", () => {
    const plans = plansForKid(DULCE);
    expect(plans.length).toBeGreaterThan(0);
    for (const c of plans) {
      expect(["ACTIVE", "CANDIDATE"]).toContain(c.state);
      expect(c.plan.nextProject.childOwnsChoice).toBe(true); // always an offer, never an assignment
      expect(c.plan.nextProject.source).toBe("stub"); // deterministic, offline
      expect(c.plan.restCadence.daysOffPerWeek).toBeGreaterThanOrEqual(1); // rest mandatory
      expect(c.plan.dpDose).toBeLessThan(0.6); // DP capped below investment load
    }
  });

  it("grounds the production plan's craft scaffold on the vetted A6 curated library", () => {
    const plans = plansForKid(DULCE);
    const prod = plans.find((c) => c.cellKey === "music-sound/production::build");
    expect(prod).toBeDefined();
    expect(prod!.resources.length).toBeGreaterThan(0);
    expect(prod!.plan.nextProject.craftScaffold).toContain("https://curated.example");
  });

  it("carries no child-facing score/grade/reward field anywhere on a plan card", () => {
    const plans = plansForKid(DULCE);
    for (const c of plans) {
      for (const key of Object.keys(c.plan)) {
        expect(key.toLowerCase()).not.toContain("score");
        expect(key.toLowerCase()).not.toContain("grade");
      }
      for (const key of Object.keys(c.plan.nextProject)) {
        expect(key.toLowerCase()).not.toContain("score");
        expect(key.toLowerCase()).not.toContain("reward");
      }
    }
  });

  it("a child with no certified spike gets an empty (but rendered) plan list", () => {
    expect(plansForKid(ARI)).toEqual([]);
    expect(planReviewCount(ARI)).toBe(0);
  });
});
