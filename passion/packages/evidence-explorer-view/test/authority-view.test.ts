import { buildExplorerView, buildFixtureGraph } from "@gt100k/evidence-explorer-view";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { describe, expect, it } from "vitest";

/**
 * Human-authority + cited-assistance derivation, never accusatory (§U8.14 / SC-E09). Every final
 * grade is human-owned with a named owner; a `model` actor is cited/neutral (the Assistance comet
 * carries a persistent "Declared" tag). No node/actor exposes an accusation field.
 */
describe("authority view derivation", () => {
  const bundle = buildFixtureGraph(new NodeCryptoHasher());
  const view = buildExplorerView(bundle.graph, bundle);

  it("grades the Outcome human-owned with a named owner", () => {
    const grade = view.nodes.find((n) => n.type === "Outcome");
    expect(grade).toBeDefined();
    expect(grade?.isHumanOwned).toBe(true);
    expect(grade?.actor.kind).toBe("human");
    expect(grade?.actor.tone).toBe("human");
    expect(grade?.actor.ref.length).toBeGreaterThan(0);
    expect(grade?.actor.label.length).toBeGreaterThan(0);
    // The grade is never model-authored.
    expect(grade?.isCitedAssistance).toBe(false);
  });

  it("marks a model actor as cited/neutral — the comet carries a Declared tag, never blame", () => {
    const assist = view.nodes.filter((n) => n.type === "Assistance");
    expect(assist.length).toBeGreaterThan(0);
    for (const a of assist) {
      expect(a.actor.kind).toBe("model");
      expect(a.actor.tone).toBe("model");
      expect(a.isCitedAssistance).toBe(true);
      expect(a.isHumanOwned).toBe(false);
      // Persistent "declared AI assistance — cited" tag (§U8.12).
      expect(a.body).toEqual({ id: "comet", declaredTag: true });
    }
  });

  it("no node, actor chip, or edge exposes an accusatory field", () => {
    const serialized = JSON.stringify(view);
    expect(/accus/i.test(serialized)).toBe(false);
    expect(/blame/i.test(serialized)).toBe(false);
    for (const n of view.nodes) {
      expect("accusation" in n).toBe(false);
      expect("accusation" in n.actor).toBe(false);
    }
  });

  it("a model actor is never the owner of a human-owned outcome", () => {
    const humanOwned = view.nodes.filter((n) => n.isHumanOwned);
    expect(humanOwned.length).toBeGreaterThan(0);
    for (const n of humanOwned) {
      expect(n.actor.kind).toBe("human");
    }
  });
});
