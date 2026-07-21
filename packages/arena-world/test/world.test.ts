import { FIXTURE, buildQuestWorld } from "@gt100k/arena-world";
import { describe, expect, it } from "vitest";

describe("buildQuestWorld", () => {
  it("derives the canonical edges and stable regions from node declarations", () => {
    const world = buildQuestWorld({
      nodes: FIXTURE.nodes,
      edges: [],
      regions: [],
    });

    expect(world.edges).toEqual([
      { from: "count-cove", to: "add-atoll" },
      { from: "add-atoll", to: "place-value-point" },
      { from: "observe-overlook", to: "measure-mesa" },
      { from: "add-atoll", to: "measure-mesa" },
      { from: "phoneme-falls", to: "blend-bay" },
      { from: "letter-landing", to: "sentence-summit" },
      { from: "blend-bay", to: "sentence-summit" },
    ]);
    expect(world.regions).toEqual([
      "numbers-coast",
      "tinker-bluffs",
      "story-vale",
      "wordwind-reach",
    ]);
  });

  it("rejects a cycle in the prerequisite graph", () => {
    const cyclicGraph = {
      ...FIXTURE,
      nodes: FIXTURE.nodes.map((node) =>
        node.id === "count-cove" ? { ...node, prerequisites: ["place-value-point"] } : node,
      ),
    };

    expect(() => buildQuestWorld(cyclicGraph)).toThrow(/cycle/i);
  });

  it("rejects a dangling prerequisite", () => {
    const danglingGraph = {
      ...FIXTURE,
      nodes: FIXTURE.nodes.map((node) =>
        node.id === "add-atoll" ? { ...node, prerequisites: ["missing-node"] } : node,
      ),
    };

    expect(() => buildQuestWorld(danglingGraph)).toThrow(/dangling/i);
  });
});
