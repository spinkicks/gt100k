"use client";
import { type ExplorerView, buildLedgerView } from "@gt100k/evidence-explorer-view";
/**
 * Provenance Observatory shell. Composes the header, the calm-2D render stage (the story's hero) and,
 * behind a collapsed Explore disclosure, the legend, the accessible ledger, and the manual Add panel —
 * all from one shared working graph.
 *
 * Phase 4 makes this the **stateful parent**: it is seeded from the server-built synthetic snapshot
 * (`SyntheticSeed` — a plain, serializable `{ graph, view, verification, projectRef, subjectDigest }`)
 * and holds the *working* graph/view/verification in React state. A manual add round-trips through the
 * server action (Node SHA-256 hasher — no client crypto) and lifts a fresh bundle back up here, so the
 * Observatory re-renders: the graph grows, the new body appears in the constellation + Ledger, and the
 * verify seal re-derives. The accessible `LedgerView` is rebuilt (pure, hasher-free) from the current
 * view so the two never drift.
 */
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { type JSX, useMemo, useState } from "react";
import { ExplorePanel } from "./ExplorePanel.js";
import { ObservatoryStage } from "./ObservatoryStage.js";
import { VerifyPanel } from "./VerifyPanel.js";
import { HudProvider } from "./hud-state.js";
import { NodesIcon, ThreadsIcon, UnlinkedIcon } from "./icons.js";
import { SelectionProvider } from "./selection.js";
import type { SyntheticSeed, SyntheticVerification } from "./synthetic-view.js";
import { IDLE_VISUAL, type VerifyVisualState } from "./verify-machine.js";

export function Observatory({ seed }: { seed: SyntheticSeed }): JSX.Element {
  // The working graph + its re-derived views. Seeded from the server snapshot; grown by manual adds.
  const [graph, setGraph] = useState<EvidenceGraph>(seed.graph);
  const [view, setView] = useState<ExplorerView>(seed.view);
  const [verification, setVerification] = useState<SyntheticVerification>(seed.verification);

  // Verify panel state (lifted from the stage, §Task 2): the header toggles the panel, and the
  // byte-fracture visual it produces is shared with the constellation via a prop, not local stage
  // state. The panel itself renders via `VerifyPanel`, a thin child that wraps `VerifyBox` — it has
  // to live *inside* `<HudProvider>` (below) to read `audioCaptions`, since this component renders
  // the provider and a provider can't consume its own context.
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyVisual, setVerifyVisual] = useState<VerifyVisualState>(IDLE_VISUAL);

  const threadCount = view.edges.filter((e) => e.isNodeEdge).length;
  const milestoneCount = view.nodes.filter((n) => n.isInMilestone).length;

  // The accessible Ledger view-model (nodes + beats + verify status), rebuilt from the current view
  // whenever a manual add lifts a fresh bundle up. Pure, hasher-free — safe on the client.
  const ledger = useMemo(() => buildLedgerView(view, verification.verified), [view, verification]);

  return (
    <main className="observatory">
      <header className="obs-header">
        <div className="obs-title">
          <p className="obs-eyebrow">Provenance Observatory</p>
          <h1>
            Milestone <span className="mono obs-ref">{view.milestoneRef}</span>
          </h1>
        </div>
        <div className="obs-readout" aria-label="Milestone summary">
          <div className="obs-stat">
            <span className="obs-stat-glyph" aria-hidden="true">
              <NodesIcon size={16} />
            </span>
            <span className="obs-stat-num mono">{milestoneCount}</span>
            <span className="obs-stat-label">nodes</span>
          </div>
          <div className="obs-stat">
            <span className="obs-stat-glyph" aria-hidden="true">
              <UnlinkedIcon size={16} />
            </span>
            <span className="obs-stat-num mono">{view.nodes.length - milestoneCount}</span>
            <span className="obs-stat-label">unlinked</span>
          </div>
          <div className="obs-stat">
            <span className="obs-stat-glyph" aria-hidden="true">
              <ThreadsIcon size={16} />
            </span>
            <span className="obs-stat-num mono">{threadCount}</span>
            <span className="obs-stat-label">threads</span>
          </div>
          <span className="obs-synthetic">
            <span className="obs-dot" aria-hidden="true" />
            Synthetic
          </span>
          <button
            type="button"
            className="obs-verify-btn"
            aria-expanded={verifyOpen}
            aria-controls="verify-panel"
            onClick={() => setVerifyOpen((o) => !o)}
          >
            {verification.verified.sealState === "verified" ? "Verify ✓" : "Verify"}
          </button>
        </div>
      </header>

      <SelectionProvider>
        <HudProvider view={view}>
          <div className="obs-grid">
            {verifyOpen ? (
              <div id="verify-panel" className="verify-panel">
                <VerifyPanel verification={verification} onVisualChange={setVerifyVisual} />
              </div>
            ) : null}
            <div className="panel stage" aria-label="Provenance constellation">
              <ObservatoryStage
                view={view}
                verification={verification}
                ledger={ledger}
                verifyVisual={verifyVisual}
              />
            </div>
            <ExplorePanel
              view={view}
              ledger={ledger}
              graph={graph}
              onApply={(next) => {
                setGraph(next.graph);
                setView(next.view);
                setVerification(next.verification);
              }}
            />
          </div>
        </HudProvider>
      </SelectionProvider>
    </main>
  );
}
