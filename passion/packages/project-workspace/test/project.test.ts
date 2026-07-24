import { describe, expect, it } from "vitest";

import type { ProjectBrief } from "../src/index.js";
import { hasPerseverance, logEvent, startProject } from "../src/index.js";

// A deterministic D1-brief-shaped fixture (reuses the planner's ProjectBrief type verbatim).
const BRIEF: ProjectBrief = {
  title: "Backyard Bird Census",
  drivingQuestion: "Which birds actually visit my street, and when?",
  authenticMethod: "Field ornithology: timed point-counts logged like a real bird survey",
  audience: "REAL_COMMUNITY",
  childOwnsChoice: true,
  craftScaffold: "How to identify 10 local birds by sight + sound; how to keep a tally sheet",
  successLooksLike: "A month of counts shared with the local birding group, with what surprised you",
  source: "stub",
};

const NOW = "2026-07-23T09:00:00.000Z";

describe("startProject (spec §4.1, SC-1)", () => {
  it("seeds from a D1 brief: carries question/method/audience/craftScaffold, source planner, blank journey", () => {
    const project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);

    expect(project.title).toBe(BRIEF.title);
    expect(project.drivingQuestion).toBe(BRIEF.drivingQuestion);
    expect(project.authenticMethod).toBe(BRIEF.authenticMethod);
    expect(project.audience).toBe("REAL_COMMUNITY");
    expect(project.craftScaffold).toBe(BRIEF.craftScaffold);
    expect(project.source).toBe("planner");
    expect(project.kidId).toBe("kid-1");
    expect(project.ageBand).toBe("9-11");
    expect(project.createdAt).toBe(NOW);
    expect(project.events).toEqual([]);
    expect(project.id).toMatch(/\S/);
  });

  it("self-authored: starts blank with source self and no craftScaffold — the child owns the idea", () => {
    const project = startProject(
      {
        selfAuthored: {
          kidId: "kid-2",
          ageBand: "12-14",
          title: "Homemade Hot Sauce Lab",
          drivingQuestion: "Can I ferment a hot sauce hotter than the store's?",
          authenticMethod: "Small-batch lacto-fermentation with a pH log",
          audience: "SELF",
        },
      },
      NOW,
    );

    expect(project.source).toBe("self");
    expect(project.craftScaffold).toBeUndefined();
    expect(project.title).toBe("Homemade Hot Sauce Lab");
    expect(project.audience).toBe("SELF");
    expect(project.ageBand).toBe("12-14");
    expect(project.events).toEqual([]);
  });

  it("derives a stable id from the same inputs (deterministic, no clock/random)", () => {
    const a = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    const b = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    expect(a.id).toBe(b.id);
  });
});

describe("logEvent (spec §4.1, SC-2)", () => {
  it("appends immutably with a derived id — the original project is untouched", () => {
    const project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    const next = logEvent(
      project,
      { kind: "session", at: "2026-07-23T10:00:00.000Z", text: "Set up my tally sheet" },
      "2026-07-23T10:00:00.000Z",
    );

    expect(project.events).toEqual([]); // original unchanged (append-only, immutable)
    expect(next.events).toHaveLength(1);
    const [event] = next.events;
    expect(event?.kind).toBe("session");
    expect(event?.text).toBe("Set up my tally sheet");
    expect(event?.id).toMatch(/\S/);
    expect(next.id).toBe(project.id); // same project, new snapshot
  });

  it("accepts all ten work-event kinds", () => {
    const kinds = [
      "session",
      "attempt",
      "outcome",
      "revision",
      "artifact",
      "decision",
      "reflection",
      "ai_help",
      "milestone",
      "showcase",
    ] as const;

    let project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    kinds.forEach((kind, i) => {
      project = logEvent(
        project,
        { kind, at: `2026-07-23T1${i}:00:00.000Z`, text: `entry ${kind}` },
        `2026-07-23T1${i}:00:00.000Z`,
      );
    });

    expect(project.events).toHaveLength(10);
    expect(project.events.map((e) => e.kind)).toEqual(kinds);
  });

  it("rejects an unknown kind (validates kind ∈ WORK_EVENT_KINDS)", () => {
    const project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    expect(() =>
      logEvent(
        project,
        // @ts-expect-error — not a valid WorkEventKind
        { kind: "score", at: NOW, text: "cheating" },
        NOW,
      ),
    ).toThrow();
  });

  it("assigns distinct ids to two events with identical content", () => {
    let project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    project = logEvent(project, { kind: "attempt", at: NOW, text: "same" }, NOW);
    project = logEvent(project, { kind: "attempt", at: NOW, text: "same" }, NOW);
    const [a, b] = project.events;
    expect(a?.id).not.toBe(b?.id);
  });
});

describe("hasPerseverance (spec §4.2, SC-2)", () => {
  it("detects iteration past a failure: stuck outcome → later revision/artifact that refs it", () => {
    let project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    project = logEvent(project, { kind: "attempt", at: NOW, text: "First count" }, NOW);
    const attemptId = project.events[0]!.id;
    project = logEvent(
      project,
      { kind: "outcome", at: NOW, text: "Rain washed out my count", stuck: true, refs: [attemptId] },
      NOW,
    );
    const stuckId = project.events[1]!.id;
    expect(hasPerseverance(project)).toBe(false); // stuck, but not yet iterated

    project = logEvent(
      project,
      { kind: "revision", at: NOW, text: "Made a rain-proof clipboard cover", refs: [stuckId] },
      NOW,
    );
    expect(hasPerseverance(project)).toBe(true);
  });

  it("a clean run with no stuck outcome is not perseverance", () => {
    let project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    project = logEvent(project, { kind: "attempt", at: NOW, text: "Counted birds" }, NOW);
    const attemptId = project.events[0]!.id;
    project = logEvent(
      project,
      { kind: "outcome", at: NOW, text: "It worked", refs: [attemptId] },
      NOW,
    );
    project = logEvent(
      project,
      { kind: "artifact", at: NOW, text: "My chart", refs: [attemptId] },
      NOW,
    );
    expect(hasPerseverance(project)).toBe(false);
  });

  it("a stuck outcome with no later iteration that refs it is not perseverance", () => {
    let project = startProject({ brief: BRIEF, kidId: "kid-1", ageBand: "9-11" }, NOW);
    project = logEvent(project, { kind: "outcome", at: NOW, text: "Broke", stuck: true }, NOW);
    const stuckId = project.events[0]!.id;
    // a later revision, but it refs something else — not the stuck outcome
    project = logEvent(project, { kind: "revision", at: NOW, text: "unrelated", refs: ["nope"] }, NOW);
    expect(hasPerseverance(project)).toBe(false);
    // and the ordering matters: a revision BEFORE the stuck outcome does not count
    void stuckId;
  });
});
