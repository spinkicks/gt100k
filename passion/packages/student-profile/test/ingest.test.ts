/**
 * The receiver's job is to be boring under a network that is not.
 *
 * A browser posting batches gets at-least-once delivery: a lost response looks exactly like a lost
 * request from the client's side, so it retries, and the same play arrives twice. Without a rule
 * here that inflates the interaction log, and the log is what every belief in the product is
 * computed from. A duplicated return would read as a more devoted child.
 */
import type { Artifact } from "@gt100k/two-axis-tagging";
import type { Interaction, SurfacedRecord } from "@gt100k/signal-pipeline";
import { describe, expect, it } from "vitest";

import { emptyProfile } from "../src/model.js";
import { ingest, unseen } from "../src/ingest.js";

const CATALOG = new Map<string, Artifact>([
  [
    "synth",
    {
      id: "synth",
      domainPath: ["music-sound", "audio-systems"],
      affordedModes: ["build"],
      kind: "gadget",
      source: "gold",
      origin: "seed",
      tagConfidence: 1,
      tagStatus: "TRUSTED",
    },
  ],
]);

const KID = "kid-1";
const NOW = "2026-03-28T00:00:00.000Z";
const ctx = { catalog: CATALOG };

const engage = (at: string, kidId = KID): Interaction => ({
  kidId,
  artifactId: "synth",
  actionType: "assemble",
  timestamp: at,
  prompted: false,
  sessionId: "s1",
});

const show = (at: string, kidId = KID): SurfacedRecord => ({
  kidId,
  artifactId: "synth",
  sessionId: "s1",
  timestamp: at,
});

const batch = (interactions: Interaction[], surfaced: SurfacedRecord[] = []) => ({
  interactions,
  surfaced,
});

describe("ingest is idempotent, because delivery is not", () => {
  it("accepts a batch once and ignores the identical retry", () => {
    const b = batch([engage("2026-03-20T00:00:00.000Z")], [show("2026-03-20T00:00:00.000Z")]);

    const first = ingest(emptyProfile(KID, "Test"), b, ctx, NOW);
    expect(first.accepted).toEqual({ interactions: 1, surfaced: 1 });

    const second = ingest(first.profile, b, ctx, NOW);
    expect(second.accepted).toEqual({ interactions: 0, surfaced: 0 });
    expect(second.profile.interactions).toHaveLength(1);
    expect(second.profile.surfaced).toHaveLength(1);
  });

  it("takes only the new tail when a client resends everything it has", () => {
    const one = engage("2026-03-20T00:00:00.000Z");
    const two = engage("2026-03-21T00:00:00.000Z");

    const first = ingest(emptyProfile(KID, "Test"), batch([one]), ctx, NOW);
    const second = ingest(first.profile, batch([one, two]), ctx, NOW);

    expect(second.accepted.interactions).toBe(1);
    expect(second.profile.interactions).toHaveLength(2);
  });

  it("collapses duplicates inside a single batch too", () => {
    const one = engage("2026-03-20T00:00:00.000Z");
    const result = ingest(emptyProfile(KID, "Test"), batch([one, one, one]), ctx, NOW);

    expect(result.profile.interactions).toHaveLength(1);
  });

  it("keeps records that differ only in timestamp", () => {
    const result = ingest(
      emptyProfile(KID, "Test"),
      batch([engage("2026-03-20T00:00:00.000Z"), engage("2026-03-20T00:00:00.001Z")]),
      ctx,
      NOW,
    );

    expect(result.profile.interactions).toHaveLength(2);
  });
});

describe("a batch belongs to exactly one child", () => {
  it("refuses records tagged with someone else, and says how many", () => {
    const result = ingest(
      emptyProfile(KID, "Test"),
      batch([engage("2026-03-20T00:00:00.000Z"), engage("2026-03-20T00:00:00.000Z", "kid-2")]),
      ctx,
      NOW,
    );

    expect(result.rejected).toBe(1);
    expect(result.profile.interactions).toHaveLength(1);
    expect(result.profile.interactions[0]!.kidId).toBe(KID);
  });

  it("does not relabel them to make them fit", () => {
    const result = ingest(
      emptyProfile(KID, "Test"),
      batch([engage("2026-03-20T00:00:00.000Z", "kid-2")], [show("2026-03-20T00:00:00.000Z", "kid-2")]),
      ctx,
      NOW,
    );

    expect(result.rejected).toBe(2);
    expect(result.profile.interactions).toEqual([]);
    expect(result.profile.surfaced).toEqual([]);
  });
});

describe("unseen is usable on its own", () => {
  it("reports the new part without running a cycle", () => {
    const one = engage("2026-03-20T00:00:00.000Z");
    const profile = ingest(emptyProfile(KID, "Test"), batch([one]), ctx, NOW).profile;

    const fresh = unseen(profile, batch([one, engage("2026-03-21T00:00:00.000Z")]));
    expect(fresh.interactions).toHaveLength(1);
    expect(fresh.surfaced).toEqual([]);
  });
});
