// HERMETIC parse test for the REAL `@gt100k/evidence-sink-graph` adapter (plan Task 5 / spec §4.4).
// Builds a synthetic project through the public `@gt100k/project-workspace` API, folds it through the
// real SHA-256 adapter, and asserts: (a) a schema-valid `EvidenceGraph` the E1 verifier accepts;
// (b) the adapter REUSES the domain `toEvidence` mapping, swapping ONLY the hasher; (c) FAIL-SAFE —
// a malformed event is skipped, the rest stays intact, and `record` NEVER throws. No network, no clock.
//
// This file is NEVER imported by a domain (`@gt100k/project-workspace`) test — the adapter is the only
// place that touches the teammate's evolving E1 `addNode`/`addEdge` API.
import {
  EDGE_TYPES,
  NODE_TYPES,
  assertHumanAuthority,
} from "@gt100k/evidence-graph";
import type { EdgeType, EvidenceGraph, NodeType } from "@gt100k/evidence-graph";
import { NodeCryptoHasher } from "@gt100k/evidence-hash-node";
import { logEvent, startProject, stubHasher, toEvidence } from "@gt100k/project-workspace";
import type { Project, ProjectBrief, WorkEvent } from "@gt100k/project-workspace";
import { describe, expect, it } from "vitest";

import { graphEvidenceSink } from "../src/index.js";

const BRIEF: ProjectBrief = {
  title: "The strongest paper bridge",
  drivingQuestion: "How can I build a paper bridge that holds the most books?",
  authenticMethod: "Structural engineering — build, load-test, and iterate on truss designs.",
  audience: "MENTOR_PEERS",
  childOwnsChoice: true,
  craftScaffold: "Try triangles; test to failure; measure how much weight each version holds.",
  successLooksLike: "A bridge that holds ten books without collapsing, and notes on why it works.",
  source: "stub",
};

/** Build a synthetic all-10-kinds project (incl. the §4.2 stuck→revision→artifact chain) — no clock. */
function makeProject(): Project {
  let project = startProject({ brief: BRIEF, kidId: "kid-ada", ageBand: "9-11" }, "2026-01-01T08:00:00.000Z");
  const last = (p: Project): string => {
    const e = p.events[p.events.length - 1];
    if (e === undefined) throw new Error("no event");
    return e.id;
  };

  project = logEvent(project, { kind: "session", at: "2026-01-01T09:00:00.000Z", text: "Opened my bridge project." }, "");
  project = logEvent(project, { kind: "decision", at: "2026-01-01T09:10:00.000Z", text: "I'll use a triangle truss." }, "");
  project = logEvent(project, { kind: "attempt", at: "2026-01-01T09:30:00.000Z", text: "Folded 20 beams, taped a deck." }, "");
  const attemptId = last(project);
  project = logEvent(
    project,
    { kind: "outcome", at: "2026-01-01T09:45:00.000Z", text: "It collapsed under one book. Stuck.", stuck: true, refs: [attemptId] },
    "",
  );
  const stuckId = last(project);
  project = logEvent(
    project,
    { kind: "ai_help", at: "2026-01-01T10:00:00.000Z", text: "A robot helped me learn triangles are stronger.", aiTool: { name: "studybot", version: "1.0.0" }, refs: [stuckId] },
    "",
  );
  project = logEvent(project, { kind: "revision", at: "2026-01-01T10:20:00.000Z", text: "Rebuilt with triangle bracing.", refs: [stuckId] }, "");
  const revisionId = last(project);
  project = logEvent(
    project,
    { kind: "artifact", at: "2026-01-01T10:50:00.000Z", text: "My braced bridge v2.", refs: [revisionId], artifact: { title: "Braced bridge v2", kind: "photo", ref: "local://v2.jpg" } },
    "",
  );
  const artifactId = last(project);
  project = logEvent(project, { kind: "reflection", at: "2026-01-01T11:00:00.000Z", text: "Triangles spread the weight." }, "");
  project = logEvent(project, { kind: "milestone", at: "2026-01-01T11:15:00.000Z", text: "It held ten books!", refs: [artifactId] }, "");
  project = logEvent(project, { kind: "showcase", at: "2026-01-01T11:30:00.000Z", text: "I showed the whole class.", refs: [artifactId] }, "");

  return project;
}

