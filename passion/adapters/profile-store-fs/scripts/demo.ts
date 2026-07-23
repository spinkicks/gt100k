// Headless persistence demo (no network): build Ari's profile via `runCycle`, persist it with the
// JSON-file adapter to a temp dir, reload it, and print the reloaded store + derived gates. Proves the
// save → reload → view round-trip end-to-end. Run with an absolute path (tsx mis-resolves a deep
// relative entry against a workspace dep dir):
//   pnpm exec tsx "$PWD/passion/adapters/profile-store-fs/scripts/demo.ts"
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyProfile, runCycle, deriveGates } from "@gt100k/student-profile";
import { createFsProfileStore } from "../src/index.js";

const KID = "kid-synthetic-001";
const NOW = "2026-03-01T00:00:00.000Z";
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
const CTX = { catalog: CATALOG };

async function main(): Promise<void> {
  const ari = runCycle(
    emptyProfile(KID, "Ari", [{ domain: "music-sound", inEnvironment: true, aptitudeTilt: 0, discretionaryTilt: 0 }], {
      "music-sound/audio-systems::build": "defense-record-042",
    }),
    [
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-01-01T00:00:00.000Z", prompted: false, sessionId: "s0" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-20T00:00:00.000Z", prompted: false, sessionId: "s1" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-22T00:00:00.000Z", prompted: false, sessionId: "s2" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-24T00:00:00.000Z", prompted: false, sessionId: "s3" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-26T00:00:00.000Z", prompted: false, sessionId: "s4" },
      { kidId: KID, artifactId: "synth-01", actionType: "assemble", timestamp: "2026-02-28T00:00:00.000Z", prompted: false, sessionId: "s5", depth: 1, depthSignals: [{ kind: "artifact_competence", value: 1 }] },
    ],
    CTX,
    NOW,
  );

  const dir = await mkdtemp(join(tmpdir(), "gt100k-profile-store-fs-demo-"));
  const store = createFsProfileStore(dir);
  await store.save(ari);
  console.log(`saved ${(await store.list()).join(", ")} → ${dir}`);

  const loaded = await store.load(KID);
  if (!loaded) throw new Error("reload failed");

  const gates = deriveGates(loaded, CTX, NOW);
  console.log(`\nreloaded ${loaded.displayName} (${loaded.kidId}), updatedAt=${loaded.updatedAt}`);
  for (const h of Object.values(loaded.store.byId).filter((x) => x.kidId === KID)) {
    const g = gates.get(h.id);
    console.log(
      `  ${h.cellKey}: ${h.state} lb=${h.evidence.lowerBound.toFixed(2)} confident=${h.evidence.confident} ` +
        `artifact=${h.perseveranceArtifactRef ?? "-"} gate.passed=${g?.passed ?? false}`,
    );
  }
}

void main();
