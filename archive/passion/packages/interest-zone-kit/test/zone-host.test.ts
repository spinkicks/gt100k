import { INITIAL_ZONE_HOST_STATE, zoneHostReducer } from "@gt100k/interest-lab-view";
import { describe, expect, it } from "vitest";

describe("zoneHostReducer", () => {
  it("follows the enter, exit, enter transition table without remapping history", () => {
    const enteredMusic = zoneHostReducer(INITIAL_ZONE_HOST_STATE, {
      type: "enter",
      zoneId: "music",
    });
    const exitedMusic = zoneHostReducer(enteredMusic, { type: "exit" });
    const enteredArt = zoneHostReducer(exitedMusic, { type: "enter", zoneId: "art" });

    expect(enteredMusic).toEqual({
      activeZoneId: "music",
      dayOffset: 0,
      entered: ["music"],
    });
    expect(exitedMusic).toEqual({
      activeZoneId: null,
      dayOffset: 0,
      entered: ["music"],
    });
    expect(enteredArt).toEqual({
      activeZoneId: "art",
      dayOffset: 0,
      entered: ["music", "art"],
    });
  });

  it("dedupes adjacent entries and changes the time-lapse day independently", () => {
    const entered = zoneHostReducer(INITIAL_ZONE_HOST_STATE, {
      type: "enter",
      zoneId: "music",
    });
    const repeated = zoneHostReducer(entered, { type: "enter", zoneId: "music" });
    const advanced = zoneHostReducer(repeated, { type: "set-day", dayOffset: 7 });

    expect(repeated.entered).toEqual(["music"]);
    expect(advanced).toEqual({
      activeZoneId: "music",
      dayOffset: 7,
      entered: ["music"],
    });
  });
});
