"use client";
// A git log-style commit list beside the constellation. Presentational: reads the view and calls
// back to jump to a beat. Real DOM text (never a canvas cue), so it stays accessible. The list is
// chronological but does not imply a single line — multi-input steps carry a merge cue; the graph
// edges remain the authoritative branch/merge structure.
import { useEffect, useRef } from "react";
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
import { STORY_CAPTIONS, isMerge, shortHash } from "./story.js";

export function CommitLog({
  view,
  revealedCount,
  onSelectBeat,
}: {
  view: ExplorerView;
  revealedCount: number;
  onSelectBeat: (nodeId: string) => void;
}): JSX.Element {
  const beats = view.growthTimeline.beats;
  const nodeById = new Map(view.nodes.map((n) => [n.id, n]));
  const currentRowRef = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: "nearest" });
  }, [revealedCount]);
  return (
    <ol className="commit-log" aria-label="Project history — every step, oldest first">
      {beats.map((beat, i) => {
        const node = nodeById.get(beat.nodeId);
        const revealed = i < revealedCount;
        const isCurrent = i === revealedCount - 1;
        const merge = isMerge(view, beat.nodeId);
        const message = STORY_CAPTIONS[beat.birthOrder] ?? node?.label ?? "";
        const className = ["commit-row", revealed ? "is-revealed" : "is-future", isCurrent ? "is-current" : "", merge ? "is-merge" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <li
            key={beat.nodeId}
            ref={isCurrent ? currentRowRef : undefined}
            className={className}
            aria-current={isCurrent ? "step" : undefined}
          >
            <button type="button" className="commit-jump" onClick={() => onSelectBeat(beat.nodeId)}>
              <code className="commit-hash">{shortHash(beat.nodeId)}</code>
              {merge ? (
                <span className="commit-merge" aria-hidden="true" title="draws on more than one earlier step">
                  ⑂
                </span>
              ) : null}
              <span className="commit-msg">{message}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
