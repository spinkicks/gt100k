/**
 * Two bugs found by following our own runbook in a browser, neither of which any existing test
 * could have caught.
 *
 * The consent file lives in the profile directory, and `ProfileStore.list()` reports every `*.json`
 * there as a child. So the console loaded `consent.json` as a profile, found no `store` on it, and
 * crashed on first render with a stack trace where the roster should be. Parsing is not validation:
 * that file loaded perfectly.
 *
 * And the sidebar said "Synthetic data only" while a real ingested child was selected. That is the
 * label someone checks before deciding what they may do with what is on screen, so a false
 * reassurance there is worse than no label.
 *
 * Both were invisible to the route tests, which call the handler directly and never render, and to
 * the component tests, which never read a directory.
 */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gt-roster-"));
  process.env.GT100K_PROFILE_DIR = dir;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const consentFile = () =>
  writeFile(
    join(dir, "consent.json"),
    JSON.stringify([
      {
        kidId: "local-demo",
        guardianRef: "g",
        method: "guide-asserted",
        purposes: ["discovery-measurement"],
        grantedAt: new Date().toISOString(),
      },
    ]),
  );

const ingest = async (kidId: string) => {
  const { POST } = await import("../app/api/ingest/route.js");
  return POST(
    new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
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
          { kidId, artifactId: "nonogram", sessionId: "s1", timestamp: "2026-07-20T10:00:00.000Z" },
        ],
      }),
    }),
  );
};

describe("loading the roster from a real directory", () => {
  it("does not hand the consent file to the console as a child", async () => {
    // The weaker of the two, and worth saying so: the crash was in `buildRosterStore`, which runs in
    // the client component, so this only checks that the server page does not pass the bad entry
    // along. The test below is the one that would have caught the bug.
    await consentFile();
    const { default: Page } = await import("../app/page.js");
    const el = (await Page()) as { props: { ingested: readonly unknown[] } };

    expect(el.props.ingested).toEqual([]);
  });

  it("still finds the children among the other files", async () => {
    await consentFile();
    expect((await ingest("local-demo")).status).toBe(200);

    const { default: Page } = await import("../app/page.js");
    const el = (await Page()) as { props: { ingested: readonly { kidId: string }[] } };

    expect(el.props.ingested.map((p) => p.kidId)).toEqual(["local-demo"]);
  });

  it("is empty, not broken, when nobody has played", async () => {
    const { default: Page } = await import("../app/page.js");
    const el = (await Page()) as { props: { ingested: readonly unknown[] } };

    expect(el.props.ingested).toEqual([]);
  });
});
