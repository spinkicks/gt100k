/**
 * Provenance Observatory shell (calm-2D tier). Composes the header, the deterministic constellation,
 * the legend, and the accessible ledger from one shared `ExplorerView`. Presentation is fixed to the
 * calm tier this phase; the tier-selecting client stage + 3D cosmos arrive in U1 (UE023).
 */
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";
import { Constellation2D } from "./constellation/Constellation2D.js";
import { Ledger } from "./Ledger.js";
import { Legend } from "./Legend.js";

export function Observatory({ view }: { view: ExplorerView }): JSX.Element {
  const threadCount = view.edges.filter((e) => e.isNodeEdge).length;
  const milestoneCount = view.nodes.filter((n) => n.isInMilestone).length;

  return (
    <main className="observatory">
      <header className="obs-header">
        <div className="obs-title">
          <p className="obs-eyebrow">Provenance Observatory</p>
          <h1>
            Milestone <span className="mono obs-ref">{view.milestoneRef}</span>
          </h1>
          <p className="obs-sub">
            A content-addressed evidence DAG — {milestoneCount} nodes in the milestone,{" "}
            {view.nodes.length - milestoneCount} unlinked, {threadCount} provenance threads.
          </p>
        </div>
        <div className="obs-badges">
          <span className="badge badge--synthetic">Synthetic data</span>
          <span className="badge">Calm 2D · accessible tier</span>
        </div>
      </header>

      <div className="obs-grid">
        <div className="panel stage" aria-label="Provenance constellation">
          <Constellation2D view={view} />
        </div>
        <div className="obs-side">
          <Legend />
          <Ledger view={view} />
        </div>
      </div>
    </main>
  );
}
