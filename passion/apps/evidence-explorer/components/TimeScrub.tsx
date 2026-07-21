"use client";
/**
 * Time-scrub — grow the galaxy (§U5.4 / §U8.7, UE027). A build-history strip that renders the
 * milestone as ordered **beats** (plan → assist → source → attempt → … → outcome). Dragging the
 * scrubber grows the cosmos: bodies with `birthOrder < t` are present and ignite in order; threads
 * draw once both endpoints exist (the reveal logic lives in `scrub.ts`, shared by every tier).
 * Selecting a beat flies the camera to its body.
 *
 * The strip is also the **accessible twin** of the growth: a native range slider (keyboard-scrubbable,
 * with a spoken `aria-valuetext`) plus an ordered list of beat buttons with `aria-current` on the
 * current step and a polite live region announcing "Beat N of M". Reduced motion changes nothing
 * here — the slider and per-step reveal are non-vestibular; only the 3D ignite/fly are suppressed
 * downstream (`resolveMotion` returns 0ms). Play advances one beat every `scrubStep` (180ms).
 */
import {
  type ExplorerView,
  MOTION,
  type NodeView,
  type TimelineBeat,
} from "@gt100k/evidence-explorer-view";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { Glyph } from "./constellation/glyphs.js";

/** Human-readable phase name for a node type (the beat's "chapter"). */
const GROUP_LABEL: Record<string, string> = {
  Artifact: "Source",
  Attempt: "Attempt",
  Transformation: "Revision",
  Claim: "Claim",
  Assistance: "Assist",
  Review: "Review",
  Contribution: "Contribution",
  Outcome: "Outcome",
};

function groupLabel(group: string): string {
  return GROUP_LABEL[group] ?? group;
}

export function TimeScrub({
  view,
  revealedCount,
  onScrub,
  focusNodeId,
  onSelectBeat,
}: {
  view: ExplorerView;
  revealedCount: number;
  onScrub: (count: number) => void;
  focusNodeId: string | null;
  onSelectBeat: (nodeId: string) => void;
}): JSX.Element {
  const beats = view.growthTimeline.beats;
  const count = view.growthTimeline.count;
  const [playing, setPlaying] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nodeById = useMemo(
    () => new Map<string, NodeView>(view.nodes.map((n) => [n.id, n])),
    [view.nodes],
  );

  // The beat currently at the frontier of the reveal (1-based position = revealedCount).
  const currentBeat: TimelineBeat | null =
    revealedCount > 0 ? (beats[revealedCount - 1] ?? null) : null;
  const currentNode = currentBeat ? (nodeById.get(currentBeat.nodeId) ?? null) : null;

  // Keep the interval closure reading the latest position without re-arming each step.
  const revealedCountRef = useRef(revealedCount);
  revealedCountRef.current = revealedCount;

  const stopPlaying = useCallback(() => {
    if (playRef.current !== null) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    setPlaying(false);
  }, []);

  // Play: advance one beat per `scrubStep`, stopping at full reveal.
  useEffect(() => {
    if (!playing) return;
    playRef.current = setInterval(() => {
      onScrub(Math.min(revealedCountRef.current + 1, count));
    }, MOTION.scrubStep);
    return () => {
      if (playRef.current !== null) clearInterval(playRef.current);
      playRef.current = null;
    };
  }, [playing, count, onScrub]);

  useEffect(() => {
    if (playing && revealedCount >= count) stopPlaying();
  }, [playing, revealedCount, count, stopPlaying]);

  const togglePlay = useCallback(() => {
    if (playing) {
      stopPlaying();
      return;
    }
    // Replaying from the end restarts from an empty cosmos.
    if (revealedCount >= count) onScrub(0);
    setPlaying(true);
  }, [playing, revealedCount, count, onScrub, stopPlaying]);

  const handleSlider = useCallback(
    (value: number) => {
      stopPlaying();
      onScrub(value);
    },
    [onScrub, stopPlaying],
  );

  const valueText = currentNode
    ? `Beat ${revealedCount} of ${count}: ${groupLabel(currentBeat?.group ?? "")} — ${currentNode.label}`
    : `Beat 0 of ${count}: milestone not yet grown`;

  return (
    <section className="scrub" aria-label="Milestone build timeline">
      <div className="scrub-head">
        <h2 className="scrub-title">Build timeline</h2>
        <button
          type="button"
          className="scrub-play"
          onClick={togglePlay}
          aria-label={playing ? "Pause growth" : "Play growth"}
        >
          <span aria-hidden="true">{playing ? "❙❙" : "►"}</span>
          <span>{playing ? "Pause" : revealedCount >= count ? "Replay" : "Play"}</span>
        </button>
      </div>

      {/* The scrubber: keyboard-first, screen-reader announces the current beat. */}
      <input
        className="scrub-range"
        type="range"
        min={0}
        max={count}
        step={1}
        value={revealedCount}
        onChange={(e) => handleSlider(Number(e.target.value))}
        aria-label="Scrub milestone growth"
        aria-valuetext={valueText}
      />
      <p className="scrub-status" aria-live="polite">
        {valueText}
      </p>

      {/* The accessible ordered twin of the growth — the same beats, with the scrub position marked. */}
      <ol className="scrub-beats">
        {beats.map((beat, i) => {
          const node = nodeById.get(beat.nodeId);
          if (!node) return null;
          const revealed = i < revealedCount;
          const isCurrent = i === revealedCount - 1;
          const isFocused = focusNodeId === beat.nodeId;
          return (
            <li key={beat.nodeId}>
              <button
                type="button"
                className={`scrub-beat${revealed ? " is-revealed" : ""}${
                  isFocused ? " is-focused" : ""
                }`}
                aria-current={isCurrent ? "step" : undefined}
                aria-pressed={isFocused}
                onClick={() => {
                  stopPlaying();
                  onScrub(i + 1); // grow up to (and including) this beat…
                  onSelectBeat(beat.nodeId); // …then fly the camera to it.
                }}
              >
                <span className="scrub-beat-order" aria-hidden="true">
                  {i + 1}
                </span>
                <span
                  className="scrub-beat-icon"
                  style={{ color: `var(--${node.colorRole})` }}
                  aria-hidden="true"
                >
                  <svg viewBox="-14 -14 28 28" width="20" height="20" role="img">
                    <title>{`${groupLabel(beat.group)} glyph`}</title>
                    <Glyph glyph={node.glyph} r={9} />
                  </svg>
                </span>
                <span className="scrub-beat-text">
                  <span className="scrub-beat-group">{groupLabel(beat.group)}</span>
                  <span className="scrub-beat-label">{node.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
