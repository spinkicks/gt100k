"use client";
import type { ExplorerView, LedgerView } from "@gt100k/evidence-explorer-view";
import type { EvidenceGraph } from "@gt100k/evidence-graph";
import { type JSX, useState } from "react";
import { AddPanel, type AppliedBundle } from "./AddPanel.js";
import { Hud } from "./Hud.js";
import { Ledger } from "./Ledger.js";

/**
 * The advanced-tools disclosure — collapsed by default so the default surface stays calm.
 * Holds the search/filter/display HUD, the manual Add panel, and the accessible Ledger (the
 * `role="tree"` source of truth). Presentation-only; owns no graph state.
 */
export function ExplorePanel({
  view,
  ledger,
  graph,
  onApply,
}: {
  view: ExplorerView;
  ledger: LedgerView;
  graph: EvidenceGraph;
  onApply: (next: AppliedBundle) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <section className={`explore${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="explore-toggle"
        aria-expanded={open}
        aria-controls="explore-body"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="explore-chevron" aria-hidden="true" />
        Explore
        <span className="explore-sub">search · filter · add · full record</span>
      </button>
      {open ? (
        <div id="explore-body" className="explore-body">
          <Hud view={view} />
          <AddPanel graph={graph} nodes={view.nodes} onApply={onApply} />
          <Ledger ledger={ledger} />
        </div>
      ) : null}
    </section>
  );
}
