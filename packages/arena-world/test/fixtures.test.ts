import { describe, expect, it } from "vitest";
import { CATALOG } from "../src/catalog.fixture";
import { FIXTURE } from "../src/graph.fixture";
import { TIERS } from "../src/tiers.fixture";

describe("arena-world golden fixtures", () => {
  it("defines the exact synthetic 9-node, 4-region DAG", () => {
    expect(FIXTURE).toEqual({
      nodes: [
        {
          id: "count-cove",
          title: "Counting",
          sections: ["math"],
          prerequisites: [],
          region: "numbers-coast",
          landmark: "Counting Lighthouse",
          transferCritical: false,
        },
        {
          id: "add-atoll",
          title: "Addition",
          sections: ["math"],
          prerequisites: ["count-cove"],
          region: "numbers-coast",
          landmark: "Abacus Jetty",
          transferCritical: false,
        },
        {
          id: "place-value-point",
          title: "Place Value",
          sections: ["math"],
          prerequisites: ["add-atoll"],
          region: "numbers-coast",
          landmark: "Tide-Pool Terraces",
          transferCritical: true,
        },
        {
          id: "observe-overlook",
          title: "Observation",
          sections: ["science"],
          prerequisites: [],
          region: "tinker-bluffs",
          landmark: "Gear Overlook",
          transferCritical: false,
        },
        {
          id: "measure-mesa",
          title: "Measurement",
          sections: ["science", "math"],
          prerequisites: ["observe-overlook", "add-atoll"],
          region: "tinker-bluffs",
          landmark: "Gadget Workshop",
          transferCritical: true,
        },
        {
          id: "phoneme-falls",
          title: "Phonemes",
          sections: ["reading"],
          prerequisites: [],
          region: "story-vale",
          landmark: "Whispering Falls",
          transferCritical: false,
        },
        {
          id: "blend-bay",
          title: "Blending",
          sections: ["reading"],
          prerequisites: ["phoneme-falls"],
          region: "story-vale",
          landmark: "Book-Root Forest",
          transferCritical: false,
        },
        {
          id: "letter-landing",
          title: "Letters",
          sections: ["language"],
          prerequisites: [],
          region: "wordwind-reach",
          landmark: "Letter Landing Field",
          transferCritical: false,
        },
        {
          id: "sentence-summit",
          title: "Sentences",
          sections: ["language", "reading"],
          prerequisites: ["letter-landing", "blend-bay"],
          region: "wordwind-reach",
          landmark: "The Spelling Spires",
          transferCritical: true,
        },
      ],
      edges: [
        { from: "count-cove", to: "add-atoll" },
        { from: "add-atoll", to: "place-value-point" },
        { from: "observe-overlook", to: "measure-mesa" },
        { from: "add-atoll", to: "measure-mesa" },
        { from: "phoneme-falls", to: "blend-bay" },
        { from: "letter-landing", to: "sentence-summit" },
        { from: "blend-bay", to: "sentence-summit" },
      ],
      regions: ["numbers-coast", "tinker-bluffs", "story-vale", "wordwind-reach"],
    });

    const nodeIds = new Set(FIXTURE.nodes.map(({ id }) => id));
    expect(nodeIds.size).toBe(FIXTURE.nodes.length);
    expect(FIXTURE.nodes.every(({ landmark }) => landmark.length > 0)).toBe(true);
    expect(
      FIXTURE.nodes.every(({ prerequisites }) =>
        prerequisites.every((prerequisite) => nodeIds.has(prerequisite)),
      ),
    ).toBe(true);

    const visited = new Set<string>();
    const visiting = new Set<string>();
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;

      expect(visiting.has(nodeId)).toBe(false);
      visiting.add(nodeId);

      const node = FIXTURE.nodes.find(({ id }) => id === nodeId);
      expect(node).toBeDefined();
      for (const prerequisite of node?.prerequisites ?? []) visit(prerequisite);

      visiting.delete(nodeId);
      visited.add(nodeId);
    };

    for (const node of FIXTURE.nodes) visit(node.id);
    expect(visited.size).toBe(FIXTURE.nodes.length);
  });

  it("defines the exact gain-based tier thresholds", () => {
    expect(TIERS).toEqual([
      { index: 0, label: "Spark", minReward: 0 },
      { index: 1, label: "Kindling", minReward: 100 },
      { index: 2, label: "Steady Flame", minReward: 250 },
      { index: 3, label: "Bright Ember", minReward: 500 },
      { index: 4, label: "Beacon", minReward: 900 },
      { index: 5, label: "Lighthouse", minReward: 1500 },
    ]);
  });

  it("defines the exact deterministic, zero-power cosmetic catalog", () => {
    expect(CATALOG).toEqual([
      {
        id: "avatar-hat-explorer",
        kind: "avatar-item",
        eligibility: { type: "min-tier", tierIndex: 1 },
        look: "soft tan felt explorer's cap",
        equipEffect: "tilts slightly on walk (reduced motion: static tilt)",
      },
      {
        id: "avatar-cape-aurora",
        kind: "avatar-item",
        eligibility: { type: "min-tier", tierIndex: 3 },
        look: "teal-to-plum aurora-gradient cape",
        equipEffect: "trails on run (reduced motion: static cape, no trail)",
      },
      {
        id: "avatar-badge-firstlight",
        kind: "avatar-item",
        eligibility: { type: "min-unlocks", count: 1 },
        look: "small gold first-light star pin",
        equipEffect: "glints (emissive) on idle (reduced motion: static pin)",
      },
      {
        id: "world-theme-dawn",
        kind: "world-theme",
        eligibility: { type: "min-unlocks", count: 3 },
        look: "rosier dawn sky and softer light",
        equipEffect:
          "recolors sky/sea and shifts the lighting rig on equip (reduced motion: instant recolor)",
      },
      {
        id: "world-theme-dusk",
        kind: "world-theme",
        eligibility: { type: "min-tier", tierIndex: 4 },
        look: "deep-indigo dusk with brighter lanterns and stars",
        equipEffect:
          "indigo ambient, beacons more prominent, and star cards twinkle (reduced motion: static stars, indigo rig)",
      },
      {
        id: "base-banner-unity",
        kind: "base-theme",
        eligibility: { type: "region-complete", region: "numbers-coast" },
        look: "co-signed cohort unity banner",
        equipEffect: "shows contributor marks (reduced motion: static banner)",
      },
      {
        id: "base-lantern-warm",
        kind: "base-theme",
        eligibility: { type: "min-tier", tierIndex: 2 },
        look: "warm lantern strings around camp",
        equipEffect: "gentle sway (reduced motion: static strings)",
      },
      {
        id: "celebration-bloom",
        kind: "celebration-effect",
        eligibility: { type: "min-unlocks", count: 1 },
        look: "unlock burst as flower-petal bloom",
        equipEffect: "changes particle shape (reduced motion: static petal badge)",
      },
      {
        id: "celebration-aurora",
        kind: "celebration-effect",
        eligibility: { type: "min-tier", tierIndex: 5 },
        look: "unlock burst as aurora ribbons with sky shimmer",
        equipEffect: "rarest sky one-shot (reduced motion: static ribbon badge)",
      },
    ]);

    for (const cosmetic of CATALOG) {
      expect(Object.keys(cosmetic).sort()).toEqual([
        "eligibility",
        "equipEffect",
        "id",
        "kind",
        "look",
      ]);
    }
  });
});
