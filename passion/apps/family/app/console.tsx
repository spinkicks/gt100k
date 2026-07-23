"use client";

// The family co-engagement surface: a child switcher (left), a guide coaching console (middle) that
// renders the warm-demanding posture + door-opening offers + any "needs your review" escalation, and a
// family-facing preview (right) that shows ONLY the offers the guide has approved. Installs
// window.__qa (via useFamily) for the LOOP_QA usability gate.
import type { JSX } from "react";
import { useFamily } from "./useFamily.js";
import {
  Brand,
  ChildSwitcher,
  CoachingList,
  EscalationBanner,
  FamilyPreview,
  ObservationsCard,
  PostureCard,
  RationaleCard,
} from "./components.js";

export function FamilyConsole(): JSX.Element {
  const ctrl = useFamily();
  return (
    <div className="app">
      <aside className="sidebar">
        <Brand />
        <p className="sidebar__lead">
          {ctrl.escalations} of {ctrl.children.length} need your review
        </p>
        <ChildSwitcher ctrl={ctrl} />
        <div className="sidebar__foot">
          <span className="chip chip--soft">Synthetic data only</span>
        </div>
      </aside>

      <main className="main" aria-labelledby="console-title">
        <header className="ghead">
          <h1 id="console-title">
            Coaching {ctrl.activeChild ? ctrl.activeChild.name : ""}&rsquo;s environment
          </h1>
        </header>
        <EscalationBanner ctrl={ctrl} />
        <PostureCard ctrl={ctrl} />
        <ObservationsCard ctrl={ctrl} />
        <CoachingList ctrl={ctrl} />
        <RationaleCard ctrl={ctrl} />
      </main>

      <aside className="previewcol">
        <FamilyPreview ctrl={ctrl} />
      </aside>
    </div>
  );
}
