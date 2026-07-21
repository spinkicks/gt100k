"use client";

import type { RevisionHistoryView } from "@gt100k/interest-lab-view";
import { useState } from "react";
import { Glyph, STATE_GLYPHS } from "../ui/Glyph";

const titleCase = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());

export interface RevisionHistoryProps {
  view: RevisionHistoryView;
}

const revisionKey = (view: RevisionHistoryView, index: number) => {
  const revision = view.versions[index];
  if (!revision) throw new Error(`Missing revision at index ${index}`);
  return `${revision.version}:${revision.recordedAtDayOffset}:${index}`;
};

export function RevisionHistory({ view }: RevisionHistoryProps) {
  const currentIndex = view.versions.reduce(
    (selected, revision, index) =>
      revision.operative && revision.version === view.currentVersion ? index : selected,
    0,
  );
  const [selectedRevision, setSelectedRevision] = useState(() => revisionKey(view, currentIndex));

  return (
    <section className="guide-section revision-history" aria-labelledby="revision-history-title">
      <header className="guide-section-heading">
        <div>
          <p className="guide-section-name">Revision history</p>
          <h2 id="revision-history-title">An append-only record</h2>
        </div>
        <p>Later records add context; earlier evidence remains inspectable.</p>
      </header>

      <fieldset className="revision-scrubber">
        <legend>Inspect recorded revisions</legend>
        <ol className="revision-rail">
          {view.versions.map((revision, index) => {
            const current = revision.operative && revision.version === view.currentVersion;
            const key = revisionKey(view, index);
            const selected = key === selectedRevision;
            return (
              <li
                className={`revision-entry${current ? " revision-entry--current" : ""}${
                  selected ? " revision-entry--selected" : ""
                }`}
                key={key}
                data-current-revision={String(current)}
                data-revision-operative={String(revision.operative)}
                data-revision-version={revision.version}
              >
                <label>
                  <input
                    type="radio"
                    name="revision-history"
                    value={key}
                    checked={selected}
                    data-revision-selector="true"
                    onChange={() => setSelectedRevision(key)}
                  />
                  <span className="revision-mark" aria-hidden="true">
                    <Glyph
                      name={revision.operative ? STATE_GLYPHS.met : STATE_GLYPHS.contested}
                      size={18}
                    />
                  </span>
                  <span className="revision-title">
                    Version {revision.version} · {titleCase(revision.state)}
                  </span>
                </label>
                {selected ? (
                  <div className="revision-detail" aria-live="polite">
                    <p>
                      <time dateTime={`P${revision.recordedAtDayOffset}D`}>
                        Recorded day {revision.recordedAtDayOffset}
                      </time>{" "}
                      · valid from day {revision.validFromDayOffset}
                    </p>
                    <p>{revision.authored ? "Guide-authored record" : "Shadow suggestion"}</p>
                  </div>
                ) : null}
                {current ? <strong aria-label="Current operative revision">Current</strong> : null}
              </li>
            );
          })}
        </ol>
      </fieldset>
    </section>
  );
}
