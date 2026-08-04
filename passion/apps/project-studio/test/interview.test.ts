/**
 * The one question asked mid-build.
 *
 * The tests are mostly about what the question is NOT allowed to be. This feature sits one small
 * step from an accusation, and the copy is a design constraint rather than decoration: a child is
 * never told they are suspected of anything, because a false positive teaches a child who did the
 * work that a machine thinks they cheated.
 */
import { describe, expect, it, vi } from "vitest";

import { answerEntry, askAbout, facetFor } from "../app/interview.js";
import type { Project, Thinness } from "@gt100k/project-workspace";

const project: Project = {
  id: "p1",
  kidId: "kid-1",
  title: "My Robot Buddy",
  drivingQuestion: "Can I draw a robot that looks friendly?",
  authenticMethod: "Draw a few, ask people which feels friendliest.",
  audience: "SELF",
  source: "self",
  ageBand: "9-11",
  createdAt: "2026-08-04T09:00:00.000Z",
  events: [],
};

const thin = (over: Partial<Thinness> = {}): Thinness => ({
  artifactId: "a1",
  effortBefore: 0,
  everStuck: false,
  declaredAiHelp: false,
  thin: true,
  says: "Nothing logged before this appeared.",
  ...over,
});

describe("which facet gets asked", () => {
  it("asks about the breaking when nothing ever broke", () => {
    // The sharpest question available. A child who obtained a finished thing has no story about
    // what went wrong, because there was no wrong.
    expect(facetFor(thin({ everStuck: false }))).toBe("challenge");
  });

  it("asks how it works when something did break", () => {
    // The struggle is already on the record, so the open question is whether they understood what
    // they were struggling with.
    expect(facetFor(thin({ everStuck: true }))).toBe("how");
  });
});

describe("the question itself", () => {
  it("works with no model, because the studio runs offline in CI and at a demo", async () => {
    const q = await askAbout(project, thin());
    expect(q.question.length).toBeGreaterThan(15);
    expect(q.artifactId).toBe("a1");
  });

  it("never accuses the child of anything", async () => {
    // THE LOAD-BEARING TEST. Every reachable question, checked against the words that would turn an
    // interruption into an allegation.
    for (const t of [
      thin(),
      thin({ everStuck: true }),
      thin({ declaredAiHelp: true }),
      thin({ effortBefore: 1 }),
    ]) {
      const q = await askAbout(project, t);
      expect(q.question).not.toMatch(
        /\b(cheat|copied|plagiar|prove|really you|actually you|did you write|your own work|suspicious|honest)\b/i,
      );
      // And never mentions why it appeared. The child is not shown the detector.
      expect(q.question).not.toMatch(/\b(logged|record|entries|attempts|thin)\b/i);
    }
  });

  it("uses the question the route returns", async () => {
    const seen: unknown[] = [];
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      seen.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ question: "What bit fought you hardest?" }));
    });
    const q = await askAbout(project, thin());
    expect(q.question).toBe("What bit fought you hardest?");
    // The route is told which facet to ask, so the choice stays here and is testable without a model.
    expect((seen[0] as { facet: string }).facet).toBe("challenge");
    vi.unstubAllGlobals();
  });

  it("sends the recent journey, so the question can be about today's work", async () => {
    // Without this the model only sees a title and asks something generic, which defeats the point
    // of asking mid-build rather than at the end.
    let body: { recent?: string[] } = {};
    vi.stubGlobal("fetch", async (_u: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ question: "A real question about the servo." }));
    });
    const withWork: Project = {
      ...project,
      events: [
        { id: "e1", kind: "attempt", at: "2026-08-04T10:00:00.000Z", text: "bent the bracket" },
      ],
    };
    await askAbout(withWork, thin());
    expect(body.recent).toContain("attempt: bent the bracket");
    vi.unstubAllGlobals();
  });

  it("still asks when the route fails", async () => {
    // Fails OPEN, unlike the concierge. The child is mid-build with something to say, so an outage
    // should cost them specificity rather than the whole exchange.
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    const q = await askAbout(project, thin());
    expect(q.question.length).toBeGreaterThan(15);
    expect(q.question).not.toMatch(/error|failed|sorry/i);
    vi.unstubAllGlobals();
  });

  it("still asks when the route returns nothing usable", async () => {
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ question: "   " })));
    const q = await askAbout(project, thin());
    expect(q.question.length).toBeGreaterThan(15);
    vi.unstubAllGlobals();
  });
});

describe("what the answer becomes", () => {
  it("is a reflection in the same journey, pointing at the artefact", () => {
    // Not a side channel. It lands in the append-only log with everything else, and `refs` is what
    // lets the console show it under the thing it is about.
    const entry = answerEntry(
      { artifactId: "a1", facet: "challenge", question: "What was trickiest?" },
      "  The servo kept jamming.  ",
    );
    expect(entry.kind).toBe("reflection");
    expect(entry.refs).toEqual(["a1"]);
    expect(entry.text).toContain("What was trickiest?");
    expect(entry.text).toContain("The servo kept jamming.");
    expect(entry.text).not.toMatch(/\s{2,}$/);
  });

  it("keeps the question with the answer, so the record reads on its own", () => {
    // A bare answer in a log is unreadable six weeks later. The pair is the evidence.
    const entry = answerEntry(
      { artifactId: "a1", facet: "how", question: "How does it work?" },
      "Servos.",
    );
    expect(entry.text.indexOf("How does it work?")).toBeLessThan(entry.text.indexOf("Servos."));
  });

  it("carries no score, verdict or judgement", () => {
    // The engine's `AnswerJudge` and its coverage number are deliberately unused here. Coverage
    // exists to steer facet selection across six turns; with one turn there is nothing to steer,
    // and wiring a judge in would manufacture an "understanding" score for a screen to render.
    const entry = answerEntry({ artifactId: "a1", facet: "challenge", question: "Q?" }, "A.");
    const text = JSON.stringify(entry);
    expect(text).not.toMatch(/\b(score|coverage|judg|verdict|pass|fail|rating)\b/i);
  });
});
