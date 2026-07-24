// SC-5 / SC-6 / SC-4 guardrail invariants — the NON-NEGOTIABLE product rules, as executable tests.
// GRADE THE PROCESS, NOT THE POLISH: this file exists so that no future change can quietly slip a
// score/grade/streak/points/badge/rank/reward field onto a `Project`, a `WorkEvent`, or the evidence
// graph, quietly penalize declared AI help, or introduce a clock/random/network dependency into the
// deterministic fold. No new source — pure invariant scans over the real model + `toEvidence` output.
import { describe, expect, it, vi } from "vitest";

import { makeFixtureProject } from "../src/__fixtures__/project.js";
import type { Project, WorkEvent } from "../src/model.js";
import { startProject } from "../src/project.js";
import { stubEvidenceSink, stubHasher } from "../src/sink.js";
import { toEvidence } from "../src/to-evidence.js";

// The forbidden gamification vocabulary. Anything matching this in a KEY anywhere in the model or the
// evidence graph means "grade the polish" crept back in ([D3] / SC-5). `win`/`lose` are bounded so
// legitimate words (`winner`, …) can't appear as keys — but no key should match regardless.
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

  it("carries NO gamification key anywhere in the toEvidence output graph", () => {
    const graph = toEvidence(makeFixtureProject(), stubHasher);
    for (const key of collectKeys(graph)) {
      expect(key, `forbidden gamification key in the evidence graph: "${key}"`).not.toMatch(
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

describe("guardrails — declared AI help is NEUTRAL (SC-6)", () => {
  it("maps ai_help to an Assistance/model node with used_tool and no penalty markers", () => {
    const graph = toEvidence(makeFixtureProject(), stubHasher);
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
    const first = toEvidence(makeFixtureProject(), stubHasher);
    const second = toEvidence(makeFixtureProject(), stubHasher);
    expect(second).toEqual(first);
    // The stub SINK is the same content-only fold.
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
    expect(toEvidence(self(), stubHasher)).toEqual(toEvidence(self(), stubHasher));
  });

  it("touches no network and no wall clock during the fold", () => {
    const fetchSpy = vi.fn();
    const dateNowSpy = vi.spyOn(Date, "now");
    const randomSpy = vi.spyOn(Math, "random");
    const priorFetch = (globalThis as { fetch?: unknown }).fetch;
    (globalThis as { fetch?: unknown }).fetch = fetchSpy;
    try {
      const project = makeFixtureProject();
      toEvidence(project, stubHasher);
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
