// The §4.3 mapping, asserted at the PLAN level — one node per event, the mandated edges, and the
// backward-only ref rule. The graph-level golden (closed-taxonomy validity, edge-target resolution,
// `assertHumanAuthority`) lives in `@gt100k/project-evidence-sink`, which is the side that can build a
// graph. Splitting them this way means a mapping bug is caught here, in the package that owns the
// mapping, rather than surfacing one package downstream as a malformed graph.
import { describe, expect, it } from "vitest";

import { makeFixtureProject } from "../src/__fixtures__/project.js";
import type { PlanRef } from "../src/plan.js";
import { toEvidencePlan } from "../src/plan.js";
import { logEvent, startProject } from "../src/project.js";

/** The plan-local handle an edge end points at, for terse assertions. */
const refKey = (ref: PlanRef): string =>
  ref.kind === "event" ? `event:${ref.eventId}` : `literal:${ref.ref}`;

describe("toEvidencePlan (§4.3 closed-taxonomy mapping)", () => {
  it("plans exactly one node per work-event, in journey order", () => {
    const project = makeFixtureProject();
    const plan = toEvidencePlan(project);

    expect(plan.nodes).toHaveLength(project.events.length);
    expect(plan.nodes.map((node) => node.eventId)).toEqual(project.events.map((event) => event.id));
  });

  it("gives each of the ten kinds its mandated node type", () => {
    const plan = toEvidencePlan(makeFixtureProject());
    const typeByKind = new Map(plan.nodes.map((node) => [node.payload.kind, node.type]));

    expect(Object.fromEntries(typeByKind)).toEqual({
      session: "Contribution",
      attempt: "Attempt",
      outcome: "Outcome",
      revision: "Transformation",
      artifact: "Artifact",
      decision: "Claim",
      reflection: "Claim",
      ai_help: "Assistance",
      milestone: "Outcome",
      showcase: "Review",
    });
  });

  it("points authored_by at an actor.ref and used_tool at a tool.name, as literals not node handles", () => {
    // These two edge targets were never node ids. Planning them as `event` refs would make the adapter
    // resolve them to digests and produce edges the graph cannot verify.
    const plan = toEvidencePlan(makeFixtureProject());

    for (const edge of plan.edges) {
      if (edge.type === "authored_by") {
        expect(edge.to.kind).toBe("literal");
        expect(refKey(edge.to)).toMatch(/^literal:(child|model|system):/);
      }
      if (edge.type === "used_tool") {
        expect(edge.to.kind).toBe("literal");
        expect(refKey(edge.to)).toBe("literal:studybot");
      }
      // Every other edge end is a node handle.
      if (edge.type === "derived_from" || edge.type === "released_as") {
        expect(edge.from.kind === "event" || edge.to.kind === "event").toBe(true);
      }
    }
  });

  it("resolves refs BACKWARD only — a forward or unknown ref is dropped", () => {
    // The load-bearing rule: an event cannot derive from work that had not happened yet. If this
    // regressed, provenance would claim lineage that never existed.
    let project = startProject(
      {
        selfAuthored: {
          kidId: "kid-ada",
          ageBand: "9-11",
          title: "Ref ordering",
          drivingQuestion: "does order hold?",
          authenticMethod: "Testing.",
          audience: "SELF",
        },
      },
      "2026-03-01T00:00:00.000Z",
    );
    project = logEvent(
      project,
      {
        kind: "attempt",
        at: "2026-03-01T01:00:00.000Z",
        text: "first try",
        refs: ["does-not-exist"],
      },
      "2026-03-01T01:00:00.000Z",
    );
    const attemptId = project.events[project.events.length - 1]?.id ?? "";
    project = logEvent(
      project,
      {
        kind: "outcome",
        at: "2026-03-01T02:00:00.000Z",
        text: "it worked",
        stuck: false,
        refs: [attemptId],
      },
      "2026-03-01T02:00:00.000Z",
    );

    const plan = toEvidencePlan(project);
    const attempt = plan.nodes.find((node) => node.eventId === attemptId);
    const outcome = plan.nodes.find((node) => node.payload.kind === "outcome");

    // The unknown ref was dropped rather than carried.
    expect(attempt?.inputEventIds).toEqual([]);
    // The backward ref to the attempt was kept.
    expect(outcome?.inputEventIds).toEqual([attemptId]);
    // ...and it earned both the derived_from and the validates edge (not stuck ⇒ validates).
    const outcomeEdges = plan.edges.filter(
      (edge) => edge.from.kind === "event" && edge.from.eventId === outcome?.eventId,
    );
    expect(outcomeEdges.map((edge) => edge.type).sort()).toEqual(["derived_from", "validates"]);
  });

  it("marks a stuck outcome as CONTRADICTING its attempt, and a working one as validating (§4.2)", () => {
    // The fixture is the perseverance chain: attempt → outcome{stuck} → revision → artifact. So the
    // `contradicts` edge is the one that must be present here — a stuck outcome disagrees with the
    // attempt it came from, and that disagreement is the evidence of iteration, not a failure mark.
    const plan = toEvidencePlan(makeFixtureProject());
    const stuckOutcome = plan.nodes.find(
      (node) => node.payload.kind === "outcome" && node.payload.stuck === true,
    );
    expect(stuckOutcome).toBeDefined();

    const fromStuck = plan.edges.filter(
      (edge) => edge.from.kind === "event" && edge.from.eventId === stuckOutcome?.eventId,
    );
    expect(fromStuck.map((edge) => edge.type).sort()).toEqual(["contradicts", "derived_from"]);
    // And never both relations for the same outcome — it is one or the other.
    expect(fromStuck.map((edge) => edge.type)).not.toContain("validates");
  });

  it("points both showcase edges INTO the showcase, so the graph stays a DAG", () => {
    const plan = toEvidencePlan(makeFixtureProject());
    const showcase = plan.nodes.find((node) => node.payload.kind === "showcase");
    expect(showcase).toBeDefined();

    const into = plan.edges.filter(
      (edge) => edge.to.kind === "event" && edge.to.eventId === showcase?.eventId,
    );
    expect(into.map((edge) => edge.type).sort()).toEqual(["released_as", "validates"]);
  });
});
