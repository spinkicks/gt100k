import { ACTIVITY_GOLDEN_V1 } from "@gt100k/interest-lab";
import { describe, expect, it } from "vitest";
import { buildTimeLapse } from "../src/index";

describe("buildTimeLapse", () => {
  it("matches the exact day 0, 7, and 30 golden", () => {
    expect(buildTimeLapse(ACTIVITY_GOLDEN_V1)).toEqual({
      phases: [
        {
          id: "first-session",
          dayOffset: 0,
          label: "Right now",
          quieted: false,
          activeCells: [
            { domain: "sound_music", workMode: "build" },
            { domain: "sound_music", workMode: "perform" },
            { domain: "symbols_math", workMode: "build" },
            { domain: "visual_design", workMode: "build" },
          ],
        },
        {
          id: "a-week-later",
          dayOffset: 7,
          label: "A week later…",
          quieted: true,
          activeCells: [
            { domain: "sound_music", workMode: "build" },
            { domain: "sound_music", workMode: "perform" },
            { domain: "sound_music", workMode: "debug" },
            { domain: "symbols_math", workMode: "build" },
          ],
        },
        {
          id: "a-month-later",
          dayOffset: 30,
          label: "A month later…",
          quieted: true,
          activeCells: [{ domain: "sound_music", workMode: "build" }],
        },
      ],
      currentPhaseId: "a-month-later",
    });
  });

  it("does not surface assistive or withdrawn actions as return activity", () => {
    expect(
      buildTimeLapse([
        { ...ACTIVITY_GOLDEN_V1[4]!, assistive: true },
        { ...ACTIVITY_GOLDEN_V1[8]!, withdrawn: true },
      ]),
    ).toEqual({ phases: [], currentPhaseId: "first-session" });
  });
});
