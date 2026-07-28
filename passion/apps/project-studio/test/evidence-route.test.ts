/**
 * The quest log becomes something a child can point at.
 *
 * `@gt100k/project-evidence-sink` was built, tested, and imported by no app: the studio kept a
 * local journal and never materialized it. A journal is a list of things that happened. The graph
 * is content-addressed, so a node's id IS the hash of its content and an altered entry gets a
 * different id instead of quietly replacing the old one. That difference is the entire argument for
 * E1, and it was worth nothing while it ran nowhere.
 *
 * Server-side because the hasher is real there. The browser alternative is `stubHasher`, FNV-1a and
 * explicitly for reproducing the mapping in CI; putting that behind the word "fingerprint" would be
 * the sort of quiet lie the graph exists to prevent.
 */
import { describe, expect, it } from "vitest";

import { POST } from "../app/api/evidence/route.js";
import { seedProjects } from "../app/seed.js";

const post = (body: unknown): Promise<Response> =>
  POST(
    new Request("http://localhost/api/evidence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

interface Recorded {
  projectId: string;
  nodes: number;
  edges: number;
  recorded: string[];
}

describe("a project becomes a graph", () => {
  it("records the seeded project", async () => {
    const project = seedProjects()[0]!;
    const body = (await (await post(project)).json()) as Recorded;

    expect(body.projectId).toBe(project.id);
    expect(body.nodes).toBeGreaterThan(0);
  });

  it("gives back one id per node, and they are content hashes rather than counters", async () => {
    const body = (await (await post(seedProjects()[0]!)).json()) as Recorded;

    expect(body.recorded).toHaveLength(body.nodes);
    // SHA-256 hex. A counter or a uuid would satisfy "has an id" and fail the only property that
    // matters, which is that the id is derived from the content.
    for (const id of body.recorded) expect(id).toMatch(/^[0-9a-f]{16,}$/);
  });

  it("is deterministic, which is what makes a changed entry visible", async () => {
    const project = seedProjects()[0]!;
    const first = (await (await post(project)).json()) as Recorded;
    const second = (await (await post(project)).json()) as Recorded;

    expect(second.recorded).toEqual(first.recorded);
  });

  it("gives a different id when the child's words change", async () => {
    // `text` is the field the model calls "the kid's words". If editing it leaves every id
    // untouched then the child's own account is outside the hash, and a portfolio built on this
    // would be tamper-evident about everything except the part a reader cares about.
    const project = seedProjects()[0]!;
    const first = (await (await post(project)).json()) as Recorded;

    const events = [...project.events];
    const head = events[0];
    if (!head) return;
    events[0] = { ...head, text: `${head.text} (edited)` };
    const edited = (await (await post({ ...project, events })).json()) as Recorded;

    // Same shape, different content, so at least one id has to move. If none did, the id is not
    // derived from the content and nothing here is tamper-evident.
    expect(edited.recorded).not.toEqual(first.recorded);
  });
});

describe("a body that is not a project", () => {
  it("is refused rather than recorded as an empty one", async () => {
    // An empty graph returned with a 200 would read to the caller as "recorded, nothing in it",
    // which is indistinguishable from a child who did nothing.
    expect((await post({ id: "x" })).status).toBe(400);
  });
});
