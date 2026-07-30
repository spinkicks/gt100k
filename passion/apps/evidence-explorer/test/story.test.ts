import { describe, expect, it } from "vitest";
import { buildSyntheticExplorerView } from "../components/synthetic-view.js";
import {
  STORY_CAPTIONS,
  STORY_LEAD_IN,
  STORY_STEP_MS,
  canAutoAdvance,
  clampCount,
  frontierNodeId,
  isAtEnd,
  isAtStart,
  isMerge,
  nextCount,
  prevCount,
  shortHash,
  storyCaption,
} from "../components/story.js";

const view = buildSyntheticExplorerView();
const count = view.growthTimeline.count; // 12

describe("story captions", () => {
  it("has a non-empty caption for every one of the 12 beats", () => {
    for (let i = 0; i < count; i++) {
      expect(typeof STORY_CAPTIONS[i]).toBe("string");
      expect(STORY_CAPTIONS[i].length).toBeGreaterThan(0);
    }
  });
  it("shows the lead-in before the story starts", () => {
    expect(storyCaption(view, 0)).toBe(STORY_LEAD_IN);
  });
  it("shows the authored caption at each beat position", () => {
    expect(storyCaption(view, 1)).toBe(STORY_CAPTIONS[0]);
    expect(storyCaption(view, count)).toBe(STORY_CAPTIONS[count - 1]);
  });
  it("the failing first run (beat index 3) reads as a failure kept on the record", () => {
    expect(storyCaption(view, 4)).toMatch(/didn't pass|recorded|falls through/i);
  });
});

describe("captions bind to the real beats (fails loudly if the fixture reorders)", () => {
  it("every beat position has a caption", () => {
    view.growthTimeline.beats.forEach((beat) => {
      expect(STORY_CAPTIONS[beat.birthOrder]).toBeDefined();
    });
  });
  it("beat 3 and beat 6 are Attempts (the failing then passing run), beat 11 is the Outcome", () => {
    expect(view.growthTimeline.beats[3].group).toBe("Attempt");
    expect(view.growthTimeline.beats[6].group).toBe("Attempt");
    expect(view.growthTimeline.beats[11].group).toBe("Outcome");
  });
});

describe("shortHash is a real content-address prefix", () => {
  it("every beat node id is a 64-char sha256 hex", () => {
    view.growthTimeline.beats.forEach((beat) => {
      expect(beat.nodeId).toMatch(/^[0-9a-f]{64}$/);
    });
  });
  it("returns the first 7 chars", () => {
    const id = view.growthTimeline.beats[0].nodeId;
    expect(shortHash(id)).toBe(id.slice(0, 7));
    expect(shortHash(id)).toHaveLength(7);
  });
});

describe("frontier + merge (the DAG is not linear)", () => {
  it("frontier is null at 0 and the last beat at full reveal", () => {
    expect(frontierNodeId(view, 0)).toBeNull();
    expect(frontierNodeId(view, count)).toBe(view.growthTimeline.beats[count - 1].nodeId);
  });
  it("the two source Artifacts are merges (built from a prior step + cited tutor help)", () => {
    const merges = view.nodes.filter((n) => isMerge(view, n.id));
    expect(merges.length).toBe(2);
    merges.forEach((n) => expect(n.type).toBe("Artifact"));
  });
  it("a single-parent step is not a merge", () => {
    // The plan (beat 0) has no dependency edges; it is the root, never a merge.
    expect(isMerge(view, view.growthTimeline.beats[0].nodeId)).toBe(false);
  });
});

describe("playback math", () => {
  it("advances and clamps at both ends", () => {
    expect(nextCount(0, count)).toBe(1);
    expect(nextCount(count, count)).toBe(count);
    expect(prevCount(1)).toBe(0);
    expect(prevCount(0)).toBe(0);
    expect(clampCount(99, count)).toBe(count);
  });
  it("reports the ends", () => {
    expect(isAtStart(0)).toBe(true);
    expect(isAtStart(1)).toBe(false);
    expect(isAtEnd(count, count)).toBe(true);
    expect(isAtEnd(0, count)).toBe(false);
  });
  it("suppresses auto-advance under reduced motion", () => {
    expect(canAutoAdvance(false)).toBe(true);
    expect(canAutoAdvance(true)).toBe(false);
  });
  it("uses a readable cadence (> 1s)", () => {
    expect(STORY_STEP_MS).toBeGreaterThan(1000);
  });
});
