"use client";
import { type ExplorerView, buildLedgerView } from "@gt100k/evidence-explorer-view";
/**
 * Provenance Observatory shell. Composes the header, the tier-selecting render stage (calm-2D SVG or
 * the 3D cosmos — equal modes), the legend, the accessible ledger, and the manual Add panel from one
 * shared working graph.
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
import { AddPanel } from "./AddPanel.js";
import { Hud } from "./Hud.js";
import { Ledger } from "./Ledger.js";
import { ObservatoryStage } from "./ObservatoryStage.js";
import { HudProvider } from "./hud-state.js";
import { NodesIcon, ThreadsIcon, UnlinkedIcon } from "./icons.js";
import { SelectionProvider } from "./selection.js";
import type { SyntheticSeed, SyntheticVerification } from "./synthetic-view.js";

export function Observatory({ seed }: { seed: SyntheticSeed }): JSX.Element {
  // The working graph + its re-derived views. Seeded from the server snapshot; grown by manual adds.
  const [graph, setGraph] = useState<EvidenceGraph>(seed.graph);
  const [view, setView] = useState<ExplorerView>(seed.view);
  const [verification, setVerification] = useState<SyntheticVerification>(seed.verification);

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
              <AddPanel
                graph={graph}
                nodes={view.nodes}
                projectRef={seed.projectRef}
                subjectDigest={seed.subjectDigest}
                onApply={(next) => {
                  setGraph(next.graph);
                  setView(next.view);
                  setVerification(next.verification);
                }}
              />
              <Ledger ledger={ledger} />
            </div>
          </div>
        </HudProvider>
      </SelectionProvider>
    </main>
  );
}
