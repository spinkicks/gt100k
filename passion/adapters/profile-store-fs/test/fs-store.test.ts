import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyProfile, runCycle, type StudentProfile } from "@gt100k/student-profile";
import { createFsProfileStore } from "../src/index.js";

// Fixtures are built through student-profile's public API only (the adapter's sole dep). Object
// literals are passed inline so contextual typing checks them against the engine types (Interaction,
// Artifact, DomainPrior) via student-profile's reference graph — no direct engine imports needed.
const KID = "kid-fs-1";
const NOW = "2026-03-01T00:00:00.000Z";

// A gadget affording `build` (via actionType "assemble") — mirrors 012's confident fixture.
const CATALOG = new Map([
  [
    "synth-01",
    {
      id: "synth-01",
      domainPath: ["music-sound", "audio-systems"],
      affordedModes: ["perform", "build", "investigate"],
      kind: "gadget",
      source: "gold",
      origin: "seed",
      tagConfidence: 1,
      tagStatus: "TRUSTED",
    } as const,
  ],
]);

/** Ari's profile: one novel first-exposure + five non-novel voluntary returns clustered near NOW. */
function ariProfile(): StudentProfile {
  const p0 = emptyProfile(
    KID,
    "Ari",
    [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }],
    { "music-sound/audio-systems::build": "defense-record-042" },
  );
  return runCycle(
    p0,
    [
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-20T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-22T00:00:00.000Z", prompted: false, sessionId: "s2" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-24T00:00:00.000Z", prompted: false, sessionId: "s3" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-26T00:00:00.000Z", prompted: false, sessionId: "s4" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-28T00:00:00.000Z", prompted: false, sessionId: "s5", depth: 1, depthSignals: [{ kind: "artifact_competence", value: 1 }] },
    ],
    { catalog: CATALOG },
    NOW,
  );
}

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "gt100k-profile-store-fs-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("createFsProfileStore", () => {
  it("round-trips a profile losslessly (deep-equal, new reference)", async () => {
    const store = createFsProfileStore(dir);
    const profile = ariProfile();
    await store.save(profile);

    const loaded = await store.load(KID);
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(profile);
    expect(loaded).not.toBe(profile); // fresh object from disk
  });

  it("writes exactly one ${kidId}.json per child", async () => {
    const store = createFsProfileStore(dir);
    await store.save(ariProfile());
    const raw = await readFile(join(dir, `${KID}.json`), "utf8");
    expect((JSON.parse(raw) as StudentProfile).kidId).toBe(KID);
  });

  it("load returns null for an unknown kid", async () => {
    const store = createFsProfileStore(dir);
    expect(await store.load("nobody")).toBeNull();
  });

  it("list() returns the kidIds of saved profiles", async () => {
    const store = createFsProfileStore(dir);
    await store.save(ariProfile());
    await store.save({ ...emptyProfile("kid-fs-2", "Bex"), updatedAt: NOW });
    expect([...(await store.list())].sort()).toEqual(["kid-fs-1", "kid-fs-2"]);
  });

  it("list() is empty for a fresh (non-existent) directory", async () => {
    const store = createFsProfileStore(join(dir, "does-not-exist-yet"));
    expect(await store.list()).toEqual([]);
  });

  it("save overwrites the same kid's file", async () => {
    const store = createFsProfileStore(dir);
    const p1 = ariProfile();
    await store.save(p1);
    const p2 = runCycle(
      p1,
      [{ kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-29T00:00:00.000Z", prompted: false, sessionId: "s6" }],
      { catalog: CATALOG },
      NOW,
    );
    await store.save(p2);
    expect(await store.load(KID)).toEqual(p2);
    expect((await store.list()).length).toBe(1);
  });
});
