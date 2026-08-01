"use client";
// Story Mode transport: advances the shared reveal counter on a timer, honoring reduced motion.
// Presentation-only — it only moves `revealedCount` via `onScrub`; it never touches the graph,
// view, or verification. The step arithmetic lives in ./story.js so it is unit-tested there.
import { useCallback, useEffect, useRef, useState } from "react";
import {
  STORY_STEP_MS,
  canAutoAdvance,
  isAtEnd,
  isAtStart,
  nextCount,
  prevCount,
} from "./story.js";

export interface StoryPlayback {
  readonly playing: boolean;
  readonly atStart: boolean;
  readonly atEnd: boolean;
  readonly canAutoPlay: boolean;
  readonly toggle: () => void;
  readonly next: () => void;
  readonly prev: () => void;
  readonly pause: () => void;
}

export function useStoryPlayback({
  count,
  revealedCount,
  onScrub,
  reducedMotion,
}: {
  count: number;
  revealedCount: number;
  onScrub: (n: number) => void;
  reducedMotion: boolean;
}): StoryPlayback {
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealedRef = useRef(revealedCount);
  revealedRef.current = revealedCount;

  const canAutoPlay = canAutoAdvance(reducedMotion);

  const pause = useCallback(() => {
    if (timer.current !== null) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setPlaying(false);
  }, []);

  // Advance one beat per STORY_STEP_MS while playing; the effect below stops at full reveal.
  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      onScrub(nextCount(revealedRef.current, count));
    }, STORY_STEP_MS);
    return () => {
      if (timer.current !== null) clearInterval(timer.current);
      timer.current = null;
    };
  }, [playing, count, onScrub]);

  useEffect(() => {
    if (playing && isAtEnd(revealedCount, count)) pause();
  }, [playing, revealedCount, count, pause]);

  // Reduced motion can turn on mid-play (tri-state HUD toggle) — stop auto-advance immediately.
  useEffect(() => {
    if (!canAutoPlay && playing) pause();
  }, [canAutoPlay, playing, pause]);

  const toggle = useCallback(() => {
    if (!canAutoPlay) return; // step-only under reduced motion
    if (playing) {
      pause();
      return;
    }
    if (isAtEnd(revealedRef.current, count)) onScrub(0); // replay from the start
    setPlaying(true);
  }, [canAutoPlay, playing, count, onScrub, pause]);

  const next = useCallback(() => {
    pause();
    onScrub(nextCount(revealedRef.current, count));
  }, [pause, onScrub, count]);

  const prev = useCallback(() => {
    pause();
    onScrub(prevCount(revealedRef.current));
  }, [pause, onScrub]);

  return {
    playing,
    atStart: isAtStart(revealedCount),
    atEnd: isAtEnd(revealedCount, count),
    canAutoPlay,
    toggle,
    next,
    prev,
    pause,
  };
}
