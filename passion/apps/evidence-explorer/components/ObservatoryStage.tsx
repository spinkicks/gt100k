"use client";
/**
 * The stage (UE023) — owns the shared `ExplorerView` on the client and renders the deterministic,
 * accessible, WebGL-free **calm-2D** constellation (FR-E03). The 3D render path has been retired;
 * calm-2D is the only tier now.
 */
import type { ExplorerView, LedgerView } from "@gt100k/evidence-explorer-view";
import { AnimatePresence } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import type { JSX } from "react";
import { CommitLog } from "./CommitLog.js";
import { Inspector } from "./Inspector.js";
import { StoryTransport } from "./StoryTransport.js";
import { Constellation2D } from "./constellation/Constellation2D.js";
import { useHud } from "./hud-state.js";
import { type SelectionOrigin, panelById } from "./inspector-model.js";
import { effectiveFocusId, revealedNodeIds } from "./scrub.js";
import { useSelection } from "./selection.js";
import { frontierNodeId } from "./story.js";
import type { SyntheticVerification } from "./synthetic-view.js";
import { useStoryPlayback } from "./use-story-playback.js";
import type { VerifyVisualState } from "./verify-machine.js";

export function ObservatoryStage({
  view,
  verification,
  ledger,
  verifyVisual,
  onOpenVerify,
}: {
  view: ExplorerView;
  verification: SyntheticVerification;
  ledger: LedgerView;
  verifyVisual: VerifyVisualState;
  onOpenVerify: () => void;
}): JSX.Element {
  // Shared selection (UX4): the selected node drives the Inspector, the camera fly-to, and the beat
  // highlight — one concept, whether it came from the Ledger, a scrub beat, or a pointer-pick.
  const { selectedNodeId, origin, select, clear } = useSelection();

  // HUD presentation state (UX5, UE044–UE045) — filter/trace emphasis + the display toggles
  // (reduced-motion / plain / captions). All presentation-only; the `ExplorerView` never changes.
  const { emphasisFor, reducedMotion, plainMode } = useHud();

  // Time-scrub state (§U5.4) — presentation-only: it reveals a subset of the one `ExplorerView`,
  // never mutates it. Starts fully grown so the default view matches the calm baseline.
  const [revealedCount, setRevealedCount] = useState(() => view.growthTimeline.count);

  const revealed = useMemo(() => revealedNodeIds(view, revealedCount), [view, revealedCount]);
  // The effective selection: a node hidden by scrubbing back closes the Inspector + drops the fly-to.
  const effFocus = effectiveFocusId(selectedNodeId, revealed);

  // Select a body from an in-stage affordance (canvas pick / 2D click / input link): grow the reveal
  // so the picked node is present, then select it (carrying the screen origin when there is one).
  const selectNode = useCallback(
    (id: string, pickOrigin: SelectionOrigin | null = null) => {
      const node = view.nodes.find((n) => n.id === id);
      if (node) {
        if (node.birthOrder === null) setRevealedCount(view.growthTimeline.count);
        else if (node.birthOrder >= revealedCount) setRevealedCount(node.birthOrder + 1);
      }
      select(id, pickOrigin);
    },
    [view, revealedCount, select],
  );

  const playback = useStoryPlayback({
    count: view.growthTimeline.count,
    revealedCount,
    onScrub: setRevealedCount,
    reducedMotion,
  });

  // Clicking a commit row jumps the reveal to that beat and selects it (Inspector opens on purpose).
  const jumpToBeat = useCallback(
    (nodeId: string) => {
      playback.pause();
      const beat = view.growthTimeline.beats.find((b) => b.nodeId === nodeId);
      if (beat) setRevealedCount(beat.birthOrder + 1);
      select(nodeId);
    },
    [playback, view, select],
  );

  // During auto-play, highlight the newest node with the focus ring only — NOT select() —
  // so the Inspector does not pop open on every beat.
  const frontier = frontierNodeId(view, revealedCount);
  const storyFocus = playback.playing && frontier ? frontier : effFocus;

  const selectedNode = useMemo(
    () => (effFocus ? (view.nodes.find((n) => n.id === effFocus) ?? null) : null),
    [view.nodes, effFocus],
  );
  const selectedPanel = panelById(ledger, effFocus);
  const labelFor = useCallback(
    (id: string) => view.nodes.find((n) => n.id === id)?.label ?? id.slice(0, 12),
    [view.nodes],
  );

  // Verify-sequence visual state (§U8.8) — the light-wave / seal / byte-fracture the tiers render.
  // Presentation-only: it never mutates the `ExplorerView`. Lifted to `Observatory` (Task 2) so the
  // header Verify panel and this stage share one `verifyVisual` source.
  const waveOrder = verification.verified.verifyWaveOrder;

  return (
    <div className="obs-stage">
      <div className="obs-hero">
        <div className="obs-viewport">
          <Constellation2D
            view={view}
            revealed={revealed}
            focusNodeId={storyFocus}
            waveOrder={waveOrder}
            verify={verifyVisual}
            emphasisFor={emphasisFor}
            plainMode={plainMode}
            onSelect={selectNode}
          />

          {/* Drill-down inspector — opens over the viewport for the selected body (UX4). */}
          <AnimatePresence>
            {selectedNode && selectedPanel ? (
              <Inspector
                key={selectedNode.id}
                panel={selectedPanel}
                node={selectedNode}
                origin={origin}
                labelFor={labelFor}
                plainMode={plainMode}
                reducedMotion={reducedMotion}
                onSelectInput={selectNode}
                onClose={clear}
              />
            ) : null}
          </AnimatePresence>
        </div>

        <CommitLog view={view} revealedCount={revealedCount} onSelectBeat={jumpToBeat} />
      </div>

      <StoryTransport
        view={view}
        revealedCount={revealedCount}
        onScrub={setRevealedCount}
        onOpenVerify={onOpenVerify}
        playback={playback}
      />
    </div>
  );
}
