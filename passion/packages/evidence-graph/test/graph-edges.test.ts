import { describe, expect, it } from "vitest";

import { addEdge } from "../src/graph.js";
import { EDGE_TYPES, type EvidenceGraph, type EvidenceNode } from "../src/model.js";

function node(id: string): EvidenceNode {
  return {
    id,
    type: "Artifact",
    actor: { kind: "human", ref: `actor-${id}` },
    tool: { name: `tool-${id}`, version: "1.0.0" },
    inputs: [],
    timestamp: "2026-01-01T00:00:00.000Z",
    consentScope: { scope: "synthetic" },
    payload: { id },
  };
}

function graphWithNodes(...ids: string[]): EvidenceGraph {
  return {
    nodes: Object.fromEntries(ids.map((id) => [id, node(id)])),
    edges: [],
  };
}

function isAcyclic(graph: EvidenceGraph): boolean {
  const incoming = new Map(Object.keys(graph.nodes).map((id) => [id, 0]));
  const outgoing = new Map(Object.keys(graph.nodes).map((id) => [id, [] as string[]]));

  for (const edge of graph.edges) {
    if (!(edge.to in graph.nodes)) {
      continue;
    }
    outgoing.get(edge.from)?.push(edge.to);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }

  const ready = [...incoming].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;

  while (ready.length > 0) {
    const current = ready.pop();
    if (current === undefined) {
      break;
    }
    visited += 1;
    for (const target of outgoing.get(current) ?? []) {
      const nextCount = (incoming.get(target) ?? 0) - 1;
      incoming.set(target, nextCount);
      if (nextCount === 0) {
        ready.push(target);
      }
    }
  }

  return visited === Object.keys(graph.nodes).length;
}

describe("addEdge", () => {
  it.each(EDGE_TYPES)("accepts the %s edge type between existing nodes", (type) => {
    const graph = graphWithNodes("a", "b");
    const edge = { type, from: "a", to: "b" } as const;

    const result = addEdge(graph, edge);

    expect(result.edges).toEqual([edge]);
    expect(result).not.toBe(graph);
    expect(result.nodes).toBe(graph.nodes);
    expect(graph.edges).toEqual([]);
  });

  it("accepts actor and tool refs already declared by graph nodes", () => {
    const graph = graphWithNodes("a");

    const withActor = addEdge(graph, {
      type: "authored_by",
      from: "a",
      to: "actor-a",
    });
    const withTool = addEdge(withActor, {
      type: "used_tool",
      from: "a",
      to: "tool-a",
    });

    expect(withTool.edges).toHaveLength(2);
    expect(isAcyclic(withTool)).toBe(true);
  });

  it("rejects missing source and target endpoints without changing the graph", () => {
    const graph = graphWithNodes("a");

    expect(() => addEdge(graph, { type: "derived_from", from: "missing", to: "a" })).toThrow(
      /DANGLING_REF/,
    );
    expect(() => addEdge(graph, { type: "derived_from", from: "a", to: "missing" })).toThrow(
      /DANGLING_REF/,
    );
    expect(graph.edges).toEqual([]);
  });

  it("rejects a self-edge as a cycle", () => {
    const graph = graphWithNodes("a");

    expect(() => addEdge(graph, { type: "validates", from: "a", to: "a" })).toThrow(/CYCLE/);
    expect(graph.edges).toEqual([]);
  });

  it("rejects an edge that closes a transitive cycle", () => {
    const first = addEdge(graphWithNodes("a", "b", "c"), {
      type: "derived_from",
      from: "a",
      to: "b",
    });
    const second = addEdge(first, { type: "derived_from", from: "b", to: "c" });
    const before = structuredClone(second);

    expect(() => addEdge(second, { type: "derived_from", from: "c", to: "a" })).toThrow(/CYCLE/);
    expect(second).toEqual(before);
    expect(isAcyclic(second)).toBe(true);
  });

  it("keeps the graph acyclic across deterministic fuzzed inserts", () => {
    const nodeIds = Array.from({ length: 20 }, (_, index) => `n-${index}`);
    let graph = graphWithNodes(...nodeIds);
    let state = 0x5eed1234;

    for (let attempt = 0; attempt < 300; attempt += 1) {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      const from = nodeIds[state % nodeIds.length]!;
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      const to = nodeIds[state % nodeIds.length]!;
      const type = EDGE_TYPES[attempt % EDGE_TYPES.length]!;

      try {
        graph = addEdge(graph, { type, from, to });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toMatch(/CYCLE/);
      }

      expect(isAcyclic(graph)).toBe(true);
    }
  });
});
