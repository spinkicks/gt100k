/**
 * The uplink's whole job is to be invisible when the console is not there.
 *
 * A child's session cannot depend on a guide's laptop being on. So every failure path here has to
 * end in "try again later" rather than in an error the game has to handle, and the log has to
 * survive the failure intact, because it is the only copy.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmittedInteraction, SurfacedRecord } from "./types";
import { createUplink } from "./uplink";

const KID = "local-demo";

const interaction = (at: string): EmittedInteraction => ({
  kidId: KID,
  artifactId: "nonogram",
  actionType: "inspect",
  timestamp: at,
  prompted: false,
  sessionId: "s1",
});

const surfacedRecord = (at: string): SurfacedRecord => ({
  kidId: KID,
  artifactId: "nonogram",
  sessionId: "s1",
  timestamp: at,
});

const setup = (
  log: { interactions: EmittedInteraction[]; surfaced: SurfacedRecord[] },
  post: (url: string, body: string) => Promise<boolean>,
) =>
  createUplink({
    endpoint: "http://localhost:3000/api/ingest",
    kidId: KID,
    interactions: () => log.interactions,
    surfaced: () => log.surfaced,
    post,
  });

beforeEach(() => {
  localStorage.clear();
});

describe("the uplink sends only what has not landed", () => {
  it("sends the whole log first, then nothing", async () => {
    const log = { interactions: [interaction("2026-03-20T00:00:00.000Z")], surfaced: [] };
    const post = vi.fn(async () => true);
    const uplink = setup(log, post);

    expect((await uplink.flush()).sent).toEqual({ interactions: 1, surfaced: 0 });
    expect((await uplink.flush()).sent).toEqual({ interactions: 0, surfaced: 0 });
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("sends only the tail after the log grows", async () => {
    const log = { interactions: [interaction("2026-03-20T00:00:00.000Z")], surfaced: [] };
    const bodies: string[] = [];
    const uplink = setup(log, async (_u, b) => {
      bodies.push(b);
      return true;
    });

    await uplink.flush();
    log.interactions.push(interaction("2026-03-21T00:00:00.000Z"));
    await uplink.flush();

    const second = JSON.parse(bodies[1]!) as { interactions: EmittedInteraction[] };
    expect(second.interactions).toHaveLength(1);
    expect(second.interactions[0]!.timestamp).toBe("2026-03-21T00:00:00.000Z");
  });

  it("tracks the two logs separately, so one being quiet does not stall the other", async () => {
    const log = {
      interactions: [] as EmittedInteraction[],
      surfaced: [surfacedRecord("2026-03-20T00:00:00.000Z")],
    };
    const uplink = setup(log, async () => true);

    expect((await uplink.flush()).sent).toEqual({ interactions: 0, surfaced: 1 });
    log.interactions.push(interaction("2026-03-21T00:00:00.000Z"));
    expect((await uplink.flush()).sent).toEqual({ interactions: 1, surfaced: 0 });
  });
});

describe("a console that is not there costs the child nothing", () => {
  it("swallows a rejected request and keeps the records for next time", async () => {
    const log = { interactions: [interaction("2026-03-20T00:00:00.000Z")], surfaced: [] };
    let up = false;
    const uplink = setup(log, async () => {
      if (!up) throw new Error("ECONNREFUSED");
      return true;
    });

    const failed = await uplink.flush();
    expect(failed.ok).toBe(false);
    expect(uplink.watermark()).toEqual({ interactions: 0, surfaced: 0 });

    up = true;
    const later = await uplink.flush();
    expect(later.ok).toBe(true);
    expect(later.sent.interactions).toBe(1);
  });

  it("does not advance on a non-ok response either", async () => {
    // A 500 is not an exception, and treating it as success would drop the batch silently, which is
    // the one outcome worse than retrying forever.
    const log = { interactions: [interaction("2026-03-20T00:00:00.000Z")], surfaced: [] };
    const uplink = setup(log, async () => false);

    await uplink.flush();
    expect(uplink.watermark()).toEqual({ interactions: 0, surfaced: 0 });
  });

  it("survives a watermark that storage lost or corrupted", async () => {
    localStorage.setItem("mvp-jul24:uplink-watermark", "{ not json");
    const log = { interactions: [interaction("2026-03-20T00:00:00.000Z")], surfaced: [] };
    const uplink = setup(log, async () => true);

    // Resending from zero is the safe direction: the receiver deduplicates, so the cost is a wasted
    // round trip rather than a hole in the record.
    expect((await uplink.flush()).sent.interactions).toBe(1);
  });
});

describe("overlapping flushes", () => {
  it("refuses the second, so a slow response cannot advance past a batch in flight", async () => {
    const log = { interactions: [interaction("2026-03-20T00:00:00.000Z")], surfaced: [] };
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const uplink = setup(log, async () => {
      await gate;
      return true;
    });

    const first = uplink.flush();
    const second = await uplink.flush();
    expect(second.ok).toBe(false);
    expect(second.sent).toEqual({ interactions: 0, surfaced: 0 });

    release();
    expect((await first).ok).toBe(true);
  });
});
