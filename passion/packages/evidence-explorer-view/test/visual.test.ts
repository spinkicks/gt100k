import {
  EDGE_THREADS,
  NODE_BODIES,
  NODE_GLYPHS,
  resolveNodeBody,
  resolveNodeColorRole,
  resolveNodeGlyph,
} from "@gt100k/evidence-explorer-view";
import { describe, expect, it } from "vitest";

const NODE_TYPES = [
  "Artifact",
  "Attempt",
  "Transformation",
  "Claim",
  "Assistance",
  "Review",
  "Contribution",
  "Outcome",
] as const;

const EDGE_TYPES = [
  "derived_from",
  "authored_by",
  "used_tool",
  "validates",
  "contradicts",
  "released_as",
] as const;

/** Golden visual language (§U8.12, exact). */
describe("visual language", () => {
  it("NODE_BODIES are exact; Assistance comet carries declaredTag", () => {
    expect(NODE_BODIES.Artifact).toEqual({ id: "world" });
    expect(NODE_BODIES.Attempt).toEqual({ id: "moon" });
    expect(NODE_BODIES.Transformation).toEqual({ id: "blueprint" });
    expect(NODE_BODIES.Claim).toEqual({ id: "beacon" });
    expect(NODE_BODIES.Assistance).toEqual({ id: "comet", declaredTag: true });
    expect(NODE_BODIES.Review).toEqual({ id: "gold-star" });
    expect(NODE_BODIES.Contribution).toEqual({ id: "crystal" });
    expect(NODE_BODIES.Outcome).toEqual({ id: "seal-sun" });
  });

  it("NODE_GLYPHS are exact", () => {
    expect(NODE_GLYPHS).toEqual({
      Artifact: "diamond",
      Attempt: "play",
      Transformation: "blueprint",
      Claim: "quote",
      Assistance: "spark",
      Review: "scale",
      Contribution: "hex",
      Outcome: "seal",
    });
  });

  it("EDGE_THREADS are exact with routed labels", () => {
    expect(EDGE_THREADS.derived_from).toEqual({
      threadStyle: "solid",
      cap: "plain",
      flow: true,
      label: "derived from",
    });
    expect(EDGE_THREADS.authored_by).toEqual({
      threadStyle: "dotted",
      cap: "plain",
      flow: false,
      label: "authored by",
    });
    expect(EDGE_THREADS.used_tool).toEqual({
      threadStyle: "dashed-fine",
      cap: "plain",
      flow: false,
      label: "used tool",
    });
    expect(EDGE_THREADS.validates).toEqual({
      threadStyle: "solid",
      cap: "check",
      flow: true,
      label: "validates",
    });
    expect(EDGE_THREADS.contradicts).toEqual({
      threadStyle: "frayed",
      cap: "slash",
      flow: false,
      label: "contradicts",
    });
    expect(EDGE_THREADS.released_as).toEqual({
      threadStyle: "solid",
      cap: "arrow",
      flow: true,
      label: "released as",
    });
  });

  it("every node type → distinct body + glyph + color role", () => {
    const bodies = NODE_TYPES.map((t) => resolveNodeBody(t).id);
    const glyphs = NODE_TYPES.map((t) => resolveNodeGlyph(t));
    const roles = NODE_TYPES.map((t) => resolveNodeColorRole(t));
    expect(new Set(bodies).size).toBe(8);
    expect(new Set(glyphs).size).toBe(8);
    expect(new Set(roles).size).toBe(8);
  });

  it("every edge type → distinct thread label", () => {
    const labels = EDGE_TYPES.map((t) => EDGE_THREADS[t].label);
    expect(new Set(labels).size).toBe(6);
  });
});
