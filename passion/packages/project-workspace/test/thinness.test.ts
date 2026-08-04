/**
 * Reading how much work stands behind an artefact.
 *
 * Most of these are about what the function REFUSES to conclude. It is one step away from being a
 * cheating detector, and the repository refuses those on the evidence, so the tests hold the line
 * between "the record is thin" (a fact about the log) and "the child did not do the work" (a claim
 * about a person that no count can support).
 */
import { describe, expect, it } from "vitest";

import { EFFORT_EXPECTED, hasThinArtifact, thinnessOf } from "../src/thinness.js";
import type { Project, WorkEvent } from "../src/model.js";

let seq = 0;
const ev = (kind: WorkEvent["kind"], extra: Partial<WorkEvent> = {}): WorkEvent => ({
  id: `e${++seq}`,
  kind,
  at: "2026-08-04T10:00:00.000Z",
  text: "…",
  ...extra,
});

const project = (events: readonly WorkEvent[]): Project => ({
  id: "p1",
  kidId: "kid-1",
  title: "A thing",
  drivingQuestion: "?",
  authenticMethod: "…",
  audience: "SELF",
  source: "self",
  ageBand: "9-11",
  createdAt: "2026-08-04T09:00:00.000Z",
  events,
});

describe("what stands behind an artefact", () => {
  it("counts attempts and revisions logged before it", () => {
    const t = thinnessOf(project([ev("attempt"), ev("revision"), ev("artifact")]));
    expect(t).toHaveLength(1);
    expect(t[0]?.effortBefore).toBe(2);
    expect(t[0]?.thin).toBe(false);
  });

  it("counts an outcome only when something actually broke", () => {
    // An outcome that went fine records a result, not a struggle. `stuck` is the perseverance seed
    // the model names, and it is the half worth counting.
    const fine = thinnessOf(project([ev("outcome"), ev("outcome"), ev("artifact")]));
    expect(fine[0]?.effortBefore).toBe(0);
    const broke = thinnessOf(
      project([ev("outcome", { stuck: true }), ev("attempt"), ev("artifact")]),
    );
    expect(broke[0]?.effortBefore).toBe(2);
    expect(broke[0]?.everStuck).toBe(true);
  });

  it("calls an artefact with nothing behind it thin", () => {
    const t = thinnessOf(project([ev("session"), ev("artifact")]));
    expect(t[0]?.thin).toBe(true);
    expect(t[0]?.effortBefore).toBe(0);
  });

  it("counts only what came before, so a later attempt does not retroactively thicken it", () => {
    // Append-only order is the truth. Work logged after the artefact appeared did not go into it.
    const t = thinnessOf(project([ev("artifact"), ev("attempt"), ev("attempt")]));
    expect(t[0]?.thin).toBe(true);
  });

  it("reads each artefact against everything before it, not just since the last one", () => {
    const t = thinnessOf(project([ev("attempt"), ev("attempt"), ev("artifact"), ev("artifact")]));
    expect(t).toHaveLength(2);
    expect(t[1]?.thin).toBe(false); // the earlier work still stands behind the second artefact
  });

  it("finds nothing to ask about in a project with no artefact yet", () => {
    expect(thinnessOf(project([ev("session"), ev("attempt")]))).toEqual([]);
    expect(hasThinArtifact(project([ev("session")]))).toBe(false);
  });
});

describe("declared AI help", () => {
  it("is recorded", () => {
    const t = thinnessOf(project([ev("ai_help"), ev("attempt"), ev("attempt"), ev("artifact")]));
    expect(t[0]?.declaredAiHelp).toBe(true);
  });

  it("does not count as effort", () => {
    const t = thinnessOf(project([ev("ai_help"), ev("ai_help"), ev("artifact")]));
    expect(t[0]?.effortBefore).toBe(0);
    expect(t[0]?.thin).toBe(true);
  });

  it("does not make an otherwise solid record thin", () => {
    // THE IMPORTANT ONE. Declaring a model is honesty we are asking for, and a child who declares it
    // and then iterates is doing exactly the right thing. If using the declaration against them
    // changed the outcome here, the incentive would be to stop declaring.
    const withAi = thinnessOf(
      project([ev("ai_help"), ev("attempt"), ev("revision"), ev("artifact")]),
    );
    const withoutAi = thinnessOf(project([ev("attempt"), ev("revision"), ev("artifact")]));
    expect(withAi[0]?.thin).toBe(withoutAi[0]?.thin);
    expect(withAi[0]?.thin).toBe(false);
  });
});

describe("what it refuses to say", () => {
  it("never states a conclusion about the child", () => {
    // The sentence describes the RECORD. A guide who reads it as an accusation has been misled by
    // us, so the words that would do that are banned outright.
    for (const events of [
      [ev("artifact")],
      [ev("attempt"), ev("artifact")],
      [ev("ai_help"), ev("artifact")],
      [ev("attempt"), ev("revision"), ev("outcome", { stuck: true }), ev("artifact")],
    ]) {
      const t = thinnessOf(project(events));
      for (const r of t) {
        expect(r.says).not.toMatch(
          /\b(cheat|cheated|copied|plagiar|dishonest|faked|lied|suspicious)/i,
        );
        expect(r.says).not.toMatch(/\bthe child (did not|didn't|has not|hasn't)\b/i);
      }
    }
  });

  it("offers the innocent reading when there is nothing behind the artefact", () => {
    // A thin log genuinely means "short task, or worked off the record" as often as anything else,
    // and the sentence a guide reads has to carry that.
    const t = thinnessOf(project([ev("artifact")]));
    expect(t[0]?.says).toMatch(/quick|off the record/i);
  });

  it("produces no score, rating or percentage anywhere", () => {
    // Same rule the motivation package holds to: prose can be argued about, a number can only be a
    // score, and the moment one exists a UI renders it as a dial.
    const t = thinnessOf(project([ev("attempt"), ev("artifact")]));
    const text = JSON.stringify(t);
    expect(text).not.toMatch(/\d+\s*%/);
    expect(text).not.toMatch(/\b(score|rating|grade|confidence)\b/i);
  });
});

describe("the threshold", () => {
  it("is exposed, because the right value is an empirical question nobody has answered", () => {
    expect(EFFORT_EXPECTED).toBeGreaterThan(0);
  });

  it("is the boundary it says it is", () => {
    const at = Array.from({ length: EFFORT_EXPECTED }, () => ev("attempt"));
    const below = Array.from({ length: EFFORT_EXPECTED - 1 }, () => ev("attempt"));
    expect(thinnessOf(project([...at, ev("artifact")]))[0]?.thin).toBe(false);
    expect(thinnessOf(project([...below, ev("artifact")]))[0]?.thin).toBe(true);
  });
});
