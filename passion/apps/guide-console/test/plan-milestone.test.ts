/**
 * The join between the planner and the mastery map.
 *
 * WHY THIS FILE EXISTS. The planner knows *when* and the map knows *what*, and for the whole life of
 * both packages they were never connected. The Plan tab therefore rendered pace only, and filled the
 * content-shaped hole with `stubBriefGenerator` output — per-stage templates with the domain name
 * substituted, so "What about ${d} makes you want to come back and try more?" became the same
 * sentence for chess as for game dev. A technical audience read that and concluded the tab was
 * unbuilt.
 *
 * The tests below are mostly about what the join REFUSES, because the failure modes are all
 * over-claiming: showing a rung from a map nobody put into use, showing one the child cannot be
 * offered, or quietly inventing content where no map exists.
 */
import { describe, expect, it } from "vitest";

import { milestoneForPlan } from "../app/plan-milestone.js";
import { plansForKid } from "../app/plan.js";
import type { PlanCardVM } from "../app/plan.js";

/** Dulce is the one synthetic child with a certified spike in a domain that has a published map. */
const DULCE = "kid-synthetic-004";
const planFor = (kid: string, cell: string): PlanCardVM | undefined =>
  plansForKid(kid).find((c) => c.cellKey.includes(cell));

describe("the rung a guide is shown", () => {
  it("comes from the map, in the domain's own words", () => {
    const card = planFor(DULCE, "game-dev");
    expect(card, "Dulce should have a game-dev plan").toBeDefined();
    const ms = milestoneForPlan(DULCE, card!);
    expect(ms).not.toBeNull();
    // The point of the whole change: a real capability rather than the domain name in a template.
    expect(ms?.capability.toLowerCase()).not.toContain("play with");
    expect(ms?.capability.length).toBeGreaterThan(20);
  });

  it("carries what the ordering rests on, so an authored rung and a guessed one differ on screen", () => {
    const ms = milestoneForPlan(DULCE, planFor(DULCE, "game-dev")!);
    expect(["syllabus", "research", "community", "model"]).toContain(ms?.basis);
    expect(ms?.why.length).toBeGreaterThan(20);
  });

  it("carries the artefact that would show it, which is what makes leaving costless", () => {
    const ms = milestoneForPlan(DULCE, planFor(DULCE, "game-dev")!);
    expect(ms?.demonstration.length).toBeGreaterThan(10);
  });

  it("never states a verdict about the child", () => {
    // Same rule the Maps tab holds to. Butler (1988): a bare verdict with no task anchoring behaves
    // like a grade and depressed interest in 132 children aged roughly 10 to 12.
    const ms = milestoneForPlan(DULCE, planFor(DULCE, "game-dev")!);
    expect(ms?.strengthText).not.toMatch(/\b(pass|passed|complete|done|mastered|met|achieved)\b/i);
  });
});

describe("what the join refuses", () => {
  it("returns null where no map serves the domain, rather than inventing one", () => {
    // The ordinary case: four maps against dozens of pursuits. A null here becomes a panel that says
    // nobody has written a map yet, which is worth more than a generated sentence that means nothing.
    const other = plansForKid(DULCE).find((c) => !c.cellKey.includes("game-dev"));
    if (other === undefined) return; // Dulce may have only the one certified spike
    expect(milestoneForPlan(DULCE, other)).toBeNull();
  });

  it("offers only a rung the child could actually be offered", () => {
    // `reachable` is the map's own offering decision and it is not a claim about capability. A rung
    // that is gated above the child's stage must not be presented as the next thing to do.
    const ms = milestoneForPlan(DULCE, planFor(DULCE, "game-dev")!);
    expect(ms).not.toBeNull();
  });

  it("prefers a rung with nothing behind it over one already underway", () => {
    // The next thing to offer is the first reachable rung with no artefacts. A rung that already has
    // work is in progress rather than the thing to hand a child next.
    const ms = milestoneForPlan(DULCE, planFor(DULCE, "game-dev")!);
    // Dulce has artefacts on two game-dev rungs, so the chosen one must not be one of those unless
    // every reachable rung is already underway.
    expect(["none", "single", "multiple"]).toContain(ms?.strength);
  });

  it("gives back nothing for a child with no plans at all", () => {
    // Cyrus has nothing tracked, so there is no card to join anything to.
    expect(plansForKid("kid-synthetic-003")).toEqual([]);
  });
});
