// SC-5 / SC-6 / SC-4 guardrail invariants ON THE MATERIALIZED GRAPH.
//
// These moved here from `@gt100k/project-workspace` when the mapping and the materialization were
// split across the product boundary: they assert things about a built `EvidenceGraph`, and building one
// is now this adapter's job. Their model-level counterparts (no forbidden key on `Project`/`WorkEvent`,
// the type-level guards) stayed behind with the model, and the plan-level ones live next to the plan.
//
// GRADE THE PROCESS, NOT THE POLISH: this file exists so no future change can quietly slip a
// score/grade/streak/points/badge/rank/reward field into the graph, quietly penalize declared AI help,
// or introduce a clock/random/network dependency into materialization.
import { makeFixtureProject, startProject, toEvidencePlan } from "@gt100k/project-workspace";
import { describe, expect, it, vi } from "vitest";

import { graphEvidenceSink, materialize, stubEvidenceSink, stubHasher } from "../src/index.js";

// The forbidden gamification vocabulary. Anything matching this in a KEY anywhere in the evidence
// graph means "grade the polish" crept back in ([D3] / SC-5). `win`/`lose` are bounded so legitimate
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

const graphOf = (project = makeFixtureProject()) =>
  materialize(toEvidencePlan(project), stubHasher);

describe("guardrails — no gamification in the graph (SC-5)", () => {
  it("carries NO gamification key anywhere in the materialized graph", () => {
    for (const key of collectKeys(graphOf())) {
      expect(key, `forbidden gamification key in the evidence graph: "${key}"`).not.toMatch(
        GAMIFICATION,
      );
    }
  });
});

describe("guardrails — declared AI help is NEUTRAL (SC-6)", () => {
  it("maps ai_help to an Assistance/model node with used_tool and no penalty markers", () => {
    const graph = graphOf();
    const assistance = Object.values(graph.nodes).filter((node) => node.payload.kind === "ai_help");
    expect(assistance).toHaveLength(1);
    const node = assistance[0];
    expect(node).toBeDefined();
    if (node === undefined) {
      return;
    }

    // Neutral by construction: an Assistance node authored by a model, wired via `used_tool`.
    expect(node.type).toBe("Assistance");
    expect(node.actor.kind).toBe("model");
    expect(node.tool?.name).toBe("studybot");
    const usedTool = graph.edges.filter(
      (edge) => edge.type === "used_tool" && edge.from === node.id,
    );
    expect(usedTool).toHaveLength(1);

    // Nothing about the assistance is negative/penalized/deducted — declaring help is never a cost.
    expect(JSON.stringify(node)).not.toMatch(/penal|negativ|deduct|demerit|cheat|disallow/i);
    // ...and (belt + braces) it is not itself an Outcome/Review that could imply a verdict on the kid.
    expect(node.type).not.toBe("Outcome");
    expect(node.type).not.toBe("Review");
  });
});

describe("guardrails — deterministic + offline (SC-4)", () => {
  it("derives ids from content only: identical project → byte-identical graph", () => {
    const first = graphOf();
    expect(graphOf()).toEqual(first);
    // The stub SINK is the same content-only materialization.
    expect(stubEvidenceSink.record(makeFixtureProject())).toEqual(first);
    // A self-authored project built twice is also stable (no clock/random in id derivation).
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
    expect(graphOf(self())).toEqual(graphOf(self()));
  });

  it("touches no network and no wall clock during materialization", () => {
    const fetchSpy = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    const randomSpy = vi.spyOn(Math, "random");
    const priorFetch = (globalThis as { fetch?: unknown }).fetch;
    (globalThis as { fetch?: unknown }).fetch = fetchSpy;
    try {
      const project = makeFixtureProject();
      materialize(toEvidencePlan(project), stubHasher);
      stubEvidenceSink.record(project);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(dateNowSpy).not.toHaveBeenCalled();
      expect(randomSpy).not.toHaveBeenCalled();
    } finally {
      (globalThis as { fetch?: unknown }).fetch = priorFetch;
      dateNowSpy.mockRestore();
      randomSpy.mockRestore();
    }
  });

  it("produces stable hex ids for the same bytes (content-addressed, no leakage)", () => {
    const bytes = new TextEncoder().encode("bridge-v2");
    expect(stubHasher.hash(bytes)).toBe(stubHasher.hash(bytes));
    expect(stubHasher.hash(bytes)).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("the stub sink is not the fail-safe sink", () => {
  it("keeps a malformed-kind event that graphEvidenceSink drops", () => {
    // Worth pinning because it is NOT obvious: `addNode` performs no node-type validation, so an
    // unknown entry kind does not throw anywhere. It maps to `type: undefined`, canonicalizes with
    // that field simply absent, and produces a typeless node — silently.
    //
    // Which means `graphEvidenceSink`'s `hasKnownKind` pre-filter is load-bearing, not belt-and-braces:
    // it is the ONLY thing standing between a bad kind and a typeless node in the graph. The stub has
    // no pre-filter, on purpose — a test double should not quietly repair a fixture that is wrong.
    const project = makeFixtureProject();
    const broken = {
      ...project,
      events: [...project.events, { ...project.events[0], id: "evt_bad", kind: "not-a-kind" }],
    } as typeof project;

    const viaStub = stubEvidenceSink.record(broken);
    const viaFailSafe = graphEvidenceSink(stubHasher).record(broken);

    expect(Object.keys(viaStub.nodes)).toHaveLength(project.events.length + 1);
    expect(Object.keys(viaFailSafe.nodes)).toHaveLength(project.events.length);
    // The fail-safe path is byte-identical to the clean project: the bad event left no trace.
    expect(viaFailSafe).toEqual(graphOf());
  });
});
