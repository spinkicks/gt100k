// Headless CI test for the studio's pure wiring (no jsdom). The served DOM + live window.__qa are
// verified by LOOP_QA; here we pin the deterministic seed + the QA state the harness reads.
import { describe, expect, it } from "vitest";
import { hasPerseverance } from "@gt100k/project-workspace";
import { seedProjects } from "../app/seed.js";
import { buildQaState } from "../app/studio-state.js";

describe("studio seed", () => {
  it("seeds three projects: two planner briefs + one self-authored", () => {
    const projects = seedProjects();
    expect(projects).toHaveLength(3);
    expect(projects[0]!.source).toBe("planner");
    expect(projects[1]!.source).toBe("planner");
    expect(projects[2]!.source).toBe("self");
    expect(projects[0]!.title).toBe("Build a Mini Arcade Game");
  });

  it("is deterministic: identical seeds build byte-identical projects", () => {
    expect(seedProjects()).toEqual(seedProjects());
  });

  it("the arcade project records the perseverance chain (stuck → revision → artifact)", () => {
    const arcade = seedProjects()[0]!;
    expect(arcade.events).toHaveLength(7);
    expect(hasPerseverance(arcade)).toBe(true);
  });
});

describe("buildQaState", () => {
  it("exposes projectId/eventCount/kinds/hasPerseverance and no score field", () => {
    const arcade = seedProjects()[0]!;
    const s = buildQaState(arcade);
    expect(s.projectId).toBe(arcade.id);
    expect(s.eventCount).toBe(7);
    expect(s.hasPerseverance).toBe(true);
    expect(s.kinds).toContain("outcome");
    for (const key of Object.keys(s)) {
      expect(key.toLowerCase()).not.toContain("score");
      expect(key.toLowerCase()).not.toContain("grade");
    }
  });

  it("handles no open project safely", () => {
    expect(buildQaState(undefined)).toEqual({
      projectId: null,
      eventCount: 0,
      kinds: [],
      hasPerseverance: false,
    });
  });
});
