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
import { useState, type JSX } from "react";
import type { MapStatus, MasteryMap } from "@gt100k/mastery-map";
import {
  editCapability,
  mapView,
  problemKey,
  withStatus,
  type MapVM,
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

function MapCard({
  vm,
  onStatus,
  onCapability,
}: {
  vm: MapVM;
  onStatus: (s: MapStatus) => void;
  onCapability: (milestoneId: string, value: string) => void;
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

export function MapsPanel({ maps }: { maps: readonly MasteryMap[] }): JSX.Element {
  // The maps themselves are held here, not their view models, because both of the things a guide
  // can do are changes to the MAP: a status is a decision about use, and an edit runs through the
  // engine's `applyEdit` so it cannot skip the record, the version bump or the invalidation. The
  // view model is derived on every render from whatever the map currently says.
  const [current, setCurrent] = useState<readonly MasteryMap[]>(maps);
  const shown = current.map((m) => mapView(m));

  const change = (id: string, f: (m: MasteryMap) => MasteryMap): void =>
    setCurrent((prev) => prev.map((m) => (m.id === id ? f(m) : m)));

  return (
    <section className="wbpanel" aria-label="Mastery maps" data-testid="maps-panel">
      <header className="wbpanel__head">
        <span className="wbpanel__sub">
          The validator checks the ordering. You decide whether a map is in use, and you can correct
          what the software wrote.
        </span>
      </header>

      {shown.length === 0 ? (
        <output className="wbpanel__empty">
          No mastery map has been written for a domain yet.
        </output>
      ) : (
        <ul className="wblist" data-testid="maps-list">
          {shown.map((vm) => (
            <MapCard
              key={vm.id}
              vm={vm}
              onStatus={(s) => change(vm.id, (m) => withStatus(m, s))}
              onCapability={(milestoneId, value) =>
                change(vm.id, (m) => editCapability(m, milestoneId, value))
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
