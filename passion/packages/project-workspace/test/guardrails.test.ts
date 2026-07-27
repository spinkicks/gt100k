// SC-5 / SC-6 / SC-4 guardrail invariants — the NON-NEGOTIABLE product rules, as executable tests.
// GRADE THE PROCESS, NOT THE POLISH: this file exists so that no future change can quietly slip a
// score/grade/streak/points/badge/rank/reward field onto a `Project`, a `WorkEvent`, or the evidence
// PLAN, or introduce a clock/random/network dependency into the deterministic mapping.
//
// SCOPE: the model and the plan. The counterparts that assert on a materialized `EvidenceGraph` live in
// `@gt100k/project-evidence-sink`, because building a graph is that adapter's job now — this package
// deliberately cannot (see `src/plan.ts` for why). Both halves must hold; neither is sufficient alone.
import { describe, expect, it, vi } from "vitest";

import { makeFixtureProject } from "../src/__fixtures__/project.js";
import type { Project, WorkEvent } from "../src/model.js";
import { toEvidencePlan } from "../src/plan.js";
import { startProject } from "../src/project.js";

// The forbidden gamification vocabulary. Anything matching this in a KEY anywhere in the model or the
// plan means "grade the polish" crept back in ([D3] / SC-5). `win`/`lose` are bounded so legitimate
// words (`winner`, …) can't appear as keys — but no key should match regardless.
const GAMIFICATION = /score|grade|streak|points|xp|badge|rank|leaderboard|reward|\bwin\b|\blose\b/i;

/** Recursively collect EVERY object key reachable from a value (arrays + nested objects included). */
function collectKeys(value: unknown, into: Set<string> = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeys(item, into);
    }
    return into;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      into.add(key);
      collectKeys(child, into);
    }
  }
  return into;
}

// Compile-time proof (type level): the model types expose NONE of the forbidden field names. If a
// gamification field were ever added to `Project`/`WorkEvent`, `Extract` would surface it and this
// assignment would stop type-checking — the loop gate (`tsc -b`) would go red.
type ForbiddenField =
  | "score"
  | "grade"
  | "streak"
  | "points"
  | "xp"
  | "badge"
  | "rank"
  | "leaderboard"
  | "reward";
type HasNoForbiddenField<T> = Extract<keyof T, ForbiddenField> extends never ? true : false;
const _projectClean: HasNoForbiddenField<Project> = true;
const _workEventClean: HasNoForbiddenField<WorkEvent> = true;

describe("guardrails — no gamification (SC-5)", () => {
  it("carries NO score/grade/streak/points/badge/rank/reward key on Project or its WorkEvents", () => {
    const project = makeFixtureProject();
    // The project exercises all 10 kinds, so this scan covers every event-shape key too.
    for (const key of collectKeys(project)) {
      expect(key, `forbidden gamification key on the model: "${key}"`).not.toMatch(GAMIFICATION);
    }
  });

  it("carries NO gamification key anywhere in the toEvidencePlan output", () => {
    // The graph-level counterpart is in the sink adapter. Scanning the plan too means a forbidden key
    // is caught at the point the mapping introduces it, not one package downstream.
    for (const key of collectKeys(toEvidencePlan(makeFixtureProject()))) {
      expect(key, `forbidden gamification key in the evidence plan: "${key}"`).not.toMatch(
        GAMIFICATION,
      );
    }
  });

  it("keeps the type-level guards satisfied (compile-time)", () => {
    // These are `true` only if the model types expose no forbidden field; the values pin it.
    expect(_projectClean).toBe(true);
    expect(_workEventClean).toBe(true);
  });
});

describe("guardrails — declared AI help is NEUTRAL in the plan (SC-6)", () => {
  it("plans ai_help as an Assistance/model node with a used_tool edge and no penalty markers", () => {
    const plan = toEvidencePlan(makeFixtureProject());
    const assistance = plan.nodes.filter((node) => node.payload.kind === "ai_help");
    expect(assistance).toHaveLength(1);
    const node = assistance[0];
    expect(node).toBeDefined();
    if (node === undefined) {
      return;
    }

    expect(node.type).toBe("Assistance");
    expect(node.actor.kind).toBe("model");
    expect(node.tool?.name).toBe("studybot");
    expect(
      plan.edges.filter(
        (edge) =>
          edge.type === "used_tool" &&
          edge.from.kind === "event" &&
          edge.from.eventId === node.eventId,
      ),
    ).toHaveLength(1);

    // Declaring help is never a cost, and it is never itself a verdict on the kid.
    expect(JSON.stringify(node)).not.toMatch(/penal|negativ|deduct|demerit|cheat|disallow/i);
    expect(node.type).not.toBe("Outcome");
    expect(node.type).not.toBe("Review");
  });
});

describe("guardrails — deterministic + offline (SC-4)", () => {
  it("is pure over the project: identical project → identical plan", () => {
    expect(toEvidencePlan(makeFixtureProject())).toEqual(toEvidencePlan(makeFixtureProject()));

    // A self-authored project planned twice is also stable (no clock/random anywhere in the mapping).
    const self = () =>
      startProject(
        {
          selfAuthored: {
            kidId: "kid-lu",
            ageBand: "12-14",
            title: "My own thing",
            drivingQuestion: "what if?",
            authenticMethod: "Tinkering and testing.",
            audience: "SELF",
          },
        },
        "2026-02-02T00:00:00.000Z",
      );
    expect(toEvidencePlan(self())).toEqual(toEvidencePlan(self()));
  });

  it("touches no network and no wall clock while planning", () => {
    const fetchSpy = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    const randomSpy = vi.spyOn(Math, "random");
    const priorFetch = (globalThis as { fetch?: unknown }).fetch;
    (globalThis as { fetch?: unknown }).fetch = fetchSpy;
    try {
      toEvidencePlan(makeFixtureProject());
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(dateNowSpy).not.toHaveBeenCalled();
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      (globalThis as { fetch?: unknown }).fetch = priorFetch;
      dateNowSpy.mockRestore();
      randomSpy.mockRestore();
    }
  });
});

describe("guardrails — the product boundary (evidencegraph-v1-design.md §13a)", () => {
  it("does not hash anything: no content-addressed id is derivable from a plan alone", () => {
    // The plan is pure data with no ids in it. This is the structural reason this package cannot
    // accidentally regrow a dependency on the graph: it has nothing to hash with.
    const plan = toEvidencePlan(makeFixtureProject());
    const keys = collectKeys(plan);
    expect(keys.has("id")).toBe(false);
    expect(keys.has("nodes")).toBe(true);
    // Node handles are event ids, which the child's journey already owns — not digests.
    expect(plan.nodes.every((node) => node.eventId.length > 0)).toBe(true);
  });
});
