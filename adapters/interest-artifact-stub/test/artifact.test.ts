import { describe, expect, it } from "vitest";
import { StubArtifactSignalSource } from "../src/index";

const COARSE_TRANSITION = {
  artifactRef: "synthetic-artifact-001",
  learnerRef: "synthetic-learner-001",
  transition: "TESTED",
  dayOffset: 9,
} as const;

describe("StubArtifactSignalSource", () => {
  it("emits validated coarse transitions in order and then ends", async () => {
    const source = new StubArtifactSignalSource([COARSE_TRANSITION]);

    await expect(source.next()).resolves.toEqual(COARSE_TRANSITION);
    await expect(source.next()).resolves.toBeNull();
  });

  it.each([
    { screenRecording: "synthetic-screen-buffer" },
    { rawKeystrokes: ["synthetic-key"] },
    { fileContents: "synthetic-unrelated-content" },
  ])("rejects raw payloads before they can enter the source queue", (rawField) => {
    expect(() => new StubArtifactSignalSource([{ ...COARSE_TRANSITION, ...rawField }])).toThrow(
      "raw or unrelated artifact content is prohibited",
    );
  });
});
