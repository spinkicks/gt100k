/**
 * Provenance Observatory shell. Composes the header, the tier-selecting render stage (calm-2D SVG or
 * the 3D cosmos — equal modes), the legend, and the accessible ledger from one shared `ExplorerView`.
 * The stage is a client island; the shell itself is a server component that builds the view once.
 */
import type { ExplorerView } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";
import { Ledger } from "./Ledger.js";
import { Legend } from "./Legend.js";
import { ObservatoryStage } from "./ObservatoryStage.js";
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
          <span className="badge">3D cosmos · calm-2D equal mode</span>
        </div>
      </header>

      <div className="obs-grid">
        <div className="panel stage" aria-label="Provenance constellation">
          <ObservatoryStage view={view} verification={verification} />
        </div>
        <div className="obs-side">
          <Legend />
          <Ledger view={view} />
        </div>
      </div>
    </main>
  );
}
