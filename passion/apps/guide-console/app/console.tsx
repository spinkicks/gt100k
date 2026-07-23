"use client";

// The guide console. A searchable child switcher (left), a clickable rail of the current child's
// specializations (middle), and every specialty as a simple card in a grid (right) — picking a
// specialization jumps to and highlights its card. The Key sits at the bottom. Installs window.__qa
// (via useConsole) for the LOOP_QA usability gate.
import type { JSX } from "react";
import { useConsole } from "./useConsole.js";
import {
  Brand,
  ChildSwitcher,
  EmptyState,
  Legend,
  SpecCard,
  SpecRail,
} from "./components.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

export function GuideConsole(): JSX.Element {
  const ctrl = useConsole();

  function pick(card: HypothesisCard, i: number): void {
    ctrl.setSelectedId(card.id);
    if (typeof document !== "undefined") {
      document.getElementById(`sc-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div className="app app--workbench">
      <aside className="sidebar">
        <Brand />
        <ChildSwitcher ctrl={ctrl} />
        <div className="sidebar__foot">
          <span className="chip chip--soft">Synthetic data only</span>
        </div>
      </aside>

      <div className="railcol">
        <SpecRail ctrl={ctrl} onPick={pick} />
      </div>

      <main className="main main--wb" aria-labelledby="console-title">
        <header className="ghead">
          <h1 id="console-title">Interest hypotheses</h1>
        </header>

        {ctrl.visible.length === 0 ? (
          <EmptyState ctrl={ctrl} />
        ) : (
          <div className="grid grid--wb">
            {ctrl.visible.map((card, i) => (
              <SpecCard key={card.id} card={card} ctrl={ctrl} domId={`sc-${i}`} />
            ))}
          </div>
        )}

        <Legend />
      </main>
    </div>
  );
}
