"use client";

// The Maps tab (024 mastery maps, spec §6): what getting good at a domain involves, laid out for a
// guide to read and correct. Per milestone it shows the title, the capability in plain language, the
// ordering justification with its basis rendered in the open, the resources with their age tiers, the
// practice forms, the demonstration artefact and any real-world opportunity. Validator problems sit
// inline at the milestone they name; the ones about the map as a whole sit at the top of it.
//
// IT IS A REVIEW SURFACE, NOT A GATE, so there is deliberately no approve button here. The validator
// is the only gate a map has, and no guide can certify that an ordering of a domain is correct: a
// signature from someone with no basis for giving it is worse than no signature, because it looks
// like review. What a guide CAN decide is whether a map is in use, and whether a sentence is wrong
// for a nine-year-old, so those are the affordances the panel offers.
//
// NO PROGRESS ANYWHERE. Nothing here renders a milestone count, a fraction, a percentage or a bar
// over a map. The reasoning is in maps.ts; the test is `test/maps-panel.test.tsx`, which renders
// this component and reads the markup, because markup is where the ban can actually be checked.
//
// SLICE 2 ADDS A READ ON ONE CHILD, and it never shows a standing without the work under it. Butler
// (1988) is the reason: a bare verdict with no task anchoring behaves like a grade, and in 132
// children aged roughly 10 to 12 it depressed interest and later performance. So every row below
// carries the artefacts it was derived from, including when there are none.
import { useState, type JSX } from "react";
import type { MapStatus, MasteryMap } from "@gt100k/mastery-map";
import type { ChildWork } from "./map-evidence.js";
import {
  childReadView,
  editCapability,
  mapView,
  overrideFor,
  problemKey,
  recordOverride,
  withStatus,
  type ChildReadVM,
  type MapVM,
  type MilestoneReadVM,
  type MilestoneVM,
} from "./maps.js";
import { OrderingWhy } from "./ordering.js";

const OPPORTUNITY_TEXT: Record<string, string> = {
  competition: "Competition",
  showcase: "Showcase",
  community: "Community",
  mentorship: "Mentorship",
};

function Flag({
  kind,
  heading,
  message,
}: {
  kind: "error" | "warning";
  heading: string;
  message: string;
}): JSX.Element {
  return (
    <div className={`mapflag mapflag--${kind}`} role="note" data-testid={`map-${kind}`}>
      <span className="mapflag__k">{heading}</span>
      <p className="wbitem__reason">{message}</p>
    </div>
  );
}

