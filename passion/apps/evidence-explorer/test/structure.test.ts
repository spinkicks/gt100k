import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = join(__dirname, "..", "components");
const read = (f: string) => readFileSync(join(COMPONENTS, f), "utf8");

describe("single-column story-first composition", () => {
  it("Observatory owns the verify state and delegates the panel to VerifyPanel, which wires audioCaptions into VerifyBox", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/verifyOpen/);
    expect(src).toMatch(/verifyVisual/);
    expect(src).toMatch(/VerifyPanel/);

    const panelSrc = read("VerifyPanel.tsx");
    expect(panelSrc).toMatch(/VerifyBox/);
    expect(panelSrc).toMatch(/audioCaptions/);
  });

  it("Observatory exposes a Verify control in the header", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/obs-verify-btn/);
  });

  it("the render stage no longer renders VerifyBox", () => {
    expect(read("ObservatoryStage.tsx")).not.toMatch(/VerifyBox/);
  });
});

describe("Explore disclosure", () => {
  it("Observatory delegates the tools to ExplorePanel, not directly", () => {
    const src = read("Observatory.tsx");
    expect(src).toMatch(/ExplorePanel/);
    // The tools now live inside ExplorePanel, not the Observatory shell.
    expect(src).not.toMatch(/<Hud\b/);
    expect(src).not.toMatch(/<Ledger\b/);
    expect(src).not.toMatch(/<AddPanel\b/);
  });

  it("ExplorePanel is collapsed by default", () => {
    const src = read("ExplorePanel.tsx");
    expect(src).toMatch(/useState\(false\)/);
    expect(src).toMatch(/aria-expanded/);
  });
});

describe("Verify reads plainly on top, verbatim underneath", () => {
  it("VerifyBox uses the plain verifyLine copy", () => {
    expect(read("VerifyBox.tsx")).toMatch(/verifyLine/);
  });
  it("VerifyBox keeps the verbatim technical steps in the detail", () => {
    // the step list is the auditor's verbatim view — it must remain.
    expect(read("VerifyBox.tsx")).toMatch(/verifybox-steps/);
  });
  it("the tamper control reads plainly (not 'tamper')", () => {
    const src = read("VerifyBox.tsx");
    expect(src).toMatch(/Try changing the record|Undo the change|Change one/i);
  });
});

describe("CommitLog is a git-log-style, non-linear history", () => {
  const src = read("CommitLog.tsx");
  it("renders a real short content-address per beat", () => {
    expect(src).toMatch(/shortHash\(beat\.nodeId\)/);
  });
  it('marks the current beat with aria-current="step"', () => {
    expect(src).toMatch(/aria-current/);
    expect(src).toMatch(/"step"/);
  });
  it("dims future (unrevealed) beats", () => {
    expect(src).toMatch(/is-future/);
  });
  it("shows a merge cue for multi-input (non-linear) steps", () => {
    expect(src).toMatch(/isMerge/);
    expect(src).toMatch(/is-merge/);
  });
  it("rows are clickable to jump to a beat", () => {
    expect(src).toMatch(/onSelectBeat\(beat\.nodeId\)/);
  });
  it("keeps the current row scrolled into view (no animated scroll)", () => {
    const src = read("CommitLog.tsx");
    expect(src).toMatch(/scrollIntoView\(\{\s*block:\s*"nearest"\s*\}\)/);
    expect(src).not.toMatch(/behavior:\s*"smooth"/);
  });
});

describe("useStoryPlayback reuses the pure step logic and honors reduced motion", () => {
  const src = read("use-story-playback.ts");
  it("advances on the STORY_STEP_MS interval", () => {
    expect(src).toMatch(/setInterval/);
    expect(src).toMatch(/STORY_STEP_MS/);
  });
  it("clears the auto-advance timer (unmount/pause cleanup)", () => {
    expect(src).toMatch(/clearInterval/);
  });
  it("suppresses auto-advance under reduced motion (step-only)", () => {
    expect(src).toMatch(/canAutoAdvance|canAutoPlay/);
    expect(src).toMatch(/if \(!canAutoPlay\)/);
  });
  it("stops playback if reduced motion turns on mid-play", () => {
    expect(src).toMatch(/if \(!canAutoPlay && playing\) pause\(\)/);
  });
  it("reuses the pure playback helpers rather than re-deriving them", () => {
    expect(src).toMatch(/nextCount/);
    expect(src).toMatch(/prevCount/);
  });
  it("is presentation-only (never imports the domain graph)", () => {
    expect(src).not.toMatch(/@gt100k\/evidence-graph/);
  });
});

describe("StoryTransport renders caption, controls, and the Verify nudge", () => {
  const src = read("StoryTransport.tsx");
  it("shows the caption in an aria-live region", () => {
    expect(src).toMatch(/story-caption/);
    expect(src).toMatch(/aria-live="polite"/);
  });
  it("has Play/Pause + Prev + Next controls", () => {
    expect(src).toMatch(/story-play/);
    expect(src).toMatch(/story-prev/);
    expect(src).toMatch(/story-next/);
  });
  it("hides auto-play under reduced motion (canAutoPlay gate)", () => {
    expect(src).toMatch(/playback\.canAutoPlay \?/);
  });
  it("ends on a nudge that opens Verify", () => {
    expect(src).toMatch(/playback\.atEnd/);
    expect(src).toMatch(/onOpenVerify/);
    expect(src).toMatch(/STORY_END_NUDGE/);
  });
});

describe("Story Mode is wired into the stage (TimeScrub retired)", () => {
  const stage = read("ObservatoryStage.tsx");
  it("renders the CommitLog and the StoryTransport, not TimeScrub", () => {
    expect(stage).toMatch(/<CommitLog/);
    expect(stage).toMatch(/<StoryTransport/);
    expect(stage).not.toMatch(/TimeScrub/);
  });
  it("drives the playback engine off the shared revealedCount", () => {
    expect(stage).toMatch(/useStoryPlayback/);
    expect(stage).toMatch(/setRevealedCount/);
  });
  it("highlights the frontier node via focusNodeId during play (no Inspector hijack)", () => {
    expect(stage).toMatch(/storyFocus/);
    expect(stage).toMatch(/frontierNodeId/);
  });
  it("accepts and forwards an onOpenVerify for the end nudge", () => {
    expect(stage).toMatch(/onOpenVerify/);
  });
  const obs = read("Observatory.tsx");
  it("Observatory opens Verify from the stage nudge", () => {
    expect(obs).toMatch(/onOpenVerify=\{\(\) => setVerifyOpen\(true\)\}/);
  });
});
