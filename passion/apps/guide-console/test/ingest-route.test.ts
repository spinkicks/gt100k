/**
 * The join between a child playing and a guide seeing it.
 *
 * Everything on both sides of this route has been built and tested for weeks; what did not exist
 * was the route. So the thing worth testing here is not the derivation, which
 * `@gt100k/student-profile` covers, but that a batch shaped the way the game actually emits arrives,
 * persists, and comes back out as a child the console can render.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gt-ingest-"));
  process.env["GT100K_PROFILE_DIR"] = dir;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const post = async (body: unknown): Promise<Response> => {
  const { POST } = await import("../app/api/ingest/route.js");
  return POST(
    new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
};

const play = (kidId = "local-demo") => ({
  kidId,
  displayName: "Demo Child",
  interactions: [
    {
      kidId,
      artifactId: "nonogram",
      actionType: "inspect",
      timestamp: "2026-07-20T10:00:00.000Z",
      prompted: false,
      sessionId: "s1",
    },
  ],
  surfaced: [
    {
      kidId,
      artifactId: "nonogram",
      sessionId: "s1",
      timestamp: "2026-07-20T10:00:00.000Z",
    },
    { kidId, artifactId: "chess", sessionId: "s1", timestamp: "2026-07-20T10:00:00.000Z" },
  ],
});

describe("a batch from the game", () => {
  it("is accepted, and reports what it took", async () => {
    const res = await post(play());
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      accepted: { interactions: number; surfaced: number };
      totals: { interactions: number; surfaced: number };
    };
    expect(body.accepted).toEqual({ interactions: 1, surfaced: 2 });
    expect(body.totals).toEqual({ interactions: 1, surfaced: 2 });
  });

  it("keeps both logs, because what was offered is half the record", async () => {
    await post(play());
    const { createFsProfileStore } = await import("@gt100k/profile-store-fs");
    const profile = await createFsProfileStore(dir).load("local-demo");

    expect(profile?.interactions).toHaveLength(1);
    // The chess cabin was shown and not taken. Persisting only the interaction would lose that,
    // and with it the difference between a child who declined chess and one never offered it.
    expect(profile?.surfaced).toHaveLength(2);
  });

  it("does not double-count a retry", async () => {
    await post(play());
    const second = (await (await post(play())).json()) as {
      accepted: { interactions: number };
      totals: { interactions: number };
    };

    expect(second.accepted.interactions).toBe(0);
    expect(second.totals.interactions).toBe(1);
  });
});

describe("a batch that is wrong", () => {
  it("is refused without a kid", async () => {
    const res = await post({ ...play(), kidId: "" });
    expect(res.status).toBe(400);
  });

  it("is refused when the logs are not arrays, rather than coerced into empty ones", async () => {
    // Silently accepting garbage is how a broken emitter goes unnoticed: every response says 200
    // and the child's cabin just stays empty.
    const res = await post({ kidId: "local-demo", interactions: "nope", surfaced: [] });
    expect(res.status).toBe(400);
  });

  it("reports records belonging to another child instead of relabelling them", async () => {
    const mixed = play();
    const res = await post({
      ...mixed,
      interactions: [...mixed.interactions, { ...mixed.interactions[0]!, kidId: "someone-else" }],
    });

    const body = (await res.json()) as { rejected: number; totals: { interactions: number } };
    expect(body.rejected).toBe(1);
    expect(body.totals.interactions).toBe(1);
  });
});
