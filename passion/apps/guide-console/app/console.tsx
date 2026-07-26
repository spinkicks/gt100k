"use client";

// The guide console — one operator cockpit per child. A searchable child switcher (left), a clickable
// rail of the current child's specializations (middle), and a tabbed main pane (right): Overview (the
// charts-and-metrics summary), Hypotheses (the core interest read), Wellbeing (F2), and Plan (D1),
// each with a "needs your review" badge. Picking a specialization — from the rail or from the
// Overview table's Review button — jumps to the Hypotheses tab and highlights its card. Installs
// window.__qa (via useConsole) for the LOOP_QA usability gate; the contract is driven from the
// controller, so it stays live whichever tab is showing. Overview is the default landing view: guides
// are not technical, and the summary is what orients them before they act.
import Link from "next/link";
import { useEffect, useState, type JSX } from "react";
import { useConsole } from "./useConsole.js";
import { Brand, ChildSwitcher, EmptyState, Legend, SpecCard, SpecRail } from "./components.js";
import { WellbeingPanel } from "./wellbeing-panel.js";
import { PlanPanel } from "./plan-panel.js";
import { FamilyPanel } from "./family-panel.js";
import { AccessPanel } from "./access-panel.js";
import { OverviewPanel } from "./overview-panel.js";
import { familyOfferCount } from "./family.js";
import { accessNeedsReview, accessProposalCount } from "./access.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

type View = "overview" | "hypotheses" | "wellbeing" | "plan" | "family" | "access";

export function GuideConsole(): JSX.Element {
  const ctrl = useConsole();
  const [view, setView] = useState<View>("overview");

  // Switching child returns to the default summary so a tab never points at a stale kid's section.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ctrl.kid is the trigger, not a value read in the body — dropping it would run the reset once and never again.
  useEffect(() => {
    setView("overview");
  }, [ctrl.kid]);

  function pick(card: HypothesisCard, i: number): void {
    setView("hypotheses");
    ctrl.setSelectedId(card.id);
    if (typeof document !== "undefined") {
      requestAnimationFrame(() =>
        document.getElementById(`sc-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    }
  }

  // One number per tab (same treatment: how many items the section holds), plus a small review dot
  // when that lens has an escalation the guide should look at. Overview summarises every lens, so it
  // shows the child's tracked count and inherits the wellbeing review dot.
  const tabs: readonly { id: View; label: string; count: number; review?: boolean }[] = [
    {
      id: "overview",
      label: "Overview",
      count: ctrl.vm.cards.length,
      review: ctrl.wellbeing.some((c) => c.read.escalateToHuman),
    },
    { id: "hypotheses", label: "Hypotheses", count: ctrl.vm.cards.length },
    {
      id: "wellbeing",
      label: "Wellbeing",
      count: ctrl.wellbeing.length,
      review: ctrl.wellbeing.some((c) => c.read.escalateToHuman),
    },
    {
      id: "plan",
      label: "Plan",
      count: ctrl.plans.length,
      review: ctrl.plans.some((c) => c.plan.escalateToHuman),
    },
    {
      id: "family",
      label: "Family",
      count: familyOfferCount(ctrl.family),
      review: ctrl.family?.escalateToHuman ?? false,
    },
    {
      id: "access",
      label: "Access",
      count: accessProposalCount(ctrl.access),
      review: accessNeedsReview(ctrl.access),
    },
  ];

  return (
    <>
      <div className="app app--workbench">
        <aside className="sidebar">
          <Brand />
          <ChildSwitcher ctrl={ctrl} />
          <div className="sidebar__foot">
            <span className="chip chip--soft">Synthetic data only</span>
            {/* Every number on the Overview can be asked "why?" in place; this is the same material
              read end to end, which is also how a new guide gets oriented. */}
            <Link className="why-link" href="/evidence">
              Evidence base
            </Link>
          </div>
        </aside>

        <div className="railcol">
          <SpecRail ctrl={ctrl} onPick={pick} />
        </div>

        <main className="main main--wb" aria-label="Guide console">
          <header className="ghead">
            <nav className="tabs" role="tablist" aria-label="Console views">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={view === t.id}
                  className={`tab${view === t.id ? " tab--on" : ""}`}
                  onClick={() => setView(t.id)}
                >
                  <span>{t.label}</span>
                  {t.review ? (
                    <span
                      className="tab__dot"
                      aria-label="needs your review"
                      title="Needs your review"
                    />
                  ) : null}
                  <span className="tab__num">{t.count}</span>
                </button>
              ))}
            </nav>
          </header>

          {view === "overview" ? (
            <OverviewPanel
              ctrl={ctrl}
              onReview={pick}
              onOpenWellbeing={() => setView("wellbeing")}
            />
          ) : null}

          {view === "hypotheses" ? (
            ctrl.visible.length === 0 ? (
              <EmptyState ctrl={ctrl} />
            ) : (
              <div className="grid grid--wb" role="tabpanel">
                {ctrl.visible.map((card, i) => (
                  <SpecCard key={card.id} card={card} ctrl={ctrl} domId={`sc-${i}`} />
                ))}
              </div>
            )
          ) : null}

          {view === "wellbeing" ? <WellbeingPanel cards={ctrl.wellbeing} /> : null}
          {view === "plan" ? <PlanPanel cards={ctrl.plans} /> : null}
          {view === "family" ? (
            <FamilyPanel read={ctrl.family} observations={ctrl.familyObservations} />
          ) : null}
          {view === "access" ? <AccessPanel cards={ctrl.access} /> : null}

          <Legend />
        </main>
      </div>
    </>
  );
}
