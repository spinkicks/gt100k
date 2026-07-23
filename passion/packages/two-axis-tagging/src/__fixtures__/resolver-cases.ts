import type { Artifact } from "../records.js";
import type { RawAction } from "../records.js";
import type { WorkMode } from "../work-modes.js";

const synth: Artifact = {
  id: "synth-01", domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["perform", "build", "investigate"], kind: "gadget",
  source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};

const mixingDesk: Artifact = {
  id: "mixer-01", domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["debug", "investigate", "explain"], kind: "gadget",
  source: "gold", origin: "seed", tagConfidence: 1, tagStatus: "TRUSTED",
};

export const RESOLVER_CASES: ReadonlyArray<{
  name: string; artifact: Artifact; action: RawAction;
  expect: { ok: true; primary: WorkMode; secondary?: WorkMode } | { ok: false; reason: string };
}> = [
  { name: "play → perform", artifact: synth, action: { artifactId: "synth-01", actionType: "play" },
    expect: { ok: true, primary: "perform" } },
  { name: "assemble → build", artifact: synth, action: { artifactId: "synth-01", actionType: "assemble" },
    expect: { ok: true, primary: "build" } },
  { name: "inspect → investigate", artifact: synth, action: { artifactId: "synth-01", actionType: "inspect" },
    expect: { ok: true, primary: "investigate" } },
  { name: "tinker → build primary, investigate secondary (priority order, both afforded)",
    artifact: synth, action: { artifactId: "synth-01", actionType: "tinker" },
    expect: { ok: true, primary: "build", secondary: "investigate" } },
  { name: "compose not afforded by synth → invalid-for-artifact",
    artifact: synth, action: { artifactId: "synth-01", actionType: "write-melody" },
    expect: { ok: false, reason: "invalid-for-artifact" } },
  { name: "unknown action → unresolved",
    artifact: synth, action: { artifactId: "synth-01", actionType: "wobble" },
    expect: { ok: false, reason: "unresolved" } },
  { name: "fix → debug (afforded by mixing desk)",
    artifact: mixingDesk, action: { artifactId: "mixer-01", actionType: "fix" },
    expect: { ok: true, primary: "debug" } },
  { name: "teach → explain (afforded by mixing desk)",
    artifact: mixingDesk, action: { artifactId: "mixer-01", actionType: "teach" },
    expect: { ok: true, primary: "explain" } },
  { name: "play not afforded by mixing desk → invalid-for-artifact",
    artifact: mixingDesk, action: { artifactId: "mixer-01", actionType: "play" },
    expect: { ok: false, reason: "invalid-for-artifact" } },
];
