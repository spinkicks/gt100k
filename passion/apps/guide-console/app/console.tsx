"use client";

// The guide console — one operator cockpit per child. A searchable child switcher (left), a clickable
// rail of the current child's specializations (middle), and a tabbed main pane (right): Hypotheses (the
// core interest read), Wellbeing (F2), and Plan (D1), each with a "needs your review" badge. Picking a
// specialization jumps to the Hypotheses tab and highlights its card. Installs window.__qa (via
// useConsole) for the LOOP_QA usability gate; the Hypotheses tab is the default so the primary action
// (promote the top candidate) is always on a visible card.
import { useEffect, useState, type JSX } from "react";
import { useConsole } from "./useConsole.js";
import {
  Brand,
  ChildSwitcher,
  EmptyState,
  Legend,
  SpecCard,
  SpecRail,
} from "./components.js";
import { WellbeingPanel } from "./wellbeing-panel.js";
import { PlanPanel } from "./plan-panel.js";
import { FamilyPanel } from "./family-panel.js";
import { familyOfferCount } from "./family.js";
import Galaxy from "./Galaxy.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";

type View = "hypotheses" | "wellbeing" | "plan" | "family";

export function GuideConsole(): JSX.Element {
  const ctrl = useConsole();
  const [view, setView] = useState<View>("hypotheses");
  const [reduceMotion, setReduceMotion] = useState(false);

  // Switching child returns to the core read so a tab never points at a stale kid's section.
  useEffect(() => {
    setView("hypotheses");
  }, [ctrl.kid]);

  // The galaxy animates via requestAnimationFrame (not CSS), so honor reduced-motion explicitly:
  // freeze it to a static starfield when the user asks for less motion.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = (): void => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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
  // when that lens has an escalation the guide should look at.
  const tabs: readonly { id: View; label: string; count: number; review?: boolean }[] = [
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
  ];

  return (
    <>
      {/* Calm, grayscale ambient starfield behind the console; decorative only, non-interactive,
          with a scrim (CSS) so text on the transparent surfaces stays legible. */}
      <div className="galaxy-bg" aria-hidden="true">
        <Galaxy
          saturation={0}
          hueShift={0}
          density={0.6}
          glowIntensity={0.14}
          starSpeed={0.2}
          speed={0.3}
          rotationSpeed={0.02}
          twinkleIntensity={0.2}
          mouseInteraction={false}
          mouseRepulsion={false}
          disableAnimation={reduceMotion}
          transparent
        />
      </div>

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
                  <span className="tab__dot" aria-label="needs your review" title="Needs your review" />
                ) : null}
                <span className="tab__num">{t.count}</span>
              </button>
            ))}
          </nav>
        </header>

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

        <Legend />
      </main>
      </div>
    </>
  );
}