function Milestone({
  ms,
  onCapability,
}: {
  ms: MilestoneVM;
  onCapability: (value: string) => void;
}): JSX.Element {
  return (
    <li className="mapms" data-testid="map-milestone" data-basis={ms.basis} data-id={ms.id}>
      <div className="mapms__top">
        <span className="mapms__title">{ms.title}</span>
        <span className="mapms__where">
          {ms.isTrunk ? "Trunk" : `Branch: ${ms.branchModes.join(", ")}`} · {ms.stage}
        </span>
      </div>

      <p className="mapms__cap">{ms.capability}</p>
      {ms.after.length > 0 ? (
        <p className="mapms__after">Comes after {ms.after.join(", ")}.</p>
      ) : (
        <p className="mapms__after">Nothing comes before this one.</p>
      )}

      <OrderingWhy ordering={ms.ordering} />

      <p className="mapms__demo">
        <span className="mapms__k">Shows it by</span> {ms.demonstration}
      </p>

      {ms.resources.length > 0 ? (
        <div className="mapms__block">
          <span className="mapms__k">Resources</span>
          <ul className="mapres">
            {ms.resources.map((r) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  {r.title}
                </a>
                {r.ageTiers.map((t) => (
                  <span key={t} className="chip chip--soft">
                    Ages {t}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ms.practice.length > 0 ? (
        <div className="mapms__block">
          <span className="mapms__k">What practice looks like</span>
          <ul className="mappractice">
            {ms.practice.map((p) => (
              <li key={p.title}>
                <span className="mappractice__t">{p.title}</span>
                {/* Solitary study is often the highest-yield mode and the least visible to an
                    adult, so which one it is gets said rather than left to be guessed. */}
                <span className="chip chip--soft">{p.solitary ? "Alone" : "With others"}</span>
                <p className="mappractice__d">{p.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ms.opportunities.length > 0 ? (
        <div className="mapms__block">
          <span className="mapms__k">Out in the world</span>
          <ul className="mapopps">
            {ms.opportunities.map((o) => (
              <li key={o.description}>
                <span className="chip chip--soft">{OPPORTUNITY_TEXT[o.kind] ?? o.kind}</span>
                {o.description}
                <p className="mapopps__ready">{o.readinessNote}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ms.errors.map((p) => (
        <Flag key={problemKey(p)} kind="error" heading="Blocks use" message={p.message} />
      ))}
      {ms.warnings.map((p) => (
        <Flag key={problemKey(p)} kind="warning" heading="Worth a look" message={p.message} />
      ))}

      {/* The one edit on offer, and it is the sentence a guide can actually judge: what the child
          can DO afterwards. Saving records both sides of the change, marks the milestone as
          human-edited and takes the map back to draft, because the validation it was carrying was
          earned by the sentence that has just been replaced. */}
      <form
        className="mapedit"
        onSubmit={(e) => {
          e.preventDefault();
          const next = new FormData(e.currentTarget).get("capability");
          if (typeof next === "string" && next.trim() !== "" && next !== ms.capability) {
            onCapability(next);
          }
        }}
      >
        <label className="mapms__k" htmlFor={`cap-${ms.id}`}>
          Correct what this says the child can do
        </label>
        <div className="mapedit__row">
          <input
            id={`cap-${ms.id}`}
            name="capability"
            className="mapedit__in"
            type="text"
            defaultValue={ms.capability}
          />
          <button type="submit" className="btn btn--sm btn--ghost">
            Save correction
          </button>
        </div>
      </form>
    </li>
  );
}

/**
 * One milestone read against one child. Three things sit on it and they are three different
 * claims, which is why none of them is a tick.
 *
 * The STANDING is how much was made, and it is never a verdict: one artefact cannot show a
 * capability, since what a child produces varies enormously from task to task, and a person
 * declaring it does not rescue the claim either. WHETHER TO OFFER IT is a separate question that
 * does have to come out yes or no, because the guide either puts the thing in front of the child
 * or does not. THE WORK is underneath both of them, always, so neither is ever read on its own.
 */
function Standing({
  read,
  onOverride,
}: {
  read: MilestoneReadVM;
  onOverride: (note: string) => void;
}): JSX.Element {
  return (
    <li
      className="mapread"
      data-testid="map-read"
      data-id={read.id}
      data-strength={read.strength}
      data-reachable={read.reachable}
    >
      <div className="mapms__top">
        <span className="mapms__title">{read.title}</span>
        <span className="mapms__where">
          {read.isTrunk ? "Trunk" : `Branch: ${read.branchModes.join(", ")}`} · {read.stage}
        </span>
      </div>
      <p className="mapms__cap">{read.capability}</p>

      <div className="mapread__row">
        <span className={`chip mapstrength mapstrength--${read.strength}`}>
          {read.strengthText}
        </span>
        <span className={`chip mapoffer mapoffer--${read.reachable ? "yes" : "no"}`}>
          {read.reachable ? "Could be offered next" : "Not on offer yet"}
        </span>
      </div>
      <p className="mapread__note">{read.strengthNote}</p>

      {/* The work, beside the standing, every time. An empty one says so in words rather than
          leaving a judgment sitting on the screen with nothing under it. */}
      <div className="mapms__block" data-testid="map-read-work">
        <span className="mapms__k">What they made</span>
        {read.evidence.length === 0 ? (
          <p className="mapread__nowork">Nothing has been linked to this milestone.</p>
        ) : (
          <ul className="mapwork">
            {read.evidence.map((e) => (
              <li key={e.projectId}>
                <span className="mapwork__proj">{e.project}</span>
                <ul className="mapwork__things">
                  {e.made.map((m) => (
                    <li key={m.title}>
                      <span className="chip chip--soft">{m.kind}</span>
                      {m.title}
                      <span className="mapwork__at">{m.at.slice(0, 10)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      {read.blockedBy.length > 0 ? (
        <div className="mapms__block" data-testid="map-read-blocked">
          <span className="mapms__k">What is in the way</span>
          <ul className="mapblock">
            {read.blockedBy.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {read.override === null ? null : (
        <div className="mapread__ov" data-testid="map-read-override">
          <span className="mapms__k">A guide said this should not hold the next thing up</span>
          <p className="mapread__ovnote">{read.override.note}</p>
          <p className="mapread__ovby">
            {read.override.by}, {read.override.at.slice(0, 10)}. It changes what can be offered and
            it puts no standing on this milestone: that comes from artefacts and from nothing else.
          </p>
        </div>
      )}

      {/* Offered only where nothing was made and nobody has already said this, because those are
          the only places it does anything: a milestone with an artefact behind it already lets the
          next one be offered, and a second override would overwrite a record somebody signed. */}
      {read.canOverride ? (
        <form
          className="mapedit"
          onSubmit={(e) => {
            e.preventDefault();
            const note = new FormData(e.currentTarget).get("note");
            if (typeof note === "string" && note.trim() !== "") onOverride(note.trim());
          }}
        >
          <label className="mapms__k" htmlFor={`ov-${read.id}`}>
            Say this should not hold the next thing up
          </label>
          <div className="mapedit__row">
            <input
              id={`ov-${read.id}`}
              name="note"
              className="mapedit__in"
              type="text"
              placeholder="Why. This is recorded against your name."
            />
            <button type="submit" className="btn btn--sm btn--ghost">
              Record override
            </button>
          </div>
        </form>
      ) : null}
    </li>
  );
}

function ChildStanding({
  vm,
  onOverride,
}: {
  vm: ChildReadVM;
  onOverride: (milestoneId: string, note: string) => void;
}): JSX.Element {
  return (
    <div className="mapchild" data-testid="map-child" data-kid={vm.kidId}>
      <span className="mapms__k">Where {vm.childName} would go next on this map</span>
      <p className="mapchild__note">{vm.stageNote}</p>
      {/* A map that is not in use, or not fit to be, is not one to read a child against. The map
          stays on the screen, because this is where a guide fixes it; the child does not, because
          a standing derived from a map nobody has put into use is a claim about them made on the
          strength of something we have not stood behind. */}
      {vm.standingRefusal !== null ? (
        <p className="mapchild__note" data-testid="map-standing-refusal">
          {vm.standingRefusal}
        </p>
      ) : (
        <>
          {/* Said once, at the top, because a guide who reads a standing as a pass has been misled
              by the screen and not by the data under it. */}
          <p className="mapchild__note">
            Every standing here is read off what {vm.childName} actually made. Nobody ticks
            anything, and none of it says they have a capability: a single artefact cannot carry
            that claim and neither can several. Whether to offer something next is a different
            question, and it is the only one below that comes out yes or no.
          </p>
          {/* Two different facts, never the same sentence. One rung can be out of reach because
              nobody can reach it yet, and another because of where the planner has this child. */}
          {vm.ceilingNote === null ? null : (
            <p className="mapchild__note" data-testid="map-ceiling">
              {vm.ceilingNote}
            </p>
          )}
          {vm.stageGateNote === null ? null : (
            <p className="mapchild__note" data-testid="map-stage-gate">
              {vm.stageGateNote}
            </p>
          )}
          <ol className="mapreadlist">
            {vm.reads.map((read) => (
              <Standing
                key={read.id}
                read={read}
                onOverride={(note) => onOverride(read.id, note)}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

function MapCard({
  vm,
  child,
  onStatus,
  onCapability,
  onOverride,
}: {
  vm: MapVM;
  child: ChildReadVM | null;
  onStatus: (s: MapStatus) => void;
  onCapability: (milestoneId: string, value: string) => void;
  onOverride: (milestoneId: string, note: string) => void;
}): JSX.Element {
  return (
    <li
      className={`wbitem mapcard${vm.withdrawn ? " mapcard--withdrawn" : ""}`}
      data-testid="map-card"
      data-status={vm.status}
    >
      <div className="wbitem__top">
        <span className="wbitem__spec">{vm.domain}</span>
        <span className={`wbitem__state mapstatus mapstatus--${vm.status}`}>{vm.statusText}</span>
      </div>
      <p className="mapcard__note">{vm.statusNote}</p>

      {vm.errors.map((p) => (
        <Flag key={problemKey(p)} kind="error" heading="Blocks use" message={p.message} />
      ))}
      {vm.warnings.map((p) => (
        <Flag key={problemKey(p)} kind="warning" heading="Worth a look" message={p.message} />
      ))}

      <dl className="plangrid">
        <div>
          <dt>Ways of working</dt>
          <dd>{vm.modes.join(", ")}</dd>
        </div>
        <div>
          <dt>Ages covered</dt>
          <dd>{vm.ageBands.join(", ")}</dd>
        </div>
        <div>
          <dt>Resources re-checked</dt>
          {/* Out of date is not the same as wrong, so it is said beside the date rather than
              treated as a fault with the map. It does hold up putting the map into use. */}
          <dd>
            {vm.revalidatedAt.slice(0, 10)}
            {vm.stale ? (
              <span className="chip chip--stale" data-testid="map-stale">
                Out of date
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Written by</dt>
          <dd>{vm.authoredBy}</dd>
        </div>
        <div>
          <dt>Looked at by</dt>
          {/* Optional by design. Nobody available to us can certify that an ordering of a domain is
              right, so a map is usable with this empty and the panel says so instead of nagging. */}
          <dd>{vm.reviewedBy ?? "Nobody, and it does not need anyone"}</dd>
        </div>
      </dl>

      {child === null ? null : <ChildStanding vm={child} onOverride={onOverride} />}

      {vm.edits.length > 0 ? (
        <div className="mapms__block" data-testid="map-edits">
          <span className="mapms__k">Corrections a guide made</span>
          <ul className="mapedits">
            {vm.edits.map((e) => (
              <li key={`${e.at}:${e.milestone}:${e.field}`}>
                <span className="mapedits__t">
                  {e.milestone}, {e.field}, by {e.by}
                </span>
                <p className="mapedits__was">Was: {e.before}</p>
                <p className="mapedits__now">Now: {e.after}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="wbitem__moves">
        {vm.inUse ? null : (
          <button
            type="button"
            className="btn btn--sm"
            disabled={!vm.publishable}
            onClick={() => onStatus("published")}
          >
            Put into use
          </button>
        )}
        {vm.withdrawn ? null : (
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => onStatus("withdrawn")}
          >
            Withdraw from use
          </button>
        )}
      </div>
      {/* A disabled button with no reason beside it is a dead end. Both refusals are things a guide
          can act on: fix what the validator found, or get the resources re-checked. */}
      {vm.publishRefusal === null ? null : (
        <p className="mapcard__refusal" data-testid="map-refusal">
          {vm.publishRefusal}
        </p>
      )}

      <ol className="mapmslist">
        {vm.milestones.map((ms) => (
          <Milestone key={ms.id} ms={ms} onCapability={(value) => onCapability(ms.id, value)} />
        ))}
      </ol>
    </li>
  );
}

export function MapsPanel({
  maps,
  work,
}: {
  maps: readonly MasteryMap[];
  /** The selected child and what they have made. Absent means the tab is showing the maps alone,
      which is a coherent thing to look at: a map is domain knowledge and holds nobody in it. */
  work?: ChildWork;
}): JSX.Element {
  // The maps themselves are held here, not their view models, because both of the things a guide
  // can do are changes to the MAP: a status is a decision about use, and an edit runs through the
  // engine's `applyEdit` so it cannot skip the record, the version bump or the invalidation. The
  // view model is derived on every render from whatever the map currently says.
  const [current, setCurrent] = useState<readonly MasteryMap[]>(maps);
  // And the child's record is held the same way, for the same reason: an override goes into it
  // through `recordOverride`, so it lands in the record beside the ones the child arrived with
  // rather than in a bag of session state alongside it. `recordOverride` is what refuses a second
  // override on one milestone and an id this map does not have.
  const [child, setChild] = useState<ChildWork | undefined>(work);
  const shown = current.map((m) => mapView(m));

  const change = (id: string, f: (m: MasteryMap) => MasteryMap): void =>
    setCurrent((prev) => prev.map((m) => (m.id === id ? f(m) : m)));

  const readOf = (map: MasteryMap): ChildReadVM | null =>
    child === undefined ? null : childReadView(map, child, child.overrides);

  return (
    <section className="wbpanel" aria-label="Mastery maps" data-testid="maps-panel">
      <header className="wbpanel__head">
        <span className="wbpanel__sub">
          The validator checks the ordering. You decide whether a map is in use, and you can correct
          what the software wrote. Where a child appears, it is read off the work they made.
        </span>
      </header>

      {shown.length === 0 ? (
        <output className="wbpanel__empty">
          No mastery map has been written for a domain yet.
        </output>
      ) : (
        <ul className="wblist" data-testid="maps-list">
          {shown.map((vm, i) => {
            const map = current[i]!;
            return (
              <MapCard
                key={vm.id}
                vm={vm}
                child={readOf(map)}
                onStatus={(s) => change(vm.id, (m) => withStatus(m, s))}
                onCapability={(milestoneId, value) =>
                  change(vm.id, (m) => editCapability(m, milestoneId, value))
                }
                onOverride={(milestoneId, note) =>
                  setChild((prev) =>
                    prev === undefined
                      ? prev
                      : // The instant the guide actually recorded it. This is the one clock in the
                        // panel and it is read in an event handler rather than in a render, so the
                        // screen stays reproducible while the record stays true: an override is a
                        // signed human record and stamping the pinned review clock on it would
                        // date every one a guide ever made to the same moment.
                        recordOverride(
                          map,
                          prev,
                          overrideFor(milestoneId, note, new Date().toISOString()),
                        ),
                  )
                }
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
