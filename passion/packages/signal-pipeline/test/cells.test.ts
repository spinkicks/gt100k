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
    const cells = actionToCellEvents(ev, synth, { kind: "cross_day_return", dayGap: 3 });
    // primary return + secondary return (role: secondary) + one artifact_competence depth event; "noise" ignored
    expect(cells).toHaveLength(3);
    expect(cells[0]).toMatchObject({
      mode: "build",
      kind: "cross_day_return",
      dayGap: 3,
      novelty: false,
    });
    // The secondary reading is the same occurrence, so it carries the same kind and dayGap.
    expect(cells[1]).toMatchObject({
      mode: "investigate",
      kind: "cross_day_return",
      dayGap: 3,
      role: "secondary",
    });
    expect(cells[2]).toMatchObject({ mode: "build", kind: "artifact_competence" });
    expect(cells[2]!.dayGap).toBeUndefined(); // dayGap belongs to the return, not the depth signal
  });
  it("carries no dayGap when the classification has none", () => {
    const ev: ActionEvent = {
      kidId: "k",
      artifactId: "synth-01",
      engagedModes: { primary: "build", secondary: "investigate" },
      depthSignals: [],
      timestamp: "2026-02-01T00:00:00.000Z",
      returnState: "voluntary",
      noveltyFlag: false,
    };
    const cells = actionToCellEvents(ev, synth, { kind: "same_day_engagement" });
    expect(cells).toEqual([
      {
        domainPath: synth.domainPath,
        mode: "build",
        kind: "same_day_engagement",
        novelty: false,
        timestamp: ev.timestamp,
      },
      {
        domainPath: synth.domainPath,
        mode: "investigate",
        kind: "same_day_engagement",
        novelty: false,
        timestamp: ev.timestamp,
        role: "secondary",
      },
    ]);
    for (const c of cells) expect("dayGap" in c).toBe(false);
  });
  it("prompted maps to prompted_return", () => {
    const ev: ActionEvent = {
      kidId: "k",
      artifactId: "synth-01",
      engagedModes: { primary: "investigate" },
      depthSignals: [],
      timestamp: "2026-02-01T00:00:00.000Z",
      returnState: "prompted",
      noveltyFlag: false,
    };
    const cells = actionToCellEvents(ev, synth, { kind: "prompted_return" });
    expect(cells).toEqual([
      {
        domainPath: synth.domainPath,
        mode: "investigate",
        kind: "prompted_return",
        novelty: false,
        timestamp: ev.timestamp,
      },
    ]);
  });
});
