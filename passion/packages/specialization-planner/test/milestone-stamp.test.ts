/**
 * The planner stamps `milestoneId` from `PlanDeps` and never from the generator's response.
 *
 * This is a safety property, not a convenience. The milestone id is what attaches a child's work to
 * a rung of a mastery map, and from there to their standing on it. If a model could put one in its
 * own response, it could attach work to a rung nobody selected, and the standing would be reporting
 * the model's opinion rather than the caller's decision.
 */
import { describe, expect, it } from "vitest";

import { CURATED_LIBRARY } from "../src/__fixtures__/curated.js";
import { INPUTS_S2 } from "../src/__fixtures__/inputs.js";
import type { BriefContext, ProjectBrief, ProjectBriefGenerator } from "../src/model.js";
import { planSpecialization } from "../src/plan.js";
import { buildStubBrief } from "../src/stub-generator.js";

const NOW = "2026-07-26T00:00:00.000Z";

/** A generator that returns a valid brief, optionally claiming a milestone id of its own. */
const generatorClaiming = (claim?: string): ProjectBriefGenerator => ({
  generate: (ctx: BriefContext): Promise<ProjectBrief> =>
    Promise.resolve(
      claim === undefined
        ? buildStubBrief(ctx)
        : ({ ...buildStubBrief(ctx), milestoneId: claim } as ProjectBrief),
    ),
});

describe("the planner stamps milestoneId from deps", () => {
  it("carries the caller's milestone onto the brief", async () => {
    const plan = await planSpecialization(
      INPUTS_S2,
      { generator: generatorClaiming(), resources: CURATED_LIBRARY, milestoneId: "pf-first-piece" },
      NOW,
    );
    expect(plan.nextProject.milestoneId).toBe("pf-first-piece");
  });

  it("leaves it absent when the caller selected no milestone", async () => {
    const plan = await planSpecialization(INPUTS_S2, { generator: generatorClaiming() }, NOW);
    expect(plan.nextProject.milestoneId).toBeUndefined();
  });

  /** The one that matters. */
  it("DISCARDS a milestone id the generator put in its own response", async () => {
    const plan = await planSpecialization(
      INPUTS_S2,
      { generator: generatorClaiming("model-invented-rung") },
      NOW,
    );
    expect(plan.nextProject.milestoneId).toBeUndefined();
  });

  it("overwrites a generator's claim with the caller's, never merging the two", async () => {
    const plan = await planSpecialization(
      INPUTS_S2,
      { generator: generatorClaiming("model-invented-rung"), milestoneId: "pf-steady-pulse" },
      NOW,
    );
    expect(plan.nextProject.milestoneId).toBe("pf-steady-pulse");
  });

  it("changes nothing else about the brief", async () => {
    const plain = await planSpecialization(INPUTS_S2, { generator: generatorClaiming() }, NOW);
    const stamped = await planSpecialization(
      INPUTS_S2,
      { generator: generatorClaiming(), milestoneId: "pf-first-piece" },
      NOW,
    );
    const { milestoneId: _a, ...restPlain } = plain.nextProject;
    const { milestoneId: _b, ...restStamped } = stamped.nextProject;
    expect(restStamped).toEqual(restPlain);
  });
});