describe("graphEvidenceSink — real SHA-256 EvidenceSink over @gt100k/evidence-graph", () => {
  it("folds a well-formed project into a schema-valid graph the verifier accepts", () => {
    const project = makeProject();
    const graph = graphEvidenceSink().record(project);

    // One node per event — the 10-kind journey maps 1:1 onto the closed taxonomy.
    const nodes = Object.values(graph.nodes);
    expect(nodes).toHaveLength(project.events.length);
    expect(nodes).toHaveLength(10);

    // Every node type is a member of the CLOSED node taxonomy; every edge type is a valid edge type.
    const nodeTypes: readonly NodeType[] = NODE_TYPES;
    const edgeTypes: readonly EdgeType[] = EDGE_TYPES;
    for (const node of nodes) {
      expect(nodeTypes).toContain(node.type);
    }
    for (const edge of graph.edges) {
      expect(edgeTypes).toContain(edge.type);
    }

    // The §4.3 key edges are present: authorship, tool use, the stuck-outcome contradiction, derivation,
    // and the showcase release + validation.
    const presentEdgeTypes = new Set(graph.edges.map((e) => e.type));
    for (const expected of ["authored_by", "used_tool", "contradicts", "derived_from", "released_as", "validates"] as const) {
      expect(presentEdgeTypes).toContain(expected);
    }

    // The E1 constitutional verifier accepts the graph (no model-owned grade / prohibited model type).
    expect(assertHumanAuthority(graph)).toEqual({ ok: true, reasons: [] });

    // Real SHA-256 ids (64 lowercase hex) — proves the crypto hasher, not the stub's 16-hex digest.
    for (const id of Object.keys(graph.nodes)) {
      expect(id).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("defaults to the SHA-256 NodeCryptoHasher", () => {
    const project = makeProject();
    const withDefault = graphEvidenceSink().record(project);
    const withExplicit = graphEvidenceSink(new NodeCryptoHasher()).record(project);
    expect(withDefault).toEqual(withExplicit);
  });

  it("shares the domain toEvidence mapping, swapping only the hasher", () => {
    const project = makeProject();
    // Injecting the stub hasher must reproduce the domain mapping byte-for-byte — the adapter adds no
    // mapping of its own; it only substitutes the SHA-256 hasher for the stub.
    const viaAdapter = graphEvidenceSink(stubHasher).record(project);
    const viaDomain = toEvidence(project, stubHasher);
    expect(viaAdapter).toEqual(viaDomain);
  });

  it("is deterministic across two independent folds", () => {
    const a = graphEvidenceSink().record(makeProject());
    const b = graphEvidenceSink().record(makeProject());
    expect(a).toEqual(b);
  });

  describe("FAIL-SAFE — a malformed event is skipped, the rest intact, never throws", () => {
    const cleanGraph = (): EvidenceGraph => graphEvidenceSink().record(makeProject());

    /** Splice a foreign event into the middle of the journey (nothing else references it). */
    function withInjectedEvent(bad: WorkEvent): Project {
      const clean = makeProject();
      const events = [...clean.events];
      events.splice(3, 0, bad); // insert after the first three well-formed events
      return { ...clean, events };
    }

    it("drops an event with an unknown kind (pre-fold validation) — graph identical to the clean fold", () => {
      const bad = { id: "evt_bad_kind", kind: "explode" as WorkEvent["kind"], at: "2026-01-01T09:20:00.000Z", text: "not a real kind" };
      const project = withInjectedEvent(bad);

      let graph!: EvidenceGraph;
      expect(() => (graph = graphEvidenceSink().record(project))).not.toThrow();

      // The malformed event contributes no node; the ten well-formed events are untouched.
      expect(Object.keys(graph.nodes)).toHaveLength(10);
      expect(graph).toEqual(cleanGraph());
      expect(assertHumanAuthority(graph)).toEqual({ ok: true, reasons: [] });
    });

    it("skips an event that would throw inside the fold (toxic non-array refs) — never throws through", () => {
      // A structurally-valid-looking event whose `refs` is not an array would make the domain fold throw;
      // the adapter's per-event boundary catches it and skips the event rather than corrupting `record`.
      const toxic = {
        id: "evt_toxic_refs",
        kind: "reflection",
        at: "2026-01-01T09:25:00.000Z",
        text: "toxic refs",
        refs: "not-an-array",
      } as unknown as WorkEvent;
      const project = withInjectedEvent(toxic);

      let graph!: EvidenceGraph;
      expect(() => (graph = graphEvidenceSink().record(project))).not.toThrow();

      expect(Object.keys(graph.nodes)).toHaveLength(10);
      expect(graph).toEqual(cleanGraph());
    });
  });
});
