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
import { ChildSwitcher, EmptyState, Legend, SpecCard, SpecRail, SpecScope } from "./components.js";
import { WellbeingPanel } from "./wellbeing-panel.js";
import { PlanPanel } from "./plan-panel.js";
import { FamilyPanel } from "./family-panel.js";
import { AccessPanel } from "./access-panel.js";
import { OverviewPanel } from "./overview-panel.js";
import { MapsPanel } from "./maps-panel.js";
import { familyOfferCount } from "./family.js";
import { accessNeedsReview, accessProposalCount } from "./access.js";
import { mapsForReview } from "./maps.js";
import { REVIEW_MAPS } from "./maps-seed.js";
import { workForKid } from "./map-evidence.js";
import type { HypothesisCard } from "@gt100k/hypothesis-store";
import type { StudentProfile } from "@gt100k/student-profile";
import { setIngested } from "./console-data.js";
import { scopeToSpec } from "./console-state.js";

type View = "overview" | "hypotheses" | "wellbeing" | "plan" | "family" | "access" | "maps";

export interface GuideConsoleProps {
  /**
   * Children whose play has actually been ingested, read from the profile store by the server
   * component. Empty in every environment where nobody has posted anything, which is most of them.
   */
  readonly ingested?: readonly StudentProfile[];
}

