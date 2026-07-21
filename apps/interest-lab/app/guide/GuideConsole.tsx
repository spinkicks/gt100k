"use client";

import type { InterestLabView } from "@gt100k/interest-lab-view";
import { CoverageMatrix } from "./CoverageMatrix";
import { EvidenceConstellation } from "./EvidenceConstellation";
import { Explanations } from "./Explanations";
import { Lifecycle } from "./Lifecycle";
import { ReturnTimeline } from "./ReturnTimeline";
import { RevisionHistory } from "./RevisionHistory";
import type { GuideAuthoringInput } from "./authoring";

export interface GuideConsoleProps {
  view: InterestLabView;
  onAuthorRevision?: (input: GuideAuthoringInput) => void;
}

export function GuideConsole({ view, onAuthorRevision }: GuideConsoleProps) {
  const reducedMotion = view.flags.reducedMotion;

  return (
    <section
      className="guide-console"
      data-guide-console="true"
      aria-labelledby="guide-console-title"
    >
      <header className="guide-console-intro">
        <div>
          <p className="surface-name">Guide surface</p>
          <h2 id="guide-console-title">Hypothesis Console</h2>
        </div>
        <p>
          Read the supporting case beside what could change it. Gaps, prompts, and shadow
          suggestions stay visible.
        </p>
      </header>

      <CoverageMatrix view={view.guide.coverage} reducedMotion={reducedMotion} />
      <Explanations view={view.guide.explanations} reducedMotion={reducedMotion} />
      <ReturnTimeline view={view.guide.timeline} reducedMotion={reducedMotion} />
      <div className="guide-record-layout">
        <Lifecycle
          view={view.guide.lifecycle}
          reducedMotion={reducedMotion}
          onAuthorRevision={onAuthorRevision}
        />
        <RevisionHistory
          key={`${view.guide.revisionHistory.currentVersion}:${view.guide.revisionHistory.versions.length}`}
          view={view.guide.revisionHistory}
        />
      </div>
      <EvidenceConstellation view={view} />
    </section>
  );
}
