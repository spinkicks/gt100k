"use client";
// The Story Mode transport bar: the current caption (aria-live), the controls, and the closing
// "here's the proof" nudge to Verify. Presentation-only — every handler comes from props.
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
import { STORY_END_NUDGE, STORY_VERIFY_CTA, storyCaption } from "./story.js";
import type { StoryPlayback } from "./use-story-playback.js";

export function StoryTransport({
  view,
  revealedCount,
  onScrub,
  onOpenVerify,
  playback,
}: {
  view: ExplorerView;
  revealedCount: number;
  onScrub: (n: number) => void;
  onOpenVerify: () => void;
  playback: StoryPlayback;
}): JSX.Element {
  const count = view.growthTimeline.count;
  const caption = storyCaption(view, revealedCount);
  return (
    <section className="story-transport" aria-label="Story mode">
      <p className="story-caption" aria-live="polite">
        {caption}
      </p>

      <div className="story-controls">
        <button
          type="button"
          className="story-prev"
          onClick={playback.prev}
          disabled={playback.atStart}
        >
          ‹ Prev
        </button>
        {playback.canAutoPlay ? (
          <button
            type="button"
            className="story-play"
            onClick={playback.toggle}
            aria-pressed={playback.playing}
          >
            {playback.playing ? "⏸ Pause" : "▶ Play the story"}
          </button>
        ) : null}
        <button
          type="button"
          className="story-next"
          onClick={playback.next}
          disabled={playback.atEnd}
        >
          Next ›
        </button>
        <input
          type="range"
          className="story-scrub"
          aria-label="Scrub the project history"
          min={0}
          max={count}
          value={revealedCount}
          onChange={(e) => {
            playback.pause();
            onScrub(Number(e.target.value));
          }}
        />
      </div>

      {playback.atEnd ? (
        <p className="story-nudge">
          {STORY_END_NUDGE}{" "}
          <button type="button" className="story-verify" onClick={onOpenVerify}>
            {STORY_VERIFY_CTA}
          </button>
        </p>
      ) : null}
    </section>
  );
}
