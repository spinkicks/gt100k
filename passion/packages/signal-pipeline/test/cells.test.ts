import { describe, it, expect } from "vitest";
import { actionToCellEvents } from "../src/cells.js";
import type { Artifact, ActionEvent } from "@gt100k/two-axis-tagging";
import { DEFAULTS } from "../src/model.js";

const synth: Artifact = {
  id: "synth-01",
  domainPath: ["music-sound", "audio-systems"],
  affordedModes: ["perform", "build", "investigate"],
  kind: "gadget",
  source: "gold",
  origin: "seed",
  tagConfidence: 1,
  tagStatus: "TRUSTED",
};

describe("actionToCellEvents", () => {
  it("primary + secondary return events + depth family (non-family ignored)", () => {
    const ev: ActionEvent = {
      kidId: "k",
      artifactId: "synth-01",
      engagedModes: { primary: "build", secondary: "investigate" },
      depthSignals: [
        { kind: "artifact_competence", value: 1 },
        { kind: "noise", value: 1 },
      ],
      timestamp: "2026-02-01T00:00:00.000Z",
      returnState: "voluntary",
      noveltyFlag: false,
    };
    const cells = actionToCellEvents(ev, synth, 1, DEFAULTS);
    // primary voluntary_return (mag 1) + secondary voluntary_return (mag 0.5) + artifact_competence depth (mag 1); "noise" ignored
    expect(cells).toHaveLength(3);
    expect(cells[0]).toMatchObject({ mode: "build", kind: "voluntary_return", magnitude: 1, novelty: false });
    expect(cells[1]).toMatchObject({ mode: "investigate", kind: "voluntary_return", magnitude: 0.5 });
    expect(cells[2]).toMatchObject({ mode: "build", kind: "artifact_competence", magnitude: 1 });
  });
  it("prompted maps to prompted_return; explicit depth applies", () => {
    const ev: ActionEvent = {
      kidId: "k",
      artifactId: "synth-01",
      engagedModes: { primary: "investigate" },
      depthSignals: [],
      timestamp: "2026-02-01T00:00:00.000Z",
      returnState: "prompted",
      noveltyFlag: false,
    };
    const cells = actionToCellEvents(ev, synth, 1, DEFAULTS);
    expect(cells).toEqual([
      { domainPath: synth.domainPath, mode: "investigate", kind: "prompted_return", magnitude: 1, novelty: false, timestamp: ev.timestamp },
    ]);
  });
});