export function GuideConsole({ ingested = [] }: GuideConsoleProps = {}): JSX.Element {
  // Before `useConsole`, deliberately. The controller reads the roster during its first render, so
  // handing it the real children afterwards would render one frame of a console that has forgotten
  // them, and on the server that frame is the HTML the client then has to match.
  setIngested(ingested);

  const ctrl = useConsole();
  const [view, setView] = useState<View>("overview");
  // Domain knowledge, not a read on a child, so it does not move when the child switcher does.
  const maps = mapsForReview();

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

  // The rail changes WHICH specialization the scoped tabs are showing, so it must not also change
  // which tab that is: a guide comparing two specializations' wellbeing reads would be thrown back
  // to Hypotheses on every switch. Overview's Review button still uses `pick`, because there the
  // ask really is "take me to this one", and Hypotheses is where you act on it.
  function selectSpec(card: HypothesisCard): void {
    ctrl.setSelectedId(card.id);
  }

  // Wellbeing (F2), Plan (D1) and Access (D3/D4) are all per-specialization lenses, and every one of
  // their view models is keyed by the hypothesis id it was derived from. Showing all of a child's
  // specializations at once made the tab a list to search rather than a read to act on, and left the
  // rail's selection doing nothing outside Hypotheses. Overview stays whole-child on purpose: it is
  // the summary a guide lands on to decide where to look.
  const spec = ctrl.selectedCard;
  const scopedTo = <T extends { readonly id: string }>(rows: readonly T[]): readonly T[] =>
    scopeToSpec(rows, spec?.id);

  // One number per tab (how many items the section holds), plus a small review dot when that lens
  // has an escalation the guide should look at. Overview summarises every lens, so it shows the
  // child's tracked count and inherits the wellbeing review dot.
  //
  // The two now answer different questions, deliberately. On a scoped tab the COUNT describes what
  // is about to be on the screen, so it counts the selected specialization only; a count that
  // disagrees with the rows under it is worse than no count. The REVIEW DOT still watches every
  // specialization, because it is the signal that this child needs a guide at all, and scoping it
  // would silently hide an escalation sitting one rail-click away. `SpecRail` carries the same dot
  // per specialization so the pair resolves to a place to click rather than a puzzle.
  // `noun` says what the number counts, because it is a different thing on every tab and the bare
  // figures invite a comparison that means nothing: "Family 5" beside "Wellbeing 1" reads as a
  // ranking of two quantities that share no unit.
  const tabs: readonly {
    id: View;
    label: string;
    count: number;
    noun: string;
    review?: boolean;
  }[] = [
    {
      id: "overview",
      label: "Overview",
      noun: "specializations",
      count: ctrl.vm.cards.length,
      review: ctrl.wellbeing.some((c) => c.read.escalateToHuman),
    },
    {
      id: "hypotheses",
      label: "Hypotheses",
      noun: "specializations",
      count: ctrl.vm.cards.length,
    },
    {
      id: "wellbeing",
      label: "Wellbeing",
      noun: "wellbeing reads for this specialization",
      count: scopedTo(ctrl.wellbeing).length,
      review: ctrl.wellbeing.some((c) => c.read.escalateToHuman),
    },
    {
      id: "plan",
      label: "Plan",
      noun: "plans for this specialization",
      count: scopedTo(ctrl.plans).length,
      review: ctrl.plans.some((c) => c.plan.escalateToHuman),
    },
    {
      id: "family",
      label: "Family",
      noun: "coaching offers",
      count: familyOfferCount(ctrl.family),
      review: ctrl.family?.escalateToHuman ?? false,
    },
    {
      id: "access",
      label: "Access",
      noun: "proposals for this specialization",
      count: accessProposalCount(scopedTo(ctrl.access)),
      review: accessNeedsReview(ctrl.access),
    },
    // How many maps exist, which is the same treatment every other tab gets. Deliberately not how
    // far through one anybody is: a map carries no progress and this console never derives one.
    {
      id: "maps",
      label: "Maps",
      noun: "maps",
      count: maps.length,
      // Only an ERROR needs a person. Warnings are surfaced inline and never block, and a dot that
      // lit up for every advisory note would stop meaning anything.
      review: maps.some((m) => !m.valid),
    },
  ];

  return (
    <>
      <div className="app app--workbench">
        {/* No Brand here any more: the shared ProductHeader above states the product and the
            surface, so a second wordmark right under it was the same claim twice. The sidebar's
            job is the roster. */}
        <aside className="sidebar">
          <ChildSwitcher ctrl={ctrl} />
          <div className="sidebar__foot">
            {/* Stops being true the moment a real session is ingested, and a false reassurance about
                data provenance is worse than none: it is the label someone checks before deciding
                what they may do with what is on screen. */}
            <span className="chip chip--soft">
              {ingested.length === 0
                ? "Synthetic data only"
                : `Synthetic, plus ${ingested.length} ingested`}
            </span>
            {/* Says where the decisions live, because the honest answer is "this browser" and a
                guide should not assume more than that. Absent until there is something to say, so
                a fresh console is not cluttered by a count of nothing. */}
            {ctrl.decisionCount === 0 ? null : (
              <p className="sidebar__saved">
                {ctrl.decisionCount} decision{ctrl.decisionCount === 1 ? "" : "s"} saved in this
                browser.{" "}
                <button type="button" className="linkbtn" onClick={ctrl.resetDecisions}>
                  Reset
                </button>
              </p>
            )}
            {/* Every number on the Overview can be asked "why?" in place; this is the same material
              read end to end, which is also how a new guide gets oriented. */}
            <Link className="why-link" href="/evidence">
              Evidence base
            </Link>
          </div>
        </aside>

        <div className="railcol">
          <SpecRail ctrl={ctrl} onPick={selectSpec} />
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
                  {/* The dot sits at the LEADING EDGE visually, via `order` in the stylesheet, while
                      staying after the label in the DOM. Between the label and the count it was a
                      6px amber circle in the exact position and shape of a middot separator, with
                      colour as its only carrier — the one thing the rest of this console refuses to
                      do. Moving it in the markup instead put its label in front of the tab's name,
                      so the tab announced as "needs your review Access" and stopped being findable
                      by its own name. */}
                  <span>{t.label}</span>
                  {t.review ? (
                    <span
                      className="tab__dot"
                      aria-label="needs your review"
                      title="Needs your review"
                    />
                  ) : null}
                  <span className="tab__num" title={`${t.count} ${t.noun}`}>
                    {t.count}
                  </span>
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

          {/* Names the specialization the tab is scoped to. Without it a scoped tab is ambiguous in
              the worst way: it looks like the whole child, so an empty Access tab reads as "no
              opportunities for this kid" when it means "none for this one specialization". */}
          {view === "wellbeing" || view === "plan" || view === "access" ? (
            <SpecScope card={spec} total={ctrl.vm.cards.length} />
          ) : null}

          {view === "wellbeing" ? <WellbeingPanel cards={scopedTo(ctrl.wellbeing)} /> : null}
          {view === "plan" ? <PlanPanel cards={scopedTo(ctrl.plans)} kidId={ctrl.kid} /> : null}
          {/* Not scoped, and cannot be: the family read (019/021) is derived per child, not per
              specialization, so there is no id here to filter on. Scoping it would mean inventing a
              per-specialization family signal that the engine does not produce. */}
          {view === "family" ? (
            <FamilyPanel read={ctrl.family} observations={ctrl.familyObservations} />
          ) : null}
          {view === "access" ? <AccessPanel cards={scopedTo(ctrl.access)} /> : null}
          {/* The maps themselves, not the view models: the panel owns the changes a guide can make,
              and each of them is a change to the map or to what a guide has said about this child.
              Keyed by child so the recorded overrides never carry across a switch.

              Not scoped to the selected specialization, unlike Wellbeing/Plan/Access. A map is
              domain knowledge and reviewing one is a job that does not depend on which child is
              loaded, and today almost no child's specializations have a map at all, so scoping
              would empty the tab. `specs` is passed for the coverage line, which says that out
              loud instead of letting the mismatch pass as a read on the child. */}
          {view === "maps" ? (
            <MapsPanel
              key={ctrl.kid}
              maps={REVIEW_MAPS}
              work={workForKid(ctrl.kid)}
              specs={ctrl.vm.cards}
              store={ctrl.store}
            />
          ) : null}

          <Legend />
        </main>
      </div>
    </>
  );
}
