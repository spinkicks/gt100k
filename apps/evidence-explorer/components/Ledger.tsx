/**
 * Accessible provenance ledger — an ordered, screen-reader-first list of every node in provenance
 * depth order. Mirrors the constellation's state exactly (parity), so a keyboard/AT user reaches the
 * same evidence without the canvas. Full drill-down inspector arrives in a later phase (U4).
 */
import type { ExplorerView, NodeView } from "@gt100k/evidence-explorer-view";
import type { JSX } from "react";

function ordered(nodes: readonly NodeView[]): NodeView[] {
  return [...nodes].sort((a, b) => a.depthRank - b.depthRank || a.orderInRank - b.orderInRank);
}

export function Ledger({ view }: { view: ExplorerView }): JSX.Element {
  const nodes = ordered(view.nodes);
  return (
    <section className="panel ledger" aria-label="Provenance ledger">
      <h2 className="ledger-title">Ledger</h2>
      <ol className="ledger-list">
        {nodes.map((n) => (
          <li key={n.id} className="ledger-row">
            <span className="ledger-dot" style={{ background: `var(--${n.colorRole})` }} aria-hidden="true" />
            <div className="ledger-body">
              <div className="ledger-head">
                <span className="ledger-label">{n.label}</span>
                <span className="ledger-type">{n.type}</span>
              </div>
              <div className="ledger-meta">
                <span>{n.actor.kind} · {n.actor.label}</span>
                {n.tool ? <span className="mono">{n.tool.name}@{n.tool.version}</span> : null}
                {n.isInMilestone ? null : <span className="ledger-flag">unlinked note</span>}
                {n.isHumanOwned ? <span className="ledger-flag ledger-flag--human">human-owned</span> : null}
                {n.isCitedAssistance ? <span className="ledger-flag ledger-flag--model">cited AI assistance</span> : null}
              </div>
              <code className="ledger-hash">{n.id.slice(0, 16)}…</code>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
