/**
 * Provenance Observatory shell. Composes the header, the tier-selecting render stage (calm-2D SVG or
 * the 3D cosmos — equal modes), the legend, and the accessible ledger from one shared `ExplorerView`.
 * The stage is a client island; the shell itself is a server component that builds the view once.
 *
 * The accessible `LedgerView` (the parallel DOM + drill-down panels, §U5.12) is built server-side
 * here — pure, hasher-free — and handed to both the Stage (its `Inspector`) and the Ledger, so the
 * two never drift. A small client `SelectionProvider` wraps both so selecting a node in either place
 * (Ledger row, scrub beat, or a pointer-pick on a 3D body) opens the same Inspector.
 */
import { type ExplorerView, buildLedgerView } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";
import { Hud } from "./Hud.js";
import { NodesIcon, ThreadsIcon, UnlinkedIcon } from "./icons.js";
import { Ledger } from "./Ledger.js";
import { ObservatoryStage } from "./ObservatoryStage.js";
import { HudProvider } from "./hud-state.js";
import { SelectionProvider } from "./selection.js";
import type { SyntheticVerification } from "./synthetic-view.js";

export function Observatory({
  view,
  verification,
}: {
  view: ExplorerView;
  verification: SyntheticVerification;
}): JSX.Element {
  const threadCount = view.edges.filter((e) => e.isNodeEdge).length;
  const milestoneCount = view.nodes.filter((n) => n.isInMilestone).length;

  // The accessible Ledger view-model (nodes + beats + verify status), built once, server-side.
  const ledger = buildLedgerView(view, verification.verified);

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
        </div>
      </header>

      <SelectionProvider>
        <HudProvider view={view}>
          <div className="obs-grid">
            <div className="panel stage" aria-label="Provenance constellation">
              <ObservatoryStage view={view} verification={verification} ledger={ledger} />
            </div>
            <div className="obs-side">
              <Hud view={view} />
              <Ledger ledger={ledger} />
            </div>
          </div>
        </HudProvider>
      </SelectionProvider>
    </main>
  );
}
