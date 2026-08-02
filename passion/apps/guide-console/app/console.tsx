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
import { WellbeingStrip } from "./wellbeing-strip.js";
import { PlanPanel } from "./plan-panel.js";
import { FamilyPanel } from "./family-panel.js";
import { AccessPanel } from "./access-panel.js";
import { OverviewPanel } from "./overview-panel.js";
import { HypothesisBars, detailed } from "./hypothesis-bars.js";
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

/**
 * Three, down from seven.
 *
 * Seven tabs asked a guide to hold a seven-item checklist and to know which of the seven answered
 * the question in front of them. Four of the seven were not peers of the other three: Overview was a
 * summary OF the others, Wellbeing was a precondition FOR them, Access was half of Plan, and Maps
 * was domain work rather than work on a child. Each has moved to where it belongs — the child
 * header, the strip above the tabs, inside Plan, and a queue beside the child switcher — and what
 * remains is three questions a guide actually has: what might this child be into, what do we do
 * next, and what do we tell the family.
 */
type View = "hypotheses" | "plan" | "family";

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
  // Hypotheses, because the first question about a child is what they might be into. Overview used
  // to hold this slot and was a summary of tabs that no longer exist.
  const [view, setView] = useState<View>("hypotheses");
  const [mapsOpen, setMapsOpen] = useState(false);
  // Full cards for the top few, plus whichever the guide clicked, so a bar always opens something.
  const shown = ((): readonly HypothesisCard[] => {
    const top = detailed(ctrl.visible);
    const picked = ctrl.visible.find((c) => c.id === ctrl.selectedId);
    return picked === undefined || top.some((c) => c.id === picked.id) ? top : [picked, ...top];
  })();
  // Domain knowledge, not a read on a child, so it does not move when the child switcher does.
  const maps = mapsForReview();

  // Switching child returns to the default summary so a tab never points at a stale kid's section.
  // biome-ignore lint/correctness/useExhaustiveDependencies: ctrl.kid is the trigger, not a value read in the body — dropping it would run the reset once and never again.
  useEffect(() => {
    setView("hypotheses");
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
  }[] = [
    {
      id: "hypotheses",
      label: "Hypotheses",
      noun: "specializations",
      count: ctrl.vm.cards.length,
    },
    {
      id: "plan",
      // Named for what it now contains. Access folded in, and a tab called "Plan" that also brokers
      // mentors and audiences should say so rather than surprise the guide who opens it.
      label: "Plan and access",
      noun: "plans for this specialization",
      count: scopedTo(ctrl.plans).length,
    },
    {
      id: "family",
      label: "Family",
      noun: "coaching moves",
      count: (ctrl.family?.asks.length ?? 0) + (ctrl.family?.sharedActivities.length ?? 0),
    },
  ];

  // The review flag no longer rides a tab. It lives on the wellbeing strip, which is on screen
  // whatever the guide is looking at, so a flag can no longer be missed by not opening the tab that
  // carried it.

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

          {/* MAP REVIEW LIVES HERE, NOT IN A TAB. Reviewing a map is work on a DOMAIN: it does not
              depend on which child is loaded, it is not scoped to a specialization, and it is done
              once for everybody rather than per child. As a seventh tab beside six child tabs it
              read as a seventh thing to check for this child, which it never was.
              Beside the switcher it also gives on-demand generated drafts somewhere to be reviewed,
              which is the next thing this queue has to hold. */}
          <button
            type="button"
            className={`mapq${mapsOpen ? " mapq--on" : ""}`}
            onClick={() => setMapsOpen((v) => !v)}
            aria-expanded={mapsOpen}
          >
            <span className="mapq__label">Maps to review</span>
            <span className="mapq__num">{REVIEW_MAPS.length}</span>
          </button>
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
                  <span className="tab__num" title={`${t.count} ${t.noun}`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </nav>
          </header>

          {/* THE WELLBEING STRIP, above whichever tab is open rather than inside one of them.
              Wellbeing was a tab, which meant a guide could plan a child's next fortnight without
              ever seeing that the engine wanted them to back off. That is the wrong way round: the
              back-off read is a precondition for reading anything else, not a seventh thing to
              remember to check. It carries the read, the two moves and the review flag, and it is
              scoped to the selected specialization exactly as the tab was. */}
          <WellbeingStrip cards={scopedTo(ctrl.wellbeing)} />

          {view === "hypotheses" ? (
            ctrl.visible.length === 0 ? (
              <EmptyState ctrl={ctrl} />
            ) : (
              <div role="tabpanel">
                {/* Every tracked specialization as a bar, then full cards for the top few only. A
                    wall of equal cards made a guide read all of them to find out which mattered. */}
                <HypothesisBars
                  cards={ctrl.visible}
                  selectedId={ctrl.selectedId}
                  onPick={ctrl.setSelectedId}
                />

                <div className="grid grid--wb">
                  {shown.map((card, i) => (
                    <SpecCard key={card.id} card={card} ctrl={ctrl} domId={`sc-${i}`} />
                  ))}
                </div>
                {ctrl.visible.length > shown.length ? (
                  <p className="bars__rest">
                    {ctrl.visible.length - shown.length} more above, in the bars. Click one to open
                    it.
                  </p>
                ) : null}

                {/* WHAT SURVIVED OVERVIEW. Overview was a summary of the six tabs beside it, and
                    most of it duplicated them: its wellbeing block is now the strip, its hypothesis
                    block is the cards directly above. What it alone held was the EVIDENCE behind
                    the beliefs — voluntary against prompted returns, coverage of what was offered,
                    engagement over time — and that is not a summary of anything. It belongs under
                    the beliefs it supports, because the bars say what we think and these charts say
                    how much the data behind that is worth. */}
                <OverviewPanel ctrl={ctrl} onReview={pick} />
              </div>
            )
          ) : null}

          {/* Names the specialization the tab is scoped to. Without it a scoped tab is ambiguous in
              the worst way: it looks like the whole child, so an empty Access tab reads as "no
              opportunities for this kid" when it means "none for this one specialization". */}
          {view === "plan" ? <SpecScope card={spec} total={ctrl.vm.cards.length} /> : null}

          {/* Access renders INSIDE Plan, because it always was the other half of it. A plan says
              what a child should make next; access says who could mentor it and who could see it.
              They are scoped identically, they are read in the same breath, and splitting them
              across two tabs meant a guide could finish planning without ever being shown that a
              real audience was available for the thing they had just planned. */}
          {view === "plan" ? (
            <>
              <PlanPanel cards={scopedTo(ctrl.plans)} kidId={ctrl.kid} exploring={spec} />
              <AccessPanel cards={scopedTo(ctrl.access)} />
            </>
          ) : null}
          {/* Not scoped, and cannot be: the family read (019/021) is derived per child, not per
              specialization, so there is no id here to filter on. Scoping it would mean inventing a
              per-specialization family signal that the engine does not produce. */}
          {view === "family" ? (
            <FamilyPanel
              read={ctrl.family}
              observations={ctrl.familyObservations}
              kidId={ctrl.kid}
              decisions={ctrl.decisions}
              cards={ctrl.vm.cards}
            />
          ) : null}
          <Legend />
        </main>

        {/* The maps themselves, not the view models: the panel owns the changes a guide can make,
            and each of them is a change to the map or to what a guide has said about this child.
            Keyed by child so the recorded overrides never carry across a switch. `specs` is passed
            for the coverage line, which says out loud that almost no child's specializations have a
            map, instead of letting the mismatch pass as a read on the child. */}
        {mapsOpen ? (
          <aside className="mapdrawer" aria-label="Maps to review">
            <div className="mapdrawer__head">
              <span>Maps to review</span>
              <button type="button" className="linkbtn" onClick={() => setMapsOpen(false)}>
                Close
              </button>
            </div>
            <MapsPanel
              key={ctrl.kid}
              maps={REVIEW_MAPS}
              work={workForKid(ctrl.kid)}
              specs={ctrl.vm.cards}
              store={ctrl.store}
            />
          </aside>
        ) : null}
      </div>
    </>
  );
}
